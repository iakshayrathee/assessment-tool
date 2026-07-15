'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';

interface MaxAssessmentsWarningDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    oldestAssessment: {
        id: string;
        type: string;
        createdAt: string | Date;
        version?: number;
        assessmentType?: string;
    } | null;
    assessmentTypeName: string;
}

export function MaxAssessmentsWarningDialog({
    isOpen,
    onClose,
    onConfirm,
    oldestAssessment,
    assessmentTypeName,
}: MaxAssessmentsWarningDialogProps) {
    const { t } = useTranslation(['assessments', 'iep']);
    if (!oldestAssessment) return null;

    const createdDate = typeof oldestAssessment.createdAt === 'string'
        ? new Date(oldestAssessment.createdAt)
        : oldestAssessment.createdAt;

    const versionLabel = !oldestAssessment.version || oldestAssessment.version === 1
        ? t('initialAssessment', { defaultValue: 'Initial Assessment' })
        : t('reassessmentVersion', { defaultValue: 'Reassessment (Version {{version}})', version: oldestAssessment.version });

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-warning/10 rounded-full">
                            <AlertTriangle className="h-6 w-6 text-warning" />
                        </div>
                        <DialogTitle className="text-xl">{t('maxAssessmentsReached', { defaultValue: 'Maximum Assessments Reached' })}</DialogTitle>
                    </div>
                    <DialogDescription>
                        {t('maxAssessmentsReachedDesc', { defaultValue: 'You have reached the maximum of 3 {{type}} assessments for this student.', type: oldestAssessment.assessmentType || assessmentTypeName })}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                        <p className="text-sm font-medium text-red-900 mb-2">
                            {t('deleteOldestWarning', { defaultValue: 'The following assessment will be permanently deleted:' })}
                        </p>
                        <div className="space-y-1 text-sm text-foreground">
                            <p>
                                <span className="font-medium">{t('type', { defaultValue: 'Type' })}:</span>{' '}
                                {oldestAssessment.assessmentType || assessmentTypeName}
                            </p>
                            <p>
                                <span className="font-medium">{t('version', { defaultValue: 'Version' })}:</span> {versionLabel}
                            </p>
                            <p>
                                <span className="font-medium">{t('created', { defaultValue: 'Created' })}:</span>{' '}
                                {format(createdDate, 'MMM dd, yyyy')}
                            </p>
                        </div>
                    </div>

                    <div className="p-4 bg-muted/40 border border-border rounded-lg">
                        <p className="text-sm text-foreground">
                            <span className="font-medium">{t('note', { defaultValue: 'Note' })}:</span> {t('deleteOldestConfirmNote', { defaultValue: 'This action cannot be undone. The oldest assessment will be permanently removed from the system to make room for the new one.' })}
                        </p>
                    </div>
                </div>

                <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={onClose}>
                        {t('cancel')}
                    </Button>
                    <Button variant="destructive" onClick={onConfirm}>
                        {t('deleteOldestAndContinue', { defaultValue: 'Delete Oldest & Continue' })}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
