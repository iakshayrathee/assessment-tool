'use client';

import React from 'react';
import { GRADE_LIST } from '@/lib/gradeConfig';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface GradeSelectProps {
    value: string;
    onValueChange: (value: string) => void;
    placeholder?: string;
    includeAll?: boolean;
    className?: string;
    error?: string;
    disabled?: boolean;
}

/**
 * Reusable component for grade selection with standardized options
 * Usage: <GradeSelect value={grade} onValueChange={setGrade} />
 */
export function GradeSelect({
    value,
    onValueChange,
    placeholder = 'Select grade',
    includeAll = false,
    className = '',
    error,
    disabled = false
}: GradeSelectProps) {
    return (
        <Select value={value} onValueChange={onValueChange} disabled={disabled}>
            <SelectTrigger className={`${className} ${error ? 'border-red-500' : ''}`}>
                <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
                {includeAll && <SelectItem value="all">All Grades</SelectItem>}
                {GRADE_LIST.map((grade) => (
                    <SelectItem key={grade} value={grade}>
                        {grade}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
