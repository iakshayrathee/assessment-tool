'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface VersionSelectionDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (action: 'new-version' | 'overwrite', version?: number) => void;
    currentVersion: number;
    maxVersions?: number;
}

export function VersionSelectionDialog({
    isOpen,
    onClose,
    onConfirm,
    currentVersion,
    maxVersions = 3,
}: VersionSelectionDialogProps) {
    const { t } = useTranslation(['assessments', 'iep']);
    const [selectedAction, setSelectedAction] = useState<'new-version' | 'overwrite'>('new-version');

    const nextVersion = currentVersion + 1;
    const canCreateNewVersion = nextVersion <= maxVersions;
    const versionLabel = nextVersion === 1 ? t('initialAssessment', { defaultValue: 'Initial Assessment' }) : t('reassessmentVersion', { defaultValue: 'Reassessment (Version {{version}})', version: nextVersion });

    const handleConfirm = () => {
        if (selectedAction === 'new-version' && canCreateNewVersion) {
            onConfirm('new-version', nextVersion);
        } else {
            onConfirm('overwrite', currentVersion);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>{t('saveAssessment', { defaultValue: 'Save Assessment' })}</DialogTitle>
                    <DialogDescription>
                        {t('saveAssessmentDesc', { defaultValue: 'Choose how you want to save this assessment' })}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <RadioGroup value={selectedAction} onValueChange={(value) => setSelectedAction(value as any)}>
                        {/* New Version Option */}
                        <div className="flex items-start space-x-3 p-3 rounded-lg border-2 hover:bg-muted/40 transition-colors">
                            <RadioGroupItem
                                value="new-version"
                                id="new-version"
                                disabled={!canCreateNewVersion}
                            />
                            <div className="flex-1">
                                <Label
                                    htmlFor="new-version"
                                    className={`font-medium cursor-pointer ${!canCreateNewVersion ? 'text-muted-foreground' : ''}`}
                                >
                                    {t('saveAsVersion', { defaultValue: 'Save as {{version}}', version: versionLabel })}
                                </Label>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {canCreateNewVersion
                                        ? t('createNewVersionDesc', { defaultValue: 'Create a new version while keeping the previous one' })
                                        : t('maxVersionsReached', { defaultValue: 'Maximum versions (3) reached' })}
                                </p>
                             </div>
                        </div>

                        {/* Overwrite Option */}
                        <div className="flex items-start space-x-3 p-3 rounded-lg border-2 hover:bg-muted/40 transition-colors">
                            <RadioGroupItem value="overwrite" id="overwrite" />
                            <div className="flex-1">
                                <Label htmlFor="overwrite" className="font-medium cursor-pointer">
                                    {t('overwriteCurrentVersion', { defaultValue: 'Overwrite Current Version' })}
                                </Label>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {t('replaceExistingDataDesc', { defaultValue: 'Replace the existing assessment data' })}
                                </p>
                            </div>
                        </div>
                    </RadioGroup>

                    {!canCreateNewVersion && (
                        <div className="flex items-start gap-2 p-3 bg-warning/10 border border-warning/20 rounded-lg">
                            <AlertCircle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-amber-800">
                                <p className="font-medium">{t('maxVersionsReachedTitle', { defaultValue: 'Maximum versions reached' })}</p>
                                <p className="mt-1">
                                    {t('maxVersionsReachedDesc', { defaultValue: 'You can only overwrite the current version. To create a new version, delete an older assessment first.' })}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={onClose}>
                        {t('cancel')}
                    </Button>
                    <Button onClick={handleConfirm}>
                        {t('saveAssessment', { defaultValue: 'Save Assessment' })}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
