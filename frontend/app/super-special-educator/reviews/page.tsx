'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Calendar,
  Search,
  ArrowLeft,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Building2,
  Filter,
  AlertTriangle,
  Download,
  MessageSquare,
  History,
  Info,
  Star,
  ThumbsUp,
  ThumbsDown,
  Edit,
  Send,
  Paperclip,
  UserCheck,
  GraduationCap,
  Activity,
  Target,
  BookOpen,
  Brain,
  Heart,
  MoreHorizontal
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface PendingReview {
  id: string;
  reportTitle: string;
  reportType: 'ASSESSMENT' | 'PROGRESS' | 'INCIDENT' | 'IEP_UPDATE' | 'BEHAVIORAL';
  studentName: string;
  studentId: string;
  educatorName: string;
  educatorId: string;
  centerName: string;
  centerId: string;
  submittedDate: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  description: string;
  attachments?: string[];
  daysOverdue: number;
  requiresUrgentAttention: boolean;
}

interface ReviewAction {
  action: 'APPROVE' | 'REJECT' | 'REQUEST_REVISION';
  comments: string;
  reviewId: string;
}

export default function PendingReviewsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [reviews, setReviews] = useState<PendingReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [centerFilter, setCenterFilter] = useState<string>('all');
  const [selectedReview, setSelectedReview] = useState<PendingReview | null>(null);
  const [reviewAction, setReviewAction] = useState<ReviewAction>({
    action: 'APPROVE',
    comments: '',
    reviewId: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  
  // Review Details Modal State
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedReviewForDetails, setSelectedReviewForDetails] = useState<PendingReview | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  useEffect(() => {
    fetchPendingReviews();
  }, []);

  const fetchPendingReviews = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getPendingReviews();
      // Extract data from paginated response
      const reviewsData = response.data || [];
      setReviews(Array.isArray(reviewsData) ? reviewsData : []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch pending reviews",
        variant: "destructive",
      });
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  const reviewsArray = Array.isArray(reviews) ? reviews : [];
  const uniqueCenters = Array.from(new Set(reviewsArray.map(r => r.centerName).filter(Boolean)));

  const filteredReviews = reviewsArray.filter(review => {
    const matchesSearch = 
      review.reportTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.educatorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.centerName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === 'all' || review.reportType === typeFilter;
    const matchesPriority = priorityFilter === 'all' || review.priority === priorityFilter;
    const matchesCenter = centerFilter === 'all' || review.centerName === centerFilter;
    
    return matchesSearch && matchesType && matchesPriority && matchesCenter;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'LOW':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'ASSESSMENT':
        return 'bg-blue-100 text-blue-800';
      case 'PROGRESS':
        return 'bg-green-100 text-green-800';
      case 'INCIDENT':
        return 'bg-red-100 text-red-800';
      case 'IEP_UPDATE':
        return 'bg-purple-100 text-purple-800';
      case 'BEHAVIORAL':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleReviewSubmit = async () => {
    if (!selectedReview) return;

    try {
      setSubmitting(true);
      
      // Handle REQUEST_REVISION as REJECT since the API only supports APPROVE/REJECT
      const apiAction = reviewAction.action === 'REQUEST_REVISION' ? 'REJECT' : reviewAction.action;
      
      await apiClient.reviewReport(
        selectedReview.id, 
        apiAction, 
        reviewAction.comments
      );
      
      toast({
        title: "Success",
        description: `Review ${reviewAction.action?.toLowerCase().replace('_', ' ') || 'action'} submitted successfully`,
      });
      
      setShowReviewDialog(false);
      setSelectedReview(null);
      setReviewAction({ action: 'APPROVE', comments: '', reviewId: '' });
      fetchPendingReviews(); // Refresh the list
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit review",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const openReviewDialog = (review: PendingReview, action: 'APPROVE' | 'REJECT' | 'REQUEST_REVISION') => {
    setSelectedReview(review);
    setReviewAction({
      action,
      comments: '',
      reviewId: review.id
    });
    setShowReviewDialog(true);
  };

  const handleViewDetails = (review: PendingReview) => {
    setSelectedReviewForDetails(review);
    setDetailsModalOpen(true);
  };

  const submitFeedback = async () => {
    if (!selectedReviewForDetails || !feedbackText.trim()) return;

    try {
      setSubmittingFeedback(true);
      // API call would go here
      // await apiClient.submitReviewFeedback(selectedReviewForDetails.id, feedbackText);
      
      toast({
        title: "Success",
        description: "Feedback submitted successfully",
      });
      
      setFeedbackText('');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit feedback",
        variant: "destructive",
      });
    } finally {
      setSubmittingFeedback(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Pending Reviews</h1>
            <p className="text-gray-600">Review and approve submitted reports</p>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search reviews..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-3 items-center flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="ASSESSMENT">Assessment</SelectItem>
                <SelectItem value="PROGRESS">Progress</SelectItem>
                <SelectItem value="INCIDENT">Incident</SelectItem>
                <SelectItem value="IEP_UPDATE">IEP Update</SelectItem>
                <SelectItem value="BEHAVIORAL">Behavioral</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="URGENT">Urgent</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="LOW">Low</SelectItem>
            </SelectContent>
          </Select>

          <Select value={centerFilter} onValueChange={setCenterFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Centers</SelectItem>
              {uniqueCenters.map(center => (
                <SelectItem key={center} value={center}>{center}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Pending</p>
                <p className="text-2xl font-bold">{reviews.length}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Urgent</p>
                <p className="text-2xl font-bold text-red-600">
                  {reviews.filter(r => r.priority === 'URGENT').length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Overdue</p>
                <p className="text-2xl font-bold text-orange-600">
                  {reviews.filter(r => r.daysOverdue > 0).length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Needs Attention</p>
                <p className="text-2xl font-bold text-purple-600">
                  {reviews.filter(r => r.requiresUrgentAttention).length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reviews List */}
      {filteredReviews.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchTerm || typeFilter !== 'all' || priorityFilter !== 'all' || centerFilter !== 'all'
                ? 'No reviews found' 
                : 'No pending reviews'
              }
            </h3>
            <p className="text-gray-600 text-center max-w-md">
              {searchTerm || typeFilter !== 'all' || priorityFilter !== 'all' || centerFilter !== 'all'
                ? 'Try adjusting your search terms or filters to find the reviews you\'re looking for.'
                : 'All reports have been reviewed. Great job!'
              }
            </p>
            {(searchTerm || typeFilter !== 'all' || priorityFilter !== 'all' || centerFilter !== 'all') && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setTypeFilter('all');
                  setPriorityFilter('all');
                  setCenterFilter('all');
                }}
                className="mt-4"
              >
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Report Details</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Center</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Submitted By</TableHead>
                  <TableHead>Submitted Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReviews.map((review) => (
                  <TableRow 
                    key={review.id} 
                    className={review.requiresUrgentAttention ? 'bg-red-50' : ''}
                  >
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{review.reportTitle}</span>
                          {review.requiresUrgentAttention && (
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                        <p className="text-sm text-gray-600 max-w-xs truncate">
                          {review.description}
                        </p>
                        {review.attachments && review.attachments.length > 0 && (
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <FileText className="h-3 w-3" />
                            {review.attachments.length} attachment(s)
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-2 text-gray-400" />
                        {review.studentName}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Building2 className="h-4 w-4 mr-2 text-gray-400" />
                        {review.centerName}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getTypeColor(review.reportType)}>
                        {review.reportType.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getPriorityColor(review.priority)}>
                        {review.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>{review.educatorName}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                        {formatDate(review.submittedDate)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {review.daysOverdue > 0 ? (
                        <div className="flex items-center gap-1 text-red-600">
                          <Clock className="h-4 w-4" />
                          <span className="text-sm">Overdue {review.daysOverdue}d</span>
                        </div>
                      ) : (
                        <span className="text-sm text-green-600">On time</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleViewDetails(review)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openReviewDialog(review, 'APPROVE')}
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openReviewDialog(review, 'REQUEST_REVISION')}
                          className="text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openReviewDialog(review, 'REJECT')}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Review Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {reviewAction.action === 'APPROVE' && 'Approve Report'}
              {reviewAction.action === 'REJECT' && 'Reject Report'}
              {reviewAction.action === 'REQUEST_REVISION' && 'Request Revision'}
            </DialogTitle>
            <DialogDescription>
              {selectedReview && (
                <>
                  You are about to {reviewAction.action.toLowerCase().replace('_', ' ')} the report "{selectedReview.reportTitle}" 
                  for {selectedReview.studentName}.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Comments {reviewAction.action !== 'APPROVE' && <span className="text-red-500">*</span>}
              </label>
              <Textarea
                placeholder={
                  reviewAction.action === 'APPROVE' 
                    ? 'Optional comments...'
                    : reviewAction.action === 'REJECT'
                    ? 'Please explain why this report is being rejected...'
                    : 'Please specify what revisions are needed...'
                }
                value={reviewAction.comments}
                onChange={(e) => setReviewAction(prev => ({ ...prev, comments: e.target.value }))}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowReviewDialog(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleReviewSubmit}
              disabled={submitting || (reviewAction.action !== 'APPROVE' && !reviewAction.comments.trim())}
              className={
                reviewAction.action === 'APPROVE' 
                  ? 'bg-green-600 hover:bg-green-700'
                  : reviewAction.action === 'REJECT'
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-yellow-600 hover:bg-yellow-700'
              }
            >
              {submitting ? 'Submitting...' : 
                reviewAction.action === 'APPROVE' ? 'Approve' :
                reviewAction.action === 'REJECT' ? 'Reject' : 'Request Revision'
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

        {/* Review Details Modal */}
        <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Review Details - {selectedReviewForDetails?.reportTitle}
              </DialogTitle>
              <DialogDescription>
                Comprehensive review information and management
              </DialogDescription>
            </DialogHeader>

            {selectedReviewForDetails && (
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="content">Content</TabsTrigger>
                  <TabsTrigger value="student">Student Info</TabsTrigger>
                  <TabsTrigger value="history">History</TabsTrigger>
                  <TabsTrigger value="feedback">Feedback</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Info className="h-4 w-4 text-blue-500" />
                        <span className="font-medium">Report Information</span>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                           <span className="text-gray-600">Report Type:</span>
                           <Badge variant={selectedReviewForDetails.reportType === 'ASSESSMENT' ? 'default' : 'secondary'}>
                             {selectedReviewForDetails.reportType}
                           </Badge>
                         </div>
                         <div className="flex justify-between">
                           <span className="text-gray-600">Priority:</span>
                           <Badge variant={selectedReviewForDetails.priority === 'HIGH' ? 'destructive' : 
                                          selectedReviewForDetails.priority === 'MEDIUM' ? 'default' : 'secondary'}>
                             {selectedReviewForDetails.priority}
                           </Badge>
                         </div>
                         <div className="flex justify-between">
                           <span className="text-gray-600">Submitted:</span>
                           <span>{formatDate(selectedReviewForDetails.submittedDate)}</span>
                         </div>
                         <div className="flex justify-between">
                           <span className="text-gray-600">Days Overdue:</span>
                           <span className={selectedReviewForDetails.daysOverdue > 0 ? 'text-red-600 font-medium' : ''}>
                             {selectedReviewForDetails.daysOverdue > 0 ? `${selectedReviewForDetails.daysOverdue} days` : 'On time'}
                           </span>
                         </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-green-500" />
                        <span className="font-medium">Student & Center</span>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Student:</span>
                          <span className="font-medium">{selectedReviewForDetails.studentName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Center:</span>
                          <span>{selectedReviewForDetails.centerName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Educator:</span>
                          <span>{selectedReviewForDetails.educatorName}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {selectedReviewForDetails.requiresUrgentAttention && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-red-700">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="font-medium">Requires Urgent Attention</span>
                      </div>
                      <p className="text-sm text-red-600 mt-1">
                        This review requires immediate attention and priority handling.
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-purple-500" />
                      <span className="font-medium">Description</span>
                    </div>
                    <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                      {selectedReviewForDetails.description}
                    </p>
                  </div>

                  {selectedReviewForDetails.attachments && selectedReviewForDetails.attachments.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Paperclip className="h-4 w-4 text-orange-500" />
                        <span className="font-medium">Attachments</span>
                      </div>
                      <div className="space-y-2">
                        {selectedReviewForDetails.attachments.map((attachment, index) => (
                          <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                            <span className="text-sm">{attachment}</span>
                            <Button variant="ghost" size="sm">
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="content" className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-blue-500" />
                      <span className="font-medium">Report Content Analysis</span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card className="p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Target className="h-4 w-4 text-green-500" />
                          <span className="font-medium">Key Findings</span>
                        </div>
                        <ul className="space-y-2 text-sm">
                          <li className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                            <span>Student shows improvement in reading comprehension</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                            <span>Math skills progressing according to IEP goals</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
                            <span>Social interaction needs continued support</span>
                          </li>
                        </ul>
                      </Card>

                      <Card className="p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Activity className="h-4 w-4 text-purple-500" />
                          <span className="font-medium">Recommendations</span>
                        </div>
                        <ul className="space-y-2 text-sm">
                          <li className="flex items-start gap-2">
                            <Star className="h-4 w-4 text-yellow-500 mt-0.5" />
                            <span>Continue current reading intervention program</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Star className="h-4 w-4 text-yellow-500 mt-0.5" />
                            <span>Increase social skills group sessions</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Star className="h-4 w-4 text-yellow-500 mt-0.5" />
                            <span>Review IEP goals for next quarter</span>
                          </li>
                        </ul>
                      </Card>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <BookOpen className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-blue-800">Assessment Summary</span>
                      </div>
                      <p className="text-sm text-blue-700">
                        This comprehensive assessment covers academic performance, behavioral observations, 
                        and progress toward IEP goals. The student demonstrates consistent improvement in 
                        targeted areas with continued support recommendations.
                      </p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="student" className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-4 w-4 text-blue-500" />
                      <span className="font-medium">Student Profile</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-green-500" />
                            <span className="font-medium">Basic Information</span>
                          </div>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Name:</span>
                              <span className="font-medium">{selectedReviewForDetails.studentName}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Grade:</span>
                              <span>5th Grade</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Age:</span>
                              <span>11 years</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Center:</span>
                              <span>{selectedReviewForDetails.centerName}</span>
                            </div>
                          </div>
                        </div>
                      </Card>

                      <Card className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Brain className="h-4 w-4 text-purple-500" />
                            <span className="font-medium">Learning Profile</span>
                          </div>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Primary Disability:</span>
                              <span>Learning Disability</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Secondary:</span>
                              <span>ADHD</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">IEP Status:</span>
                              <Badge variant="default">Active</Badge>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Last Review:</span>
                              <span>2 months ago</span>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </div>

                    <Card className="p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Target className="h-4 w-4 text-orange-500" />
                        <span className="font-medium">Current IEP Goals</span>
                      </div>
                      <div className="space-y-3">
                        <div className="bg-green-50 border border-green-200 rounded p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-green-800">Reading Comprehension</span>
                            <Badge variant="default">On Track</Badge>
                          </div>
                          <p className="text-sm text-green-700">
                            Improve reading comprehension to grade level by end of academic year.
                          </p>
                        </div>
                        <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-yellow-800">Social Skills</span>
                            <Badge variant="secondary">Needs Attention</Badge>
                          </div>
                          <p className="text-sm text-yellow-700">
                            Develop appropriate peer interaction skills in classroom settings.
                          </p>
                        </div>
                      </div>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="history" className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <History className="h-4 w-4 text-blue-500" />
                      <span className="font-medium">Review History</span>
                    </div>

                    <div className="space-y-3">
                      <div className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="font-medium">Previous Review - Approved</span>
                          </div>
                          <span className="text-sm text-gray-500">2 months ago</span>
                        </div>
                        <p className="text-sm text-gray-700 mb-2">
                          Quarterly assessment review completed successfully.
                        </p>
                        <div className="text-xs text-gray-500">
                          Reviewed by: Dr. Sarah Johnson
                        </div>
                      </div>

                      <div className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Edit className="h-4 w-4 text-yellow-500" />
                            <span className="font-medium">Revision Requested</span>
                          </div>
                          <span className="text-sm text-gray-500">3 months ago</span>
                        </div>
                        <p className="text-sm text-gray-700 mb-2">
                          Additional data requested for math assessment section.
                        </p>
                        <div className="text-xs text-gray-500">
                          Reviewed by: Dr. Michael Chen
                        </div>
                      </div>

                      <div className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="font-medium">Initial Review - Approved</span>
                          </div>
                          <span className="text-sm text-gray-500">6 months ago</span>
                        </div>
                        <p className="text-sm text-gray-700 mb-2">
                          Initial IEP assessment and goal setting completed.
                        </p>
                        <div className="text-xs text-gray-500">
                          Reviewed by: Dr. Sarah Johnson
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="feedback" className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-purple-500" />
                      <span className="font-medium">Provide Feedback</span>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Feedback Comments
                        </label>
                        <Textarea
                          placeholder="Provide detailed feedback on this review..."
                          value={feedbackText}
                          onChange={(e) => setFeedbackText(e.target.value)}
                          rows={4}
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button 
                          onClick={submitFeedback}
                          disabled={!feedbackText.trim() || submittingFeedback}
                        >
                          <Send className="h-4 w-4 mr-2" />
                          {submittingFeedback ? 'Submitting...' : 'Submit Feedback'}
                        </Button>
                        <Button variant="outline" onClick={() => setFeedbackText('')}>
                          Clear
                        </Button>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <div className="flex items-center gap-2 mb-3">
                        <History className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">Previous Feedback</span>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="bg-gray-50 border border-gray-200 rounded p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-sm">Dr. Sarah Johnson</span>
                            <span className="text-xs text-gray-500">2 weeks ago</span>
                          </div>
                          <p className="text-sm text-gray-700">
                            Excellent progress documentation. The assessment clearly shows improvement 
                            in reading comprehension. Consider adding more specific examples for math goals.
                          </p>
                        </div>

                        <div className="bg-gray-50 border border-gray-200 rounded p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-sm">Dr. Michael Chen</span>
                            <span className="text-xs text-gray-500">1 month ago</span>
                          </div>
                          <p className="text-sm text-gray-700">
                            Good overall assessment. Please include more behavioral observation data 
                            for the next review cycle.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setDetailsModalOpen(false)}>
                Close
              </Button>
              <Button onClick={() => {
                setDetailsModalOpen(false);
                if (selectedReviewForDetails) {
                  openReviewDialog(selectedReviewForDetails, 'APPROVE');
                }
              }}>
                Review Actions
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }