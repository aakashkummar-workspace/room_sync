import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Lock, User } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';

export const Login = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('login');
    const [socialLoading, setSocialLoading] = useState('');
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

    // --- Google Login ---
    const handleGoogleLogin = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            setSocialLoading('google');
            setError('');
            try {
                // useGoogleLogin gives an access_token, we need to get the id_token
                // Fetch user info from Google using the access token, then send to backend
                const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                    headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
                });
                const userInfo = await res.json();

                // Send the access_token as credential — backend will verify
                // We'll use the access_token flow instead of id_token
                await googleLogin(tokenResponse.access_token);
                navigate('/');
            } catch (err) {
                setError('Google login failed. Please try again.');
            } finally {
                setSocialLoading('');
            }
        },
        onError: () => {
            setError('Google login was cancelled.');
        },
    });

    // --- Facebook Login ---
    useEffect(() => {
        if (!facebookAppId) return;
        // Load Facebook SDK
        if (document.getElementById('facebook-jssdk')) return;
        const script = document.createElement('script');
        script.id = 'facebook-jssdk';
        script.src = 'https://connect.facebook.net/en_US/sdk.js';
        script.async = true;
        script.defer = true;
        script.crossOrigin = 'anonymous';
        script.onload = () => {
            window.FB?.init({
                appId: facebookAppId,
                cookie: true,
                xfbml: false,
                version: 'v19.0',
            });
        };
        document.body.appendChild(script);
    }, [facebookAppId]);

    const handleFacebookLogin = useCallback(() => {
        if (!window.FB) {
            setError('Facebook SDK not loaded. Check your App ID.');
            return;
        }
        setSocialLoading('facebook');
        setError('');
        window.FB.login(
            async (response) => {
                if (response.authResponse) {
                    try {
                        await facebookLogin(response.authResponse.accessToken);
                        navigate('/');
                    } catch (err) {
                        setError('Facebook login failed. Please try again.');
                    }
                } else {
                    setError('Facebook login was cancelled.');
                }
                setSocialLoading('');
            },
            { scope: 'email,public_profile' }
        );
    }, [facebookLogin, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #0D1B2A 0%, #1A1A2E 30%, #2D2B55 50%, #4A3F6B 70%, #6B5B8A 100%)' }}>

            {/* Geometric background shapes */}
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

            {/* Tabs on the left (desktop) */}
            <div className="absolute left-[18%] sm:left-[22%] top-1/2 -translate-y-1/2 z-20 hidden md:flex flex-col gap-3">
                <motion.button onClick={() => setActiveTab('login')}
                    className={`px-6 py-2.5 rounded-lg text-sm font-bold tracking-wide transition-all ${activeTab === 'login' ? 'bg-white text-text-primary shadow-lg' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}
                    whileHover={{ x: 5 }} whileTap={{ scale: 0.95 }}>LOGIN</motion.button>
                <motion.button onClick={() => setActiveTab('signup')}
                    className={`px-6 py-2.5 rounded-lg text-sm font-bold tracking-wide transition-all ${activeTab === 'signup' ? 'bg-white text-text-primary shadow-lg' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}
                    whileHover={{ x: 5 }} whileTap={{ scale: 0.95 }}>SIGN UP</motion.button>
            </div>

            {/* Main Card */}
            <motion.div initial={{ opacity: 0, y: 30, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="w-full max-w-md mx-4 sm:mx-0 relative z-10 sm:ml-[10%] md:ml-[15%] lg:ml-[20%]">
                <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
                    {/* Avatar */}
                    <div className="flex flex-col items-center pt-8 pb-4">
                        <div className="w-20 h-20 rounded-full bg-text-primary flex items-center justify-center shadow-lg mb-3">
                            <User size={36} className="text-white" />
                        </div>
                        <h2 className="text-xl font-bold tracking-wide text-text-primary">
                            {activeTab === 'login' ? 'LOGIN' : 'SIGN UP'}
                        </h2>
                    </div>

                    {/* Mobile Tabs */}
                    <div className="flex gap-2 justify-center mb-4 md:hidden px-8">
                        <button onClick={() => setActiveTab('login')}
                            className={`px-5 py-1.5 rounded-full text-xs font-bold transition-all ${activeTab === 'login' ? 'bg-text-primary text-white shadow-md' : 'bg-surface text-text-muted'}`}>LOGIN</button>
                        <button onClick={() => setActiveTab('signup')}
                            className={`px-5 py-1.5 rounded-full text-xs font-bold transition-all ${activeTab === 'signup' ? 'bg-text-primary text-white shadow-md' : 'bg-surface text-text-muted'}`}>SIGN UP</button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="px-8 pb-6 space-y-5">
                        {activeTab === 'signup' && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="relative">
                                <User className="absolute left-0 top-1/2 -translate-y-1/2 text-text-light" size={20} />
                                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full Name"
                                    className="w-full pl-8 pr-4 py-3 border-b-2 border-surface-border focus:border-text-primary outline-none text-sm text-text-primary placeholder:text-text-muted transition-colors bg-transparent" required />
                            </motion.div>
                        )}

                        <div className="relative">
                            <User className="absolute left-0 top-1/2 -translate-y-1/2 text-text-light" size={20} />
                            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email"
                                className="w-full pl-8 pr-4 py-3 border-b-2 border-surface-border focus:border-text-primary outline-none text-sm text-text-primary placeholder:text-text-muted transition-colors bg-transparent" required />
                        </div>

                        <div className="relative">
                            <Lock className="absolute left-0 top-1/2 -translate-y-1/2 text-text-light" size={20} />
                            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password"
                                className="w-full pl-8 pr-4 py-3 border-b-2 border-surface-border focus:border-text-primary outline-none text-sm text-text-primary placeholder:text-text-muted transition-colors bg-transparent" required />
                        </div>

                        {error && (
                            <motion.p initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                                className="text-xs font-medium text-red-500">{error}</motion.p>
                        )}

                        <div className="flex items-center justify-between pt-2">
                            <button type="button" className="text-xs font-medium text-text-secondary hover:text-text-primary hover:underline transition-colors">
                                Forgot Password?
                            </button>
                            <motion.button type="submit" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                                className="px-8 py-2.5 rounded-full bg-text-primary text-white text-sm font-bold shadow-button hover:shadow-elevated transition-all">
                                {activeTab === 'login' ? 'LOGIN' : 'SIGN UP'}
                            </motion.button>
                        </div>
                    </form>

                    {/* Social Login */}
                    <div className="px-8 pb-8">
                        <div className="flex items-center gap-4 mb-5">
                            <div className="flex-1 h-px bg-surface-border" />
                            <span className="text-xs text-text-muted font-medium">Or Login With</span>
                            <div className="flex-1 h-px bg-surface-border" />
                        </div>

                        <div className="flex justify-center gap-4">
                            {/* Google Button */}
                            <motion.button
                                onClick={() => handleGoogleLogin()}
                                disabled={socialLoading === 'google'}
                                whileHover={{ y: -2 }} whileTap={{ scale: 0.95 }}
                                className="flex items-center gap-2 px-6 py-2.5 rounded-full border border-surface-border hover:border-text-light hover:bg-surface transition-all disabled:opacity-50"
                            >
                                {socialLoading === 'google' ? (
                                    <div className="w-[18px] h-[18px] border-2 border-text-light border-t-text-primary rounded-full animate-spin" />
                                ) : (
                                    <svg viewBox="0 0 24 24" width="18" height="18">
                                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                                    </svg>
                                )}
                                <span className="text-xs font-semibold text-text-secondary">Google</span>
                            </motion.button>

                            {/* Facebook Button */}
                            <motion.button
                                onClick={handleFacebookLogin}
                                disabled={socialLoading === 'facebook'}
                                whileHover={{ y: -2 }} whileTap={{ scale: 0.95 }}
                                className="flex items-center gap-2 px-6 py-2.5 rounded-full border border-surface-border hover:border-blue-300 hover:bg-blue-50 transition-all disabled:opacity-50"
                            >
                                {socialLoading === 'facebook' ? (
                                    <div className="w-[18px] h-[18px] border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                                ) : (
                                    <svg viewBox="0 0 24 24" width="18" height="18" fill="#1877F2">
                                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                                    </svg>
                                )}
                                <span className="text-xs font-semibold text-text-secondary">Facebook</span>
                            </motion.button>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};
