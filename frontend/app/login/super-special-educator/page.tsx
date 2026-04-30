'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Eye, EyeOff, Mail, Lock, GraduationCap, ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';
import { motion } from 'motion/react';
import Link from 'next/link';

export default function SuperSpecialEducatorLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; login?: string }>({});

  const { login, isLoggingIn, isAuthenticated, user } = useAuth();
  const router = useRouter();
  const { t } = useTranslation('auth');

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'SUPER_SPECIAL_EDUCATOR') {
        router.push('/super-special-educator');
      } else {
        // Redirect to appropriate dashboard for other roles
        router.push('/');
      }
    }
  }, [isAuthenticated, user, router]);

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email) {
      newErrors.email = t('emailRequired');
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = t('emailInvalid');
    }

    if (!password) {
      newErrors.password = t('passwordRequired');
    } else if (password.length < 6) {
      newErrors.password = t('passwordTooShort');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      try {
        await login({ email, password });
      } catch (error: any) {
        setErrors({ login: 'Invalid email or password.' });
      }
    }
  };

  // const fillDemoCredentials = () => {
  //   setEmail('super.educator@knowled.com');
  //   setPassword('super123');
  //   setErrors({});
  // };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4">
      <div className="fixed top-4 right-4 z-50"><LanguageSwitcher /></div>
      <div className="max-w-6xl w-full grid lg:grid-cols-2 gap-8 items-center">
        {/* Left Side - Super Special Educator Branding */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="hidden lg:block"
        >
          <div className="text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start mb-8">
              <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-3 rounded-2xl">
                <GraduationCap className="h-8 w-8 text-white" />
              </div>
              <h1 className="ml-3 text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                Super Special Educator
              </h1>
            </div>

            <h2 className="text-4xl font-bold text-foreground mb-6">
              Senior Education
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600">
                Leadership Portal
              </span>
            </h2>

            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Monitor and support Special Educators across multiple centers with
              advanced oversight tools, quality assurance, and cross-center analytics.
            </p>

            <div className="grid grid-cols-1 gap-4 text-sm">
              <div className="bg-background/50 backdrop-blur-sm rounded-lg p-4">
                <h3 className="font-semibold text-foreground mb-2">Educator Oversight</h3>
                <p className="text-muted-foreground">Monitor and support Special Educators across multiple centers</p>
              </div>
              <div className="bg-background/50 backdrop-blur-sm rounded-lg p-4">
                <h3 className="font-semibold text-foreground mb-2">Assessment Review</h3>
                <p className="text-muted-foreground">Review and approve assessments and intervention plans</p>
              </div>
              <div className="bg-background/50 backdrop-blur-sm rounded-lg p-4">
                <h3 className="font-semibold text-foreground mb-2">Quality Assurance</h3>
                <p className="text-muted-foreground">Ensure IEP quality and compliance across all centers</p>
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
              {t('backToLogin')}
            </Link>

            <div className="text-center mb-8">
              <div className="lg:hidden flex items-center justify-center mb-6">
                <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-3 rounded-2xl">
                  <GraduationCap className="h-6 w-6 text-white" />
                </div>
                <h1 className="ml-3 text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  Super Educator
                </h1>
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">{t('loginAs', { role: t('superEducatorRole') })}</h2>
              <p className="text-muted-foreground">{t('signInDesc')}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                  {t('emailAddress')}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors ${errors.email ? 'border-destructive/30' : 'border-border'
                      }`}
                    placeholder={t('emailPlaceholder')}
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-destructive">{errors.email}</p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                  {t('password')}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors ${errors.password ? 'border-destructive/30' : 'border-border'
                      }`}
                    placeholder={t('passwordPlaceholder')}
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
                  className="text-sm text-success hover:text-success transition-colors"
                >
                  {t('forgotPassword')}
                </Link>
              </div>

              {errors.login && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 mb-4">
                  <p className="text-sm text-destructive">{errors.login}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoggingIn || !email || !password}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 px-4 rounded-lg font-medium hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {isLoggingIn ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    {t('signingIn')}
                  </div>
                ) : (
                  t('loginAs', { role: t('superEducatorRole') })
                )}
              </button>
            </form>

            {/* Demo Credentials - Commented out */}
            {/* <div className="mt-8 pt-6 border-t border-border">
              <h3 className="text-sm font-medium text-foreground mb-3">Demo Credentials:</h3>
              <button
                onClick={fillDemoCredentials}
                className="w-full text-left p-3 rounded bg-success/10 hover:bg-success/10 transition-colors border border-success/20"
              >
                <div className="font-medium text-green-900">Super Special Educator</div>
                <div className="text-success text-sm">super.educator@knowled.com</div>
              </button>
            </div> */}
          </div>

          {/* Footer with Terms and Privacy Policy */}
          <div className="mt-8 text-center text-sm text-muted-foreground">
            <div className="flex items-center justify-center space-x-2">
              <Link href="/terms" className="hover:text-foreground transition-colors">
                Terms of Use
              </Link>
              <span>|</span>
              <Link href="/privacy" className="hover:text-foreground transition-colors">
                Privacy Policy
              </Link>
            </div>
            <div className="mt-2">
              © 2024 Knowled Assessment Platform. All rights reserved.
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}