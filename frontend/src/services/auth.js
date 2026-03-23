import api from './api';

export const authService = {
    login: async (email, password) => {
        const params = new URLSearchParams();
        params.append('username', email);
        params.append('password', password);

        const response = await api.post('/auth/login', params, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        return response.data;
    },

    signup: async (userData) => {
        const response = await api.post('/auth/signup', userData);
        return response.data;
    },

    googleLogin: async (credential) => {
        const response = await api.post('/auth/google', { credential });
        return response.data;
    },

    facebookLogin: async (accessToken) => {
        const response = await api.post('/auth/facebook', { access_token: accessToken });
        return response.data;
    },

    getMe: async () => {
        const response = await api.get('/auth/me');
        return response.data;
    },

    updateProfile: async (userData) => {
        const response = await api.put('/auth/me', userData);
        return response.data;
    },

    uploadAvatar: async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post('/auth/upload-avatar', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    }
};
