import api from './api';

export const choreService = {
    createChore: async (choreData) => {
        const response = await api.post('/chores/create', choreData);
        return response.data;
    },
    getRoomChores: async (roomId) => {
        const response = await api.get(`/chores/${roomId}`);
        return response.data;
    },
    updateChoreStatus: async (choreId, status) => {
        const response = await api.patch(`/chores/${choreId}/status`, { status });
        return response.data;
    },
    deleteChore: async (choreId) => {
        const response = await api.delete(`/chores/${choreId}`);
        return response.data;
    }
};
