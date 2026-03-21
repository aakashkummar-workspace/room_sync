import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const SettingsContext = createContext(null);

const STORAGE_KEY = 'casasync_settings';

const defaultSettings = {
    darkMode: false,
    notifications: true,
    language: 'English',
};

const loadSettings = () => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) return { ...defaultSettings, ...JSON.parse(stored) };
    } catch (e) {
        console.error('Failed to load settings:', e);
    }
    return defaultSettings;
};

export const SettingsProvider = ({ children }) => {
    const [settings, setSettings] = useState(loadSettings);

    // Persist to localStorage
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    }, [settings]);

    // Apply dark mode class to <html>
    useEffect(() => {
        const root = document.documentElement;
        if (settings.darkMode) {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
    }, [settings.darkMode]);

    const toggleDarkMode = useCallback(() => {
        setSettings(prev => ({ ...prev, darkMode: !prev.darkMode }));
    }, []);

    const toggleNotifications = useCallback(async () => {
        const newValue = !settings.notifications;

        if (newValue) {
            // Request browser notification permission
            if ('Notification' in window) {
                const permission = await Notification.requestPermission();
                if (permission === 'granted') {
                    new Notification('CasaSync', {
                        body: 'Notifications enabled! You will receive alerts here.',
                        icon: '/favicon.ico',
                    });
                    setSettings(prev => ({ ...prev, notifications: true }));
                } else if (permission === 'denied') {
                    alert('Browser notifications are blocked. Please enable them in your browser settings.');
                    return;
                } else {
                    setSettings(prev => ({ ...prev, notifications: true }));
                }
            } else {
                setSettings(prev => ({ ...prev, notifications: true }));
            }
        } else {
            setSettings(prev => ({ ...prev, notifications: false }));
        }
    }, [settings.notifications]);

    const setLanguage = useCallback((lang) => {
        setSettings(prev => ({ ...prev, language: lang }));
    }, []);

    // Helper to send in-app or browser notification
    const sendNotification = useCallback((title, body) => {
        if (settings.notifications && 'Notification' in window && Notification.permission === 'granted') {
            new Notification(title, { body, icon: '/favicon.ico' });
        }
        // In-app notifications always work (handled by components)
    }, [settings.notifications]);

    return (
        <SettingsContext.Provider value={{
            ...settings,
            toggleDarkMode,
            toggleNotifications,
            setLanguage,
            sendNotification,
        }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (!context) throw new Error('useSettings must be used within SettingsProvider');
    return context;
};
