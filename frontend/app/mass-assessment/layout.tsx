'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Plus, ClipboardList, BarChart3, Settings, LayoutDashboard, ArrowLeft } from 'lucide-react';

export default function MassAssessmentLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    const navigation = [
        { name: 'Dashboard', href: '/mass-assessment', icon: Home },
        { name: 'Create Assessment', href: '/mass-assessment/upload', icon: Plus },
        { name: 'Assessments', href: '/mass-assessment/assessments', icon: ClipboardList },
        { name: 'Analytics', href: '/mass-assessment/analytics', icon: BarChart3 },
        { name: 'Settings', href: '/mass-assessment/settings', icon: Settings },
    ];

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Mass Assessment Sidebar */}
            <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
                {/* Portal Header */}
                <div className="p-6 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-gray-900">Mass Assessment</h2>
                    <p className="text-sm text-gray-500 mt-1">Whole-class screening</p>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 py-4 space-y-1">
                    {navigation.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`flex items-center gap-3 px-3 py-2 rounded-lg mb-1 transition-colors ${isActive
                                        ? 'bg-blue-50 text-blue-600'
                                        : 'text-gray-700 hover:bg-gray-100'
                                    }`}
                            >
                                <Icon className="h-5 w-5" />
                                <span className="font-medium">{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Back to Portal Selection */}
                <div className="p-4 border-t border-gray-200">
                    <Link
                        href="/educator"
                        className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <LayoutDashboard className="h-5 w-5" />
                        <span className="font-medium">Switch Portal</span>
                    </Link>
                </div>
            </div>

            {/* Main content */}
            <div className="flex-1 overflow-auto">
                {children}
            </div>
        </div>
    );
}

