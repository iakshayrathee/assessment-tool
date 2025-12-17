'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Eye, EyeOff, Mail, Lock, GraduationCap } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const { login, isLoggingIn, isAuthenticated, user } = useAuth();
  const router = useRouter();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      const redirectPath = getRoleBasedRedirect(user.role);
      router.push(redirectPath);
    }
  }, [isAuthenticated, user, router]);

  const getRoleBasedRedirect = (role: string): string => {
    switch (role) {
      case 'ADMIN':
        return '/admin/overview';
      case 'SUPER_SPECIAL_EDUCATOR':
        return '/super-special-educator';
      case 'SPECIAL_EDUCATOR':
        return '/educator/dashboard';
      case 'CENTER':
        return '/center/dashboard';
      case 'PARENT':
        return '/parent/dashboard';
      case 'SCHOOL_VIEWER':
        return '/school-viewer/dashboard';
      default:
        return '/dashboard';
    }
  };

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

  // const demoCredentials = [
  //   { role: 'Admin', email: 'admin@knowled.com', password: 'admin123' },
  //   { role: 'Super Special Educator', email: 'super.educator@knowled.com', password: 'super123' },
  //   { role: 'Special Educator', email: 'educator@knowled.com', password: 'educator123' },
  //   { role: 'Center Manager', email: 'center@knowled.com', password: 'center123' },
  //   { role: 'Parent', email: 'parent@knowled.com', password: 'parent123' },
  //   { role: 'School Viewer', email: 'viewer@knowled.com', password: 'viewer123' },
  // ];

  // const fillDemoCredentials = (email: string, password: string) => {
  //   setEmail(email);
  //   setPassword(password);
  //   setErrors({});
  // };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-6xl w-full grid lg:grid-cols-2 gap-8 items-center">
        {/* Left Side - Branding */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="hidden lg:block"
        >
          <div className="text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start mb-8">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-3 rounded-2xl">
                <GraduationCap className="h-8 w-8 text-white" />
              </div>
              <h1 className="ml-3 text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Knowled
              </h1>
            </div>

            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Welcome to the Future of
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                Special Education
              </span>
            </h2>

            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Comprehensive platform for managing special education programs,
              assessments, and student progress tracking with advanced analytics
              and collaborative tools.
            </p>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-white/50 backdrop-blur-sm rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">For Educators</h3>
                <p className="text-gray-600">Create assessments, track progress, and manage IEP goals</p>
              </div>
              <div className="bg-white/50 backdrop-blur-sm rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">For Parents</h3>
                <p className="text-gray-600">Monitor your child's progress and stay connected</p>
              </div>
              <div className="bg-white/50 backdrop-blur-sm rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">For Administrators</h3>
                <p className="text-gray-600">Manage centers, users, and generate reports</p>
              </div>
              <div className="bg-white/50 backdrop-blur-sm rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">For Schools</h3>
                <p className="text-gray-600">View student progress and collaborate with educators</p>
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
            <div className="text-center mb-8">
              <div className="lg:hidden flex items-center justify-center mb-6">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-3 rounded-2xl">
                  <GraduationCap className="h-6 w-6 text-white" />
                </div>
                <h1 className="ml-3 text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Knowled
                </h1>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Sign In</h2>
              <p className="text-gray-600">Access your dashboard</p>
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
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${errors.email ? 'border-red-300' : 'border-gray-300'
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
                    className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${errors.password ? 'border-red-300' : 'border-gray-300'
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

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
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
              <div className="grid grid-cols-1 gap-2 text-xs">
                {demoCredentials.map((cred, index) => (
                  <button
                    key={index}
                    onClick={() => fillDemoCredentials(cred.email, cred.password)}
                    className="text-left p-2 rounded bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="font-medium text-gray-900">{cred.role}</div>
                    <div className="text-gray-600">{cred.email}</div>
                  </button>
                ))}
              </div>
            </div> */}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
