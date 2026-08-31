import { useState, useEffect } from 'react';
import { Card, CardHeader } from '../../components/ui/Card';
import { FileSpreadsheet, ExternalLink, BarChart3, Layers } from 'lucide-react';
import { surveyService } from '../../services/surveyService';
import type { Survey } from '../../types';

export function ReportsPage() {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadSurveys() {
      try {
        setIsLoading(true);
        const data = await surveyService.getAll();
        setSurveys(data);
      } catch (err) {
        console.error('Failed to load surveys for reports:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadSurveys();
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <svg className="animate-spin h-8 w-8 text-primary-600" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto animate-fade-in">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">Survey Reports & Google Sheets</h1>
        <p className="text-sm text-neutral-500 mt-0.5">Quick access to live Google Sheets response spreadsheets and downloads</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="flex flex-col justify-between gap-4 border-l-4 border-l-primary-500">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-neutral-900">Live Form Analytics</h2>
              <p className="text-xs text-neutral-500">Real-time response charts</p>
            </div>
          </div>
          <p className="text-xs text-neutral-600 leading-relaxed">
            Google Forms automatically generates live bar charts and response breakdowns under the <strong>Responses</strong> tab of your Google Form.
          </p>
        </Card>

        <Card className="flex flex-col justify-between gap-4 border-l-4 border-l-emerald-500">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-neutral-900">Excel (.xlsx) Export</h2>
              <p className="text-xs text-neutral-500">One-click spreadsheet download</p>
            </div>
          </div>
          <p className="text-xs text-neutral-600 leading-relaxed">
            Open any linked Google Sheet below and select <strong>File → Download → Microsoft Excel (.xlsx)</strong> to export response records.
          </p>
        </Card>

        <Card className="flex flex-col justify-between gap-4 border-l-4 border-l-amber-500">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-neutral-900">Configured Surveys</h2>
              <p className="text-xs text-neutral-500">{surveys.length} total active survey(s)</p>
            </div>
          </div>
          <p className="text-xs text-neutral-600 leading-relaxed">
            All responses submitted by suppliers immediately sync into the associated Google Sheets below.
          </p>
        </Card>
      </div>

      {/* Reports Directory */}
      <Card padding="none">
        <CardHeader
          title="Active Survey Response Spreadsheets"
          subtitle="Click to view live responses or download as Excel"
          className="px-5 pt-5 pb-0"
        />
        <div className="overflow-x-auto">
          <table className="data-table mt-3">
            <thead>
              <tr>
                <th>Survey Name</th>
                <th>Google Form</th>
                <th>Google Sheets Live Report</th>
              </tr>
            </thead>
            <tbody>
              {surveys.map((s) => (
                <tr key={s._id}>
                  <td className="font-semibold text-neutral-900">{s.title}</td>
                  <td>
                    {s.googleFormUrl ? (
                      <a
                        href={s.googleFormUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-primary-600 hover:underline font-medium"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        View Form
                      </a>
                    ) : (
                      <span className="text-xs text-neutral-400">—</span>
                    )}
                  </td>
                  <td>
                    {s.googleSheetsUrl ? (
                      <a
                        href={s.googleSheetsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded border border-emerald-200 text-xs font-semibold transition-colors"
                      >
                        <FileSpreadsheet className="h-3.5 w-3.5" />
                        Open Live Response Sheet
                      </a>
                    ) : (
                      <span className="text-xs text-neutral-400">Google Sheet URL not linked</span>
                    )}
                  </td>
                </tr>
              ))}
              {surveys.length === 0 && (
                <tr>
                  <td colSpan={3} className="text-center py-8 text-neutral-400 text-sm">
                    No surveys added yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
