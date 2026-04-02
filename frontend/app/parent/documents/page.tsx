'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  FileText,
  Upload,
  Search,
  Filter,
  ArrowLeft,
  Download,
  Calendar,
  Eye,
  Trash2
} from 'lucide-react';
import { PageWrapper } from '@/components/layout/PageWrapper';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { toast } from '@/lib/toast';

interface Document {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  category: string;
  description?: string;
  createdAt: string;
  filePath: string;
}

export default function ParentDocuments() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });

  useEffect(() => {
    loadDocuments();
  }, [pagination.page, categoryFilter]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: pagination.page,
        limit: pagination.limit
      };

      if (categoryFilter) {
        params.category = categoryFilter;
      }

      const result = await apiClient.getParentDocuments(params);
      setDocuments(result.data);
      setPagination(prev => ({
        ...prev,
        total: result.pagination.total,
        pages: result.pagination.totalPages || Math.ceil(result.pagination.total / result.pagination.limit)
      }));
    } catch (error) {
      console.error('Failed to load documents:', error);
      toast.error('Failed to load documents');
      // Mock data for demonstration
      setDocuments([
        {
          id: '1',
          fileName: 'Medical_Report_Jan2024.pdf',
          fileType: 'application/pdf',
          fileSize: 2048576,
          category: 'Medical',
          description: 'Latest medical evaluation report',
          createdAt: '2024-01-13T10:00:00Z',
          filePath: '/uploads/documents/medical_report_jan2024.pdf'
        },
        {
          id: '2',
          fileName: 'School_Report_Card_Q1.pdf',
          fileType: 'application/pdf',
          fileSize: 1024000,
          category: 'Academic',
          description: 'First quarter report card from school',
          createdAt: '2024-01-10T10:00:00Z',
          filePath: '/uploads/documents/school_report_q1.pdf'
        },
        {
          id: '3',
          fileName: 'Therapy_Notes_Dec2023.docx',
          fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          fileSize: 512000,
          category: 'Therapy',
          description: 'Speech therapy session notes',
          createdAt: '2024-01-05T10:00:00Z',
          filePath: '/uploads/documents/therapy_notes_dec2023.docx'
        }
      ]);
      setPagination(prev => ({
        ...prev,
        total: 3,
        pages: 1
      }));
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) {
      return <FileText className="h-5 w-5 text-destructive" />;
    } else if (fileType.includes('word') || fileType.includes('document')) {
      return <FileText className="h-5 w-5 text-primary" />;
    } else if (fileType.includes('image')) {
      return <FileText className="h-5 w-5 text-success" />;
    }
    return <FileText className="h-5 w-5 text-muted-foreground" />;
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Medical':
        return 'bg-destructive/10 text-foreground';
      case 'Academic':
        return 'bg-primary/10 text-primary';
      case 'Therapy':
        return 'bg-info/10 text-foreground';
      case 'Legal':
        return 'bg-warning/10 text-foreground';
      default:
        return 'bg-muted text-foreground';
    }
  };

  const filteredDocuments = documents.filter(doc =>
    doc.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (doc.description && doc.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleDownload = async (document: Document) => {
    try {
      // In a real implementation, this would download the file
      toast.success(`Downloading ${document.fileName}`);
    } catch (error) {
      toast.error('Failed to download document');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading documents...</p>
        </div>
      </div>
    );
  }

  return (
    <PageWrapper
      title="My Documents"
      description="Manage and view your uploaded documents"
      breadcrumbs={[{ label: 'Dashboard', href: '/parent/dashboard' }, { label: 'Documents' }]}
      actions={
        <Link href="/parent/documents/upload">
          <Button>
            <Upload className="h-4 w-4 mr-2" />
            Upload Document
          </Button>
        </Link>
      }
    >
        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search documents..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="sm:w-48">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="Medical">Medical</SelectItem>
                    <SelectItem value="Academic">Academic</SelectItem>
                    <SelectItem value="Therapy">Therapy</SelectItem>
                    <SelectItem value="Legal">Legal</SelectItem>
                    <SelectItem value="General">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Documents List */}
        <div className="space-y-4">
          {filteredDocuments.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No documents found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || categoryFilter
                    ? 'No documents match your current filters.'
                    : 'You haven\'t uploaded any documents yet.'}
                </p>
                <Link href="/parent/documents/upload">
                  <Button>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Your First Document
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDocuments.map((document) => (
                <Card key={document.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        {getFileIcon(document.fileType)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm truncate" title={document.fileName}>
                          {document.fileName}
                        </h3>
                        {document.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {document.description}
                          </p>
                        )}
                        <div className="flex items-center justify-between mt-3">
                          <Badge className={getCategoryColor(document.category)}>
                            {document.category}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatFileSize(document.fileSize)}
                          </span>
                        </div>
                        <div className="flex items-center text-xs text-muted-foreground mt-2">
                          <Calendar className="h-3 w-3 mr-1" />
                          {new Date(document.createdAt).toLocaleDateString()}
                        </div>
                        <div className="flex space-x-2 mt-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownload(document)}
                            className="flex-1"
                          >
                            <Download className="h-3 w-3 mr-1" />
                            Download
                          </Button>
                          <Button size="sm" variant="outline">
                            <Eye className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex justify-center mt-8">
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
              >
                Previous
              </Button>
              <span className="flex items-center px-4 py-2 text-sm text-foreground">
                Page {pagination.page} of {pagination.pages}
              </span>
              <Button
                variant="outline"
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page === pagination.pages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
    </PageWrapper>
  );
}
