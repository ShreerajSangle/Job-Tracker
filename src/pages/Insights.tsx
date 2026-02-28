import { Navbar } from '@/components/layout/Navbar';
import { useJobs } from '@/hooks/useJobs';
import { useJobStats } from '@/hooks/useJobStats';
import { SourceStatsChart } from '@/components/dashboard/SourceStatsChart';
import { SourceInsights } from '@/components/dashboard/SourceInsights';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, TrendingUp, Target, Clock } from 'lucide-react';
import { STATUS_CONFIG } from '@/types/job';

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
        <div>
          <h1 className="text-2xl font-bold">Insights</h1>
          <p className="text-muted-foreground">Track your job search performance</p>
        </div>

        {jobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-muted-foreground">
              Add some jobs to see insights about your job search
            </p>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
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
                  <p className="text-sm text-muted-foreground">
                    Offers / Applications
                  </p>
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
                  <p className="text-3xl font-bold text-blue-600">
                    {activeJobs.length}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    In progress
                  </p>
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
                  <p className="text-sm text-muted-foreground">
                    Applications → Interviews
                  </p>
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
                  <p className="text-sm text-muted-foreground">
                    Submitted so far
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Source Insights */}
            <SourceInsights
              bestSource={stats.bestSource}
              worstSource={stats.worstSource}
            />

            {/* Source Stats Chart */}
            <SourceStatsChart bySource={stats.bySource} />

            {/* Status Breakdown */}
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
                        <span>{config.icon}</span>
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
