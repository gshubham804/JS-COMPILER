import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { ChangeEvent } from 'react';
import { Check } from 'lucide-react';
import { HeaderBar } from './components/HeaderBar';
import { FilesSidebar } from './components/FilesSidebar';
import { WorkspaceResizer } from './components/WorkspaceResizer';
import { EditorColumn } from './components/EditorColumn';
import {
  BottomPanes,
  type ConsoleLine,
} from './components/BottomPanes';
import { StatusBarRow } from './components/StatusBarRow';
import { SettingsModal } from './components/SettingsModal';
import { buildPreviewDocument } from './lib/previewDocument';
import {
  buildExportData,
  downloadProjectJson,
  parseProjectFile,
} from './lib/projectFile';
import { DEFAULT_FILES } from './constants/defaultProject';
import type {
  OutgoingConsoleMessage,
  PaneVisibility,
  ProjectFiles,
  SourceFile,
} from './types';

const STORAGE = 'jsc-compiler-v1';
const RUN_DEBOUNCE_MS = 420;
const SAVE_DEBOUNCE_MS = 500;
const LINK_COPIED_TOAST_MS = 2600;

const DEFAULT_PANES: PaneVisibility = {
  html: true,
  css: true,
  js: true,
  console: true,
  preview: true,
};

const EDITOR_PANES: { file: SourceFile; key: keyof PaneVisibility }[] = [
  { file: 'index.html', key: 'html' },
  { file: 'style.css', key: 'css' },
  { file: 'script.js', key: 'js' },
];

function loadState(): {
  files: ProjectFiles;
  autoRun: boolean;
  isDark: boolean;
  fontSize: number;
  tabSize: number;
  lineNumbers: boolean;
  panes: PaneVisibility;
  outputPaneRatio: number;
} {
  try {
    const r = localStorage.getItem(STORAGE);
    if (!r) throw new Error();
    const p = JSON.parse(r) as {
      files?: ProjectFiles;
      autoRun?: boolean;
      isDark?: boolean;
      fontSize?: number;
      tabSize?: number;
      lineNumbers?: boolean;
      panes?: PaneVisibility;
      outputPaneRatio?: number;
    };
    if (!p.files) throw new Error();
    return {
      files: p.files,
      autoRun: p.autoRun ?? true,
      isDark: p.isDark ?? true,
      fontSize: p.fontSize ?? 13,
      tabSize: p.tabSize ?? 2,
      lineNumbers: p.lineNumbers ?? true,
      panes: p.panes ?? { ...DEFAULT_PANES },
      outputPaneRatio: clampOutputRatio(p.outputPaneRatio),
    };
  } catch {
    return {
      files: { ...DEFAULT_FILES },
      autoRun: true,
      isDark: true,
      fontSize: 13,
      tabSize: 2,
      lineNumbers: true,
      panes: { ...DEFAULT_PANES },
      outputPaneRatio: 0.52,
    };
  }
}

function clampOutputRatio(n: number | undefined): number {
  if (n === undefined || Number.isNaN(n)) return 0.52;
  return Math.min(0.88, Math.max(0.12, n));
}

function parseHashState(): {
  files: ProjectFiles;
  panes?: PaneVisibility;
  outputPaneRatio?: number;
} | null {
  if (!location.hash.startsWith('#p=')) return null;
  try {
    const b = location.hash.slice(3);
    const json = decodeURIComponent(escape(atob(b)));
    const o = JSON.parse(json) as Record<string, unknown>;

    const wrap = o.files as ProjectFiles | undefined;
    if (
      wrap &&
      typeof wrap['index.html'] === 'string' &&
      typeof wrap['style.css'] === 'string' &&
      typeof wrap['script.js'] === 'string'
    ) {
      return {
        files: wrap,
        panes: o.panes as PaneVisibility | undefined,
        outputPaneRatio:
          typeof o.outputPaneRatio === 'number'
            ? clampOutputRatio(o.outputPaneRatio)
            : undefined,
      };
    }
    if (
      typeof o['index.html'] === 'string' &&
      typeof o['style.css'] === 'string' &&
      typeof o['script.js'] === 'string'
    ) {
      return {
        files: o as unknown as ProjectFiles,
        outputPaneRatio:
          typeof o.outputPaneRatio === 'number'
            ? clampOutputRatio(o.outputPaneRatio)
            : undefined,
      };
    }
  } catch {
    /* ignore */
  }
  return null;
}

function newLine(
  kind: ConsoleLine['kind'],
  text: string
): ConsoleLine {
  return { id: crypto.randomUUID(), kind, text };
}

function App() {
  const init = useMemo(() => loadState(), []);
  const hashFiles = useMemo(() => parseHashState(), []);
  const [files, setFiles] = useState<ProjectFiles>(
    () => hashFiles?.files ?? init.files
  );
  const [panes, setPanes] = useState<PaneVisibility>(() =>
    hashFiles
      ? (hashFiles.panes ?? { ...DEFAULT_PANES })
      : init.panes
  );
  const [activeFile, setActiveFile] = useState<SourceFile>('script.js');
  const [autoRun, setAutoRun] = useState(init.autoRun);
  const [isDark, setIsDark] = useState(init.isDark);
  const [fontSize, setFontSize] = useState(init.fontSize);
  const [tabSize, setTabSize] = useState(init.tabSize);
  const [lineNumbers, setLineNumbers] = useState(init.lineNumbers);
  const [outputPaneRatio, setOutputPaneRatio] = useState(() =>
    hashFiles?.outputPaneRatio != null
      ? hashFiles.outputPaneRatio
      : init.outputPaneRatio
  );
  const workspaceRef = useRef<HTMLDivElement | null>(null);
  const [srcDoc, setSrcDoc] = useState(() => {
    const f = hashFiles?.files ?? init.files;
    return buildPreviewDocument(f['index.html'], f['style.css'], f['script.js']);
  });
  const [iframeKey, setIframeKey] = useState(0);
  const [lines, setLines] = useState<ConsoleLine[]>(() => []);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [saved, setSaved] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const runTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const linkCopiedToastTimer = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const [linkCopiedToast, setLinkCopiedToast] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const setFile = (name: SourceFile, v: string) => {
    setFiles((f) => ({ ...f, [name]: v }));
    setSaved(false);
  };

  const run = useCallback((fileOverride?: ProjectFiles) => {
    const f = fileOverride ?? files;
    const doc = buildPreviewDocument(
      f['index.html'],
      f['style.css'],
      f['script.js']
    );
    setSrcDoc(doc);
    setIframeKey((k) => k + 1);
    setLines([]);
  }, [files]);

  const onMsg = useCallback((m: OutgoingConsoleMessage) => {
    setLines((prev) => [
      ...prev,
      newLine(
        m.level === 'error' ? 'err' : 'out',
        m.payload.join(' ')
      ),
    ]);
  }, []);

  useLayoutEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      try {
        localStorage.setItem(
          STORAGE,
          JSON.stringify({
            files,
            autoRun,
            isDark,
            fontSize,
            tabSize,
            lineNumbers,
            panes,
            outputPaneRatio,
          })
        );
        setSaved(true);
      } catch {
        setSaved(true);
      }
    }, SAVE_DEBOUNCE_MS);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [files, autoRun, isDark, fontSize, tabSize, lineNumbers, panes, outputPaneRatio]);

  useEffect(() => {
    if (!autoRun) return;
    if (runTimer.current) clearTimeout(runTimer.current);
    runTimer.current = setTimeout(() => {
      run();
    }, RUN_DEBOUNCE_MS);
    return () => {
      if (runTimer.current) clearTimeout(runTimer.current);
    };
  }, [autoRun, files, run]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        run();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [run]);

  useEffect(() => {
    return () => {
      if (linkCopiedToastTimer.current) {
        clearTimeout(linkCopiedToastTimer.current);
        linkCopiedToastTimer.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mobileSidebarOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileSidebarOpen]);

  useEffect(() => {
    if (!mobileSidebarOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileSidebarOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mobileSidebarOpen]);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const onChange = () => {
      if (mq.matches) setMobileSidebarOpen(false);
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const onShare = useCallback(() => {
    const payload = btoa(
      unescape(
        encodeURIComponent(
          JSON.stringify({ files, panes, outputPaneRatio })
        )
      )
    );
    const url = `${location.origin}${location.pathname}#p=${payload}`;
    void navigator.clipboard
      .writeText(url)
      .then(() => {
        if (linkCopiedToastTimer.current) {
          clearTimeout(linkCopiedToastTimer.current);
        }
        setLinkCopiedToast(true);
        linkCopiedToastTimer.current = setTimeout(() => {
          setLinkCopiedToast(false);
          linkCopiedToastTimer.current = null;
        }, LINK_COPIED_TOAST_MS);
      })
      .catch(() => {
        window.alert(
          'Could not copy the link. Your browser may block clipboard access on this page.'
        );
      });
  }, [files, panes, outputPaneRatio]);

  const onDownload = useCallback(() => {
    const data = buildExportData({
      files,
      panes,
      outputPaneRatio,
      autoRun,
      isDark,
      fontSize,
      tabSize,
      lineNumbers,
    });
    const day = new Date().toISOString().slice(0, 10);
    downloadProjectJson(data, `jsc-project-${day}.json`);
    setSaved(true);
  }, [
    files,
    panes,
    outputPaneRatio,
    autoRun,
    isDark,
    fontSize,
    tabSize,
    lineNumbers,
  ]);

  const importInputRef = useRef<HTMLInputElement | null>(null);
  const onUploadClick = useCallback(() => {
    importInputRef.current?.click();
  }, []);

  const onImportFile = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = '';
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const text = String(reader.result ?? '');
        const parsed = parseProjectFile(text);
        if ('error' in parsed) {
          window.alert(parsed.error);
          return;
        }
        const d = parsed.data;
        setFiles(d.files);
        setPanes(d.panes);
        setOutputPaneRatio(d.outputPaneRatio);
        setAutoRun(d.autoRun);
        setIsDark(d.isDark);
        setFontSize(d.fontSize);
        setTabSize(d.tabSize);
        setLineNumbers(d.lineNumbers);
        if (d.panes.js) {
          setActiveFile('script.js');
        } else if (d.panes.html) {
          setActiveFile('index.html');
        } else if (d.panes.css) {
          setActiveFile('style.css');
        } else {
          setActiveFile('script.js');
        }
        setLines([]);
        setSaved(true);
        run(d.files);
        try {
          localStorage.setItem(
            STORAGE,
            JSON.stringify({
              files: d.files,
              autoRun: d.autoRun,
              isDark: d.isDark,
              fontSize: d.fontSize,
              tabSize: d.tabSize,
              lineNumbers: d.lineNumbers,
              panes: d.panes,
              outputPaneRatio: d.outputPaneRatio,
            })
          );
        } catch {
          /* ignore */
        }
      };
      reader.onerror = () => {
        window.alert('Could not read the file.');
      };
      reader.readAsText(file, 'utf-8');
    },
    [run]
  );

  const onTogglePane = (key: keyof PaneVisibility) => {
    setPanes((p) => ({ ...p, [key]: !p[key] }));
    setSaved(false);
    setMobileSidebarOpen(false);
  };

  const onSelectFile = (f: SourceFile) => {
    if (f === 'index.html') {
      setPanes((p) => ({ ...p, html: true }));
    } else if (f === 'style.css') {
      setPanes((p) => ({ ...p, css: true }));
    } else {
      setPanes((p) => ({ ...p, js: true }));
    }
    setActiveFile(f);
    setMobileSidebarOpen(false);
  };

  const onClear = () => {
    setLines([]);
  };

  const themeShell = isDark
    ? 'h-screen min-h-0 w-screen text-jsc-text'
    : 'h-screen min-h-0 w-screen text-zinc-800';

  const hasEditors = panes.html || panes.css || panes.js;
  const hasOutput = panes.console || panes.preview;
  const canResizeWorkspace = hasEditors && hasOutput;
  const visibleEditors = EDITOR_PANES.filter((e) => panes[e.key]);
  const editorCount = visibleEditors.length;
  const editorGridClass =
    editorCount <= 1
      ? 'md:grid-cols-1'
      : editorCount === 2
        ? 'md:grid-cols-2'
        : 'md:grid-cols-3';

  return (
    <div
      className={
        themeShell +
        (isDark
          ? ' bg-jsc-bg'
          : ' bg-zinc-100') +
        ' flex min-w-0 flex-col'
      }
    >
      <a
        href="#main-content"
        className={
          'fixed top-0 left-2 z-200 -translate-y-full rounded-b-md ' +
          'bg-jsc-accent px-3 py-2 text-sm font-medium text-white shadow-lg ' +
          'transition-transform focus:translate-y-0 focus:outline-2 focus:outline-offset-2 ' +
          'focus:outline-white'
        }
      >
        Skip to main content
      </a>
      <input
        ref={importInputRef}
        type="file"
        accept="application/json,.json"
        className="sr-only"
        onChange={onImportFile}
        aria-label="Import JSC project file"
        tabIndex={-1}
      />
      <HeaderBar
        autoRun={autoRun}
        onAutoRun={setAutoRun}
        onRun={() => {
          run();
        }}
        isDark={isDark}
        onToggleTheme={() => setIsDark((d) => !d)}
        onUpload={onUploadClick}
        onDownload={onDownload}
        onShare={onShare}
        onOpenSettings={() => {
          setSettingsOpen(true);
          setMobileSidebarOpen(false);
        }}
        onOpenPanesMenu={() => setMobileSidebarOpen(true)}
      />
      <main
        id="main-content"
        className="flex min-h-0 min-w-0 flex-1 flex-col outline-none"
        tabIndex={-1}
      >
      <div className="relative flex min-h-0 min-w-0 flex-1">
        {mobileSidebarOpen && (
          <button
            type="button"
            className="fixed inset-0 z-40 touch-manipulation bg-black/45 md:hidden"
            aria-label="Close menu"
            onClick={() => setMobileSidebarOpen(false)}
          />
        )}
        <FilesSidebar
          activeFile={activeFile}
          onSelectFile={onSelectFile}
          isDark={isDark}
          panes={panes}
          onTogglePane={onTogglePane}
          autoRun={autoRun}
          onAutoRun={setAutoRun}
          mobileOpen={mobileSidebarOpen}
          onRequestClose={() => setMobileSidebarOpen(false)}
        />
        <div
          ref={workspaceRef}
          className="flex min-h-0 min-w-0 flex-1 flex-col"
        >
          {hasEditors && (
            <div
              className="flex min-h-0 min-w-0 flex-col overflow-y-auto overflow-x-hidden md:overflow-hidden"
              style={
                canResizeWorkspace
                  ? { flex: `${1 - outputPaneRatio} 1 0%`, minHeight: 0 }
                  : { flex: '1 1 0%', minHeight: 0 }
              }
            >
              <div
                className={
                  'grid min-h-0 min-w-0 flex-1 grid-cols-1 ' +
                  editorGridClass +
                  ' max-md:h-auto max-md:min-h-0 md:h-full'
                }
              >
                {visibleEditors.map((e, i) => (
                  <EditorColumn
                    key={e.file}
                    file={e.file}
                    value={files[e.file]}
                    onChange={(v) => setFile(e.file, v)}
                    isDark={isDark}
                    fontSize={fontSize}
                    tabSize={tabSize}
                    lineNumbers={lineNumbers}
                    onFocus={() => setActiveFile(e.file)}
                    hasSeparatorAfter={i < editorCount - 1}
                  />
                ))}
              </div>
            </div>
          )}

          {canResizeWorkspace && (
            <WorkspaceResizer
              isDark={isDark}
              workspaceRef={workspaceRef}
              currentRatio={outputPaneRatio}
              onChange={(r) => {
                setOutputPaneRatio(r);
                setSaved(false);
              }}
            />
          )}

          {hasOutput && (
            <div
              className="flex min-h-0 min-w-0 flex-col"
              style={
                canResizeWorkspace
                  ? { flex: `${outputPaneRatio} 1 0%`, minHeight: 0 }
                  : { flex: '1 1 0%', minHeight: 0 }
              }
            >
              <div className="h-full min-h-0 w-full min-w-0">
                <BottomPanes
                  isDark={isDark}
                  showConsole={panes.console}
                  showPreview={panes.preview}
                  srcDoc={srcDoc}
                  iframeKey={iframeKey}
                  lines={lines}
                  onConsoleMessage={onMsg}
                  onClear={onClear}
                  iframeRef={iframeRef}
                />
              </div>
            </div>
          )}

          {!hasOutput && (
            <div className="h-0 w-full shrink-0">
              <BottomPanes
                isDark={isDark}
                showConsole={false}
                showPreview={false}
                srcDoc={srcDoc}
                iframeKey={iframeKey}
                lines={lines}
                onConsoleMessage={onMsg}
                onClear={onClear}
                iframeRef={iframeRef}
              />
            </div>
          )}
        </div>
      </div>
      {linkCopiedToast && (
        <div
          className="pointer-events-none fixed top-[max(1rem,env(safe-area-inset-top,0px)+3.25rem)] left-1/2 z-100 -translate-x-1/2 px-3 sm:top-14"
          role="status"
          aria-live="polite"
        >
          <div
            className={
              isDark
                ? 'inline-flex max-w-md items-center gap-2 rounded-lg border border-jsc-border bg-jsc-elev/95 px-3 py-2 text-sm text-jsc-text shadow-lg backdrop-blur-sm'
                : 'inline-flex max-w-md items-center gap-2 rounded-lg border border-zinc-200 bg-white/95 px-3 py-2 text-sm text-zinc-800 shadow-lg backdrop-blur-sm'
            }
          >
            <Check
              className={
                isDark
                  ? 'h-4 w-4 shrink-0 text-emerald-400'
                  : 'h-4 w-4 shrink-0 text-emerald-600'
              }
              strokeWidth={2.25}
              aria-hidden
            />
            <span>Link copied to clipboard</span>
          </div>
        </div>
      )}
      <StatusBarRow
        activeFile={activeFile}
        isDark={isDark}
        saved={saved}
      />
      </main>
      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        fontSize={fontSize}
        onFontSize={setFontSize}
        tabSize={tabSize}
        onTabSize={setTabSize}
        lineNumbers={lineNumbers}
        onLineNumbers={setLineNumbers}
        isDark={isDark}
      />
    </div>
  );
}

export default App;
