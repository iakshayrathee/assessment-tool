'use client';

import React from 'react';

interface GradeDisplayProps {
    grade: string;
    className?: string;
}

/**
 * Reusable component for displaying student grades consistently
 * Usage: <GradeDisplay grade={student.grade} />
 */
export function GradeDisplay({ grade, className = '' }: GradeDisplayProps) {
    return <span className={className}>{grade}</span>;
}
