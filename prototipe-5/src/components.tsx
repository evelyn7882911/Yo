import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useEditorStore, useVirtual, useKeymap } from './hooks';
import { findNode, findParent, flattenTree, parse, searchNodes, unfoldToNode } from './core';
import { highlightLine } from './utils';
import { TreeNode } from './types';

declare const acquireVsCodeApi: any;
const vscode = acquireVsCodeApi();
const lineHeight = 22;

const Breadcrumbs: React.FC<{ path: TreeNode[] }> = ({ path }) => {
  if (!path.length) return null;
  return (
    <div className="breadcrumbs">
      {path.map((node, i) => (
        <span key={node.id} className="breadcrumb-item">
          {i > 0 && <span className="separator">›</span>}
          <span className="breadcrumb-text" title={node.text}>
            {node.text.slice(0, 30)}
          </span>
        </span>
      ))}
    </div>
  );
};

const FilterBar: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [text, setText] = useState('');
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);
    vscode.postMessage({ type: 'setFilter', text: e.target.value });
  };
  return (
    <div className="filter-bar">
      <input value={text} onChange={handleChange} placeholder="Filter lines..." autoFocus />
      <button onClick={onClose}>✕</button>
    </div>
  );
};

const SearchBar: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [query, setQuery] = useState('');
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    vscode.postMessage({ type: 'setSearch', query });
    onClose();
  };
  return (
    <form className="search-bar" onSubmit={handleSubmit}>
      <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search..." autoFocus />
      <button type="submit">🔍</button>
      <button type="button" onClick={onClose}>✕</button>
    </form>
  );
};

const Minimap: React.FC<{ lines: { node: any; depth: number }[]; height: number }> = ({ lines, height }) => {
  const blockHeight = height / lines.length;
  return (
    <div className="minimap" style={{ height }}>
      {lines.map((line, i) => (
        <div
          key={i}
          className="minimap-block"
          style={{
            height: blockHeight,
            backgroundColor: line.depth === 0 ? '#007acc' : '#3e3e42',
            opacity: 0.5
          }}
        />
      ))}
    </div>
  );
};

const StatusBar: React.FC<{ mode: string; zen: boolean; onToggleZen: () => void }> = ({ mode, zen, onToggleZen }) => (
  <div className="status-bar">
    <span className={`mode ${mode}`}>{mode.toUpperCase()}</span>
    <span className="zen-toggle" onClick={onToggleZen}>
      {zen ? 'Zen On' : 'Zen Off'}
    </span>
  </div>
);

const WhichKey: React.FC<{ buffer: string[] }> = ({ buffer }) => (
  <div className="which-key">
    <div>Leader: {buffer.join(' ')}</div>
    <div className="options">
      <span>c a → Toggle Fold</span>
      <span>c f → Fold All</span>
      <span>c o → Unfold All</span>
      <span>s → Search</span>
      <span>z → Zen Mode</span>
      <span>b → Filter</span>
    </div>
  </div>
);

export const Editor: React.FC<{ initialContent: string; fileName: string }> = ({ initialContent, fileName }) => {
  const [state, dispatch] = useEditorStore();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tree = parse(initialContent, state.indentSize, state.expandTab);
    dispatch({ type: 'SET_TREE', payload: tree });
  }, [initialContent, state.indentSize, state.expandTab]);

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      const msg = e.data;
      if (msg.type === 'update') {
        const tree = parse(msg.content, state.indentSize, state.expandTab);
        dispatch({ type: 'SET_TREE', payload: tree });
      } else if (msg.type === 'config') {
        dispatch({ type: 'SET_INDENT_SIZE', payload: msg.config.indentSize });
        dispatch({ type: 'SET_EXPAND_TAB', payload: msg.config.expandTab });
        dispatch({ type: 'SET_LIGHT_HIGHLIGHT', payload: msg.config.lightHighlight });
      }
    };
    window.addEventListener('message', handler);
    vscode.postMessage({ type: 'ready' });
    return () => window.removeEventListener('message', handler);
  }, []);

  useEffect(() => {
    const saved = vscode.getState();
    if (saved) {
      dispatch({ type: 'SET_CURSORS', payload: saved.cursors || [] });
      dispatch({ type: 'SET_BOOKMARKS', payload: saved.bookmarks || [] });
    }
  }, []);

  useEffect(() => {
    vscode.setState({
      cursors: state.cursors,
      bookmarks: state.bookmarks
    });
  }, [state.cursors, state.bookmarks]);

  const visualLines = useMemo(() => {
    let lines = flattenTree(state.tree);
    if (state.filterText) {
      lines = lines.filter(v => v.node.text.toLowerCase().includes(state.filterText.toLowerCase()));
    }
    return lines;
  }, [state.tree, state.filterText]);

  const virt = useVirtual(ref, visualLines.length, lineHeight);

  useEffect(() => {
    if (state.searchQuery) {
      const results = searchNodes(state.tree, state.searchQuery);
      dispatch({ type: 'SET_SEARCH_RESULTS', payload: results });
      let newTree = state.tree;
      results.forEach(id => (newTree = unfoldToNode(newTree, id)));
      dispatch({ type: 'SET_TREE', payload: newTree });
    }
  }, [state.searchQuery]);

  const keymap = {
    ' ': {
      c: { a: 'toggleFold', f: 'foldAll', o: 'unfoldAll' },
      s: 'toggleSearch',
      z: 'toggleZen',
      b: 'toggleFilter'
    },
    j: 'moveDown',
    k: 'moveUp',
    h: 'goToParent',
    l: 'goToFirstChild',
    '/': 'searchMode',
    'Ctrl+f2': 'toggleBookmark',
    f2: 'nextBookmark',
    'Shift+f2': 'prevBookmark'
  };

  const handleAction = useCallback((action: string) => {
    switch (action) {
      case 'toggleFold':
        if (state.cursors[state.activeCursor]) {
          dispatch({ type: 'TOGGLE_FOLD', payload: state.cursors[state.activeCursor].nodeId });
        }
        break;
      case 'foldAll':
        dispatch({ type: 'FOLD_ALL' });
        break;
      case 'unfoldAll':
        dispatch({ type: 'UNFOLD_ALL' });
        break;
      case 'moveDown': {
        const i = visualLines.findIndex(v => v.node.id === state.cursors[state.activeCursor]?.nodeId);
        if (i >= 0 && i < visualLines.length - 1) {
          dispatch({ type: 'MOVE_CURSOR', payload: { nodeId: visualLines[i + 1].node.id, offset: 0 } });
        }
        break;
      }
      case 'moveUp': {
        const i = visualLines.findIndex(v => v.node.id === state.cursors[state.activeCursor]?.nodeId);
        if (i > 0) {
          dispatch({ type: 'MOVE_CURSOR', payload: { nodeId: visualLines[i - 1].node.id, offset: 0 } });
        }
        break;
      }
      case 'goToParent':
        dispatch({ type: 'GO_TO_PARENT' });
        break;
      case 'goToFirstChild':
        dispatch({ type: 'GO_TO_FIRST_CHILD' });
        break;
      case 'searchMode':
        dispatch({ type: 'SET_SHOW_SEARCH', payload: true });
        break;
      case 'toggleSearch':
        dispatch({ type: 'SET_SHOW_SEARCH', payload: !state.showSearch });
        break;
      case 'toggleZen':
        dispatch({ type: 'TOGGLE_ZEN_MODE' });
        break;
      case 'toggleFilter':
        dispatch({ type: 'SET_SHOW_FILTER', payload: !state.showFilter });
        break;
      case 'toggleBookmark': {
        const id = state.cursors[state.activeCursor]?.nodeId;
        if (id) {
          const exists = state.bookmarks.some(b => b.nodeId === id);
          if (exists) {
            dispatch({ type: 'REMOVE_BOOKMARK', payload: id });
          } else {
            const line = visualLines.findIndex(v => v.node.id === id);
            dispatch({ type: 'ADD_BOOKMARK', payload: { nodeId: id, line } });
          }
        }
        break;
      }
      case 'nextBookmark': {
        if (state.bookmarks.length === 0) break;
        const currentIdx = visualLines.findIndex(v => v.node.id === state.cursors[state.activeCursor]?.nodeId);
        const nextBookmark = state.bookmarks.find(b => b.line > currentIdx) || state.bookmarks[0];
        const nextNode = visualLines[nextBookmark.line]?.node;
        if (nextNode) {
          dispatch({ type: 'SET_CURSORS', payload: [{ nodeId: nextNode.id, offset: 0 }] });
        }
        break;
      }
      case 'prevBookmark': {
        if (state.bookmarks.length === 0) break;
        const currentIdx = visualLines.findIndex(v => v.node.id === state.cursors[state.activeCursor]?.nodeId);
        const prevBookmark = [...state.bookmarks].reverse().find(b => b.line < currentIdx) || state.bookmarks[state.bookmarks.length - 1];
        const prevNode = visualLines[prevBookmark.line]?.node;
        if (prevNode) {
          dispatch({ type: 'SET_CURSORS', payload: [{ nodeId: prevNode.id, offset: 0 }] });
        }
        break;
      }
    }
  }, [state.cursors, state.activeCursor, visualLines, state.bookmarks]);

  useKeymap(keymap, handleAction, 1000);

  const handleLineClick = (e: React.MouseEvent, nodeId: string) => {
    if (e.ctrlKey || e.metaKey) {
      dispatch({ type: 'ADD_CURSOR', payload: { nodeId, offset: 0 } });
    } else {
      dispatch({ type: 'SET_CURSORS', payload: [{ nodeId, offset: 0 }] });
      dispatch({ type: 'SET_ACTIVE_CURSOR', payload: 0 });
    }
  };

  const renderLine = (idx: number) => {
    const vl = visualLines[idx];
    if (!vl) return null;

    const isCursor = state.cursors.some(c => c.nodeId === vl.node.id);
    const isBookmarked = state.bookmarks.some(b => b.nodeId === vl.node.id);
    const isSearchResult = state.searchResults.has(vl.node.id);
    const rel = idx === visualLines.findIndex(v => v.node.id === state.cursors[state.activeCursor]?.nodeId) ? 0 : Math.abs(idx - visualLines.findIndex(v => v.node.id === state.cursors[state.activeCursor]?.nodeId));

    return (
      <div
        key={vl.node.id}
        className={`line ${isCursor ? 'cursor' : ''} ${isBookmarked ? 'bookmarked' : ''} ${isSearchResult ? 'search-result' : ''}`}
        style={{ paddingLeft: vl.depth * state.indentSize * 10, height: lineHeight }}
        onClick={(e) => handleLineClick(e, vl.node.id)}
      >
        <span className="gutter">{rel}</span>
        <span className="content">{highlightLine(vl.node.text, fileName.split('.').pop(), state.lightHighlight)}</span>
        {Array.from({ length: vl.depth }).map((_, i) => (
          <div
            key={i}
            className="guide"
            style={{ left: i * state.indentSize * 10 + 10 }}
            onClick={() => {
              let targetId = vl.node.id;
              let targetDepth = vl.depth;
              while (targetDepth > i) {
                const parent = visualLines.find(v => v.node.children.some(c => c.id === targetId));
                if (!parent) break;
                targetId = parent.node.id;
                targetDepth--;
              }
              dispatch({ type: 'TOGGLE_FOLD', payload: targetId });
            }}
          />
        ))}
      </div>
    );
  };

  const currentPath = useMemo(() => {
    const id = state.cursors[state.activeCursor]?.nodeId;
    if (!id) return [];
    const path = [];
    let node = findNode(state.tree, id);
    while (node) {
      path.unshift(node);
      node = findParent(state.tree, node.id);
    }
    return path;
  }, [state.tree, state.cursors]);

  return (
    <div className={`editor-container ${state.zenMode ? 'zen' : ''}`}>
      <Breadcrumbs path={currentPath} />
      {state.showSearch && <SearchBar onClose={() => dispatch({ type: 'SET_SHOW_SEARCH', payload: false })} />}
      {state.showFilter && <FilterBar onClose={() => dispatch({ type: 'SET_SHOW_FILTER', payload: false })} />}
      <div className="editor-main">
        <div className="viewport" ref={ref} tabIndex={0}>
          <div style={{ height: virt.totalHeight, position: 'relative' }}>
            <div style={{ position: 'absolute', top: virt.offsetY, left: 0, right: 0 }}>
              {virt.visible.map(idx => renderLine(idx))}
            </div>
          </div>
        </div>
        {!state.zenMode && <Minimap lines={visualLines} height={ref.current?.clientHeight || 500} />}
      </div>
      {state.keyBuffer.length > 0 && <WhichKey buffer={state.keyBuffer} />}
      <StatusBar mode={state.mode} zen={state.zenMode} onToggleZen={() => dispatch({ type: 'TOGGLE_ZEN_MODE' })} />
    </div>
  );
};