import { useCallback, useRef, type RefObject } from 'react';

type Props = {
  isDark: boolean;
  /** Bottom pane height as a fraction of the workspace (editors + resizer + output). */
  currentRatio: number;
  onChange: (next: number) => void;
  workspaceRef: RefObject<HTMLDivElement | null>;
};

const MIN = 0.12;
const MAX = 0.88;

/**
 * Drag vertically to apportion space between the editor block (top) and output block (bottom).
 * Drag up → more room for the output area.
 */
export function WorkspaceResizer({
  isDark,
  currentRatio,
  onChange,
  workspaceRef,
}: Props) {
  const startY = useRef(0);
  const startRatio = useRef(0);
  const trackH = useRef(1);

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      const root = workspaceRef.current;
      if (!root) return;
      const r = root.getBoundingClientRect();
      trackH.current = Math.max(1, r.height);
      startY.current = e.clientY;
      startRatio.current = currentRatio;
      const bar = e.currentTarget;

      const onMove = (ev: PointerEvent) => {
        const delta = (startY.current - ev.clientY) / trackH.current;
        onChange(
          Math.min(MAX, Math.max(MIN, startRatio.current + delta))
        );
      };
      const onUp = (ev: PointerEvent) => {
        document.removeEventListener('pointermove', onMove);
        document.removeEventListener('pointerup', onUp);
        document.removeEventListener('pointercancel', onUp);
        try {
          bar.releasePointerCapture(ev.pointerId);
        } catch {
          /* ignore */
        }
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
      document.addEventListener('pointermove', onMove);
      document.addEventListener('pointerup', onUp);
      document.addEventListener('pointercancel', onUp);
      document.body.style.cursor = 'row-resize';
      document.body.style.userSelect = 'none';
      bar.setPointerCapture(e.pointerId);
    },
    [currentRatio, onChange, workspaceRef]
  );

  return (
    <div
      className={
        (isDark
          ? 'border-t border-b border-jsc-border/80 bg-jsc-elev/40 hover:border-jsc-accent/50'
          : 'border-t border-b border-zinc-200/90 bg-zinc-100/80 hover:border-blue-300') +
        ' h-1.5 min-h-2.5 shrink-0 touch-manipulation cursor-row-resize py-0.5 md:min-h-0 md:py-0'
      }
      onPointerDown={onPointerDown}
      role="separator"
      aria-orientation="horizontal"
      aria-label="Resize editor and output"
      title="Drag to resize editor and console or preview"
    />
  );
}
