'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  UserCheck, 
  Save,
  Search,
  Users,
  Building,
  MapPin,
  Phone,
  Mail,
  GraduationCap,
  Award,
  Calendar
} from 'lucide-react';
import { useEducators, useCenters, useSchools, useAssignEducators } from '@/hooks/useUserManagement';
import { useToast } from '@/hooks/use-toast';
import { User as UserType, UserRole, School, CenterProfile } from '@/types';

interface CenterData {
  id: string;
  centerProfile?: CenterProfile;
  centerName?: string;
  address?: string;
  phone?: string;
  contactPerson?: string;
  operatingHours?: string;
}

interface UserAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssignmentComplete: () => void;
  selectedUser?: UserType | null;
}

interface AssignmentData {
  educatorIds: string[];
  centerIds: string[];
  schoolIds: string[];
}

export function UserAssignmentModal({ isOpen, onClose, onAssignmentComplete, selectedUser }: UserAssignmentModalProps) {
  const { toast } = useToast();

  
  // React Query hooks
  const { data: educatorsResponse, isLoading: educatorsLoading } = useEducators();
  const { data: centersResponse, isLoading: centersLoading } = useCenters();
  const { data: schoolsResponse, isLoading: schoolsLoading } = useSchools();
  
  // Extract data arrays from paginated responses
  const educators = educatorsResponse?.data || [];
  const centers = centersResponse?.data || [];
  const schools = schoolsResponse?.data || [];
  const assignEducatorsMutation = useAssignEducators();
  
  // Search states
  const [educatorSearch, setEducatorSearch] = useState('');
  const [centerSearch, setCenterSearch] = useState('');
  const [schoolSearch, setSchoolSearch] = useState('');
  
  // Filter states
  const [educatorRole, setEducatorRole] = useState<string>('all');
  const [selectedEducators, setSelectedEducators] = useState<string[]>([]);
  const [selectedCenters, setSelectedCenters] = useState<string[]>([]);
  const [selectedSchools, setSelectedSchools] = useState<string[]>([]);
  
  // Assignment type
  const [assignmentType, setAssignmentType] = useState<'center' | 'school'>('center');
  
  // Combined loading state
  const searchLoading = educatorsLoading || centersLoading || schoolsLoading;

  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);

  // Pre-select the user when selectedUser prop changes
  useEffect(() => {
    if (selectedUser && isOpen) {
      // Pre-select the user if they are an educator
      if (selectedUser.role === UserRole.SPECIAL_EDUCATOR || selectedUser.role === UserRole.SUPER_SPECIAL_EDUCATOR) {
        setSelectedEducators([selectedUser.id]);
      }
    }
  }, [selectedUser, isOpen]);

  const resetForm = () => {
    setEducatorSearch('');
    setCenterSearch('');
    setSchoolSearch('');
    setEducatorRole('all');
    setSelectedEducators([]);
    setSelectedCenters([]);
    setSelectedSchools([]);
    setAssignmentType('center');
  };

  const handleAssignment = async () => {
    if (selectedEducators.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one educator.",
        variant: "destructive",
      });
      return;
    }

    if (assignmentType === 'center' && selectedCenters.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one center.",
        variant: "destructive",
      });
      return;
    }

    if (assignmentType === 'school' && selectedSchools.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one school.",
        variant: "destructive",
      });
      return;
    }

    // Create assignment payload
    const assignmentData = {
      educatorIds: selectedEducators,
      centerIds: assignmentType === 'center' ? selectedCenters : [],
      schoolIds: assignmentType === 'school' ? selectedSchools : []
    };

    assignEducatorsMutation.mutate(assignmentData, {
      onSuccess: () => {
        onAssignmentComplete();
        onClose();
      }
    });
  };

  const filteredEducators = educators.filter((educator: UserType) => {
    // Get the appropriate profile based on educator role
    const profile = educator.role === UserRole.SPECIAL_EDUCATOR 
      ? educator.specialEducatorProfile 
      : educator.superSpecialEducatorProfile;
    
    const matchesSearch = profile?.fullName?.toLowerCase().includes(educatorSearch.toLowerCase()) ||
                         educator.email.toLowerCase().includes(educatorSearch.toLowerCase());
    
    const matchesRole = educatorRole === 'all' || 
                       (educatorRole === 'special' && educator.role === UserRole.SPECIAL_EDUCATOR) ||
                       (educatorRole === 'super' && educator.role === UserRole.SUPER_SPECIAL_EDUCATOR);
    
    return matchesSearch && matchesRole;
  });

  const filteredCenters = centers.filter((center: CenterData) => {
    // Handle both direct center data and nested centerProfile structure
    const centerName = center.centerProfile?.centerName || center.centerName || '';
    const contactPerson = center.centerProfile?.contactPerson || center.contactPerson || '';
    
    return centerName.toLowerCase().includes(centerSearch.toLowerCase()) ||
           contactPerson.toLowerCase().includes(centerSearch.toLowerCase());
  });

  const filteredSchools = schools.filter((school: School) =>
    school.name?.toLowerCase().includes(schoolSearch.toLowerCase()) ||
    school.address?.toLowerCase().includes(schoolSearch.toLowerCase())
  );

  const toggleEducatorSelection = (educatorId: string) => {
    setSelectedEducators(prev =>
      prev.includes(educatorId)
        ? prev.filter(id => id !== educatorId)
        : [...prev, educatorId]
    );
  };

  const toggleCenterSelection = (centerId: string) => {
    setSelectedCenters(prev =>
      prev.includes(centerId)
        ? prev.filter(id => id !== centerId)
        : [...prev, centerId]
    );
  };

  const toggleSchoolSelection = (schoolId: string) => {
    setSelectedSchools(prev =>
      prev.includes(schoolId)
        ? prev.filter(id => id !== schoolId)
        : [...prev, schoolId]
    );
  };

  const renderEducatorCard = (educator: UserType) => {
    // Get the appropriate profile based on educator role
    const profile = educator.role === UserRole.SPECIAL_EDUCATOR 
      ? educator.specialEducatorProfile 
      : educator.superSpecialEducatorProfile;

    return (
      <Card key={educator.id} className={`cursor-pointer transition-all ${selectedEducators.includes(educator.id) ? 'ring-2 ring-primary' : ''}`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <Checkbox
                checked={selectedEducators.includes(educator.id)}
                onCheckedChange={() => toggleEducatorSelection(educator.id)}
              />
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <h4 className="font-medium">{profile?.fullName || 'N/A'}</h4>
                  <Badge variant={educator.role === UserRole.SUPER_SPECIAL_EDUCATOR ? "default" : "secondary"}>
                    {educator.role === UserRole.SUPER_SPECIAL_EDUCATOR ? 'Super Special' : 'Special'}
                  </Badge>
                  <Badge variant={educator.isActive ? "default" : "secondary"}>
                    {educator.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div className="mt-1 space-y-1 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <Mail className="h-3 w-3" />
                    <span>{educator.email}</span>
                  </div>
                  {profile?.phone && (
                    <div className="flex items-center space-x-1">
                      <Phone className="h-3 w-3" />
                      <span>{profile.phone}</span>
                    </div>
                  )}
                  {profile?.yearsOfExperience && (
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-3 w-3" />
                      <span>{profile.yearsOfExperience} years experience</span>
                    </div>
                  )}
                  {profile?.specializationAreas && profile.specializationAreas.length > 0 && (
                    <div className="flex items-center space-x-1">
                      <Award className="h-3 w-3" />
                      <span>{profile.specializationAreas.slice(0, 2).join(', ')}</span>
                      {profile.specializationAreas.length > 2 && (
                        <span>+{profile.specializationAreas.length - 2} more</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderCenterCard = (center: CenterData) => {
    // Handle both direct center data and nested centerProfile structure
    const profile = center.centerProfile || center;
    const centerId = center.centerProfile?.id || center.id; // Use centerProfile.id for foreign key reference
    const centerName = profile.centerName || 'Unknown Center';
    const contactPerson = profile.contactPerson;
    const phone = profile.phone;
    const address = profile.address;
    const operatingHours = profile.operatingHours;

    return (
      <Card key={centerId} className={`cursor-pointer transition-all ${selectedCenters.includes(centerId) ? 'ring-2 ring-primary' : ''}`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <Checkbox
                checked={selectedCenters.includes(centerId)}
                onCheckedChange={() => toggleCenterSelection(centerId)}
              />
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <h4 className="font-medium">{centerName}</h4>
                  <Badge variant="outline">
                    <Building className="mr-1 h-3 w-3" />
                    Center
                  </Badge>
                </div>
                <div className="mt-1 space-y-1 text-sm text-muted-foreground">
                  {contactPerson && (
                    <div className="flex items-center space-x-1">
                      <Users className="h-3 w-3" />
                      <span>{contactPerson}</span>
                    </div>
                  )}
                  {phone && (
                    <div className="flex items-center space-x-1">
                      <Phone className="h-3 w-3" />
                      <span>{phone}</span>
                    </div>
                  )}
                  {address && (
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-3 w-3" />
                      <span className="truncate">{address}</span>
                    </div>
                  )}
                  {operatingHours && (
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-3 w-3" />
                      <span>{operatingHours}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderSchoolCard = (school: School) => (
    <Card key={school.id} className={`cursor-pointer transition-all ${selectedSchools.includes(school.id) ? 'ring-2 ring-primary' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Checkbox
              checked={selectedSchools.includes(school.id)}
              onCheckedChange={() => toggleSchoolSelection(school.id)}
            />
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <h4 className="font-medium">{school.name}</h4>
                <Badge variant="outline">
                  <Building className="mr-1 h-3 w-3" />
                  School
                </Badge>
              </div>
              <div className="mt-1 space-y-1 text-sm text-muted-foreground">
                {school.address && (
                  <div className="flex items-center space-x-1">
                    <MapPin className="h-3 w-3" />
                    <span className="truncate">{school.address}</span>
                  </div>
                )}
                {school.phone && (
                  <div className="flex items-center space-x-1">
                    <Phone className="h-3 w-3" />
                    <span>{school.phone}</span>
                  </div>
                )}
                {school.principalName && (
                  <div className="flex items-center space-x-1">
                    <Users className="h-3 w-3" />
                    <span>Principal: {school.principalName}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center">
            <UserCheck className="mr-2 h-5 w-5" />
            Assign Educators
          </DialogTitle>
          <DialogDescription>
            Assign educators to centers or schools for collaboration and service delivery.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col space-y-4 flex-1 min-h-0">
          {/* Assignment Type Selection */}
          <div className="flex items-center space-x-4 flex-shrink-0">
            <Label>Assignment Type:</Label>
            <Select value={assignmentType} onValueChange={(value: 'center' | 'school') => setAssignmentType(value)}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="center">Assign to Centers</SelectItem>
                <SelectItem value="school">Assign to Schools</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Selection Summary */}
          <div className="flex items-center space-x-4 p-3 bg-muted rounded-lg flex-shrink-0">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span className="text-sm font-medium">
                {selectedEducators.length} educator(s) selected
              </span>
            </div>
            <div className="flex items-center space-x-2">
              {assignmentType === 'center' ? (
                <>
                  <Building className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    {selectedCenters.length} center(s) selected
                  </span>
                </>
              ) : (
                <>
                  <Building className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    {selectedSchools.length} school(s) selected
                  </span>
                </>
              )}
            </div>
          </div>

          <Tabs defaultValue="educators" className="flex-1 flex flex-col min-h-0">
            <TabsList className="grid w-full grid-cols-2 flex-shrink-0">
              <TabsTrigger value="educators">Select Educators</TabsTrigger>
              <TabsTrigger value="destinations">
                Select {assignmentType === 'center' ? 'Centers' : 'Schools'}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="educators" className="flex-1 flex flex-col space-y-4 min-h-0">
              {/* Educator Filters */}
              <div className="flex space-x-4 flex-shrink-0">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search educators by name or email..."
                      value={educatorSearch}
                      onChange={(e) => setEducatorSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={educatorRole} onValueChange={setEducatorRole}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Educators</SelectItem>
                    <SelectItem value="special">Special Educators</SelectItem>
                    <SelectItem value="super">Super Special Educators</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Educators List */}
              <ScrollArea className="flex-1 h-[400px]">
                <div className="space-y-3 pr-4">
                  {searchLoading ? (
                    <div className="text-center py-8">
                      <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
                      <p className="mt-2 text-sm text-muted-foreground">Loading educators...</p>
                    </div>
                  ) : filteredEducators.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                      <p className="mt-2 text-sm text-muted-foreground">No educators found</p>
                    </div>
                  ) : (
                    filteredEducators.map(renderEducatorCard)
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="destinations" className="flex-1 flex flex-col space-y-4 min-h-0">
              {/* Destination Filters */}
              <div className="flex space-x-4 flex-shrink-0">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder={`Search ${assignmentType === 'center' ? 'centers' : 'schools'}...`}
                      value={assignmentType === 'center' ? centerSearch : schoolSearch}
                      onChange={(e) => assignmentType === 'center' ? setCenterSearch(e.target.value) : setSchoolSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              {/* Destinations List */}
              <ScrollArea className="flex-1 h-[400px]">
                <div className="space-y-3 pr-4">
                  {searchLoading ? (
                    <div className="text-center py-8">
                      <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
                      <p className="mt-2 text-sm text-muted-foreground">
                        Loading {assignmentType === 'center' ? 'centers' : 'schools'}...
                      </p>
                    </div>
                  ) : assignmentType === 'center' ? (
                    filteredCenters.length === 0 ? (
                      <div className="text-center py-8">
                        <Building className="mx-auto h-12 w-12 text-muted-foreground" />
                        <p className="mt-2 text-sm text-muted-foreground">No centers found</p>
                      </div>
                    ) : (
                      filteredCenters.map(renderCenterCard)
                    )
                  ) : (
                    filteredSchools.length === 0 ? (
                      <div className="text-center py-8">
                        <Building className="mx-auto h-12 w-12 text-muted-foreground" />
                        <p className="mt-2 text-sm text-muted-foreground">No schools found</p>
                      </div>
                    ) : (
                      filteredSchools.map(renderSchoolCard)
                    )
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>

        <div className="flex justify-end space-x-2 pt-4 border-t flex-shrink-0">
          <Button variant="outline" onClick={onClose} disabled={assignEducatorsMutation.isPending}>
            Cancel
          </Button>
          <Button onClick={handleAssignment} disabled={assignEducatorsMutation.isPending}>
            {assignEducatorsMutation.isPending ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-foreground" />
                Assigning...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Assign Educators
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}