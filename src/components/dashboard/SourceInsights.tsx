import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, AlertTriangle } from 'lucide-react';
import { JobSource, SOURCE_CONFIG } from '@/types/job';

interface SourceInsightsProps {
  bestSource: { source: JobSource; rate: number } | null;
  worstSource: { source: JobSource; rate: number } | null;
}

export function SourceInsights({ bestSource, worstSource }: SourceInsightsProps) {
  if (!bestSource && !worstSource) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {bestSource && (
        <Card className="border-[hsl(152,20%,18%)] bg-[hsl(152,15%,9%)]">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-[hsl(152,40%,55%)]">
              <TrendingUp className="h-4 w-4" />
              Best Performer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-semibold text-[hsl(152,35%,70%)]">
              {SOURCE_CONFIG[bestSource.source].label}: {bestSource.rate.toFixed(0)}% success rate
            </p>
            <p className="text-sm text-[hsl(152,20%,45%)] mt-1">
              Focus on more {SOURCE_CONFIG[bestSource.source].label.toLowerCase()} applications!
            </p>
          </CardContent>
        </Card>
      )}

      {worstSource && worstSource.source !== bestSource?.source && (
        <Card className="border-[hsl(38,20%,18%)] bg-[hsl(38,15%,9%)]">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-[hsl(38,40%,55%)]">
              <AlertTriangle className="h-4 w-4" />
              Needs Attention
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-semibold text-[hsl(38,35%,70%)]">
              {SOURCE_CONFIG[worstSource.source].label}: {worstSource.rate.toFixed(0)}% success rate
            </p>
            <p className="text-sm text-[hsl(38,20%,45%)] mt-1">
              Consider trying different platforms
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
