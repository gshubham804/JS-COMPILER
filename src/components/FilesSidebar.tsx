import type { SourceFile, PaneVisibility } from '../types';

type Props = {
  activeFile: SourceFile;
  onSelectFile: (f: SourceFile) => void;
  isDark: boolean;
  panes: PaneVisibility;
  onTogglePane: (key: keyof PaneVisibility) => void;
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
}: Props) {
  const base =
    'flex h-full w-[240px] shrink-0 flex-col border-r py-3 pl-2 pr-0 text-left';
  const theme = isDark
    ? `${base} border-jsc-border bg-jsc-surface/90`
    : `${base} border-zinc-200 bg-zinc-50/90`;

  const sectionLabel = isDark
    ? 'px-3 pb-2 text-[10px] font-semibold tracking-wider text-jsc-muted uppercase'
    : 'px-3 pb-2 text-[10px] font-semibold tracking-wider text-zinc-500 uppercase';

  return (
    <aside className={theme}>
      <p className={sectionLabel}>Panes</p>
      <p
        className={
          (isDark ? 'text-jsc-muted' : 'text-zinc-500') +
          ' px-3 text-[10px] leading-relaxed'
        }
      >
        Toggle to show or hide. Click a file name to mark it as the active
        file in the status bar. Drag the bar between editors and the output
        area to change height.
      </p>
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
                  'min-w-0 flex-1 truncate py-0.5 text-left text-[13px] ' +
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
        'relative h-5 w-9 shrink-0 cursor-pointer rounded-full border transition ' +
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
