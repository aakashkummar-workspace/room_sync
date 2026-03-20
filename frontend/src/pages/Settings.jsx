import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Home, Bell, ChevronRight, Camera, Globe, Moon, Check, CreditCard, HelpCircle, LogOut } from 'lucide-react';
import { TechCard } from '../components/TechCard';
import { Button } from '../components/Button';
import { useAuth } from '../hooks/useAuth';
import { dashboardService } from '../services/dashboard';

export const Settings = () => {
    const { logout, user } = useAuth();
    const [dashboardData, setDashboardData] = useState(null);
    const [emailNotifications, setEmailNotifications] = useState(true);
    const [darkMode, setDarkMode] = useState(false);
    const [language] = useState('English');

    useEffect(() => {
        const fetchData = async () => {
            try { const summary = await dashboardService.getSummary(); setDashboardData(summary); }
            catch (error) { console.error("Failed to fetch:", error); }
        };
        fetchData();
    }, []);

    const sections = [
        {
            id: 'account', title: 'Account', icon: User,
            items: [
                { label: 'Name', value: user?.name || 'User', type: 'editable' },
                { label: 'Email', value: user?.email || 'user@example.com', type: 'editable' },
                { label: 'Joined', value: 'March 2024', type: 'text' },
            ]
        },
        {
            id: 'room', title: 'Room Settings', icon: Home,
            items: [
                { label: 'Room Name', value: dashboardData?.room_name || 'My Room', type: 'editable' },
                { label: 'Role', value: 'Admin', type: 'badge' },
                { label: 'Invite Code', value: dashboardData?.invite_code || 'ROOM123', type: 'copy' },
            ]
        },
        {
            id: 'billing', title: 'Subscription', icon: CreditCard,
            items: [
                { label: 'Plan', value: 'Premium', type: 'badge-gold' },
                { label: 'Next billing', value: '₹500 on April 01', type: 'text' },
            ]
        },
    ];

    return (
        <div className="max-w-6xl mx-auto">
            <div className="page-header">
                <motion.div initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }}>
                    <h2 className="page-title">Settings</h2>
                    <p className="page-subtitle">Manage your preferences</p>
                </motion.div>
                <div className="flex items-center gap-2 sm:gap-3 self-start sm:self-auto">
                    <Button variant="secondary" icon={HelpCircle} className="text-[10px] sm:text-xs !px-3 sm:!px-4">Support</Button>
                    <Button variant="primary" className="text-[10px] sm:text-xs !px-3 sm:!px-4">Save</Button>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 sm:gap-6">
                {/* Profile Card */}
                <div className="xl:col-span-4 space-y-4 sm:space-y-6">
                    <TechCard delay={0.1} className="!py-8 sm:!py-10 flex flex-col items-center text-center !px-4 sm:!px-6">
                        <div className="relative group cursor-pointer mb-4 sm:mb-6">
                            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl sm:rounded-3xl bg-pastel-peach flex items-center justify-center text-3xl sm:text-4xl font-bold text-orange-600 transition-all group-hover:shadow-elevated">
                                {user?.name?.[0].toUpperCase() || 'U'}
                            </div>
                            <div className="absolute bottom-0 right-0 w-7 h-7 sm:w-8 sm:h-8 bg-surface-card border border-surface-border rounded-lg sm:rounded-xl flex items-center justify-center shadow-soft">
                                <Camera size={12} className="text-text-muted" />
                            </div>
                        </div>
                        <h3 className="text-lg sm:text-xl font-bold text-text-primary mb-0.5 sm:mb-1">{user?.name || 'User'}</h3>
                        <p className="text-xs sm:text-sm text-text-muted mb-4 sm:mb-6 truncate max-w-full">{user?.email || 'user@example.com'}</p>
                        <Button variant="secondary" className="w-full text-xs sm:text-sm">Edit Profile</Button>
                    </TechCard>

                    <TechCard delay={0.2} className="!p-4 sm:!p-6">
                        <h4 className="text-[10px] sm:text-xs font-semibold text-text-muted mb-4 sm:mb-6">Preferences</h4>
                        <div className="space-y-4 sm:space-y-5">
                            {[
                                { label: 'Notifications', icon: Bell, active: emailNotifications, toggle: () => setEmailNotifications(!emailNotifications) },
                                { label: 'Dark Mode', icon: Moon, active: darkMode, toggle: () => setDarkMode(!darkMode) },
                            ].map((pref, i) => (
                                <div key={i} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 sm:gap-3">
                                        <div className={`p-1.5 sm:p-2 rounded-lg sm:rounded-xl ${pref.active ? 'bg-pastel-green' : 'bg-surface'} border border-surface-border`}>
                                            <pref.icon size={14} className={pref.active ? 'text-green-600' : 'text-text-light'} />
                                        </div>
                                        <span className="text-xs sm:text-sm font-medium text-text-secondary">{pref.label}</span>
                                    </div>
                                    <button onClick={pref.toggle}
                                        className={`w-10 sm:w-11 h-5 sm:h-6 rounded-full transition-all relative ${pref.active ? 'bg-green-500' : 'bg-surface-muted'}`}>
                                        <motion.div animate={{ x: pref.active ? 20 : 3 }}
                                            className="absolute top-0.5 sm:top-1 w-3.5 sm:w-4 h-3.5 sm:h-4 rounded-full bg-white shadow-soft" />
                                    </button>
                                </div>
                            ))}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 sm:gap-3">
                                    <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-surface border border-surface-border">
                                        <Globe size={14} className="text-text-light" />
                                    </div>
                                    <span className="text-xs sm:text-sm font-medium text-text-secondary">Language</span>
                                </div>
                                <span className="text-xs sm:text-sm font-medium text-text-primary cursor-pointer hover:underline">{language}</span>
                            </div>
                        </div>
                    </TechCard>
                </div>

                {/* Main Settings */}
                <div className="xl:col-span-8 space-y-4 sm:space-y-6">
                    {sections.map((section, sIdx) => (
                        <TechCard key={section.id} delay={0.3 + (sIdx * 0.08)} className="!p-4 sm:!p-6">
                            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-surface-border">
                                <div className="p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-surface border border-surface-border">
                                    <section.icon size={16} className="text-text-secondary" />
                                </div>
                                <h4 className="text-sm sm:text-base font-bold text-text-primary">{section.title}</h4>
                            </div>
                            <div className="space-y-3 sm:space-y-5 px-0 sm:px-1">
                                {section.items.map((item, idx) => (
                                    <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2 group cursor-pointer pb-3 sm:pb-4 border-b border-surface-border last:border-0 last:pb-0">
                                        <span className="text-xs sm:text-sm text-text-muted">{item.label}</span>
                                        <div className="flex items-center gap-2 sm:gap-3">
                                            {item.type === 'badge' ? (
                                                <span className="badge bg-pastel-blue text-blue-600">{item.value}</span>
                                            ) : item.type === 'badge-gold' ? (
                                                <span className="badge bg-pastel-peach text-orange-600">{item.value}</span>
                                            ) : (
                                                <span className="font-medium text-text-primary text-xs sm:text-sm truncate">{item.value}</span>
                                            )}
                                            {item.type === 'editable' && <ChevronRight size={14} className="text-text-light group-hover:text-text-secondary group-hover:translate-x-0.5 transition-all shrink-0" />}
                                            {item.type === 'copy' && <Check size={14} className="text-green-500 shrink-0" />}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </TechCard>
                    ))}

                    {/* Danger Zone */}
                    <TechCard delay={0.6} className="!p-4 sm:!p-6 border border-red-100">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                            <div>
                                <h4 className="text-sm sm:text-base font-bold text-red-500 mb-0.5 sm:mb-1">Danger Zone</h4>
                                <p className="text-[10px] sm:text-xs text-text-muted">Logout or delete all data.</p>
                            </div>
                            <div className="flex gap-2 sm:gap-3">
                                <Button onClick={logout} variant="secondary" className="text-[10px] sm:text-xs !border-red-200 !text-red-500 hover:!bg-red-50 !px-3 sm:!px-4" icon={LogOut}>Logout</Button>
                                <Button variant="secondary" className="text-[10px] sm:text-xs !border-red-200 !text-red-500 hover:!bg-red-50 !px-3 sm:!px-4">Delete</Button>
                            </div>
                        </div>
                    </TechCard>
                </div>
            </div>
        </div>
    );
};
