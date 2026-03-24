import api from './api';

export const messagesService = {
    getMessages: async (roomId, beforeId = null) => {
        const params = { limit: 50 };
        if (beforeId) params.before_id = beforeId;
        const response = await api.get(`/messages/${roomId}`, { params });
        return response.data;
    },

    sendMessage: async (roomId, content) => {
        const response = await api.post('/messages/', { room_id: roomId, content });
        return response.data;
    },

    sendMessageWithFile: async (roomId, file, content = '') => {
        const formData = new FormData();
        formData.append('room_id', roomId);
        formData.append('file', file);
        if (content) formData.append('content', content);
        const response = await api.post('/messages/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    },

    deleteMessage: async (messageId) => {
        const response = await api.delete(`/messages/${messageId}`);
        return response.data;
    },
};
