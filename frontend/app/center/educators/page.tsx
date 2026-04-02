'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useCenterEducators } from '@/hooks/useCenter';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { DataTable, Column } from '@/components/ui/data-table';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { 
  GraduationCap, 
  Plus,
  Users,
  Phone,
  Mail,
  RefreshCw,
  UserMinus,
  School,
  Eye,
  Building,
  Search,
  MapPin,
  Calendar,
  Award,
  BookOpen,
  UserCheck,
  X,
  MoreHorizontal,
  Edit,
  Trash2
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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
  assignedStudents?: AssignedStudent[];
  assignedSchools?: Array<{
    id: string;
    name: string;
  }>;
}

interface AvailableEducator {
  id: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
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
  centerCount?: number;
  schoolCount?: number;
  studentCount?: number;
  specialEducatorProfile?: {
    id: string;
    specialization?: string;
    experience?: number;
    qualifications?: string[];
    bio?: string;
    assignedCenters: Array<{
      id: string;
      name: string;
      address: string;
      assignedAt: string;
    }>;
    isAssigned: boolean;
  };
}

interface AssignedStudent {
  id: string;
  fullName: string;
  status: string;
  grade: string;
  schoolName?: string;
}

interface Student {
  id: string;
  fullName: string;
  dateOfBirth: string;
  grade: string;
  schoolName: string;
  status: string;
  assignedDate: string;
  totalReports?: number;
  completedAssessments?: number;
  totalAssessments?: number;
  overallProgress?: number;
  parent?: {
    fullName: string;
    phone?: string;
    email?: string;
  };
}

interface School {
  id: string;
  schoolName: string;
  studentCount: number;
}

export default function CenterEducators() {
  const { user } = useAuth();
  const centerId = user?.profile?.id;
  
  // Pagination state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [availableEducators, setAvailableEducators] = useState<AvailableEducator[]>([]);
  const [availablePagination, setAvailablePagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [selectedEducatorStudents, setSelectedEducatorStudents] = useState<AssignedStudent[]>([]);
  const [selectedEducatorSchools, setSelectedEducatorSchools] = useState<School[]>([]);
  const [showStudentsModal, setShowStudentsModal] = useState(false);
  const [showSchoolsModal, setShowSchoolsModal] = useState(false);
  const [loadingAvailable, setLoadingAvailable] = useState(false);
  const [selectedEducatorForSchools, setSelectedEducatorForSchools] = useState<Educator | null>(null);
  const [availableSearchTerm, setAvailableSearchTerm] = useState('');
  const [showSpecializationsModal, setShowSpecializationsModal] = useState(false);
  const [selectedEducatorSpecializations, setSelectedEducatorSpecializations] = useState<{name: string, specializations: string[]}>({name: '', specializations: []});

  // Use React Query hooks for data fetching with pagination
  const { 
    educators: educatorsData, 
    isLoading: loading, 
    error: educatorsError,
    refetch: refetchEducators,
    removeEducator,
    isRemoving,
    assignEducator,
    isAssigning,
    pagination: educatorsPagination
  } = useCenterEducators(centerId, { page, limit, search: searchTerm });

  // Transform backend data to match frontend interface
  const educators: Educator[] = (educatorsData || [])
    .filter((educator: any) => educator.type === 'Special Educator')
    .map((educator: any) => ({
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
      assignedCenterCount: educator.assignedCenterCount || 0,
      assignedStudents: educator.assignedStudents || [],
      assignedSchools: educator.assignedSchools || []
    }));

  // Handle errors
  if (educatorsError) {
    toast({
      title: "Error",
      description: "Failed to load educators",
      variant: "destructive"
    });
  }

  const loadAvailableEducators = async (searchTerm: string = '', page: number = 1) => {
    try {
      setLoadingAvailable(true);
      const centerId = user?.profile?.id;
      if (!centerId) return;

      // Use the new all-educators API that returns all educators but filters out those already assigned to this center
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        centerId: centerId,
        ...(searchTerm && { search: searchTerm })
      });

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/centers/all-educators?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      const availableEducatorsData = data.data || [];
      
      console.log('Available educators:', availableEducatorsData.length);
      
      setAvailableEducators(availableEducatorsData);
      
      // Update pagination info if available
      if (data.pagination) {
        setAvailablePagination({
          page: data.pagination.page,
          limit: data.pagination.limit,
          total: data.pagination.total,
          pages: data.pagination.pages
        });
      }
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

  const handleAssignEducator = async (educatorId: string) => {
    try {
      await assignEducator({ educatorId, role: 'SPECIAL_EDUCATOR' });
      setShowLinkModal(false);
      refetchEducators();
    } catch (error) {
      console.error('Failed to assign educator:', error);
      // Error toast is handled by the mutation's onError callback
    }
  };

  const handleRemoveEducator = async (assignmentId: string) => {
    try {
      await removeEducator(assignmentId);
      toast({
        title: "Success",
        description: "Educator removed successfully",
      });
      refetchEducators();
    } catch (error) {
      console.error('Failed to remove educator:', error);
      toast({
        title: "Error",
        description: "Failed to remove educator",
        variant: "destructive"
      });
    }
  };

  const handleViewStudents = (educator: Educator) => {
    // Use the students data already available in the educator object
    const educatorStudents = educator.assignedStudents || [];
    setSelectedEducatorStudents(educatorStudents);
    setShowStudentsModal(true);
  };

  const handleViewSchools = (educator: Educator) => {
    // Use the schools data already available in the educator object
    // Transform to match the expected School interface
    const transformedSchools = (educator.assignedSchools || []).map((school: any) => ({
      id: school.id,
      schoolName: school.name,
      studentCount: educator.assignedStudents?.filter(student => 
        student.schoolName === school.name
      ).length || 0
    }));
    
    setSelectedEducatorSchools(transformedSchools);
    setSelectedEducatorForSchools(educator);
    setShowSchoolsModal(true);
  };

  // Filter available educators based on search
  const filteredAvailableEducators = availableEducators.filter(educator =>
    educator.fullName?.toLowerCase().includes(availableSearchTerm.toLowerCase()) ||
    educator.email?.toLowerCase().includes(availableSearchTerm.toLowerCase()) ||
    educator?.specializationAreas.some(area => 
      area.toLowerCase().includes(availableSearchTerm.toLowerCase())
    )
  );

  // Define table columns
  const columns: Column<Educator>[] = [
    {
      key: 'fullName',
      header: 'Name',
      sortable: true,
      render: (value, row) => (
        <div className="flex flex-col">
          <span className="font-medium text-foreground">{value}</span>
          <span className="text-sm text-muted-foreground">{row.email}</span>
        </div>
      ),
      width: 'w-64'
    },
    {
      key: 'phone',
      header: 'Contact',
      sortable: false,
      render: (value, row) => (
        <div className="flex flex-col space-y-1">
          {value && (
            <div className="flex items-center text-sm text-muted-foreground">
              <Phone className="h-3 w-3 mr-1" />
              {value}
            </div>
          )}
          <div className="flex items-center text-sm text-muted-foreground">
            <Mail className="h-3 w-3 mr-1" />
            {row.email}
          </div>
        </div>
      ),
      width: 'w-48'
    },
    {
      key: 'yearsOfExperience',
      header: 'Experience',
      sortable: true,
      render: (value) => (
        <div className="flex items-center">
          <Award className="h-4 w-4 mr-1 text-primary" />
          <span>{value || 0} years</span>
        </div>
      ),
      width: 'w-32'
    },
    {
      key: 'specializationAreas',
      header: 'Specializations',
      sortable: false,
      render: (value, row) => (
        <div className="flex flex-wrap gap-1">
          {(value || []).slice(0, 2).map((area: string, index: number) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {area}
            </Badge>
          ))}
          {(value || []).length > 2 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs text-primary hover:text-primary hover:bg-primary/10"
              onClick={() => {
                setSelectedEducatorSpecializations({
                  name: row.fullName,
                  specializations: value || []
                });
                setShowSpecializationsModal(true);
              }}
            >
              +{(value || []).length - 2} more
            </Button>
          )}
          {(value || []).length === 0 && (
            <span className="text-muted-foreground text-xs italic">No specializations</span>
          )}
        </div>
      ),
      width: 'w-48'
    },
    {
      key: 'assignedStudentCount',
      header: 'Students',
      sortable: true,
      render: (value) => (
        <div className="flex items-center">
          <Users className="h-4 w-4 mr-1 text-success" />
          <span>{value || 0}</span>
        </div>
      ),
      width: 'w-24'
    },
    {
      key: 'assignedDate',
      header: 'Assigned Date',
      sortable: true,
      render: (value) => (
        <div className="flex items-center text-sm text-muted-foreground">
          <Calendar className="h-3 w-3 mr-1" />
          {new Date(value).toLocaleDateString()}
        </div>
      ),
      width: 'w-32'
    },
    {
      key: 'isActive',
      header: 'Status',
      sortable: true,
      render: (value) => (
        <Badge variant={value ? "default" : "secondary"}>
          {value ? 'Active' : 'Inactive'}
        </Badge>
      ),
      width: 'w-24'
    },
    {
      key: 'actions',
      header: 'Actions',
      sortable: false,
      render: (_, row) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleViewStudents(row)}>
              <Eye className="mr-2 h-4 w-4" />
              View Students
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleViewSchools(row)}>
              <School className="mr-2 h-4 w-4" />
              View Schools
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => handleRemoveEducator(row.assignmentId)}
              className="text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Remove Educator
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      width: 'w-16'
    }
  ];

  // Handle pagination changes
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1); // Reset to first page when changing limit
  };

  const handleSearch = (searchValue: string) => {
    setSearchTerm(searchValue);
    setPage(1); // Reset to first page when searching
  };

  return (
    <PageWrapper
      title="Center Educators"
      description="Manage special educators assigned to your center"
      breadcrumbs={[{ label: 'Center', href: '/center' }, { label: 'Educators' }]}
      actions={
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetchEducators()} disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => { loadAvailableEducators(); setShowLinkModal(true); }}>
            <UserCheck className="h-4 w-4 mr-2" />
            Link Educator
          </Button>
        </div>
      }
    >

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Educators</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{educators.length}</div>
            <p className="text-xs text-muted-foreground">
              Special educators assigned
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {educators.reduce((sum, educator) => sum + educator.assignedStudentCount, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Students under care
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Assignments</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {educators.filter(educator => educator.isActive).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently active
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Assigned Educators</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={educators}
            columns={columns}
            loading={loading}
            pagination={{
              page,
              limit,
              total: educatorsPagination?.total || 0,
              onPageChange: handlePageChange,
              onLimitChange: handleLimitChange
            }}
            searchable={true}
            onSearch={handleSearch}
            emptyMessage="No educators assigned to this center"
          />
        </CardContent>
      </Card>

      {/* Add Educator Modal */}
      <Dialog open={showLinkModal} onOpenChange={setShowLinkModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Link Special Educator</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search educators by name, email, or specialization..."
                value={availableSearchTerm}
                onChange={(e) => setAvailableSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {loadingAvailable ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-primary border-t-transparent"></div>
                <span className="ml-2">Loading available educators...</span>
              </div>
            ) : filteredAvailableEducators.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No available educators found
              </div>
            ) : (
              <div className="grid gap-4 max-h-96 overflow-y-auto">
                {filteredAvailableEducators.map((educator) => (
                  <div key={educator.id} className="border rounded-lg p-4 hover:bg-muted/40">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-semibold text-lg">{educator.fullName}</h3>
                          <Badge variant="outline">{educator.specialization || 'Special Educator'}</Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground mb-3">
                          <div className="flex items-center">
                            <Mail className="h-4 w-4 mr-2" />
                            {educator.email}
                          </div>
                          {educator.phoneNumber && (
                            <div className="flex items-center">
                              <Phone className="h-4 w-4 mr-2" />
                              {educator.phoneNumber}
                            </div>
                          )}
                          <div className="flex items-center">
                            <Award className="h-4 w-4 mr-2" />
                            {educator.yearsOfExperience || 0} years experience
                          </div>
                          <div className="flex items-center">
                            <BookOpen className="h-4 w-4 mr-2" />
                            {educator.qualifications?.length || 0} qualifications
                          </div>
                        </div>

                        {/* Assignment Statistics */}
                        <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground mb-3">
                          <div className="flex items-center justify-center p-2 bg-muted/40 rounded">
                            <Building className="h-3 w-3 mr-1" />
                            {educator.centerCount || 0} Centers
                          </div>
                          <div className="flex items-center justify-center p-2 bg-muted/40 rounded">
                            <School className="h-3 w-3 mr-1" />
                            {educator.schoolCount || 0} Schools
                          </div>
                          <div className="flex items-center justify-center p-2 bg-muted/40 rounded">
                            <Users className="h-3 w-3 mr-1" />
                            {educator.studentCount || 0} Students
                          </div>
                        </div>

                        {educator.specializationAreas && educator.specializationAreas.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {educator.specializationAreas.map((area, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {area}
                              </Badge>
                            ))}
                          </div>
                        )}

                        {educator.bio && (
                          <p className="text-sm text-muted-foreground mt-2">{educator.bio}</p>
                        )}
                      </div>
                      
                      <Button
                        onClick={() => handleAssignEducator(educator.id)}
                        disabled={isAssigning}
                        className="ml-4"
                      >
                        {isAssigning ? 'Assigning...' : 'Assign'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Students Modal */}
      <Dialog open={showStudentsModal} onOpenChange={setShowStudentsModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Assigned Students</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {selectedEducatorStudents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No students assigned to this educator
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>School</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedEducatorStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{student.fullName}</TableCell>
                      <TableCell>{student.grade}</TableCell>
                      <TableCell>{student.schoolName}</TableCell>
                      <TableCell>
                        <Badge variant={student.status === 'Active' ? 'default' : 'secondary'}>
                          {student.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Schools Modal */}
      <Dialog open={showSchoolsModal} onOpenChange={setShowSchoolsModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Associated Schools</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {selectedEducatorSchools.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No schools associated with this educator
              </div>
            ) : (
              <div className="grid gap-4">
                {selectedEducatorSchools.map((school) => (
                  <div key={school.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{school.schoolName}</h3>
                        <p className="text-sm text-muted-foreground">{school.studentCount} students</p>
                      </div>
                      <Building className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Specializations Modal */}
      <Dialog open={showSpecializationsModal} onOpenChange={setShowSpecializationsModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              Specializations - {selectedEducatorSpecializations.name}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {selectedEducatorSpecializations.specializations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Award className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p>No specializations listed for this educator</p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground mb-4">
                  This educator specializes in the following areas:
                </p>
                <div className="grid gap-2">
                  {selectedEducatorSpecializations.specializations.map((specialization, index) => (
                    <div 
                      key={index} 
                      className="flex items-center gap-3 p-3 bg-primary/10 border border-primary/20 rounded-lg hover:bg-primary/10 transition-colors"
                    >
                      <BookOpen className="h-4 w-4 text-primary flex-shrink-0" />
                      <span className="text-sm font-medium text-blue-900">{specialization}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-xs text-muted-foreground text-center">
                    Total: {selectedEducatorSpecializations.specializations.length} specialization{selectedEducatorSpecializations.specializations.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      
    </PageWrapper>
  );
}
