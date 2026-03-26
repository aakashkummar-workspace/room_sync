import { useState, useEffect, createContext, useContext } from 'react';
import { authService } from '../services/auth';
import { clearCurrentUser } from '../services/mockData';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const userData = await authService.getMe();
                    setUser(userData);
                } catch (err) {
                    clearCurrentUser();
                }
            }
            setLoading(false);
        };
        initAuth();
    }, []);

    const login = async (email, password) => {
        const data = await authService.login(email, password);
        localStorage.setItem('token', data.access_token);
        const userData = await authService.getMe();
        setUser(userData);
        return userData;
    };

    const googleLogin = async (credential) => {
        const data = await authService.googleLogin(credential);
        localStorage.setItem('token', data.access_token);
        const userData = await authService.getMe();
        setUser(userData);
        return userData;
    };

    const facebookLogin = async (accessToken) => {
        const data = await authService.facebookLogin(accessToken);
        localStorage.setItem('token', data.access_token);
        const userData = await authService.getMe();
        setUser(userData);
        return userData;
    };

    const signup = async (userData) => {
        await authService.signup(userData);
    };

    const updateProfile = async (data) => {
        const updated = await authService.updateProfile(data);
        setUser(updated);
        return updated;
    };

    const updateAvatar = async (file) => {
        const result = await authService.uploadAvatar(file);
        setUser(prev => ({ ...prev, avatar_url: result.avatar_url }));
        return result;
    };

    const logout = () => {
        clearCurrentUser();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, signup, googleLogin, facebookLogin, logout, loading, updateProfile, updateAvatar }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
