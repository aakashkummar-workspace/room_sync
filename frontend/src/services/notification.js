import api from './api';

export const notificationService = {
    getNotifications: async () => {
        const response = await api.get('/notifications/');
        return response.data;
    },
    getUnreadCount: async () => {
        const response = await api.get('/notifications/unread-count');
        return response.data.count;
    },
    markAllRead: async () => {
        const response = await api.patch('/notifications/read-all');
        return response.data;
    },
    markRead: async (id) => {
        const response = await api.patch(`/notifications/${id}/read`);
        return response.data;
    },
};
