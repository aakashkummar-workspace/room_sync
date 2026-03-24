import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Wallet, CheckSquare, Package, PieChart, Bell, Settings, LogOut, Users, MoreHorizontal } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const NavItem = ({ icon: Icon, label, path, active }) => (
    <Link to={path}>
        <motion.div
            whileHover={{ y: -2 }}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 group ${active
                ? 'bg-text-primary text-white shadow-button'
                : 'text-text-muted hover:bg-surface-hover hover:text-text-primary'
                }`}
        >
            <Icon size={20} className={active ? 'text-white' : 'text-text-muted group-hover:text-text-primary'} />
            <span className="font-semibold text-sm">{label}</span>
        </motion.div>
    </Link>
);

const BottomNavItem = ({ icon: Icon, label, path, active }) => (
    <Link to={path} className="flex-1 min-w-0">
        <div className={`flex flex-col items-center gap-0.5 py-1.5 transition-all duration-300 ${active ? 'text-text-primary' : 'text-text-muted'}`}>
            <div className={`p-1.5 rounded-xl transition-all ${active ? 'bg-text-primary text-white shadow-button' : ''}`}>
                <Icon size={18} />
            </div>
            <span className="text-[9px] font-semibold truncate">{label}</span>
        </div>
    </Link>
);

export const Sidebar = () => {
    const location = useLocation();
    const { logout } = useAuth();
    const [showMore, setShowMore] = useState(false);

    const menuItems = [
        { icon: Home, label: 'Home', path: '/' },
        { icon: Wallet, label: 'Expenses', path: '/expenses' },
        { icon: CheckSquare, label: 'Chores', path: '/chores' },
        { icon: Package, label: 'Inventory', path: '/inventory' },
        { icon: Users, label: 'Roommates', path: '/roommates' },
        { icon: PieChart, label: 'Analytics', path: '/analytics' },
    ];

    const bottomNavItems = [
        { icon: Home, label: 'Home', path: '/' },
        { icon: Wallet, label: 'Expenses', path: '/expenses' },
        { icon: Users, label: 'Roommates', path: '/roommates' },
    ];

    const moreMenuItems = [
        { icon: CheckSquare, label: 'Chores', path: '/chores' },
        { icon: Package, label: 'Inventory', path: '/inventory' },
        { icon: PieChart, label: 'Analytics', path: '/analytics' },
        { icon: Bell, label: 'Notices', path: '/notices' },
        { icon: Settings, label: 'Settings', path: '/settings' },
    ];

    const isMoreActive = moreMenuItems.some(item => location.pathname === item.path);

    return (
        <>
            {/* Desktop Sidebar */}
            <div className="w-72 h-screen p-5 hidden lg:flex flex-col border-r border-surface-border bg-surface-card">
                <div className="flex items-center gap-3 mb-10 px-3">
                    <div className="w-10 h-10 bg-text-primary rounded-2xl flex items-center justify-center shadow-button">
                        <Home className="text-white" size={20} />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-text-primary">CasaSync</h1>
                        <p className="text-[10px] text-text-muted font-medium">Room Management</p>
                    </div>
                </div>

                <nav className="flex-1 space-y-1.5">
                    {menuItems.map((item) => (
                        <NavItem
                            key={item.path}
                            {...item}
                            active={location.pathname === item.path}
                        />
                    ))}
                </nav>

                <div className="pt-4 border-t border-surface-border space-y-1.5">
                    <NavItem icon={Bell} label="Notices" path="/notices" active={location.pathname === '/notices'} />
                    <NavItem icon={Settings} label="Settings" path="/settings" active={location.pathname === '/settings'} />
                    <button
                        onClick={logout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-red-400 hover:text-red-500 hover:bg-red-50 transition-all duration-300"
                    >
                        <LogOut size={20} />
                        <span className="font-semibold text-sm">Logout</span>
                    </button>
                </div>
            </div>

            {/* Mobile Bottom Navigation — compact & minimal */}
            <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-surface-card/90 backdrop-blur-lg border-t border-surface-border shadow-elevated bottom-nav">
                <div className="flex items-center justify-around px-1 py-0.5">
                    {bottomNavItems.map((item) => (
                        <BottomNavItem
                            key={item.path}
                            {...item}
                            active={location.pathname === item.path}
                        />
                    ))}
                    {/* More button */}
                    <button onClick={() => setShowMore(true)} className="flex-1 min-w-0">
                        <div className={`flex flex-col items-center gap-0.5 py-1.5 transition-all duration-300 ${isMoreActive ? 'text-text-primary' : 'text-text-muted'}`}>
                            <div className={`p-1.5 rounded-xl transition-all ${isMoreActive ? 'bg-text-primary text-white shadow-button' : ''}`}>
                                <MoreHorizontal size={18} />
                            </div>
                            <span className="text-[9px] font-semibold">More</span>
                        </div>
                    </button>
                </div>
            </div>

            {/* More Menu Sheet */}
            <AnimatePresence>
                {showMore && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60] lg:hidden"
                        onClick={() => setShowMore(false)}
                    >
                        <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
                        <motion.div
                            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                            className="absolute bottom-0 left-0 right-0 bg-surface-card rounded-t-3xl shadow-elevated p-5 pb-8 bottom-nav"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="w-10 h-1 bg-surface-muted rounded-full mx-auto mb-5" />
                            <div className="grid grid-cols-4 gap-3">
                                {moreMenuItems.map((item) => (
                                    <Link key={item.path} to={item.path} onClick={() => setShowMore(false)}>
                                        <div className={`flex flex-col items-center gap-1.5 py-3 rounded-2xl transition-all ${location.pathname === item.path ? 'bg-text-primary text-white shadow-button' : 'bg-surface hover:bg-surface-hover text-text-muted'}`}>
                                            <item.icon size={20} />
                                            <span className="text-[10px] font-semibold">{item.label}</span>
                                        </div>
                                    </Link>
                                ))}
                                <button onClick={() => { setShowMore(false); logout(); }}>
                                    <div className="flex flex-col items-center gap-1.5 py-3 rounded-2xl bg-red-50 hover:bg-red-100 text-red-400 transition-all">
                                        <LogOut size={20} />
                                        <span className="text-[10px] font-semibold">Logout</span>
                                    </div>
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};
