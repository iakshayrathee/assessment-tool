'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/ui/page-header';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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

  const loadSchools = async () => {
    try {
      setLoading(true);
      const centerId = user?.profile?.id;
      if (!centerId) return;

      const schoolsData = await apiClient.getCenterSchools(centerId);
      
      // Transform backend data to match frontend interface
      const transformedSchools = schoolsData.map((school: any) => ({
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

    if (!formData.name.trim()) {
      newErrors.name = 'School name is required';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }

    if (!formData.principalName.trim()) {
      newErrors.principalName = 'Principal name is required';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (formData.phone && !/^[\+]?[0-9\-\s\(\)]{10,}$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
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
      const centerId = user?.profile?.id;
      if (!centerId) {
        throw new Error('Center ID not found');
      }

      await apiClient.linkSchoolToCenter(centerId, {
        name: formData.name.trim(),
        address: formData.address.trim(),
        phone: formData.phone.trim() || undefined,
        email: formData.email.trim() || undefined,
        principalName: formData.principalName.trim()
      });

      toast({
        title: "Success",
        description: "School linked successfully!",
      });

      // Reset form and close modal
      setFormData({
        name: '',
        address: '',
        phone: '',
        email: '',
        principalName: ''
      });
      setErrors({});
      setShowLinkModal(false);
      
      // Reload schools
      loadSchools();
    } catch (error: any) {
      console.error('Failed to link school:', error);
      // Handle specific error cases
      if (error.response?.data?.error?.includes('already exists')) {
        setErrors({ name: 'A school with this name already exists in your center' });
      } else {
        setErrors({ name: 'Failed to link school. Please try again.' });
      }
    } finally {
      setLinkingSchool(false);
    }
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
      ACTIVE: { label: 'Active', variant: 'default' as const, className: 'bg-green-100 text-green-800' },
      INACTIVE: { label: 'Inactive', variant: 'secondary' as const, className: 'bg-gray-100 text-gray-800' },
      PENDING: { label: 'Pending', variant: 'outline' as const, className: 'bg-yellow-100 text-yellow-800' },
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading schools...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="">
      <PageHeader
        title="Schools Management"
        description="Manage schools linked to your center"
        badge={{
          text: `${schools.length} Schools`,
          variant: 'secondary'
        }}
        actions={[
          {
            label: 'Refresh',
            onClick: loadSchools,
            icon: RefreshCw,
            variant: 'outline'
          },
          {
            label: 'Link New School',
            onClick: () => setShowLinkModal(true),
            icon: Plus
          }
        ]}
      />

      <div className="p-6 space-y-6">
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
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalStudents}</div>
              <p className="text-xs text-muted-foreground">Across all schools</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Students</CardTitle>
              <Users className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalActiveStudents}</div>
              <p className="text-xs text-muted-foreground">Currently enrolled</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Students/School</CardTitle>
              <Building className="h-4 w-4 text-purple-600" />
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
              <School className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
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
                <School className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {searchTerm ? 'No schools found' : 'No schools linked yet'}
                </h3>
                <p className="text-gray-600 mb-6">
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
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <School className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{school.name}</div>
                              <div className="text-sm text-gray-500">
                                Linked {new Date(school.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <span>{school.principalName || 'Not specified'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {school.phone && (
                              <div className="flex items-center space-x-2 text-sm">
                                <Phone className="h-3 w-3 text-gray-400" />
                                <span>{school.phone}</span>
                              </div>
                            )}
                            {school.email && (
                              <div className="flex items-center space-x-2 text-sm">
                                <Mail className="h-3 w-3 text-gray-400" />
                                <span className="truncate max-w-[150px]">{school.email}</span>
                              </div>
                            )}
                            {!school.phone && !school.email && (
                              <span className="text-gray-500 text-sm">No contact info</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-start space-x-2 max-w-[200px]">
                            <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                            <span className="text-sm line-clamp-2">{school.address || 'Not specified'}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="font-semibold text-blue-600">{school.studentCount}</div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="font-semibold text-green-600">{school.activeStudentCount}</div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="font-semibold text-purple-600">{school.viewerCount}</div>
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
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => {
                                // Handle edit action
                                toast({
                                  title: "Coming Soon",
                                  description: "Edit functionality will be available soon.",
                                });
                              }}>
                                <User className="h-4 w-4 mr-2" />
                                Edit School
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Link School Modal */}
      <Dialog open={showLinkModal} onOpenChange={setShowLinkModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <School className="h-5 w-5 text-blue-600" />
              <span>Link New School</span>
            </DialogTitle>
            <DialogDescription>
              Enter the details of the school you want to link to your center
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* School Name */}
            <div className="space-y-2">
              <Label htmlFor="modal-name" className="text-sm font-medium">
                School Name *
              </Label>
              <Input
                id="modal-name"
                type="text"
                placeholder="Enter school name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && (
                <p className="text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            {/* Address */}
            <div className="space-y-2">
              <Label htmlFor="modal-address" className="text-sm font-medium flex items-center">
                <MapPin className="h-4 w-4 mr-1" />
                Address *
              </Label>
              <Textarea
                id="modal-address"
                placeholder="Enter complete school address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                className={errors.address ? 'border-red-500' : ''}
                rows={3}
              />
              {errors.address && (
                <p className="text-sm text-red-600">{errors.address}</p>
              )}
            </div>

            {/* Principal Name */}
            <div className="space-y-2">
              <Label htmlFor="modal-principal" className="text-sm font-medium flex items-center">
                <User className="h-4 w-4 mr-1" />
                Principal Name *
              </Label>
              <Input
                id="modal-principal"
                type="text"
                placeholder="Enter principal's full name"
                value={formData.principalName}
                onChange={(e) => handleInputChange('principalName', e.target.value)}
                className={errors.principalName ? 'border-red-500' : ''}
              />
              {errors.principalName && (
                <p className="text-sm text-red-600">{errors.principalName}</p>
              )}
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="modal-phone" className="text-sm font-medium flex items-center">
                  <Phone className="h-4 w-4 mr-1" />
                  Phone Number
                </Label>
                <Input
                  id="modal-phone"
                  type="tel"
                  placeholder="+91-11-12345678"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className={errors.phone ? 'border-red-500' : ''}
                />
                {errors.phone && (
                  <p className="text-sm text-red-600">{errors.phone}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="modal-email" className="text-sm font-medium flex items-center">
                  <Mail className="h-4 w-4 mr-1" />
                  Email Address
                </Label>
                <Input
                  id="modal-email"
                  type="email"
                  placeholder="school@example.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && (
                  <p className="text-sm text-red-600">{errors.email}</p>
                )}
              </div>
            </div>

            <div className="text-sm text-gray-600">
              * Required fields
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowLinkModal(false);
                setFormData({
                  name: '',
                  address: '',
                  phone: '',
                  email: '',
                  principalName: ''
                });
                setErrors({});
              }}
              disabled={linkingSchool}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleLinkSchool}
              disabled={linkingSchool}
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
              <School className="h-5 w-5 text-blue-600" />
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
                      <Label className="text-sm font-medium text-gray-600">School Name</Label>
                      <p className="text-lg font-semibold">{selectedSchool.name}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Principal</Label>
                      <p className="text-lg">{selectedSchool.principalName || 'Not specified'}</p>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Address</Label>
                    <p className="text-base">{selectedSchool.address || 'Not specified'}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Phone</Label>
                      <p className="text-base">{selectedSchool.phone || 'Not specified'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Email</Label>
                      <p className="text-base">{selectedSchool.email || 'Not specified'}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Linked Date</Label>
                      <p className="text-base">{formatDate(selectedSchool.createdAt)}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Last Updated</Label>
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
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-blue-600">{selectedSchool.studentCount}</div>
                      <div className="text-sm text-gray-600">Total Students</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <UserCheck className="h-8 w-8 text-green-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-green-600">{selectedSchool.activeStudentCount}</div>
                      <div className="text-sm text-gray-600">Active Students</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <Eye className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-purple-600">{selectedSchool.viewerCount}</div>
                      <div className="text-sm text-gray-600">School Viewers</div>
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
                        <div key={student.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <GraduationCap className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium">{student.fullName}</p>
                              <p className="text-sm text-gray-600">Grade {student.grade}</p>
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
              <Users className="h-5 w-5 text-blue-600" />
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
                      <Users className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="text-2xl font-bold">{selectedSchool.studentCount}</p>
                        <p className="text-sm text-gray-600">Total Students</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <UserCheck className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="text-2xl font-bold text-green-600">{selectedSchool.activeStudentCount}</p>
                        <p className="text-sm text-gray-600">Active Students</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-5 w-5 text-orange-600" />
                      <div>
                        <p className="text-2xl font-bold text-orange-600">
                          {selectedSchool.studentCount - selectedSchool.activeStudentCount}
                        </p>
                        <p className="text-sm text-gray-600">Inactive Students</p>
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
                                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                    <GraduationCap className="h-4 w-4 text-blue-600" />
                                  </div>
                                  <span className="font-medium">{student.fullName}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">Grade {student.grade}</Badge>
                              </TableCell>
                              <TableCell>
                                {getStatusBadge(student.status)}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center space-x-2">
                                  <Calendar className="h-4 w-4 text-gray-400" />
                                  <span>{student.registrationDate ? formatDate(student.registrationDate) : 'N/A'}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                {student.hasAssignment ? (
                                  <Badge className="bg-green-100 text-green-800">
                                    <UserCheck className="h-3 w-3 mr-1" />
                                    Assigned
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-orange-600">
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
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Students Enrolled</h3>
                    <p className="text-gray-600">This school doesn't have any students enrolled yet.</p>
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
    </div>
  );
}
