'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  UserCog, 
  Save,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  GraduationCap,
  Building,
  School,
  Users,
  Shield
} from 'lucide-react';
import { useUpdateUser } from '@/hooks/useUserManagement';
import { useToast } from '@/hooks/use-toast';
import { User as UserType, UserRole, Gender, AdminProfile, EducatorProfile, CenterProfile, ParentProfile, SchoolViewerProfile } from '@/types';
import { ProfessionalDatePicker } from '@/components/ui/professional-date-picker';
import { apiClient } from '@/lib/api';

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserUpdated: () => void;
  user: UserType | null;
}

interface UpdateUserData {
  email?: string;
  isActive?: boolean;
  profileData?: any;
}

const USER_ROLE_LABELS = {
  [UserRole.ADMIN]: 'Admin',
  [UserRole.SUPER_SPECIAL_EDUCATOR]: 'Super Special Educator',
  [UserRole.SPECIAL_EDUCATOR]: 'Special Educator',
  [UserRole.CENTER]: 'Center',
  [UserRole.PARENT]: 'Parent',
  [UserRole.SCHOOL_VIEWER]: 'School Viewer',
  [UserRole.STUDENT]: 'Student'
};

const SPECIALIZATION_AREAS = [
  'Learning Disabilities',
  'Autism Spectrum Disorders',
  'Intellectual Disabilities',
  'ADHD',
  'Dyslexia',
  'Speech and Language Disorders',
  'Behavioral Disorders',
  'Multiple Disabilities'
];

const EXPERIENCE_TYPES = [
  'Assessment',
  'Intervention',
  'IEP Development',
  'Consultation',
  'Training',
  'Research'
];

const GRADE_LEVELS = [
  'Pre-K',
  'Kindergarten',
  'Grade 1-3',
  'Grade 4-6',
  'Grade 7-9',
  'Grade 10-12',
  'Adult Education'
];

const LD_TYPES = [
  'Dyslexia',
  'Dyscalculia',
  'Dysgraphia',
  'Auditory Processing Disorder',
  'Visual Processing Disorder',
  'Language Processing Disorder'
];

export function EditUserModal({ isOpen, onClose, onUserUpdated, user }: EditUserModalProps) {
  const { toast } = useToast();
  const [schools, setSchools] = useState<any[]>([]);
  const updateUserMutation = useUpdateUser();
  
  const [userData, setUserData] = useState<UpdateUserData>({
    email: '',
    isActive: true,
    profileData: {}
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen && user) {
      loadSchools();
      initializeForm();
    }
  }, [isOpen, user]);

  const loadSchools = async () => {
    try {
      const response = await apiClient.getAllSchools({ page: 1, limit: 100 });
      setSchools(response.data || []);
    } catch (error) {
      console.error('Failed to load schools:', error);
    }
  };

  const initializeForm = () => {
    if (!user) return;

    // Helper function to format date for HTML date input (YYYY-MM-DD)
    const formatDateForInput = (dateString: string | null | undefined): string => {
      if (!dateString) return '';
      try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '';
        return date.toISOString().split('T')[0];
      } catch {
        return '';
      }
    };

    if (user.role === 'SPECIAL_EDUCATOR' || user.role === 'SUPER_SPECIAL_EDUCATOR') {
      const educatorProfile = (user.role === 'SPECIAL_EDUCATOR' ? user.specialEducatorProfile : user.superSpecialEducatorProfile) as EducatorProfile;
      setUserData({
        email: user.email || '',
        isActive: user.isActive ?? true,
        profileData: {
          fullName: educatorProfile?.fullName || '',
          phone: educatorProfile?.phone || '',
          dateOfBirth: formatDateForInput(educatorProfile?.dateOfBirth),
          gender: educatorProfile?.gender || '',
          address: educatorProfile?.address || '',
          primaryLanguage: educatorProfile?.primaryLanguage || '',
          secondaryLanguages: educatorProfile?.secondaryLanguages || [],
          highestQualification: educatorProfile?.highestQualification || '',
          fieldOfStudy: educatorProfile?.fieldOfStudy || '',
          institutionName: educatorProfile?.institutionName || '',
          yearOfGraduation: educatorProfile?.yearOfGraduation || new Date().getFullYear(),
          rciCertified: educatorProfile?.rciCertified ?? false,
          rciValidityDate: formatDateForInput(educatorProfile?.rciValidityDate),
          specialEdQualification: educatorProfile?.specialEdQualification || '',
          specializationAreas: educatorProfile?.specializationAreas || [],
          additionalCertifications: educatorProfile?.additionalCertifications || [],
          yearsOfExperience: educatorProfile?.yearsOfExperience || 0,
          experienceTypes: educatorProfile?.experienceTypes || [],
          maxGroupSize: educatorProfile?.maxGroupSize || 1,
          totalYearsOfExperience: educatorProfile?.totalYearsOfExperience || 0,
          currentWorkLocations: educatorProfile?.currentWorkLocations || [],
          ldTypesHandled: educatorProfile?.ldTypesHandled || [],
          gradeLevelsServed: educatorProfile?.gradeLevelsServed || [],
          assessmentTools: educatorProfile?.assessmentTools || '',
          assistiveTechProficiency: educatorProfile?.assistiveTechProficiency || [],
          areasOfInterest: educatorProfile?.areasOfInterest || [],
          consentToShare: educatorProfile?.consentToShare ?? false,
          agreementToPolicies: educatorProfile?.agreementToPolicies ?? false,
          personalStatement: educatorProfile?.personalStatement || ''
        }
      });
    } else if (user.role === 'CENTER') {
      const centerProfile = user.centerProfile as CenterProfile;
      setUserData({
        email: user.email || '',
        isActive: user.isActive ?? true,
        profileData: {
          centerName: centerProfile?.centerName || '',
          address: centerProfile?.address || '',
          phone: centerProfile?.phone || '',
          email: centerProfile?.email || user.email || '',
          contactPerson: centerProfile?.contactPerson || '',
          operatingHours: centerProfile?.operatingHours || '',
          description: centerProfile?.description || '',
          capacity: centerProfile?.capacity || 0,
          establishedDate: formatDateForInput(centerProfile?.establishedDate),
          licenseNumber: centerProfile?.licenseNumber || '',
          accreditation: centerProfile?.accreditation || [],
          servicesOffered: centerProfile?.servicesOffered || [],
          ageGroupsServed: centerProfile?.ageGroupsServed || [],
          specializations: centerProfile?.specializations || [],
          facilities: centerProfile?.facilities || [],
          staffCount: centerProfile?.staffCount || 0,
          website: centerProfile?.website || '',
          socialMedia: centerProfile?.socialMedia || {},
          emergencyContact: centerProfile?.emergencyContact || '',
          insuranceInfo: centerProfile?.insuranceInfo || '',
          transportationAvailable: centerProfile?.transportationAvailable ?? false,
          mealsProvided: centerProfile?.mealsProvided ?? false,
          extracurricularActivities: centerProfile?.extracurricularActivities || [],
          parentInvolvementPrograms: centerProfile?.parentInvolvementPrograms || [],
          communityPartnerships: centerProfile?.communityPartnerships || [],
          qualityRating: centerProfile?.qualityRating || 0,
          lastInspectionDate: formatDateForInput(centerProfile?.lastInspectionDate),
          nextInspectionDate: formatDateForInput(centerProfile?.nextInspectionDate),
          complianceStatus: centerProfile?.complianceStatus || '',
          notes: centerProfile?.notes || ''
        }
      });
    } else if (user.role === 'PARENT') {
      const parentProfile = user.parentProfile as ParentProfile;
      setUserData({
        email: user.email || '',
        isActive: user.isActive ?? true,
        profileData: {
          fullName: parentProfile?.fullName || '',
          phone: parentProfile?.phone || '',
          dateOfBirth: formatDateForInput(parentProfile?.dateOfBirth),
          gender: parentProfile?.gender || '',
          address: parentProfile?.address || '',
          occupation: parentProfile?.occupation || '',
          education: parentProfile?.education || '',
          maritalStatus: parentProfile?.maritalStatus || '',
          emergencyContact: parentProfile?.emergencyContact || '',
          preferredLanguage: parentProfile?.preferredLanguage || '',
          communicationPreferences: parentProfile?.communicationPreferences || [],
          relationshipToChild: parentProfile?.relationshipToChild || '',
          guardianshipStatus: parentProfile?.guardianshipStatus || '',
          consentToShare: parentProfile?.consentToShare ?? false,
          agreementToPolicies: parentProfile?.agreementToPolicies ?? false
        }
      });
    } else if (user.role === 'SCHOOL_VIEWER') {
      const schoolViewerProfile = user.schoolViewerProfile as SchoolViewerProfile;
      setUserData({
        email: user.email || '',
        isActive: user.isActive ?? true,
        profileData: {
          fullName: schoolViewerProfile?.fullName || '',
          phone: schoolViewerProfile?.phone || '',
          position: schoolViewerProfile?.position || '',
          department: schoolViewerProfile?.department || '',
          schoolId: schoolViewerProfile?.schoolId || '',
          accessLevel: schoolViewerProfile?.accessLevel || '',
          permissions: schoolViewerProfile?.permissions || [],
          lastAccessDate: formatDateForInput(schoolViewerProfile?.lastAccessDate),
          notes: schoolViewerProfile?.notes || ''
        }
      });
    } else if (user.role === 'ADMIN') {
      const adminProfile = user.adminProfile as AdminProfile;
      setUserData({
        email: user.email || '',
        isActive: user.isActive ?? true,
        profileData: {
          fullName: adminProfile?.fullName || '',
          phone: adminProfile?.phone || '',
          department: adminProfile?.department || '',
          position: adminProfile?.position || '',
          accessLevel: adminProfile?.accessLevel || '',
          permissions: adminProfile?.permissions || [],
          lastLoginDate: formatDateForInput(adminProfile?.lastLoginDate),
          notes: adminProfile?.notes || ''
        }
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!userData.email) newErrors.email = 'Email is required';

    // Role-specific validations
    if (user) {
      switch (user.role) {
        case UserRole.CENTER:
          if (!userData.profileData?.centerName) newErrors.centerName = 'Center name is required';
          break;
        case UserRole.SCHOOL_VIEWER:
          if (!userData.profileData?.schoolId) newErrors.schoolId = 'School selection is required';
          break;
        default:
          if (!userData.profileData?.fullName) newErrors.fullName = 'Full name is required';
          break;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!user || !validateForm()) return;

    updateUserMutation.mutate(
      { userId: user.id, userData },
      {
        onSuccess: () => {
          onUserUpdated();
          onClose();
        }
      }
    );
  };

  const handleArrayFieldChange = (field: string, value: string, checked: boolean) => {
    setUserData(prev => {
      const currentArray = (prev.profileData?.[field] as string[]) || [];
      const newArray = checked 
        ? [...currentArray, value]
        : currentArray.filter(item => item !== value);
      
      return {
        ...prev,
        profileData: {
          ...prev.profileData,
          [field]: newArray
        }
      };
    });
  };

  const updateProfileField = (field: string, value: any) => {
    setUserData(prev => ({
      ...prev,
      profileData: {
        ...prev.profileData,
        [field]: value
      }
    }));
  };

  if (!user) return null;

  const renderBasicFields = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Badge variant={user.isActive ? "default" : "secondary"}>
            {user.isActive ? "Active" : "Inactive"}
          </Badge>
          <Badge variant="outline">
            {USER_ROLE_LABELS[user.role]}
          </Badge>
        </div>
        <div className="text-sm text-muted-foreground">
          ID: {user.id}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            value={userData.email || ''}
            onChange={(e) => setUserData(prev => ({ ...prev, email: e.target.value }))}
            placeholder="user@example.com"
            className={errors.email ? 'border-destructive' : ''}
          />
          {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="isActive">Status</Label>
          <Select
            value={userData.isActive ? 'active' : 'inactive'}
            onValueChange={(value) => setUserData(prev => ({ ...prev, isActive: value === 'active' }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {user.lastLogin && (
        <div className="text-sm text-muted-foreground">
          Last login: {new Date(user.lastLogin).toLocaleString()}
        </div>
      )}
    </div>
  );

  const renderProfileFields = () => {
    switch (user.role) {
      case UserRole.CENTER:
        return renderCenterFields();
      case UserRole.SCHOOL_VIEWER:
        return renderSchoolViewerFields();
      case UserRole.SPECIAL_EDUCATOR:
      case UserRole.SUPER_SPECIAL_EDUCATOR:
        return renderEducatorFields();
      case UserRole.PARENT:
        return renderParentFields();
      case UserRole.ADMIN:
        return renderAdminFields();
      default:
        return null;
    }
  };

  const renderAdminFields = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="fullName">Full Name *</Label>
        <Input
          id="fullName"
          value={userData.profileData?.fullName || ''}
          onChange={(e) => updateProfileField('fullName', e.target.value)}
          placeholder="Enter full name"
          className={errors.fullName ? 'border-destructive' : ''}
        />
        {errors.fullName && <p className="text-sm text-destructive">{errors.fullName}</p>}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="phone">Phone</Label>
        <Input
          id="phone"
          value={userData.profileData?.phone || ''}
          onChange={(e) => updateProfileField('phone', e.target.value)}
          placeholder="Enter phone number"
        />
      </div>
    </div>
  );

  const renderCenterFields = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="centerName">Center Name *</Label>
        <Input
          id="centerName"
          value={userData.profileData?.centerName || ''}
          onChange={(e) => updateProfileField('centerName', e.target.value)}
          placeholder="Enter center name"
          className={errors.centerName ? 'border-destructive' : ''}
        />
        {errors.centerName && <p className="text-sm text-destructive">{errors.centerName}</p>}
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="contactPerson">Contact Person</Label>
          <Input
            id="contactPerson"
            value={userData.profileData?.contactPerson || ''}
            onChange={(e) => updateProfileField('contactPerson', e.target.value)}
            placeholder="Enter contact person name"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            value={userData.profileData?.phone || ''}
            onChange={(e) => updateProfileField('phone', e.target.value)}
            placeholder="Enter phone number"
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Textarea
          id="address"
          value={userData.profileData?.address || ''}
          onChange={(e) => updateProfileField('address', e.target.value)}
          placeholder="Enter center address"
          rows={3}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="operatingHours">Operating Hours</Label>
        <Input
          id="operatingHours"
          value={userData.profileData?.operatingHours || ''}
          onChange={(e) => updateProfileField('operatingHours', e.target.value)}
          placeholder="e.g., Mon-Fri 9:00 AM - 5:00 PM"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={userData.profileData?.description || ''}
          onChange={(e) => updateProfileField('description', e.target.value)}
          placeholder="Brief description of the center"
          rows={3}
        />
      </div>
    </div>
  );

  const renderSchoolViewerFields = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="fullName">Full Name *</Label>
        <Input
          id="fullName"
          value={userData.profileData?.fullName || ''}
          onChange={(e) => updateProfileField('fullName', e.target.value)}
          placeholder="Enter full name"
          className={errors.fullName ? 'border-destructive' : ''}
        />
        {errors.fullName && <p className="text-sm text-destructive">{errors.fullName}</p>}
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="position">Position</Label>
          <Input
            id="position"
            value={userData.profileData?.position || ''}
            onChange={(e) => updateProfileField('position', e.target.value)}
            placeholder="e.g., Principal, Teacher"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            value={userData.profileData?.phone || ''}
            onChange={(e) => updateProfileField('phone', e.target.value)}
            placeholder="Enter phone number"
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="schoolId">School *</Label>
        <Select
          value={userData.profileData?.schoolId || ''}
          onValueChange={(value) => updateProfileField('schoolId', value)}
        >
          <SelectTrigger className={errors.schoolId ? 'border-destructive' : ''}>
            <SelectValue placeholder="Select a school" />
          </SelectTrigger>
          <SelectContent>
            {schools.map((school) => (
              <SelectItem key={school.id} value={school.id}>
                {school.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.schoolId && <p className="text-sm text-destructive">{errors.schoolId}</p>}
      </div>
    </div>
  );

  const renderParentFields = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="fullName">Full Name *</Label>
        <Input
          id="fullName"
          value={userData.profileData?.fullName || ''}
          onChange={(e) => updateProfileField('fullName', e.target.value)}
          placeholder="Enter full name"
          className={errors.fullName ? 'border-destructive' : ''}
        />
        {errors.fullName && <p className="text-sm text-destructive">{errors.fullName}</p>}
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            value={userData.profileData?.phone || ''}
            onChange={(e) => updateProfileField('phone', e.target.value)}
            placeholder="Enter phone number"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="relationship">Relationship</Label>
          <Select
            value={userData.profileData?.relationship || 'Parent'}
            onValueChange={(value) => updateProfileField('relationship', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Parent">Parent</SelectItem>
              <SelectItem value="Guardian">Guardian</SelectItem>
              <SelectItem value="Caregiver">Caregiver</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Textarea
          id="address"
          value={userData.profileData?.address || ''}
          onChange={(e) => updateProfileField('address', e.target.value)}
          placeholder="Enter address"
          rows={3}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="emergencyContact">Emergency Contact</Label>
        <Input
          id="emergencyContact"
          value={userData.profileData?.emergencyContact || ''}
          onChange={(e) => updateProfileField('emergencyContact', e.target.value)}
          placeholder="Emergency contact information"
        />
      </div>
    </div>
  );

  const renderEducatorFields = () => (
    <Tabs defaultValue="basic" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="basic">Basic Info</TabsTrigger>
        <TabsTrigger value="qualifications">Qualifications</TabsTrigger>
        <TabsTrigger value="experience">Experience</TabsTrigger>
      </TabsList>
      
      <TabsContent value="basic" className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="fullName">Full Name *</Label>
          <Input
            id="fullName"
            value={userData.profileData?.fullName || ''}
            onChange={(e) => updateProfileField('fullName', e.target.value)}
            placeholder="Enter full name"
            className={errors.fullName ? 'border-destructive' : ''}
          />
          {errors.fullName && <p className="text-sm text-destructive">{errors.fullName}</p>}
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={userData.profileData?.phone || ''}
              onChange={(e) => updateProfileField('phone', e.target.value)}
              placeholder="Enter phone number"
            />
          </div>
          
          <ProfessionalDatePicker
            label="Date of Birth"
            value={userData.profileData?.dateOfBirth ? new Date(userData.profileData.dateOfBirth) : null}
            onChange={(date) => updateProfileField('dateOfBirth', date ? date.toISOString().split('T')[0] : '')}
            placeholder="Select date of birth"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="gender">Gender</Label>
            <Select
              value={userData.profileData?.gender || ''}
              onValueChange={(value) => updateProfileField('gender', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={Gender.MALE}>Male</SelectItem>
                <SelectItem value={Gender.FEMALE}>Female</SelectItem>
                <SelectItem value={Gender.OTHER}>Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="primaryLanguage">Primary Language</Label>
            <Input
              id="primaryLanguage"
              value={userData.profileData?.primaryLanguage || ''}
              onChange={(e) => updateProfileField('primaryLanguage', e.target.value)}
              placeholder="e.g., English"
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="address">Address</Label>
          <Textarea
            id="address"
            value={userData.profileData?.address || ''}
            onChange={(e) => updateProfileField('address', e.target.value)}
            placeholder="Enter address"
            rows={3}
          />
        </div>
      </TabsContent>
      
      <TabsContent value="qualifications" className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="highestQualification">Highest Qualification</Label>
            <Input
              id="highestQualification"
              value={userData.profileData?.highestQualification || ''}
              onChange={(e) => updateProfileField('highestQualification', e.target.value)}
              placeholder="e.g., Master's Degree"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="fieldOfStudy">Field of Study</Label>
            <Input
              id="fieldOfStudy"
              value={userData.profileData?.fieldOfStudy || ''}
              onChange={(e) => updateProfileField('fieldOfStudy', e.target.value)}
              placeholder="e.g., Special Education"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="institutionName">Institution Name</Label>
            <Input
              id="institutionName"
              value={userData.profileData?.institutionName || ''}
              onChange={(e) => updateProfileField('institutionName', e.target.value)}
              placeholder="University/College name"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="yearOfGraduation">Year of Graduation</Label>
            <Input
              id="yearOfGraduation"
              type="number"
              value={userData.profileData?.yearOfGraduation || ''}
              onChange={(e) => updateProfileField('yearOfGraduation', parseInt(e.target.value) || undefined)}
              placeholder="e.g., 2020"
            />
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="rciCertified"
              checked={userData.profileData?.rciCertified || false}
              onCheckedChange={(checked) => updateProfileField('rciCertified', checked)}
            />
            <Label htmlFor="rciCertified">RCI Certified</Label>
          </div>
          
          {userData.profileData?.rciCertified && (
            <div className="space-y-2">
              <ProfessionalDatePicker
                label="RCI Validity Date"
                value={userData.profileData?.rciValidityDate ? new Date(userData.profileData.rciValidityDate) : null}
                onChange={(date) => updateProfileField('rciValidityDate', date ? date.toISOString().split('T')[0] : '')}
                placeholder="Select RCI validity date"
              />
            </div>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="specialEdQualification">Special Education Qualification</Label>
          <Input
            id="specialEdQualification"
            value={userData.profileData?.specialEdQualification || ''}
            onChange={(e) => updateProfileField('specialEdQualification', e.target.value)}
            placeholder="Special education certification"
          />
        </div>
        
        <div className="space-y-2">
          <Label>Specialization Areas</Label>
          <div className="grid grid-cols-2 gap-2">
            {SPECIALIZATION_AREAS.map((area) => (
              <div key={area} className="flex items-center space-x-2">
                <Checkbox
                  id={`spec-${area}`}
                  checked={(userData.profileData?.specializationAreas || []).includes(area)}
                  onCheckedChange={(checked) => handleArrayFieldChange('specializationAreas', area, checked as boolean)}
                />
                <Label htmlFor={`spec-${area}`} className="text-sm">{area}</Label>
              </div>
            ))}
          </div>
        </div>
      </TabsContent>
      
      <TabsContent value="experience" className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="yearsOfExperience">Years of Experience</Label>
            <Input
              id="yearsOfExperience"
              type="number"
              value={userData.profileData?.yearsOfExperience || ''}
              onChange={(e) => updateProfileField('yearsOfExperience', parseInt(e.target.value) || undefined)}
              placeholder="e.g., 5"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="maxGroupSize">Maximum Group Size</Label>
            <Input
              id="maxGroupSize"
              type="number"
              value={userData.profileData?.maxGroupSize || ''}
              onChange={(e) => updateProfileField('maxGroupSize', parseInt(e.target.value) || undefined)}
              placeholder="e.g., 8"
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label>Experience Types</Label>
          <div className="grid grid-cols-2 gap-2">
            {EXPERIENCE_TYPES.map((type) => (
              <div key={type} className="flex items-center space-x-2">
                <Checkbox
                  id={`exp-${type}`}
                  checked={(userData.profileData?.experienceTypes || []).includes(type)}
                  onCheckedChange={(checked) => handleArrayFieldChange('experienceTypes', type, checked as boolean)}
                />
                <Label htmlFor={`exp-${type}`} className="text-sm">{type}</Label>
              </div>
            ))}
          </div>
        </div>
        
        <div className="space-y-2">
          <Label>Grade Levels Served</Label>
          <div className="grid grid-cols-2 gap-2">
            {GRADE_LEVELS.map((grade) => (
              <div key={grade} className="flex items-center space-x-2">
                <Checkbox
                  id={`grade-${grade}`}
                  checked={(userData.profileData?.gradeLevelsServed || []).includes(grade)}
                  onCheckedChange={(checked) => handleArrayFieldChange('gradeLevelsServed', grade, checked as boolean)}
                />
                <Label htmlFor={`grade-${grade}`} className="text-sm">{grade}</Label>
              </div>
            ))}
          </div>
        </div>
        
        <div className="space-y-2">
          <Label>Learning Disability Types Handled</Label>
          <div className="grid grid-cols-2 gap-2">
            {LD_TYPES.map((type) => (
              <div key={type} className="flex items-center space-x-2">
                <Checkbox
                  id={`ld-${type}`}
                  checked={(userData.profileData?.ldTypesHandled || []).includes(type)}
                  onCheckedChange={(checked) => handleArrayFieldChange('ldTypesHandled', type, checked as boolean)}
                />
                <Label htmlFor={`ld-${type}`} className="text-sm">{type}</Label>
              </div>
            ))}
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="assessmentTools">Assessment Tools</Label>
          <Textarea
            id="assessmentTools"
            value={userData.profileData?.assessmentTools || ''}
            onChange={(e) => updateProfileField('assessmentTools', e.target.value)}
            placeholder="List assessment tools you're familiar with"
            rows={3}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="personalStatement">Personal Statement</Label>
          <Textarea
            id="personalStatement"
            value={userData.profileData?.personalStatement || ''}
            onChange={(e) => updateProfileField('personalStatement', e.target.value)}
            placeholder="Brief personal statement about your experience and approach"
            rows={4}
          />
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="consentToShare"
              checked={userData.profileData?.consentToShare || false}
              onCheckedChange={(checked) => updateProfileField('consentToShare', checked)}
            />
            <Label htmlFor="consentToShare">Consent to share profile information</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="agreementToPolicies"
              checked={userData.profileData?.agreementToPolicies || false}
              onCheckedChange={(checked) => updateProfileField('agreementToPolicies', checked)}
            />
            <Label htmlFor="agreementToPolicies">Agreement to policies and terms</Label>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <UserCog className="mr-2 h-5 w-5" />
            Edit User
          </DialogTitle>
          <DialogDescription>
            Update user account information and profile details.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Account Information</CardTitle>
              <CardDescription>
                Manage user credentials and account status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderBasicFields()}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Profile Information</CardTitle>
              <CardDescription>
                Role-specific profile details for {USER_ROLE_LABELS[user.role]}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderProfileFields()}
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={onClose} disabled={updateUserMutation.isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={updateUserMutation.isPending}>
            {updateUserMutation.isPending ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-foreground" />
                Updating...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Update User
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}