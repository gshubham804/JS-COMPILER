export type SourceFile = 'index.html' | 'style.css' | 'script.js';

export type ProjectFiles = {
  'index.html': string;
  'style.css': string;
  'script.js': string;
};

/** Which workbench panes are visible (can mix, e.g. only JS + Console). */
export type PaneVisibility = {
  html: boolean;
  css: boolean;
  js: boolean;
  console: boolean;
  preview: boolean;
};

export type OutgoingConsoleMessage = {
  type: 'jsc-console';
  level: 'log' | 'info' | 'warn' | 'error';
  payload: string[];
};
