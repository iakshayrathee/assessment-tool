'use client';

import React from 'react';
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';

// Brand color palette — matches CSS vars from globals.css
const COLORS = {
    primary: 'hsl(239, 84%, 67%)',
    success: 'hsl(142, 71%, 45%)',
    warning: 'hsl(38, 92%, 50%)',
    danger: 'hsl(0, 84%, 60%)',
    info: 'hsl(199, 89%, 48%)',
    purple: 'hsl(280, 65%, 60%)',
};

const PERFORMANCE_COLORS = [COLORS.success, COLORS.primary, COLORS.warning];

/**
 * Performance Distribution Pie Chart
 */
export function PerformanceDistributionChart({ data }: { data: any }) {
    const chartData = [
        { name: 'High Performers', value: data.highPerformers, color: COLORS.success },
        { name: 'On Track', value: data.onTrack, color: COLORS.primary },
        { name: 'Needs Support', value: data.needsSupport, color: COLORS.warning }
    ];

    return (
        <ResponsiveContainer width="100%" height={300}>
            <PieChart>
                <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                >
                    {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                </Pie>
                <Tooltip />
                <Legend />
            </PieChart>
        </ResponsiveContainer>
    );
}

/**
 * Domain Performance Bar Chart
 */
export function DomainPerformanceChart({ data }: { data: any }) {
    const chartData = [
        { domain: 'Reading', progress: data.reading },
        { domain: 'Writing', progress: data.writing },
        { domain: 'Math', progress: data.math }
    ];

    return (
        <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="domain" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Bar dataKey="progress" fill={COLORS.primary} name="Average Progress %" />
            </BarChart>
        </ResponsiveContainer>
    );
}

/**
 * Progress Trends Line Chart
 */
export function ProgressTrendsChart({ data }: { data: any[] }) {
    return (
        <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Line
                    type="monotone"
                    dataKey="averageProgress"
                    stroke={COLORS.primary}
                    strokeWidth={2}
                    name="Average Progress %"
                />
                <Line
                    type="monotone"
                    dataKey="assessmentsCompleted"
                    stroke={COLORS.success}
                    strokeWidth={2}
                    name="Assessments Completed"
                />
            </LineChart>
        </ResponsiveContainer>
    );
}

/**
 * Student Progress Sparkline (Mini chart for student cards)
 */
export function StudentProgressSparkline({ data }: { data: number[] }) {
    const chartData = data.map((value, index) => ({ index, value }));

    return (
        <ResponsiveContainer width="100%" height={50}>
            <LineChart data={chartData}>
                <Line
                    type="monotone"
                    dataKey="value"
                    stroke={COLORS.primary}
                    strokeWidth={2}
                    dot={false}
                />
            </LineChart>
        </ResponsiveContainer>
    );
}

/**
 * IEP Goal Progress Chart
 */
export function IEPGoalProgressChart({ data }: { data: any[] }) {
    return (
        <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 100]} />
                <YAxis type="category" dataKey="domain" width={100} />
                <Tooltip />
                <Legend />
                <Bar dataKey="progress" fill={COLORS.success} name="Progress %" />
            </BarChart>
        </ResponsiveContainer>
    );
}

/**
 * Assessment History Timeline Chart
 */
export function AssessmentHistoryChart({ data }: { data: any[] }) {
    // Convert assessment levels to numeric scores for visualization
    const levelToScore = (level: string | null) => {
        if (!level) return 0;
        const levels: { [key: string]: number } = {
            'Beginner': 25,
            'Elementary': 50,
            'Intermediate': 75,
            'Advanced': 100,
            'Low': 25,
            'Medium': 50,
            'High': 75,
            'Very High': 100
        };
        return levels[level] || 50;
    };

    const chartData = data.map(assessment => ({
        date: new Date(assessment.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        reading: levelToScore(assessment.reading),
        writing: levelToScore(assessment.writing),
        math: levelToScore(assessment.math)
    }));

    return (
        <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="reading" stroke={COLORS.primary} strokeWidth={2} name="Reading" />
                <Line type="monotone" dataKey="writing" stroke={COLORS.success} strokeWidth={2} name="Writing" />
                <Line type="monotone" dataKey="math" stroke={COLORS.purple} strokeWidth={2} name="Math" />
            </LineChart>
        </ResponsiveContainer>
    );
}
