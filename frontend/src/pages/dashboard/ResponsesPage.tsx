import { useState, useEffect } from 'react';
import { Eye, Download, X } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { formatDate } from '../../utils/formatters';
import { surveyService } from '../../services/surveyService';
import api from '../../services/api';

export function ResponsesPage() {
  const [responses, setResponses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedResponse, setSelectedResponse] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    async function loadResponses() {
      try {
        setIsLoading(true);
        const data = await surveyService.getResponses();
        setResponses(data);
      } catch (err: any) {
        console.error('Failed to load responses:', err);
        setError('Failed to fetch responses. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
    loadResponses();
  }, []);

  async function handleExportExcel(surveyId: string) {
    if (!surveyId) return;
    try {
      const token = localStorage.getItem('auth_token');
      // Construct a temporary link to download
      const downloadUrl = `${api.defaults.baseURL}/export/survey/${surveyId}?token=${token}`;
      
      // We can open the link in a new window or trigger download via iframe/window.location
      const link = document.createElement('a');
      link.href = downloadUrl;
      // Fetch with auth header or use query token (our middleware handles header. In Phase 2, we can just use window.open or Axios download)
      // Since window.open doesn't send headers, let's fetch the file using axios and download it:
      const response = await api.get(`/export/survey/${surveyId}`, {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      link.href = url;
      link.setAttribute('download', `survey_responses_${surveyId}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Export failed:', err);
      alert('Failed to export responses to Excel.');
    }
  }

  async function handleViewDetails(responseId: string) {
    try {
      const { data } = await api.get(`/responses/${responseId}`);
      setSelectedResponse(data.data);
      setIsModalOpen(true);
    } catch (err) {
      console.error('Failed to load response details:', err);
      alert('Failed to load response details.');
    }
  }

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">Survey Responses</h1>
          <p className="text-sm text-neutral-500 mt-0.5">View live supplier responses and Google Sheets spreadsheets</p>
        </div>
      </div>

      <div className="p-4 bg-primary-50 border border-primary-200 text-primary-900 rounded-lg text-sm flex items-start gap-3">
        <span className="text-lg">📊</span>
        <div>
          <p className="font-semibold">Google Forms & Sheets Integration</p>
          <p className="text-xs text-primary-700 mt-0.5">
            Since surveys are hosted on Google Forms, all new responses are saved live in **Google Sheets**.
            Click <strong>Open Google Sheets</strong> on any survey in the <strong>Surveys</strong> tab to view live responses or download as Excel (.xlsx).
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-danger-50 border border-danger-200 text-danger-800 rounded-lg text-sm">
          {error}
        </div>
      )}

      <Card padding="none">
        <CardHeader
          title="Past Custom Assessments (Legacy)"
          subtitle={`${responses.length} legacy response(s) stored in database`}
          className="px-5 pt-5 pb-0"
        />
        <div className="overflow-x-auto">
          <table className="data-table mt-3">
            <thead>
              <tr>
                <th>Supplier</th>
                <th>Survey Name</th>
                <th>Status</th>
                <th>Score</th>
                <th className="hidden md:table-cell">Submitted At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {responses.map((r) => (
                <tr key={r._id}>
                  <td>
                    <div>
                      <span className="font-semibold text-neutral-900 block">
                        {r.assignment?.supplier?.name ?? 'Deleted Supplier'}
                      </span>
                      <span className="text-xs text-neutral-500">
                        {r.assignment?.supplier?.email ?? '—'}
                      </span>
                    </div>
                  </td>
                  <td className="text-neutral-600">{r.assignment?.survey?.title ?? 'Deleted Survey'}</td>
                  <td>
                    <Badge variant="success">Submitted</Badge>
                  </td>
                  <td className="font-mono text-neutral-800 font-semibold">
                    {r.totalScore}/{r.maxPossibleScore} ({Math.round((r.totalScore / r.maxPossibleScore) * 100)}%)
                  </td>
                  <td className="hidden md:table-cell text-neutral-500">
                    {formatDate(r.createdAt)}
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleViewDetails(r._id)}
                        className="p-1.5 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"
                        title="View Details"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleExportExcel(r.assignment?.survey?._id)}
                        className="p-1.5 text-neutral-400 hover:text-success-600 hover:bg-success-50 rounded transition-colors"
                        title="Export Survey responses to Excel"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {responses.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-neutral-400 text-sm">
                    No legacy responses stored in database. All new responses are saved in Google Sheets.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Response Detail Modal */}
      {isModalOpen && selectedResponse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[85vh] flex flex-col overflow-hidden border border-neutral-200 animate-scale-up">
            <div className="p-5 border-b border-neutral-100 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-neutral-900">Assessment Answers</h2>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Submitted by {selectedResponse.assignment?.supplier?.name}
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50 rounded-full"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto flex-1 bg-neutral-50">
              <div className="bg-white p-4 rounded-lg border border-neutral-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Overall Performance</p>
                  <p className="text-lg font-bold text-neutral-900 mt-0.5">
                    {selectedResponse.totalScore} / {selectedResponse.maxPossibleScore} Points
                  </p>
                </div>
                <Badge variant={selectedResponse.totalScore >= selectedResponse.maxPossibleScore * 0.8 ? 'success' : 'warning'}>
                  {Math.round((selectedResponse.totalScore / selectedResponse.maxPossibleScore) * 100)}% Match
                </Badge>
              </div>

              <div className="space-y-3">
                {selectedResponse.assignment?.survey?.questions.map((q: any, i: number) => {
                  const answerObj = selectedResponse.answers.find((a: any) => a.question.toString() === q._id.toString());
                  return (
                    <div key={q._id} className="bg-white p-4 rounded-lg border border-neutral-100 space-y-2">
                      <p className="text-sm font-semibold text-neutral-800">
                        {i + 1}. {q.text}
                      </p>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-neutral-400">Answer:</span>
                        <Badge variant={answerObj?.value === 'Yes' || answerObj?.value === '5' ? 'success' : 'default'}>
                          {answerObj?.value ?? '—'}
                        </Badge>
                        <span className="text-xs text-neutral-400 ml-auto">{q.points} pt max</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-4 border-t border-neutral-100 flex justify-end">
              <Button variant="secondary" size="sm" onClick={() => setIsModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
