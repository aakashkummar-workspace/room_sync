import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Mail, User, Home, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';


export const Login = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('login');
    const [socialLoading, setSocialLoading] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const { login, googleLogin, facebookLogin, signup } = useAuth();
    const navigate = useNavigate();

    const facebookAppId = import.meta.env.VITE_FACEBOOK_APP_ID || '';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            if (activeTab === 'signup') {
                if (!name.trim()) { setError('Please enter your name.'); return; }
                await signup({ name: name.trim(), email, password });
            }
            await login(email, password);
            navigate('/');
        } catch (err) {
            if (activeTab === 'signup') {
                const msg = err?.response?.data?.detail || 'Signup failed. Email may already be registered.';
                setError(msg);
            } else {
                setError('Invalid email or password. Please try again.');
            }
        }
    };

    const handleGoogleLogin = async () => {
        setSocialLoading('google');
        setError('');
        try {
            await googleLogin('mock_google_token');
            navigate('/');
        } catch (err) {
            setError('Google login failed. Please try again.');
        } finally {
            setSocialLoading('');
        }
    };

    const handleFacebookLogin = useCallback(async () => {
        setSocialLoading('facebook');
        setError('');
        try {
            await facebookLogin('mock_fb_token');
            navigate('/');
        } catch (err) { setError('Facebook login failed.'); }
        setSocialLoading('');
    }, [facebookLogin, navigate]);

    /* ─── Shared Form JSX ─── */
    const formContent = (isMobile = false) => (
        <form onSubmit={handleSubmit} className={isMobile ? 'space-y-3' : 'space-y-5'}>
            <AnimatePresence>
                {activeTab === 'signup' && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                        {isMobile ? (
                            <div>
                                <label className="block text-[8px] font-semibold text-white/50 mb-1 ml-0.5">Full Name</label>
                                <div className="border border-white/20 rounded-lg px-3 py-2 bg-white/5 backdrop-blur-sm focus-within:border-blue-400/50 transition-colors">
                                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter your name"
                                        className="w-full bg-transparent outline-none text-[10px] text-white placeholder:text-white/30" required />
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2.5 bg-surface rounded-xl px-3 py-2.5 border border-surface-border focus-within:border-text-primary/30 transition-colors">
                                <User size={14} className="text-text-light shrink-0" />
                                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full Name"
                                    className="flex-1 bg-transparent outline-none text-sm text-text-primary placeholder:text-text-muted min-w-0" required />
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {isMobile ? (
                <>
                    <div>
                        <label className="block text-[8px] font-semibold text-white/50 mb-1 ml-0.5">Email address</label>
                        <div className="border border-white/20 rounded-lg px-3 py-2 bg-white/5 backdrop-blur-sm focus-within:border-blue-400/50 transition-colors">
                            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email"
                                autoComplete="email" className="w-full bg-transparent outline-none text-[10px] text-white placeholder:text-white/30" required />
                        </div>
                    </div>
                    <div>
                        <label className="block text-[8px] font-semibold text-white/50 mb-1 ml-0.5">Password</label>
                        <div className="border border-white/20 rounded-lg px-3 py-2 bg-white/5 backdrop-blur-sm focus-within:border-blue-400/50 transition-colors flex items-center gap-2">
                            <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password"
                                autoComplete="current-password" className="flex-1 bg-transparent outline-none text-[10px] text-white placeholder:text-white/30 min-w-0" required />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-white/40 hover:text-white/70 transition-colors shrink-0">
                                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                        </div>
                    </div>
                </>
            ) : (
                <>
                    <div className="flex items-center gap-2.5 bg-surface rounded-xl px-3 py-2.5 border border-surface-border focus-within:border-text-primary/30 transition-colors">
                        <Mail size={14} className="text-text-light shrink-0" />
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address"
                            autoComplete="email" className="flex-1 bg-transparent outline-none text-sm text-text-primary placeholder:text-text-muted min-w-0" required />
                    </div>
                    <div className="flex items-center gap-2.5 bg-surface rounded-xl px-3 py-2.5 border border-surface-border focus-within:border-text-primary/30 transition-colors">
                        <Lock size={14} className="text-text-light shrink-0" />
                        <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password"
                            autoComplete="current-password" className="flex-1 bg-transparent outline-none text-sm text-text-primary placeholder:text-text-muted min-w-0" required />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-text-light hover:text-text-secondary transition-colors shrink-0">
                            {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                    </div>
                </>
            )}

            {error && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className={`text-[10px] font-medium ${isMobile ? 'text-red-300' : 'text-red-500'} px-1`}>{error}</motion.p>
            )}

            {isMobile ? (
                <>
                    {activeTab === 'login' && (
                        <button type="button" className="text-[10px] font-medium text-white/50 hover:text-white/80 transition-colors">
                            Forget Password ?
                        </button>
                    )}
                    <motion.button type="submit" whileTap={{ scale: 0.97 }}
                        className="w-full py-2.5 rounded-lg font-bold text-xs text-white tracking-wide shadow-lg transition-all"
                        style={{ background: 'linear-gradient(135deg, #1a365d 0%, #2d4a7a 50%, #3b6eb5 100%)' }}>
                        {activeTab === 'login' ? 'Login' : 'Create Account'}
                    </motion.button>
                </>
            ) : (
                <div className="flex items-center justify-between pt-1">
                    {activeTab === 'login' && (
                        <button type="button" className="text-xs font-medium text-text-muted hover:text-text-primary transition-colors">Forgot Password?</button>
                    )}
                    <motion.button type="submit" whileTap={{ scale: 0.97 }}
                        className={`px-8 py-2.5 rounded-xl bg-text-primary text-white text-sm font-bold shadow-button hover:shadow-elevated transition-all ${activeTab === 'signup' ? 'w-full' : 'ml-auto'}`}>
                        {activeTab === 'login' ? 'Login' : 'Create Account'}
                    </motion.button>
                </div>
            )}
        </form>
    );

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
            {/* ════════ MOBILE / TABLET VIEW (< lg) ════════ */}
            <div className="lg:hidden absolute inset-0 flex items-center justify-center"
                style={{ background: 'linear-gradient(160deg, #0a1628 0%, #0d1f3c 25%, #112240 50%, #1a365d 75%, #1e3a5f 100%)' }}>

                {/* Decorative flowing shapes */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-[20%] -right-[20%] w-[70%] h-[60%] rounded-full opacity-25"
                        style={{ background: 'radial-gradient(ellipse, #1a365d 0%, transparent 70%)' }} />
                    <div className="absolute -bottom-[15%] -left-[15%] w-[60%] h-[50%] rounded-full opacity-15"
                        style={{ background: 'radial-gradient(ellipse, #2d4a7a 0%, transparent 70%)' }} />
                    <div className="absolute top-[30%] -right-[10%] w-[40%] h-[40%] rounded-full opacity-10 rotate-45"
                        style={{ background: 'radial-gradient(ellipse, #3b82f6 0%, transparent 70%)' }} />
                    {/* Subtle lines */}
                    <div className="absolute top-[15%] left-[10%] w-[80%] h-px bg-gradient-to-r from-transparent via-white/8 to-transparent" />
                    <div className="absolute bottom-[25%] left-[5%] w-[60%] h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                </div>

                {/* Glass Card */}
                <motion.div initial={{ opacity: 0, y: 30, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.6 }}
                    className="w-[82%] max-w-[320px] relative z-10">

                    <div className="rounded-2xl p-5 pt-6 border border-white/15 shadow-2xl"
                        style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>

                        {/* Logo */}
                        <div className="flex flex-col items-center mb-4">
                            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center mb-2 border border-white/20">
                                <Home size={16} className="text-blue-300" />
                            </div>
                            <h1 className="text-sm font-bold text-white tracking-wide">CasaSync</h1>
                            <p className="text-[8px] text-white/40 font-medium tracking-wider uppercase">Smart Hostel Automation</p>
                        </div>

                        {/* Welcome text */}
                        <h2 className="text-center text-white text-sm font-semibold mb-4">
                            {activeTab === 'login' ? 'Welcome Back' : 'Create Account'}
                        </h2>

                        {/* Form */}
                        {formContent(true)}

                        {/* Social login */}
                        <div className="mt-4">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="flex-1 h-px bg-white/10" />
                                <span className="text-[9px] text-white/30 font-medium">or continue with</span>
                                <div className="flex-1 h-px bg-white/10" />
                            </div>
                            <div className="flex gap-3">
                                <motion.button onClick={() => handleGoogleLogin()} disabled={socialLoading === 'google'} whileTap={{ scale: 0.97 }}
                                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 transition-all disabled:opacity-50">
                                    {socialLoading === 'google' ? <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : (
                                        <svg viewBox="0 0 24 24" width="12" height="12">
                                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                                        </svg>
                                    )}
                                    <span className="text-[9px] font-semibold text-white/60">Google</span>
                                </motion.button>
                                <motion.button onClick={handleFacebookLogin} disabled={socialLoading === 'facebook'} whileTap={{ scale: 0.97 }}
                                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 transition-all disabled:opacity-50">
                                    {socialLoading === 'facebook' ? <div className="w-3.5 h-3.5 border-2 border-blue-300/30 border-t-blue-400 rounded-full animate-spin" /> : (
                                        <svg viewBox="0 0 24 24" width="12" height="12" fill="#60a5fa">
                                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                                        </svg>
                                    )}
                                    <span className="text-[9px] font-semibold text-white/60">Facebook</span>
                                </motion.button>
                            </div>
                        </div>
                    </div>

                    {/* Bottom toggle */}
                    <p className="text-center text-[10px] text-white/40 mt-5">
                        {activeTab === 'login' ? 'Are You New Member ? ' : 'Already have an account ? '}
                        <button onClick={() => setActiveTab(activeTab === 'login' ? 'signup' : 'login')}
                            className="text-white font-bold hover:text-blue-300 transition-colors">
                            {activeTab === 'login' ? 'Sign UP' : 'Login'}
                        </button>
                    </p>
                </motion.div>
            </div>

            {/* ════════ DESKTOP VIEW (>= lg) ════════ */}
            <div className="hidden lg:flex absolute inset-0 items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #0D1B2A 0%, #1A1A2E 30%, #2D2B55 50%, #4A3F6B 70%, #6B5B8A 100%)' }}>

                {/* Desktop geometric shapes */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute top-0 left-0 w-[60%] h-full"
                        style={{ background: 'linear-gradient(135deg, #0A0F1A 0%, #141428 100%)', clipPath: 'polygon(0 0, 75% 0, 45% 100%, 0 100%)' }} />
                    <div className="absolute top-0 left-0 w-[55%] h-full"
                        style={{ background: 'linear-gradient(135deg, #111827 0%, #1E1E3A 100%)', clipPath: 'polygon(0 0, 65% 0, 35% 100%, 0 100%)' }} />
                    <div className="absolute top-0 left-0 w-[50%] h-full"
                        style={{ background: 'linear-gradient(135deg, #0D1117 0%, #161629 100%)', clipPath: 'polygon(0 0, 55% 0, 25% 100%, 0 100%)' }} />
                    <div className="absolute top-[10%] right-[10%] w-[300px] h-[300px] bg-pastel-lavender/20 rounded-full blur-[120px]" />
                    <div className="absolute bottom-[10%] left-[30%] w-[250px] h-[250px] bg-pastel-pink/15 rounded-full blur-[100px]" />
                </div>

                {/* Desktop side tabs */}
                <div className="absolute left-[22%] top-1/2 -translate-y-1/2 z-20 flex flex-col gap-3">
                    <motion.button onClick={() => setActiveTab('login')}
                        className={`px-6 py-2.5 rounded-lg text-sm font-bold tracking-wide transition-all ${activeTab === 'login' ? 'bg-white text-text-primary shadow-lg' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}
                        whileHover={{ x: 5 }} whileTap={{ scale: 0.95 }}>LOGIN</motion.button>
                    <motion.button onClick={() => setActiveTab('signup')}
                        className={`px-6 py-2.5 rounded-lg text-sm font-bold tracking-wide transition-all ${activeTab === 'signup' ? 'bg-white text-text-primary shadow-lg' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}
                        whileHover={{ x: 5 }} whileTap={{ scale: 0.95 }}>SIGN UP</motion.button>
                </div>

                {/* Desktop Card */}
                <motion.div initial={{ opacity: 0, y: 30, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.6 }}
                    className="w-full max-w-md relative z-10 ml-[20%]">
                    <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
                        <div className="flex flex-col items-center pt-8 pb-4">
                            <div className="w-20 h-20 rounded-full bg-text-primary flex items-center justify-center shadow-lg mb-3">
                                <User size={36} className="text-white" />
                            </div>
                            <h2 className="text-xl font-bold tracking-wide text-text-primary">
                                {activeTab === 'login' ? 'LOGIN' : 'SIGN UP'}
                            </h2>
                        </div>

                        <div className="px-8 pb-5">
                            {formContent(false)}
                        </div>

                        <div className="px-8">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="flex-1 h-px bg-surface-border" />
                                <span className="text-[10px] text-text-muted font-medium">or continue with</span>
                                <div className="flex-1 h-px bg-surface-border" />
                            </div>
                        </div>

                        <div className="px-8 pb-8 flex gap-3">
                            <motion.button onClick={() => handleGoogleLogin()} disabled={socialLoading === 'google'} whileTap={{ scale: 0.97 }}
                                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-surface-border hover:bg-surface transition-all disabled:opacity-50">
                                {socialLoading === 'google' ? <div className="w-4 h-4 border-2 border-text-light border-t-text-primary rounded-full animate-spin" /> : (
                                    <svg viewBox="0 0 24 24" width="16" height="16">
                                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                                    </svg>
                                )}
                                <span className="text-xs font-semibold text-text-secondary">Google</span>
                            </motion.button>
                            <motion.button onClick={handleFacebookLogin} disabled={socialLoading === 'facebook'} whileTap={{ scale: 0.97 }}
                                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-surface-border hover:bg-blue-50 transition-all disabled:opacity-50">
                                {socialLoading === 'facebook' ? <div className="w-4 h-4 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" /> : (
                                    <svg viewBox="0 0 24 24" width="16" height="16" fill="#1877F2">
                                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                                    </svg>
                                )}
                                <span className="text-xs font-semibold text-text-secondary">Facebook</span>
                            </motion.button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};
