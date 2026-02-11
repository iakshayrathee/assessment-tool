'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, Users, BarChart3 } from 'lucide-react';

export default function Analytics() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<any>(null);

    useEffect(() => {
        // Simulate loading analytics data
        setTimeout(() => {
            setStats({
                totalAssessments: 12,
                totalStudents: 240,
                averageTier1: 65,
                averageTier2: 25,
                averageTier3: 10,
            });
            setLoading(false);
        }, 1000);
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics & Trends</h1>
            <p className="text-gray-600 mb-8">Track performance trends across all assessments</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Total Assessments</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalAssessments}</p>
                        </div>
                        <BarChart3 className="h-10 w-10 text-blue-600" />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Total Students</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalStudents}</p>
                        </div>
                        <Users className="h-10 w-10 text-green-600" />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Average Tier 1</p>
                            <p className="text-3xl font-bold text-green-600 mt-2">{stats.averageTier1}%</p>
                        </div>
                        <TrendingUp className="h-10 w-10 text-green-600" />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Tier Distribution Over Time</h2>
                <div className="h-64 flex items-center justify-center text-gray-500">
                    <p>Chart visualization coming soon</p>
                </div>
            </div>
        </div>
    );
}

