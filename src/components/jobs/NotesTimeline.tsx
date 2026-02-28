import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Trash2, MessageSquare, Phone, Mail, Star, Bell, StickyNote } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useJobNotes } from '@/hooks/useJobNotes';
import { NoteCategory, NOTE_CATEGORY_CONFIG } from '@/types/job';
import { NOTE_TEMPLATES } from '@/lib/constants';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const CATEGORY_ICONS: Record<NoteCategory, React.ReactNode> = {
  general:  <StickyNote className="h-2.5 w-2.5" />,
  call:     <Phone className="h-2.5 w-2.5" />,
  email:    <Mail className="h-2.5 w-2.5" />,
  feedback: <Star className="h-2.5 w-2.5" />,
  reminder: <Bell className="h-2.5 w-2.5" />,
};

const TEMPLATE_LABELS = [
  'Recruiter called, next round is {round}',
  'Sent follow-up email asking about timeline',
  'Received feedback: {feedback}',
  'Remember to check on this application',
  'Glassdoor reviews mention {concern}',
];

interface NotesTimelineProps {
  jobId: string;
}

export function NotesTimeline({ jobId }: NotesTimelineProps) {
  const { notes, loading, createNote, deleteNote } = useJobNotes(jobId);
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<NoteCategory>('general');
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteNoteId, setDeleteNoteId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setSubmitting(true);
    await createNote(content.trim(), category);
    setContent('');
    setCategory('general');
    setSubmitting(false);
  };

  const filteredNotes = notes.filter((note) =>
    note.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-5">
      {/* Add Note Form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <Textarea
          placeholder="Add a note... e.g., 'Recruiter called, next round is panel interview'"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          className="resize-none bg-muted/20 border-border/40 text-sm placeholder:text-muted-foreground/40 focus-visible:ring-1"
        />
        <div className="flex flex-wrap gap-1.5">
          {TEMPLATE_LABELS.map((label, index) => (
            <Button
              key={index}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setContent(label)}
              className="text-xs border-border/50 text-muted-foreground hover:text-foreground"
            >
              {label.slice(0, 24)}…
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Select value={category} onValueChange={(v) => setCategory(v as NoteCategory)}>
            <SelectTrigger className="w-32 bg-muted/20 border-border/40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(NOTE_CATEGORY_CONFIG).map(([key, config]) => (
                <SelectItem key={key} value={key}>
                  <span className="flex items-center gap-1.5">
                    {CATEGORY_ICONS[key as NoteCategory]}
                    {config.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="submit" size="sm" disabled={submitting || !content.trim()}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Add Note
          </Button>
        </div>
      </form>

      {/* Search */}
      {notes.length > 0 && (
        <div>
          <Input
            placeholder="Search notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm bg-muted/20 border-border/40 text-sm focus-visible:ring-1"
          />
          {searchTerm && (
            <p className="text-xs text-muted-foreground mt-1.5">
              {filteredNotes.length} note{filteredNotes.length !== 1 ? 's' : ''} match "{searchTerm}"
            </p>
          )}
        </div>
      )}

      {/* Timeline */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">
          {searchTerm ? 'No notes match your search' : 'No notes yet. Add your first note above.'}
        </div>
      ) : (
        <div className="relative space-y-3 pl-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-border/50">
          {filteredNotes.map((note) => {
            const categoryConfig = NOTE_CATEGORY_CONFIG[note.category];
            return (
              <div key={note.id} className="relative">
                <div className="absolute -left-6 top-1.5 h-3.5 w-3.5 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground">
                  {CATEGORY_ICONS[note.category]}
                </div>
                <div className="bg-muted/30 border border-border/50 rounded-lg p-3 group">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Badge className={`${categoryConfig.bgColor} ${categoryConfig.color} text-xs border-0`}>
                        {categoryConfig.label}
                      </Badge>
                      <span className="text-xs text-muted-foreground/70">
                        {formatDistanceToNow(new Date(note.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => setDeleteNoteId(note.id)}
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                  <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">{note.content}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AlertDialog open={!!deleteNoteId} onOpenChange={(open) => { if (!open) setDeleteNoteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this note?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteNoteId) deleteNote(deleteNoteId);
                setDeleteNoteId(null);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
