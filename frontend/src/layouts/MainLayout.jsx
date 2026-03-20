import React from 'react';
import { Sidebar } from '../components/Sidebar';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Search } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export const MainLayout = ({ children }) => {
    const { user } = useAuth();

    return (
        <div className="flex min-h-screen bg-surface overflow-hidden">
            <Sidebar />
            <main className="flex-1 h-screen overflow-y-auto relative w-full">
                {/* Header */}
                <header className="sticky top-0 z-30 flex items-center justify-between px-3 sm:px-5 lg:px-8 py-3 sm:py-4 bg-surface-card/80 backdrop-blur-xl border-b border-surface-border gap-2">
                    <div className="flex items-center gap-2 sm:gap-3 bg-surface border border-surface-border px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl flex-1 max-w-[200px] sm:max-w-[280px] lg:max-w-[320px] focus-within:ring-2 focus-within:ring-text-primary/10 transition-all">
                        <Search size={16} className="text-text-muted shrink-0" />
                        <input
                            type="text"
                            placeholder="Search..."
                            className="bg-transparent border-none outline-none text-sm font-medium w-full text-text-primary placeholder:text-text-muted min-w-0"
                        />
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            className="relative p-2 sm:p-2.5 bg-surface border border-surface-border rounded-lg sm:rounded-xl hover:bg-surface-hover transition-colors"
                        >
                            <Bell size={16} className="sm:w-[18px] sm:h-[18px] text-text-secondary" />
                            <span className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-red-400 rounded-full" />
                        </motion.button>
                        <motion.div
                            whileTap={{ scale: 0.95 }}
                            className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-3 border-l border-surface-border cursor-pointer"
                        >
                            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-pastel-peach flex items-center justify-center shadow-soft">
                                <span className="text-xs sm:text-sm font-bold text-accent-coral">{user?.name?.[0]?.toUpperCase() || 'U'}</span>
                            </div>
                            <div className="hidden md:block">
                                <p className="text-sm font-semibold text-text-primary">{user?.name || 'User'}</p>
                                <p className="text-[10px] text-text-muted">Member</p>
                            </div>
                        </motion.div>
                    </div>
                </header>

                {/* Content */}
                <div className="p-3 sm:p-5 lg:p-8 pb-20 sm:pb-24 lg:pb-8">
                    <AnimatePresence mode="wait">
                        <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                        >
                            {children}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
};
