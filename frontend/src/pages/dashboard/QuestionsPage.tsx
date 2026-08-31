import { useState, useEffect } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import api from '../../services/api';

export function QuestionsPage() {
  const [questions, setQuestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [text, setText] = useState('');
  const [type, setType] = useState<'rating' | 'yesno' | 'text'>('rating');
  const [points, setPoints] = useState('1');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadQuestions();
  }, []);

  async function loadQuestions() {
    try {
      setIsLoading(true);
      const { data } = await api.get('/questions');
      setQuestions(data.data ?? []);
    } catch (err: any) {
      console.error('Failed to load questions:', err);
      setError('Failed to load question repository.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;

    try {
      setIsSubmitting(true);
      await api.post('/questions', {
        text,
        type,
        points: Number(points),
        order: questions.length + 1,
      });
      setIsModalOpen(false);
      setText('');
      setType('rating');
      setPoints('1');
      loadQuestions();
    } catch (err) {
      console.error('Failed to create question:', err);
      alert('Failed to save question.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this question?')) return;
    try {
      await api.delete(`/questions/${id}`);
      loadQuestions();
    } catch (err) {
      console.error('Failed to delete question:', err);
      alert('Failed to remove question.');
    }
  }

  function getTypeBadge(type: 'rating' | 'yesno' | 'text') {
    const maps = {
      rating: { label: '1-5 Rating', variant: 'info' as const },
      yesno: { label: 'Yes/No', variant: 'success' as const },
      text: { label: 'Free Text', variant: 'default' as const },
    };
    const mapped = maps[type];
    return <Badge variant={mapped.variant}>{mapped.label}</Badge>;
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
          <h1 className="text-xl font-semibold text-neutral-900">Questions</h1>
          <p className="text-sm text-neutral-500 mt-0.5">Manage assessment questions and scoring weights</p>
        </div>
        <Button
          variant="primary"
          size="sm"
          leftIcon={<Plus className="h-3.5 w-3.5" />}
          onClick={() => setIsModalOpen(true)}
        >
          Add Question
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-danger-50 border border-danger-200 text-danger-800 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg text-sm flex items-start gap-3">
        <span className="text-lg">📝</span>
        <div>
          <p className="font-semibold">Questions Managed in Google Forms</p>
          <p className="text-xs text-amber-800 mt-0.5">
            Since your surveys now use <strong>Google Forms</strong>, questions are added, edited, and scored directly inside Google Forms. 
            The list below contains legacy questions from previous custom surveys.
          </p>
        </div>
      </div>

      <Card padding="none">
        <CardHeader
          title="Question Repository"
          subtitle={`${questions.length} question(s) configured`}
          className="px-5 pt-5 pb-0"
        />
        <table className="data-table mt-3">
          <thead>
            <tr>
              <th className="w-12 text-center">Order</th>
              <th>Question Text</th>
              <th>Response Type</th>
              <th>Points Weight</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {questions.map((q, idx) => (
              <tr key={q._id}>
                <td className="text-center font-medium text-neutral-400">{q.order ?? idx + 1}</td>
                <td className="font-medium text-neutral-900">{q.text}</td>
                <td>{getTypeBadge(q.type)}</td>
                <td className="font-mono text-neutral-600 font-semibold">{q.points} pt</td>
                <td>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDelete(q._id)}
                      className="p-1.5 text-neutral-400 hover:text-danger-600 hover:bg-danger-50 rounded transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {questions.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-8 text-neutral-400 text-sm">
                  No questions created yet. Add questions to evaluate suppliers.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      {/* Add Question Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/40 backdrop-blur-sm p-4">
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-lg shadow-xl max-w-md w-full border border-neutral-200 animate-scale-up overflow-hidden"
          >
            <div className="p-5 border-b border-neutral-100 flex items-center justify-between">
              <h2 className="text-base font-bold text-neutral-900">Add Question</h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50 rounded-full"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <Input
                label="Question Text"
                placeholder="e.g. How would you rate the overall quality of supplied products?"
                required
                value={text}
                onChange={(e) => setText(e.target.value)}
              />

              <div>
                <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
                  Response Type
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full h-10 px-3 bg-white border border-neutral-200 rounded-md text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                >
                  <option value="rating">1 to 5 Scale Rating</option>
                  <option value="yesno">Yes / No Switch</option>
                  <option value="text">Text Comments Box</option>
                </select>
              </div>

              <Input
                label="Points Weight (Scoring Weight)"
                type="number"
                min="1"
                max="10"
                required
                value={points}
                onChange={(e) => setPoints(e.target.value)}
              />
            </div>

            <div className="p-4 border-t border-neutral-100 flex justify-end gap-2 bg-neutral-50">
              <Button type="button" variant="secondary" size="sm" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
                Save Question
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
