import { createContext, useContext, ReactNode } from 'react';
import { useJobs } from '@/hooks/useJobs';

type JobsContextType = ReturnType<typeof useJobs>;

const JobsContext = createContext<JobsContextType | null>(null);

export function JobsProvider({ children }: { children: ReactNode }) {
  const jobs = useJobs();
  return <JobsContext.Provider value={jobs}>{children}</JobsContext.Provider>;
}

export function useJobsContext(): JobsContextType {
  const ctx = useContext(JobsContext);
  if (!ctx) throw new Error('useJobsContext must be used inside <JobsProvider>');
  return ctx;
}
