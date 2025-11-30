'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { AlertCircle } from 'lucide-react';

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
    const [selectedAction, setSelectedAction] = useState<'new-version' | 'overwrite'>('new-version');

    const nextVersion = currentVersion + 1;
    const canCreateNewVersion = nextVersion <= maxVersions;
    const versionLabel = nextVersion === 1 ? 'Initial Assessment' : `Reassessment (Version ${nextVersion})`;

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
                    <DialogTitle>Save Assessment</DialogTitle>
                    <DialogDescription>
                        Choose how you want to save this assessment
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <RadioGroup value={selectedAction} onValueChange={(value) => setSelectedAction(value as any)}>
                        {/* New Version Option */}
                        <div className="flex items-start space-x-3 p-3 rounded-lg border-2 hover:bg-gray-50 transition-colors">
                            <RadioGroupItem
                                value="new-version"
                                id="new-version"
                                disabled={!canCreateNewVersion}
                            />
                            <div className="flex-1">
                                <Label
                                    htmlFor="new-version"
                                    className={`font-medium cursor-pointer ${!canCreateNewVersion ? 'text-gray-400' : ''}`}
                                >
                                    Save as {versionLabel}
                                </Label>
                                <p className="text-sm text-gray-600 mt-1">
                                    {canCreateNewVersion
                                        ? 'Create a new version while keeping the previous one'
                                        : 'Maximum versions (3) reached'}
                                </p>
                            </div>
                        </div>

                        {/* Overwrite Option */}
                        <div className="flex items-start space-x-3 p-3 rounded-lg border-2 hover:bg-gray-50 transition-colors">
                            <RadioGroupItem value="overwrite" id="overwrite" />
                            <div className="flex-1">
                                <Label htmlFor="overwrite" className="font-medium cursor-pointer">
                                    Overwrite Current Version
                                </Label>
                                <p className="text-sm text-gray-600 mt-1">
                                    Replace the existing assessment data
                                </p>
                            </div>
                        </div>
                    </RadioGroup>

                    {!canCreateNewVersion && (
                        <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-amber-800">
                                <p className="font-medium">Maximum versions reached</p>
                                <p className="mt-1">
                                    You can only overwrite the current version. To create a new version, delete an older assessment first.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={handleConfirm}>
                        Save Assessment
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
