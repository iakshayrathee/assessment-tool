'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { 
  Users, 
  Search,
  ArrowLeft,
  Eye,
  Calendar,
  GraduationCap,
  Award,
  Building2,
  Filter,
  Star,
  FileText,
  Activity,
  CheckCircle,
  Clock,
  Mail,
  Phone,
  MapPin,
  BookOpen,
  TrendingUp
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface EducatorAssignment {
  id: string;
  centerId: string;
  specialEducatorId: string;
  assignedDate: string;
  isActive: boolean;
  specialEducator: {
    id: string;
    fullName: string;
    specialization: string[];
    yearsOfExperience?: number;
    qualifications: string[];
    assignedStudents: {
      id: string;
      student: {
        id: string;
        fullName: string;
        status: string;
      };
    }[];
  };
  center: {
    id: string;
    centerName: string;
    address?: string;
    students?: any[];
    assignments?: any[];
  };
}

export default function EducatorsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [educatorAssignments, setEducatorAssignments] = useState<EducatorAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [centerFilter, setCenterFilter] = useState<string>('all');
  
  // Modal states
  const [selectedEducator, setSelectedEducator] = useState<EducatorAssignment | null>(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [evaluationModalOpen, setEvaluationModalOpen] = useState(false);
  
  // Evaluation form states
  const [evaluationRating, setEvaluationRating] = useState<number>(0);
  const [evaluationComments, setEvaluationComments] = useState('');
  const [evaluationCategory, setEvaluationCategory] = useState('');
  const [submittingEvaluation, setSubmittingEvaluation] = useState(false);

  useEffect(() => {
    fetchEducators();
  }, []);

  const fetchEducators = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getAssignedEducators();
      setEducatorAssignments(Array.isArray(response.data) ? response.data : []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch educators",
        variant: "destructive",
      });
      setEducatorAssignments([]);
    } finally {
      setLoading(false);
    }
  };

  const assignmentsArray = Array.isArray(educatorAssignments) ? educatorAssignments : [];
  const uniqueCenters = Array.from(new Set(assignmentsArray.map(a => a.center?.centerName).filter(Boolean)));

  const filteredAssignments = assignmentsArray.filter(assignment => {
    const educator = assignment.specialEducator;
    const center = assignment.center;
    
    const matchesSearch = 
      educator?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      center?.centerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (educator?.specialization || []).some(s => s?.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || (assignment.isActive ? 'ACTIVE' : 'INACTIVE') === statusFilter;
    const matchesCenter = centerFilter === 'all' || center?.centerName === centerFilter;
    
    return matchesSearch && matchesStatus && matchesCenter;
  });

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

  const handleViewProfile = (assignment: EducatorAssignment) => {
    setSelectedEducator(assignment);
    setProfileModalOpen(true);
  };

  const handleEvaluate = (assignment: EducatorAssignment) => {
    setSelectedEducator(assignment);
    setEvaluationModalOpen(true);
    // Reset form
    setEvaluationRating(0);
    setEvaluationComments('');
    setEvaluationCategory('');
  };

  const submitEvaluation = async () => {
    if (!selectedEducator || !evaluationRating || !evaluationCategory) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmittingEvaluation(true);
      // Here you would call the API to submit the evaluation
      // await apiClient.evaluateEducator(selectedEducator.specialEducator.id, { 
      //   rating: evaluationRating, 
      //   comments: evaluationComments, 
      //   category: evaluationCategory 
      // });
      
      toast({
        title: "Success",
        description: "Evaluation submitted successfully",
      });
      
      setEvaluationModalOpen(false);
      fetchEducators(); // Refresh data
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit evaluation",
        variant: "destructive",
      });
    } finally {
      setSubmittingEvaluation(false);
    }
  };

  const renderStarRating = (rating: number, onRatingChange?: (rating: number) => void) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-5 w-5 cursor-pointer ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
            onClick={() => onRatingChange && onRatingChange(star)}
          />
        ))}
      </div>
    );
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
            <h1 className="text-3xl font-bold text-gray-900">Assigned Educators</h1>
            <p className="text-gray-600">Monitor and evaluate educators under your supervision</p>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search educators..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-3 items-center">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
                <SelectItem value="ON_LEAVE">On Leave</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
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
                <p className="text-sm text-gray-600">Total Educators</p>
                <p className="text-2xl font-bold">{educatorAssignments.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-2xl font-bold text-green-600">
                  {educatorAssignments.filter(a => a.isActive).length}
                </p>
              </div>
              <Award className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Students</p>
                <p className="text-2xl font-bold text-orange-600">
                  {educatorAssignments.reduce((sum, a) => sum + (a.specialEducator?.assignedStudents?.length || 0), 0)}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg. Experience</p>
                <p className="text-2xl font-bold text-blue-600">
                  {educatorAssignments.filter(a => a.specialEducator?.yearsOfExperience).length > 0
                    ? (educatorAssignments.reduce((sum, a) => sum + (a.specialEducator?.yearsOfExperience || 0), 0) / 
                       educatorAssignments.filter(a => a.specialEducator?.yearsOfExperience).length).toFixed(1)
                    : 'N/A'
                  } yrs
                </p>
              </div>
              <GraduationCap className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Educators List */}
      {filteredAssignments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchTerm || statusFilter !== 'all' || centerFilter !== 'all' 
                ? 'No educators found' 
                : 'No educators assigned'
              }
            </h3>
            <p className="text-gray-600 text-center max-w-md">
              {searchTerm || statusFilter !== 'all' || centerFilter !== 'all'
                ? 'Try adjusting your search terms or filters to find the educators you\'re looking for.'
                : 'You don\'t have any educators assigned yet. Please contact your administrator.'
              }
            </p>
            {(searchTerm || statusFilter !== 'all' || centerFilter !== 'all') && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
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
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredAssignments.map((assignment) => {
            const educator = assignment.specialEducator;
            const center = assignment.center;
            return (
            <Card key={assignment.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-semibold text-gray-900 mb-1">
                        {educator?.fullName || 'Unknown Educator'}
                      </CardTitle>
                      <div className="flex items-center text-sm text-gray-600 mb-2">
                        <Building2 className="h-4 w-4 mr-1" />
                        {center?.centerName || 'Unknown Center'}
                      </div>
                    </div>
                    <Badge className={getStatusColor(assignment.isActive)}>
                      {assignment.isActive ? 'ACTIVE' : 'INACTIVE'}
                    </Badge>
                  </div>
                </CardHeader>
              <CardContent className="space-y-4">
                  {/* Assignment Information */}
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                      <span className="font-medium">Assigned:</span>
                      <span className="ml-1">{formatDate(assignment.assignedDate)}</span>
                    </div>
                  </div>

                {/* Specializations */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">Specializations:</p>
                    <div className="flex flex-wrap gap-1">
                      {(educator?.specialization || []).map((spec, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {spec}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Statistics */}
                  <div className="grid grid-cols-2 gap-4 py-3 border-t border-gray-100">
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-900">{educator?.assignedStudents?.length || 0}</div>
                      <div className="text-xs text-gray-600">Students</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-900">
                        {educator?.yearsOfExperience || 'N/A'}
                      </div>
                      <div className="text-xs text-gray-600">Years Exp.</div>
                    </div>
                  </div>

                {/* Additional Information */}
                  <div className="space-y-2 text-sm border-t border-gray-100 pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Center Students:</span>
                      <span className="font-medium">{center?.students?.length || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Center Educators:</span>
                      <span className="font-medium">{center?.assignments?.length || 0}</span>
                    </div>
                  </div>

                {/* Actions */}
                <div className="flex gap-2 pt-3 border-t border-gray-100">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleViewProfile(assignment)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Profile
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEvaluate(assignment)}
                  >
                    <Award className="h-4 w-4 mr-2" />
                    Evaluate
                  </Button>
                </div>
              </CardContent>
            </Card>
            );
          })}
        </div>
      )}

      {/* Educator Profile Modal */}
      <Dialog open={profileModalOpen} onOpenChange={setProfileModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {selectedEducator?.specialEducator.fullName}
            </DialogTitle>
            <DialogDescription>
              Comprehensive educator profile and performance information
            </DialogDescription>
          </DialogHeader>
          
          {selectedEducator && (
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="students">Students</TabsTrigger>
                <TabsTrigger value="performance">Performance</TabsTrigger>
                <TabsTrigger value="evaluations">Evaluations</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Basic Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Name:</span>
                        <span>{selectedEducator.specialEducator.fullName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Center:</span>
                        <span>{selectedEducator.center.centerName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Assigned Date:</span>
                        <span>{formatDate(selectedEducator.assignedDate)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <GraduationCap className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Experience:</span>
                        <span>{selectedEducator.specialEducator.yearsOfExperience || 'N/A'} years</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Status:</span>
                        <Badge variant={selectedEducator.isActive ? 'default' : 'secondary'}>
                          {selectedEducator.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Specializations</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {selectedEducator.specialEducator.specialization.map((spec, index) => (
                          <Badge key={index} variant="outline">
                            {spec}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Qualifications</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {selectedEducator.specialEducator.qualifications.map((qual, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4 text-muted-foreground" />
                            <span>{qual}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Statistics</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span>Assigned Students:</span>
                        <Badge variant="secondary">{selectedEducator.specialEducator.assignedStudents.length}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Center Students:</span>
                        <Badge variant="outline">{selectedEducator.center.students?.length || 0}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Center Educators:</span>
                        <Badge variant="outline">{selectedEducator.center.assignments?.length || 0}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="students" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Assigned Students</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {selectedEducator.specialEducator.assignedStudents.map((assignment, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <Users className="h-4 w-4 text-blue-500" />
                            <div>
                              <p className="font-medium">{assignment.student.fullName}</p>
                              <p className="text-sm text-muted-foreground">ID: {assignment.student.id}</p>
                            </div>
                          </div>
                          <Badge variant={assignment.student.status === 'ACTIVE' ? 'default' : 'secondary'}>
                            {assignment.student.status}
                          </Badge>
                        </div>
                      ))}
                      {selectedEducator.specialEducator.assignedStudents.length === 0 && (
                        <p className="text-center text-muted-foreground py-4">No students assigned</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="performance" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Performance Metrics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 border rounded-lg">
                        <TrendingUp className="h-8 w-8 text-green-500 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-green-600">85%</div>
                        <div className="text-sm text-muted-foreground">Student Progress</div>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <Star className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-yellow-600">4.2</div>
                        <div className="text-sm text-muted-foreground">Avg. Rating</div>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <CheckCircle className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-blue-600">12</div>
                        <div className="text-sm text-muted-foreground">Completed Goals</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="evaluations" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Recent Evaluations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Star className="h-4 w-4 text-yellow-500" />
                          <div>
                            <p className="font-medium">Monthly Performance Review</p>
                            <p className="text-sm text-muted-foreground">December 2024</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {renderStarRating(4)}
                          <span className="text-sm text-muted-foreground">4.0</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Award className="h-4 w-4 text-blue-500" />
                          <div>
                            <p className="font-medium">Teaching Effectiveness</p>
                            <p className="text-sm text-muted-foreground">November 2024</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {renderStarRating(5)}
                          <span className="text-sm text-muted-foreground">5.0</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Users className="h-4 w-4 text-green-500" />
                          <div>
                            <p className="font-medium">Student Engagement</p>
                            <p className="text-sm text-muted-foreground">October 2024</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {renderStarRating(4)}
                          <span className="text-sm text-muted-foreground">4.2</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Evaluation Modal */}
      <Dialog open={evaluationModalOpen} onOpenChange={setEvaluationModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Evaluate Educator
            </DialogTitle>
            <DialogDescription>
              Evaluate {selectedEducator?.specialEducator.fullName}'s performance
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Evaluation Category *</label>
              <Select value={evaluationCategory} onValueChange={setEvaluationCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select evaluation category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="teaching_effectiveness">Teaching Effectiveness</SelectItem>
                  <SelectItem value="student_engagement">Student Engagement</SelectItem>
                  <SelectItem value="professional_development">Professional Development</SelectItem>
                  <SelectItem value="communication">Communication</SelectItem>
                  <SelectItem value="collaboration">Collaboration</SelectItem>
                  <SelectItem value="overall_performance">Overall Performance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Rating *</label>
              <div className="flex items-center gap-2">
                {renderStarRating(evaluationRating, setEvaluationRating)}
                <span className="text-sm text-muted-foreground ml-2">
                  {evaluationRating > 0 ? `${evaluationRating}/5` : 'Select rating'}
                </span>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Comments</label>
              <Textarea
                placeholder="Provide detailed feedback and comments..."
                value={evaluationComments}
                onChange={(e) => setEvaluationComments(e.target.value)}
                rows={4}
              />
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setEvaluationModalOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={submitEvaluation}
                disabled={submittingEvaluation || !evaluationRating || !evaluationCategory}
                className="flex-1"
              >
                {submittingEvaluation ? 'Submitting...' : 'Submit Evaluation'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}