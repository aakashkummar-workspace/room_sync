import { getDB, saveDB, nextId, delay, getCurrentUser } from './mockData';

export const choreService = {
    createChore: async (choreData) => {
        await delay();
        const db = getDB();
        const user = getCurrentUser();
        const assignee = db.users.find(u => u.id === choreData.assigned_to);

        const chore = {
            id: nextId(db.chores),
            room_id: user.room_id,
            title: choreData.title,
            assigned_to: choreData.assigned_to,
            assigned_to_name: assignee?.name || 'Unknown',
            created_by: user.id,
            due_date: choreData.due_date,
            status: 'pending',
            created_at: new Date().toISOString(),
        };
        db.chores.push(chore);

        // Notification for assignee
        if (choreData.assigned_to !== user.id) {
            db.notifications.push({
                id: nextId(db.notifications),
                user_id: choreData.assigned_to,
                title: 'New Task Assigned',
                message: `You have been assigned: ${choreData.title}`,
                type: 'chore',
                is_read: false,
                created_at: new Date().toISOString(),
            });
        }

        saveDB(db);
        return chore;
    },

    getRoomChores: async (roomId) => {
        await delay();
        const db = getDB();
        return db.chores.filter(c => c.room_id === roomId);
    },

    updateChoreStatus: async (choreId, status) => {
        await delay();
        const db = getDB();
        const chore = db.chores.find(c => c.id === choreId);
        if (chore) chore.status = status;
        saveDB(db);
        return chore;
    },

    deleteChore: async (choreId) => {
        await delay();
        const db = getDB();
        db.chores = db.chores.filter(c => c.id !== choreId);
        saveDB(db);
        return { message: 'Chore deleted' };
    },
};
