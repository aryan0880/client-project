import { useState, useEffect } from 'react';
import { Plus, Send, X, CheckSquare, Square, CheckCircle, AlertTriangle, ExternalLink, FileSpreadsheet, MailX, Trash2, Edit2 } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { formatDate } from '../../utils/formatters';
import { surveyService } from '../../services/surveyService';
import { supplierService } from '../../services/supplierService';
import type { Supplier, Survey } from '../../types';

export function SurveysPage() {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingSurvey, setEditingSurvey] = useState<Survey | null>(null);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [activeSurvey, setActiveSurvey] = useState<Survey | null>(null);

  // Form states - Create/Edit Survey
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [googleFormUrl, setGoogleFormUrl] = useState('');
  const [googleSheetsUrl, setGoogleSheetsUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states - Assign Survey
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([]);
  const [isAssigning, setIsAssigning] = useState(false);

  // Send result state
  type SendResult = {
    sent: number;
    total: number;
    failed: string[];
    emailConfigured: boolean;
    assignError?: string;
  };
  const [sendResult, setSendResult] = useState<SendResult | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setIsLoading(true);
      const [surveysData, suppliersData] = await Promise.all([
        surveyService.getAll(),
        supplierService.getAll(),
      ]);
      setSurveys(surveysData);
      setSuppliers(suppliersData);
    } catch (err: any) {
      console.error('Failed to load surveys data:', err);
      setError('Failed to fetch surveys list.');
    } finally {
      setIsLoading(false);
    }
  }

  function handleOpenCreate() {
    setEditingSurvey(null);
    setTitle('');
    setDescription('');
    setGoogleFormUrl('');
    setGoogleSheetsUrl('');
    setIsCreateOpen(true);
  }

  function handleOpenEdit(survey: Survey) {
    setEditingSurvey(survey);
    setTitle(survey.title);
    setDescription(survey.description || '');
    setGoogleFormUrl(survey.googleFormUrl);
    setGoogleSheetsUrl(survey.googleSheetsUrl || '');
    setIsCreateOpen(true);
  }

  async function handleDeleteSurvey(id: string) {
    if (!confirm('Are you sure you want to delete this survey?')) return;
    try {
      await surveyService.delete(id);
      loadData();
    } catch (err: any) {
      console.error('Failed to delete survey:', err);
      alert('Failed to delete survey.');
    }
  }

  async function handleSaveSurvey(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !googleFormUrl.trim()) {
      alert('Survey title and Google Form URL are required.');
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingSurvey) {
        await surveyService.update(editingSurvey._id, {
          title,
          description,
          googleFormUrl,
          googleSheetsUrl,
        });
      } else {
        await surveyService.create({
          title,
          description,
          googleFormUrl,
          googleSheetsUrl,
          status: 'active',
        });
      }
      setIsCreateOpen(false);
      setTitle('');
      setDescription('');
      setGoogleFormUrl('');
      setGoogleSheetsUrl('');
      setEditingSurvey(null);
      loadData();
    } catch (err: any) {
      console.error('Failed to save survey:', err);
      alert(err?.response?.data?.message || 'Failed to save survey.');
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleToggleSupplier(id: string) {
    setSelectedSuppliers(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  }

  function handleSelectAllSuppliers() {
    if (selectedSuppliers.length === suppliers.length) {
      setSelectedSuppliers([]);
    } else {
      setSelectedSuppliers(suppliers.map(s => s._id));
    }
  }

  async function handleAssignAndSend(e: React.FormEvent) {
    e.preventDefault();
    if (!activeSurvey || selectedSuppliers.length === 0) return;

    try {
      setIsAssigning(true);
      setSendResult(null);

      // Step 1: Assign survey to selected suppliers
      try {
        await surveyService.assign(activeSurvey._id, selectedSuppliers);
      } catch (assignErr: any) {
        const msg = assignErr?.response?.data?.message ?? 'Survey assignment failed. Please try again.';
        setSendResult({ sent: 0, total: 0, failed: [], emailConfigured: false, assignError: msg });
        return;
      }

      // Step 2: Send emails containing the Google Form URL
      const res = await surveyService.sendEmails(activeSurvey._id);
      const d = res.data ?? {};
      setSendResult({
        sent: d.sent ?? 0,
        total: d.total ?? selectedSuppliers.length,
        failed: d.failed ?? [],
        emailConfigured: d.emailConfigured ?? false,
      });

      loadData();
    } catch (err: any) {
      const serverMsg = err?.response?.data?.message;
      const msg = serverMsg || err?.message || 'An unexpected error occurred while sending emails.';
      setSendResult({ sent: 0, total: 0, failed: [], emailConfigured: false, assignError: msg });
    } finally {
      setIsAssigning(false);
    }
  }

  function handleCloseAssignModal() {
    setIsAssignOpen(false);
    setSelectedSuppliers([]);
    setActiveSurvey(null);
    setSendResult(null);
  }

  function openAssignModal(survey: Survey) {
    setActiveSurvey(survey);
    setIsAssignOpen(true);
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
          <h1 className="text-xl font-semibold text-neutral-900">Google Form Surveys</h1>
          <p className="text-sm text-neutral-500 mt-0.5">Manage Google Forms and send survey invitations to suppliers</p>
        </div>
        <Button
          variant="primary"
          size="sm"
          leftIcon={<Plus className="h-3.5 w-3.5" />}
          onClick={handleOpenCreate}
        >
          Add Survey
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-danger-50 border border-danger-200 text-danger-800 rounded-lg text-sm">
          {error}
        </div>
      )}

      <Card padding="none">
        <CardHeader
          title="All Surveys"
          subtitle={`${surveys.length} survey(s) configured`}
          className="px-5 pt-5 pb-0"
        />
        <div className="overflow-x-auto">
          <table className="data-table mt-3">
            <thead>
              <tr>
                <th>Survey Title</th>
                <th>Status</th>
                <th>Google Form Link</th>
                <th>Responses (Google Sheets)</th>
                <th className="hidden md:table-cell">Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {surveys.map((s) => (
                <tr key={s._id}>
                  <td>
                    <div>
                      <span className="font-semibold text-neutral-900 block">{s.title}</span>
                      {s.description && (
                        <span className="text-xs text-neutral-500 line-clamp-1 max-w-md">{s.description}</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <Badge variant={s.status === 'active' ? 'success' : 'default'}>
                      {s.status === 'active' ? 'Active' : 'Draft'}
                    </Badge>
                  </td>
                  <td>
                    <a
                      href={s.googleFormUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-primary-600 hover:text-primary-800 font-medium hover:underline"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Open Google Form
                    </a>
                  </td>
                  <td>
                    {s.googleSheetsUrl ? (
                      <a
                        href={s.googleSheetsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-emerald-600 hover:text-emerald-800 font-medium hover:underline"
                      >
                        <FileSpreadsheet className="h-3.5 w-3.5" />
                        Open Responses
                      </a>
                    ) : (
                      <span className="text-xs text-neutral-400">Not linked</span>
                    )}
                  </td>
                  <td className="hidden md:table-cell text-neutral-500">{formatDate(s.createdAt)}</td>
                  <td>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openAssignModal(s)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-primary-600 text-white hover:bg-primary-700 rounded transition-colors shadow-sm"
                        title="Send survey to suppliers"
                      >
                        <Send className="h-3 w-3" />
                        <span>Send Survey</span>
                      </button>
                      <button
                        onClick={() => handleOpenEdit(s)}
                        className="p-1.5 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"
                        title="Edit Survey"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteSurvey(s._id)}
                        className="p-1.5 text-neutral-400 hover:text-danger-600 hover:bg-danger-50 rounded transition-colors"
                        title="Delete Survey"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {surveys.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-neutral-400 text-sm">
                    No Google Form surveys added yet. Click Add Survey to add one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add / Edit Survey Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/40 backdrop-blur-sm p-4">
          <form
            onSubmit={handleSaveSurvey}
            className="bg-white rounded-lg shadow-xl max-w-lg w-full border border-neutral-200 animate-scale-up overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="p-5 border-b border-neutral-100 flex items-center justify-between">
              <h2 className="text-base font-bold text-neutral-900">
                {editingSurvey ? 'Edit Google Form Survey' : 'Add Google Form Survey'}
              </h2>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="p-1.5 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50 rounded-full"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              <Input
                label="Survey Name"
                placeholder="e.g. Supplier Performance Assessment"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />

              <Input
                label="Google Form URL"
                type="url"
                placeholder="https://docs.google.com/forms/d/e/.../viewform"
                required
                value={googleFormUrl}
                onChange={(e) => setGoogleFormUrl(e.target.value)}
              />

              <Input
                label="Google Sheets Response URL (Optional)"
                type="url"
                placeholder="https://docs.google.com/spreadsheets/d/..."
                value={googleSheetsUrl}
                onChange={(e) => setGoogleSheetsUrl(e.target.value)}
              />

              <Input
                label="Description (Optional)"
                placeholder="Brief summary or purpose of this assessment..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="p-4 border-t border-neutral-100 flex justify-end gap-2 bg-neutral-50">
              <Button type="button" variant="secondary" size="sm" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isSubmitting}
              >
                Save Survey
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Send Survey Modal */}
      {isAssignOpen && activeSurvey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/40 backdrop-blur-sm p-4">
          <form
            onSubmit={handleAssignAndSend}
            className="bg-white rounded-lg shadow-xl max-w-md w-full border border-neutral-200 animate-scale-up overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="p-5 border-b border-neutral-100 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-neutral-900">Send Survey Email</h2>
                <p className="text-xs text-neutral-500 mt-0.5">{activeSurvey.title}</p>
              </div>
              <button
                type="button"
                onClick={handleCloseAssignModal}
                className="p-1.5 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50 rounded-full"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Result status feedback */}
            {sendResult ? (
              <div className="p-5 space-y-4 overflow-y-auto flex-1">
                {sendResult.assignError ? (
                  <div className="flex items-start gap-3 p-3 bg-danger-50 border border-danger-200 rounded-lg">
                    <AlertTriangle className="h-4 w-4 text-danger-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-danger-800">Sending Failed</p>
                      <p className="text-xs text-danger-700 mt-0.5">{sendResult.assignError}</p>
                    </div>
                  </div>
                ) : (
                  <>
                    {sendResult.sent > 0 ? (
                      <div className="flex items-start gap-3 p-3 bg-success-50 border border-success-200 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-success-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold text-success-800">Survey Sent Successfully!</p>
                          <p className="text-xs text-success-700 mt-1">
                            Survey invitation sent successfully to {sendResult.sent} supplier{sendResult.sent > 1 ? 's' : ''}.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-3 p-3 bg-danger-50 border border-danger-200 rounded-lg">
                        <MailX className="h-5 w-5 text-danger-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold text-danger-800">Unable to send survey invitation</p>
                          <p className="text-xs text-danger-700 mt-1">
                            Failed to deliver emails to supplier(s). Please verify your SMTP / Resend configuration in backend environment variables.
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : (
              <div className="p-5 space-y-4 overflow-y-auto flex-1 bg-neutral-50">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                      Select Suppliers ({selectedSuppliers.length} selected)
                    </label>
                    {suppliers.length > 0 && (
                      <button
                        type="button"
                        onClick={handleSelectAllSuppliers}
                        className="text-xs font-medium text-primary-600 hover:text-primary-800"
                      >
                        {selectedSuppliers.length === suppliers.length ? 'Deselect All' : 'Select All'}
                      </button>
                    )}
                  </div>

                  <div className="border border-neutral-200 rounded-md divide-y divide-neutral-100 max-h-[280px] overflow-y-auto bg-white p-2 space-y-1">
                    {suppliers.map((s) => {
                      const isChecked = selectedSuppliers.includes(s._id);
                      return (
                        <button
                          type="button"
                          key={s._id}
                          onClick={() => handleToggleSupplier(s._id)}
                          className={`w-full flex items-center gap-3 p-2.5 rounded text-left transition-colors ${
                            isChecked ? 'bg-primary-50/70 border border-primary-200' : 'hover:bg-neutral-50 border border-transparent'
                          }`}
                        >
                          {isChecked ? (
                            <CheckSquare className="h-4 w-4 text-primary-600 flex-shrink-0" />
                          ) : (
                            <Square className="h-4 w-4 text-neutral-300 flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-neutral-800 truncate">{s.name}</p>
                            <p className="text-xs text-neutral-400 truncate">{s.email}</p>
                          </div>
                        </button>
                      );
                    })}
                    {suppliers.length === 0 && (
                      <p className="text-xs text-center text-neutral-400 py-6">
                        No suppliers registered. Please add contacts in the Suppliers tab first.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="p-4 border-t border-neutral-100 flex justify-end gap-2 bg-white">
              {sendResult ? (
                <Button type="button" variant="primary" size="sm" onClick={handleCloseAssignModal}>
                  Done
                </Button>
              ) : (
                <>
                  <Button type="button" variant="secondary" size="sm" onClick={handleCloseAssignModal}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    isLoading={isAssigning}
                    disabled={selectedSuppliers.length === 0}
                  >
                    {isAssigning ? 'Sending...' : 'Send Survey'}
                  </Button>
                </>
              )}
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
