import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { STATUSES, STATUS_STYLE, type ApplicationStatus } from './types';

export function StatusPill({ status, onChange }: { status: ApplicationStatus; onChange?: (s: ApplicationStatus) => void }) {
  const s = STATUS_STYLE[status];
  const pill = `inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${s.cls}`;
  if (!onChange) return <span className={pill}>{s.label}</span>;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        onClick={(e) => e.stopPropagation()}
        className={`${pill} outline-none transition-transform active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-ring`}
      >
        {s.label}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" onClick={(e) => e.stopPropagation()}>
        {STATUSES.map((k) => (
          <DropdownMenuItem key={k} onClick={() => onChange(k)} className={k === status ? 'font-semibold' : ''}>
            {STATUS_STYLE[k].label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
