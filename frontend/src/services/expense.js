import { getDB, saveDB, nextId, delay, getCurrentUser } from './mockData';

export const expenseService = {
    addExpense: async (expenseData) => {
        await delay();
        const db = getDB();
        const user = getCurrentUser();
        const roomMembers = db.users.filter(u => u.room_id === user.room_id);
        const splitAmount = Math.round(expenseData.amount / roomMembers.length);

        const expense = {
            id: nextId(db.expenses),
            room_id: user.room_id,
            title: expenseData.title,
            amount: expenseData.amount,
            category: expenseData.category || 'General',
            paid_by: user.id,
            paid_by_name: user.name,
            created_at: new Date().toISOString(),
            splits: roomMembers.map((m, i) => ({
                id: Date.now() + i,
                user_id: m.id,
                user_name: m.name,
                amount: splitAmount,
                is_paid: m.id === user.id,
            })),
        };
        db.expenses.push(expense);

        // Add notification for other members
        roomMembers.filter(m => m.id !== user.id).forEach(m => {
            db.notifications.push({
                id: nextId(db.notifications),
                user_id: m.id,
                title: 'New Expense Added',
                message: `${user.name} added ${expenseData.title} - ₹${expenseData.amount.toLocaleString()}`,
                type: 'expense',
                is_read: false,
                created_at: new Date().toISOString(),
            });
        });

        saveDB(db);
        return expense;
    },

    getRoomExpenses: async (roomId) => {
        await delay();
        const db = getDB();
        return db.expenses.filter(e => e.room_id === roomId);
    },

    settleSplit: async (splitId) => {
        await delay();
        const db = getDB();
        for (const expense of db.expenses) {
            const split = expense.splits?.find(s => s.id === splitId);
            if (split) {
                split.is_paid = true;
                break;
            }
        }
        saveDB(db);
        return { message: 'Split settled' };
    },
};
