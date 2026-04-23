import type { ReactNode } from 'react';
import {
  Download,
  Link2,
  Menu,
  Moon,
  Play,
  Settings,
  Sun,
  Upload,
} from 'lucide-react';

type Props = {
  autoRun: boolean;
  onAutoRun: (v: boolean) => void;
  onRun: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
  onUpload: () => void;
  onDownload: () => void;
  onShare: () => void;
  onOpenSettings: () => void;
  /** If set, shows a menu control (visible below `md`) to open the panes drawer */
  onOpenPanesMenu?: () => void;
};

function headerIconClass(isDark: boolean) {
  return isDark
    ? 'h-4 w-4 shrink-0 text-slate-400'
    : 'h-4 w-4 shrink-0 text-zinc-600';
}

function themeToggleIconClass(isDark: boolean) {
  return isDark
    ? 'h-[18px] w-[18px] shrink-0 text-slate-300'
    : 'h-[18px] w-[18px] shrink-0 text-zinc-600';
}

function IconBtn({
  onClick,
  children,
  label,
  isDark,
  className = '',
}: {
  onClick: () => void;
  children: ReactNode;
  label: string;
  isDark: boolean;
  className?: string;
}) {
  const base =
    isDark
      ? 'border-jsc-border bg-jsc-elev/80 text-jsc-text hover:border-jsc-muted hover:bg-jsc-border/30'
      : 'border-zinc-200 bg-white text-zinc-800 shadow-sm hover:border-zinc-300 hover:bg-zinc-100';
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={
        'inline-flex h-9 w-9 items-center justify-center rounded-md border text-sm transition ' +
        (className || base)
      }
    >
      {children}
    </button>
  );
}

export function HeaderBar({
  autoRun,
  onAutoRun,
  onRun,
  isDark,
  onToggleTheme,
  onUpload,
  onDownload,
  onShare,
  onOpenSettings,
  onOpenPanesMenu,
}: Props) {
  const ic = headerIconClass(isDark);
  const tc = themeToggleIconClass(isDark);

  return (
    <header
      className={
        (isDark
          ? 'flex min-h-[52px] shrink-0 items-center justify-between border-b border-jsc-border bg-jsc-surface'
          : 'flex min-h-[52px] shrink-0 items-center justify-between border-b border-zinc-200 bg-white') +
        ' gap-2 px-2 py-1 sm:px-4 sm:py-0' +
        ' pt-[max(0.25rem,env(safe-area-inset-top,0px))]'
      }
    >
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
        {onOpenPanesMenu && (
          <button
            type="button"
            onClick={onOpenPanesMenu}
            aria-label="Open panes and workspace menu"
            className={
              (isDark
                ? 'shrink-0 touch-manipulation rounded-md border border-jsc-border bg-jsc-elev/80 p-2 text-jsc-text hover:border-jsc-muted'
                : 'shrink-0 touch-manipulation rounded-md border border-zinc-200 bg-white p-2 text-zinc-800 shadow-sm hover:border-zinc-300') +
              ' min-h-11 min-w-11 md:hidden'
            }
          >
            <Menu
              className={isDark ? 'h-5 w-5' : 'h-5 w-5 text-zinc-700'}
              strokeWidth={1.75}
              aria-hidden
            />
          </button>
        )}
        <a
          href="/"
          className="flex min-w-0 items-center gap-2 no-underline"
          title="JSC — live JavaScript workspace"
        >
          <img
            src="/jsc-mark.svg"
            width={28}
            height={28}
            alt="JSC"
            className="h-7 w-7 shrink-0"
          />
          <h1
            className={
              isDark
                ? 'm-0 whitespace-nowrap text-[16px] font-bold tracking-tight text-jsc-heading'
                : 'm-0 whitespace-nowrap text-[16px] font-bold tracking-tight text-zinc-900'
            }
          >
            JSC
          </h1>
        </a>
        <div
          className={
            isDark
              ? 'hidden h-4 w-px bg-jsc-border sm:block'
              : 'hidden h-4 w-px bg-zinc-200 sm:block'
          }
        />
        <label
          className={
            isDark
              ? 'hidden cursor-pointer select-none items-center gap-2 sm:flex'
              : 'hidden cursor-pointer select-none items-center gap-2 sm:flex'
          }
        >
          <span
            className={
              isDark ? 'text-xs text-jsc-muted' : 'text-xs text-zinc-500'
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
              'relative h-6 w-11 rounded-full transition ' +
              (autoRun
                ? 'bg-jsc-accent'
                : isDark
                  ? 'bg-jsc-border'
                  : 'bg-zinc-300')
            }
          >
            <span
              className={
                'absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition ' +
                (autoRun ? 'translate-x-5' : 'translate-x-0')
              }
            />
          </button>
        </label>
      </div>

      <div className="flex shrink-0 flex-wrap items-center justify-end gap-1 sm:gap-2">
        <div className="flex min-w-0 items-center gap-0.5 sm:gap-2">
          <IconBtn
            label="Import project (JSON)"
            isDark={isDark}
            onClick={onUpload}
          >
            <Upload className={ic} strokeWidth={1.75} aria-hidden />
          </IconBtn>
          <IconBtn
            label="Export project (JSON download)"
            isDark={isDark}
            onClick={onDownload}
          >
            <Download className={ic} strokeWidth={1.75} aria-hidden />
          </IconBtn>
          <IconBtn label="Copy shareable link" isDark={isDark} onClick={onShare}>
            <Link2 className={ic} strokeWidth={1.75} aria-hidden />
          </IconBtn>
          <IconBtn label="Settings" isDark={isDark} onClick={onOpenSettings}>
            <Settings className={ic} strokeWidth={1.75} aria-hidden />
          </IconBtn>
        </div>
        <IconBtn
          label="Toggle theme"
          isDark={isDark}
          onClick={onToggleTheme}
        >
          {isDark ? (
            <Sun className={tc} strokeWidth={1.6} aria-hidden />
          ) : (
            <Moon className={tc} strokeWidth={1.6} aria-hidden />
          )}
        </IconBtn>
        <button
          type="button"
          onClick={onRun}
          aria-label="Run preview (Ctrl+Enter)"
          title="Run (Ctrl+Enter)"
          className={
            'inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-md bg-jsc-accent px-3 py-2 text-sm font-semibold text-white shadow-sm touch-manipulation transition hover:bg-blue-600 focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:outline-none sm:min-h-0 sm:min-w-0 sm:px-4 sm:py-2 ' +
            (isDark
              ? 'focus:ring-offset-jsc-surface'
              : 'focus:ring-offset-white')
          }
        >
          <Play
            className="h-4 w-4 shrink-0"
            strokeWidth={2}
            aria-hidden
          />
          <span className="max-sm:sr-only">Run</span>
          <span
            className={
              isDark
                ? 'hidden text-[10px] font-medium text-white/80 md:inline'
                : 'hidden text-[10px] font-medium text-white/80 md:inline'
            }
          >
            Ctrl+Enter
          </span>
        </button>
      </div>
    </header>
  );
}
