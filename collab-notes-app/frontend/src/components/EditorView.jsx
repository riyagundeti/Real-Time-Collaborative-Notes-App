import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import ReactQuill, { Quill } from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import QuillCursors from 'quill-cursors';
import { io } from 'socket.io-client';
import { Copy, Check, Users } from 'lucide-react';

Quill.register('modules/cursors', QuillCursors);

const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef', '#f43f5e'];

export default function EditorView() {
  const { id: noteId } = useParams();
  const [socket, setSocket] = useState(null);
  const [quill, setQuill] = useState(null);
  const [activeUsers, setActiveUsers] = useState([]);
  const [copied, setCopied] = useState(false);
  
  const quillRef = useRef(null);
  const cursorsRef = useRef(null);
  const userColor = useRef(COLORS[Math.floor(Math.random() * COLORS.length)]);
  const userName = useRef(`User ${Math.floor(Math.random() * 100)}`);
  const userId = useRef(Math.random().toString(36).substring(7));

  useEffect(() => {
    if (quillRef.current) {
      setQuill(quillRef.current.getEditor());
    }
  }, [quillRef]);

  // Initialize socket and fetch initial document
  useEffect(() => {
    const s = io('http://localhost:3001');
    setSocket(s);

    s.emit('join-note', {
      noteId,
      user: { id: userId.current, name: userName.current, color: userColor.current }
    });

    s.on('user-joined', (user) => {
      setActiveUsers(prev => {
        if (!prev.find(u => u.socketId === user.socketId)) {
          return [...prev, user];
        }
        return prev;
      });
    });

    s.on('user-left', (socketId) => {
      setActiveUsers(prev => prev.filter(u => u.socketId !== socketId));
      if (cursorsRef.current) {
        cursorsRef.current.removeCursor(socketId);
      }
    });

    return () => {
      s.disconnect();
    };
  }, [noteId]);

  // Load initial document content
  useEffect(() => {
    if (!socket || !quill) return;

    fetch(`http://localhost:3001/notes/${noteId}`)
      .then(res => res.json())
      .then(data => {
        quill.setContents(data.content);
        quill.enable();
      })
      .catch(err => {
        console.error("Error loading note:", err);
        quill.enable();
      });

  }, [socket, quill, noteId]);

  // Handle incoming changes from others
  useEffect(() => {
    if (!socket || !quill) return;

    const handler = (delta) => {
      quill.updateContents(delta);
    };
    socket.on('receive-changes', handler);

    return () => {
      socket.off('receive-changes', handler);
    };
  }, [socket, quill]);

  // Handle cursor updates from others
  useEffect(() => {
    if (!socket || !cursorsRef.current) return;

    const handler = ({ userId: currentUserId, name, color, range }) => {
      const socketId = currentUserId; // we use socketId or userId interchangeably if we store it
      // Let's rely on range. If null, user removed selection
      if (!range) {
        cursorsRef.current.removeCursor(currentUserId);
        return;
      }
      cursorsRef.current.createCursor(currentUserId, name, color);
      cursorsRef.current.moveCursor(currentUserId, range);
    };

    socket.on('receive-cursor', handler);

    return () => {
      socket.off('receive-cursor', handler);
    };
  }, [socket]);

  // Handle text change
  useEffect(() => {
    if (!socket || !quill) return;

    const handler = (delta, oldDelta, source) => {
      if (source !== 'user') return;
      socket.emit('send-changes', delta);
      
      const currentContents = quill.getContents();
      socket.emit('save-document', currentContents);
    };

    quill.on('text-change', handler);

    return () => {
      quill.off('text-change', handler);
    };
  }, [socket, quill]);

  // Handle local cursor selection
  useEffect(() => {
    if (!socket || !quill) return;

    const handler = (range, oldRange, source) => {
      if (source === 'user') {
        socket.emit('cursor-move', range);
      }
    };

    quill.on('selection-change', handler);

    return () => {
      quill.off('selection-change', handler);
    };
  }, [socket, quill]);

  // Initialize Quill Cursors module ref 
  useEffect(() => {
    if (!quill) return;
    const cursors = quill.getModule('cursors');
    cursorsRef.current = cursors;
  }, [quill]);

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const modules = {
    cursors: true,
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['link', 'image', 'code-block'],
      ['clean'],
    ],
  };

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col h-[calc(100vh-100px)] mt-2">
      <div className="flex justify-between items-center mb-4 px-4 py-3 bg-[var(--muted)] border border-[var(--border)] rounded-xl">
        <div className="flex items-center gap-4">
          <div className="flex -space-x-2">
            <div 
              className="w-8 h-8 rounded-full border-2 border-[var(--background)] flex items-center justify-center text-xs font-bold text-white z-10"
              style={{ backgroundColor: userColor.current }}
              title="You"
            >
              You
            </div>
            {activeUsers.map(u => (
              <div 
                key={u.socketId}
                className="w-8 h-8 rounded-full border-2 border-[var(--background)] flex items-center justify-center text-xs font-bold text-white relative group"
                style={{ backgroundColor: u.color }}
                title={u.name}
              >
                {u.name.charAt(0).toUpperCase()}
              </div>
            ))}
          </div>
          <span className="text-sm font-medium text-[var(--muted-foreground)] flex items-center gap-1">
            <Users size={14} /> {activeUsers.length + 1} online
          </span>
        </div>

        <button 
          onClick={copyLink}
          className="flex items-center gap-2 px-3 py-1.5 bg-[var(--background)] border border-[var(--border)] rounded-md text-sm font-medium hover:bg-[var(--primary)] hover:text-[var(--primary-foreground)] transition-colors"
        >
          {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
          {copied ? 'Copied Link!' : 'Share'}
        </button>
      </div>

      <div className="flex-1 bg-[var(--background)] border border-[var(--border)] rounded-xl shadow-sm flex flex-col pt-2 pb-8 px-4 sm:px-12 md:px-24">
        <ReactQuill 
          theme="snow"
          modules={modules}
          ref={quillRef}
          className="flex-1 h-full editor-container"
        />
      </div>
    </div>
  );
}
