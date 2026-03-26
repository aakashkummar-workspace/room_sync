import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Home, Bell, ChevronRight, Camera, Globe, Moon, Check, CreditCard, HelpCircle, LogOut, X, Loader2 } from 'lucide-react';
import { TechCard } from '../components/TechCard';
import { Button } from '../components/Button';
import { useAuth } from '../hooks/useAuth';
import { useSettings } from '../hooks/useSettings';
import { dashboardService } from '../services/dashboard';

// No backend needed — avatars stored as data URLs

export const Settings = () => {
    const { logout, user, updateProfile, updateAvatar } = useAuth();
    const { darkMode, notifications: emailNotifications, language, toggleDarkMode, toggleNotifications, setLanguage } = useSettings();
    const [dashboardData, setDashboardData] = useState(null);
    const [showLangMenu, setShowLangMenu] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editName, setEditName] = useState('');
    const [editPhone, setEditPhone] = useState('');
    const [saving, setSaving] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [saveMsg, setSaveMsg] = useState('');
    const fileInputRef = useRef(null);

    useEffect(() => {
        const fetchData = async () => {
            try { const summary = await dashboardService.getSummary(); setDashboardData(summary); }
            catch (error) { console.error("Failed to fetch:", error); }
        };
        fetchData();
    }, []);

    const openEditModal = () => {
        setEditName(user?.name || '');
        setEditPhone(user?.phone || '');
        setSaveMsg('');
        setShowEditModal(true);
    };

    const handleSaveProfile = async () => {
        setSaving(true);
        setSaveMsg('');
        try {
            await updateProfile({ name: editName, phone: editPhone });
            setSaveMsg('Profile updated!');
            setTimeout(() => setShowEditModal(false), 800);
        } catch (err) {
            setSaveMsg('Failed to save. Try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleAvatarChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingAvatar(true);
        try {
            await updateAvatar(file);
        } catch (err) {
            console.error('Avatar upload failed:', err);
        } finally {
            setUploadingAvatar(false);
            e.target.value = '';
        }
    };

    const getAvatarUrl = () => {
        return user?.avatar_url || null;
    };

    const sections = [
        {
            id: 'account', title: 'Account', icon: User,
            items: [
                { label: 'Name', value: user?.name || 'User', type: 'editable' },
                { label: 'Email', value: user?.email || 'user@example.com', type: 'text' },
                { label: 'Phone', value: user?.phone || 'Not set', type: 'editable' },
                { label: 'Joined', value: user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '—', type: 'text' },
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

    const avatarUrl = getAvatarUrl();

    return (
        <div className="max-w-6xl mx-auto">
            {/* Hidden file input for avatar */}
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleAvatarChange}
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
            />

            <div className="page-header">
                <motion.div initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }}>
                    <h2 className="page-title">Settings</h2>
                    <p className="page-subtitle">Manage your preferences</p>
                </motion.div>
                <div className="flex items-center gap-2 sm:gap-3 self-start sm:self-auto">
                    <Button variant="secondary" icon={HelpCircle} className="text-[10px] sm:text-xs !px-3 sm:!px-4">Support</Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-6">
                {/* Profile Card */}
                <div className="lg:col-span-4 space-y-3 sm:space-y-6">
                    <TechCard delay={0.1} className="!py-6 sm:!py-10 flex flex-col items-center text-center !px-3 sm:!px-6">
                        <div className="relative group cursor-pointer mb-3 sm:mb-6" onClick={handleAvatarClick}>
                            {avatarUrl ? (
                                <img
                                    src={avatarUrl}
                                    alt={user?.name || 'Avatar'}
                                    className="w-16 h-16 sm:w-24 sm:h-24 rounded-xl sm:rounded-3xl object-cover transition-all group-hover:shadow-elevated"
                                />
                            ) : (
                                <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-xl sm:rounded-3xl bg-pastel-peach flex items-center justify-center text-2xl sm:text-4xl font-bold text-orange-600 transition-all group-hover:shadow-elevated">
                                    {user?.name?.[0]?.toUpperCase() || 'U'}
                                </div>
                            )}
                            <div className="absolute bottom-0 right-0 w-6 h-6 sm:w-8 sm:h-8 bg-surface-card border border-surface-border rounded-lg sm:rounded-xl flex items-center justify-center shadow-soft group-hover:bg-blue-50 transition-colors">
                                {uploadingAvatar ? (
                                    <Loader2 size={10} className="sm:w-3 sm:h-3 text-blue-500 animate-spin" />
                                ) : (
                                    <Camera size={10} className="sm:w-3 sm:h-3 text-text-muted group-hover:text-blue-500 transition-colors" />
                                )}
                            </div>
                        </div>
                        <h3 className="text-base sm:text-xl font-bold text-text-primary mb-0.5">{user?.name || 'User'}</h3>
                        <p className="text-[10px] sm:text-sm text-text-muted mb-3 sm:mb-6 truncate max-w-full">{user?.email || 'user@example.com'}</p>
                        <Button variant="secondary" className="w-full text-[11px] sm:text-sm" onClick={openEditModal}>Edit Profile</Button>
                    </TechCard>

                    {/* Edit Profile Modal */}
                    <AnimatePresence>
                        {showEditModal && (
                            <motion.div
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                                onClick={(e) => e.target === e.currentTarget && setShowEditModal(false)}
                            >
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                    className="bg-surface-card border border-surface-border rounded-2xl shadow-elevated w-full max-w-md p-6"
                                >
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-lg font-bold text-text-primary">Edit Profile</h3>
                                        <button onClick={() => setShowEditModal(false)} className="p-1.5 rounded-lg hover:bg-surface-hover transition-colors">
                                            <X size={18} className="text-text-muted" />
                                        </button>
                                    </div>

                                    {/* Avatar in modal */}
                                    <div className="flex justify-center mb-6">
                                        <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
                                            {avatarUrl ? (
                                                <img src={avatarUrl} alt="Avatar" className="w-20 h-20 rounded-2xl object-cover group-hover:opacity-80 transition-opacity" />
                                            ) : (
                                                <div className="w-20 h-20 rounded-2xl bg-pastel-peach flex items-center justify-center text-3xl font-bold text-orange-600 group-hover:opacity-80 transition-opacity">
                                                    {user?.name?.[0]?.toUpperCase() || 'U'}
                                                </div>
                                            )}
                                            <div className="absolute bottom-0 right-0 w-7 h-7 bg-surface-card border border-surface-border rounded-lg flex items-center justify-center shadow-soft">
                                                {uploadingAvatar ? (
                                                    <Loader2 size={12} className="text-blue-500 animate-spin" />
                                                ) : (
                                                    <Camera size={12} className="text-text-muted" />
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-medium text-text-muted mb-1.5">Name</label>
                                            <input
                                                type="text"
                                                value={editName}
                                                onChange={(e) => setEditName(e.target.value)}
                                                className="w-full px-4 py-2.5 rounded-xl bg-surface border border-surface-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all"
                                                placeholder="Your name"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-text-muted mb-1.5">Email</label>
                                            <input
                                                type="email"
                                                value={user?.email || ''}
                                                disabled
                                                className="w-full px-4 py-2.5 rounded-xl bg-surface-muted border border-surface-border text-sm text-text-light cursor-not-allowed"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-text-muted mb-1.5">Phone</label>
                                            <input
                                                type="tel"
                                                value={editPhone}
                                                onChange={(e) => setEditPhone(e.target.value)}
                                                className="w-full px-4 py-2.5 rounded-xl bg-surface border border-surface-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all"
                                                placeholder="Your phone number"
                                            />
                                        </div>
                                    </div>

                                    {saveMsg && (
                                        <p className={`text-xs mt-3 text-center ${saveMsg.includes('updated') ? 'text-green-500' : 'text-red-500'}`}>
                                            {saveMsg}
                                        </p>
                                    )}

                                    <div className="flex gap-3 mt-6">
                                        <Button variant="secondary" className="flex-1 text-sm" onClick={() => setShowEditModal(false)}>Cancel</Button>
                                        <Button variant="primary" className="flex-1 text-sm" onClick={handleSaveProfile} disabled={saving}>
                                            {saving ? 'Saving...' : 'Save Changes'}
                                        </Button>
                                    </div>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <TechCard delay={0.2} className="!p-4 sm:!p-6">
                        <h4 className="text-[10px] sm:text-xs font-semibold text-text-muted mb-4 sm:mb-6">Preferences</h4>
                        <div className="space-y-4 sm:space-y-5">
                            {[
                                { label: 'Notifications', icon: Bell, active: emailNotifications, toggle: toggleNotifications },
                                { label: 'Dark Mode', icon: Moon, active: darkMode, toggle: toggleDarkMode },
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
                            <div className="flex items-center justify-between relative">
                                <div className="flex items-center gap-2 sm:gap-3">
                                    <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-surface border border-surface-border">
                                        <Globe size={14} className="text-text-light" />
                                    </div>
                                    <span className="text-xs sm:text-sm font-medium text-text-secondary">Language</span>
                                </div>
                                <div className="relative">
                                    <button onClick={() => setShowLangMenu(!showLangMenu)} className="text-xs sm:text-sm font-medium text-text-primary cursor-pointer hover:underline">
                                        {language}
                                    </button>
                                    {showLangMenu && (
                                        <div className="absolute right-0 top-full mt-2 bg-surface-card border border-surface-border rounded-xl shadow-elevated z-50 py-1 min-w-[120px]">
                                            {['English', 'Hindi', 'Telugu', 'Tamil', 'Kannada'].map(lang => (
                                                <button key={lang} onClick={() => { setLanguage(lang); setShowLangMenu(false); }}
                                                    className={`w-full text-left px-4 py-2 text-xs sm:text-sm hover:bg-surface-hover transition-colors ${language === lang ? 'font-bold text-text-primary' : 'text-text-secondary'}`}>
                                                    {lang}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </TechCard>
                </div>

                {/* Main Settings */}
                <div className="lg:col-span-8 space-y-3 sm:space-y-6">
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
