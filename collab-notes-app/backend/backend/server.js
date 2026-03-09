const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// In-memory store
const notes = new Map();

function getNote(id) {
  if (!notes.has(id)) {
    notes.set(id, {
      id,
      content: { ops: [{ insert: '\n' }] },
      activeUsers: []
    });
  }
  return notes.get(id);
}

// REST Endpoints
app.get('/notes/:id', (req, res) => {
  const note = getNote(req.params.id);
  res.json(note);
});

app.post('/notes', (req, res) => {
  const newId = Math.random().toString(36).substring(7);
  const newNote = getNote(newId);
  res.json({ _id: newNote.id });
});

// Socket.io for Real-time Collab
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join-note', ({ noteId, user }) => {
    socket.join(noteId);
    socket.noteId = noteId;
    socket.user = user; // { id, name, color }

    socket.to(noteId).emit('user-joined', { socketId: socket.id, ...user });
  });

  socket.on('send-changes', (delta) => {
    socket.to(socket.noteId).emit('receive-changes', delta);
  });

  socket.on('cursor-move', (range) => {
    socket.to(socket.noteId).emit('receive-cursor', {
      userId: socket.user?.id,
      name: socket.user?.name,
      color: socket.user?.color,
      range
    });
  });

  socket.on('save-document', (content) => {
    if (socket.noteId) {
      const note = getNote(socket.noteId);
      note.content = content;
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    if (socket.noteId) {
      socket.to(socket.noteId).emit('user-left', socket.id);
    }
  });
});

const PORT = 3001;
server.listen(PORT, () => console.log(`Server running on port ${PORT} (In-Memory)`));
