'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { LogIn, UserPlus, ArrowRight } from 'lucide-react';

interface AuthButtonsProps {
  variant?: 'default' | 'large' | 'minimal';
  className?: string;
}

export const AuthButtons: React.FC<AuthButtonsProps> = ({ 
  variant = 'default', 
  className = '' 
}) => {
  if (variant === 'large') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={`flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6 ${className}`}
      >
        <Link
          href="/auth"
          className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-4 rounded-full text-lg font-semibold transition-all duration-200 flex items-center space-x-3 shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          <UserPlus className="w-5 h-5" />
          <span>Create Free Account</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
        
        <Link
          href="/auth"
          className="border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white px-8 py-4 rounded-full text-lg font-medium transition-all duration-200 flex items-center space-x-2"
        >
          <LogIn className="w-5 h-5" />
          <span>Sign In</span>
        </Link>
      </motion.div>
    );
  }

  if (variant === 'minimal') {
    return (
      <div className={`flex items-center space-x-3 ${className}`}>
        <Link
          href="/auth"
          className="text-gray-600 hover:text-blue-600 text-sm font-medium transition-colors"
        >
          Sign In
        </Link>
        <Link
          href="/auth"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          Get Started
        </Link>
      </div>
    );
  }

  // Default variant
  return (
    <div className={`flex items-center space-x-4 ${className}`}>
      <Link
        href="/auth"
        className="text-gray-700 hover:text-blue-600 px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
      >
        <LogIn className="w-4 h-4" />
        <span>Sign In</span>
      </Link>
      <Link
        href="/auth"
        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full transition-colors flex items-center space-x-2"
      >
        <UserPlus className="w-4 h-4" />
        <span>Get Started</span>
      </Link>
    </div>
  );
};

export default AuthButtons;