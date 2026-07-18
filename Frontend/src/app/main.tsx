import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Toaster } from 'sonner';
import './index.css';
import App from './App';
import Providers from './providers';

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <Providers>
      <App />
      <Toaster richColors position="bottom-right" theme="dark" />
    </Providers>
  </StrictMode>
);
