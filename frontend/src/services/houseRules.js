import api from './api';

export const houseRulesService = {
    getRules: async (roomId) => {
        const response = await api.get(`/house-rules/${roomId}`);
        return response.data;
    },

    addRule: async (roomId, ruleText) => {
        const response = await api.post('/house-rules/', { room_id: roomId, rule_text: ruleText });
        return response.data;
    },

    updateRule: async (ruleId, ruleText) => {
        const response = await api.put(`/house-rules/${ruleId}`, { rule_text: ruleText });
        return response.data;
    },

    deleteRule: async (ruleId) => {
        const response = await api.delete(`/house-rules/${ruleId}`);
        return response.data;
    },
};
