import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import type { SourceFile, PaneVisibility } from '../types';

type Props = {
  activeFile: SourceFile;
  onSelectFile: (f: SourceFile) => void;
  isDark: boolean;
  panes: PaneVisibility;
  onTogglePane: (key: keyof PaneVisibility) => void;
  autoRun: boolean;
  onAutoRun: (v: boolean) => void;
  /** Mobile drawer: whether the panel is visible */
  mobileOpen: boolean;
  onRequestClose: () => void;
};

const PANE_ROWS: {
  key: keyof PaneVisibility;
  label: string;
  file?: SourceFile;
}[] = [
  { key: 'html', label: 'HTML', file: 'index.html' },
  { key: 'css', label: 'CSS', file: 'style.css' },
  { key: 'js', label: 'JavaScript', file: 'script.js' },
  { key: 'console', label: 'Console' },
  { key: 'preview', label: 'Preview' },
];

export function FilesSidebar({
  activeFile,
  onSelectFile,
  isDark,
  panes,
  onTogglePane,
  autoRun,
  onAutoRun,
  mobileOpen,
  onRequestClose,
}: Props) {
  const [isNarrow, setIsNarrow] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const set = () => setIsNarrow(mq.matches);
    set();
    mq.addEventListener('change', set);
    return () => mq.removeEventListener('change', set);
  }, []);

  const base =
    'flex h-full w-[min(100%,280px)] shrink-0 flex-col border-r py-3 pl-2 pr-0 text-left ' +
    'md:static md:w-[220px] md:translate-x-0 lg:w-[240px] ' +
    'max-md:fixed max-md:top-0 max-md:z-50 max-md:h-full ' +
    'max-md:pt-[max(0.75rem,env(safe-area-inset-top,0px))] max-md:pb-4 ' +
    'max-md:shadow-2xl max-md:transition-transform max-md:duration-200 max-md:ease-out';
  const theme = isDark
    ? `${base} border-jsc-border bg-jsc-surface/95 max-md:border-r max-md:border-jsc-border`
    : `${base} border-zinc-200 bg-zinc-50/95 max-md:border-r max-md:border-zinc-200`;

  const pos = mobileOpen
    ? 'max-md:translate-x-0'
    : 'max-md:pointer-events-none max-md:-translate-x-full';

  const sectionLabel = isDark
    ? 'px-3 pb-2 text-[10px] font-semibold tracking-wider text-jsc-muted uppercase'
    : 'px-3 pb-2 text-[10px] font-semibold tracking-wider text-zinc-500 uppercase';

  return (
    <aside
      className={theme + ' ' + pos}
      inert={isNarrow && !mobileOpen ? true : undefined}
    >
      <div className="flex items-center justify-between gap-2 pr-2 pl-1 md:hidden">
        <p
          className={
            isDark
              ? 'text-xs font-semibold text-jsc-heading'
              : 'text-xs font-semibold text-zinc-900'
          }
        >
          Workspace
        </p>
        <button
          type="button"
          onClick={onRequestClose}
          className={
            (isDark
              ? 'rounded-md p-2 text-jsc-muted hover:bg-jsc-border/50 hover:text-jsc-heading'
              : 'rounded-md p-2 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-900') +
            ' -mr-0.5 min-h-11 min-w-11 touch-manipulation'
          }
          aria-label="Close menu"
        >
          <X className="mx-auto h-5 w-5" strokeWidth={2} />
        </button>
      </div>

      <p className={sectionLabel + ' md:pt-0'}>Panes</p>
      <p
        className={
          (isDark ? 'text-jsc-muted' : 'text-zinc-500') +
          ' hidden px-3 text-[10px] leading-relaxed sm:block'
        }
      >
        Toggle to show or hide. Click a file name to mark it as the active
        file in the status bar. Drag the bar between editors and the output
        area to change height.
      </p>
      <p
        className={
          (isDark ? 'text-jsc-muted' : 'text-zinc-500') +
          ' px-3 text-[10px] leading-relaxed sm:hidden'
        }
      >
        Show or hide panes. Tap a file name to set the active file.
      </p>

      <div
        className={
          (isDark
            ? 'mt-3 flex items-center justify-between gap-2 border-b border-jsc-border/80 px-3 pb-3 sm:hidden'
            : 'mt-3 flex items-center justify-between gap-2 border-b border-zinc-200/90 px-3 pb-3 sm:hidden') +
          (isDark ? ' text-jsc-text' : ' text-zinc-800')
        }
      >
        <span
          className={
            isDark ? 'text-xs text-jsc-muted' : 'text-xs text-zinc-600'
          }
        >
          Auto-run
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={autoRun}
          onClick={() => onAutoRun(!autoRun)}
          className={
            'relative h-7 w-12 shrink-0 rounded-full transition touch-manipulation ' +
            (autoRun
              ? 'bg-jsc-accent'
              : isDark
                ? 'bg-jsc-border'
                : 'bg-zinc-300')
          }
        >
          <span
            className={
              'absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition ' +
              (autoRun ? 'translate-x-5' : 'translate-x-0')
            }
          />
        </button>
      </div>

      <ul className="mt-3 space-y-1.5 pr-1" role="list">
        {PANE_ROWS.map(({ key, label, file }) => (
          <li key={key} className="flex items-center gap-2 pl-1 pr-0.5">
            <PaneSwitch
              on={panes[key]}
              isDark={isDark}
              onClick={() => onTogglePane(key)}
              label={`${panes[key] ? 'Hide' : 'Show'} ${label}`}
            />
            {file ? (
              <button
                type="button"
                onClick={() => onSelectFile(file)}
                className={
                  'min-h-9 min-w-0 flex-1 truncate py-0.5 text-left text-[13px] touch-manipulation ' +
                  (activeFile === file
                    ? isDark
                      ? 'font-medium text-jsc-heading'
                      : 'font-medium text-zinc-900'
                    : isDark
                      ? 'text-jsc-text hover:text-jsc-heading'
                      : 'text-zinc-700 hover:text-zinc-900')
                }
              >
                {label}
              </button>
            ) : (
              <span
                className={
                  isDark
                    ? 'min-w-0 flex-1 text-[13px] text-jsc-text'
                    : 'min-w-0 flex-1 text-[13px] text-zinc-800'
                }
              >
                {label}
              </span>
            )}
          </li>
        ))}
      </ul>
    </aside>
  );
}

function PaneSwitch({
  on,
  isDark,
  onClick,
  label,
}: {
  on: boolean;
  isDark: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onClick}
      className={
        'relative h-5 w-9 shrink-0 touch-manipulation rounded-full border transition ' +
        (on
          ? isDark
            ? 'border-jsc-accent bg-jsc-accent'
            : 'border-blue-500 bg-blue-500'
          : isDark
            ? 'border-jsc-border bg-jsc-elev'
            : 'border-zinc-300 bg-zinc-200')
      }
    >
      <span
        className={
          'absolute top-0.5 left-0.5 block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ' +
          (on ? 'translate-x-4' : 'translate-x-0')
        }
      />
    </button>
  );
}
