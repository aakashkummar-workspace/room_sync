import { getDB, delay, getCurrentUser } from './mockData';

export const dashboardService = {
    getSummary: async () => {
        await delay();
        const db = getDB();
        const user = getCurrentUser();
        if (!user) throw { response: { status: 401 } };

        const room = db.rooms.find(r => r.id === user.room_id);
        const roomMembers = db.users.filter(u => u.room_id === user.room_id);
        const roomExpenses = db.expenses.filter(e => e.room_id === user.room_id);
        const roomChores = db.chores.filter(c => c.room_id === user.room_id);
        const roomInventory = db.inventory.filter(i => i.room_id === user.room_id);

        // Calculate totals
        const totalExpenses = roomExpenses.reduce((sum, e) => sum + e.amount, 0);
        const userPaid = roomExpenses.filter(e => e.paid_by === user.id).reduce((sum, e) => sum + e.amount, 0);
        const userOwes = roomExpenses.reduce((sum, e) => {
            const split = e.splits?.find(s => s.user_id === user.id && !s.is_paid);
            return sum + (split ? split.amount : 0);
        }, 0);
        const userReceivable = roomExpenses.reduce((sum, e) => {
            if (e.paid_by !== user.id) return sum;
            const unpaid = e.splits?.filter(s => s.user_id !== user.id && !s.is_paid) || [];
            return sum + unpaid.reduce((s, sp) => s + sp.amount, 0);
        }, 0);

        const pendingChores = roomChores.filter(c => c.status === 'pending');
        const completedChores = roomChores.filter(c => c.status === 'completed');

        // Build recent activity from expenses + chores
        const recentActivity = [
            ...roomExpenses.map(e => ({
                type: 'expense',
                title: e.title,
                amount: e.amount,
                user: e.paid_by_name,
                time: new Date(e.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
            })),
            ...roomChores.map(c => ({
                type: 'chore',
                title: c.title,
                amount: 0,
                user: c.assigned_to_name,
                time: new Date(c.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
            })),
        ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 10);

        return {
            user_name: user.name,
            room: room ? { id: room.id, name: room.name, invite_code: room.invite_code } : null,
            room_id: room?.id || null,
            room_members: roomMembers.map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role })),
            stats: [
                { title: 'Total Balance', value: `₹${userOwes.toLocaleString()}`, icon: 'TrendingDown', trend: -5 },
                { title: 'Monthly Spending', value: `₹${userPaid.toLocaleString()}`, icon: 'TrendingUp', trend: 12 },
                { title: 'Receivable', value: `₹${userReceivable.toLocaleString()}`, icon: 'Clock', trend: 0 },
                { title: 'Inventory', value: `${roomInventory.length} Items`, icon: 'Box', trend: 0 },
            ],
            total_room_expenses: totalExpenses,
            pending_chores_count: pendingChores.length,
            chores: {
                pending: pendingChores.length,
                completed: completedChores.length,
                score: completedChores.length + pendingChores.length > 0
                    ? Math.round((completedChores.length / (completedChores.length + pendingChores.length)) * 100)
                    : 100,
            },
            inventory_count: roomInventory.length,
            members_count: roomMembers.length,
            recent_activity: recentActivity,
            recent_notes: db.notes.filter(n => n.room_id === user.room_id).slice(-5).reverse(),
            notifications_count: db.notifications.filter(n => n.user_id === user.id && !n.is_read).length,
        };
    },
};
