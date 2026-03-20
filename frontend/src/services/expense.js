import api from './api';

export const expenseService = {
    addExpense: async (expenseData) => {
        const response = await api.post('/expenses/add', expenseData);
        return response.data;
    },
    getRoomExpenses: async (roomId) => {
        const response = await api.get(`/expenses/${roomId}`);
        return response.data;
    },
    settleSplit: async (splitId) => {
        const response = await api.put(`/expenses/splits/${splitId}/pay`);
        return response.data;
    }
};
