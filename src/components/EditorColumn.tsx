import { useEffect, useRef } from 'react';
import Editor, { type OnMount } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import type { SourceFile } from '../types';

type Props = {
  file: SourceFile;
  value: string;
  onChange: (v: string) => void;
  isDark: boolean;
  fontSize: number;
  tabSize: number;
  lineNumbers: boolean;
  onFocus: () => void;
  /** Column separator: right on desktop, bottom when stacked (mobile). */
  hasSeparatorAfter: boolean;
};

const LANG: Record<SourceFile, string> = {
  'index.html': 'html',
  'style.css': 'css',
  'script.js': 'javascript',
};

export function EditorColumn({
  file,
  value,
  onChange,
  isDark,
  fontSize,
  tabSize,
  lineNumbers,
  onFocus,
  hasSeparatorAfter,
}: Props) {
  const monacoRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  const onMount: OnMount = (ed) => {
    monacoRef.current = ed;
    ed.updateOptions({
      fontSize,
      tabSize,
      insertSpaces: true,
      lineNumbers: lineNumbers ? 'on' : 'off',
      wordWrap: 'on',
      minimap: { enabled: false },
      padding: { top: 8, bottom: 8 },
      scrollBeyondLastLine: false,
      smoothScrolling: true,
    });
  };

  useEffect(() => {
    monacoRef.current?.updateOptions({
      fontSize,
      tabSize,
      lineNumbers: lineNumbers ? 'on' : 'off',
    });
  }, [fontSize, tabSize, lineNumbers]);

  const edge = isDark ? 'border-jsc-border' : 'border-zinc-200';

  return (
    <div
      className={
        'flex h-full min-h-[200px] min-w-0 flex-1 flex-col md:min-h-0 ' +
        edge +
        (hasSeparatorAfter ? ' max-md:border-b md:border-r' : '') +
        ' max-md:border-r-0'
      }
    >
      <div
        className={
          isDark
            ? 'shrink-0 select-none border-b ' +
              edge +
              ' bg-[#0c0d12] px-3 py-1.5 text-xs font-medium text-jsc-muted'
            : 'shrink-0 select-none border-b ' +
              edge +
              ' bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-500'
        }
      >
        {file}
      </div>
      <div
        className="monaco-wrap min-h-0 min-w-0 flex-1"
        onFocus={onFocus}
        tabIndex={-1}
      >
        <Editor
          className="h-full"
          defaultLanguage={LANG[file]}
          path={file}
          value={value}
          theme={isDark ? 'vs-dark' : 'light'}
          onChange={(v) => onChange(v ?? '')}
          onMount={onMount}
          options={{
            fontSize,
            tabSize,
            automaticLayout: true,
            readOnly: false,
            renderWhitespace: 'none',
            cursorBlinking: 'smooth',
            smoothScrolling: true,
            scrollbar: { verticalScrollbarSize: 8, horizontalScrollbarSize: 8 },
          }}
        />
      </div>
    </div>
  );
}
