import React, { useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Upload, FileText, X } from 'lucide-react';

interface BatteryTestSectionProps {
    conducted: boolean;
    onConductedChange: (conducted: boolean) => void;
    summary: string;
    onSummaryChange: (summary: string) => void;
    reportUrl?: string;
    onReportUpload?: (file: File) => void;
    onReportRemove?: () => void;
    disabled?: boolean;
    title?: string;
    description?: string;
}

export const BatteryTestSection: React.FC<BatteryTestSectionProps> = ({
    conducted,
    onConductedChange,
    summary,
    onSummaryChange,
    reportUrl,
    onReportUpload,
    onReportRemove,
    disabled = false,
    title = 'Knowledcare Battery Test Results',
    description = 'Optional: Document battery test results if conducted',
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && onReportUpload) {
            // Validate file type
            if (file.type !== 'application/pdf') {
                alert('Please upload a PDF file only');
                return;
            }
            // Validate file size (max 10MB)
            if (file.size > 10 * 1024 * 1024) {
                alert('File size must be less than 10MB');
                return;
            }
            onReportUpload(file);
        }
    };

    return (
        <Card className="border-blue-200 bg-blue-50/30">
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    {title}
                </CardTitle>
                {description && (
                    <p className="text-sm text-gray-600 mt-1">{description}</p>
                )}
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Battery Conducted Checkbox */}
                <div className="flex items-center space-x-2">
                    <input
                        type="checkbox"
                        id="batteryTestConducted"
                        checked={conducted}
                        onChange={(e) => onConductedChange(e.target.checked)}
                        disabled={disabled}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <Label
                        htmlFor="batteryTestConducted"
                        className="text-sm font-medium cursor-pointer"
                    >
                        Battery Test Conducted
                    </Label>
                </div>

                {/* Conditional Fields - Only show if battery was conducted */}
                {conducted && (
                    <>
                        {/* Summary Text Area */}
                        <div>
                            <Label htmlFor="batteryTestSummary">
                                Test Summary {!disabled && <span className="text-red-500">*</span>}
                            </Label>
                            <Textarea
                                id="batteryTestSummary"
                                value={summary}
                                onChange={(e) => onSummaryChange(e.target.value)}
                                placeholder="Enter battery test results summary, key findings, and observations..."
                                disabled={disabled}
                                className="mt-1"
                                rows={4}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Provide a comprehensive summary of the battery test results
                            </p>
                        </div>

                        {/* File Upload */}
                        {onReportUpload && (
                            <div>
                                <Label>Test Report (Optional)</Label>
                                <div className="mt-2 space-y-2">
                                    {reportUrl ? (
                                        <div className="flex items-center justify-between p-3 border rounded-lg bg-white">
                                            <div className="flex items-center gap-2">
                                                <FileText className="h-5 w-5 text-blue-600" />
                                                <span className="text-sm font-medium">Report Uploaded</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => window.open(reportUrl, '_blank')}
                                                    disabled={disabled}
                                                >
                                                    View
                                                </Button>
                                                {!disabled && onReportRemove && (
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={onReportRemove}
                                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <div>
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept=".pdf"
                                                onChange={handleFileChange}
                                                disabled={disabled}
                                                className="hidden"
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => fileInputRef.current?.click()}
                                                disabled={disabled}
                                                className="w-full flex items-center justify-center gap-2"
                                            >
                                                <Upload className="h-4 w-4" />
                                                Upload PDF Report (Max 10MB)
                                            </Button>
                                            <p className="text-xs text-gray-500 mt-1">
                                                Upload the battery test report in PDF format
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </>
                )}

                {!conducted && (
                    <p className="text-sm text-gray-500 italic">
                        Check "Battery Test Conducted" to add test results
                    </p>
                )}
            </CardContent>
        </Card>
    );
};
