'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Loader2, Database, Trash2, Eye, Upload, Search } from 'lucide-react';
import { FileUpload } from '@/components/ui/file-upload';
import { PageWrapper } from '@/components/layout/PageWrapper';

interface Document {
    key: string;
    fileName: string;
    size: number;
    lastModified: Date;
    url: string;
}

export default function DataBankPage() {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const [showUploadModal, setShowUploadModal] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isUploading, setIsUploading] = useState(false);

    // Fetch documents using React Query
    const { data: documents = [], isLoading, refetch } = useQuery({
        queryKey: ['educator-documents'],
        queryFn: () => apiClient.getEducatorDocuments(),
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    // Upload mutation
    const uploadMutation = useMutation({
        mutationFn: (files: File[]) => apiClient.uploadEducatorDocuments(files),
        onSuccess: () => {
            toast({
                title: 'Success',
                description: 'Documents uploaded successfully!',
            });
            queryClient.invalidateQueries({ queryKey: ['educator-documents'] });
            setShowUploadModal(false);
            setSelectedFiles([]);
        },
        onError: (error: any) => {
            toast({
                title: 'Error',
                description: error.response?.data?.error || error.message || 'Failed to upload documents',
                variant: 'destructive'
            });
        }
    });

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: (fileKey: string) => apiClient.deleteEducatorDocument(fileKey),
        onSuccess: () => {
            toast({
                title: 'Success',
                description: 'Document deleted successfully',
            });
            queryClient.invalidateQueries({ queryKey: ['educator-documents'] });
        },
        onError: (error: any) => {
            toast({
                title: 'Error',
                description: error.message || 'Failed to delete document',
                variant: 'destructive'
            });
        }
    });

    const handleUpload = async () => {
        if (selectedFiles.length === 0) {
            toast({
                title: 'Validation Error',
                description: 'Please select at least one file',
                variant: 'destructive'
            });
            return;
        }

        setIsUploading(true);
        try {
            await uploadMutation.mutateAsync(selectedFiles);
        } finally {
            setIsUploading(false);
        }
    };

    const handleDelete = async (doc: Document) => {
        if (confirm(`Are you sure you want to delete "${doc.fileName}"?`)) {
            await deleteMutation.mutateAsync(doc.key);
        }
    };

    const handleOpen = (doc: Document) => {
        window.open(doc.url, '_blank');
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    const formatDate = (date: Date): string => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getFileIcon = (fileName: string) => {
        const ext = fileName.split('.').pop()?.toLowerCase();
        if (ext === 'pdf') return '📄';
        if (ext === 'doc' || ext === 'docx') return '📝';
        return '📎';
    };

    // Filter documents based on search
    const filteredDocuments = documents.filter(doc =>
        doc.fileName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading documents...</p>
                </div>
            </div>
        );
    }

    return (
        <PageWrapper
            title="Data Bank"
            description="Manage your documents and resources"
            breadcrumbs={[{ label: 'Educator' }, { label: 'Data Bank' }]}
            actions={
                <Button onClick={() => setShowUploadModal(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Upload Documents
                </Button>
            }
        >

            {/* Search and Stats */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search documents..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Badge variant="outline" className="px-4 py-2">
                            <Database className="h-4 w-4 mr-2" />
                            {filteredDocuments.length} Document{filteredDocuments.length !== 1 ? 's' : ''}
                        </Badge>
                    </div>
                </CardContent>
            </Card>

            {/* Documents List */}
            <Card>
                <CardHeader>
                    <CardTitle>My Documents</CardTitle>
                </CardHeader>
                <CardContent>
                    {filteredDocuments.length === 0 ? (
                        <div className="text-center py-12">
                            <Database className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-xl font-medium text-foreground mb-2">
                                {searchTerm ? 'No documents found' : 'No documents yet'}
                            </h3>
                            <p className="text-muted-foreground mb-6">
                                {searchTerm ? 'Try a different search term' : 'Start by uploading your first document'}
                            </p>
                            {!searchTerm && (
                                <Button onClick={() => setShowUploadModal(true)}>
                                    <Upload className="h-5 w-5 mr-2" />
                                    Upload First Document
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-muted/40">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                            File Name
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                            Size
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                            Uploaded
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-background divide-y divide-gray-200">
                                    {filteredDocuments.map((doc) => (
                                        <tr key={doc.key} className="hover:bg-muted/40">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <span className="text-2xl mr-3">{getFileIcon(doc.fileName)}</span>
                                                    <div className="text-sm font-medium text-foreground">{doc.fileName}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-foreground">{formatFileSize(doc.size)}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-muted-foreground">{formatDate(doc.lastModified)}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleOpen(doc)}
                                                    >
                                                        <Eye className="h-4 w-4 mr-1" />
                                                        Open
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDelete(doc)}
                                                        disabled={deleteMutation.isPending}
                                                    >
                                                        <Trash2 className="h-4 w-4 mr-1 text-destructive" />
                                                        Delete
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Upload Modal */}
            <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Upload Documents</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        <FileUpload
                            onFilesSelected={setSelectedFiles}
                            maxFiles={10}
                            maxSizeInMB={10}
                            acceptedTypes={['.pdf', '.doc', '.docx']}
                            disabled={isUploading}
                        />

                        <div className="flex gap-3 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShowUploadModal(false)}
                                className="flex-1"
                                disabled={isUploading}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleUpload}
                                disabled={isUploading || selectedFiles.length === 0}
                                className="flex-1"
                            >
                                {isUploading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Uploading...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="h-4 w-4 mr-2" />
                                        Upload {selectedFiles.length > 0 ? `(${selectedFiles.length})` : ''}
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </PageWrapper>
    );
}
