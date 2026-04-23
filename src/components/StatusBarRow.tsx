import type { SourceFile } from '../types';

type Props = {
  activeFile: SourceFile;
  isDark: boolean;
  saved: boolean;
};

const LANG: Record<SourceFile, string> = {
  'index.html': 'HTML',
  'style.css': 'CSS',
  'script.js': 'JavaScript',
};

export function StatusBarRow({ activeFile, isDark, saved }: Props) {
  const bar = isDark
    ? 'min-h-6 shrink-0 border-t border-jsc-border bg-jsc-elev/90 pb-[max(0.25rem,env(safe-area-inset-bottom,0px))]'
    : 'min-h-6 shrink-0 border-t border-zinc-200 bg-zinc-100 pb-[max(0.25rem,env(safe-area-inset-bottom,0px))]';
  const item = isDark ? 'text-jsc-muted' : 'text-zinc-500';
  return (
    <div
      className={
        bar + ' flex items-center justify-end gap-4 px-3 text-[11px] sm:justify-between'
      }
    >
      <div className={'hidden min-w-0 sm:flex ' + item}>
        {LANG[activeFile]} &nbsp;·&nbsp; 2 spaces &nbsp;·&nbsp; UTF-8
      </div>
      <div
        className={
          item + (saved ? '' : isDark ? ' text-amber-300' : ' text-amber-700')
        }
      >
        {saved ? 'All changes saved' : 'Unsaved…'}
      </div>
    </div>
  );
}
