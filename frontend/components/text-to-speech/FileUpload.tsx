'use client';

import { useCallback, useState } from 'react';
import { Upload, File, X, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface FileUploadProps {
    onFileSelect: (file: File) => void;
    isLoading?: boolean;
    currentFile?: File | null;
    onClearFile?: () => void;
}

/**
 * FileUpload Component
 * Handles file upload with drag-and-drop support for PDF and DOCX files
 */
export function FileUpload({ onFileSelect, isLoading, currentFile, onClearFile }: FileUploadProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const validateFile = (file: File): boolean => {
        const validTypes = [
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/msword',
        ];

        if (!validTypes.includes(file.type)) {
            setError('Invalid file type. Please upload a PDF or DOCX file.');
            return false;
        }

        // Max file size: 50MB
        const maxSize = 50 * 1024 * 1024;
        if (file.size > maxSize) {
            setError('File is too large. Maximum size is 50MB.');
            return false;
        }

        setError(null);
        return true;
    };

    const handleFileSelect = useCallback(
        (file: File) => {
            console.log('[FileUpload] handleFileSelect called with:', file.name);
            if (validateFile(file)) {
                console.log('[FileUpload] File validated, calling onFileSelect');
                onFileSelect(file);
            } else {
                console.log('[FileUpload] File validation failed');
            }
        },
        [onFileSelect]
    );

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setIsDragging(false);

            const files = Array.from(e.dataTransfer.files);
            if (files.length > 0) {
                handleFileSelect(files[0]);
            }
        },
        [handleFileSelect]
    );

    const handleInputChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            console.log('[FileUpload] Input change event triggered');
            const files = e.target.files;
            console.log('[FileUpload] Files:', files);
            if (files && files.length > 0) {
                console.log('[FileUpload] File selected:', files[0].name);
                handleFileSelect(files[0]);
            }
        },
        [handleFileSelect]
    );

    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    if (currentFile) {
        return (
            <Card className="border-2 border-green-200 bg-green-50">
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <File className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                                <p className="font-medium text-gray-900">{currentFile.name}</p>
                                <p className="text-sm text-gray-600">{formatFileSize(currentFile.size)}</p>
                            </div>
                        </div>
                        {onClearFile && !isLoading && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onClearFile}
                                className="text-gray-500 hover:text-red-600"
                            >
                                <X className="h-5 w-5" />
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            <Card
                className={`border-2 border-dashed transition-all ${isDragging
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400 bg-white'
                    }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                <CardContent className="pt-6">
                    <div className="flex flex-col items-center justify-center py-8 px-4">
                        <div
                            className={`p-4 rounded-full mb-4 transition-colors ${isDragging ? 'bg-blue-100' : 'bg-gray-100'
                                }`}
                        >
                            <Upload
                                className={`h-8 w-8 ${isDragging ? 'text-blue-600' : 'text-gray-400'}`}
                            />
                        </div>

                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            Upload Document
                        </h3>
                        <p className="text-sm text-gray-600 text-center mb-4">
                            Drag and drop your PDF or DOCX file here, or click to browse
                        </p>

                        <label htmlFor="file-upload">
                            <Button
                                type="button"
                                variant="outline"
                                disabled={isLoading}
                                onClick={() => {
                                    console.log('[FileUpload] Button clicked');
                                    document.getElementById('file-upload')?.click();
                                }}
                            >
                                {isLoading ? 'Processing...' : 'Choose File'}
                            </Button>
                        </label>

                        <input
                            id="file-upload"
                            type="file"
                            accept=".pdf,.doc,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword"
                            onChange={handleInputChange}
                            className="hidden"
                            disabled={isLoading}
                        />

                        <p className="text-xs text-gray-500 mt-4">
                            Supported formats: PDF, DOCX • Max size: 50MB
                        </p>
                    </div>
                </CardContent>
            </Card>

            {error && (
                <Card className="border-red-200 bg-red-50">
                    <CardContent className="pt-4">
                        <div className="flex items-center space-x-2 text-red-800">
                            <AlertCircle className="h-5 w-5 flex-shrink-0" />
                            <p className="text-sm font-medium">{error}</p>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
