import React from 'react';
import { motion } from 'framer-motion';

const FloatingObject = ({ children, delay = 0, duration = 15, className = '' }) => (
    <motion.div
        animate={{ 
            translateY: [-10, 10, -10],
            rotate: [0, 2, -2, 0]
        }}
        transition={{ 
            duration, 
            repeat: Infinity, 
            ease: "easeInOut",
            delay 
        }}
        className={`absolute pointer-events-none ${className}`}
    >
        {children}
    </motion.div>
);

const IsometricCube = ({ color = 'var(--tech-cyan)', size = 40 }) => (
    <div style={{ width: size, height: size, transformStyle: 'preserve-3d', transform: 'rotateX(-30deg) rotateY(45deg)' }}>
        <div className="absolute inset-0 border border-white/5" style={{ background: color, opacity: 0.1, transform: `translateZ(${size/2}px)` }} />
        <div className="absolute inset-0 border border-white/5" style={{ background: color, opacity: 0.15, transform: `rotateY(90deg) translateZ(${size/2}px)` }} />
        <div className="absolute inset-0 border border-white/5" style={{ background: color, opacity: 0.2, transform: `rotateX(90deg) translateZ(${size/2}px)` }} />
    </div>
);

const CloudNode = () => (
    <div className="relative">
        <div className="w-16 h-8 bg-tech-blue/10 rounded-full blur-xl animate-pulse" />
        <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 border border-tech-cyan/20 rounded-lg transform rotate-45" />
            <div className="absolute w-1.5 h-1.5 bg-tech-cyan/40 rounded-full" />
        </div>
    </div>
);

export const Scene3D = () => {
    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
            {/* Isometric Grid - Extremely subtle */}
            <div className="isometric-grid opacity-10" />
            
            {/* Background Glows */}
            <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-tech-blue/[0.05] blur-[180px] rounded-full animate-pulse" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-tech-cyan/[0.05] blur-[180px] rounded-full animate-pulse" style={{ animationDelay: '3s' }} />

            {/* Decorative Isometric Objects */}
            <FloatingObject className="top-[15%] left-[5%]" delay={0} duration={20}>
                <div className="flex flex-col gap-4">
                    <IsometricCube size={25} color="var(--tech-blue)" />
                    <IsometricCube size={25} color="var(--tech-cyan)" />
                </div>
            </FloatingObject>

            <FloatingObject className="top-[20%] right-[10%]" delay={2} duration={25}>
                <div className="w-40 h-24 border border-white/5 bg-white/[0.01] rounded-2xl transform skew-y-[-5deg] backdrop-blur-md relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-tech-glow/20" />
                    <div className="p-4 space-y-3">
                        <div className="w-1/3 h-1 bg-white/5 rounded-full" />
                        <div className="w-1/2 h-1 bg-white/5 rounded-full" />
                        <div className="w-2/5 h-1 bg-tech-glow/10 rounded-full" />
                    </div>
                </div>
            </FloatingObject>

            <FloatingObject className="bottom-[20%] left-[10%]" delay={4} duration={30}>
                <div className="space-y-12">
                    <CloudNode />
                    <div className="ml-12"><CloudNode /></div>
                </div>
            </FloatingObject>

            <FloatingObject className="bottom-[10%] right-[12%]" delay={1} duration={22}>
                <div className="flex gap-6">
                    <IsometricCube size={20} color="white" />
                    <div className="mt-6"><IsometricCube size={20} color="var(--tech-cyan)" /></div>
                </div>
            </FloatingObject>

            {/* Particles - Slower and fewer */}
            {[...Array(15)].map((_, i) => (
                <motion.div
                    key={i}
                    initial={{ 
                        x: Math.random() * 100 + 'vw', 
                        y: Math.random() * 100 + 'vh',
                        opacity: 0,
                    }}
                    animate={{ 
                        opacity: [0, 0.15, 0],
                        y: ['-5%', '105%'],
                    }}
                    transition={{ 
                        duration: Math.random() * 20 + 20, 
                        repeat: Infinity,
                        delay: Math.random() * 10 
                    }}
                    className="absolute w-[2px] h-[2px] bg-white/30 rounded-full blur-[0.5px]"
                />
            ))}

            {/* Pulsing connection lines - Even more subtle */}
            <svg className="absolute inset-0 w-full h-full opacity-[0.02]">
                <path d="M 100 200 L 400 500 L 200 800" stroke="white" strokeWidth="0.5" fill="none" />
                <path d="M 800 100 L 600 400 L 900 700" stroke="white" strokeWidth="0.5" fill="none" />
            </svg>
        </div>
    );
};
