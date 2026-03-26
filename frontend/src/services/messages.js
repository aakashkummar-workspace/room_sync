import { getDB, saveDB, nextId, delay, getCurrentUser } from './mockData';

export const messagesService = {
    getMessages: async (roomId) => {
        await delay(100);
        const db = getDB();
        return db.messages.filter(m => m.room_id === roomId).sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    },

    sendMessage: async (roomId, content) => {
        await delay(100);
        const db = getDB();
        const user = getCurrentUser();
        const msg = {
            id: nextId(db.messages),
            room_id: roomId,
            sender_id: user.id,
            sender_name: user.name,
            content,
            file_url: null,
            file_name: null,
            created_at: new Date().toISOString(),
        };
        db.messages.push(msg);
        saveDB(db);
        return msg;
    },

    sendMessageWithFile: async (roomId, file, content = '') => {
        await delay(300);
        const db = getDB();
        const user = getCurrentUser();
        // Convert file to data URL for localStorage
        const reader = new FileReader();
        const fileUrl = await new Promise((resolve) => {
            reader.onload = (e) => resolve(e.target.result);
            reader.readAsDataURL(file);
        });
        const msg = {
            id: nextId(db.messages),
            room_id: roomId,
            sender_id: user.id,
            sender_name: user.name,
            content: content || file.name,
            file_url: fileUrl,
            file_name: file.name,
            created_at: new Date().toISOString(),
        };
        db.messages.push(msg);
        saveDB(db);
        return msg;
    },

    deleteMessage: async (messageId) => {
        await delay();
        const db = getDB();
        db.messages = db.messages.filter(m => m.id !== messageId);
        saveDB(db);
        return { message: 'Deleted' };
    },
};
