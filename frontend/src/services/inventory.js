import { getDB, saveDB, nextId, delay, getCurrentUser } from './mockData';

export const inventoryService = {
    getInventory: async (roomId) => {
        await delay();
        const db = getDB();
        return db.inventory.filter(i => i.room_id === roomId);
    },

    addItem: async (itemData) => {
        await delay();
        const db = getDB();
        const user = getCurrentUser();
        const item = {
            id: nextId(db.inventory),
            room_id: user.room_id,
            name: itemData.name,
            quantity: itemData.quantity || 1,
            category: itemData.category || 'General',
            added_by: user.id,
            added_by_name: user.name,
            created_at: new Date().toISOString(),
        };
        db.inventory.push(item);
        saveDB(db);
        return item;
    },

    updateItem: async (itemId, itemData) => {
        await delay();
        const db = getDB();
        const item = db.inventory.find(i => i.id === itemId);
        if (item) {
            Object.assign(item, itemData);
        }
        saveDB(db);
        return item;
    },
};
