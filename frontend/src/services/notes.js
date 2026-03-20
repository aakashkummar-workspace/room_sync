import api from './api';

export const notesService = {
    getRoomNotes: async (roomId) => {
        const response = await api.get(`/notes/${roomId}`);
        return response.data;
    },

    createNote: async (data) => {
        const response = await api.post('/notes/', data);
        return response.data;
    },

    updateNote: async (noteId, data) => {
        const response = await api.put(`/notes/${noteId}`, data);
        return response.data;
    },

    deleteNote: async (noteId) => {
        const response = await api.delete(`/notes/${noteId}`);
        return response.data;
    },
};
