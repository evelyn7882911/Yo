export interface TreeNode {
  id: string;
  text: string;
  folded: boolean;
  children: TreeNode[];
}

export interface Cursor {
  nodeId: string;
  offset: number;
}

export interface Bookmark {
  nodeId: string;
  line: number;
}

export interface EditorState {
  tree: TreeNode[];
  cursors: Cursor[];
  activeCursor: number;
  mode: 'normal' | 'insert';
  keyBuffer: string[];
  searchQuery: string;
  searchResults: Set<string>;
  bookmarks: Bookmark[];
  zenMode: boolean;
  filterText: string;
  showSearch: boolean;
  showFilter: boolean;
  indentSize: number;
  expandTab: boolean;
  lightHighlight: boolean;
}

export type Action =
  | { type: 'SET_TREE'; payload: TreeNode[] }
  | { type: 'MOVE_CURSOR'; payload: { nodeId: string; offset: number; index?: number } }
  | { type: 'ADD_CURSOR'; payload: Cursor }
  | { type: 'REMOVE_CURSOR'; payload: number }
  | { type: 'SET_CURSORS'; payload: Cursor[] }
  | { type: 'SET_ACTIVE_CURSOR'; payload: number }
  | { type: 'SET_MODE'; payload: EditorState['mode'] }
  | { type: 'PUSH_KEY'; payload: string }
  | { type: 'CLEAR_KEY_BUFFER' }
  | { type: 'TOGGLE_FOLD'; payload: string }
  | { type: 'FOLD_ALL' }
  | { type: 'UNFOLD_ALL' }
  | { type: 'SET_SEARCH'; payload: string }
  | { type: 'SET_SEARCH_RESULTS'; payload: Set<string> }
  | { type: 'ADD_BOOKMARK'; payload: Bookmark }
  | { type: 'REMOVE_BOOKMARK'; payload: string }
  | { type: 'TOGGLE_ZEN_MODE' }
  | { type: 'SET_FILTER_TEXT'; payload: string }
  | { type: 'SET_SHOW_FILTER'; payload: boolean }
  | { type: 'SET_SHOW_SEARCH'; payload: boolean }
  | { type: 'GO_TO_PARENT' }
  | { type: 'GO_TO_FIRST_CHILD' }
  | { type: 'SET_INDENT_SIZE'; payload: number }
  | { type: 'SET_EXPAND_TAB'; payload: boolean }
  | { type: 'SET_LIGHT_HIGHLIGHT'; payload: boolean };