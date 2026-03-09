import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import EditorView from './components/EditorView';
import { useEffect, useState } from 'react';

function App() {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col font-sans">
        <header className="flex justify-between items-center p-4 border-b border-[var(--border)] bg-[var(--background)]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-[var(--foreground)] text-[var(--background)] flex items-center justify-center font-bold">
              C
            </div>
            <h1 className="text-xl font-bold tracking-tight">CollabNotes</h1>
          </div>
          <button 
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-md hover:bg-[var(--muted)] transition-colors text-sm font-medium"
          >
            {darkMode ? '☀️ Light' : '🌙 Dark'}
          </button>
        </header>
        <main className="flex-1 w-full flex flex-col bg-[var(--background)] transition-colors duration-200">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/notes/:id" element={<EditorView />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
