import { getDB, saveDB, nextId, delay, getCurrentUser, setCurrentUser } from './mockData';

export const roomService = {
    getRoomDetails: async (roomId) => {
        await delay();
        const db = getDB();
        const room = db.rooms.find(r => r.id === roomId);
        if (!room) throw new Error('Room not found');
        const members = db.users.filter(u => u.room_id === roomId).map(u => ({
            id: u.id,
            name: u.name,
            email: u.email,
            phone: u.phone || '',
            avatar_url: u.avatar_url || '',
            role: u.role,
            created_at: u.created_at,
        }));
        return { ...room, members };
    },

    createRoom: async (roomData) => {
        await delay();
        const db = getDB();
        const user = getCurrentUser();
        const room = {
            id: nextId(db.rooms),
            name: roomData.name,
            invite_code: roomData.name.substring(0, 4).toUpperCase() + Math.floor(Math.random() * 1000),
            created_by: user.id,
            created_at: new Date().toISOString(),
        };
        db.rooms.push(room);
        const idx = db.users.findIndex(u => u.id === user.id);
        db.users[idx].room_id = room.id;
        db.users[idx].role = 'admin';
        saveDB(db);
        setCurrentUser(db.users[idx]);
        return room;
    },

    joinRoom: async (inviteCode) => {
        await delay();
        const db = getDB();
        const user = getCurrentUser();
        const room = db.rooms.find(r => r.invite_code === inviteCode);
        if (!room) throw { response: { status: 404, data: { detail: 'Room not found' } } };
        const idx = db.users.findIndex(u => u.id === user.id);
        db.users[idx].room_id = room.id;
        db.users[idx].role = 'member';
        saveDB(db);
        setCurrentUser(db.users[idx]);
        return room;
    },

    getMemberCredentials: async (roomId) => {
        await delay();
        const db = getDB();
        const members = db.users.filter(u => u.room_id === roomId);
        return members.map(m => ({
            id: m.id,
            name: m.name,
            email: m.email,
            password: m.password,
            role: m.role,
        }));
    },
};
