type Props = {
  open: boolean;
  onClose: () => void;
  fontSize: number;
  onFontSize: (n: number) => void;
  tabSize: number;
  onTabSize: (n: number) => void;
  lineNumbers: boolean;
  onLineNumbers: (v: boolean) => void;
  isDark: boolean;
};

export function SettingsModal({
  open,
  onClose,
  fontSize,
  onFontSize,
  tabSize,
  onTabSize,
  lineNumbers,
  onLineNumbers,
  isDark,
}: Props) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-label="Close settings"
      />
      <div
        className={
          isDark
            ? 'relative w-full max-w-sm rounded-lg border border-jsc-border bg-jsc-elev p-5 shadow-xl'
            : 'relative w-full max-w-sm rounded-lg border border-zinc-200 bg-white p-5 shadow-xl'
        }
      >
        <h2
          id="settings-title"
          className={
            isDark
              ? 'text-lg font-semibold text-jsc-heading'
              : 'text-lg font-semibold text-zinc-900'
          }
        >
          Settings
        </h2>
        <p
          className={
            isDark
              ? 'mt-1 text-sm text-jsc-muted'
              : 'mt-1 text-sm text-zinc-500'
          }
        >
          Editor preferences
        </p>
        <div className="mt-4 space-y-4">
          <label className="flex items-center justify-between gap-2 text-sm">
            <span className={isDark ? 'text-jsc-text' : 'text-zinc-800'}>
              Font size
            </span>
            <input
              type="number"
              min={10}
              max={22}
              className={
                isDark
                  ? 'w-20 rounded border border-jsc-border bg-jsc-surface px-2 py-1 text-jsc-text'
                  : 'w-20 rounded border border-zinc-200 bg-white px-2 py-1'
              }
              value={fontSize}
              onChange={(e) => onFontSize(Number(e.target.value) || 13)}
            />
          </label>
          <label className="flex items-center justify-between gap-2 text-sm">
            <span className={isDark ? 'text-jsc-text' : 'text-zinc-800'}>
              Tab size
            </span>
            <input
              type="number"
              min={1}
              max={8}
              className={
                isDark
                  ? 'w-20 rounded border border-jsc-border bg-jsc-surface px-2 py-1 text-jsc-text'
                  : 'w-20 rounded border border-zinc-200 bg-white px-2 py-1'
              }
              value={tabSize}
              onChange={(e) => onTabSize(Number(e.target.value) || 2)}
            />
          </label>
          <label className="flex items-center justify-between gap-2 text-sm">
            <span className={isDark ? 'text-jsc-text' : 'text-zinc-800'}>
              Line numbers
            </span>
            <input
              type="checkbox"
              checked={lineNumbers}
              onChange={(e) => onLineNumbers(e.target.checked)}
            />
          </label>
        </div>
        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-jsc-accent px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-600"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
