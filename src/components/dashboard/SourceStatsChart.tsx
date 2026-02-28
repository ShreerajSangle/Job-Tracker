import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { JobSource, SOURCE_CONFIG } from '@/types/job';

interface SourceStatsChartProps {
  bySource: Record<JobSource, {
    total: number;
    applied: number;
    interviewing: number;
    offered: number;
    accepted: number;
  }>;
}

export function SourceStatsChart({ bySource }: SourceStatsChartProps) {
  const chartData = Object.entries(bySource)
    .filter(([_, data]) => data.total > 0)
    .map(([source, data]) => ({
      name: SOURCE_CONFIG[source as JobSource].label,
      Applied: data.applied,
      Interviewing: data.interviewing,
      Offered: data.offered,
      Accepted: data.accepted,
      total: data.total,
    }));

  if (chartData.length === 0) return null;

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-base font-medium">Applications by Source</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 20 }}>
              <XAxis
                type="number"
                tick={{ fill: 'hsl(220, 10%, 48%)', fontSize: 12 }}
                axisLine={{ stroke: 'hsl(225, 10%, 18%)' }}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={100}
                tick={{ fill: 'hsl(220, 13%, 70%)', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(228, 13%, 12%)',
                  border: '1px solid hsl(225, 10%, 18%)',
                  borderRadius: '8px',
                  color: 'hsl(220, 13%, 83%)',
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: 12, color: 'hsl(220, 10%, 48%)' }}
              />
              <Bar dataKey="Applied" stackId="a" fill="hsl(215, 45%, 45%)" radius={[0, 0, 0, 0]} />
              <Bar dataKey="Interviewing" stackId="a" fill="hsl(260, 35%, 48%)" />
              <Bar dataKey="Offered" stackId="a" fill="hsl(152, 35%, 38%)" />
              <Bar dataKey="Accepted" stackId="a" fill="hsl(152, 40%, 45%)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
