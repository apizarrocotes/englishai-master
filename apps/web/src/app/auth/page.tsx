'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import LoginForm from '@/components/auth/LoginForm';
import SocialLoginButtons from '@/components/auth/SocialLoginButtons';
import { useAuthActions, useAuthLoading } from '@/stores/authStore';

export default function AuthPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const { login, register, googleLogin, microsoftLogin } = useAuthActions();
  const isLoading = useAuthLoading();

  const handleEmailAuth = async (data: any) => {
    try {
      if (isLogin) {
        await login(data);
      } else {
        await register(data);
      }
      
      // Redirect to dashboard on success
      router.push('/dashboard');
    } catch (error) {
      // Error is already handled in the store with toast
    }
  };

  const handleGoogleLogin = async () => {
    try {
      // In a real implementation, this would open Google OAuth popup
      // For now, we'll show a placeholder
      console.log('Google login would be implemented here');
      // You would typically use Google's JavaScript SDK or next-auth
      
      // Placeholder token for testing
      // await googleLogin('google-token-here');
      // router.push('/dashboard');
    } catch (error) {
      // Error is already handled in the store
    }
  };

  const handleMicrosoftLogin = async () => {
    try {
      // In a real implementation, this would open Microsoft OAuth popup
      // For now, we'll show a placeholder
      console.log('Microsoft login would be implemented here');
      // You would typically use MSAL or similar library
      
      // Placeholder token for testing
      // await microsoftLogin('microsoft-token-here');
      // router.push('/dashboard');
    } catch (error) {
      // Error is already handled in the store
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <Toaster position="top-right" />
      
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Logo/Brand */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ 
                type: "spring", 
                stiffness: 100,
                delay: 0.1 
              }}
            >
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                EnglishAI Master
              </h1>
              <p className="text-gray-600">
                Master English through AI-powered conversations
              </p>
            </motion.div>
          </div>

          {/* Main Authentication Form */}
          <LoginForm
            onSubmit={handleEmailAuth}
            onToggleMode={toggleMode}
            isLogin={isLogin}
            loading={isLoading}
          />

          {/* Social Login Options */}
          <motion.div
            className="mt-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <SocialLoginButtons
              onGoogleLogin={handleGoogleLogin}
              onMicrosoftLogin={handleMicrosoftLogin}
              loading={isLoading}
            />
          </motion.div>

          {/* Terms and Privacy */}
          <motion.div
            className="mt-8 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <p className="text-xs text-gray-500">
              By continuing, you agree to our{' '}
              <a href="/terms" className="text-blue-600 hover:underline">
                Terms of Service
              </a>
              {' '}and{' '}
              <a href="/privacy" className="text-blue-600 hover:underline">
                Privacy Policy
              </a>
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}