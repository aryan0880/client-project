import { useState, useEffect } from 'react';
import { Plus, Send, X, CheckSquare, Square } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { formatDate } from '../../utils/formatters';
import { surveyService } from '../../services/surveyService';
import { supplierService } from '../../services/supplierService';
import api from '../../services/api';
import type { Supplier, Survey } from '../../types';

export function SurveysPage() {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [activeSurvey, setActiveSurvey] = useState<Survey | null>(null);

  // Form states - Create Survey
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states - Assign Survey
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([]);
  const [isAssigning, setIsAssigning] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setIsLoading(true);
      const [surveysData, questionsData, suppliersData] = await Promise.all([
        surveyService.getAll(),
        api.get('/questions').then(r => r.data.data ?? []),
        supplierService.getAll(),
      ]);
      setSurveys(surveysData);
      setQuestions(questionsData);
      setSuppliers(suppliersData);
    } catch (err: any) {
      console.error('Failed to load surveys data:', err);
      setError('Failed to fetch surveys list.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreateSurvey(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || selectedQuestions.length === 0) {
      alert('Survey title and at least one question are required.');
      return;
    }

    try {
      setIsSubmitting(true);
      await surveyService.create({
        title,
        description,
        questions: selectedQuestions,
        status: 'active',
      });
      setIsCreateOpen(false);
      setTitle('');
      setDescription('');
      setSelectedQuestions([]);
      loadData();
    } catch (err) {
      console.error('Failed to create survey:', err);
      alert('Failed to save survey.');
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleToggleQuestion(id: string) {
    setSelectedQuestions(prev =>
      prev.includes(id) ? prev.filter(q => q !== id) : [...prev, id]
    );
  }

  function handleToggleSupplier(id: string) {
    setSelectedSuppliers(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  }

  async function handleAssignAndSend(e: React.FormEvent) {
    e.preventDefault();
    if (!activeSurvey || selectedSuppliers.length === 0) return;

    try {
      setIsAssigning(true);
      // 1. Assign to suppliers
      await surveyService.assign(activeSurvey._id, selectedSuppliers);
      // 2. Dispatch emails (and receive links)
      const res = await surveyService.sendEmails(activeSurvey._id);

      setIsAssignOpen(false);
      setSelectedSuppliers([]);
      setActiveSurvey(null);

      const firstLink = res.data?.links?.[0]?.link;
      if (firstLink) {
        if (confirm(`Survey assigned successfully!\n\nLink for supplier:\n${firstLink}\n\nClick OK to open the survey in a new tab now!`)) {
          window.open(firstLink, '_blank');
        }
      } else {
        alert('Survey assigned successfully!');
      }
      loadData();
    } catch (err) {
      console.error('Assignment/Email sending failed:', err);
      alert('Failed to assign or email survey.');
    } finally {
      setIsAssigning(false);
    }
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
          <h1 className="text-xl font-semibold text-neutral-900">Surveys</h1>
          <p className="text-sm text-neutral-500 mt-0.5">Create and manage supplier surveys</p>
        </div>
        <Button
          variant="primary"
          size="sm"
          leftIcon={<Plus className="h-3.5 w-3.5" />}
          onClick={() => setIsCreateOpen(true)}
        >
          Create Survey
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
          subtitle={`${surveys.length} survey(s) created`}
          className="px-5 pt-5 pb-0"
        />
        <table className="data-table mt-3">
          <thead>
            <tr>
              <th>Title</th>
              <th>Status</th>
              <th>Questions</th>
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
                    <span className="text-xs text-neutral-500 line-clamp-1 max-w-md">{s.description}</span>
                  </div>
                </td>
                <td>
                  <Badge variant={s.status === 'active' ? 'success' : 'default'}>
                    {s.status === 'active' ? 'Active' : 'Draft'}
                  </Badge>
                </td>
                <td className="text-neutral-600 font-medium">
                  {Array.isArray(s.questions) ? s.questions.length : 0} questions
                </td>
                <td className="hidden md:table-cell text-neutral-500">{formatDate(s.createdAt)}</td>
                <td>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openAssignModal(s)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-primary-50 text-primary-700 hover:bg-primary-100 rounded border border-primary-200 transition-colors"
                      title="Send survey"
                    >
                      <Send className="h-3 w-3" />
                      <span>Send Survey</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {surveys.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-8 text-neutral-400 text-sm">
                  No surveys built yet. Click Create Survey to build one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      {/* Create Survey Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/40 backdrop-blur-sm p-4">
          <form
            onSubmit={handleCreateSurvey}
            className="bg-white rounded-lg shadow-xl max-w-lg w-full border border-neutral-200 animate-scale-up overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="p-5 border-b border-neutral-100 flex items-center justify-between">
              <h2 className="text-base font-bold text-neutral-900">Create Assessment Survey</h2>
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
                label="Survey Title"
                placeholder="e.g. Supplier Performance Evaluation Q3"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />

              <Input
                label="Description"
                placeholder="Brief guidelines or evaluation context..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                  Select Questions ({selectedQuestions.length} chosen)
                </label>
                <div className="border border-neutral-200 rounded-md divide-y divide-neutral-100 max-h-[220px] overflow-y-auto bg-neutral-50 p-2 space-y-1">
                  {questions.map((q) => {
                    const isChecked = selectedQuestions.includes(q._id);
                    return (
                      <button
                        type="button"
                        key={q._id}
                        onClick={() => handleToggleQuestion(q._id)}
                        className={`w-full flex items-start gap-3 p-2.5 rounded text-left transition-colors ${
                          isChecked ? 'bg-primary-50/70 border border-primary-200' : 'bg-white hover:bg-neutral-100 border border-transparent'
                        }`}
                      >
                        {isChecked ? (
                          <CheckSquare className="h-4 w-4 text-primary-600 mt-0.5 flex-shrink-0" />
                        ) : (
                          <Square className="h-4 w-4 text-neutral-300 mt-0.5 flex-shrink-0" />
                        )}
                        <div className="flex-1">
                          <p className="text-sm text-neutral-800 font-medium leading-tight">{q.text}</p>
                          <p className="text-xs text-neutral-400 mt-0.5 font-mono">{q.type} — {q.points} pt</p>
                        </div>
                      </button>
                    );
                  })}
                  {questions.length === 0 && (
                    <p className="text-xs text-center text-neutral-400 py-6">
                      No questions found in repository. Please create questions first.
                    </p>
                  )}
                </div>
              </div>
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
                disabled={selectedQuestions.length === 0}
              >
                Create Survey
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Assign & Send Modal */}
      {isAssignOpen && activeSurvey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/40 backdrop-blur-sm p-4">
          <form
            onSubmit={handleAssignAndSend}
            className="bg-white rounded-lg shadow-xl max-w-md w-full border border-neutral-200 animate-scale-up overflow-hidden flex flex-col max-h-[85vh]"
          >
            <div className="p-5 border-b border-neutral-100 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-neutral-900">Send Survey Invitation</h2>
                <p className="text-xs text-neutral-500 mt-0.5">{activeSurvey.title}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsAssignOpen(false)}
                className="p-1.5 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50 rounded-full"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto flex-1 bg-neutral-50">
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                  Select Target Suppliers ({selectedSuppliers.length} selected)
                </label>
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
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-neutral-800">{s.name}</p>
                          <p className="text-xs text-neutral-400">{s.email}</p>
                        </div>
                      </button>
                    );
                  })}
                  {suppliers.length === 0 && (
                    <p className="text-xs text-center text-neutral-400 py-6">
                      No suppliers registered. Please add contacts first.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-neutral-100 flex justify-end gap-2 bg-white">
              <Button type="button" variant="secondary" size="sm" onClick={() => setIsAssignOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isAssigning}
                disabled={selectedSuppliers.length === 0}
              >
                Send Invitations
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
