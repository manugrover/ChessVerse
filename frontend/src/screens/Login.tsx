import React, { useState } from 'react';
import lock from "../assets/lock.png"
import user from "../assets/user.png"

import eyeon from "../assets/eyeon.png"
import eyeoff from "../assets/eyeoff.png"
import {useNavigate } from 'react-router-dom';

export default function LoginPage() {

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);

    const handleEmailLogin = (e: any) => {
        e.preventDefault();
        // Handle email login logic here
        console.log('Email login:', { email, password, rememberMe });
    };

    const handleGoogleLogin = () => {
        // Handle Google login logic here
        console.log('Google login');
    };
    const navigate = useNavigate();
    return (
     <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
            <div className="space-y-6">
            {/* Email Input */}
            <div className="relative">
                <img src={user} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Username, Phone, or Email"
                className="w-full bg-transparent border border-gray-600 rounded-lg py-4 pl-12 pr-4 text-white placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-colors"
                />
            </div>

            {/* Password Input */}
            <div className="relative">
                <img src={lock} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full bg-transparent border border-gray-600 rounded-lg py-4 pl-12 pr-12 text-white placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-colors"
                />
                <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
                >
                <img src={showPassword?eyeon:eyeoff} className="w-5 h-5 bg-blue" /> 
                </button>
            </div>

            {/* Remember Me and Forgot Password */}
            <div className="flex items-center justify-between">
                <label className="flex items-center space-x-3 cursor-pointer">
                <div className="relative">
                    <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="sr-only"
                    />
                    <div className={`w-5 h-5 border-2 rounded ${rememberMe ? 'bg-green-500 border-green-500' : 'bg-transparent border-gray-600'} flex items-center justify-center`}>
                    {rememberMe && (
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                    )}
                    </div>
                </div>
                <span className="text-gray-300 text-sm">Remember me</span>
                </label>
                <button
                type="button"
                className="text-gray-300 text-sm underline hover:text-white transition-colors"
                >
                Forgot Password?
                </button>
            </div>

            {/* Login Button */}
            <button
                onClick={handleEmailLogin}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-4 px-6 rounded-lg transition-colors duration-200 text-lg"
            >
                Log In
            </button>
            </div>

            {/* Divider */}
            <div className="my-8 flex items-center">
            <div className="flex-grow border-t border-gray-600"></div>
            <span className="mx-4 text-gray-400 text-sm">OR</span>
            <div className="flex-grow border-t border-gray-600"></div>
            </div>

            {/* Google Login */}
            <button
            onClick={handleGoogleLogin}
            className="w-full bg-gray-800 hover:bg-gray-700 border border-gray-600 text-white font-medium py-4 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-3 mb-8"
            >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
            </svg>
            <span>Log in with Google</span>
            </button>

            {/* Sign Up Link */}
            <div className="text-center">
                <p className="text-gray-300 text-sm">
                    New?{' '}
                    <button className="text-white underline hover:text-gray-300 transition-colors"
                        onClick={() => navigate("/signup")}
                    >
                    Sign up - and start playing chess!
                    </button>
                </p>
            </div>
        </div>
    </div>
  );
}