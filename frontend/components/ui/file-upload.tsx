'use client';

import { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { Upload, X, FileText, Loader2 } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface FileUploadProps {
    onFilesSelected: (files: File[]) => void;
    maxFiles?: number;
    maxSizeInMB?: number;
    acceptedTypes?: string[];
    existingFiles?: Array<{ name: string; url: string; key: string }>;
    onFileRemove?: (fileKey: string) => void;
    disabled?: boolean;
}

export function FileUpload({
    onFilesSelected,
    maxFiles = 5,
    maxSizeInMB = 10,
    acceptedTypes = ['.pdf', '.doc', '.docx'],
    existingFiles = [],
    onFileRemove,
    disabled = false,
}: FileUploadProps) {
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [dragActive, setDragActive] = useState(false);
    const [error, setError] = useState<string>('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const validateFile = (file: File): string | null => {
        // Check file size
        const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
        if (file.size > maxSizeInBytes) {
            return `File "${file.name}" exceeds ${maxSizeInMB}MB limit`;
        }

        // Check file type
        const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
        if (!acceptedTypes.includes(fileExtension)) {
            return `File "${file.name}" has invalid type. Allowed: ${acceptedTypes.join(', ')}`;
        }

        return null;
    };

    const handleFiles = (files: FileList | null) => {
        if (!files || files.length === 0) return;

        setError('');
        const filesArray = Array.from(files);

        // Check total file count
        const totalFiles = selectedFiles.length + existingFiles.length + filesArray.length;
        if (totalFiles > maxFiles) {
            setError(`Maximum ${maxFiles} files allowed`);
            return;
        }

        // Validate each file
        for (const file of filesArray) {
            const validationError = validateFile(file);
            if (validationError) {
                setError(validationError);
                return;
            }
        }

        const newFiles = [...selectedFiles, ...filesArray];
        setSelectedFiles(newFiles);
        onFilesSelected(newFiles);
    };

    const handleDrag = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (disabled) return;

        handleFiles(e.dataTransfer.files);
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (disabled) return;
        handleFiles(e.target.files);
    };

    const handleClick = () => {
        if (disabled) return;
        fileInputRef.current?.click();
    };

    const removeSelectedFile = (index: number) => {
        const newFiles = selectedFiles.filter((_, i) => i !== index);
        setSelectedFiles(newFiles);
        onFilesSelected(newFiles);
        setError('');
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    return (
        <div className="space-y-4">
            {/* Drop Zone */}
            <div
                className={cn(
                    'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors',
                    dragActive ? 'border-blue-500 bg-primary/10' : 'border-border hover:border-gray-400',
                    disabled && 'opacity-50 cursor-not-allowed'
                )}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={handleClick}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept={acceptedTypes.join(',')}
                    onChange={handleChange}
                    className="hidden"
                    disabled={disabled}
                />

                <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm font-medium text-foreground mb-1">
                    Click to upload or drag and drop
                </p>
                <p className="text-xs text-muted-foreground">
                    {acceptedTypes.join(', ').toUpperCase()} (max {maxSizeInMB}MB each, up to {maxFiles} files)
                </p>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded text-sm">
                    {error}
                </div>
            )}

            {/* Existing Files */}
            {existingFiles.length > 0 && (
                <div className="space-y-2">
                    <h4 className="text-sm font-medium text-foreground">Uploaded Files</h4>
                    {existingFiles.map((file, index) => (
                        <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-success/10 border border-success/20 rounded-lg"
                        >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                <FileText className="h-5 w-5 text-success flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                                    <a
                                        href={file.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-primary hover:underline"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        Download
                                    </a>
                                </div>
                            </div>
                            {onFileRemove && !disabled && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onFileRemove(file.key);
                                    }}
                                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Selected Files (not yet uploaded) */}
            {selectedFiles.length > 0 && (
                <div className="space-y-2">
                    <h4 className="text-sm font-medium text-foreground">Selected Files</h4>
                    {selectedFiles.map((file, index) => (
                        <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-primary/10 border border-primary/20 rounded-lg"
                        >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                <FileText className="h-5 w-5 text-primary flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                                    <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                                </div>
                            </div>
                            {!disabled && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeSelectedFile(index)}
                                    className="text-muted-foreground hover:text-foreground"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
