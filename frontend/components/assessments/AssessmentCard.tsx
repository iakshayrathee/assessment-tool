'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Pencil, FileText, BookOpen, PenTool, Calculator } from 'lucide-react';
import { format } from 'date-fns';

interface AssessmentCardProps {
    assessment: {
        id: string;
        type: 'formal' | 'reading' | 'writing' | 'math';
        createdAt: string | Date;
        updatedAt?: string | Date;
        version?: number;
        // Formal assessment specific
        assessmentType?: string;
        diagnosis?: string;
        keyFindings?: string;
        // Skill assessment specific
        additionalNotes?: string;
    };
    onView: () => void;
    onEdit: () => void;
}

const getAssessmentIcon = (type: string) => {
    switch (type) {
        case 'formal':
            return <FileText className="h-5 w-5" />;
        case 'reading':
            return <BookOpen className="h-5 w-5" />;
        case 'writing':
            return <PenTool className="h-5 w-5" />;
        case 'math':
            return <Calculator className="h-5 w-5" />;
        default:
            return <FileText className="h-5 w-5" />;
    }
};

const getAssessmentColor = (type: string) => {
    switch (type) {
        case 'formal':
            return 'bg-purple-100 text-purple-700 border-purple-200';
        case 'reading':
            return 'bg-blue-100 text-blue-700 border-blue-200';
        case 'writing':
            return 'bg-green-100 text-green-700 border-green-200';
        case 'math':
            return 'bg-orange-100 text-orange-700 border-orange-200';
        default:
            return 'bg-gray-100 text-gray-700 border-gray-200';
    }
};

const getVersionLabel = (version?: number) => {
    if (!version || version === 1) return 'Initial Assessment';
    return `Reassessment (Version ${version})`;
};

export function AssessmentCard({ assessment, onView, onEdit }: AssessmentCardProps) {
    const createdDate = typeof assessment.createdAt === 'string'
        ? new Date(assessment.createdAt)
        : assessment.createdAt;

    const updatedDate = assessment.updatedAt
        ? (typeof assessment.updatedAt === 'string' ? new Date(assessment.updatedAt) : assessment.updatedAt)
        : null;

    const displayDate = updatedDate || createdDate;

    return (
        <Card className={`hover:shadow-md transition-shadow border-2 ${getAssessmentColor(assessment.type)}`}>
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${getAssessmentColor(assessment.type)}`}>
                            {getAssessmentIcon(assessment.type)}
                        </div>
                        <div>
                            <CardTitle className="text-lg">
                                {assessment.type === 'formal' && (assessment.assessmentType || 'Formal Assessment')}
                                {assessment.type === 'reading' && 'Reading Assessment'}
                                {assessment.type === 'writing' && 'Writing Assessment'}
                                {assessment.type === 'math' && 'Math Assessment'}
                            </CardTitle>
                            <p className="text-sm text-gray-600 mt-1">
                                {format(displayDate, 'MMM dd, yyyy')}
                                {updatedDate && ' (Updated)'}
                            </p>
                        </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                        {getVersionLabel(assessment.version)}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-3">
                {/* Formal Assessment Details */}
                {assessment.type === 'formal' && (
                    <div className="space-y-2">
                        {assessment.diagnosis && (
                            <div>
                                <p className="text-xs font-medium text-gray-500">Diagnosis</p>
                                <p className="text-sm text-gray-900">{assessment.diagnosis}</p>
                            </div>
                        )}
                        {assessment.keyFindings && (
                            <div>
                                <p className="text-xs font-medium text-gray-500">Key Findings</p>
                                <p className="text-sm text-gray-700 line-clamp-2">{assessment.keyFindings}</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Skill Assessment Details */}
                {(assessment.type === 'reading' || assessment.type === 'writing' || assessment.type === 'math') && (
                    <div>
                        {assessment.additionalNotes && (
                            <div>
                                <p className="text-xs font-medium text-gray-500">Notes</p>
                                <p className="text-sm text-gray-700 line-clamp-2">{assessment.additionalNotes}</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onView}
                        className="flex-1"
                    >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                    </Button>
                    <Button
                        variant="default"
                        size="sm"
                        onClick={onEdit}
                        className="flex-1"
                    >
                        <Pencil className="h-4 w-4 mr-1" />
                        Edit
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
