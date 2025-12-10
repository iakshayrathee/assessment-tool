'use client';

import { Download, FileText, Loader2 } from 'lucide-react';
import { Button } from './button';

interface FileViewerProps {
    files: Array<{ name: string; url: string; key: string }>;
    isLoading?: boolean;
}

export function FileViewer({ files, isLoading = false }: FileViewerProps) {
    const handleDownload = async (url: string, fileName: string) => {
        try {
            // Open in new tab for download
            window.open(url, '_blank');
        } catch (error) {
            console.error('Error downloading file:', error);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <span className="ml-2 text-gray-600">Loading files...</span>
            </div>
        );
    }

    if (files.length === 0) {
        return (
            <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No files attached</p>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Attached Files</h4>
            {files.map((file, index) => (
                <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <FileText className="h-5 w-5 text-blue-600 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                                {file.name}
                            </p>
                            <p className="text-xs text-gray-500">Click download to view</p>
                        </div>
                    </div>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(file.url, file.name)}
                        className="flex-shrink-0"
                    >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                    </Button>
                </div>
            ))}
        </div>
    );
}
