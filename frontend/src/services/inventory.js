import api from './api';

export const inventoryService = {
    getInventory: async (roomId) => {
        const response = await api.get(`/inventory/${roomId}`);
        return response.data;
    },
    addItem: async (itemData) => {
        const response = await api.post('/inventory/', itemData);
        return response.data;
    },
    updateItem: async (itemId, itemData) => {
        const response = await api.patch(`/inventory/${itemId}`, itemData);
        return response.data;
    }
};
