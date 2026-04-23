import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
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

  const setFile = (name: SourceFile, v: string) => {
    setFiles((f) => ({ ...f, [name]: v }));
    setSaved(false);
  };

  const run = useCallback(() => {
    const doc = buildPreviewDocument(
      files['index.html'],
      files['style.css'],
      files['script.js']
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

  const onShare = useCallback(() => {
    const payload = btoa(
      unescape(
        encodeURIComponent(
          JSON.stringify({ files, panes, outputPaneRatio })
        )
      )
    );
    const url = `${location.origin}${location.pathname}#p=${payload}`;
    void navigator.clipboard.writeText(url);
  }, [files, panes, outputPaneRatio]);

  const onTogglePane = (key: keyof PaneVisibility) => {
    setPanes((p) => ({ ...p, [key]: !p[key] }));
    setSaved(false);
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
      <HeaderBar
        autoRun={autoRun}
        onAutoRun={setAutoRun}
        onRun={run}
        isDark={isDark}
        onToggleTheme={() => setIsDark((d) => !d)}
        onShare={onShare}
        onSave={() => {
          setSaved(true);
        }}
        onOpenSettings={() => setSettingsOpen(true)}
      />
      <div className="flex min-h-0 min-w-0 flex-1">
        <FilesSidebar
          activeFile={activeFile}
          onSelectFile={onSelectFile}
          isDark={isDark}
          panes={panes}
          onTogglePane={onTogglePane}
        />
        <div
          ref={workspaceRef}
          className="flex min-h-0 min-w-0 flex-1 flex-col"
        >
          {hasEditors && (
            <div
              className="flex min-h-0 min-w-0 flex-col"
              style={
                canResizeWorkspace
                  ? { flex: `${1 - outputPaneRatio} 1 0%`, minHeight: 0 }
                  : { flex: '1 1 0%', minHeight: 0 }
              }
            >
              <div
                className="grid h-full min-h-0 min-w-0 flex-1"
                style={{
                  gridTemplateColumns: `repeat(${editorCount}, minmax(0, 1fr))`,
                }}
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
                    showRightBorder={i < editorCount - 1}
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
      <StatusBarRow
        activeFile={activeFile}
        isDark={isDark}
        saved={saved}
      />
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
