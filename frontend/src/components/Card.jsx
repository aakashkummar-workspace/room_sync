import React from 'react';
import { motion } from 'framer-motion';

export const Card = ({ children, className = '', title, subtitle }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className={`soft-card ${className}`}
        >
            {(title || subtitle) && (
                <div className="mb-4">
                    {title && <h3 className="text-lg font-bold text-text-primary">{title}</h3>}
                    {subtitle && <p className="text-sm text-text-muted">{subtitle}</p>}
                </div>
            )}
            {children}
        </motion.div>
    );
};
