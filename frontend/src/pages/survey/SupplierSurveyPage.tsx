import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ClipboardList, CheckCircle, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { surveyService } from '../../services/surveyService';

export function SupplierSurveyPage() {
  const { token } = useParams<{ token: string }>();

  const [surveyInfo, setSurveyInfo] = useState<any | null>(null);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (token) {
      loadSurvey(token);
    }
  }, [token]);

  async function loadSurvey(surveyToken: string) {
    try {
      setIsLoading(true);
      const data = await surveyService.getByToken(surveyToken);
      if (data.alreadySubmitted) {
        setAlreadySubmitted(true);
        setSurveyInfo(data.assignment);
      } else {
        setSurveyInfo(data.assignment);
      }
    } catch (err: any) {
      console.error('Failed to load survey token:', err);
      setError(
        err.response?.data?.message ||
        'The survey link is invalid, expired, or has been revoked.'
      );
    } finally {
      setIsLoading(false);
    }
  }

  function handleSelectAnswer(questionId: string, value: string) {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  }

  function getUnansweredCount() {
    if (!surveyInfo?.survey?.questions) return 0;
    return surveyInfo.survey.questions.filter((q: any) => !answers[q._id]).length;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (getUnansweredCount() > 0 || !token) return;

    try {
      setIsSubmitting(true);
      // Map answers to the format expected by the API [{ question: string, value: string }]
      const formattedAnswers = Object.entries(answers).map(([questionId, val]) => ({
        question: questionId,
        value: val,
      }));

      await surveyService.submitResponse(token, formattedAnswers);
      setSubmitted(true);
    } catch (err: any) {
      console.error('Failed to submit response:', err);
      alert(err.response?.data?.message || 'Failed to submit response. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-8 w-8 text-primary-600" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          <p className="text-sm text-neutral-500 font-medium">Loading survey details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center space-y-4">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-danger-50 text-danger-600">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-neutral-900">Link Invalid</h1>
            <p className="text-neutral-500 mt-1 text-sm leading-relaxed">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (alreadySubmitted || submitted) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center space-y-6 animate-fade-in">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-success-50 text-success-600">
            <CheckCircle className="h-10 w-10" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Assessment Complete</h1>
            <p className="text-neutral-500 mt-2 text-sm leading-relaxed">
              Thank you! Your survey answers have been successfully recorded.
            </p>
          </div>
          <Card className="text-left space-y-3 bg-white border border-neutral-200">
            <div className="flex items-center gap-2 text-xs font-semibold text-neutral-400 uppercase tracking-wider">
              <ShieldCheck className="h-4 w-4 text-success-500" />
              <span>Verification secure</span>
            </div>
            <p className="text-xs text-neutral-500 leading-relaxed">
              This assessment was securely completed and verified for{' '}
              <strong className="text-neutral-700">{surveyInfo?.supplier?.name}</strong>. You may close this window.
            </p>
          </Card>
        </div>
      </div>
    );
  }

  const questions = surveyInfo?.survey?.questions ?? [];

  return (
    <div className="min-h-screen bg-neutral-50 py-10 px-4 md:px-6">
      <div className="max-w-md mx-auto space-y-6 animate-fade-in">
        {/* Header Branding */}
        <div className="flex items-center gap-2 justify-center mb-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600">
            <ClipboardList className="h-4 w-4 text-white" />
          </div>
          <span className="font-semibold text-neutral-900 tracking-tight">SupplierAssess</span>
        </div>

        {/* Survey Info Card */}
        <Card className="space-y-4">
          <div>
            <p className="text-xs font-semibold text-primary-600 uppercase tracking-wider">Supplier Assessment</p>
            <h1 className="text-xl font-bold text-neutral-900 mt-1">{surveyInfo?.survey?.title}</h1>
          </div>
          <div className="border-t border-neutral-100 pt-3">
            <p className="text-xs text-neutral-400">Target Supplier Contact</p>
            <p className="text-sm font-semibold text-neutral-800 mt-0.5">{surveyInfo?.supplier?.name}</p>
          </div>
          {surveyInfo?.survey?.description && (
            <p className="text-sm text-neutral-500 leading-relaxed pt-2">
              {surveyInfo.survey.description}
            </p>
          )}
        </Card>

        {/* Form questions */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {questions.map((q: any, index: number) => {
            return (
              <Card key={q._id} className="space-y-4">
                <div className="flex items-start gap-3">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-neutral-100 text-xs font-bold text-neutral-500 mt-0.5">
                    {index + 1}
                  </span>
                  <p className="text-sm font-medium text-neutral-900 leading-relaxed flex-1">
                    {q.text}
                  </p>
                </div>

                <div className="pl-8">
                  {/* Rating Selector */}
                  {q.type === 'rating' && (
                    <div className="flex items-center justify-between gap-1 max-w-xs">
                      {[1, 2, 3, 4, 5].map((rating) => {
                        const isSelected = answers[q._id] === String(rating);
                        return (
                          <button
                            key={rating}
                            type="button"
                            onClick={() => handleSelectAnswer(q._id, String(rating))}
                            className={`flex-1 h-9 rounded text-sm font-semibold transition-all ${
                              isSelected
                                ? 'bg-primary-600 text-white shadow-sm'
                                : 'bg-neutral-50 text-neutral-600 hover:bg-neutral-100 border border-neutral-200'
                            }`}
                          >
                            {rating}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Yes/No Selector */}
                  {q.type === 'yesno' && (
                    <div className="flex gap-3 max-w-xs">
                      {['Yes', 'No'].map((option) => {
                        const isSelected = answers[q._id] === option;
                        return (
                          <button
                            key={option}
                            type="button"
                            onClick={() => handleSelectAnswer(q._id, option)}
                            className={`flex-1 h-9 rounded text-sm font-semibold transition-all ${
                              isSelected
                                ? option === 'Yes'
                                  ? 'bg-success-600 text-white shadow-sm'
                                  : 'bg-danger-600 text-white shadow-sm'
                                : 'bg-neutral-50 text-neutral-600 hover:bg-neutral-100 border border-neutral-200'
                            }`}
                          >
                            {option}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Free text Comments Box */}
                  {q.type === 'text' && (
                    <textarea
                      placeholder="Type your explanation here..."
                      rows={3}
                      value={answers[q._id] || ''}
                      onChange={(e) => handleSelectAnswer(q._id, e.target.value)}
                      className="w-full p-2.5 bg-white border border-neutral-200 rounded-md text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    />
                  )}
                </div>
              </Card>
            );
          })}

          {/* Submission button */}
          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={getUnansweredCount() > 0}
              isLoading={isSubmitting}
              className="w-full"
              rightIcon={<ArrowRight className="h-4 w-4" />}
            >
              {getUnansweredCount() > 0
                ? `Complete all questions (${getUnansweredCount()} left)`
                : 'Submit Assessment'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
