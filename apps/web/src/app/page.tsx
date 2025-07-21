'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Mic, 
  MessageCircle, 
  Brain, 
  Globe, 
  Users, 
  Star,
  Play,
  CheckCircle,
  LogIn,
  UserPlus
} from 'lucide-react';
import Link from 'next/link';
import { useUser, useIsAuthenticated, useAuthActions } from '@/stores/authStore';

export default function HomePage() {
  const router = useRouter();
  const user = useUser();
  const isAuthenticated = useIsAuthenticated();
  const { initialize } = useAuthActions();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    initialize();
    setIsLoaded(true);
  }, [initialize]);

  if (isAuthenticated && user) {
    return (
      <div className="min-h-screen">
        <DashboardPreview user={user} />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <LandingPage isLoaded={isLoaded} />
    </div>
  );
}

function LandingPage({ isLoaded }: { isLoaded: boolean }) {
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: isLoaded ? 1 : 0, x: isLoaded ? 0 : -20 }}
              className="flex items-center space-x-2"
            >
              <Brain className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                EnglishAI Master
              </span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: isLoaded ? 1 : 0, x: isLoaded ? 0 : 20 }}
              className="flex items-center space-x-4"
            >
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
            </motion.div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-20 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : 20 }}
              transition={{ delay: 0.2 }}
              className="text-5xl md:text-7xl font-bold text-gray-900 mb-6"
            >
              Master English with{' '}
              <span className="gradient-text">AI Conversations</span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : 20 }}
              transition={{ delay: 0.4 }}
              className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto"
            >
              Practice English with AI tutors that adapt to your level. Real conversations, 
              instant feedback, and personalized learning paths.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : 20 }}
              transition={{ delay: 0.6 }}
              className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4"
            >
              <Link
                href="/auth"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-full text-lg font-medium transition-colors flex items-center space-x-2"
              >
                <Play className="w-5 h-5" />
                <span>Start Learning Free</span>
              </Link>
              
              <button className="border border-gray-300 hover:border-gray-400 text-gray-700 px-8 py-4 rounded-full text-lg font-medium transition-colors flex items-center space-x-2">
                <MessageCircle className="w-5 h-5" />
                <span>Watch Demo</span>
              </button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Choose EnglishAI Master?
            </h2>
            <p className="text-xl text-gray-600">
              Experience the future of language learning
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : 20 }}
                transition={{ delay: 0.2 * index }}
                className="text-center p-6 rounded-xl hover:shadow-lg transition-shadow"
              >
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-1 mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-6 h-6 text-yellow-400 fill-current" />
              ))}
            </div>
            <p className="text-2xl text-gray-900 mb-8">
              "The best English learning platform I've ever used. The AI conversations feel so natural!"
            </p>
            <div className="text-gray-600">
              <p className="font-medium">Maria Rodriguez</p>
              <p>Software Engineer at Google</p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : 20 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-4xl font-bold text-white mb-6">
              Ready to Master English?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Join thousands of learners improving their English with AI-powered conversations
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
              <Link
                href="/auth"
                className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 rounded-full text-lg font-semibold transition-colors flex items-center space-x-2 shadow-lg"
              >
                <UserPlus className="w-5 h-5" />
                <span>Start Free Trial</span>
              </Link>
              <Link
                href="/auth"
                className="border-2 border-white text-white hover:bg-white hover:text-blue-600 px-8 py-4 rounded-full text-lg font-medium transition-colors flex items-center space-x-2"
              >
                <LogIn className="w-5 h-5" />
                <span>Sign In</span>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

function DashboardPreview({ user }: { user: any }) {
  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Welcome back, {user.name.split(' ')[0]}! 👋
          </h1>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100">Today's Progress</p>
                  <p className="text-2xl font-bold">0 min</p>
                </div>
                <CheckCircle className="w-8 h-8 text-blue-200" />
              </div>
            </div>
            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100">Current Level</p>
                  <p className="text-2xl font-bold">A1</p>
                </div>
                <Globe className="w-8 h-8 text-green-200" />
              </div>
            </div>
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100">Streak</p>
                  <p className="text-2xl font-bold">0 days</p>
                </div>
                <Star className="w-8 h-8 text-purple-200" />
              </div>
            </div>
          </div>
          
          <div className="text-center">
            <Link
              href="/dashboard"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-full text-lg font-medium transition-colors inline-flex items-center space-x-2"
            >
              <MessageCircle className="w-5 h-5" />
              <span>Continue Learning</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

const features = [
  {
    title: 'AI Conversation Practice',
    description: 'Practice with AI tutors that sound and respond like native English speakers',
    icon: MessageCircle,
  },
  {
    title: 'Real-time Feedback',
    description: 'Get instant corrections and suggestions to improve your grammar and pronunciation',
    icon: Mic,
  },
  {
    title: 'Personalized Learning',
    description: 'Adaptive curriculum that adjusts to your level and learning goals',
    icon: Brain,
  },
  {
    title: 'Real-world Scenarios',
    description: 'Practice job interviews, presentations, and everyday conversations',
    icon: Globe,
  },
  {
    title: 'Progress Tracking',
    description: 'Detailed analytics and progress reports to track your improvement',
    icon: Star,
  },
  {
    title: 'Multi-user Support',
    description: 'Perfect for individuals, teams, and educational institutions',
    icon: Users,
  },
];