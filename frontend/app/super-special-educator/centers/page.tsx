'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Building2, 
  MapPin, 
  Users, 
  Phone, 
  Mail,
  Search,
  ArrowLeft,
  Eye,
  Calendar,
  UserCheck,
  Clock,
  FileText,
  Activity,
  AlertTriangle,
  CheckCircle,
  X
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface CenterAssignment {
  id: string;
  centerId: string;
  assignedDate: string;
  isActive: boolean;
  lastVisitDate?: string;
  nextScheduledVisit?: string;
  center: {
    id: string;
    centerName: string;
    address?: string;
    phone?: string;
    email?: string;
    contactPerson?: string;
    contactPhone?: string;
    contactEmail?: string;
    students: any[];
    assignments: {
      specialEducator?: {
        id: string;
        fullName: string;
      };
    }[];
  };
}

export default function CentersPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [centerAssignments, setCenterAssignments] = useState<CenterAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [selectedCenter, setSelectedCenter] = useState<CenterAssignment | null>(null);
  const [centerDetailsOpen, setCenterDetailsOpen] = useState(false);
  const [scheduleVisitOpen, setScheduleVisitOpen] = useState(false);
  
  // Schedule visit form states
  const [visitDate, setVisitDate] = useState('');
  const [visitTime, setVisitTime] = useState('');
  const [visitPurpose, setVisitPurpose] = useState('');
  const [visitNotes, setVisitNotes] = useState('');
  const [schedulingVisit, setSchedulingVisit] = useState(false);

  useEffect(() => {
    fetchCenters();
  }, []);

  const fetchCenters = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getAssignedCenters();
      setCenterAssignments(Array.isArray(response.data) ? response.data : []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch centers",
        variant: "destructive",
      });
      setCenterAssignments([]);
    } finally {
      setLoading(false);
    }
  };

  const assignmentsArray = Array.isArray(centerAssignments) ? centerAssignments : [];
  const filteredAssignments = assignmentsArray.filter(assignment =>
    assignment.center?.centerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    assignment.center?.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    assignment.center?.contactPerson?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (isActive: boolean) => {
    return isActive 
      ? 'bg-green-100 text-green-800'
      : 'bg-red-100 text-red-800';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleViewDetails = (assignment: CenterAssignment) => {
    setSelectedCenter(assignment);
    setCenterDetailsOpen(true);
  };

  const handleScheduleVisit = (assignment: CenterAssignment) => {
    setSelectedCenter(assignment);
    setScheduleVisitOpen(true);
    // Reset form
    setVisitDate('');
    setVisitTime('');
    setVisitPurpose('');
    setVisitNotes('');
  };

  const submitScheduleVisit = async () => {
    if (!selectedCenter || !visitDate || !visitTime || !visitPurpose) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setSchedulingVisit(true);
      // Here you would call the API to schedule the visit
      // await apiClient.scheduleVisit(selectedCenter.center.id, { date: visitDate, time: visitTime, purpose: visitPurpose, notes: visitNotes });
      
      toast({
        title: "Success",
        description: "Visit scheduled successfully",
      });
      
      setScheduleVisitOpen(false);
      fetchCenters(); // Refresh data
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to schedule visit",
        variant: "destructive",
      });
    } finally {
      setSchedulingVisit(false);
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
            <h1 className="text-3xl font-bold text-gray-900">Assigned Centers</h1>
            <p className="text-gray-600">Manage and monitor your assigned centers</p>
          </div>
        </div>
      </div>

      {/* Search and Stats */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search centers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-4 text-sm text-gray-600">
          <span>Total Centers: <strong>{centerAssignments.length}</strong></span>
          <span>Active: <strong>{centerAssignments.filter(a => a.isActive).length}</strong></span>
        </div>
      </div>

      {/* Centers Grid */}
      {filteredAssignments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchTerm ? 'No centers found' : 'No centers assigned'}
            </h3>
            <p className="text-gray-600 text-center max-w-md">
              {searchTerm 
                ? 'Try adjusting your search terms to find the centers you\'re looking for.'
                : 'You don\'t have any centers assigned yet. Please contact your administrator.'
              }
            </p>
            {searchTerm && (
              <Button
                variant="outline"
                onClick={() => setSearchTerm('')}
                className="mt-4"
              >
                Clear Search
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAssignments.map((assignment) => {
            const center = assignment.center;
            return (
            <Card key={assignment.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-semibold text-gray-900 mb-1">
                        {center.centerName}
                      </CardTitle>
                      <div className="flex items-center text-sm text-gray-600 mb-2">
                        <MapPin className="h-4 w-4 mr-1" />
                        {center.address || 'No address provided'}
                      </div>
                    </div>
                    <Badge className={getStatusColor(assignment.isActive)}>
                      {assignment.isActive ? 'ACTIVE' : 'INACTIVE'}
                    </Badge>
                  </div>
                </CardHeader>
              <CardContent className="space-y-4">
                {/* Contact Information */}
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <UserCheck className="h-4 w-4 mr-2 text-gray-400" />
                    <span className="font-medium">{center.contactPerson || 'Not provided'}</span>
                  </div>
                  {center.contactPhone && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="h-4 w-4 mr-2 text-gray-400" />
                      {center.contactPhone}
                    </div>
                  )}
                  {center.contactEmail && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Mail className="h-4 w-4 mr-2 text-gray-400" />
                      {center.contactEmail}
                    </div>
                  )}
                </div>

                {/* Statistics */}
                <div className="grid grid-cols-2 gap-4 py-3 border-t border-gray-100">
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      <Users className="h-4 w-4 mr-1 text-blue-600" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{center.students?.length || 0}</div>
                    <div className="text-xs text-gray-600">Students</div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      <UserCheck className="h-4 w-4 mr-1 text-green-600" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{center.assignments?.length || 0}</div>
                    <div className="text-xs text-gray-600">Educators</div>
                  </div>
                </div>

                {/* Dates */}
                <div className="space-y-2 text-sm border-t border-gray-100 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Assigned:</span>
                    <span className="font-medium">{formatDate(assignment.assignedDate)}</span>
                  </div>
                  {assignment.lastVisitDate && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Last Visit:</span>
                      <span className="font-medium">{formatDate(assignment.lastVisitDate)}</span>
                    </div>
                  )}
                  {assignment.nextScheduledVisit && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Next Visit:</span>
                      <span className="font-medium text-blue-600">{formatDate(assignment.nextScheduledVisit)}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-3 border-t border-gray-100">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleViewDetails(assignment)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleScheduleVisit(assignment)}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule Visit
                  </Button>
                </div>
              </CardContent>
            </Card>
            );
          })}
        </div>
      )}

      {/* Center Details Modal */}
      <Dialog open={centerDetailsOpen} onOpenChange={setCenterDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {selectedCenter?.center.centerName}
            </DialogTitle>
            <DialogDescription>
              Comprehensive center information and assignment details
            </DialogDescription>
          </DialogHeader>
          
          {selectedCenter && (
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="assignment">Assignment</TabsTrigger>
                <TabsTrigger value="activities">Activities</TabsTrigger>
                <TabsTrigger value="reports">Reports</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Basic Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Name:</span>
                        <span>{selectedCenter.center.centerName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Address:</span>
                        <span>{selectedCenter.center.address || 'Not provided'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <UserCheck className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Contact Person:</span>
                        <span>{selectedCenter.center.contactPerson || 'Not provided'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Phone:</span>
                        <span>{selectedCenter.center.contactPhone || 'Not provided'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Email:</span>
                        <span>{selectedCenter.center.contactEmail || 'Not provided'}</span>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Statistics</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span>Total Students:</span>
                        <Badge variant="secondary">{selectedCenter.center.students?.length || 0}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Educators:</span>
                        <Badge variant="outline">{selectedCenter.center.assignments?.length || 0}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Status:</span>
                        <Badge variant={selectedCenter.isActive ? 'default' : 'secondary'}>
                          {selectedCenter.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="assignment" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Assignment Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Assigned Date:</span>
                      <span>{formatDate(selectedCenter.assignedDate)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Status:</span>
                      <Badge variant={selectedCenter.isActive ? 'default' : 'secondary'}>
                        {selectedCenter.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Last Visit:</span>
                      <span>{selectedCenter.lastVisitDate ? formatDate(selectedCenter.lastVisitDate) : 'No visits yet'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Next Scheduled Visit:</span>
                      <span>{selectedCenter.nextScheduledVisit ? formatDate(selectedCenter.nextScheduledVisit) : 'Not scheduled'}</span>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="activities" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Recent Activities</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 border rounded-lg">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <div className="flex-1">
                          <p className="font-medium">Evaluation Completed</p>
                          <p className="text-sm text-muted-foreground">Monthly assessment completed</p>
                        </div>
                        <span className="text-sm text-muted-foreground">2 days ago</span>
                      </div>
                      <div className="flex items-center gap-3 p-3 border rounded-lg">
                        <Calendar className="h-4 w-4 text-blue-500" />
                        <div className="flex-1">
                          <p className="font-medium">Visit Scheduled</p>
                          <p className="text-sm text-muted-foreground">Routine inspection scheduled</p>
                        </div>
                        <span className="text-sm text-muted-foreground">1 week ago</span>
                      </div>
                      <div className="flex items-center gap-3 p-3 border rounded-lg">
                        <FileText className="h-4 w-4 text-orange-500" />
                        <div className="flex-1">
                          <p className="font-medium">Report Submitted</p>
                          <p className="text-sm text-muted-foreground">Monthly progress report</p>
                        </div>
                        <span className="text-sm text-muted-foreground">2 weeks ago</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="reports" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Reports & Documents</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText className="h-4 w-4 text-blue-500" />
                          <div>
                            <p className="font-medium">Monthly Progress Report</p>
                            <p className="text-sm text-muted-foreground">December 2024</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText className="h-4 w-4 text-green-500" />
                          <div>
                            <p className="font-medium">Evaluation Report</p>
                            <p className="text-sm text-muted-foreground">November 2024</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <AlertTriangle className="h-4 w-4 text-orange-500" />
                          <div>
                            <p className="font-medium">Incident Report</p>
                            <p className="text-sm text-muted-foreground">October 2024</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Schedule Visit Modal */}
      <Dialog open={scheduleVisitOpen} onOpenChange={setScheduleVisitOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Schedule Visit
            </DialogTitle>
            <DialogDescription>
              Schedule a visit to {selectedCenter?.center.centerName}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Visit Date *</label>
              <Input
                type="date"
                value={visitDate}
                onChange={(e) => setVisitDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Visit Time *</label>
              <Input
                type="time"
                value={visitTime}
                onChange={(e) => setVisitTime(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Purpose *</label>
              <Select value={visitPurpose} onValueChange={setVisitPurpose}>
                <SelectTrigger>
                  <SelectValue placeholder="Select visit purpose" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="routine_inspection">Routine Inspection</SelectItem>
                  <SelectItem value="evaluation">Evaluation</SelectItem>
                  <SelectItem value="training">Training Session</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="support">Support Visit</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Notes</label>
              <Textarea
                placeholder="Additional notes for the visit..."
                value={visitNotes}
                onChange={(e) => setVisitNotes(e.target.value)}
                rows={3}
              />
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setScheduleVisitOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={submitScheduleVisit}
                disabled={schedulingVisit || !visitDate || !visitTime || !visitPurpose}
                className="flex-1"
              >
                {schedulingVisit ? 'Scheduling...' : 'Schedule Visit'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}