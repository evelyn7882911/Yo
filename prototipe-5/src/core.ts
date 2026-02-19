import { TreeNode, Action, EditorState } from './types';

let counter = 0;
export const generateId = () => (Date.now() + counter++).toString(36) + Math.random().toString(36).substring(2);

export function parse(text: string, indentSize = 2, expandTab = true): TreeNode[] {
  const lines = text.split('\n');
  const root: TreeNode[] = [];
  const stack: { node: TreeNode; level: number }[] = [];

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    if (expandTab) line = line.replace(/\t/g, ' '.repeat(indentSize));
    const trimmed = line.trimStart();
    const indent = line.length - trimmed.length;
    const level = Math.floor(indent / indentSize);

    if (line.trim() === '') continue;

    while (stack.length && stack[stack.length - 1].level >= level) stack.pop();

    const node: TreeNode = {
      id: generateId(),
      text: trimmed,
      folded: false,
      children: []
    };

    if (stack.length) {
      stack[stack.length - 1].node.children.push(node);
    } else {
      root.push(node);
    }

    stack.push({ node, level });
  }

  return root;
}

export function serialize(nodes: TreeNode[], indentSize = 2, level = 0): string {
  let result = '';
  for (const node of nodes) {
    result += ' '.repeat(level * indentSize) + node.text + '\n';
    if (node.children.length) result += serialize(node.children, indentSize, level + 1);
  }
  return result;
}

export function flattenTree(nodes: TreeNode[]): { node: TreeNode; depth: number; line: number }[] {
  const result: { node: TreeNode; depth: number; line: number }[] = [];
  let line = 0;
  const walk = (list: TreeNode[], depth: number) => {
    for (const node of list) {
      result.push({ node, depth, line: line++ });
      if (!node.folded && node.children.length) walk(node.children, depth + 1);
    }
  };
  walk(nodes, 0);
  return result;
}

export function searchNodes(nodes: TreeNode[], query: string): Set<string> {
  const results = new Set<string>();
  const lower = query.toLowerCase();
  const walk = (list: TreeNode[]) => {
    for (const node of list) {
      if (node.text.toLowerCase().includes(lower)) results.add(node.id);
      if (node.children.length) walk(node.children);
    }
  };
  walk(nodes);
  return results;
}

export function unfoldToNode(nodes: TreeNode[], targetId: string): TreeNode[] {
  const unfold = (list: TreeNode[]): TreeNode[] =>
    list.map(node => {
      if (node.id === targetId) return node;
      let found = false;
      const newChildren = node.children.map(child => {
        const [res] = unfold([child]);
        if (res !== child) found = true;
        return res;
      });
      if (found) return { ...node, folded: false, children: newChildren };
      return node;
    });
  return unfold(nodes);
}

export function findParent(nodes: TreeNode[], childId: string): TreeNode | null {
  for (const node of nodes) {
    if (node.children.some(c => c.id === childId)) return node;
    const found = findParent(node.children, childId);
    if (found) return found;
  }
  return null;
}

export function findFirstChild(nodes: TreeNode[], parentId: string): TreeNode | null {
  const parent = findNode(nodes, parentId);
  return parent?.children[0] || null;
}

export function findNode(nodes: TreeNode[], nodeId: string): TreeNode | null {
  for (const node of nodes) {
    if (node.id === nodeId) return node;
    const found = findNode(node.children, nodeId);
    if (found) return found;
  }
  return null;
}

export const toggleFold = (nodes: TreeNode[], nodeId: string): TreeNode[] =>
  nodes.map(node => {
    if (node.id === nodeId) return { ...node, folded: !node.folded };
    if (node.children.length) return { ...node, children: toggleFold(node.children, nodeId) };
    return node;
  });

export const foldAll = (nodes: TreeNode[]): TreeNode[] =>
  nodes.map(node => ({
    ...node,
    folded: node.children.length > 0,
    children: foldAll(node.children)
  }));

export const unfoldAll = (nodes: TreeNode[]): TreeNode[] =>
  nodes.map(node => ({
    ...node,
    folded: false,
    children: unfoldAll(node.children)
  }));

export function editorReducer(state: EditorState, action: Action): EditorState {
  switch (action.type) {
    case 'SET_TREE':
      return { ...state, tree: action.payload };
    case 'MOVE_CURSOR': {
      const { nodeId, offset, index = state.activeCursor } = action.payload;
      const nc = [...state.cursors];
      if (index >= 0 && index < nc.length) nc[index] = { nodeId, offset };
      return { ...state, cursors: nc };
    }
    case 'ADD_CURSOR':
      return { ...state, cursors: [...state.cursors, action.payload] };
    case 'REMOVE_CURSOR':
      return { ...state, cursors: state.cursors.filter((_, i) => i !== action.payload) };
    case 'SET_CURSORS':
      return { ...state, cursors: action.payload, activeCursor: 0 };
    case 'SET_ACTIVE_CURSOR':
      return { ...state, activeCursor: action.payload };
    case 'SET_MODE':
      return { ...state, mode: action.payload };
    case 'PUSH_KEY':
      return { ...state, keyBuffer: [...state.keyBuffer, action.payload] };
    case 'CLEAR_KEY_BUFFER':
      return { ...state, keyBuffer: [] };
    case 'TOGGLE_FOLD':
      return { ...state, tree: toggleFold(state.tree, action.payload) };
    case 'FOLD_ALL':
      return { ...state, tree: foldAll(state.tree) };
    case 'UNFOLD_ALL':
      return { ...state, tree: unfoldAll(state.tree) };
    case 'SET_SEARCH':
      return { ...state, searchQuery: action.payload };
    case 'SET_SEARCH_RESULTS':
      return { ...state, searchResults: action.payload };
    case 'ADD_BOOKMARK':
      return { ...state, bookmarks: [...state.bookmarks, action.payload] };
    case 'REMOVE_BOOKMARK':
      return { ...state, bookmarks: state.bookmarks.filter(b => b.nodeId !== action.payload) };
    case 'TOGGLE_ZEN_MODE':
      return { ...state, zenMode: !state.zenMode };
    case 'SET_FILTER_TEXT':
      return { ...state, filterText: action.payload };
    case 'SET_SHOW_FILTER':
      return { ...state, showFilter: action.payload };
    case 'SET_SHOW_SEARCH':
      return { ...state, showSearch: action.payload };
    case 'GO_TO_PARENT': {
      const cur = state.cursors[state.activeCursor]?.nodeId;
      if (!cur) return state;
      const p = findParent(state.tree, cur);
      if (p) {
        const nc = [...state.cursors];
        nc[state.activeCursor] = { nodeId: p.id, offset: 0 };
        return { ...state, cursors: nc };
      }
      return state;
    }
    case 'GO_TO_FIRST_CHILD': {
      const cur = state.cursors[state.activeCursor]?.nodeId;
      if (!cur) return state;
      const c = findFirstChild(state.tree, cur);
      if (c) {
        const nc = [...state.cursors];
        nc[state.activeCursor] = { nodeId: c.id, offset: 0 };
        return { ...state, cursors: nc };
      }
      return state;
    }
    case 'SET_INDENT_SIZE':
      return { ...state, indentSize: action.payload };
    case 'SET_EXPAND_TAB':
      return { ...state, expandTab: action.payload };
    case 'SET_LIGHT_HIGHLIGHT':
      return { ...state, lightHighlight: action.payload };
    default:
      return state;
  }
}