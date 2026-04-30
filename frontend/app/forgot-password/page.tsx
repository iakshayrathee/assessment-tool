'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';
import { motion } from 'motion/react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { t } = useTranslation('auth');

  const validateEmail = (email: string) => {
    return /\S+@\S+\.\S+/.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError(t('emailRequired'));
      return;
    }

    if (!validateEmail(email)) {
      setError(t('emailInvalid'));
      return;
    }

    setIsSubmitting(true);

    try {
      await apiClient.forgotPassword(email);
      setIsSubmitted(true);
    } catch (error: any) {
      const message =
        error?.response?.data?.error ||
        error?.message ||
        t('anErrorOccurred');
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <div className="fixed top-4 right-4 z-50"><LanguageSwitcher /></div>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="max-w-md w-full"
        >
          <div className="bg-background/80 backdrop-blur-lg rounded-2xl shadow-xl p-8 border border-white/20 text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-success/10 p-3 rounded-full">
                <CheckCircle className="h-8 w-8 text-success" />
              </div>
            </div>

            <h2 className="text-2xl font-bold text-foreground mb-4">{t('resetLinkSent')}</h2>

            <p className="text-muted-foreground mb-6">
              {t('resetLinkSentDesc')}
            </p>

            <div className="space-y-4">
              <Link
                href="/"
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 inline-block text-center"
              >
                {t('backToLogin')}
              </Link>

              <button
                onClick={() => {
                  setIsSubmitted(false);
                  setEmail('');
                }}
                className="w-full text-muted-foreground hover:text-foreground py-2 transition-colors"
              >
                {t('tryDifferentEmail')}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="fixed top-4 right-4 z-50"><LanguageSwitcher /></div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-md w-full"
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
            <div className="flex justify-center mb-6">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-3 rounded-2xl">
                <Mail className="h-8 w-8 text-white" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">{t('forgotPasswordTitle')}</h2>
            <p className="text-muted-foreground">
              {t('forgotPasswordDesc')}
            </p>
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
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${error ? 'border-destructive/30' : 'border-border'}`}
                  placeholder={t('emailPlaceholder')}
                  required
                />
              </div>
              {error && (
                <div className="mt-2 flex items-center text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {error}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  {t('sendingResetLink')}
                </div>
              ) : (
                t('sendResetLink')
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              {t('rememberPassword')}{' '}
              <Link href="/" className="text-primary hover:text-primary font-medium transition-colors">
                {t('signIn')}
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}