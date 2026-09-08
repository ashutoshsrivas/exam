'use client';

import * as React from 'react';
import { Check, Loader2, Search, X } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

export type PickerUser = {
  id: number;
  name: string;
  role: string;
  employeeid: string | null;
  email?: string | null;
  department?: string | null;
};

type Props = {
  value: PickerUser | null;
  onPick: (user: PickerUser | null) => void | Promise<void>;
  placeholder?: string;
  className?: string;
  status?: 'idle' | 'saving' | 'saved' | 'error';
  disabled?: boolean;
};

export function UserPicker({ value, onPick, placeholder = 'Search faculty…', className, status = 'idle', disabled }: Props) {
  const [query, setQuery] = React.useState('');
  const [suggestions, setSuggestions] = React.useState<PickerUser[]>([]);
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState(-1);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Debounced search
  React.useEffect(() => {
    const q = query.trim();
    if (!q) { setSuggestions([]); setLoading(false); return; }
    setLoading(true);
    const handle = setTimeout(async () => {
      try {
        const data = await api<{ users: PickerUser[] }>(`/api/users?q=${encodeURIComponent(q)}&limit=15`);
        setSuggestions(data.users);
        setActiveIndex(data.users.length > 0 ? 0 : -1);
      } catch { setSuggestions([]); }
      finally { setLoading(false); }
    }, 180);
    return () => clearTimeout(handle);
  }, [query]);

  // Close on outside click
  React.useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  async function choose(u: PickerUser) {
    setOpen(false);
    setQuery('');
    await onPick(u);
  }

  async function clear() {
    setQuery('');
    setOpen(false);
    await onPick(null);
    inputRef.current?.focus();
  }

  const displayText = value ? value.name : query;

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <div className={cn(
        'flex h-10 items-center gap-2 rounded-md border bg-white px-2 shadow-sm transition-colors',
        open ? 'border-primary shadow-ring' : 'border-input',
        disabled && 'cursor-not-allowed opacity-60',
        status === 'error' && 'border-destructive',
      )}>
        <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        {value ? (
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <span className="truncate text-sm font-medium">{value.name}</span>
            <span className="hidden shrink-0 text-[10px] text-muted-foreground sm:inline">{value.role}</span>
          </div>
        ) : (
          <input
            ref={inputRef}
            type="text"
            value={query}
            disabled={disabled}
            placeholder={placeholder}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActiveIndex((i) => Math.min(suggestions.length - 1, i + 1));
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActiveIndex((i) => Math.max(0, i - 1));
              } else if (e.key === 'Enter') {
                e.preventDefault();
                if (activeIndex >= 0 && suggestions[activeIndex]) choose(suggestions[activeIndex]);
              } else if (e.key === 'Escape') {
                setOpen(false);
              }
            }}
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
          />
        )}

        {status === 'saving' && <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-muted-foreground" />}
        {status === 'saved' && <Check className="h-3.5 w-3.5 shrink-0 text-emerald-600" />}

        {value && !disabled && (
          <button
            type="button"
            onClick={clear}
            title="Clear"
            className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-destructive"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {open && !value && (
        <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-72 overflow-y-auto rounded-md border bg-white p-1 shadow-lift">
          {loading ? (
            <div className="flex items-center justify-center py-4 text-xs text-muted-foreground">
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Searching…
            </div>
          ) : query.trim() === '' ? (
            <div className="px-2 py-3 text-xs text-muted-foreground">Start typing to search faculty…</div>
          ) : suggestions.length === 0 ? (
            <div className="px-2 py-3 text-xs text-muted-foreground">No matches for &ldquo;{query}&rdquo;</div>
          ) : (
            suggestions.map((u, i) => (
              <button
                key={u.id}
                type="button"
                onMouseEnter={() => setActiveIndex(i)}
                onMouseDown={(e) => { e.preventDefault(); choose(u); }}
                className={cn(
                  'flex w-full items-start gap-2 rounded px-2 py-1.5 text-left text-sm transition-colors',
                  i === activeIndex ? 'bg-primary/10' : 'hover:bg-accent',
                )}
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{u.name}</div>
                  <div className="truncate text-[11px] text-muted-foreground">
                    {[u.employeeid, u.role, u.department].filter(Boolean).join(' · ')}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
