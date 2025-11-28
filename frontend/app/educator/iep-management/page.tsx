'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Plus, 
  FileText, 
  Calendar, 
  Target, 
  Users, 
  Search, 
  Filter, 
  Download,
  Printer,
  Eye
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useEducatorStudents } from '@/hooks/useEducator';
import { apiClient } from '@/lib/api';
import { toast } from 'react-hot-toast';
import { IEPDocumentForm } from '@/components/iep/IEPDocumentForm';
import { IEPSubjectSectionForm } from '@/components/iep/IEPSubjectSectionForm';
import { WeeklyLessonPlanForm } from '@/components/iep/WeeklyLessonPlanForm';
import { IEPDocumentViewer } from '@/components/iep/IEPDocumentViewer';

interface IEPDocument {
  id: string;
  title: string;
  studentId: string;
  studentName: string;
  durationMonths: number;
  startDate: string;
  endDate: string;
  status: 'ACTIVE' | 'COMPLETED' | 'DRAFT' | 'ARCHIVED';
  areasOfRemediation?: string[];
  subjectSections: any[];
  weeklyEvaluations: any[];
  student?: any;
  specialEducator?: any;
  createdAt?: string;
  updatedAt?: string;
}

export default function IEPManagementPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { students, isLoading: studentsLoading } = useEducatorStudents();
  
  const [iepDocuments, setIepDocuments] = useState<IEPDocument[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<IEPDocument | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Dialog states
  const [showCreateDocumentDialog, setShowCreateDocumentDialog] = useState(false);
  const [showAddSubjectDialog, setShowAddSubjectDialog] = useState(false);
  const [showWeeklyPlanDialog, setShowWeeklyPlanDialog] = useState(false);
  const [showViewDocumentDialog, setShowViewDocumentDialog] = useState(false);

  useEffect(() => {
    loadIEPDocuments();
  }, [user?.profile?.id]);

  const loadIEPDocuments = async () => {
    try {
      setIsLoading(true);
      const documents = await apiClient.getIEPDocumentsByEducator(user?.profile?.id);
      
      // Map the backend response to match the frontend interface
      const mappedDocuments = documents.map((doc: any) => ({
        id: doc.id,
        title: doc.title,
        studentId: doc.studentId,
        studentName: doc.student?.fullName || 'Unknown Student',
        durationMonths: doc.durationMonths,
        startDate: doc.startDate,
        endDate: doc.endDate,
        status: doc.status,
        areasOfRemediation: doc.areasOfRemediation || [],
        subjectSections: doc.subjectSections || [],
        weeklyEvaluations: doc.weeklyEvaluations || [],
        student: doc.student,
        specialEducator: doc.specialEducator,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt
      }));
      
      setIepDocuments(mappedDocuments);
    } catch (error: any) {
      console.error('Failed to load IEP documents:', error);
      toast.error('Failed to load IEP documents');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredDocuments = iepDocuments?.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.studentName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreateDocumentSuccess = () => {
    setShowCreateDocumentDialog(false);
    loadIEPDocuments();
    toast.success('IEP document created successfully!');
  };

  const handleAddSubjectSuccess = () => {
    setShowAddSubjectDialog(false);
    loadIEPDocuments();
    toast.success('Subject section added successfully!');
  };

  const handleWeeklyPlanSuccess = () => {
    setShowWeeklyPlanDialog(false);
    loadIEPDocuments();
    toast.success('Weekly plan created successfully!');
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      ACTIVE: { color: 'bg-green-100 text-green-800', label: 'Active' },
      COMPLETED: { color: 'bg-blue-100 text-blue-800', label: 'Completed' },
      DRAFT: { color: 'bg-gray-100 text-gray-800', label: 'Draft' },
      ARCHIVED: { color: 'bg-purple-100 text-purple-800', label: 'Archived' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.DRAFT;
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const handlePrintDocument = (document: IEPDocument) => {
    window.print();
  };

  const handleExportDocument = (document: IEPDocument) => {
    // TODO: Implement PDF export functionality
    toast.success('PDF export functionality coming soon!');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading IEP documents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">IEP Management</h1>
            <p className="text-gray-600">Create and manage Individualized Education Programs</p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button onClick={() => setShowCreateDocumentDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New IEP
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-sm font-medium mb-2 block">Search</Label>
                <Input
                  placeholder="Search by title or student..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              
              <div>
                <Label className="text-sm font-medium mb-2 block">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="ARCHIVED">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-end">
                <Button variant="outline" className="w-full" onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                }}>
                  <Filter className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* IEP Documents List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>IEP Documents ({filteredDocuments?.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredDocuments?.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">No IEP documents found</p>
                <p className="text-sm text-gray-500">
                  Create your first IEP document to get started
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredDocuments?.map((document) => (
                  <Card key={document.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">{document.title}</h3>
                          {getStatusBadge(document.status)}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-3">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            <span>{document.studentName}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {formatDate(document.startDate)} - {formatDate(document.endDate)}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Target className="h-4 w-4" />
                            <span>{document.durationMonths} months</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <span>{document.subjectSections?.length || 0} subject sections</span>
                          <span>•</span>
                          <span>{document.weeklyEvaluations?.length || 0} weekly evaluations</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedDocument(document);
                            setShowViewDocumentDialog(true);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedDocument(document);
                            setShowAddSubjectDialog(true);
                          }}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add Subject
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedDocument(document);
                            setShowWeeklyPlanDialog(true);
                          }}
                        >
                          <Calendar className="h-4 w-4 mr-1" />
                          Weekly Plan
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePrintDocument(document)}
                        >
                          <Printer className="h-4 w-4 mr-1" />
                          Print
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleExportDocument(document)}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Export
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create IEP Document Dialog */}
        <Dialog open={showCreateDocumentDialog} onOpenChange={setShowCreateDocumentDialog}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New IEP Document</DialogTitle>
            </DialogHeader>
            <IEPDocumentForm
              students={students || []}
              onSuccess={handleCreateDocumentSuccess}
              onCancel={() => setShowCreateDocumentDialog(false)}
            />
          </DialogContent>
        </Dialog>

        {/* Add Subject Section Dialog */}
        <Dialog open={showAddSubjectDialog} onOpenChange={setShowAddSubjectDialog}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Add Subject Section to {selectedDocument?.title}
              </DialogTitle>
            </DialogHeader>
            {selectedDocument && (
              <IEPSubjectSectionForm
                iepDocumentId={selectedDocument.id}
                onSuccess={handleAddSubjectSuccess}
                onCancel={() => setShowAddSubjectDialog(false)}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Weekly Lesson Plan Dialog */}
        <Dialog open={showWeeklyPlanDialog} onOpenChange={setShowWeeklyPlanDialog}>
          <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Create Weekly Lesson Plan for {selectedDocument?.title}
              </DialogTitle>
            </DialogHeader>
            {selectedDocument && (
              <WeeklyLessonPlanForm
                iepDocumentId={selectedDocument.id}
                onSuccess={handleWeeklyPlanSuccess}
                onCancel={() => setShowWeeklyPlanDialog(false)}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* View Document Dialog */}
        <Dialog open={showViewDocumentDialog} onOpenChange={setShowViewDocumentDialog}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>IEP Document: {selectedDocument?.title}</DialogTitle>
            </DialogHeader>
            {selectedDocument && (
              <IEPDocumentViewer
                document={selectedDocument}
                onPrint={() => handlePrintDocument(selectedDocument)}
                onExport={() => handleExportDocument(selectedDocument)}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}