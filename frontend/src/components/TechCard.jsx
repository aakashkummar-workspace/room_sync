import React from 'react';
import { motion } from 'framer-motion';

export const TechCard = ({ children, className = '', delay = 0 }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{
                opacity: 1,
                y: 0,
                transition: { delay, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }
            }}
            whileHover={{
                y: -3,
                transition: { duration: 0.3, ease: "easeOut" }
            }}
            className={`soft-card ${className}`}
        >
            {children}
        </motion.div>
    );
};
