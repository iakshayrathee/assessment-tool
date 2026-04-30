'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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
import { toast } from '@/lib/toast';
import { IEPDocumentForm } from '@/components/iep/IEPDocumentForm';
import { IEPSubjectSectionForm } from '@/components/iep/IEPSubjectSectionForm';
import { WeeklyLessonPlanForm } from '@/components/iep/WeeklyLessonPlanForm';
import { IEPDocumentViewer } from '@/components/iep/IEPDocumentViewer';
import { StudentSelectionModal } from '@/components/assessments/StudentSelectionModal';
import { useAIIEPSuggestions } from '@/hooks/useAI';
import { AIIEPSuggestionsPanel } from '@/components/ai/AIInsightPanels';
import { PageWrapper } from '@/components/layout/PageWrapper';

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
  const { t } = useTranslation('educator');
  const { students, isLoading: studentsLoading } = useEducatorStudents();
  
  const [iepDocuments, setIepDocuments] = useState<IEPDocument[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<IEPDocument | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // AI student selector
  const [selectedStudentForAI, setSelectedStudentForAI] = useState<any>(null);
  const [showStudentModalForAI, setShowStudentModalForAI] = useState(false);

  // AI hook — enabled when a student is selected for AI IEP suggestions
  const aiIEP = useAIIEPSuggestions(selectedStudentForAI?.id || '', !!selectedStudentForAI?.id);

  const handleSaveAIPlan = async (aiData: any) => {
    try {
      if (!selectedStudentForAI?.id) return;
      await apiClient.saveAILessonPlan(selectedStudentForAI.id, aiData);
      toast.success(t('iep.aiPlanSaved'));
    } catch (error: any) {
      toast.error(error.message || t('iep.aiPlanSaveFailed'));
    }
  };

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
        studentName: doc.student?.fullName || t('iep.unknownStudent'),
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
      toast.error(t('iep.loadFailed'));
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
    toast.success(t('iep.documentCreated'));
  };

  const handleAddSubjectSuccess = () => {
    setShowAddSubjectDialog(false);
    loadIEPDocuments();
    toast.success(t('iep.subjectAdded'));
  };

  const handleWeeklyPlanSuccess = () => {
    setShowWeeklyPlanDialog(false);
    loadIEPDocuments();
    toast.success(t('iep.weeklyPlanCreated'));
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      ACTIVE: { color: 'bg-success/10 text-foreground', label: t('iep.statusActive') },
      COMPLETED: { color: 'bg-primary/10 text-primary', label: t('iep.statusCompleted') },
      DRAFT: { color: 'bg-muted text-foreground', label: t('iep.statusDraft') },
      ARCHIVED: { color: 'bg-info/10 text-foreground', label: t('iep.statusArchived') }
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
    // PDF export is handled by IEPDocumentViewer component
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('iep.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <PageWrapper
      title={t('iep.title')}
      description={t('iep.subtitle')}
      breadcrumbs={[{ label: t('iep.breadcrumb') }]}
      actions={
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setShowStudentModalForAI(true)}
            className="flex items-center gap-2"
          >
            <Users className="h-4 w-4" />
            {selectedStudentForAI ? t('iep.aiSuggestionsFor', { name: selectedStudentForAI.fullName }) : t('iep.aiSuggestions')}
          </Button>
          <Button onClick={() => setShowCreateDocumentDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {t('iep.newIEP')}
          </Button>
        </div>
      }
    >

        {/* AI IEP Suggestions */}
        {selectedStudentForAI && (
          <AIIEPSuggestionsPanel
            data={aiIEP.data}
            isLoading={aiIEP.isLoading}
            error={aiIEP.error}
            onLoad={() => {}}
            onSave={handleSaveAIPlan}
          />
        )}

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-sm font-medium mb-2 block">{t('iep.search')}</Label>
                <Input
                  placeholder={t('iep.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              
              <div>
                <Label className="text-sm font-medium mb-2 block">{t('iep.statusLabel')}</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('iep.filterByStatus')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('iep.allStatuses')}</SelectItem>
                    <SelectItem value="DRAFT">{t('iep.statusDraft')}</SelectItem>
                    <SelectItem value="ACTIVE">{t('iep.statusActive')}</SelectItem>
                    <SelectItem value="COMPLETED">{t('iep.statusCompleted')}</SelectItem>
                    <SelectItem value="ARCHIVED">{t('iep.statusArchived')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-end">
                <Button variant="outline" className="w-full" onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                }}>
                  <Filter className="h-4 w-4 mr-2" />
                  {t('iep.clearFilters')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* IEP Documents List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{t('iep.documentsTitle', { count: filteredDocuments?.length })}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredDocuments?.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-2">{t('iep.noDocuments')}</p>
                <p className="text-sm text-muted-foreground">
                  {t('iep.noDocumentsDesc')}
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
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground mb-3">
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
                            <span>{t('iep.months', { count: document.durationMonths })}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{t('iep.subjectSections', { count: document.subjectSections?.length || 0 })}</span>
                          <span>•</span>
                          <span>{t('iep.weeklyEvaluations', { count: document.weeklyEvaluations?.length || 0 })}</span>
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
                          {t('iep.view')}
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
                          {t('iep.addSubject')}
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
                          {t('iep.weeklyPlan')}
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
              <DialogTitle>{t('iep.dialogCreateTitle')}</DialogTitle>
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
                {t('iep.dialogAddSubjectTitle', { title: selectedDocument?.title })}
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
                {t('iep.dialogWeeklyPlanTitle', { title: selectedDocument?.title })}
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
              <DialogTitle>{t('iep.dialogViewTitle', { title: selectedDocument?.title })}</DialogTitle>
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

        <StudentSelectionModal
          isOpen={showStudentModalForAI}
          onClose={() => setShowStudentModalForAI(false)}
          onSelect={(_studentId: string, student: any) => setSelectedStudentForAI(student)}
          selectedStudentId={selectedStudentForAI?.id}
        />
    </PageWrapper>
  );
}