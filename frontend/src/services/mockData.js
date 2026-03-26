// ============================================
// MOCK DATA STORE — localStorage-backed
// ============================================

const STORAGE_KEY = 'casasync_mock_db';

const DEFAULT_DATA = {
    users: [
        {
            id: 1,
            name: 'Rahul Kumar',
            email: 'user@casasync.com',
            password: 'password123',
            phone: '',
            avatar_url: '',
            role: 'admin',
            room_id: 1,
            created_at: '2026-03-01T10:00:00',
        },
        {
            id: 2,
            name: 'Aakash',
            email: 'kummaraakash554@gmail.com',
            password: 'vbhtXB4adH',
            phone: '',
            avatar_url: '',
            role: 'member',
            room_id: 1,
            created_at: '2026-03-15T10:00:00',
        },
    ],
    rooms: [
        {
            id: 1,
            name: 'The Printing House',
            invite_code: 'PRINT123',
            created_by: 1,
            created_at: '2026-03-01T10:00:00',
        },
    ],
    expenses: [
        {
            id: 1,
            room_id: 1,
            title: 'Rent',
            amount: 10000,
            category: 'Rent',
            paid_by: 1,
            paid_by_name: 'Rahul Kumar',
            created_at: '2026-03-24T10:00:00',
            splits: [
                { id: 1, user_id: 1, user_name: 'Rahul Kumar', amount: 5000, is_paid: true },
                { id: 2, user_id: 2, user_name: 'Aakash', amount: 5000, is_paid: false },
            ],
        },
    ],
    chores: [
        {
            id: 1,
            room_id: 1,
            title: 'WashRoom',
            assigned_to: 2,
            assigned_to_name: 'Aakash',
            created_by: 1,
            due_date: '2026-03-26',
            status: 'completed',
            created_at: '2026-03-24T10:00:00',
        },
    ],
    inventory: [],
    notes: [
        {
            id: 1,
            room_id: 1,
            content: 'Room rent',
            color: 'blue',
            created_by: 1,
            author_name: 'Rahul Kumar',
            created_at: '2026-03-23T10:00:00',
        },
        {
            id: 2,
            room_id: 1,
            content: 'Bye',
            color: 'pink',
            created_by: 1,
            author_name: 'Rahul Kumar',
            created_at: '2026-03-23T11:00:00',
        },
        {
            id: 3,
            room_id: 1,
            content: 'Hi',
            color: 'yellow',
            created_by: 1,
            author_name: 'Rahul Kumar',
            created_at: '2026-03-23T12:00:00',
        },
    ],
    messages: [
        {
            id: 1,
            room_id: 1,
            sender_id: 1,
            sender_name: 'Rahul Kumar',
            content: 'hi',
            file_url: null,
            file_name: null,
            created_at: '2026-03-21T06:22:00',
        },
        {
            id: 2,
            room_id: 1,
            sender_id: 1,
            sender_name: 'Rahul Kumar',
            content: 'hi',
            file_url: null,
            file_name: null,
            created_at: '2026-03-26T09:59:00',
        },
        {
            id: 3,
            room_id: 1,
            sender_id: 1,
            sender_name: 'Rahul Kumar',
            content: '1',
            file_url: null,
            file_name: null,
            created_at: '2026-03-26T09:59:30',
        },
    ],
    houseRules: [
        { id: 1, room_id: 1, rule_text: 'Quiet hours from 11 PM to 7 AM — no loud music or calls', created_at: '2026-03-20T10:00:00' },
        { id: 2, room_id: 1, rule_text: 'Clean shared kitchen within 30 minutes after cooking', created_at: '2026-03-20T10:01:00' },
        { id: 3, room_id: 1, rule_text: 'Monthly rent and utilities must be paid by the 5th of every month', created_at: '2026-03-20T10:02:00' },
    ],
    notifications: [
        {
            id: 1,
            user_id: 2,
            title: 'New Expense Added',
            message: 'Rahul Kumar added Rent - ₹10,000',
            type: 'expense',
            is_read: false,
            created_at: '2026-03-24T10:00:00',
        },
        {
            id: 2,
            user_id: 2,
            title: 'New Task Assigned',
            message: 'You have been assigned: WashRoom',
            type: 'chore',
            is_read: false,
            created_at: '2026-03-24T10:05:00',
        },
    ],
};

// Helper to simulate async delay
const delay = (ms = 150) => new Promise(r => setTimeout(r, ms));

// Get DB from localStorage or use defaults
export const getDB = () => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) return JSON.parse(stored);
    } catch (e) { /* ignore */ }
    const db = JSON.parse(JSON.stringify(DEFAULT_DATA));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    return db;
};

// Save DB to localStorage
export const saveDB = (db) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
};

// Get next ID for a collection
export const nextId = (collection) => {
    if (collection.length === 0) return 1;
    return Math.max(...collection.map(i => i.id)) + 1;
};

// Get current logged-in user from localStorage
export const getCurrentUser = () => {
    const userStr = localStorage.getItem('mock_user');
    return userStr ? JSON.parse(userStr) : null;
};

export const setCurrentUser = (user) => {
    localStorage.setItem('mock_user', JSON.stringify(user));
};

export const clearCurrentUser = () => {
    localStorage.removeItem('mock_user');
    localStorage.removeItem('token');
};

// Reset to default data
export const resetDB = () => {
    const db = JSON.parse(JSON.stringify(DEFAULT_DATA));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    return db;
};

export { delay };
