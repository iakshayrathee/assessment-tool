'use client';

import { Info } from 'lucide-react';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

interface CalculationInfoProps {
    title: string;
    description: string;
    formula?: string;
    example?: string;
}

export function CalculationInfo({ title, description, formula, example }: CalculationInfoProps) {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 ml-2">
                    <Info className="h-4 w-4 text-gray-500 hover:text-indigo-600" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="start">
                <div className="space-y-2">
                    <h4 className="font-semibold text-sm text-gray-900">{title}</h4>
                    <p className="text-xs text-gray-700 leading-relaxed">{description}</p>
                    {formula && (
                        <div className="bg-gray-50 p-2 rounded border border-gray-200">
                            <p className="text-xs font-mono text-gray-800">{formula}</p>
                        </div>
                    )}
                    {example && (
                        <div className="bg-blue-50 p-2 rounded border border-blue-200">
                            <p className="text-xs text-blue-900">
                                <strong>Example:</strong> {example}
                            </p>
                        </div>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}

// Predefined calculation explanations
export const CALCULATION_METHODS = {
    newStudents: {
        title: "New Students This Month",
        description: "Counts students whose registration date falls within the current reporting period.",
        formula: "COUNT(students WHERE registrationDate >= periodStart AND registrationDate <= periodEnd)",
        example: "If 5 students enrolled between Dec 1-31, the count is 5"
    },
    progressLevels: {
        title: "Progress Level Categorization",
        description: "Students are categorized based on their average IEP goal progress change during the period.",
        formula: "Improving: avg progress > +5% | Stable: -5% to +5% | Requires Attention: < -5%",
        example: "A student with +8% average progress across goals is 'Improving'"
    },
    timeSavedObservation: {
        title: "Manual Observation Time Saved",
        description: "Estimated time saved from automated assessments vs manual observation.",
        formula: "25 minutes × number of students supported per month",
        example: "50 students × 25 min = 1,250 min = 20.8 hours saved"
    },
    timeSavedPlanning: {
        title: "Lesson Planning Time Saved",
        description: "Time saved through AI-generated lesson plan recommendations and templates.",
        formula: "Fixed 6 hours per month (based on educator feedback)",
        example: "Platform provides ready-to-use lesson plans saving ~6 hours monthly"
    },
    timeSavedTracking: {
        title: "Tracking Workload Time Saved",
        description: "Time saved from automated progress tracking vs manual record-keeping.",
        formula: "13 minutes × number of students × 4 weeks",
        example: "50 students × 13 min × 4 = 2,600 min = 43.3 hours saved"
    },
    timeSavedDifferentiation: {
        title: "Differentiation Support Time Saved",
        description: "Time saved through AI-powered differentiation strategies and recommendations.",
        formula: "Fixed 8 hours per month (based on educator feedback)",
        example: "AI provides personalized strategies saving ~8 hours monthly"
    },
    supportPlans: {
        title: "Individual Support Plans Created",
        description: "Number of IEP (Individualized Education Program) goals created during the period.",
        formula: "COUNT(IEP goals WHERE createdAt >= periodStart AND createdAt <= periodEnd)",
        example: "If 75 IEP goals were created this month, count is 75"
    },
    groupInterventions: {
        title: "Small-Group Interventions",
        description: "Number of therapy session notes recorded, indicating intervention sessions conducted.",
        formula: "COUNT(session notes WHERE createdAt >= periodStart AND createdAt <= periodEnd)",
        example: "If 120 session notes were recorded, 120 interventions occurred"
    },
    strategyRecommendations: {
        title: "Classroom Strategy Recommendations",
        description: "Number of AI-generated comprehensive assessment reports with classroom strategies.",
        formula: "COUNT(AI comprehensive reports WHERE createdAt >= periodStart AND createdAt <= periodEnd)",
        example: "If 30 AI reports were generated, 30 strategy sets provided"
    },
    reviewCycles: {
        title: "Review Cycles Completed",
        description: "Number of IEP goals that have been reviewed at least twice during the period.",
        formula: "COUNT(IEP goals WHERE progress updates >= 2 during period)",
        example: "If 45 goals have 2+ progress updates, 45 review cycles completed"
    },
    riskReduction: {
        title: "Risk Category Reduction",
        description: "Percentage change in students at each risk level compared to the previous period.",
        formula: "((previous count - current count) / previous count) × 100",
        example: "High Support: 60 → 54 = (60-54)/60 × 100 = 10% reduction"
    },
    skillAreaMetrics: {
        title: "Skill Area Needs",
        description: "Percentage of students requiring support in each skill area based on assessments.",
        formula: "(students needing support in skill / total students) × 100",
        example: "If 30 of 100 students need reading support, that's 30%"
    }
};
