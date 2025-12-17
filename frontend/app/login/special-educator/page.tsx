'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Eye, EyeOff, Mail, Lock, BookOpen, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function SpecialEducatorLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const { login, isLoggingIn, isAuthenticated, user } = useAuth();
  const router = useRouter();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'SPECIAL_EDUCATOR') {
        router.push('/educator/dashboard');
      } else {
        // Redirect to appropriate dashboard for other roles
        router.push('/');
      }
    }
  }, [isAuthenticated, user, router]);

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      login({ email, password });
    }
  };

  // const fillDemoCredentials = () => {
  //   setEmail('educator@knowled.com');
  //   setPassword('educator123');
  //   setErrors({});
  // };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-violet-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="max-w-6xl w-full grid lg:grid-cols-2 gap-8 items-center">
        {/* Left Side - Special Educator Branding */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="hidden lg:block"
        >
          <div className="text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start mb-8">
              <div className="bg-gradient-to-r from-purple-600 to-violet-600 p-3 rounded-2xl">
                <BookOpen className="h-8 w-8 text-white" />
              </div>
              <h1 className="ml-3 text-3xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
                Special Educator
              </h1>
            </div>

            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Assessment &
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-violet-600">
                Intervention Hub
              </span>
            </h2>

            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Conduct comprehensive assessments, create individualized education
              programs, and track student progress with specialized tools.
            </p>

            <div className="grid grid-cols-1 gap-4 text-sm">
              <div className="bg-white/50 backdrop-blur-sm rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Child Assessment</h3>
                <p className="text-gray-600">Conduct detailed assessments and track developmental progress</p>
              </div>
              <div className="bg-white/50 backdrop-blur-sm rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">IEP Management</h3>
                <p className="text-gray-600">Create and manage Individualized Education Programs</p>
              </div>
              <div className="bg-white/50 backdrop-blur-sm rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Progress Tracking</h3>
                <p className="text-gray-600">Monitor intervention effectiveness and student outcomes</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right Side - Login Form */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-full max-w-md mx-auto"
        >
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-8 border border-white/20">
            {/* Back Button */}
            <Link
              href="/"
              className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Login Selection
            </Link>

            <div className="text-center mb-8">
              <div className="lg:hidden flex items-center justify-center mb-6">
                <div className="bg-gradient-to-r from-purple-600 to-violet-600 p-3 rounded-2xl">
                  <BookOpen className="h-6 w-6 text-white" />
                </div>
                <h1 className="ml-3 text-2xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
                  Educator
                </h1>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Special Educator</h2>
              <p className="text-gray-600">Access your assessment tools</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors ${errors.email ? 'border-red-300' : 'border-gray-300'
                      }`}
                    placeholder="Enter your email"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors ${errors.password ? 'border-red-300' : 'border-gray-300'
                      }`}
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <Link
                  href="/forgot-password"
                  className="text-sm text-purple-600 hover:text-purple-700 transition-colors"
                >
                  Forgot Password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full bg-gradient-to-r from-purple-600 to-violet-600 text-white py-3 px-4 rounded-lg font-medium hover:from-purple-700 hover:to-violet-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {isLoggingIn ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Signing In...
                  </div>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            {/* Demo Credentials - Commented out */}
            {/* <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Demo Credentials:</h3>
              <button
                onClick={fillDemoCredentials}
                className="w-full text-left p-3 rounded bg-purple-50 hover:bg-purple-100 transition-colors border border-purple-200"
              >
                <div className="font-medium text-purple-900">Special Educator</div>
                <div className="text-purple-700 text-sm">educator@knowled.com</div>
              </button>
            </div> */}
          </div>
        </motion.div>
      </div>
    </div>
  );
}