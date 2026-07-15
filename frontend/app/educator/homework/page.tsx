'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ProfessionalDatePicker } from '@/components/ui/professional-date-picker';
import { Plus, Eye, Loader2, ClipboardList } from 'lucide-react';
import { FileUpload } from '@/components/ui/file-upload';
import { FileViewer } from '@/components/ui/file-viewer';
import { GradeDisplay } from '@/components/ui/GradeDisplay';
import { PageWrapper } from '@/components/layout/PageWrapper';

interface Student {
    id: string;
    fullName: string;
    grade: string;
    age: number;
}

interface Homework {
    id: string;
    title: string;
    subject: string;
    instructions: string;
    dueDate: string;
    status: string;
    estimatedTime?: number;
    additionalNotes?: string;
    skillTargeted?: string;
    parentFeedback?: string;
    educatorFeedback?: string;
    student: {
        id: string;
        fullName: string;
        grade: string;
    };
    createdAt: string;
}

const PAGE_SIZE = 10;
const itemsPerPage = 10;

export default function EducatorHomeworkPage() {
    const { toast } = useToast();
    const { t } = useTranslation('educator');
    const queryClient = useQueryClient();

    const [showAssignModal, setShowAssignModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showStudentModal, setShowStudentModal] = useState(false);
    const [selectedHomework, setSelectedHomework] = useState<Homework | null>(null);

    // File upload state
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [homeworkFiles, setHomeworkFiles] = useState<Array<{ name: string; url: string; key: string }>>([]);
    const [isLoadingFiles, setIsLoadingFiles] = useState(false);
    const [isUploadingFiles, setIsUploadingFiles] = useState(false);

    // Student search and pagination
    const [searchTerm, setSearchTerm] = useState('');
    const [gradeFilter, setGradeFilter] = useState<string>('all');
    const [currentPage, setCurrentPage] = useState(1);

    const [formData, setFormData] = useState({
        studentId: '',
        subject: 'READING',
        title: '',
        instructions: '',
        dueDate: null as Date | null,
        additionalNotes: '',
        estimatedTime: '',
        skillTargeted: ''
    });

    // Fetch homework using React Query
    const { data: homeworkData, isLoading: isLoadingHomework } = useQuery({
        queryKey: ['educator-homework'],
        queryFn: () => apiClient.getHomeworkByEducator()
    });

    // Fetch students using React Query
    const { data: studentsResponse, isLoading: isLoadingStudents } = useQuery({
        queryKey: ['educator-students'],
        queryFn: () => apiClient.getAssignedStudents()
    });

    // Assign homework mutation
    const assignHomeworkMutation = useMutation({
        onSuccess: async (createdHomework) => {
            // Upload files if any are selected
            if (selectedFiles.length > 0) {
                setIsUploadingFiles(true);
                try {
                    await apiClient.uploadHomeworkFiles(createdHomework.id, selectedFiles);
                    toast({
                        title: 'Success',
                        description: t('homework.assignedSuccess'),
                    });
                } catch (error: any) {
                    toast({
                        title: 'Warning',
                        description: t('homework.assignFailed') + ': ' + (error.message || 'Unknown error'),
                        variant: 'destructive'
                    });
                } finally {
                    setIsUploadingFiles(false);
                }
            } else {
                toast({
                    title: 'Success',
                    description: t('homework.assignedSuccess'),
                });
            }

            queryClient.invalidateQueries({ queryKey: ['educator-homework'] });
            setShowAssignModal(false);
            setSelectedFiles([]);
            setFormData({
                studentId: '',
                subject: 'READING',
                title: '',
                instructions: '',
                dueDate: null,
                additionalNotes: '',
                estimatedTime: '',
                skillTargeted: ''
            });
        },
        mutationFn: (homeworkData: any) => apiClient.createHomework(homeworkData),
        onError: (error: any) => {
            toast({
                title: 'Error',
                description: error.response?.data?.error || error.message || t('homework.assignFailed'),
                variant: 'destructive'
            });
        }
    });

    const handleAssignHomework = (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.dueDate) {
            toast({
                title: t('students.validationError'),
                description: t('homework.dueDatePlaceholder'),
                variant: 'destructive'
            });
            return;
        }

        assignHomeworkMutation.mutate({
            ...formData,
            dueDate: formData.dueDate.toISOString(),
            estimatedTime: formData.estimatedTime ? parseInt(formData.estimatedTime) : undefined
        });
    };

    const handleViewHomework = async (hw: Homework) => {
        setSelectedHomework(hw);
        setShowDetailModal(true);

        // Fetch files for this homework
        setIsLoadingFiles(true);
        try {
            const files = await apiClient.getHomeworkFiles(hw.id);
            setHomeworkFiles(files.map(f => ({ name: f.fileName, url: f.url, key: f.key })));
        } catch (error) {
            console.error('Error loading files:', error);
            setHomeworkFiles([]);
        } finally {
            setIsLoadingFiles(false);
        }
    };

    const handleDeleteFile = async (fileKey: string) => {
        if (!selectedHomework) return;

        try {
            await apiClient.deleteHomeworkFile(selectedHomework.id, fileKey);
            setHomeworkFiles(prev => prev.filter(f => f.key !== fileKey));
            queryClient.invalidateQueries({ queryKey: ['educator-homework'] });
            toast({
                title: 'Success',
                description: 'File deleted successfully',
            });
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to delete file',
                variant: 'destructive'
            });
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ASSIGNED': return 'bg-primary/10 text-primary';
            case 'IN_PROGRESS': return 'bg-warning/10 text-foreground';
            case 'SUBMITTED': return 'bg-success/10 text-foreground';
            case 'REVIEWED': return 'bg-info/10 text-foreground';
            case 'COMPLETED': return 'bg-muted text-foreground';
            default: return 'bg-muted text-foreground';
        }
    };

    const homework = homeworkData?.homework || [];
    const students = studentsResponse?.data || [];

    // Filter students
    const filteredStudents = students.filter((student: Student) => {
        const matchesSearch = student.fullName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesGrade = gradeFilter === 'all' || student.grade.toString() === gradeFilter;
        return matchesSearch && matchesGrade;
    });

    // Pagination
    const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedStudents = filteredStudents.slice(startIndex, startIndex + itemsPerPage);

    const handleStudentSelect = (studentId: string) => {
        setFormData({ ...formData, studentId });
        setShowStudentModal(false);
    };

    const selectedStudent = students.find((s: Student) => s.id === formData.studentId);

    if (isLoadingHomework || isLoadingStudents) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <PageWrapper
            title={t('homework.title')}
            description={t('homework.subtitle')}
            breadcrumbs={[{ label: t('homework.breadcrumb') }]}
            actions={
                <Button onClick={() => setShowAssignModal(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    {t('homework.assignHomework')}
                </Button>
            }
        >

            {/* Homework List */}
            <Card>
                <CardHeader>
                    <CardTitle>{t('homework.title')}</CardTitle>
                </CardHeader>
                <CardContent>
                    {homework.length === 0 ? (
                        <div className="text-center py-12">
                            <ClipboardList className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-xl font-medium text-foreground mb-2">{t('homework.noHomework')}</h3>
                            <Button onClick={() => setShowAssignModal(true)}>
                                <Plus className="h-5 w-5 mr-2" />
                                {t('homework.assignHomework')}
                            </Button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-muted/40">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                            {t('students.tableStudent')}
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                            {t('homework.homeworkTitle')}
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                            {t('homework.subject')}
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                            {t('homework.dueDate')}
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                            {t('students.tableStatus')}
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-background divide-y divide-gray-200">
                                    {homework.map((hw: Homework) => (
                                        <tr key={hw.id} className="hover:bg-muted/40">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-foreground">{hw.student.fullName}</div>
                                                <div className="text-sm text-muted-foreground">Grade {hw.student.grade}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-foreground">{hw.title}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-foreground">{hw.subject}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-foreground">
                                                    {new Date(hw.dueDate).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <Badge className={getStatusColor(hw.status)}>
                                                    {hw.status.replace('_', ' ')}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleViewHomework(hw)}
                                                >
                                                    <Eye className="h-4 w-4 mr-1" />
                                                    {t('students.view')}
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Assign Homework Modal */}
            <Dialog open={showAssignModal} onOpenChange={setShowAssignModal}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{t('homework.assignHomework')}</DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleAssignHomework} className="space-y-4">
                        {/* Student Selection */}
                        <div>
                          <Label>{t('homework.student')} *</Label>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShowStudentModal(true)}
                                className="w-full justify-start text-left font-normal"
                            >
                                {selectedStudent ? (
                                    <div>
                                        <div className="font-medium">{selectedStudent.fullName}</div>
                                        <div className="text-sm text-muted-foreground">Grade {selectedStudent.grade}</div>
                                    </div>
                                ) : (
                                    <span className="text-muted-foreground">{t('homework.selectStudentPrompt')}</span>
                                )}
                            </Button>
                        </div>

                        {/* Subject */}
                        <div>
                          <Label>{t('homework.subject')} *</Label>
                            <Select
                                value={formData.subject}
                                onValueChange={(value) => setFormData({ ...formData, subject: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder={t('homework.selectSubject')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="READING">{t('homework.reading')}</SelectItem>
                                    <SelectItem value="WRITING">{t('homework.writing')}</SelectItem>
                                    <SelectItem value="MATH">{t('homework.math')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Title */}
                        <div>
                          <Label>{t('homework.homeworkTitle')} *</Label>
                            <Input
                                required
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder={t('homework.homeworkTitlePlaceholder')}
                            />
                        </div>

                        {/* Instructions */}
                        <div>
                          <Label>{t('homework.instructions')} *</Label>
                            <Textarea
                                required
                                value={formData.instructions}
                                onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                                rows={4}
                                placeholder={t('homework.instructionsPlaceholder')}
                            />
                        </div>

                        {/* Due Date and Estimated Time - Aligned */}
                        <div className="grid grid-cols-2 gap-4">
                            <ProfessionalDatePicker
                                label={t('homework.dueDate')}
                                value={formData.dueDate}
                                onChange={(date) => setFormData({ ...formData, dueDate: date })}
                                required
                                placeholder={t('homework.dueDatePlaceholder')}
                            />
                            <div>
                                <Label>{t('homework.estimatedTime')}</Label>
                                <Input
                                    type="number"
                                    value={formData.estimatedTime}
                                    onChange={(e) => setFormData({ ...formData, estimatedTime: e.target.value })}
                                    placeholder={t('homework.estimatedTimePlaceholder')}
                                    className="mt-2"
                                />
                            </div>
                        </div>

                        {/* Skill Targeted */}
                        <div>
                          <Label>{t('homework.skillTargeted')}</Label>
                            <Input
                                value={formData.skillTargeted}
                                onChange={(e) => setFormData({ ...formData, skillTargeted: e.target.value })}
                                placeholder={t('homework.skillTargetedPlaceholder')}
                            />
                        </div>

                        {/* Additional Notes */}
                        <div>
                          <Label>{t('homework.additionalNotes')}</Label>
                            <Textarea
                                value={formData.additionalNotes}
                                onChange={(e) => setFormData({ ...formData, additionalNotes: e.target.value })}
                                rows={3}
                                placeholder={t('homework.additionalNotesPlaceholder')}
                            />
                        </div>

                        {/* File Upload */}
                        <div>
                          <Label>{t('homework.attachFiles')}</Label>
                            <FileUpload
                                onFilesSelected={setSelectedFiles}
                                maxFiles={5}
                                maxSizeInMB={10}
                                acceptedTypes={['.pdf', '.doc', '.docx']}
                                disabled={isUploadingFiles}
                            />
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-3 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShowAssignModal(false)}
                                className="flex-1"
                            >
                                {t('homework.cancel')}
                            </Button>
                            <Button
                                type="submit"
                                disabled={assignHomeworkMutation.isPending || isUploadingFiles || !formData.studentId || !formData.dueDate}
                                className="flex-1"
                            >
                                {assignHomeworkMutation.isPending || isUploadingFiles ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        {isUploadingFiles ? t('homework.uploadingFiles') : t('homework.assigning')}
                                    </>
                                ) : (
                                    t('homework.assignHomeworkBtn')
                                )}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Student Selection Modal */}
            <Dialog open={showStudentModal} onOpenChange={setShowStudentModal}>
                <DialogContent className="max-w-4xl max-h-[80vh]">
                    <DialogHeader>
                        <DialogTitle>{t('homework.selectStudentHeader')}</DialogTitle>
                    </DialogHeader>

                    {/* Search and Filter */}
                    <div className="space-y-4">
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <Input
                                    placeholder={t('students.searchByName')}
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                />
                            </div>
                            <Select
                                value={gradeFilter}
                                onValueChange={(value) => {
                                    setGradeFilter(value);
                                    setCurrentPage(1);
                                }}
                            >
                                <SelectTrigger className="w-[150px]">
                                    <SelectValue placeholder="All Grades" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Grades</SelectItem>
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((grade) => (
                                        <SelectItem key={grade} value={grade.toString()}>
                                            Grade {grade}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Student List */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto">
                            {paginatedStudents.map((student: Student) => (
                                <Card
                                    key={student.id}
                                    className={`cursor-pointer transition-all hover:shadow-md ${formData.studentId === student.id
                                        ? 'border-2 border-blue-500 bg-primary/10'
                                        : 'border hover:border-border'
                                        }`}
                                    onClick={() => handleStudentSelect(student.id)}
                                >
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="font-medium text-foreground">{student.fullName}</h3>
                                                <p className="text-sm text-muted-foreground">
                                                    <GradeDisplay grade={student.grade} /> • {t('students.yrs')} {student.age}
                                                </p>
                                            </div>
                                            {formData.studentId === student.id && (
                                                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between pt-4 border-t">
                                <div className="text-sm text-muted-foreground">
                                    Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredStudents.length)} of{' '}
                                    {filteredStudents.length} students
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                        disabled={currentPage === 1}
                                    >
                                        {t('students.previous')}
                                    </Button>
                                    <span className="text-sm text-muted-foreground">
                                        {t('students.pageOf', { current: currentPage, total: totalPages })}
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                        disabled={currentPage === totalPages}
                                    >
                                        {t('students.next')}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Homework Detail Modal */}
            <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    {selectedHomework && (
                        <>
                            <DialogHeader className="border-b pb-4 pr-10">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <DialogTitle className="text-2xl pr-2">{selectedHomework.title}</DialogTitle>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            Assigned on {new Date(selectedHomework.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <Badge className={`${getStatusColor(selectedHomework.status)} px-3 py-1 text-sm flex-shrink-0`}>
                                        {selectedHomework.status.replace('_', ' ')}
                                    </Badge>
                                </div>
                            </DialogHeader>

                            <div className="space-y-6 pt-4">
                                {/* Basic Information Section */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold text-foreground border-b pb-2">Basic Information</h3>
                                    <div className="grid grid-cols-3 gap-6">
                                        <div>
                                            <Label className="text-muted-foreground text-xs uppercase tracking-wide">Student</Label>
                                            <p className="font-medium text-foreground mt-1">{selectedHomework.student.fullName}</p>
                                            <p className="text-sm text-muted-foreground mt-0.5">Grade {selectedHomework.student.grade}</p>
                                        </div>
                                        <div>
                                            <Label className="text-muted-foreground text-xs uppercase tracking-wide">Subject</Label>
                                            <p className="font-medium text-foreground mt-1">{selectedHomework.subject}</p>
                                        </div>
                                        <div>
                                            <Label className="text-muted-foreground text-xs uppercase tracking-wide">Due Date</Label>
                                            <p className="font-medium text-foreground mt-1">
                                                {new Date(selectedHomework.dueDate).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div>
                                            <Label className="text-muted-foreground text-xs uppercase tracking-wide">Estimated Time</Label>
                                            <p className="font-medium text-foreground mt-1">
                                                {selectedHomework.estimatedTime ? `${selectedHomework.estimatedTime} minutes` : 'Not specified'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Instructions Section */}
                                <div className="space-y-3">
                                    <h3 className="text-lg font-semibold text-foreground border-b pb-2">Instructions</h3>
                                    <Card className="bg-muted/40 border-border">
                                        <CardContent className="p-4">
                                            <p className="text-sm text-foreground leading-relaxed">{selectedHomework.instructions}</p>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Skill Targeted */}
                                {selectedHomework.skillTargeted && (
                                    <div className="space-y-3">
                                        <h3 className="text-lg font-semibold text-foreground border-b pb-2">Skill Targeted</h3>
                                        <Card className="bg-primary/10 border-primary/20">
                                            <CardContent className="p-4">
                                                <p className="text-sm text-blue-900 font-medium">{selectedHomework.skillTargeted}</p>
                                            </CardContent>
                                        </Card>
                                    </div>
                                )}

                                {/* Additional Notes */}
                                {selectedHomework.additionalNotes && (
                                    <div className="space-y-3">
                                        <h3 className="text-lg font-semibold text-foreground border-b pb-2">Additional Notes</h3>
                                        <Card className="bg-warning/10 border-warning/20">
                                            <CardContent className="p-4">
                                                <p className="text-sm text-foreground">{selectedHomework.additionalNotes}</p>
                                            </CardContent>
                                        </Card>
                                    </div>
                                )}

                                {/* Parent Feedback */}
                                {selectedHomework.parentFeedback && (
                                    <div className="space-y-3">
                                        <h3 className="text-lg font-semibold text-foreground border-b pb-2">Parent Feedback</h3>
                                        <Card className="bg-success/10 border-success/20">
                                            <CardContent className="p-4">
                                                <p className="text-sm text-foreground">{selectedHomework.parentFeedback}</p>
                                            </CardContent>
                                        </Card>
                                    </div>
                                )}

                                {/* Educator Feedback */}
                                {selectedHomework.educatorFeedback && (
                                    <div className="space-y-3">
                                        <h3 className="text-lg font-semibold text-foreground border-b pb-2">Your Feedback</h3>
                                        <Card className="bg-info/10 border-purple-200">
                                            <CardContent className="p-4">
                                                <p className="text-sm text-foreground">{selectedHomework.educatorFeedback}</p>
                                            </CardContent>
                                        </Card>
                                    </div>
                                )}

                                {/* Attached Files */}
                                {homeworkFiles.length > 0 && (
                                    <div className="space-y-3">
                                        <h3 className="text-lg font-semibold text-foreground border-b pb-2">Attached Files</h3>
                                        <FileViewer
                                            files={homeworkFiles}
                                            isLoading={isLoadingFiles}
                                        />
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </PageWrapper>
    );
}
