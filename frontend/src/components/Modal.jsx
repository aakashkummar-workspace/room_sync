import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export const Modal = ({ isOpen, onClose, title, children }) => {
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
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 40 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="relative w-full max-w-lg bg-surface-card rounded-t-3xl sm:rounded-3xl shadow-elevated overflow-hidden z-10 max-h-[90vh] sm:max-h-[85vh] overflow-y-auto"
                    >
                        <div className="w-12 h-1 bg-surface-muted rounded-full mx-auto mt-3 sm:hidden" />

                        <div className="px-5 sm:px-6 pt-5 sm:pt-6 pb-3 flex items-center justify-between sticky top-0 bg-surface-card z-10">
                            <h3 className="text-lg sm:text-xl font-bold text-text-primary">{title}</h3>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-surface-hover rounded-xl transition-all text-text-muted hover:text-text-primary"
                            >
                                <X size={20} />
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
