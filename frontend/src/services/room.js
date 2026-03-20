import api from './api';

export const roomService = {
    getRoomDetails: async (roomId) => {
        const response = await api.get(`/rooms/${roomId}`);
        return response.data;
    },
    createRoom: async (roomData) => {
        const response = await api.post('/rooms/create', roomData);
        return response.data;
    },
    joinRoom: async (inviteCode) => {
        const response = await api.post(`/rooms/join/${inviteCode}`);
        return response.data;
    }
};
