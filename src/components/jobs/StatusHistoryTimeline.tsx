import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { JobStatusHistory, JobStatus, STATUS_CONFIG } from '@/types/job';
import { formatDistanceToNow, format } from 'date-fns';
import { Loader2, ArrowRight } from 'lucide-react';

interface StatusHistoryTimelineProps {
  jobId: string;
}

export function StatusHistoryTimeline({ jobId }: StatusHistoryTimelineProps) {
  const [history, setHistory] = useState<JobStatusHistory[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    const { data, error } = await supabase
      .from('job_status_history')
      .select('*')
      .eq('job_id', jobId)
      .order('changed_at', { ascending: false });

    if (!error && data) {
      setHistory(data as JobStatusHistory[]);
    }
    setLoading(false);
  }, [jobId]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No status history yet
      </div>
    );
  }

  return (
    <div className="relative space-y-4 pl-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
      {history.map((entry) => {
        const toConfig = STATUS_CONFIG[entry.to_status];
        const fromConfig = entry.from_status ? STATUS_CONFIG[entry.from_status] : null;
        
        return (
          <div key={entry.id} className="relative">
            <div className="absolute -left-6 top-1 h-4 w-4 rounded-full bg-background border-2 border-primary flex items-center justify-center text-xs">
              {toConfig.icon}
            </div>
            <div className="bg-card border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                {fromConfig && (
                  <>
                    <span className={`text-sm ${fromConfig.color}`}>
                      {fromConfig.label}
                    </span>
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  </>
                )}
                <span className={`font-medium ${toConfig.color}`}>
                  {toConfig.label}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {format(new Date(entry.changed_at), 'MMM d, yyyy h:mm a')}
                {' · '}
                {formatDistanceToNow(new Date(entry.changed_at), { addSuffix: true })}
              </p>
              {entry.reason && (
                <p className="text-sm mt-2 text-muted-foreground">{entry.reason}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
