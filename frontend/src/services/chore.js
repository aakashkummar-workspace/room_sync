import api from './api';

export const choreService = {
    createChore: async (choreData) => {
        const response = await api.post('/chores/create', choreData);
        return response.data;
    },
    getRoomChores: async (roomId) => {
        const response = await api.get(`/chores/${roomId}`);
        return response.data;
    }
};
