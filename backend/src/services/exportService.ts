import ExcelJS from 'exceljs';
import { SurveyAssignment } from '../models/SurveyAssignment';
import { Response as SurveyResponse } from '../models/Response';
import { Survey } from '../models/Survey';

/**
 * Generates a professional Excel workbook for a survey's responses.
 * Returns a Buffer that can be streamed to the client.
 */
export async function generateSurveyExcel(surveyId: string): Promise<Buffer> {
  // Fetch survey with questions
  const survey = await Survey.findById(surveyId).populate('questions');
  if (!survey) throw new Error('Survey not found');

  const questions = survey.questions as any[];

  // Fetch all submitted assignments for this survey
  const assignments = await SurveyAssignment.find({
    survey: surveyId,
    status: 'submitted',
  }).populate('supplier', 'name email');

  // Fetch all responses for these assignments
  const assignmentIds = assignments.map((a) => a._id);
  const responses = await SurveyResponse.find({
    assignment: { $in: assignmentIds },
  });

  // Build a lookup map: assignmentId → response
  const responseMap = new Map(
    responses.map((r) => [r.assignment.toString(), r])
  );

  // Build workbook
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'SupplierAssess';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Responses', {
    pageSetup: { fitToPage: true, orientation: 'landscape' },
  });

  // ─── Define columns ───────────────────────────────────────────────────────
  const baseColumns: Partial<ExcelJS.Column>[] = [
    { header: 'Supplier Name', key: 'supplierName', width: 28 },
    { header: 'Supplier Email', key: 'supplierEmail', width: 30 },
    { header: 'Status', key: 'status', width: 12 },
    { header: 'Submitted At', key: 'submittedAt', width: 20 },
    { header: 'Total Score', key: 'totalScore', width: 13 },
    { header: 'Max Score', key: 'maxScore', width: 11 },
    { header: '% Score', key: 'pctScore', width: 11 },
    ...questions.map((q, i) => ({
      header: `Q${i + 1}: ${q.text.substring(0, 40)}${q.text.length > 40 ? '…' : ''}`,
      key: `q_${q._id}`,
      width: 22,
    })),
  ];
  sheet.columns = baseColumns as any;

  // ─── Style header row ────────────────────────────────────────────────────
  const headerRow = sheet.getRow(1);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F63D2' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = {
      bottom: { style: 'thin', color: { argb: 'FF3B4FC4' } },
    };
  });
  headerRow.height = 36;

  // ─── Populate data rows ───────────────────────────────────────────────────
  for (const assignment of assignments) {
    const supplier = assignment.supplier as any;
    const response = responseMap.get(assignment._id.toString());

    const rowData: Record<string, any> = {
      supplierName: supplier?.name ?? '—',
      supplierEmail: supplier?.email ?? '—',
      status: assignment.status === 'submitted' ? 'Submitted' : 'Pending',
      submittedAt: assignment.submittedAt
        ? new Date(assignment.submittedAt).toLocaleString('en-GB')
        : '—',
      totalScore: response?.totalScore ?? '—',
      maxScore: response?.maxPossibleScore ?? '—',
      pctScore: response?.totalScore != null && response?.maxPossibleScore
        ? `${Math.round((response.totalScore / response.maxPossibleScore) * 100)}%`
        : '—',
    };

    // Add answer for each question
    for (const q of questions) {
      const answer = response?.answers.find(
        (a) => a.question.toString() === q._id.toString()
      );
      rowData[`q_${q._id}`] = answer?.value ?? '—';
    }

    const row = sheet.addRow(rowData);
    row.eachCell((cell) => {
      cell.alignment = { vertical: 'middle', horizontal: 'left' };
    });
  }

  // ─── Auto-filter ─────────────────────────────────────────────────────────
  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: sheet.columnCount },
  };

  // ─── Freeze header ────────────────────────────────────────────────────────
  sheet.views = [{ state: 'frozen', ySplit: 1 }];

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
