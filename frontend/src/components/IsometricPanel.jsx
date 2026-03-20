import React from 'react';
import { motion } from 'framer-motion';

export const IsometricPanel = ({ children, className = '', depth = 10, delay = 0 }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 50, rotateX: 60, rotateZ: -45 }}
            animate={{ 
                opacity: 1, 
                y: 0, 
                rotateX: 60, 
                rotateZ: -45,
                transition: { delay, duration: 1, ease: [0.16, 1, 0.3, 1] }
            }}
            whileHover={{ 
                translateY: -20,
                translateZ: 20,
                transition: { duration: 0.3 }
            }}
            style={{ transformStyle: 'preserve-3d' }}
            className={`relative group ${className}`}
        >
            {/* The "Depth" or "Thickness" of the panel */}
            <div 
                className="absolute inset-x-0 bottom-0 bg-tech-cyan/20 blur-md rounded-full transform -translate-y-10 scale-90 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ height: '40px', transform: 'translateZ(-50px)' }}
            />
            
            {/* Main Surface */}
            <div className="glass-card relative z-10 overflow-hidden border-tech-glow/30">
                {/* Decorative glowing edge */}
                <div className="absolute inset-0 bg-gradient-to-br from-tech-glow/5 to-transparent pointer-events-none" />
                
                {children}

                {/* Animated light particle inside */}
                <motion.div 
                    animate={{ 
                        left: ['0%', '100%', '0%'],
                        top: ['0%', '100%', '0%'],
                    }}
                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                    className="absolute w-20 h-20 bg-tech-glow/10 blur-2xl rounded-full pointer-events-none"
                />
            </div>
            
            {/* Subtle floating animation wrapper */}
            <motion.div
                animate={{ translateY: [-5, 5, -5] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 pointer-events-none"
            >
                <div className="w-full h-full border border-tech-glow/10 rounded-[2.5rem] transform translate-y-2 translate-z-[-10px]" />
            </motion.div>
        </motion.div>
    );
};
