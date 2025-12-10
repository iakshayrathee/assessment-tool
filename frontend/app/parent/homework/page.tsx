'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
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
            case 'ASSIGNED': return 'bg-blue-100 text-blue-800';
            case 'IN_PROGRESS': return 'bg-yellow-100 text-yellow-800';
            case 'SUBMITTED': return 'bg-green-100 text-green-800';
            case 'REVIEWED': return 'bg-purple-100 text-purple-800';
            case 'COMPLETED': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
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
                    <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600">Loading homework...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">My Children's Homework</h1>
                <p className="text-gray-600">View and submit homework assignments</p>
            </div>

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
                        <Clock className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">{stats.pending}</div>
                        <p className="text-xs text-muted-foreground">Awaiting submission</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Submitted</CardTitle>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{stats.submitted}</div>
                        <p className="text-xs text-muted-foreground">Awaiting review</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Reviewed</CardTitle>
                        <FileText className="h-4 w-4 text-purple-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-purple-600">{stats.reviewed}</div>
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
                            <ClipboardList className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-xl font-medium text-gray-900 mb-2">No homework assigned yet</h3>
                            <p className="text-gray-500">Homework assignments will appear here when assigned by the educator</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Child
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Title
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Subject
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Due Date
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Educator
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {homework.map((hw: Homework) => (
                                        <tr
                                            key={hw.id}
                                            className={`hover:bg-gray-50 ${isOverdue(hw.dueDate, hw.status) ? 'bg-red-50' : ''}`}
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">{hw.student.fullName}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-900">{hw.title}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">{hw.subject}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">
                                                    {new Date(hw.dueDate).toLocaleDateString()}
                                                </div>
                                                {isOverdue(hw.dueDate, hw.status) && (
                                                    <div className="text-xs text-red-600 font-medium">Overdue</div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">{hw.specialEducator.fullName}</div>
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
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    {selectedHomework && (
                        <>
                            <DialogHeader>
                                <DialogTitle>{selectedHomework.title}</DialogTitle>
                            </DialogHeader>

                            <div className="space-y-4">
                                {/* Homework Info */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-gray-600">Child</Label>
                                        <p className="font-medium">{selectedHomework.student.fullName}</p>
                                    </div>
                                    <div>
                                        <Label className="text-gray-600">Subject</Label>
                                        <p className="font-medium">{selectedHomework.subject}</p>
                                    </div>
                                    <div>
                                        <Label className="text-gray-600">Due Date</Label>
                                        <p className="font-medium">
                                            {new Date(selectedHomework.dueDate).toLocaleDateString()}
                                        </p>
                                        {isOverdue(selectedHomework.dueDate, selectedHomework.status) && (
                                            <p className="text-sm text-red-600 font-medium">Overdue</p>
                                        )}
                                    </div>
                                    <div>
                                        <Label className="text-gray-600">Estimated Time</Label>
                                        <p className="font-medium">
                                            {selectedHomework.estimatedTime ? `${selectedHomework.estimatedTime} minutes` : 'Not specified'}
                                        </p>
                                    </div>
                                    <div>
                                        <Label className="text-gray-600">Status</Label>
                                        <Badge className={getStatusColor(selectedHomework.status)}>
                                            {selectedHomework.status.replace('_', ' ')}
                                        </Badge>
                                    </div>
                                    <div>
                                        <Label className="text-gray-600">Educator</Label>
                                        <p className="font-medium">{selectedHomework.specialEducator.fullName}</p>
                                    </div>
                                </div>

                                {/* Instructions */}
                                <div>
                                    <Label className="text-gray-600">Instructions</Label>
                                    <Card className="mt-1">
                                        <CardContent className="p-3">
                                            <p className="text-sm">{selectedHomework.instructions}</p>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Skill Targeted */}
                                {selectedHomework.skillTargeted && (
                                    <div>
                                        <Label className="text-gray-600">Skill Targeted</Label>
                                        <Card className="mt-1 bg-blue-50">
                                            <CardContent className="p-3">
                                                <p className="text-sm text-blue-900">{selectedHomework.skillTargeted}</p>
                                            </CardContent>
                                        </Card>
                                    </div>
                                )}

                                {/* Additional Notes */}
                                {selectedHomework.additionalNotes && (
                                    <div>
                                        <Label className="text-gray-600">Additional Notes from Educator</Label>
                                        <Card className="mt-1 bg-yellow-50">
                                            <CardContent className="p-3">
                                                <p className="text-sm">{selectedHomework.additionalNotes}</p>
                                            </CardContent>
                                        </Card>
                                    </div>
                                )}

                                {/* Attached Files */}
                                <div>
                                    <FileViewer
                                        files={homeworkFiles}
                                        isLoading={isLoadingFiles}
                                    />
                                </div>

                                {/* Feedback Section */}
                                {selectedHomework.status === 'ASSIGNED' || selectedHomework.status === 'IN_PROGRESS' ? (
                                    <div>
                                        <Label>Your Feedback (Optional)</Label>
                                        <Textarea
                                            value={feedback}
                                            onChange={(e) => setFeedback(e.target.value)}
                                            rows={4}
                                            placeholder="Add any comments or notes about the homework completion..."
                                            className="mt-1"
                                        />
                                        <Button
                                            onClick={handleSubmitHomework}
                                            disabled={submitHomeworkMutation.isPending}
                                            className="mt-3 w-full"
                                        >
                                            {submitHomeworkMutation.isPending ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                    Submitting...
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircle className="h-4 w-4 mr-2" />
                                                    Mark as Submitted
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                ) : (
                                    <>
                                        {/* Submitted Feedback */}
                                        {selectedHomework.parentFeedback && (
                                            <div>
                                                <Label className="text-gray-600">Your Feedback</Label>
                                                <Card className="mt-1 bg-green-50">
                                                    <CardContent className="p-3">
                                                        <p className="text-sm">{selectedHomework.parentFeedback}</p>
                                                    </CardContent>
                                                </Card>
                                            </div>
                                        )}

                                        {/* Educator Feedback */}
                                        {selectedHomework.educatorFeedback && (
                                            <div>
                                                <Label className="text-gray-600">Educator's Feedback</Label>
                                                <Card className="mt-1 bg-purple-50">
                                                    <CardContent className="p-3">
                                                        <p className="text-sm">{selectedHomework.educatorFeedback}</p>
                                                    </CardContent>
                                                </Card>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
