'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ArrowLeft,
  Upload,
  FileText,
  X,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { toast } from 'react-hot-toast';

interface UploadedFile {
  file: File;
  preview?: string;
  uploading?: boolean;
  uploaded?: boolean;
  error?: string;
}

export default function UploadDocument() {
  const router = useRouter();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [formData, setFormData] = useState({
    category: '',
    description: ''
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    
    // Validate file types and sizes
    const validFiles = selectedFiles.filter(file => {
      const maxSize = 10 * 1024 * 1024; // 10MB
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/png',
        'image/gif'
      ];

      if (!allowedTypes.includes(file.type)) {
        toast.error(`${file.name}: File type not supported`);
        return false;
      }

      if (file.size > maxSize) {
        toast.error(`${file.name}: File size too large (max 10MB)`);
        return false;
      }

      return true;
    });

    const newFiles: UploadedFile[] = validFiles.map(file => ({
      file,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
    }));

    setFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (index: number) => {
    setFiles(prev => {
      const newFiles = [...prev];
      if (newFiles[index].preview) {
        URL.revokeObjectURL(newFiles[index].preview!);
      }
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (files.length === 0) {
      toast.error('Please select at least one file to upload');
      return;
    }

    if (!formData.category) {
      toast.error('Please select a category');
      return;
    }

    try {
      setUploading(true);
      
      // Upload files one by one
      for (let i = 0; i < files.length; i++) {
        const fileData = files[i];
        
        // Update file status to uploading
        setFiles(prev => {
          const updated = [...prev];
          updated[i] = { ...updated[i], uploading: true };
          return updated;
        });

        try {
          await apiClient.uploadParentDocument(
            fileData.file, 
            formData.category, 
            formData.description
          );

          // Update file status to uploaded
          setFiles(prev => {
            const updated = [...prev];
            updated[i] = { ...updated[i], uploading: false, uploaded: true };
            return updated;
          });
        } catch (error) {
          // Update file status to error
          setFiles(prev => {
            const updated = [...prev];
            updated[i] = { 
              ...updated[i], 
              uploading: false, 
              error: 'Upload failed' 
            };
            return updated;
          });
          throw error;
        }
      }
      
      toast.success('All documents uploaded successfully');
      
      // Redirect after a short delay to show success status
      setTimeout(() => {
        router.push('/parent/documents');
      }, 1500);
      
    } catch (error) {
      console.error('Failed to upload documents:', error);
      toast.error('Some documents failed to upload. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (file: File) => {
    if (file.type.includes('pdf')) {
      return <FileText className="h-8 w-8 text-red-600" />;
    } else if (file.type.includes('word') || file.type.includes('document')) {
      return <FileText className="h-8 w-8 text-blue-600" />;
    } else if (file.type.includes('image')) {
      return <FileText className="h-8 w-8 text-green-600" />;
    }
    return <FileText className="h-8 w-8 text-gray-600" />;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <Link href="/parent/documents">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Documents
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Upload Documents</h1>
                <p className="text-gray-600">Share medical records, reports, or other important documents</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upload Guidelines */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertCircle className="h-5 w-5 mr-2 text-blue-600" />
                  Upload Guidelines
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-sm mb-2">Accepted file types:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• PDF documents (.pdf)</li>
                    <li>• Word documents (.doc, .docx)</li>
                    <li>• Images (.jpg, .png, .gif)</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold text-sm mb-2">File requirements:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Maximum file size: 10MB</li>
                    <li>• Clear, readable documents</li>
                    <li>• Multiple files can be uploaded</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-sm mb-2">Document categories:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Medical: Reports, prescriptions</li>
                    <li>• Academic: School reports, evaluations</li>
                    <li>• Therapy: Session notes, assessments</li>
                    <li>• Legal: IEP documents, agreements</li>
                  </ul>
                </div>

                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-800">
                    <strong>Privacy:</strong> All uploaded documents are secure and 
                    only accessible to you and your child's educational team.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Upload Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Document Upload</CardTitle>
                <CardDescription>
                  Select files and provide details about the documents you're uploading.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* File Upload Area */}
                  <div className="space-y-2">
                    <Label>Select Files *</Label>
                    <div 
                      className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-lg font-medium text-gray-900 mb-2">
                        Click to upload files
                      </p>
                      <p className="text-sm text-gray-600">
                        or drag and drop files here
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        PDF, DOC, DOCX, JPG, PNG up to 10MB each
                      </p>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </div>

                  {/* Selected Files */}
                  {files.length > 0 && (
                    <div className="space-y-2">
                      <Label>Selected Files ({files.length})</Label>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {files.map((fileData, index) => (
                          <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center space-x-3">
                              {getFileIcon(fileData.file)}
                              <div>
                                <p className="font-medium text-sm">{fileData.file.name}</p>
                                <p className="text-xs text-gray-500">
                                  {formatFileSize(fileData.file.size)}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {fileData.uploading && (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                              )}
                              {fileData.uploaded && (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              )}
                              {fileData.error && (
                                <AlertCircle className="h-4 w-4 text-red-600" />
                              )}
                              {!fileData.uploading && !fileData.uploaded && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeFile(index)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="category">Document Category *</Label>
                      <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select document category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Medical">Medical Records</SelectItem>
                          <SelectItem value="Academic">Academic Reports</SelectItem>
                          <SelectItem value="Therapy">Therapy Documents</SelectItem>
                          <SelectItem value="Legal">Legal Documents</SelectItem>
                          <SelectItem value="General">General</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description (Optional)</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        placeholder="Brief description of the documents (e.g., 'Latest medical evaluation from Dr. Smith')"
                        rows={3}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-4 pt-6 border-t">
                    <Link href="/parent/documents">
                      <Button type="button" variant="outline" disabled={uploading}>
                        Cancel
                      </Button>
                    </Link>
                    <Button type="submit" disabled={uploading || files.length === 0}>
                      {uploading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Documents
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
