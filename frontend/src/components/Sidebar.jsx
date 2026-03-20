import React from 'react';
import { motion } from 'framer-motion';
import { Home, Wallet, CheckSquare, Package, PieChart, Bell, Settings, LogOut, Users } from 'lucide-react';
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
    <Link to={path} className="flex-1">
        <div className={`flex flex-col items-center gap-1 py-2 transition-all duration-300 ${active ? 'text-text-primary' : 'text-text-muted'}`}>
            <div className={`p-1.5 rounded-xl transition-all ${active ? 'bg-text-primary text-white shadow-button' : ''}`}>
                <Icon size={20} />
            </div>
            <span className="text-[10px] font-semibold">{label}</span>
        </div>
    </Link>
);

export const Sidebar = () => {
    const location = useLocation();
    const { logout } = useAuth();

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
        { icon: CheckSquare, label: 'Chores', path: '/chores' },
        { icon: Package, label: 'Inventory', path: '/inventory' },
        { icon: Settings, label: 'Settings', path: '/settings' },
    ];

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

            {/* Mobile Bottom Navigation */}
            <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-surface-card border-t border-surface-border shadow-elevated bottom-nav">
                <div className="flex items-center justify-around px-2 py-1">
                    {bottomNavItems.map((item) => (
                        <BottomNavItem
                            key={item.path}
                            {...item}
                            active={location.pathname === item.path}
                        />
                    ))}
                </div>
            </div>
        </>
    );
};
