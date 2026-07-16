import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../shared/lib/queryClient';


createRoot(document.getElementById('root') as HTMLElement).render(
 
  <StrictMode>
     <QueryClientProvider client={queryClient}>
     <BrowserRouter>
    <App />
     <Toaster richColors position="bottom-right" theme="dark" />
     </BrowserRouter>
</QueryClientProvider>
  </StrictMode>
 
)
