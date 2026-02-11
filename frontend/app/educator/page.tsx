'use client';

import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, ClipboardList, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function EducatorPortalSelection() {
    const { user } = useAuth();

    const portals = [
        {
            title: 'Student Assignment',
            description: 'Manage individual students, track progress, create IEPs, and monitor learning outcomes',
            icon: Users,
            href: '/educator/dashboard',
            color: 'blue',
            features: [
                'Individual student profiles',
                'IEP management',
                'Progress tracking',
                'Personalized assessments',
            ],
        },
        {
            title: 'Mass Assessment',
            description: 'Conduct whole-class screenings, automatic tier allocation, and generate class-level reports',
            icon: ClipboardList,
            href: '/mass-assessment',
            color: 'purple',
            features: [
                'Whole-class screening',
                'Automatic tier allocation',
                'AI-powered insights',
                'Bulk student management',
            ],
        },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-12"
                >
                    <h1 className="text-4xl font-bold text-gray-900 mb-3">
                        Welcome back, {user?.profile?.fullName || user?.specialEducatorProfile?.fullName || 'Educator'}!
                    </h1>
                    <p className="text-xl text-gray-600">
                        Select your portal to get started
                    </p>
                </motion.div>

                {/* Portal Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                    {portals.map((portal, index) => {
                        const Icon = portal.icon;
                        const colorClasses = {
                            blue: {
                                bg: 'bg-blue-50',
                                border: 'border-blue-200',
                                icon: 'text-blue-600',
                                hover: 'hover:border-blue-400 hover:shadow-blue-100',
                                button: 'bg-blue-600 hover:bg-blue-700',
                            },
                            purple: {
                                bg: 'bg-purple-50',
                                border: 'border-purple-200',
                                icon: 'text-purple-600',
                                hover: 'hover:border-purple-400 hover:shadow-purple-100',
                                button: 'bg-purple-600 hover:bg-purple-700',
                            },
                        }[portal.color];

                        return (
                            <motion.div
                                key={portal.title}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                            >
                                <Link href={portal.href}>
                                    <Card
                                        className={`h-full cursor-pointer transition-all duration-300 ${colorClasses.border} ${colorClasses.hover} hover:shadow-xl`}
                                    >
                                        <CardHeader className={`${colorClasses.bg} border-b ${colorClasses.border}`}>
                                            <div className="flex items-center gap-4">
                                                <div className={`p-3 rounded-lg bg-white shadow-sm`}>
                                                    <Icon className={`h-8 w-8 ${colorClasses.icon}`} />
                                                </div>
                                                <div className="flex-1">
                                                    <CardTitle className="text-2xl">{portal.title}</CardTitle>
                                                    <CardDescription className="mt-1 text-gray-600">
                                                        {portal.description}
                                                    </CardDescription>
                                                </div>
                                            </div>
                                        </CardHeader>

                                        <CardContent className="pt-6">
                                            <h3 className="font-semibold text-gray-900 mb-3">Key Features:</h3>
                                            <ul className="space-y-2 mb-6">
                                                {portal.features.map((feature, idx) => (
                                                    <li key={idx} className="flex items-center gap-2 text-gray-700">
                                                        <div className={`w-1.5 h-1.5 rounded-full ${colorClasses.icon.replace('text-', 'bg-')}`} />
                                                        {feature}
                                                    </li>
                                                ))}
                                            </ul>

                                            <div
                                                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-white font-medium transition-colors ${colorClasses.button}`}
                                            >
                                                <span>Enter Portal</span>
                                                <ArrowRight className="h-4 w-4" />
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Help Text */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="text-center mt-12"
                >
                    <p className="text-gray-600">
                        Not sure which portal to use?{' '}
                        <button className="text-blue-600 hover:text-blue-700 font-medium underline">
                            View Portal Guide
                        </button>
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
