import type { PaneVisibility, ProjectFiles } from '../types';

export const JSC_EXPORT_VERSION = 1 as const;
export const JSC_MIME = 'application/json' as const;
export const JSC_FILE_EXTENSION = '.json' as const;

export type JscProjectExport = {
  jsc: true;
  version: typeof JSC_EXPORT_VERSION;
  exportedAt: string;
  files: ProjectFiles;
  panes: PaneVisibility;
  outputPaneRatio: number;
  autoRun: boolean;
  isDark: boolean;
  fontSize: number;
  tabSize: number;
  lineNumbers: boolean;
};

export function buildExportData(args: {
  files: ProjectFiles;
  panes: PaneVisibility;
  outputPaneRatio: number;
  autoRun: boolean;
  isDark: boolean;
  fontSize: number;
  tabSize: number;
  lineNumbers: boolean;
}): JscProjectExport {
  return {
    jsc: true,
    version: JSC_EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    ...args,
  };
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

export function parseProjectFile(text: string): {
  data: JscProjectExport;
} | { error: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text) as unknown;
  } catch {
    return { error: 'Invalid JSON' };
  }
  if (!isRecord(parsed)) {
    return { error: 'Root must be an object' };
  }
  if (parsed.jsc !== true) {
    return { error: 'Not a JSC project file' };
  }
  if (parsed.version !== 1) {
    return { error: 'Unsupported file version' };
  }
  const files = parsed.files as ProjectFiles | undefined;
  if (!files || typeof files['index.html'] !== 'string' || typeof files['style.css'] !== 'string' || typeof files['script.js'] !== 'string') {
    return { error: 'Invalid or missing files' };
  }
  const panes = parsed.panes as PaneVisibility | undefined;
  if (!panes || typeof panes.html !== 'boolean' || typeof panes.css !== 'boolean' || typeof panes.js !== 'boolean' || typeof panes.console !== 'boolean' || typeof panes.preview !== 'boolean') {
    return { error: 'Invalid or missing panes' };
  }
  const rawRatio = typeof parsed.outputPaneRatio === 'number' ? parsed.outputPaneRatio : 0.52;
  const outputPaneRatio = Math.min(0.88, Math.max(0.12, rawRatio));
  return {
    data: {
      jsc: true,
      version: 1,
      exportedAt: typeof parsed.exportedAt === 'string' ? parsed.exportedAt : new Date().toISOString(),
      files,
      panes,
      outputPaneRatio,
      autoRun: typeof parsed.autoRun === 'boolean' ? parsed.autoRun : true,
      isDark: typeof parsed.isDark === 'boolean' ? parsed.isDark : true,
      fontSize: typeof parsed.fontSize === 'number' && parsed.fontSize >= 8 && parsed.fontSize <= 32 ? parsed.fontSize : 13,
      tabSize: typeof parsed.tabSize === 'number' && parsed.tabSize >= 1 && parsed.tabSize <= 8 ? parsed.tabSize : 2,
      lineNumbers: typeof parsed.lineNumbers === 'boolean' ? parsed.lineNumbers : true,
    },
  };
}

export function downloadProjectJson(data: JscProjectExport, filename = 'jsc-project.json'): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: `${JSC_MIME};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  a.click();
  URL.revokeObjectURL(url);
}
