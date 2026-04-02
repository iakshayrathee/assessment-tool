'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Users, 
  Search,
  ArrowLeft,
  Eye,
  Plus,
  Filter,
  Mail,
  Phone,
  MapPin,
  Calendar,
  GraduationCap,
  Award,
  Building2,
  ChevronLeft,
  ChevronRight,
  Edit,
  Trash2,
  MoreHorizontal
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { useSuperSpecialEducatorSpecialEducators } from '@/hooks/useSuperSpecialEducator';

interface SpecialEducator {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  specialization: string[];
  yearsOfExperience?: number;
  rciCertified: boolean;
  assignedStudents: number;
  pendingReports: number;
  centerName: string;
  status: 'active' | 'inactive';
  lastLogin?: string;
  createdAt: string;
}

interface CreateEducatorForm {
  email: string;
  password: string;
  confirmPassword: string;
  profileData: {
    fullName: string;
    phone: string;
    dateOfBirth: string;
    gender: string;
    address: string;
    primaryLanguage: string;
    secondaryLanguages: string[];
    highestQualification: string;
    fieldOfStudy: string;
    institutionName: string;
    yearOfGraduation: number | null;
    rciCertified: boolean;
    rciValidityDate: string;
    specialEdQualification: string;
    specializationAreas: string[];
    yearsOfExperience: number | null;
    experienceTypes: string[];
    maxGroupSize: number | null;
    currentWorkLocations: string[];
    ldTypesHandled: string[];
    gradeLevelsServed: string[];
    assessmentTools: string;
    assistiveTechProficiency: string[];
    areasOfInterest: string[];
    consentToShare: boolean;
    agreementToPolicies: boolean;
    personalStatement: string;
  };
}

export default function EducatorsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [centerFilter, setCenterFilter] = useState<string>('all');
  
  // Create educator modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState<CreateEducatorForm>({
    email: '',
    password: '',
    confirmPassword: '',
    profileData: {
      fullName: '',
      phone: '',
      dateOfBirth: '',
      gender: '',
      address: '',
      primaryLanguage: '',
      secondaryLanguages: [],
      highestQualification: '',
      fieldOfStudy: '',
      institutionName: '',
      yearOfGraduation: null,
      rciCertified: false,
      rciValidityDate: '',
      specialEdQualification: '',
      specializationAreas: [],
      yearsOfExperience: null,
      experienceTypes: [],
      maxGroupSize: null,
      currentWorkLocations: [],
      ldTypesHandled: [],
      gradeLevelsServed: [],
      assessmentTools: '',
      assistiveTechProficiency: [],
      areasOfInterest: [],
      consentToShare: false,
      agreementToPolicies: false,
      personalStatement: ''
    }
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Use the hook for data fetching
  const {
    specialEducators,
    pagination,
    isLoading,
    isCreating,
    createSpecialEducator,
    error,
    refetch
  } = useSuperSpecialEducatorSpecialEducators({
    page,
    limit,
    search: searchTerm,
    status: statusFilter === 'all' ? undefined : statusFilter,
    centerId: centerFilter === 'all' ? undefined : centerFilter
  });

  // Check if we should open create modal from URL params
  useEffect(() => {
    if (searchParams.get('action') === 'create') {
      setShowCreateModal(true);
    }
  }, [searchParams]);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Basic validation
    if (!createForm.email) errors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(createForm.email)) errors.email = 'Invalid email format';
    
    if (!createForm.password) errors.password = 'Password is required';
    else if (createForm.password.length < 6) errors.password = 'Password must be at least 6 characters';
    
    if (createForm.password !== createForm.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    // Profile validation
    if (!createForm.profileData.fullName) errors.fullName = 'Full name is required';
    if (!createForm.profileData.specialEdQualification) errors.specialEdQualification = 'Special education qualification is required';
    if (createForm.profileData.specializationAreas.length === 0) errors.specializationAreas = 'At least one specialization area is required';
    if (!createForm.profileData.consentToShare) errors.consentToShare = 'Consent to share information is required';
    if (!createForm.profileData.agreementToPolicies) errors.agreementToPolicies = 'Agreement to policies is required';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateEducator = async () => {
    if (!validateForm()) return;

    try {
      await createSpecialEducator(createForm);
      setShowCreateModal(false);
      setCreateForm({
        email: '',
        password: '',
        confirmPassword: '',
        profileData: {
          fullName: '',
          phone: '',
          dateOfBirth: '',
          gender: '',
          address: '',
          primaryLanguage: '',
          secondaryLanguages: [],
          highestQualification: '',
          fieldOfStudy: '',
          institutionName: '',
          yearOfGraduation: null,
          rciCertified: false,
          rciValidityDate: '',
          specialEdQualification: '',
          specializationAreas: [],
          yearsOfExperience: null,
          experienceTypes: [],
          maxGroupSize: null,
          currentWorkLocations: [],
          ldTypesHandled: [],
          gradeLevelsServed: [],
          assessmentTools: '',
          assistiveTechProficiency: [],
          areasOfInterest: [],
          consentToShare: false,
          agreementToPolicies: false,
          personalStatement: ''
        }
      });
      setFormErrors({});
    } catch (error) {
      console.error('Failed to create educator:', error);
    }
  };

  const addToArray = (field: keyof CreateEducatorForm['profileData'], value: string) => {
    if (!value.trim()) return;
    const currentArray = (createForm.profileData[field] as string[]) || [];
    if (!currentArray.includes(value.trim())) {
      setCreateForm({
        ...createForm,
        profileData: {
          ...createForm.profileData,
          [field]: [...currentArray, value.trim()]
        }
      });
    }
  };

  const removeFromArray = (field: keyof CreateEducatorForm['profileData'], value: string) => {
    const currentArray = (createForm.profileData[field] as string[]) || [];
    setCreateForm({
      ...createForm,
      profileData: {
        ...createForm.profileData,
        [field]: currentArray.filter(item => item !== value)
      }
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <PageWrapper
      title="Special Educators"
      description="Manage and oversee Special Educators across your assigned centers"
      breadcrumbs={[{ label: 'Super Special Educator', href: '/super-special-educator' }, { label: 'Educators' }]}
      actions={
        <Button onClick={() => setShowCreateModal(true)} className="flex items-center">
          <Plus className="mr-2 h-4 w-4" />
          Add Special Educator
        </Button>
      }
    >

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="mr-2 h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search educators..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="center">Center</Label>
              <Select value={centerFilter} onValueChange={setCenterFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All centers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Centers</SelectItem>
                  <SelectItem value="center1">Sunshine Learning Center</SelectItem>
                  <SelectItem value="center2">Hope Special Education Center</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button variant="outline" onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setCenterFilter('all');
              }}>
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Educators Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Special Educators ({pagination?.total || 0})</CardTitle>
              <CardDescription>
                Manage Special Educators under your supervision
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Specialization</TableHead>
                  <TableHead>Experience</TableHead>
                  <TableHead>Students</TableHead>
                  <TableHead>Reports</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {specialEducators.map((educator: any) => (
                  <TableRow key={educator.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <Users className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">{educator.specialEducator?.fullName || 'N/A'}</div>
                          <div className="text-sm text-muted-foreground">{educator.center?.centerName}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center text-sm">
                          <Mail className="h-3 w-3 mr-1 text-muted-foreground" />
                          {educator.specialEducator?.user?.email || 'N/A'}
                        </div>
                        {educator.specialEducator?.phone && (
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Phone className="h-3 w-3 mr-1 text-muted-foreground" />
                            {educator.specialEducator.phone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {educator.specialEducator?.specializationAreas?.slice(0, 2).map((area: string, index: number) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {area}
                          </Badge>
                        ))}
                        {educator.specialEducator?.specializationAreas?.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{educator.specialEducator.specializationAreas.length - 2} more
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {educator.specialEducator?.yearsOfExperience ? (
                          <div className="flex items-center">
                            <Award className="h-3 w-3 mr-1 text-muted-foreground" />
                            {educator.specialEducator.yearsOfExperience} years
                          </div>
                        ) : (
                          'N/A'
                        )}
                        {educator.specialEducator?.rciCertified && (
                          <Badge variant="outline" className="text-xs mt-1">
                            RCI Certified
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-primary">
                          {educator.specialEducator?.assignedStudents?.length || 0}
                        </div>
                        <div className="text-xs text-muted-foreground">Students</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-center">
                        <Badge variant="destructive" className="text-xs">
                          {Math.floor(Math.random() * 5)} Pending
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={educator.isActive ? "default" : "secondary"}>
                        {educator.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, pagination.total)} of {pagination.total} results
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <div className="flex items-center space-x-1">
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                    .filter(pageNum => 
                      pageNum === 1 || 
                      pageNum === pagination.totalPages || 
                      (pageNum >= page - 1 && pageNum <= page + 1)
                    )
                    .map((pageNum, index, array) => (
                      <div key={pageNum} className="flex items-center">
                        {index > 0 && array[index - 1] !== pageNum - 1 && (
                          <span className="px-2 text-muted-foreground">...</span>
                        )}
                        <Button
                          variant={pageNum === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => setPage(pageNum)}
                        >
                          {pageNum}
                        </Button>
                      </div>
                    ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page >= pagination.totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Special Educator Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Special Educator</DialogTitle>
            <DialogDescription>
              Add a new Special Educator to your team. All fields marked with * are required.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Account Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Account Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    placeholder="educator@example.com"
                  />
                  {formErrors.email && <p className="text-sm text-destructive mt-1">{formErrors.email}</p>}
                </div>
                <div>
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={createForm.password}
                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                    placeholder="Minimum 6 characters"
                  />
                  {formErrors.password && <p className="text-sm text-destructive mt-1">{formErrors.password}</p>}
                </div>
                <div>
                  <Label htmlFor="confirmPassword">Confirm Password *</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={createForm.confirmPassword}
                    onChange={(e) => setCreateForm({ ...createForm, confirmPassword: e.target.value })}
                    placeholder="Re-enter password"
                  />
                  {formErrors.confirmPassword && <p className="text-sm text-destructive mt-1">{formErrors.confirmPassword}</p>}
                </div>
              </div>
            </div>

            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    value={createForm.profileData.fullName}
                    onChange={(e) => setCreateForm({
                      ...createForm,
                      profileData: { ...createForm.profileData, fullName: e.target.value }
                    })}
                    placeholder="Enter full name"
                  />
                  {formErrors.fullName && <p className="text-sm text-destructive mt-1">{formErrors.fullName}</p>}
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={createForm.profileData.phone}
                    onChange={(e) => setCreateForm({
                      ...createForm,
                      profileData: { ...createForm.profileData, phone: e.target.value }
                    })}
                    placeholder="Enter phone number"
                  />
                </div>
                <div>
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={createForm.profileData.dateOfBirth}
                    onChange={(e) => setCreateForm({
                      ...createForm,
                      profileData: { ...createForm.profileData, dateOfBirth: e.target.value }
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="gender">Gender</Label>
                  <Select
                    value={createForm.profileData.gender}
                    onValueChange={(value) => setCreateForm({
                      ...createForm,
                      profileData: { ...createForm.profileData, gender: value }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MALE">Male</SelectItem>
                      <SelectItem value="FEMALE">Female</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Professional Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Professional Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="specialEdQualification">Special Education Qualification *</Label>
                  <Input
                    id="specialEdQualification"
                    value={createForm.profileData.specialEdQualification}
                    onChange={(e) => setCreateForm({
                      ...createForm,
                      profileData: { ...createForm.profileData, specialEdQualification: e.target.value }
                    })}
                    placeholder="e.g., M.Ed in Special Education"
                  />
                  {formErrors.specialEdQualification && <p className="text-sm text-destructive mt-1">{formErrors.specialEdQualification}</p>}
                </div>
                <div>
                  <Label htmlFor="yearsOfExperience">Years of Experience</Label>
                  <Input
                    id="yearsOfExperience"
                    type="number"
                    value={createForm.profileData.yearsOfExperience || ''}
                    onChange={(e) => setCreateForm({
                      ...createForm,
                      profileData: { ...createForm.profileData, yearsOfExperience: e.target.value ? parseInt(e.target.value) : null }
                    })}
                    placeholder="Enter years of experience"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="rciCertified"
                    checked={createForm.profileData.rciCertified}
                    onCheckedChange={(checked) => setCreateForm({
                      ...createForm,
                      profileData: { ...createForm.profileData, rciCertified: !!checked }
                    })}
                  />
                  <Label htmlFor="rciCertified">RCI Certified</Label>
                </div>
                {createForm.profileData.rciCertified && (
                  <div>
                    <Label htmlFor="rciValidityDate">RCI Validity Date</Label>
                    <Input
                      id="rciValidityDate"
                      type="date"
                      value={createForm.profileData.rciValidityDate}
                      onChange={(e) => setCreateForm({
                        ...createForm,
                        profileData: { ...createForm.profileData, rciValidityDate: e.target.value }
                      })}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Specialization Areas */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Specialization Areas *</h3>
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {createForm.profileData.specializationAreas.map((area, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {area}
                      <button
                        type="button"
                        onClick={() => removeFromArray('specializationAreas', area)}
                        className="ml-1 text-destructive hover:text-destructive"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Select onValueChange={(value) => addToArray('specializationAreas', value)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Add specialization area" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Autism Spectrum Disorders">Autism Spectrum Disorders</SelectItem>
                      <SelectItem value="Learning Disabilities">Learning Disabilities</SelectItem>
                      <SelectItem value="Intellectual Disabilities">Intellectual Disabilities</SelectItem>
                      <SelectItem value="ADHD">ADHD</SelectItem>
                      <SelectItem value="Behavioral Disorders">Behavioral Disorders</SelectItem>
                      <SelectItem value="Speech and Language Disorders">Speech and Language Disorders</SelectItem>
                      <SelectItem value="Physical Disabilities">Physical Disabilities</SelectItem>
                      <SelectItem value="Multiple Disabilities">Multiple Disabilities</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {formErrors.specializationAreas && <p className="text-sm text-destructive">{formErrors.specializationAreas}</p>}
              </div>
            </div>

            {/* Consent and Agreements */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Consent and Agreements</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="consentToShare"
                    checked={createForm.profileData.consentToShare}
                    onCheckedChange={(checked) => setCreateForm({
                      ...createForm,
                      profileData: { ...createForm.profileData, consentToShare: !!checked }
                    })}
                  />
                  <Label htmlFor="consentToShare">I consent to share my information with relevant stakeholders *</Label>
                </div>
                {formErrors.consentToShare && <p className="text-sm text-destructive">{formErrors.consentToShare}</p>}
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="agreementToPolicies"
                    checked={createForm.profileData.agreementToPolicies}
                    onCheckedChange={(checked) => setCreateForm({
                      ...createForm,
                      profileData: { ...createForm.profileData, agreementToPolicies: !!checked }
                    })}
                  />
                  <Label htmlFor="agreementToPolicies">I agree to the platform policies and terms of use *</Label>
                </div>
                {formErrors.agreementToPolicies && <p className="text-sm text-destructive">{formErrors.agreementToPolicies}</p>}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateEducator} disabled={isCreating}>
              {isCreating ? 'Creating...' : 'Create Special Educator'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
}