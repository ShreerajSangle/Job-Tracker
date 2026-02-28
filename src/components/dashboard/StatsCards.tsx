import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { JobStatus } from '@/types/job';
import { Briefcase, Send, MessageSquare, Gift, CheckCircle, XCircle } from 'lucide-react';

interface StatsCardsProps {
  stats: {
    total: number;
    byStatus: Record<JobStatus, number>;
  };
}

export function StatsCards({ stats }: StatsCardsProps) {
  const statCards = [
    { label: 'Total', value: stats.total, icon: Briefcase, accentClass: 'text-foreground' },
    { label: 'Applied', value: stats.byStatus.applied, icon: Send, accentClass: 'text-[hsl(215,55%,65%)]' },
    { label: 'Interviewing', value: stats.byStatus.interviewing, icon: MessageSquare, accentClass: 'text-[hsl(260,45%,70%)]' },
    { label: 'Offered', value: stats.byStatus.offered, icon: Gift, accentClass: 'text-[hsl(152,40%,60%)]' },
    { label: 'Accepted', value: stats.byStatus.accepted, icon: CheckCircle, accentClass: 'text-[hsl(152,50%,58%)]' },
    { label: 'Rejected', value: stats.byStatus.rejected, icon: XCircle, accentClass: 'text-[hsl(0,45%,62%)]' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {statCards.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.label} className="overflow-hidden border-border/50">
            <CardHeader className="pb-1 pt-4 px-4">
              <CardTitle className="flex items-center justify-between text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {stat.label}
                <Icon className={`h-3.5 w-3.5 ${stat.accentClass} opacity-60`} />
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <p className={`text-2xl font-semibold ${stat.accentClass}`}>{stat.value}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
