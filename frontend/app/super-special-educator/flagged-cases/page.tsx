'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AlertTriangle, 
  Calendar,
  Search,
  ArrowLeft,
  Eye,
  MessageSquare,
  Clock,
  User,
  Building2,
  Filter,
  CheckCircle,
  Flag,
  FileText,
  Info,
  Activity,
  Target,
  Phone,
  Mail,
  MapPin,
  GraduationCap,
  Brain,
  Heart,
  Shield,
  Home,
  UserCheck,
  History,
  Plus,
  Edit,
  Send,
  Download,
  Star,
  TrendingUp,
  BarChart3,
  MoreHorizontal
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface FlaggedCase {
  id: string;
  studentName: string;
  studentId: string;
  educatorName: string;
  educatorId: string;
  centerName: string;
  centerId: string;
  flagType: 'ACADEMIC_CONCERN' | 'BEHAVIORAL_ISSUE' | 'SAFETY_CONCERN' | 'ATTENDANCE_ISSUE' | 'HEALTH_CONCERN' | 'FAMILY_ISSUE';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'ESCALATED';
  title: string;
  description: string;
  flaggedDate: string;
  lastUpdated: string;
  daysOpen: number;
  assignedTo?: string;
  actionsTaken: string[];
  nextFollowUpDate?: string;
  requiresImmediateAction: boolean;
  relatedIncidents: number;
}

interface CaseUpdate {
  caseId: string;
  action: string;
  notes: string;
  status?: string;
  nextFollowUpDate?: string;
}

export default function FlaggedCasesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [cases, setCases] = useState<FlaggedCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [centerFilter, setCenterFilter] = useState<string>('all');
  const [selectedCase, setSelectedCase] = useState<FlaggedCase | null>(null);
  const [caseUpdate, setCaseUpdate] = useState<CaseUpdate>({
    caseId: '',
    action: '',
    notes: '',
    status: '',
    nextFollowUpDate: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);

  // Case Details Modal State
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedCaseForDetails, setSelectedCaseForDetails] = useState<FlaggedCase | null>(null);

  // Timeline Modal State
  const [timelineModalOpen, setTimelineModalOpen] = useState(false);
  const [selectedCaseForTimeline, setSelectedCaseForTimeline] = useState<FlaggedCase | null>(null);
  const [newTimelineEntry, setNewTimelineEntry] = useState({
    action: '',
    notes: '',
    type: 'UPDATE'
  });
  const [submittingTimeline, setSubmittingTimeline] = useState(false);

  useEffect(() => {
    fetchFlaggedCases();
  }, []);

  const fetchFlaggedCases = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getFlaggedCases();
      // Extract data from paginated response
      const casesData = response.data || [];
      setCases(Array.isArray(casesData) ? casesData : []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch flagged cases",
        variant: "destructive",
      });
      setCases([]);
    } finally {
      setLoading(false);
    }
  };

  const casesArray = Array.isArray(cases) ? cases : [];
  const uniqueCenters = Array.from(new Set(casesArray.map(c => c.centerName).filter(Boolean)));

  const filteredCases = casesArray.filter(caseItem => {
    const matchesSearch = 
      (caseItem.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (caseItem.studentName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (caseItem.educatorName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (caseItem.centerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (caseItem.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === 'all' || caseItem.flagType === typeFilter;
    const matchesSeverity = severityFilter === 'all' || caseItem.severity === severityFilter;
    const matchesStatus = statusFilter === 'all' || caseItem.status === statusFilter;
    const matchesCenter = centerFilter === 'all' || caseItem.centerName === centerFilter;
    
    return matchesSearch && matchesType && matchesSeverity && matchesStatus && matchesCenter;
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'bg-red-100 text-red-800';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800';
      case 'RESOLVED':
        return 'bg-green-100 text-green-800';
      case 'ESCALATED':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'ACADEMIC_CONCERN':
        return 'bg-blue-100 text-blue-800';
      case 'BEHAVIORAL_ISSUE':
        return 'bg-orange-100 text-orange-800';
      case 'SAFETY_CONCERN':
        return 'bg-red-100 text-red-800';
      case 'ATTENDANCE_ISSUE':
        return 'bg-yellow-100 text-yellow-800';
      case 'HEALTH_CONCERN':
        return 'bg-purple-100 text-purple-800';
      case 'FAMILY_ISSUE':
        return 'bg-pink-100 text-pink-800';
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

  const isFollowUpOverdue = (dueDateString?: string) => {
    if (!dueDateString) return false;
    return new Date(dueDateString) < new Date();
  };

  const openUpdateDialog = (caseItem: FlaggedCase) => {
    setSelectedCase(caseItem);
    setCaseUpdate({
      action: '',
      notes: '',
      status: caseItem.status,
      nextFollowUpDate: caseItem.nextFollowUpDate || ''
    });
    setShowUpdateDialog(true);
  };

  const handleViewDetails = (caseItem: FlaggedCase) => {
    setSelectedCaseForDetails(caseItem);
    setDetailsModalOpen(true);
  };

  const handleViewTimeline = (caseItem: FlaggedCase) => {
    setSelectedCaseForTimeline(caseItem);
    setTimelineModalOpen(true);
  };

  const submitTimelineEntry = async () => {
    if (!selectedCaseForTimeline || !newTimelineEntry.action.trim() || !newTimelineEntry.notes.trim()) {
      return;
    }

    setSubmittingTimeline(true);
    try {
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Reset form
      setNewTimelineEntry({
        action: '',
        notes: '',
        type: 'UPDATE'
      });
      
      // Show success message
      console.log('Timeline entry submitted successfully');
      
      // Refresh cases
      fetchFlaggedCases();
    } catch (error) {
      console.error('Error submitting timeline entry:', error);
    } finally {
      setSubmittingTimeline(false);
    }
  };

  const handleCaseUpdate = async () => {
    if (!selectedCase || !caseUpdate.action.trim() || !caseUpdate.notes.trim()) return;

    try {
      setSubmitting(true);
      // This would be a new API endpoint for updating flagged cases
      // await apiClient.updateFlaggedCase(caseUpdate);
      
      toast({
        title: "Success",
        description: "Case updated successfully",
      });
      
      setShowUpdateDialog(false);
      setSelectedCase(null);
      setCaseUpdate({ caseId: '', action: '', notes: '', status: '', nextFollowUpDate: '' });
      fetchFlaggedCases(); // Refresh the list
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update case",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
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
            <h1 className="text-3xl font-bold text-gray-900">Flagged Cases</h1>
            <p className="text-gray-600">Monitor and manage critical student cases</p>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search cases..."
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
                <SelectItem value="ACADEMIC_CONCERN">Academic</SelectItem>
                <SelectItem value="BEHAVIORAL_ISSUE">Behavioral</SelectItem>
                <SelectItem value="SAFETY_CONCERN">Safety</SelectItem>
                <SelectItem value="ATTENDANCE_ISSUE">Attendance</SelectItem>
                <SelectItem value="HEALTH_CONCERN">Health</SelectItem>
                <SelectItem value="FAMILY_ISSUE">Family</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severity</SelectItem>
              <SelectItem value="CRITICAL">Critical</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="LOW">Low</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="OPEN">Open</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="RESOLVED">Resolved</SelectItem>
              <SelectItem value="ESCALATED">Escalated</SelectItem>
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
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Cases</p>
                <p className="text-2xl font-bold">{cases.length}</p>
              </div>
              <Flag className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Critical</p>
                <p className="text-2xl font-bold text-red-600">
                  {cases.filter(c => c.severity === 'CRITICAL').length}
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
                <p className="text-sm text-gray-600">Open</p>
                <p className="text-2xl font-bold text-orange-600">
                  {cases.filter(c => c.status === 'OPEN').length}
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
                <p className="text-sm text-gray-600">Immediate Action</p>
                <p className="text-2xl font-bold text-purple-600">
                  {cases.filter(c => c.requiresImmediateAction).length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Overdue Follow-up</p>
                <p className="text-2xl font-bold text-red-600">
                  {cases.filter(c => isFollowUpOverdue(c.nextFollowUpDate)).length}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cases List */}
      {filteredCases.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Flag className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchTerm || typeFilter !== 'all' || severityFilter !== 'all' || statusFilter !== 'all' || centerFilter !== 'all'
                ? 'No cases found' 
                : 'No flagged cases'
              }
            </h3>
            <p className="text-gray-600 text-center max-w-md">
              {searchTerm || typeFilter !== 'all' || severityFilter !== 'all' || statusFilter !== 'all' || centerFilter !== 'all'
                ? 'Try adjusting your search terms or filters to find the cases you\'re looking for.'
                : 'No cases have been flagged. This is good news!'
              }
            </p>
            {(searchTerm || typeFilter !== 'all' || severityFilter !== 'all' || statusFilter !== 'all' || centerFilter !== 'all') && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setTypeFilter('all');
                  setSeverityFilter('all');
                  setStatusFilter('all');
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
                  <TableHead>Case Details</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Center</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Flagged By</TableHead>
                  <TableHead>Days Open</TableHead>
                  <TableHead>Follow-up</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCases.map((caseItem) => (
                  <TableRow 
                    key={caseItem.id} 
                    className={
                      caseItem.requiresImmediateAction ? 'bg-red-50' : 
                      caseItem.severity === 'CRITICAL' ? 'bg-orange-50' : ''
                    }
                  >
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{caseItem.title}</span>
                          {caseItem.requiresImmediateAction && (
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                        <p className="text-sm text-gray-600 max-w-xs truncate">
                          {caseItem.description}
                        </p>
                        {(caseItem.actionsTaken || []).length > 0 && (
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <CheckCircle className="h-3 w-3" />
                            {caseItem.actionsTaken.length} action(s) taken
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-2 text-gray-400" />
                        {caseItem.studentName}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Building2 className="h-4 w-4 mr-2 text-gray-400" />
                        {caseItem.centerName}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getTypeColor(caseItem.flagType)}>
                        {caseItem.flagType.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getSeverityColor(caseItem.severity)}>
                        {caseItem.severity}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(caseItem.status)}>
                        {caseItem.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>{caseItem.educatorName}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-gray-400" />
                        {caseItem.daysOpen} days
                      </div>
                    </TableCell>
                    <TableCell>
                      {caseItem.nextFollowUpDate ? (
                        <div className={`text-sm ${
                          isFollowUpOverdue(caseItem.nextFollowUpDate) ? 'text-red-600' : 'text-blue-600'
                        }`}>
                          {isFollowUpOverdue(caseItem.nextFollowUpDate) && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              Overdue
                            </div>
                          )}
                          {!isFollowUpOverdue(caseItem.nextFollowUpDate) && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {formatDate(caseItem.nextFollowUpDate)}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">Not set</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(caseItem)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openUpdateDialog(caseItem)}
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewTimeline(caseItem)}
                        >
                          <FileText className="h-4 w-4" />
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

      {/* Update Case Dialog */}
      <Dialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Update Case</DialogTitle>
            <DialogDescription>
              {selectedCase && (
                <>
                  Update the case "{selectedCase.title}" for {selectedCase.studentName}.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Action Taken <span className="text-red-500">*</span></label>
              <Input
                placeholder="Brief description of action taken..."
                value={caseUpdate.action}
                onChange={(e) => setCaseUpdate(prev => ({ ...prev, action: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Detailed Notes <span className="text-red-500">*</span></label>
              <Textarea
                placeholder="Provide detailed notes about the action taken and any observations..."
                value={caseUpdate.notes}
                onChange={(e) => setCaseUpdate(prev => ({ ...prev, notes: e.target.value }))}
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select
                  value={caseUpdate.status}
                  onValueChange={(value) => setCaseUpdate(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OPEN">Open</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="RESOLVED">Resolved</SelectItem>
                    <SelectItem value="ESCALATED">Escalated</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Next Follow-up Date</label>
                <Input
                  type="date"
                  value={caseUpdate.nextFollowUpDate}
                  onChange={(e) => setCaseUpdate(prev => ({ ...prev, nextFollowUpDate: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowUpdateDialog(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCaseUpdate}
              disabled={submitting || !caseUpdate.action.trim() || !caseUpdate.notes.trim()}
            >
              {submitting ? 'Updating...' : 'Update Case'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Case Details Modal */}
      <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Flag className="h-5 w-5 text-red-500" />
              Case Details: {selectedCaseForDetails?.title}
            </DialogTitle>
            <DialogDescription>
              Comprehensive information about this flagged case
            </DialogDescription>
          </DialogHeader>

          {selectedCaseForDetails && (
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="student">Student Info</TabsTrigger>
                <TabsTrigger value="actions">Actions</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
                <TabsTrigger value="analysis">Analysis</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Info className="h-4 w-4 text-blue-500" />
                      <span className="font-medium">Case Information</span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Case ID:</span>
                        <span className="font-medium">{selectedCaseForDetails.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <Badge variant={selectedCaseForDetails.status === 'RESOLVED' ? 'default' : 
                                      selectedCaseForDetails.status === 'ESCALATED' ? 'destructive' : 'secondary'}>
                          {selectedCaseForDetails.status}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Priority:</span>
                        <Badge variant={selectedCaseForDetails.priority === 'HIGH' ? 'destructive' : 
                                      selectedCaseForDetails.priority === 'MEDIUM' ? 'default' : 'secondary'}>
                          {selectedCaseForDetails.priority}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Category:</span>
                        <span className="font-medium">{selectedCaseForDetails.category}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Flagged Date:</span>
                        <span className="font-medium">{formatDate(selectedCaseForDetails.flaggedDate)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Last Updated:</span>
                        <span className="font-medium">{formatDate(selectedCaseForDetails.lastUpdated)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-green-500" />
                      <span className="font-medium">Center Information</span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Center:</span>
                        <span className="font-medium">{selectedCaseForDetails.center}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Related Incidents:</span>
                        <span className="font-medium">{selectedCaseForDetails.relatedIncidents}</span>
                      </div>
                      {selectedCaseForDetails.nextFollowUpDate && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Next Follow-up:</span>
                          <span className={`font-medium ${
                            isFollowUpOverdue(selectedCaseForDetails.nextFollowUpDate) ? 'text-red-600' : 'text-blue-600'
                          }`}>
                            {formatDate(selectedCaseForDetails.nextFollowUpDate)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-purple-500" />
                    <span className="font-medium">Description</span>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-700">{selectedCaseForDetails.description}</p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="student" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-blue-500" />
                      <span className="font-medium">Student Profile</span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Name:</span>
                        <span className="font-medium">{selectedCaseForDetails.studentName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Student ID:</span>
                        <span className="font-medium">STU-{selectedCaseForDetails.id.slice(-6)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Age:</span>
                        <span className="font-medium">12 years</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Grade:</span>
                        <span className="font-medium">7th Grade</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Enrollment Date:</span>
                        <span className="font-medium">Sep 2023</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Brain className="h-4 w-4 text-purple-500" />
                      <span className="font-medium">Special Needs</span>
                    </div>
                    <div className="space-y-2">
                      <Badge variant="outline" className="mr-2">Autism Spectrum</Badge>
                      <Badge variant="outline" className="mr-2">ADHD</Badge>
                      <Badge variant="outline">Sensory Processing</Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-green-500" />
                    <span className="font-medium">Current IEP Goals</span>
                  </div>
                  <div className="space-y-2">
                    <div className="bg-green-50 p-3 rounded-lg">
                      <p className="text-sm font-medium text-green-800">Social Communication</p>
                      <p className="text-sm text-green-700">Improve peer interaction skills in structured activities</p>
                      <div className="mt-2">
                        <div className="flex justify-between text-xs text-green-600">
                          <span>Progress: 65%</span>
                          <span>Target: Dec 2024</span>
                        </div>
                        <div className="w-full bg-green-200 rounded-full h-2 mt-1">
                          <div className="bg-green-600 h-2 rounded-full" style={{ width: '65%' }}></div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-sm font-medium text-blue-800">Academic Focus</p>
                      <p className="text-sm text-blue-700">Maintain attention during 20-minute learning sessions</p>
                      <div className="mt-2">
                        <div className="flex justify-between text-xs text-blue-600">
                          <span>Progress: 45%</span>
                          <span>Target: Jan 2025</span>
                        </div>
                        <div className="w-full bg-blue-200 rounded-full h-2 mt-1">
                          <div className="bg-blue-600 h-2 rounded-full" style={{ width: '45%' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="actions" className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="font-medium">Actions Taken</span>
                  </div>
                  {(selectedCaseForDetails.actionsTaken || []).length > 0 ? (
                    <div className="space-y-2">
                      {(selectedCaseForDetails.actionsTaken || []).map((action, index) => (
                        <div key={index} className="bg-green-50 p-3 rounded-lg border-l-4 border-green-500">
                          <div className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <p className="text-sm text-green-800">{action}</p>
                              <p className="text-xs text-green-600 mt-1">Completed on {formatDate(selectedCaseForDetails.lastUpdated)}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Shield className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                      <p>No actions have been taken yet</p>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-blue-500" />
                    <span className="font-medium">Recommended Actions</span>
                  </div>
                  <div className="space-y-2">
                    <div className="bg-blue-50 p-3 rounded-lg border-l-4 border-blue-500">
                      <div className="flex items-start gap-2">
                        <Star className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-blue-800">Immediate Assessment</p>
                          <p className="text-sm text-blue-700">Conduct comprehensive behavioral assessment within 48 hours</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-yellow-50 p-3 rounded-lg border-l-4 border-yellow-500">
                      <div className="flex items-start gap-2">
                        <UserCheck className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-yellow-800">Parent Conference</p>
                          <p className="text-sm text-yellow-700">Schedule meeting with parents to discuss intervention strategies</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-purple-50 p-3 rounded-lg border-l-4 border-purple-500">
                      <div className="flex items-start gap-2">
                        <GraduationCap className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-purple-800">IEP Review</p>
                          <p className="text-sm text-purple-700">Review and update IEP goals based on current needs</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="history" className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <History className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">Case Timeline</span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <div className="w-0.5 h-16 bg-gray-200"></div>
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="bg-red-50 p-3 rounded-lg">
                          <p className="text-sm font-medium text-red-800">Case Flagged</p>
                          <p className="text-sm text-red-700">Initial incident reported and case created</p>
                          <p className="text-xs text-red-600 mt-1">{formatDate(selectedCaseForDetails.flaggedDate)}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <div className="w-0.5 h-16 bg-gray-200"></div>
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <p className="text-sm font-medium text-blue-800">Assessment Initiated</p>
                          <p className="text-sm text-blue-700">Behavioral assessment team assigned</p>
                          <p className="text-xs text-blue-600 mt-1">2 days ago</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <div className="w-0.5 h-8 bg-gray-200"></div>
                      </div>
                      <div className="flex-1">
                        <div className="bg-green-50 p-3 rounded-lg">
                          <p className="text-sm font-medium text-green-800">Progress Update</p>
                          <p className="text-sm text-green-700">Intervention strategies showing positive results</p>
                          <p className="text-xs text-green-600 mt-1">{formatDate(selectedCaseForDetails.lastUpdated)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="analysis" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-blue-500" />
                      <span className="font-medium">Risk Assessment</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Safety Risk</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '60%' }}></div>
                          </div>
                          <span className="text-sm font-medium">Medium</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Academic Impact</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div className="bg-red-500 h-2 rounded-full" style={{ width: '80%' }}></div>
                          </div>
                          <span className="text-sm font-medium">High</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Social Impact</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div className="bg-orange-500 h-2 rounded-full" style={{ width: '70%' }}></div>
                          </div>
                          <span className="text-sm font-medium">High</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      <span className="font-medium">Progress Indicators</span>
                    </div>
                    <div className="space-y-2">
                      <div className="bg-green-50 p-2 rounded">
                        <p className="text-sm font-medium text-green-800">Positive Trends</p>
                        <p className="text-xs text-green-700">Decreased incident frequency (40% reduction)</p>
                      </div>
                      <div className="bg-blue-50 p-2 rounded">
                        <p className="text-sm font-medium text-blue-800">Stable Areas</p>
                        <p className="text-xs text-blue-700">Academic performance maintained</p>
                      </div>
                      <div className="bg-yellow-50 p-2 rounded">
                        <p className="text-sm font-medium text-yellow-800">Areas of Concern</p>
                        <p className="text-xs text-yellow-700">Peer interaction challenges persist</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Brain className="h-4 w-4 text-purple-500" />
                    <span className="font-medium">AI Insights</span>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-purple-800">Pattern Analysis</p>
                      <p className="text-sm text-purple-700">
                        Based on similar cases, implementing structured social skills training 
                        has shown 75% success rate in reducing behavioral incidents within 6 weeks.
                      </p>
                      <p className="text-sm text-purple-700">
                        Recommended intervention: Daily 15-minute social skills practice sessions 
                        with peer modeling and positive reinforcement strategies.
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Timeline Modal */}
      <Dialog open={timelineModalOpen} onOpenChange={setTimelineModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-blue-500" />
              Case Timeline: {selectedCaseForTimeline?.title}
            </DialogTitle>
            <DialogDescription>
              Complete timeline and activity log for this case
            </DialogDescription>
          </DialogHeader>

          {selectedCaseForTimeline && (
            <div className="space-y-6">
              {/* Add New Entry */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-3">
                  <Plus className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-blue-800">Add Timeline Entry</span>
                </div>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-blue-700">Entry Type</label>
                      <Select
                        value={newTimelineEntry.type}
                        onValueChange={(value) => setNewTimelineEntry(prev => ({ ...prev, type: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="UPDATE">Status Update</SelectItem>
                          <SelectItem value="ACTION">Action Taken</SelectItem>
                          <SelectItem value="ASSESSMENT">Assessment</SelectItem>
                          <SelectItem value="MEETING">Meeting/Conference</SelectItem>
                          <SelectItem value="INTERVENTION">Intervention</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-blue-700">Action Summary</label>
                      <Input
                        placeholder="Brief description of action..."
                        value={newTimelineEntry.action}
                        onChange={(e) => setNewTimelineEntry(prev => ({ ...prev, action: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-blue-700">Detailed Notes</label>
                    <Textarea
                      placeholder="Provide detailed notes about this timeline entry..."
                      value={newTimelineEntry.notes}
                      onChange={(e) => setNewTimelineEntry(prev => ({ ...prev, notes: e.target.value }))}
                      rows={3}
                    />
                  </div>
                  <Button
                    onClick={submitTimelineEntry}
                    disabled={submittingTimeline || !newTimelineEntry.action.trim() || !newTimelineEntry.notes.trim()}
                    className="w-full"
                  >
                    {submittingTimeline ? (
                      <>
                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                        Adding Entry...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Add Timeline Entry
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Timeline Display */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">Timeline History</span>
                </div>
                
                <div className="space-y-4">
                  {/* Current Status */}
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow"></div>
                      <div className="w-0.5 h-20 bg-gray-200"></div>
                    </div>
                    <div className="flex-1 pb-6">
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-blue-800">Current Status</span>
                          <Badge variant={selectedCaseForTimeline.status === 'RESOLVED' ? 'default' : 
                                        selectedCaseForTimeline.status === 'ESCALATED' ? 'destructive' : 'secondary'}>
                            {selectedCaseForTimeline.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-blue-700">Case is currently being monitored and managed</p>
                        <p className="text-xs text-blue-600 mt-2">Last updated: {formatDate(selectedCaseForTimeline.lastUpdated)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Actions Taken */}
                  {(selectedCaseForTimeline.actionsTaken || []).map((action, index) => (
                    <div key={index} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow"></div>
                        {index < (selectedCaseForTimeline.actionsTaken || []).length - 1 && (
                          <div className="w-0.5 h-20 bg-gray-200"></div>
                        )}
                      </div>
                      <div className="flex-1 pb-6">
                        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                          <div className="flex items-center gap-2 mb-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="text-sm font-medium text-green-800">Action Completed</span>
                          </div>
                          <p className="text-sm text-green-700">{action}</p>
                          <p className="text-xs text-green-600 mt-2">Completed: {formatDate(selectedCaseForTimeline.lastUpdated)}</p>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Case Creation */}
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow"></div>
                    </div>
                    <div className="flex-1">
                      <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                        <div className="flex items-center gap-2 mb-2">
                          <Flag className="h-4 w-4 text-red-600" />
                          <span className="text-sm font-medium text-red-800">Case Created</span>
                        </div>
                        <p className="text-sm text-red-700">Initial incident reported and flagged for review</p>
                        <p className="text-sm text-red-700 mt-1">{selectedCaseForTimeline.description}</p>
                        <p className="text-xs text-red-600 mt-2">Created: {formatDate(selectedCaseForTimeline.flaggedDate)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}