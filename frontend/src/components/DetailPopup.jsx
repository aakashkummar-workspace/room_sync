import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export const DetailPopup = ({ isOpen, onClose, title, children, color = 'bg-white' }) => {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-text-primary/20 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.95 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className={`relative w-full max-w-md ${color} rounded-t-3xl sm:rounded-3xl shadow-elevated overflow-hidden z-10 max-h-[85vh] overflow-y-auto`}
                    >
                        <div className="w-12 h-1 bg-surface-muted rounded-full mx-auto mt-3 sm:hidden" />

                        <div className="sticky top-0 z-10 px-5 sm:px-6 pt-4 sm:pt-5 pb-3 flex items-center justify-between bg-inherit">
                            <h3 className="text-base sm:text-lg font-bold text-text-primary">{title}</h3>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-black/5 rounded-xl transition-all text-text-muted hover:text-text-primary"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="px-5 sm:px-6 pb-6">
                            {children}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export const DetailRow = ({ label, value, icon: Icon, color = 'bg-surface' }) => (
    <div className="flex items-center justify-between py-3 border-b border-surface-border/50 last:border-0">
        <div className="flex items-center gap-3">
            {Icon && (
                <div className={`p-2 rounded-lg ${color}`}>
                    <Icon size={14} className="text-text-secondary" />
                </div>
            )}
            <span className="text-xs sm:text-sm text-text-muted">{label}</span>
        </div>
        <span className="text-sm sm:text-base font-semibold text-text-primary">{value}</span>
    </div>
);
