import { Card } from '../../components/ui/Card';
import { BarChart, TrendingUp, ShieldCheck } from 'lucide-react';

export function ReportsPage() {
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto animate-fade-in">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">Reports</h1>
        <p className="text-sm text-neutral-500 mt-0.5">Aggregate supplier quality performance metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="flex flex-col gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
            <BarChart className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-neutral-900">Supplier Quality Metrics</h2>
            <p className="text-sm text-neutral-500 mt-1">
              Phase 2: Generate visual dashboard components and comparative scoring matrix reports.
            </p>
          </div>
        </Card>

        <Card className="flex flex-col gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-success-50 text-success-600">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-neutral-900">Compliance & Audit Logs</h2>
            <p className="text-sm text-neutral-500 mt-1">
              Phase 2: Track compliance rates, survey response history, and system audit trail changes.
            </p>
          </div>
        </Card>

        <Card className="flex flex-col gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-warning-50 text-warning-600">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-neutral-900">Performance Trends</h2>
            <p className="text-sm text-neutral-500 mt-1">
              Phase 2: Track performance trends of suppliers over quarterly cycles.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
