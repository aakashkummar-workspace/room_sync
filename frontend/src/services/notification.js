import { getDB, saveDB, delay, getCurrentUser } from './mockData';

export const notificationService = {
    getNotifications: async () => {
        await delay(50);
        const db = getDB();
        const user = getCurrentUser();
        if (!user) return [];
        return db.notifications.filter(n => n.user_id === user.id).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    },

    getUnreadCount: async () => {
        await delay(50);
        const db = getDB();
        const user = getCurrentUser();
        if (!user) return 0;
        return db.notifications.filter(n => n.user_id === user.id && !n.is_read).length;
    },

    markAllRead: async () => {
        await delay();
        const db = getDB();
        const user = getCurrentUser();
        db.notifications.forEach(n => {
            if (n.user_id === user.id) n.is_read = true;
        });
        saveDB(db);
        return { message: 'All read' };
    },

    markRead: async (id) => {
        await delay();
        const db = getDB();
        const notif = db.notifications.find(n => n.id === id);
        if (notif) notif.is_read = true;
        saveDB(db);
        return { message: 'Read' };
    },
};
