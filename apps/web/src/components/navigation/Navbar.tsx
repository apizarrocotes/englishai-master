'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Brain, LogOut, User, BarChart3 } from 'lucide-react';
import { useUser, useIsAuthenticated, useAuthActions } from '@/stores/authStore';
import AuthButtons from '@/components/ui/AuthButtons';
import TeacherSelector from '@/components/navigation/TeacherSelector';

interface NavbarProps {
  transparent?: boolean;
  fixed?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  transparent = false, 
  fixed = true 
}) => {
  const router = useRouter();
  const user = useUser();
  const isAuthenticated = useIsAuthenticated();
  const { logout } = useAuthActions();

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const navClasses = `
    ${fixed ? 'fixed top-0' : 'relative'} 
    w-full z-50 transition-all duration-200
    ${transparent 
      ? 'bg-white/80 backdrop-blur-md border-b border-gray-100' 
      : 'bg-white shadow-sm border-b border-gray-200'
    }
  `;

  return (
    <nav className={navClasses}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <Brain className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              EnglishAI Master
            </span>
          </Link>

          {/* Navigation Items */}
          {isAuthenticated && user ? (
            <div className="flex items-center space-x-4">
              {/* Navigation Links */}
              <div className="hidden md:flex items-center space-x-2">
                <Link
                  href="/dashboard"
                  className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  href="/learning"
                  className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md transition-colors"
                >
                  Learning
                </Link>
                {/* Analytics link - prominent display */}
                <Link
                  href="/analytics"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors flex items-center space-x-2 shadow-sm"
                  title="Platform Usage Dashboard"
                >
                  <BarChart3 className="h-4 w-4" />
                  <span>Analytics Dashboard</span>
                </Link>
              </div>

              {/* AI Teacher Selector */}
              <TeacherSelector />
              
              {/* User Info */}
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  {user.avatarUrl ? (
                    <img 
                      src={user.avatarUrl} 
                      alt={user.name}
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-blue-600" />
                    </div>
                  )}
                  <div className="hidden sm:block">
                    <p className="text-sm font-medium text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-500 capitalize">{user.subscriptionTier}</p>
                  </div>
                </div>
                
                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          ) : (
            <AuthButtons />
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;