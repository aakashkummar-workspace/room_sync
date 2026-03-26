import { getDB, saveDB, delay, getCurrentUser, setCurrentUser } from './mockData';

export const authService = {
    login: async (email, password) => {
        await delay();
        const db = getDB();
        const user = db.users.find(u => u.email === email && u.password === password);
        if (!user) throw { response: { status: 400, data: { detail: 'Invalid email or password. Please try again.' } } };
        const token = 'mock_token_' + user.id + '_' + Date.now();
        setCurrentUser(user);
        return { access_token: token, token_type: 'bearer' };
    },

    signup: async (userData) => {
        await delay();
        const db = getDB();
        if (db.users.find(u => u.email === userData.email)) {
            throw { response: { status: 400, data: { detail: 'Email already registered' } } };
        }
        const newUser = {
            id: db.users.length ? Math.max(...db.users.map(u => u.id)) + 1 : 1,
            name: userData.name,
            email: userData.email,
            password: userData.password,
            phone: '',
            avatar_url: '',
            role: 'admin',
            room_id: null,
            created_at: new Date().toISOString(),
        };
        db.users.push(newUser);
        saveDB(db);
        return { message: 'Account created successfully' };
    },

    googleLogin: async () => {
        await delay();
        const db = getDB();
        const user = db.users[0];
        setCurrentUser(user);
        return { access_token: 'mock_token_google_' + Date.now(), token_type: 'bearer' };
    },

    facebookLogin: async () => {
        await delay();
        const db = getDB();
        const user = db.users[0];
        setCurrentUser(user);
        return { access_token: 'mock_token_fb_' + Date.now(), token_type: 'bearer' };
    },

    getMe: async () => {
        await delay(50);
        const user = getCurrentUser();
        if (!user) throw { response: { status: 401 } };
        const db = getDB();
        const fresh = db.users.find(u => u.id === user.id);
        if (!fresh) throw { response: { status: 401 } };
        setCurrentUser(fresh);
        const { password, ...safe } = fresh;
        return safe;
    },

    updateProfile: async (userData) => {
        await delay();
        const user = getCurrentUser();
        const db = getDB();
        const idx = db.users.findIndex(u => u.id === user.id);
        if (idx === -1) throw new Error('User not found');
        db.users[idx] = { ...db.users[idx], ...userData };
        saveDB(db);
        setCurrentUser(db.users[idx]);
        const { password, ...safe } = db.users[idx];
        return safe;
    },

    uploadAvatar: async (file) => {
        await delay(300);
        const user = getCurrentUser();
        const db = getDB();
        const reader = new FileReader();
        const avatarUrl = await new Promise((resolve) => {
            reader.onload = (e) => resolve(e.target.result);
            reader.readAsDataURL(file);
        });
        const idx = db.users.findIndex(u => u.id === user.id);
        db.users[idx].avatar_url = avatarUrl;
        saveDB(db);
        setCurrentUser(db.users[idx]);
        return { avatar_url: avatarUrl };
    },
};
