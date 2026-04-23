import { useCallback, useEffect, type RefObject } from 'react';
import type { OutgoingConsoleMessage } from '../types';

export type ConsoleLine = {
  id: string;
  kind: 'out' | 'err' | 'sys';
  text: string;
};

type Props = {
  isDark: boolean;
  showConsole: boolean;
  showPreview: boolean;
  srcDoc: string;
  iframeKey: number;
  lines: ConsoleLine[];
  onConsoleMessage: (m: OutgoingConsoleMessage) => void;
  onClear: () => void;
  previewTitle?: string;
  iframeRef: RefObject<HTMLIFrameElement | null>;
};

const area = (isDark: boolean) =>
  isDark ? 'border-jsc-border bg-[#080a0d]' : 'border-zinc-200 bg-white';

export function BottomPanes({
  isDark,
  showConsole,
  showPreview,
  srcDoc,
  iframeKey,
  lines,
  onConsoleMessage,
  onClear,
  previewTitle = 'Preview',
  iframeRef,
}: Props) {
  const onMessage = useCallback(
    (e: MessageEvent) => {
      const d = e.data;
      if (!d || d.type !== 'jsc-console') return;
      onConsoleMessage(d as OutgoingConsoleMessage);
    },
    [onConsoleMessage]
  );

  useEffect(() => {
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [onMessage]);

  const a = area(isDark);
  const lineCls =
    (isDark ? 'text-jsc-text' : 'text-zinc-800') + ' font-mono text-[12px]';
  const hasOutputBar = showConsole || showPreview;

  if (!hasOutputBar) {
    return (
      <OffscreenPreviewIframe
        iframeKey={iframeKey}
        srcDoc={srcDoc}
        iframeRef={iframeRef}
      />
    );
  }

  const twoCol = showConsole && showPreview;

  return (
    <>
      <div
        className={
          'grid h-full w-full min-h-0 ' +
          (twoCol
            ? 'grid-cols-1 md:grid-cols-2'
            : 'grid-cols-1')
        }
      >
        {showConsole && (
          <div
            className={
              'flex min-h-0 min-w-0 flex-col border-t ' +
              a +
              (twoCol ? ' md:border-r' : '')
            }
          >
            <div
              className={
                (isDark
                  ? 'border-b border-jsc-border bg-jsc-elev/80'
                  : 'border-b border-zinc-200 bg-zinc-100') +
                ' flex min-h-10 shrink-0 items-center justify-between gap-2 px-3'
              }
            >
              <div className="min-w-0 flex flex-1 flex-col justify-center gap-0.5 sm:flex-row sm:items-baseline sm:gap-2">
                <span
                  className={
                    isDark
                      ? 'text-xs font-medium text-jsc-heading'
                      : 'text-xs font-medium text-zinc-800'
                  }
                >
                  Console
                </span>
                <span
                  className={
                    isDark
                      ? 'text-[10px] text-jsc-muted'
                      : 'text-[10px] text-zinc-500'
                  }
                >
                  Output from your preview (script.js)
                </span>
              </div>
              <button
                type="button"
                onClick={onClear}
                className={
                  isDark
                    ? 'text-[11px] text-jsc-muted hover:text-jsc-text'
                    : 'text-[11px] text-zinc-500 hover:text-zinc-800'
                }
              >
                Clear
              </button>
            </div>
            <div
              className={
                'min-h-0 flex-1 overflow-y-auto p-2 ' +
                (isDark ? 'text-jsc-text' : '')
              }
            >
              {lines.map((ln) => (
                <div
                  key={ln.id}
                  className={
                    lineCls +
                    ' ' +
                    (ln.kind === 'err'
                      ? isDark
                        ? ' text-red-400'
                        : ' text-red-600'
                      : ln.kind === 'sys'
                        ? isDark
                          ? ' text-zinc-500'
                          : ' text-zinc-500'
                        : '') +
                    ' break-words whitespace-pre-wrap'
                  }
                >
                  {ln.text}
                </div>
              ))}
            </div>
          </div>
        )}

        {showPreview && (
          <div className={'flex min-h-0 min-w-0 flex-col border-t ' + a}>
            <div
              className={
                (isDark
                  ? 'border-b border-jsc-border bg-jsc-elev/80'
                  : 'border-b border-zinc-200 bg-zinc-100') +
                ' flex min-h-9 shrink-0 items-center px-3'
              }
            >
              <span
                className={
                  isDark
                    ? 'text-xs font-medium text-jsc-heading'
                    : 'text-xs font-medium text-zinc-800'
                }
              >
                {previewTitle}
              </span>
            </div>
            <div className="min-h-0 min-w-0 flex-1 p-1">
              <iframe
                key={iframeKey}
                ref={iframeRef}
                title="Preview"
                className="h-full w-full rounded border-0"
                style={{
                  background: isDark ? '#0f172a' : '#f8fafc',
                }}
                srcDoc={srcDoc}
                sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups"
              />
            </div>
          </div>
        )}
      </div>

      {!showPreview && (
        <OffscreenPreviewIframe
          iframeKey={iframeKey}
          srcDoc={srcDoc}
          iframeRef={iframeRef}
        />
      )}
    </>
  );
}

/** When Preview is hidden, keep a single iframe off-screen for Run / eval / logs. */
function OffscreenPreviewIframe({
  iframeKey,
  srcDoc,
  iframeRef,
}: {
  iframeKey: number;
  srcDoc: string;
  iframeRef: RefObject<HTMLIFrameElement | null>;
}) {
  return (
    <div
      className="pointer-events-none fixed top-0 left-0 h-px w-px overflow-hidden opacity-0"
      aria-hidden
    >
      <iframe
        key={iframeKey}
        ref={iframeRef}
        title="Preview"
        className="h-px w-px border-0"
        srcDoc={srcDoc}
        sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups"
      />
    </div>
  );
}
