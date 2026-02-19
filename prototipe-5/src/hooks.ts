import { useState, useEffect, RefObject, useRef, useReducer } from 'react';
import { EditorState, Action } from './types';
import { editorReducer } from './core';

export const useEditorStore = () =>
  useReducer(editorReducer, {
    tree: [],
    cursors: [],
    activeCursor: 0,
    mode: 'normal',
    keyBuffer: [],
    searchQuery: '',
    searchResults: new Set(),
    bookmarks: [],
    zenMode: false,
    filterText: '',
    showSearch: false,
    showFilter: false,
    indentSize: 2,
    expandTab: true,
    lightHighlight: false
  });

export function useVirtual(
  containerRef: RefObject<HTMLElement>,
  itemCount: number,
  itemHeight: number,
  overscan = 3
) {
  const [scrollTop, setScrollTop] = useState(0);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onScroll = () => setScrollTop(el.scrollTop);
    const onResize = () => setHeight(el.clientHeight);

    setHeight(el.clientHeight);
    el.addEventListener('scroll', onScroll);
    window.addEventListener('resize', onResize);

    return () => {
      el.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const end = Math.min(itemCount - 1, Math.ceil((scrollTop + height) / itemHeight) + overscan);
  const visible = [];
  for (let i = start; i <= end; i++) visible.push(i);

  return {
    totalHeight: itemCount * itemHeight,
    offsetY: start * itemHeight,
    visible,
    start,
    end
  };
}

type Keymap = Record<string, any>;

export function useKeymap(keymap: Keymap, onAction: (action: string) => void, timeout = 1000) {
  const buf = useRef<string[]>([]);
  const timer = useRef<number>();

  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        buf.current = [];
        if (timer.current) clearTimeout(timer.current);
        return;
      }

      buf.current.push(e.key);

      if (timer.current) clearTimeout(timer.current);
      timer.current = window.setTimeout(() => {
        buf.current = [];
      }, timeout);

      let cur = keymap;
      for (const k of buf.current) {
        if (cur[k] === undefined) {
          buf.current = [];
          return;
        }
        cur = cur[k];
      }

      if (typeof cur === 'string') {
        onAction(cur);
        buf.current = [];
        if (timer.current) clearTimeout(timer.current);
      }
    };

    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [keymap, onAction, timeout]);
}