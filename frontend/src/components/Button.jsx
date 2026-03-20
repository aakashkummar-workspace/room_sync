import React from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
    return twMerge(clsx(inputs));
}

export const Button = ({
    children,
    onClick,
    variant = 'primary',
    className = '',
    icon: Icon,
    type = 'button',
    disabled = false,
}) => {
    const variants = {
        primary: 'bg-text-primary text-white hover:bg-text-primary/90 shadow-button',
        secondary: 'bg-surface border border-surface-border text-text-secondary hover:bg-surface-hover shadow-soft',
        outline: 'bg-transparent border-2 border-text-primary text-text-primary hover:bg-text-primary/5',
        ghost: 'bg-transparent text-text-secondary hover:bg-surface-hover',
        pastel: 'bg-pastel-pink text-text-primary hover:bg-pastel-pink-dark/30 shadow-soft',
    };

    return (
        <motion.button
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.97 }}
            onClick={onClick}
            type={type}
            disabled={disabled}
            className={cn(
                'premium-button text-sm font-semibold',
                variants[variant],
                disabled && 'opacity-40 cursor-not-allowed',
                className
            )}
        >
            {Icon && <Icon size={18} />}
            {children}
        </motion.button>
    );
};
