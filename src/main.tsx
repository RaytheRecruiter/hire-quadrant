// src/main.tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Toaster } from 'react-hot-toast';

// Fonts
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/space-grotesk/500.css';
import '@fontsource/space-grotesk/600.css';
import '@fontsource/space-grotesk/700.css';

import App from './App.tsx';
import './index.css';
import { installErrorCapture } from './utils/errorCapture';

installErrorCapture();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3500,
        style: {
          borderRadius: '12px',
          background: '#041E42',
          color: '#fff',
          fontSize: '14px',
          fontWeight: 500,
        },
        success: {
          iconTheme: { primary: '#003594', secondary: '#fff' },
        },
      }}
    />
  </StrictMode>
);
