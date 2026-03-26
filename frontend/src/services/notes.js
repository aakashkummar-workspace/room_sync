import { getDB, saveDB, nextId, delay, getCurrentUser } from './mockData';

export const notesService = {
    getRoomNotes: async (roomId) => {
        await delay();
        const db = getDB();
        return db.notes.filter(n => n.room_id === roomId);
    },

    createNote: async (data) => {
        await delay();
        const db = getDB();
        const user = getCurrentUser();
        const note = {
            id: nextId(db.notes),
            room_id: user.room_id,
            content: data.content,
            color: data.color || 'yellow',
            created_by: user.id,
            author_name: user.name,
            created_at: new Date().toISOString(),
        };
        db.notes.push(note);
        saveDB(db);
        return note;
    },

    updateNote: async (noteId, data) => {
        await delay();
        const db = getDB();
        const note = db.notes.find(n => n.id === noteId);
        if (note) {
            note.content = data.content ?? note.content;
            note.color = data.color ?? note.color;
        }
        saveDB(db);
        return note;
    },

    deleteNote: async (noteId) => {
        await delay();
        const db = getDB();
        db.notes = db.notes.filter(n => n.id !== noteId);
        saveDB(db);
        return { message: 'Deleted' };
    },
};
