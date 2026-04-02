'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ClipboardList, Loader2, Eye, CheckCircle, Clock, FileText } from 'lucide-react';
import { FileViewer } from '@/components/ui/file-viewer';

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
        fullName: string;
    };
    specialEducator: {
        fullName: string;
    };
    createdAt: string;
}

export default function ParentHomeworkPage() {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedHomework, setSelectedHomework] = useState<Homework | null>(null);
    const [feedback, setFeedback] = useState('');

    // File state
    const [homeworkFiles, setHomeworkFiles] = useState<Array<{ name: string; url: string; key: string }>>([]);
    const [isLoadingFiles, setIsLoadingFiles] = useState(false);

    // Fetch homework using React Query
    const { data: homeworkData, isLoading } = useQuery({
        queryKey: ['parent-homework'],
        queryFn: () => apiClient.getHomeworkByParent()
    });

    // Submit homework mutation
    const submitHomeworkMutation = useMutation({
        mutationFn: ({ id, parentFeedback }: { id: string; parentFeedback?: string }) =>
            apiClient.submitHomework(id, parentFeedback),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['parent-homework'] });
            setShowDetailModal(false);
            setFeedback('');
            toast({
                title: 'Success',
                description: 'Homework submitted successfully! Educator has been notified.',
            });
        },
        onError: (error: any) => {
            toast({
                title: 'Error',
                description: error.response?.data?.error || error.message || 'Failed to submit homework',
                variant: 'destructive'
            });
        }
    });

    const handleViewHomework = async (hw: Homework) => {
        setSelectedHomework(hw);
        setFeedback(hw.parentFeedback || '');
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

    const handleSubmitHomework = () => {
        if (!selectedHomework) return;

        submitHomeworkMutation.mutate({
            id: selectedHomework.id,
            parentFeedback: feedback || undefined
        });
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

    const isOverdue = (dueDate: string, status: string) => {
        return new Date(dueDate) < new Date() && status === 'ASSIGNED';
    };

    const homework = homeworkData?.homework || [];

    const stats = {
        total: homework.length,
        pending: homework.filter((hw: Homework) => hw.status === 'ASSIGNED').length,
        submitted: homework.filter((hw: Homework) => hw.status === 'SUBMITTED').length,
        reviewed: homework.filter((hw: Homework) => hw.status === 'REVIEWED').length
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading homework...</p>
                </div>
            </div>
        );
    }

    return (
        <PageWrapper
            title="My Children's Homework"
            description="View and submit homework assignments"
            breadcrumbs={[{ label: 'Parent' }, { label: 'Homework' }]}
        >

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Homework</CardTitle>
                        <ClipboardList className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total}</div>
                        <p className="text-xs text-muted-foreground">All assignments</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending</CardTitle>
                        <Clock className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-primary">{stats.pending}</div>
                        <p className="text-xs text-muted-foreground">Awaiting submission</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Submitted</CardTitle>
                        <CheckCircle className="h-4 w-4 text-success" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-success">{stats.submitted}</div>
                        <p className="text-xs text-muted-foreground">Awaiting review</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Reviewed</CardTitle>
                        <FileText className="h-4 w-4 text-info" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-info">{stats.reviewed}</div>
                        <p className="text-xs text-muted-foreground">With feedback</p>
                    </CardContent>
                </Card>
            </div>

            {/* Homework List */}
            <Card>
                <CardHeader>
                    <CardTitle>Homework Assignments</CardTitle>
                </CardHeader>
                <CardContent>
                    {homework.length === 0 ? (
                        <div className="text-center py-12">
                            <ClipboardList className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-xl font-medium text-foreground mb-2">No homework assigned yet</h3>
                            <p className="text-muted-foreground">Homework assignments will appear here when assigned by the educator</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-muted/40">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                            Child
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                            Title
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                            Subject
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                            Due Date
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                            Educator
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-background divide-y divide-gray-200">
                                    {homework.map((hw: Homework) => (
                                        <tr
                                            key={hw.id}
                                            className={`hover:bg-muted/40 ${isOverdue(hw.dueDate, hw.status) ? 'bg-destructive/10' : ''}`}
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-foreground">{hw.student.fullName}</div>
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
                                                {isOverdue(hw.dueDate, hw.status) && (
                                                    <div className="text-xs text-destructive font-medium">Overdue</div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-foreground">{hw.specialEducator.fullName}</div>
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
                                                    View
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
                                            <Label className="text-muted-foreground text-xs uppercase tracking-wide">Child</Label>
                                            <p className="font-medium text-foreground mt-1">{selectedHomework.student.fullName}</p>
                                        </div>
                                        <div>
                                            <Label className="text-muted-foreground text-xs uppercase tracking-wide">Subject</Label>
                                            <p className="font-medium text-foreground mt-1">{selectedHomework.subject}</p>
                                        </div>
                                        <div>
                                            <Label className="text-muted-foreground text-xs uppercase tracking-wide">Educator</Label>
                                            <p className="font-medium text-foreground mt-1">{selectedHomework.specialEducator.fullName}</p>
                                        </div>
                                        <div>
                                            <Label className="text-muted-foreground text-xs uppercase tracking-wide">Due Date</Label>
                                            <p className="font-medium text-foreground mt-1">
                                                {new Date(selectedHomework.dueDate).toLocaleDateString()}
                                            </p>
                                            {isOverdue(selectedHomework.dueDate, selectedHomework.status) && (
                                                <p className="text-sm text-destructive font-medium mt-1">⚠ Overdue</p>
                                            )}
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
                                        <h3 className="text-lg font-semibold text-foreground border-b pb-2">Additional Notes from Educator</h3>
                                        <Card className="bg-warning/10 border-warning/20">
                                            <CardContent className="p-4">
                                                <p className="text-sm text-foreground">{selectedHomework.additionalNotes}</p>
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

                                {/* Feedback Section */}
                                {selectedHomework.status === 'ASSIGNED' || selectedHomework.status === 'IN_PROGRESS' ? (
                                    <div className="space-y-3 bg-gradient-to-br from-primary/5 to-primary/10 p-6 rounded-lg border-2 border-primary/20">
                                        <h3 className="text-lg font-semibold text-foreground">Submit Homework</h3>
                                        <div>
                                            <Label className="text-foreground font-medium">Your Feedback (Optional)</Label>
                                            <Textarea
                                                value={feedback}
                                                onChange={(e) => setFeedback(e.target.value)}
                                                rows={4}
                                                placeholder="Add any comments or notes about the homework completion..."
                                                className="mt-2 bg-background"
                                            />
                                        </div>
                                        <Button
                                            onClick={handleSubmitHomework}
                                            disabled={submitHomeworkMutation.isPending}
                                            className="w-full h-12 text-base font-medium"
                                            size="lg"
                                        >
                                            {submitHomeworkMutation.isPending ? (
                                                <>
                                                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                                    Submitting...
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircle className="h-5 w-5 mr-2" />
                                                    Mark as Submitted
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {/* Submitted Feedback */}
                                        {selectedHomework.parentFeedback && (
                                            <div className="space-y-3">
                                                <h3 className="text-lg font-semibold text-foreground border-b pb-2">Your Feedback</h3>
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
                                                <h3 className="text-lg font-semibold text-foreground border-b pb-2">Educator's Feedback</h3>
                                                <Card className="bg-info/10 border-purple-200">
                                                    <CardContent className="p-4">
                                                        <p className="text-sm text-foreground">{selectedHomework.educatorFeedback}</p>
                                                    </CardContent>
                                                </Card>
                                            </div>
                                        )}
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
