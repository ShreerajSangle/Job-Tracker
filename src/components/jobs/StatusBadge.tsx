import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { JobStatus, STATUS_CONFIG } from '@/types/job';
import { ChevronDown } from 'lucide-react';

interface StatusBadgeProps {
  status: JobStatus;
  onStatusChange?: (newStatus: JobStatus) => void;
  interactive?: boolean;
  size?: 'sm' | 'default';
}

export function StatusBadge({ status, onStatusChange, interactive = false, size = 'default' }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  
  // When interactive, allow changing to ANY other status
  const availableStatuses = interactive 
    ? (Object.keys(STATUS_CONFIG) as JobStatus[]).filter(s => s !== status)
    : [];

  const badgeContent = (
    <>
      {config.label}
      {interactive && (
        <ChevronDown className="ml-1.5 h-3 w-3 opacity-60" />
      )}
    </>
  );

  if (!interactive || !onStatusChange || availableStatuses.length === 0) {
    return (
      <Badge
        className={`
          ${config.bgColor} ${config.color} ${config.borderColor}
          border font-medium
          ${size === 'sm' ? 'text-[10px] px-2 py-0' : 'text-xs px-2.5 py-0.5'}
        `}
        variant="outline"
      >
        {config.label}
      </Badge>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button 
          className={`
            inline-flex items-center rounded-full border transition-all duration-200
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1
            hover:opacity-80 active:scale-95
            ${config.bgColor} ${config.color} ${config.borderColor}
            ${size === 'sm' ? 'text-[10px] px-2 py-0' : 'text-xs px-2.5 py-0.5 font-medium'}
          `}
        >
          {badgeContent}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-44 p-1">
        {availableStatuses.map((nextStatus) => {
          const nextConfig = STATUS_CONFIG[nextStatus];
          return (
            <DropdownMenuItem
              key={nextStatus}
              onClick={() => onStatusChange(nextStatus)}
              className="cursor-pointer text-xs flex items-center gap-2 px-2 py-1.5 rounded-md"
            >
              <div className={`h-1.5 w-1.5 rounded-full ${nextConfig.bgColor} border ${nextConfig.borderColor}`} />
              {nextConfig.label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
