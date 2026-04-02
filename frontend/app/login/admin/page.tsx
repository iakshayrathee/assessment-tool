'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Eye, EyeOff, Mail, Lock, Shield, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';
import Link from 'next/link';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const { login, isLoggingIn, isAuthenticated, user } = useAuth();
  const router = useRouter();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'ADMIN') {
        router.push('/admin/overview');
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
  //   setEmail('admin@knowled.com');
  //   setPassword('admin123');
  //   setErrors({});
  // };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-red-100 to-orange-50 flex items-center justify-center p-4">
      <div className="max-w-6xl w-full grid lg:grid-cols-2 gap-8 items-center">
        {/* Left Side - Admin Branding */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="hidden lg:block"
        >
          <div className="text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start mb-8">
              <div className="bg-gradient-to-r from-red-600 to-orange-600 p-3 rounded-2xl">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h1 className="ml-3 text-3xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
                Knowled Admin
              </h1>
            </div>

            <h2 className="text-4xl font-bold text-foreground mb-6">
              System Administration
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-orange-600">
                Control Center
              </span>
            </h2>

            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Complete system oversight with full access to user management,
              system configuration, data analytics, and platform administration.
            </p>

            <div className="grid grid-cols-1 gap-4 text-sm">
              <div className="bg-background/50 backdrop-blur-sm rounded-lg p-4">
                <h3 className="font-semibold text-foreground mb-2">User Management</h3>
                <p className="text-muted-foreground">Create, modify, and manage all user accounts across the platform</p>
              </div>
              <div className="bg-background/50 backdrop-blur-sm rounded-lg p-4">
                <h3 className="font-semibold text-foreground mb-2">System Configuration</h3>
                <p className="text-muted-foreground">Configure platform settings, permissions, and system parameters</p>
              </div>
              <div className="bg-background/50 backdrop-blur-sm rounded-lg p-4">
                <h3 className="font-semibold text-foreground mb-2">Data Analytics</h3>
                <p className="text-muted-foreground">Access comprehensive reports and analytics across all centers</p>
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
          <div className="bg-background/80 backdrop-blur-lg rounded-2xl shadow-xl p-8 border border-white/20">
            {/* Back Button */}
            <Link
              href="/"
              className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Login Selection
            </Link>

            <div className="text-center mb-8">
              <div className="lg:hidden flex items-center justify-center mb-6">
                <div className="bg-gradient-to-r from-red-600 to-orange-600 p-3 rounded-2xl">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <h1 className="ml-3 text-2xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
                  Admin
                </h1>
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Admin Sign In</h2>
              <p className="text-muted-foreground">Access the administration dashboard</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors ${errors.email ? 'border-destructive/30' : 'border-border'
                      }`}
                    placeholder="Enter your admin email"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-destructive">{errors.email}</p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors ${errors.password ? 'border-destructive/30' : 'border-border'
                      }`}
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-muted-foreground"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-destructive">{errors.password}</p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <Link
                  href="/forgot-password"
                  className="text-sm text-destructive hover:text-destructive transition-colors"
                >
                  Forgot Password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full bg-gradient-to-r from-red-600 to-orange-600 text-white py-3 px-4 rounded-lg font-medium hover:from-red-700 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {isLoggingIn ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Signing In...
                  </div>
                ) : (
                  'Sign In as Admin'
                )}
              </button>
            </form>

            {/* Demo Credentials - Commented out */}
            {/* <div className="mt-8 pt-6 border-t border-border">
              <h3 className="text-sm font-medium text-foreground mb-3">Demo Credentials:</h3>
              <button
                onClick={fillDemoCredentials}
                className="w-full text-left p-3 rounded bg-destructive/10 hover:bg-destructive/10 transition-colors border border-destructive/20"
              >
                <div className="font-medium text-red-900">Admin Account</div>
                <div className="text-destructive text-sm">admin@knowled.com</div>
              </button>
            </div> */}
          </div>
        </motion.div>
      </div>
    </div>
  );
}