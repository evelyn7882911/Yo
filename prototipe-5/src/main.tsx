import React from 'react';
import ReactDOM from 'react-dom/client';
import { Editor } from './components';
import './../media/theme.css';

const root = document.getElementById('root');
const initialContent = '';
const fileName = document.location.pathname.split('/').pop() || 'untitled.tree';
if (root) {
  ReactDOM.createRoot(root).render(<Editor initialContent={initialContent} fileName={fileName} />);
}