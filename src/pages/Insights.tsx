import { Navbar } from '@/components/layout/Navbar';
import { useJobs } from '@/hooks/useJobs';
import { useJobStats } from '@/hooks/useJobStats';
import { SourceStatsChart } from '@/components/dashboard/SourceStatsChart';
import { SourceInsights } from '@/components/dashboard/SourceInsights';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, TrendingUp, Target, Clock, Download } from 'lucide-react';
import { STATUS_CONFIG } from '@/types/job';
import { Button } from '@/components/ui/button';

function exportToCSV(jobs: ReturnType<typeof useJobs>['jobs']) {
  const headers = [
    'Company', 'Job Title', 'Status', 'Source', 'Location',
    'Salary Min', 'Salary Max', 'Currency', 'Applied Date',
    'Deadline', 'Job URL', 'Tags', 'Notes', 'Created At'
  ];
  const rows = jobs.map(j => [
    `"${(j.company_name || '').replace(/"/g, '""')}"`,
    `"${(j.job_title || '').replace(/"/g, '""')}"`,
    j.status,
    j.source || '',
    `"${(j.location || '').replace(/"/g, '""')}"`,
    j.salary_min ?? '',
    j.salary_max ?? '',
    j.currency || '',
    j.applied_date || '',
    j.deadline_date || '',
    `"${(j.job_url || '').replace(/"/g, '""')}"`,
    `"${(j.tags || []).join(', ')}"`,
    `"${(j.notes || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
    j.created_at,
  ]);
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `job-tracker-export-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Insights() {
  const { jobs, loading } = useJobs();
  const stats = useJobStats(jobs);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  const activeJobs = jobs.filter(j => !['rejected', 'withdrawn', 'accepted'].includes(j.status));
  const totalApplied = stats.total - stats.byStatus.saved;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 container py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Insights</h1>
            <p className="text-muted-foreground">Track your job search performance</p>
          </div>
          {jobs.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => exportToCSV(jobs)}
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          )}
        </div>

        {jobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-muted-foreground">
              Add some jobs to see insights about your job search
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Success Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-emerald-600">
                    {stats.successRate.toFixed(0)}%
                  </p>
                  <p className="text-sm text-muted-foreground">Offers / Applications</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Active Applications
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-blue-600">{activeJobs.length}</p>
                  <p className="text-sm text-muted-foreground">In progress</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Interview Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-violet-600">
                    {totalApplied > 0
                      ? ((stats.byStatus.interviewing + stats.byStatus.offered + stats.byStatus.accepted) / totalApplied * 100).toFixed(0)
                      : 0
                    }%
                  </p>
                  <p className="text-sm text-muted-foreground">Applications → Interviews</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Applications
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{totalApplied}</p>
                  <p className="text-sm text-muted-foreground">Submitted so far</p>
                </CardContent>
              </Card>
            </div>

            <SourceInsights bestSource={stats.bestSource} worstSource={stats.worstSource} />
            <SourceStatsChart bySource={stats.bySource} />

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Application Status Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
                  {Object.entries(STATUS_CONFIG).map(([status, config]) => (
                    <div key={status} className="text-center">
                      <div className={`text-2xl font-bold ${config.color}`}>
                        {stats.byStatus[status as keyof typeof stats.byStatus]}
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                        <span>{config.label}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
