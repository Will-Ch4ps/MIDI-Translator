import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AppShell } from './shell/AppShell';
import './design/globals.css';

const root = document.getElementById('root');
if (!root) throw new Error('root element não encontrado');

createRoot(root).render(
  <StrictMode>
    <AppShell />
  </StrictMode>,
);
