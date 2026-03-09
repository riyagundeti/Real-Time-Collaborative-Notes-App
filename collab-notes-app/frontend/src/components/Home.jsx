import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { Plus, Link as LinkIcon, ArrowRight } from 'lucide-react';

export default function Home() {
  const [linkInput, setLinkInput] = useState('');
  const navigate = useNavigate();

  const handleCreateNew = async () => {
    try {
      const res = await fetch('http://localhost:3001/notes', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        navigate(`/notes/${data._id}`);
        return;
      }
    } catch (err) {
      console.error("Backend not reachable, creating locally", err);
    }
    // Fallback
    const randomId = uuidv4();
    navigate(`/notes/${randomId}`);
  };

  const handleJoin = (e) => {
    e.preventDefault();
    if (!linkInput) return;
    
    // Parse ID from link
    let docId = linkInput;
    if (linkInput.includes('/notes/')) {
      docId = linkInput.split('/notes/')[1];
    }
    navigate(`/notes/${docId}`);
  };

  return (
    <div className="flex flex-col items-center justify-center flex-1 w-full p-6">
      <div className="w-full max-w-xl p-8 border border-[var(--border)] rounded-2xl shadow-sm bg-[var(--background)] text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
        <h2 className="text-4xl font-extrabold mb-4 tracking-tight">Share thoughts, <br/> in real-time.</h2>
        <p className="text-[var(--muted-foreground)] mb-10 text-lg">
          Create a new document or join an existing one to start collaborating with your team globally.
        </p>

        <button
          onClick={handleCreateNew}
          className="w-full flex items-center justify-center gap-2 mb-8 bg-[var(--foreground)] text-[var(--background)] px-6 py-4 rounded-xl font-semibold hover:opacity-90 active:scale-[0.98] transition-all"
        >
          <Plus size={20} />
          Create New Document
        </button>

        <div className="w-full flex items-center my-6">
          <div className="flex-1 border-t border-[var(--border)]"></div>
          <span className="px-4 text-[var(--muted-foreground)] text-sm font-medium uppercase tracking-wider">Or join</span>
          <div className="flex-1 border-t border-[var(--border)]"></div>
        </div>

        <form onSubmit={handleJoin} className="w-full flex gap-3 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <LinkIcon size={18} className="text-[var(--muted-foreground)]" />
          </div>
          <input
            type="text"
            placeholder="Paste note link or ID..."
            value={linkInput}
            onChange={(e) => setLinkInput(e.target.value)}
            className="flex-1 pl-10 pr-4 py-3 bg-[var(--muted)] border border-transparent rounded-xl focus:border-[var(--foreground)] focus:bg-[var(--background)] outline-none transition-colors"
          />
          <button
            type="submit"
            className="px-6 py-3 bg-[var(--muted)] border border-[var(--border)] rounded-xl hover:bg-[var(--border)] transition-colors flex items-center gap-2 whitespace-nowrap"
          >
            Join <ArrowRight size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
