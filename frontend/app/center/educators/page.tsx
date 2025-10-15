'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  GraduationCap, 
  Plus,
  Minus,
  Users,
  Phone,
  Mail,
  RefreshCw,
  UserMinus,
  ChevronDown,
  ChevronRight,
  School,
  Eye,
  Building
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

interface Educator {
  assignmentId: string;
  educatorId: string;
  type: 'Special Educator' | 'Super Special Educator';
  fullName: string;
  email: string;
  phone?: string;
  yearsOfExperience?: number;
  specializationAreas: string[];
  isActive: boolean;
  lastLogin?: string;
  assignedDate: string;
  assignedStudentCount: number;
  assignedCenterCount: number;
}

interface AvailableEducator {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  yearsOfExperience?: number;
  specializationAreas: string[];
  isActive: boolean;
  assignedCenters?: Array<{
    id: string;
    name: string;
    address: string;
    assignedAt: string;
  }>;
  isAssigned?: boolean;
  qualifications?: string[];
  bio?: string;
  specialization?: string;
  assignedStudentCount?: number;
}

interface Student {
  id: string;
  fullName: string;
  dateOfBirth: string;
  grade: string;
  schoolName: string;
  status: string;
  assignedDate: string;
}

interface School {
  id: string;
  schoolName: string;
  studentCount: number;
}



export default function CenterEducators() {
  const { user } = useAuth();
  const [educators, setEducators] = useState<Educator[]>([]);
  const [loading, setLoading] = useState(true);
  const [availableEducators, setAvailableEducators] = useState<AvailableEducator[]>([]);
  const [allEducators, setAllEducators] = useState<AvailableEducator[]>([]);
  const [activeTab, setActiveTab] = useState<'assigned' | 'unassigned'>('unassigned');
  const [linkModalTab, setLinkModalTab] = useState<'unassigned' | 'assigned'>('unassigned');
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [selectedEducatorStudents, setSelectedEducatorStudents] = useState<Student[]>([]);
  const [selectedEducatorSchools, setSelectedEducatorSchools] = useState<School[]>([]);
  const [showStudentsModal, setShowStudentsModal] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [loadingAvailable, setLoadingAvailable] = useState(false);
  const [expandedEducator, setExpandedEducator] = useState<string | null>(null);


  useEffect(() => {
    loadEducators();
  }, []);

  const loadEducators = async () => {
    try {
      setLoading(true);
      const centerId = user?.profile?.id;
      if (!centerId) return;

      const educatorsData = await apiClient.getCenterEducators(centerId);
      
      // Filter only Special Educators
      const specialEducators = educatorsData.filter((educator: any) => 
        educator.type === 'Special Educator'
      );
      
      // Transform backend data to match frontend interface
      const transformedEducators: Educator[] = specialEducators.map((educator: any) => ({
        assignmentId: educator.assignmentId,
        educatorId: educator.educatorId,
        type: educator.type,
        fullName: educator.fullName,
        email: educator.email,
        phone: educator.phone,
        yearsOfExperience: educator.yearsOfExperience || 0,
        specializationAreas: educator.specializationAreas || [],
        isActive: educator.isActive || true,
        lastLogin: educator.lastLogin,
        assignedDate: educator.assignedDate,
        assignedStudentCount: educator.assignedStudentCount || 0,
        assignedCenterCount: educator.assignedCenterCount || 0
      }));
      
      setEducators(transformedEducators);
    } catch (error) {
      console.error('Failed to load educators:', error);
      toast({
        title: "Error",
        description: "Failed to load educators",
        variant: "destructive"
      });
      setEducators([]);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableEducators = async () => {
    try {
      setLoadingAvailable(true);
      const centerId = user?.profile?.id;
      if (!centerId) return;

      // Use the centers API to get all educators with detailed information
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/centers/available-educators?page=1&limit=1000`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      const allSpecialEducators = data.data || [];
      
      // Get currently assigned educator IDs for this center
      const assignedEducatorIds = educators.map(e => e.educatorId);
      
      // Transform all educators with detailed information
      const transformedEducators: AvailableEducator[] = allSpecialEducators.map((educator: any) => {
        const profile = educator.specialEducatorProfile;
        
        // Check if educator is assigned to current center
        const isAssignedToCurrentCenter = profile?.assignedCenters?.some((center: any) => center.id === centerId) || false;
        
        // Get assigned centers with proper structure
        const assignedCenters = profile?.assignedCenters?.map((center: any) => ({
          id: center.id,
          name: center.name,
          address: center.address,
          assignedAt: center.assignedAt
        })) || [];
        
        return {
          id: educator.id,
          fullName: profile?.fullName || educator.fullName || educator.email,
          email: educator.email,
          phone: profile?.phone || educator.phoneNumber,
          yearsOfExperience: profile?.experience || 0,
          specializationAreas: profile?.specialization ? [profile.specialization] : [],
          isActive: educator.isActive || true,
          assignedCenters: assignedCenters,
          isAssigned: profile?.isAssigned || false,
          qualifications: profile?.qualifications ? (Array.isArray(profile.qualifications) ? profile.qualifications : [profile.qualifications]) : [],
          bio: profile?.bio,
          specialization: profile?.specialization,
          assignedStudentCount: 0 // Will be calculated from assignments
        };
      });
      
      // Separate into assigned and unassigned educators
      // Assigned: educators who have any center assignments
      // Unassigned: educators who have no center assignments
      const assigned = transformedEducators.filter(educator => 
        educator.isAssigned && educator.assignedCenters.length > 0
      );
      const unassigned = transformedEducators.filter(educator => 
        !educator.isAssigned || educator.assignedCenters.length === 0
      );
      
      console.log('All educators:', transformedEducators.length);
      console.log('Assigned educators:', assigned.length);
      console.log('Unassigned educators:', unassigned.length);
      
      setAllEducators(transformedEducators);
      setAvailableEducators(unassigned); // Keep this for backward compatibility
    } catch (error) {
      console.error('Failed to load available educators:', error);
      toast({
        title: "Error",
        description: "Failed to load available educators",
        variant: "destructive"
      });
    } finally {
      setLoadingAvailable(false);
    }
  };

  const loadEducatorStudents = async (educatorId: string) => {
    try {
      setLoadingStudents(true);
      const centerId = user?.profile?.id;
      if (!centerId) return;

      // Get all center students and filter by educator
      const studentsResponse = await apiClient.getCenterStudents(centerId, {
        page: 1,
        limit: 1000, // Get all students
        hasAssignment: true
      });
      
      // Filter students assigned to this educator
      // Based on the API response, students have an assignments array
      const educatorStudents = studentsResponse.data.filter((student: any) => {
        return student.assignments && student.assignments.some((assignment: any) => 
          assignment.specialEducatorId === educatorId && assignment.isActive
        );
      });
      
      console.log('Filtered educator students:', educatorStudents);
      console.log('Total students from API:', studentsResponse.data.length);
      console.log('Looking for educator ID:', educatorId);
      
      // Get center schools for school information
      const schoolsResponse = await apiClient.getCenterSchools(centerId);
      
      // Transform student data to include additional fields needed by the modal
      const transformedStudents = educatorStudents.map((student: any) => {
        const activeAssignment = student.assignments?.find((assignment: any) => 
          assignment.specialEducatorId === educatorId && assignment.isActive
        );
        
        return {
          ...student,
          schoolName: student.school?.name || 'Not assigned',
          assignedDate: activeAssignment?.assignedDate || student.createdAt,
          // Ensure all required fields are present
          totalReports: student.totalReports || 0,
          totalAssessments: student.totalAssessments || 0,
          completedAssessments: student.completedAssessments || 0,
          overallProgress: student.overallProgress || 0,
          pendingReports: student.pendingReports || 0
        };
      });
      
      // Create school summary based on students
      const schoolMap = new Map();
      transformedStudents.forEach((student: any) => {
        if (student.schoolId) {
          const school = schoolsResponse.find((s: any) => s.id === student.schoolId);
          if (school) {
            const existing = schoolMap.get(school.id) || { 
              ...school, 
              schoolName: school.name,
              studentCount: 0 
            };
            existing.studentCount += 1;
            schoolMap.set(school.id, existing);
          }
        }
      });
      
      setSelectedEducatorStudents(transformedStudents);
      setSelectedEducatorSchools(Array.from(schoolMap.values()));
      setShowStudentsModal(true);
    } catch (error) {
      console.error('Failed to load educator students:', error);
      toast({
        title: "Error",
        description: "Failed to load educator students",
        variant: "destructive"
      });
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleRemoveEducator = async (assignmentId: string, educatorName: string) => {
    try {
      const centerId = user?.profile?.id;
      if (!centerId) return;

      await apiClient.removeEducatorFromCenter(centerId, assignmentId);
      toast({
        title: "Success",
        description: `${educatorName} has been removed from the center`
      });
      await loadEducators(); // Reload the list
    } catch (error) {
      console.error('Failed to remove educator:', error);
      toast({
        title: "Error",
        description: "Failed to remove educator",
        variant: "destructive"
      });
    }
  };

  const handleLinkEducator = async (educatorId: string, educatorName: string) => {
    try {
      const centerId = user?.profile?.id;
      if (!centerId) return;

      await apiClient.assignEducatorToCenter(centerId, educatorId, 'SPECIAL_EDUCATOR');
      toast({
        title: "Success",
        description: `${educatorName} has been linked to the center`
      });
      setShowLinkModal(false);
      await loadEducators(); // Reload the list
      await loadAvailableEducators(); // Reload available educators
    } catch (error) {
      console.error('Failed to link educator:', error);
      toast({
        title: "Error",
        description: "Failed to link educator",
        variant: "destructive"
      });
    }
  };

  const handleUnlinkEducator = async (educatorId: string, educatorName: string) => {
    try {
      const centerId = user?.profile?.id;
      if (!centerId) return;

      // Find the assignment ID for this educator
      const assignment = educators.find(e => e.educatorId === educatorId);
      if (!assignment) {
        toast({
          title: "Error",
          description: "Assignment not found",
          variant: "destructive"
        });
        return;
      }

      await apiClient.removeEducatorFromCenter(centerId, assignment.assignmentId);
      toast({
        title: "Success",
        description: `${educatorName} has been unlinked from the center`
      });
      await loadEducators(); // Reload the list
      await loadAvailableEducators(); // Reload available educators
    } catch (error) {
      console.error('Failed to unlink educator:', error);
      toast({
        title: "Error",
        description: "Failed to unlink educator",
        variant: "destructive"
      });
    }
  };

  const handleOpenLinkModal = () => {
    setShowLinkModal(true);
    loadAvailableEducators();
  };




  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-muted-foreground">Loading educators...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <motion.div
              whileHover={{ rotate: 5, scale: 1.1 }}
              className="p-2 bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900 dark:to-indigo-900 rounded-xl"
            >
              <GraduationCap className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            </motion.div>
            Special Educators Management
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage special educators linked to your center
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={loadEducators} className="group">
            <RefreshCw className="h-4 w-4 mr-2 group-hover:rotate-180 transition-transform duration-500" />
            Refresh
          </Button>

          <Button onClick={handleOpenLinkModal} className="group">
            <Plus className="h-4 w-4 mr-2 group-hover:rotate-90 transition-transform" />
            Link Special Educator
          </Button>
        </div>
      </motion.div>

      {/* Educators Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Special Educators ({educators.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {educators.length === 0 ? (
              <div className="text-center py-12">
                <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Special Educators</h3>
                <p className="text-muted-foreground mb-4">
                  No special educators are currently linked to this center.
                </p>
                <Button onClick={handleOpenLinkModal}>
                  <Plus className="h-4 w-4 mr-2" />
                  Link First Educator
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Educator</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Students</TableHead>
                    <TableHead>Schools</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {educators.map((educator) => (
                    <Collapsible key={educator.assignmentId} asChild>
                      <>
                        <CollapsibleTrigger asChild>
                          <TableRow 
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => setExpandedEducator(
                              expandedEducator === educator.assignmentId ? null : educator.assignmentId
                            )}
                          >
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900 dark:to-blue-900 rounded-full flex items-center justify-center">
                                  <span className="text-purple-600 dark:text-purple-400 font-semibold text-sm">
                                    {educator.fullName.split(' ').map(n => n[0]).join('')}
                                  </span>
                                </div>
                                <div>
                                  <div className="font-medium">{educator.fullName}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {educator.yearsOfExperience} years experience
                                  </div>
                                </div>
                                {expandedEducator === educator.assignmentId ? (
                                  <ChevronDown className="h-4 w-4 ml-auto" />
                                ) : (
                                  <ChevronRight className="h-4 w-4 ml-auto" />
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 text-sm">
                                  <Mail className="h-3 w-3" />
                                  {educator.email}
                                </div>
                                {educator.phone && (
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Phone className="h-3 w-3" />
                                    {educator.phone}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">
                                {educator.assignedStudentCount} students
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <School className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">Multiple schools</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    loadEducatorStudents(educator.educatorId);
                                  }}
                                  disabled={loadingStudents}
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  View Students
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveEducator(educator.assignmentId, educator.fullName);
                                  }}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <UserMinus className="h-4 w-4 mr-1" />
                                  Remove
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        </CollapsibleTrigger>
                        <CollapsibleContent asChild>
                          <TableRow>
                            <TableCell colSpan={5} className="bg-muted/20">
                              <div className="p-4 space-y-3">
                                <h4 className="font-medium">Educator Details</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <p className="text-sm font-medium">Specialization Areas</p>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {educator.specializationAreas.map((area, index) => (
                                        <Badge key={index} variant="outline" className="text-xs">
                                          {area}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium">Assignment Date</p>
                                    <p className="text-sm text-muted-foreground">
                                      {new Date(educator.assignedDate).toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        </CollapsibleContent>
                      </>
                    </Collapsible>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Link Special Educator Modal */}
      <Dialog open={showLinkModal} onOpenChange={setShowLinkModal}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Special Educators Management</DialogTitle>
          </DialogHeader>
          
          <Tabs value={linkModalTab} onValueChange={(value) => setLinkModalTab(value as 'unassigned' | 'assigned')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="unassigned">Unassigned Educators</TabsTrigger>
              <TabsTrigger value="assigned">Assigned Educators</TabsTrigger>
            </TabsList>
            
            <TabsContent value="unassigned" className="space-y-4">
              {loadingAvailable ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                  Loading educators...
                </div>
              ) : availableEducators.length === 0 ? (
                <div className="text-center py-8">
                  <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Unassigned Educators</h3>
                  <p className="text-muted-foreground">
                    All special educators are already linked to centers.
                  </p>
                </div>
              ) : (
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Educator</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Experience</TableHead>
                        <TableHead>Specialization</TableHead>
                        <TableHead>Qualifications</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {availableEducators.map((educator) => (
                        <TableRow key={educator.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-blue-100 dark:from-green-900 dark:to-blue-900 rounded-full flex items-center justify-center">
                                <span className="text-green-600 dark:text-green-400 font-semibold text-sm">
                                  {educator.fullName.split(' ').map(n => n[0]).join('')}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium">{educator.fullName}</p>
                                {educator.bio && (
                                  <p className="text-xs text-muted-foreground truncate max-w-[200px]" title={educator.bio}>
                                    {educator.bio}
                                  </p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center gap-1 text-sm">
                                <Mail className="h-3 w-3 text-muted-foreground" />
                                <span className="truncate max-w-[150px]" title={educator.email}>
                                  {educator.email}
                                </span>
                              </div>
                              {educator.phone && (
                                <div className="flex items-center gap-1 text-sm">
                                  <Phone className="h-3 w-3 text-muted-foreground" />
                                  {educator.phone}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">{educator.yearsOfExperience}</span> years
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1 max-w-[200px]">
                              {educator.specializationAreas.length > 0 ? (
                                educator.specializationAreas.slice(0, 2).map((area, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {area}
                                  </Badge>
                                ))
                              ) : (
                                <span className="text-muted-foreground text-sm">No specialization</span>
                              )}
                              {educator.specializationAreas.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{educator.specializationAreas.length - 2}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="max-w-[150px]">
                              {educator.qualifications && educator.qualifications.length > 0 ? (
                                <div className="space-y-1">
                                  {educator.qualifications.slice(0, 2).map((qual, index) => (
                                    <Badge key={index} variant="secondary" className="text-xs block w-fit">
                                      {qual}
                                    </Badge>
                                  ))}
                                  {educator.qualifications.length > 2 && (
                                    <span className="text-xs text-muted-foreground">
                                      +{educator.qualifications.length - 2} more
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-sm">Not specified</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={educator.isActive ? "default" : "secondary"} className="text-xs">
                              {educator.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              onClick={() => handleLinkEducator(educator.id, educator.fullName)}
                              disabled={!educator.isActive}
                              size="sm"
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Link
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="assigned" className="space-y-4">
              {loadingAvailable ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                  Loading educators...
                </div>
              ) : allEducators.filter(e => e.isAssigned && e.assignedCenters.length > 0).length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Assigned Educators</h3>
                  <p className="text-muted-foreground">
                    No special educators are currently assigned to any centers.
                  </p>
                </div>
              ) : (
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Educator</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Experience</TableHead>
                        <TableHead>Specialization</TableHead>
                        <TableHead>Assigned Centers</TableHead>
                        <TableHead>Assignment Date</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allEducators
                        .filter(educator => educator.isAssigned && educator.assignedCenters.length > 0)
                        .map((educator) => (
                          <TableRow key={educator.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 rounded-full flex items-center justify-center">
                                  <span className="text-blue-600 dark:text-blue-400 font-semibold text-sm">
                                    {educator.fullName.split(' ').map(n => n[0]).join('')}
                                  </span>
                                </div>
                                <div>
                                  <p className="font-medium">{educator.fullName}</p>
                                  {educator.bio && (
                                    <p className="text-xs text-muted-foreground truncate max-w-[200px]" title={educator.bio}>
                                      {educator.bio}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="flex items-center gap-1 text-sm">
                                  <Mail className="h-3 w-3 text-muted-foreground" />
                                  <span className="truncate max-w-[150px]" title={educator.email}>
                                    {educator.email}
                                  </span>
                                </div>
                                {educator.phone && (
                                  <div className="flex items-center gap-1 text-sm">
                                    <Phone className="h-3 w-3 text-muted-foreground" />
                                    {educator.phone}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="font-medium">{educator.yearsOfExperience}</span> years
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1 max-w-[200px]">
                                {educator.specializationAreas.length > 0 ? (
                                  educator.specializationAreas.slice(0, 2).map((area, index) => (
                                    <Badge key={index} variant="outline" className="text-xs">
                                      {area}
                                    </Badge>
                                  ))
                                ) : (
                                  <span className="text-muted-foreground text-sm">No specialization</span>
                                )}
                                {educator.specializationAreas.length > 2 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{educator.specializationAreas.length - 2}
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1 max-w-[250px]">
                                {educator.assignedCenters.map((center, index) => (
                                  <div key={center.id} className="flex items-start gap-2 p-2 bg-muted/30 rounded text-xs">
                                    <Building className="h-3 w-3 text-muted-foreground mt-0.5 flex-shrink-0" />
                                    <div className="min-w-0 flex-1">
                                      <p className="font-medium truncate" title={center.name}>
                                        {center.name}
                                      </p>
                                      <p className="text-muted-foreground truncate" title={center.address}>
                                        {center.address}
                                      </p>
                                      <p className="text-muted-foreground">
                                        Since: {new Date(center.assignedAt).toLocaleDateString()}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm">
                                {educator.assignedCenters.length > 0 ? 
                                  new Date(educator.assignedCenters[0].assignedAt).toLocaleDateString() : 
                                  'N/A'
                                }
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedEducatorStudents([]);
                                    setSelectedEducatorSchools([]);
                                    loadEducatorStudents(educator.id);
                                    setShowStudentsModal(true);
                                  }}
                                >
                                  <Users className="h-4 w-4 mr-1" />
                                  View Students
                                </Button>
                                {educator.assignedCenters.some(center => center.id === user?.profile?.id) && (
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleUnlinkEducator(educator.id, educator.fullName)}
                                  >
                                    <Minus className="h-4 w-4 mr-1" />
                                    Unlink
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Students Modal */}
      <Dialog open={showStudentsModal} onOpenChange={setShowStudentsModal}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Assigned Students</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* Schools Summary */}
            {selectedEducatorSchools.length > 0 && (
              <div>
                <h4 className="font-medium mb-3">Schools ({selectedEducatorSchools.length})</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {selectedEducatorSchools.map((school) => (
                    <Card key={school.id} className="p-3">
                      <div className="flex items-center gap-2">
                        <School className="h-4 w-4 text-blue-500" />
                        <div>
                          <p className="font-medium text-sm">{school.schoolName}</p>
                          <p className="text-xs text-muted-foreground">
                            {school.studentCount} students
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Students List */}
            <div>
              <h4 className="font-medium mb-3">Students ({selectedEducatorStudents.length})</h4>
              {selectedEducatorStudents.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No students assigned to this educator.</p>
                </div>
              ) : (
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student Name</TableHead>
                        <TableHead>Grade</TableHead>
                        <TableHead>School</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Assigned Date</TableHead>
                        <TableHead>Parent Contact</TableHead>
                        <TableHead>Progress</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedEducatorStudents.map((student) => (
                        <TableRow key={student.id} className="hover:bg-muted/50">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 rounded-full flex items-center justify-center">
                                <span className="text-blue-600 dark:text-blue-400 font-semibold text-xs">
                                  {student.fullName.split(' ').map(n => n[0]).join('')}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium">{student.fullName}</p>
                                <p className="text-xs text-muted-foreground">
                                  DOB: {new Date(student.dateOfBirth).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{student.grade}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="max-w-[150px]">
                              <p className="text-sm truncate" title={student.schoolName || 'Not assigned'}>
                                {student.schoolName || 'Not assigned'}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={student.status === 'ACTIVE' ? 'default' : 'secondary'}>
                              {student.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm">
                              {new Date(student.assignedDate).toLocaleDateString()}
                            </p>
                          </TableCell>
                          <TableCell>
                            {student.parent ? (
                              <div className="space-y-1">
                                <p className="text-sm font-medium">{student.parent.fullName}</p>
                                {student.parent.phone && (
                                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Phone className="h-3 w-3" />
                                    {student.parent.phone}
                                  </p>
                                )}
                                {student.parent.email && (
                                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Mail className="h-3 w-3" />
                                    {student.parent.email}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground">No contact info</p>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-xs">
                                <span className="text-blue-600 font-medium">{student.totalReports || 0}</span>
                                <span className="text-muted-foreground">Reports</span>
                              </div>
                              <div className="flex items-center gap-2 text-xs">
                                <span className="text-green-600 font-medium">{student.completedAssessments || 0}/{student.totalAssessments || 0}</span>
                                <span className="text-muted-foreground">Assessments</span>
                              </div>
                              <div className="flex items-center gap-2 text-xs">
                                <span className="text-purple-600 font-medium">{student.overallProgress || 0}%</span>
                                <span className="text-muted-foreground">Overall</span>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>


    </div>
  );
}

