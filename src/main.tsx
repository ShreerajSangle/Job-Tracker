import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Theme is already applied by the inline script in index.html before this runs.
// No need to re-apply here — avoids double application and flicker.

createRoot(document.getElementById('root')!).render(<App />);
