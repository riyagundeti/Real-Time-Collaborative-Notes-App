const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  title: {
    type: String,
    default: 'Untitled Note',
  },
  content: {
    type: Object, // For Quill Delta
    default: { ops: [{ insert: '\n' }] },
  },
  activeUsers: {
    type: Array, // Could be handled in memory, but we'll leave it in schema if needed
    default: [],
  },
  versionHistory: {
    type: Array,
    default: [],
  }
}, { timestamps: true });

module.exports = mongoose.model('Note', noteSchema);
