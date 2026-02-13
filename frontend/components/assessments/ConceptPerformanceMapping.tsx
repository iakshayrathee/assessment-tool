import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

export interface ConceptPerformance {
    performance: string; // Independent | Instructional | Frustration
    summary: string;
    errorPattern?: string;
}

interface ConceptPerformanceMappingProps {
    concept: string;
    value: ConceptPerformance;
    onChange: (value: ConceptPerformance) => void;
    disabled?: boolean;
    showErrorPattern?: boolean;
}

export const ConceptPerformanceMapping: React.FC<ConceptPerformanceMappingProps> = ({
    concept,
    value,
    onChange,
    disabled = false,
    showErrorPattern = true,
}) => {
    const performanceLevels = [
        { value: 'Independent', label: 'Independent', color: 'text-green-600' },
        { value: 'Instructional', label: 'Instructional', color: 'text-yellow-600' },
        { value: 'Frustration', label: 'Frustration', color: 'text-red-600' },
    ];

    const getPerformanceColor = (performance: string) => {
        const level = performanceLevels.find((l) => l.value === performance);
        return level?.color || 'text-gray-600';
    };

    return (
        <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">{concept}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Performance Status Dropdown */}
                <div>
                    <Label htmlFor={`${concept}-performance`}>
                        Performance Status {!disabled && <span className="text-red-500">*</span>}
                    </Label>
                    <Select
                        value={value.performance}
                        onValueChange={(val) => onChange({ ...value, performance: val })}
                        disabled={disabled}
                    >
                        <SelectTrigger
                            id={`${concept}-performance`}
                            className={`mt-1 ${getPerformanceColor(value.performance)}`}
                        >
                            <SelectValue placeholder="Select performance level" />
                        </SelectTrigger>
                        <SelectContent>
                            {performanceLevels.map((level) => (
                                <SelectItem key={level.value} value={level.value} className={level.color}>
                                    {level.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Summary Text Area */}
                <div>
                    <Label htmlFor={`${concept}-summary`}>
                        Performance Summary {!disabled && <span className="text-red-500">*</span>}
                    </Label>
                    <Textarea
                        id={`${concept}-summary`}
                        value={value.summary}
                        onChange={(e) => onChange({ ...value, summary: e.target.value })}
                        placeholder={`Describe the student's performance in ${concept}...`}
                        disabled={disabled}
                        className="mt-1"
                        rows={3}
                    />
                </div>

                {/* Error Pattern (Optional) */}
                {showErrorPattern && (
                    <div>
                        <Label htmlFor={`${concept}-errorPattern`}>Error Pattern (Optional)</Label>
                        <Textarea
                            id={`${concept}-errorPattern`}
                            value={value.errorPattern || ''}
                            onChange={(e) => onChange({ ...value, errorPattern: e.target.value })}
                            placeholder="Document common error patterns or mistakes..."
                            disabled={disabled}
                            className="mt-1"
                            rows={2}
                        />
                    </div>
                )}

                {/* Performance Indicator */}
                {value.performance && (
                    <div className="flex items-center gap-2 text-sm">
                        <div
                            className={`h-2 w-2 rounded-full ${value.performance === 'Independent'
                                    ? 'bg-green-500'
                                    : value.performance === 'Instructional'
                                        ? 'bg-yellow-500'
                                        : 'bg-red-500'
                                }`}
                        />
                        <span className={getPerformanceColor(value.performance)}>
                            {value.performance} Level
                        </span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

// Multi-Concept Component for grouping related concepts
interface MultiConceptMappingProps {
    title: string;
    concepts: { key: string; label: string }[];
    values: Record<string, ConceptPerformance>;
    onChange: (key: string, value: ConceptPerformance) => void;
    disabled?: boolean;
    showErrorPattern?: boolean;
}

export const MultiConceptMapping: React.FC<MultiConceptMappingProps> = ({
    title,
    concepts,
    values,
    onChange,
    disabled = false,
    showErrorPattern = true,
}) => {
    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">{title}</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {concepts.map((concept) => (
                    <ConceptPerformanceMapping
                        key={concept.key}
                        concept={concept.label}
                        value={values[concept.key] || { performance: '', summary: '', errorPattern: '' }}
                        onChange={(val) => onChange(concept.key, val)}
                        disabled={disabled}
                        showErrorPattern={showErrorPattern}
                    />
                ))}
            </div>
        </div>
    );
};
