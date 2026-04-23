type Props = {
  autoRun: boolean;
  onAutoRun: (v: boolean) => void;
  onRun: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
  onShare: () => void;
  onSave: () => void;
  onOpenSettings: () => void;
};

function IconBtn({
  onClick,
  children,
  label,
  isDark,
  className = '',
}: {
  onClick: () => void;
  children: React.ReactNode;
  label: string;
  isDark: boolean;
  className?: string;
}) {
  const base =
    isDark
      ? 'border-jsc-border bg-jsc-elev/80 text-jsc-text hover:border-jsc-muted hover:bg-jsc-border/30'
      : 'border-zinc-200 bg-white text-zinc-800 shadow-sm hover:border-zinc-300 hover:bg-zinc-100'
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
  onShare,
  onSave,
  onOpenSettings,
}: Props) {
  return (
    <header
      className={
        isDark
          ? 'flex h-[52px] shrink-0 items-center justify-between border-b border-jsc-border bg-jsc-surface px-4'
          : 'flex h-[52px] shrink-0 items-center justify-between border-b border-zinc-200 bg-white px-4'
      }
    >
      <div className="flex min-w-0 items-center gap-3">
        <a
          href="/"
          className="flex min-w-0 items-center gap-2 no-underline"
          title="JSC — live JavaScript workspace"
        >
          <img
            src="/jsc-mark.svg"
            width={28}
            height={28}
            alt=""
            className="h-7 w-7 shrink-0"
          />
          <span
            className={
              isDark
                ? 'whitespace-nowrap text-[16px] font-bold tracking-tight text-jsc-heading'
                : 'whitespace-nowrap text-[16px] font-bold tracking-tight text-zinc-900'
            }
          >
            JSC
          </span>
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

      <div className="flex items-center gap-2">
        <div className="hidden items-center gap-2 sm:flex">
          <IconBtn label="Share" isDark={isDark} onClick={onShare}>
            <ShareIcon isDark={isDark} />
          </IconBtn>
          <IconBtn label="Save" isDark={isDark} onClick={onSave}>
            <SaveIcon isDark={isDark} />
          </IconBtn>
          <IconBtn label="Settings" isDark={isDark} onClick={onOpenSettings}>
            <GearIcon isDark={isDark} />
          </IconBtn>
        </div>
        <IconBtn
          label="Toggle theme"
          isDark={isDark}
          onClick={onToggleTheme}
        >
          {isDark ? <SunIcon /> : <MoonIcon />}
        </IconBtn>
        <button
          type="button"
          onClick={onRun}
          className={
            'inline-flex items-center gap-2 rounded-md bg-jsc-accent px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-600 focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:outline-none ' +
            (isDark
              ? 'focus:ring-offset-jsc-surface'
              : 'focus:ring-offset-white')
          }
        >
          Run
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

function ShareIcon({ isDark }: { isDark: boolean }) {
  const c = isDark ? '#9aa3b2' : '#3f3f46';
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M12 3v10M8 7l4-4 4 4"
        stroke={c}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SaveIcon({ isDark }: { isDark: boolean }) {
  const c = isDark ? '#9aa3b2' : '#3f3f46';
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 4h12l4 4v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z"
        stroke={c}
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path d="M8 2v4h4" stroke={c} strokeWidth="1.75" strokeLinejoin="round" />
    </svg>
  );
}

function GearIcon({ isDark }: { isDark: boolean }) {
  const c = isDark ? '#9aa3b2' : '#3f3f46';
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M10.3 3.2h3.4l.8 2.2a5 5 0 0 1 1.5.9l2.2-.3 2.4 2.4-1.1 2.1c.1.3.1.5.1.7s0 .4-.1.6l1.1 2.1-2.4 2.4-2.2-.2a5 5 0 0 1-1.4.9l-.8 2.2H10.3l-.7-2.1a5 5 0 0 1-1.5-.9L6 20.1l-2.4-2.4 1-2.1a4 4 0 0 1 0-1.2L3.5 10l2.4-2.4 2.1.2c.4-.3.9-.6 1.4-.8l.9-2.2Z"
        stroke={c}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="2" stroke={c} strokeWidth="1.5" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3v1m0 16v1m9-9h-1M4 12H3m3.2-5.2-.7-.7m12.1 0-.7.7M6.5 6.5l.7.7m10.1 10.1.7.7M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10Z"
        stroke="#cbd5e1"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M20 14.5A8.5 8.5 0 0 1 9.5 4a6.5 6.5 0 1 0 9 10.5Z"
        stroke="#3f3f46"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}
