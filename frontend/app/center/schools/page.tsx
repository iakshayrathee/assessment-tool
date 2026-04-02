'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  School,
  Plus,
  Users,
  MapPin,
  Phone,
  Mail,
  User,
  Eye,
  RefreshCw,
  Building,
  Save,
  MoreHorizontal,
  Calendar,
  GraduationCap,
  UserCheck,
  Clock
} from 'lucide-react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { GradeDisplay } from '@/components/ui/GradeDisplay';

interface SchoolData {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  principalName?: string;
  centerId: string;
  createdAt: string;
  updatedAt: string;
  studentCount: number;
  activeStudentCount: number;
  viewerCount: number;
  students: Array<{
    id: string;
    fullName: string;
    status: string;
    grade: string;
    registrationDate?: string;
    hasAssignment?: boolean;
  }>;
  viewers: Array<{
    id: string;
    fullName: string;
    position?: string;
    user: {
      email: string;
      isActive: boolean;
    };
  }>;
}

interface SchoolFormData {
  name: string;
  address: string;
  phone: string;
  email: string;
  principalName: string;
}

export default function CenterSchools() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [schools, setSchools] = useState<SchoolData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkingSchool, setLinkingSchool] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalSchools, setTotalSchools] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Unlinked schools search state
  const [unlinkedSchools, setUnlinkedSchools] = useState<any[]>([]);
  const [unlinkedSearchTerm, setUnlinkedSearchTerm] = useState('');
  const [unlinkedCurrentPage, setUnlinkedCurrentPage] = useState(1);
  const [unlinkedTotalPages, setUnlinkedTotalPages] = useState(1);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(null);
  const [searchingSchools, setSearchingSchools] = useState(false);
  const [formData, setFormData] = useState<SchoolFormData>({
    name: '',
    address: '',
    phone: '',
    email: '',
    principalName: ''
  });
  const [errors, setErrors] = useState<Partial<SchoolFormData>>({});

  // Modal states
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showStudentsModal, setShowStudentsModal] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState<SchoolData | null>(null);

  useEffect(() => {
    loadSchools();
  }, []);

  // Debounced search effect
  useEffect(() => {
    const handler = setTimeout(() => {
      setCurrentPage(1); // Reset to first page when search changes
      loadSchools(1, itemsPerPage, searchTerm);
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  // Search unlinked schools when modal opens or search term changes
  useEffect(() => {
    if (showLinkModal) {
      const handler = setTimeout(() => {
        searchUnlinkedSchools(1, unlinkedSearchTerm);
      }, 300);

      return () => {
        clearTimeout(handler);
      };
    }
  }, [showLinkModal, unlinkedSearchTerm]);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    loadSchools(page, itemsPerPage, searchTerm);
  };

  // Search for unlinked schools
  const searchUnlinkedSchools = async (page = 1, search = '') => {
    try {
      setSearchingSchools(true);

      // Use the actual backend API to get unlinked schools
      const response = await apiClient.getUnlinkedSchools({
        page,
        limit: 10, // Show 10 schools per page
        search: search || undefined
      });

      setUnlinkedSchools(response.data);
      setUnlinkedTotalPages(response.pagination.totalPages);
      setUnlinkedCurrentPage(response.pagination.page);

    } catch (error) {
      console.error('Failed to search unlinked schools:', error);
      setUnlinkedSchools([]);
    } finally {
      setSearchingSchools(false);
    }
  };

  // Handle unlinked school selection
  const handleSchoolSelect = (school: any) => {
    setSelectedSchoolId(school.id);
    setFormData(prev => ({
      ...prev,
      name: school.name,
      address: school.address || '',
      phone: school.phone || '',
      email: school.email || '',
      principalName: school.principalName || ''
    }));
    // Clear any previous errors
    setErrors({});
  };

  const loadSchools = async (page = currentPage, limit = itemsPerPage, search = searchTerm) => {
    try {
      setLoading(true);
      // For CENTER role, the profile.id IS the centerProfile.id
      const centerId = user?.profile?.id || user?.centerProfile?.id;
      if (!centerId) return;

      const response = await apiClient.getCenterSchools(centerId, {
        page,
        limit,
        search: search || undefined
      });

      // Transform backend data to match frontend interface
      const transformedSchools = response.data.map((school: any) => ({
        id: school.id,
        name: school.name,
        address: school.address,
        phone: school.phone,
        email: school.email,
        principalName: school.principalName,
        centerId: school.centerId,
        createdAt: school.createdAt,
        updatedAt: school.updatedAt,
        studentCount: school.students?.length || 0,
        activeStudentCount: school.students?.filter((s: any) => s.status === 'ACTIVE').length || 0,
        viewerCount: school.viewers?.length || 0,
        students: school.students?.map((student: any) => ({
          id: student.id,
          fullName: student.fullName,
          status: student.status,
          grade: student.grade,
          registrationDate: student.registrationDate,
          hasAssignment: student.hasAssignment
        })) || [],
        viewers: school.viewers?.map((viewer: any) => ({
          id: viewer.id,
          fullName: viewer.fullName,
          position: viewer.position,
          user: {
            email: viewer.user?.email || viewer.email,
            isActive: viewer.user?.isActive ?? true
          }
        })) || []
      }));

      setSchools(transformedSchools);
      setTotalSchools(response.pagination?.total || 0);
      setTotalPages(response.pagination?.totalPages || 1);
    } catch (error) {
      console.error('Failed to load schools:', error);
      setSchools([]);
      toast({
        title: "Error",
        description: "Failed to load schools. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof SchoolFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<SchoolFormData> = {};

    if (!selectedSchoolId) {
      newErrors.name = 'Please select a school from the list above';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLinkSchool = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLinkingSchool(true);
      // For CENTER role, the profile.id IS the centerProfile.id
      const centerId = user?.profile?.id || user?.centerProfile?.id;
      if (!centerId) {
        toast({
          title: "Error",
          description: "Center ID not found. Please refresh and try again.",
          variant: "destructive"
        });
        return;
      }

      if (!selectedSchoolId) {
        setErrors({ name: 'Please select a school from the list above' });
        return;
      }

      // Link the selected school to the center
      await apiClient.linkSchoolToCenter(centerId, selectedSchoolId);

      toast({
        title: "Success",
        description: "School linked successfully!",
      });

      // Reset form and close modal
      resetModalState();
      setShowLinkModal(false);

      // Reload schools
      loadSchools();
    } catch (error: any) {
      console.error('Failed to link school:', error);
      // Handle specific error cases
      if (error.response?.data?.error?.includes('already linked')) {
        toast({
          title: "Error",
          description: "This school is already linked to your center",
          variant: "destructive"
        });
      } else if (error.response?.data?.error?.includes('not found')) {
        toast({
          title: "Error",
          description: "School not found. Please try again.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to link school. Please try again.",
          variant: "destructive"
        });
      }
    } finally {
      setLinkingSchool(false);
    }
  };

  // Reset modal state
  const resetModalState = () => {
    setFormData({
      name: '',
      address: '',
      phone: '',
      email: '',
      principalName: ''
    });
    setErrors({});
    setSelectedSchoolId(null);
    setUnlinkedSchools([]);
    setUnlinkedSearchTerm('');
    setUnlinkedCurrentPage(1);
    setUnlinkedTotalPages(1);
  };

  const handleViewDetails = (school: SchoolData) => {
    setSelectedSchool(school);
    setShowDetailsModal(true);
  };

  const handleViewStudents = (school: SchoolData) => {
    setSelectedSchool(school);
    setShowStudentsModal(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      ACTIVE: { label: 'Active', variant: 'default' as const, className: 'bg-success/10 text-foreground' },
      INACTIVE: { label: 'Inactive', variant: 'secondary' as const, className: 'bg-muted text-foreground' },
      PENDING: { label: 'Pending', variant: 'outline' as const, className: 'bg-warning/10 text-foreground' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.INACTIVE;

    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const filteredSchools = schools.filter(school =>
    school.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    school.principalName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    school.address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalStudents = schools.reduce((acc, school) => acc + school.studentCount, 0);
  const totalActiveStudents = schools.reduce((acc, school) => acc + school.activeStudentCount, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading schools...</p>
        </div>
      </div>
    );
  }

  return (
    <PageWrapper
      title="Schools Management"
      description="Manage schools linked to your center"
      breadcrumbs={[{ label: 'Center', href: '/center' }, { label: 'Schools' }]}
      actions={
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadSchools}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setShowLinkModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Link New School
          </Button>
        </div>
      }
    >
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Linked Schools</CardTitle>
              <School className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{schools.length}</div>
              <p className="text-xs text-muted-foreground">Partner schools</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalStudents}</div>
              <p className="text-xs text-muted-foreground">Across all schools</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Students</CardTitle>
              <Users className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalActiveStudents}</div>
              <p className="text-xs text-muted-foreground">Currently enrolled</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Students/School</CardTitle>
              <Building className="h-4 w-4 text-info" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {schools.length > 0 ? Math.round(totalStudents / schools.length) : 0}
              </div>
              <p className="text-xs text-muted-foreground">Average enrollment</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="relative max-w-md">
              <School className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search schools..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Schools Table */}
        <Card>
          <CardHeader>
            <CardTitle>Schools ({filteredSchools.length})</CardTitle>
            <CardDescription>
              All schools linked to your center
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredSchools.length === 0 ? (
              <div className="text-center py-12">
                <School className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {searchTerm ? 'No schools found' : 'No schools linked yet'}
                </h3>
                <p className="text-muted-foreground mb-6">
                  {searchTerm
                    ? 'Try adjusting your search terms'
                    : 'Start by linking your first school to the center'
                  }
                </p>
                {!searchTerm && (
                  <Button onClick={() => setShowLinkModal(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Link New School
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>School Name</TableHead>
                      <TableHead>Principal</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead className="text-center">Students</TableHead>
                      <TableHead className="text-center">Active</TableHead>
                      <TableHead className="text-center">Viewers</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSchools.map((school) => (
                      <TableRow key={school.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                              <School className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <div className="font-medium text-foreground">{school.name}</div>
                              <div className="text-sm text-muted-foreground">
                                Linked {new Date(school.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span>{school.principalName || 'Not specified'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {school.phone && (
                              <div className="flex items-center space-x-2 text-sm">
                                <Phone className="h-3 w-3 text-muted-foreground" />
                                <span>{school.phone}</span>
                              </div>
                            )}
                            {school.email && (
                              <div className="flex items-center space-x-2 text-sm">
                                <Mail className="h-3 w-3 text-muted-foreground" />
                                <span className="truncate max-w-[150px]">{school.email}</span>
                              </div>
                            )}
                            {!school.phone && !school.email && (
                              <span className="text-muted-foreground text-sm">No contact info</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-start space-x-2 max-w-[200px]">
                            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <span className="text-sm line-clamp-2">{school.address || 'Not specified'}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="font-semibold text-primary">{school.studentCount}</div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="font-semibold text-success">{school.activeStudentCount}</div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="font-semibold text-info">{school.viewerCount}</div>
                        </TableCell>
                        <TableCell className="text-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewDetails(school)}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleViewStudents(school)}>
                                <Users className="h-4 w-4 mr-2" />
                                View Students
                              </DropdownMenuItem>

                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-6 flex justify-center">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            onClick={() => handlePageChange(currentPage - 1)}
                            className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                          />
                        </PaginationItem>

                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <PaginationItem key={page}>
                            <PaginationLink
                              isActive={page === currentPage}
                              onClick={() => handlePageChange(page)}
                              className="cursor-pointer"
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        ))}

                        <PaginationItem>
                          <PaginationNext
                            onClick={() => handlePageChange(currentPage + 1)}
                            className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

      {/* Link School Modal */}
      <Dialog open={showLinkModal} onOpenChange={setShowLinkModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <School className="h-5 w-5 text-primary" />
              <span>Link Existing School</span>
            </DialogTitle>
            <DialogDescription>
              Search and select an existing school to link it to your center
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* School Search */}
            <div className="space-y-2">
              <Label htmlFor="modal-search" className="text-sm font-medium">
                Search Schools
              </Label>
              <Input
                id="modal-search"
                type="text"
                placeholder="Search for schools by name..."
                value={unlinkedSearchTerm}
                onChange={(e) => setUnlinkedSearchTerm(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Search for schools that are not currently linked to any center
              </p>
            </div>

            {/* School List */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Select School *
              </Label>

              {searchingSchools ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-primary border-t-transparent"></div>
                </div>
              ) : unlinkedSchools.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  {unlinkedSearchTerm ? 'No schools found matching your search' : 'No unlinked schools available'}
                </div>
              ) : (
                <div className="border rounded-lg divide-y">
                  {unlinkedSchools.map((school) => (
                    <div
                      key={school.id}
                      className={`p-3 cursor-pointer hover:bg-muted/40 transition-colors border-l-4 ${selectedSchoolId === school.id
                        ? 'bg-primary/10 border-l-blue-500 border-primary/20'
                        : 'border-l-transparent'
                        }`}
                      onClick={() => handleSchoolSelect(school)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium flex items-center gap-2">
                            {school.name}
                            {selectedSchoolId === school.id && (
                              <Badge className="bg-primary text-white text-xs">Selected</Badge>
                            )}
                          </div>
                          {school.address && (
                            <div className="text-sm text-muted-foreground mt-1">{school.address}</div>
                          )}
                          {(school.phone || school.email) && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {school.phone && <span>Phone: {school.phone}</span>}
                              {school.phone && school.email && <span className="mx-1">•</span>}
                              {school.email && <span>Email: {school.email}</span>}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination for unlinked schools */}
              {unlinkedTotalPages > 1 && (
                <div className="flex justify-center mt-2">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => searchUnlinkedSchools(unlinkedCurrentPage - 1, unlinkedSearchTerm)}
                          className={unlinkedCurrentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>

                      {Array.from({ length: unlinkedTotalPages }, (_, i) => i + 1).map((page) => (
                        <PaginationItem key={page}>
                          <PaginationLink
                            isActive={page === unlinkedCurrentPage}
                            onClick={() => searchUnlinkedSchools(page, unlinkedSearchTerm)}
                            className="cursor-pointer"
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      ))}

                      <PaginationItem>
                        <PaginationNext
                          onClick={() => searchUnlinkedSchools(unlinkedCurrentPage + 1, unlinkedSearchTerm)}
                          className={unlinkedCurrentPage === unlinkedTotalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}

              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </div>

            <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <School className="h-5 w-5 text-primary mt-0.5" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-blue-900 mb-1">How linking works</h4>
                  <p className="text-xs text-primary">
                    Centers can only link existing schools. If you need to add a new school to the system,
                    please contact your administrator or support team.
                  </p>
                </div>
              </div>
            </div>

            <div className="text-sm text-muted-foreground">
              * Required field
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowLinkModal(false);
                resetModalState();
              }}
              disabled={linkingSchool}
            >
              Cancel
            </Button>
            <Button
              onClick={handleLinkSchool}
              disabled={linkingSchool || !selectedSchoolId}
            >
              {linkingSchool ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Linking School...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Link School
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* School Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <School className="h-5 w-5 text-primary" />
              <span>School Details</span>
            </DialogTitle>
            <DialogDescription>
              Complete information about {selectedSchool?.name}
            </DialogDescription>
          </DialogHeader>

          {selectedSchool && (
            <div className="space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">School Name</Label>
                      <p className="text-lg font-semibold">{selectedSchool.name}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Principal</Label>
                      <p className="text-lg">{selectedSchool.principalName || 'Not specified'}</p>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Address</Label>
                    <p className="text-base">{selectedSchool.address || 'Not specified'}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Phone</Label>
                      <p className="text-base">{selectedSchool.phone || 'Not specified'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                      <p className="text-base">{selectedSchool.email || 'Not specified'}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Linked Date</Label>
                      <p className="text-base">{formatDate(selectedSchool.createdAt)}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Last Updated</Label>
                      <p className="text-base">{formatDate(selectedSchool.updatedAt)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center p-4 bg-primary/10 rounded-lg">
                      <Users className="h-8 w-8 text-primary mx-auto mb-2" />
                      <div className="text-2xl font-bold text-primary">{selectedSchool.studentCount}</div>
                      <div className="text-sm text-muted-foreground">Total Students</div>
                    </div>
                    <div className="text-center p-4 bg-success/10 rounded-lg">
                      <UserCheck className="h-8 w-8 text-success mx-auto mb-2" />
                      <div className="text-2xl font-bold text-success">{selectedSchool.activeStudentCount}</div>
                      <div className="text-sm text-muted-foreground">Active Students</div>
                    </div>
                    <div className="text-center p-4 bg-info/10 rounded-lg">
                      <Eye className="h-8 w-8 text-info mx-auto mb-2" />
                      <div className="text-2xl font-bold text-info">{selectedSchool.viewerCount}</div>
                      <div className="text-sm text-muted-foreground">School Viewers</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Students Preview */}
              {selectedSchool.students.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Recent Students</CardTitle>
                    <CardDescription>
                      Latest {Math.min(5, selectedSchool.students.length)} students enrolled
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {selectedSchool.students.slice(0, 5).map((student) => (
                        <div key={student.id} className="flex items-center justify-between p-3 bg-muted/40 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                              <GraduationCap className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{student.fullName}</p>
                              <p className="text-sm text-muted-foreground"><GradeDisplay grade={student.grade} /></p>
                            </div>
                          </div>
                          <div className="text-right">
                            {getStatusBadge(student.status)}
                          </div>
                        </div>
                      ))}
                      {selectedSchool.students.length > 5 && (
                        <div className="text-center py-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setShowDetailsModal(false);
                              handleViewStudents(selectedSchool);
                            }}
                          >
                            View All {selectedSchool.students.length} Students
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailsModal(false)}>
              Close
            </Button>
            <Button onClick={() => {
              setShowDetailsModal(false);
              if (selectedSchool) {
                handleViewStudents(selectedSchool);
              }
            }}>
              <Users className="h-4 w-4 mr-2" />
              View Students
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Students Modal */}
      <Dialog open={showStudentsModal} onOpenChange={setShowStudentsModal}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-primary" />
              <span>Students - {selectedSchool?.name}</span>
            </DialogTitle>
            <DialogDescription>
              All students enrolled in {selectedSchool?.name}
            </DialogDescription>
          </DialogHeader>

          {selectedSchool && (
            <div className="space-y-6">
              {/* Students Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <Users className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-2xl font-bold">{selectedSchool.studentCount}</p>
                        <p className="text-sm text-muted-foreground">Total Students</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <UserCheck className="h-5 w-5 text-success" />
                      <div>
                        <p className="text-2xl font-bold text-success">{selectedSchool.activeStudentCount}</p>
                        <p className="text-sm text-muted-foreground">Active Students</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-5 w-5 text-warning" />
                      <div>
                        <p className="text-2xl font-bold text-warning">
                          {selectedSchool.studentCount - selectedSchool.activeStudentCount}
                        </p>
                        <p className="text-sm text-muted-foreground">Inactive Students</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Students Table */}
              {selectedSchool.students.length > 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Students List</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Student Name</TableHead>
                            <TableHead>Grade</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Registration Date</TableHead>
                            <TableHead>Assignment</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedSchool.students.map((student) => (
                            <TableRow key={student.id}>
                              <TableCell>
                                <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                                    <GraduationCap className="h-4 w-4 text-primary" />
                                  </div>
                                  <span className="font-medium">{student.fullName}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline"><GradeDisplay grade={student.grade} /></Badge>
                              </TableCell>
                              <TableCell>
                                {getStatusBadge(student.status)}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center space-x-2">
                                  <Calendar className="h-4 w-4 text-muted-foreground" />
                                  <span>{student.registrationDate ? formatDate(student.registrationDate) : 'N/A'}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                {student.hasAssignment ? (
                                  <Badge className="bg-success/10 text-foreground">
                                    <UserCheck className="h-3 w-3 mr-1" />
                                    Assigned
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-warning">
                                    <Clock className="h-3 w-3 mr-1" />
                                    Pending
                                  </Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="text-center py-12">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">No Students Enrolled</h3>
                    <p className="text-muted-foreground">This school doesn't have any students enrolled yet.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStudentsModal(false)}>
              Close
            </Button>
            <Button onClick={() => {
              setShowStudentsModal(false);
              if (selectedSchool) {
                handleViewDetails(selectedSchool);
              }
            }}>
              <Eye className="h-4 w-4 mr-2" />
              View School Details
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
}
