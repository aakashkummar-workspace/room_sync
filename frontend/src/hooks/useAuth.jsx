import { useState, useEffect, createContext, useContext } from 'react';
import { authService } from '../services/auth';

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
                    localStorage.removeItem('token');
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

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, signup, googleLogin, facebookLogin, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
