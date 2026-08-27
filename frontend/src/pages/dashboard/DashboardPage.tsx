import { useState, useEffect } from 'react';
import {
  Users,
  ClipboardList,
  CheckCircle2,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { formatDate } from '../../utils/formatters';
import { supplierService } from '../../services/supplierService';
import { surveyService } from '../../services/surveyService';
import type { Supplier, Survey } from '../../types';

// ─── Stat Card Component ──────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: number;
  icon: any;
  color: string;
  bg: string;
  id: string;
}

function StatCard({ label, value, icon: Icon, color, bg, id }: StatCardProps) {
  return (
    <Card className="flex items-center gap-4" id={id}>
      <div className={`flex h-12 w-12 items-center justify-center rounded-lg flex-shrink-0 ${bg}`}>
        <Icon className={`h-6 w-6 ${color}`} />
      </div>
      <div>
        <p className="text-2xl font-bold text-neutral-900">{value}</p>
        <p className="text-sm text-neutral-500">{label}</p>
      </div>
    </Card>
  );
}

// ─── Badges ─────────────────────────────────────────────────────────────

function SurveyStatusBadge({ status }: { status: 'draft' | 'active' | 'closed' }) {
  const map = {
    draft:  { label: 'Draft',  variant: 'default' as const },
    active: { label: 'Active', variant: 'success' as const },
    closed: { label: 'Closed', variant: 'danger'  as const },
  };
  const { label, variant } = map[status];
  return <Badge variant={variant}>{label}</Badge>;
}



// ─── Page ─────────────────────────────────────────────────────────────────────

export function DashboardPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [responses, setResponses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        const [loadedSuppliers, loadedSurveys, loadedResponses] = await Promise.all([
          supplierService.getAll(),
          surveyService.getAll(),
          surveyService.getResponses(),
        ]);
        setSuppliers(loadedSuppliers);
        setSurveys(loadedSurveys);
        setResponses(loadedResponses);
      } catch (err: any) {
        console.error('Failed to load dashboard data:', err);
        setError('Failed to load dashboard metrics. Please check connection.');
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const totalSuppliers = suppliers.length;
  const activeSurveys = surveys.filter((s) => s.status === 'active').length;
  const completedResponsesCount = responses.length;
  // Calculate total assignments count to compute pending responses.
  // In Phase 2, we fetch assignments for active surveys or calculate from responses.
  // For dashboard simplicity, pending = totalSuppliers * activeSurveys - completedResponsesCount
  const pendingResponsesCount = Math.max(0, (totalSuppliers * activeSurveys) - completedResponsesCount);

  const stats = [
    {
      id: 'total-suppliers',
      label: 'Total Suppliers',
      value: totalSuppliers,
      icon: Users,
      color: 'text-primary-600',
      bg: 'bg-primary-50',
    },
    {
      id: 'active-surveys',
      label: 'Active Surveys',
      value: activeSurveys,
      icon: ClipboardList,
      color: 'text-warning-600',
      bg: 'bg-warning-50',
    },
    {
      id: 'completed-responses',
      label: 'Completed Responses',
      value: completedResponsesCount,
      icon: CheckCircle2,
      color: 'text-success-600',
      bg: 'bg-success-50',
    },
    {
      id: 'pending-responses',
      label: 'Pending Assessments',
      value: pendingResponsesCount,
      icon: Clock,
      color: 'text-neutral-500',
      bg: 'bg-neutral-100',
    },
  ];

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

  if (error) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="p-4 bg-danger-50 border border-danger-200 text-danger-800 rounded-lg text-sm">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">Dashboard</h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            Overview of your supplier assessment activity
          </p>
        </div>
        <Link to="/surveys">
          <Button variant="primary" size="sm" rightIcon={<ArrowRight className="h-3.5 w-3.5" />}>
            New Survey
          </Button>
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <StatCard key={stat.id} {...stat} />
        ))}
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent surveys */}
        <div className="lg:col-span-2">
          <Card padding="none">
            <CardHeader
              title="Recent Surveys"
              action={
                <Link to="/surveys" className="text-xs text-primary-600 hover:underline">
                  View all
                </Link>
              }
              className="px-5 pt-5 pb-0"
            />
            <table className="data-table mt-2">
              <thead>
                <tr>
                  <th>Survey</th>
                  <th>Status</th>
                  <th className="hidden sm:table-cell">Questions</th>
                  <th className="hidden md:table-cell">Created</th>
                </tr>
              </thead>
              <tbody>
                {surveys.slice(0, 5).map((s) => (
                  <tr key={s._id}>
                    <td className="font-medium text-neutral-900">{s.title}</td>
                    <td><SurveyStatusBadge status={s.status} /></td>
                    <td className="hidden sm:table-cell">
                      {Array.isArray(s.questions) ? s.questions.length : 0} questions
                    </td>
                    <td className="hidden md:table-cell text-neutral-500">{formatDate(s.createdAt)}</td>
                  </tr>
                ))}
                {surveys.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center py-6 text-neutral-400 text-sm">
                      No surveys created yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            <div className="px-5 pb-4 pt-2 border-t border-neutral-100 mt-2">
              <p className="text-xs text-neutral-400">Showing {Math.min(5, surveys.length)} survey(s)</p>
            </div>
          </Card>
        </div>

        {/* Supplier status */}
        <div>
          <Card padding="none">
            <CardHeader
              title="Suppliers Registered"
              subtitle="Recently added supplier contacts"
              className="px-5 pt-5 pb-3"
            />
            <div className="px-5 pb-5 space-y-3">
              {suppliers.slice(0, 5).map((s) => (
                <div
                  key={s._id}
                  className="flex items-center justify-between py-2 border-b border-neutral-100 last:border-0"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="h-7 w-7 rounded-full bg-neutral-100 flex items-center justify-center text-xs font-semibold text-neutral-500">
                      {s.name[0]}
                    </div>
                    <p className="text-sm text-neutral-700 font-medium truncate max-w-[170px]" title={s.name}>
                      {s.name}
                    </p>
                  </div>
                  <Badge variant="success">Active</Badge>
                </div>
              ))}
              {suppliers.length === 0 && (
                <p className="text-center py-6 text-neutral-400 text-sm">
                  No suppliers registered yet.
                </p>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Recent responses */}
      <Card padding="none">
        <CardHeader
          title="Recent Responses"
          action={
            <Link to="/responses" className="text-xs text-primary-600 hover:underline">
              View all
            </Link>
          }
          className="px-5 pt-5 pb-0"
        />
        <table className="data-table mt-2">
          <thead>
            <tr>
              <th>Supplier</th>
              <th>Survey</th>
              <th>Score</th>
              <th className="hidden sm:table-cell">Submitted</th>
            </tr>
          </thead>
          <tbody>
            {responses.slice(0, 5).map((r) => (
              <tr key={r._id}>
                <td className="font-medium text-neutral-900">
                  {r.assignment?.supplier?.name ?? '—'}
                </td>
                <td className="text-neutral-500">{r.assignment?.survey?.title ?? '—'}</td>
                <td className="font-mono font-semibold text-neutral-800">
                  {r.totalScore}/{r.maxPossibleScore}
                </td>
                <td className="hidden sm:table-cell text-neutral-500">
                  {formatDate(r.createdAt)}
                </td>
              </tr>
            ))}
            {responses.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center py-6 text-neutral-400 text-sm">
                  No survey responses received yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <div className="px-5 pb-4 pt-2 border-t border-neutral-100 mt-2">
          <p className="text-xs text-neutral-400">Showing {Math.min(5, responses.length)} record(s)</p>
        </div>
      </Card>
    </div>
  );
}
