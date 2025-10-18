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
import { 
  UserPlus, 
  Save,
  User,
  Mail,
  Lock,
  Phone,
  MapPin,
  Calendar,
  GraduationCap,
  Building,
  School,
  Users
} from 'lucide-react';
import { useCreateUser } from '@/hooks/useUserManagement';
import { useToast } from '@/hooks/use-toast';
import { UserRole, Gender } from '@/types';
import { ProfessionalDatePicker } from '@/components/ui/professional-date-picker';
import { apiClient } from '@/lib/api';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserCreated: () => void;
}

interface BaseUserData {
  email: string;
  password: string;
  role: UserRole;
}

interface ProfileData {
  // Common fields
  fullName?: string;
  phone?: string;
  address?: string;
  
  // Educator specific
  dateOfBirth?: string;
  gender?: Gender;
  primaryLanguage?: string;
  secondaryLanguages?: string[];
  highestQualification?: string;
  fieldOfStudy?: string;
  institutionName?: string;
  yearOfGraduation?: number;
  rciCertified?: boolean;
  rciValidityDate?: string;
  specialEdQualification?: string;
  specializationAreas?: string[];
  yearsOfExperience?: number;
  experienceTypes?: string[];
  maxGroupSize?: number;
  currentWorkLocations?: string[];
  ldTypesHandled?: string[];
  gradeLevelsServed?: string[];
  assessmentTools?: string;
  assistiveTechProficiency?: string[];
  areasOfInterest?: string[];
  consentToShare?: boolean;
  agreementToPolicies?: boolean;
  personalStatement?: string;
  
  // Center specific
  centerName?: string;
  contactPerson?: string;
  operatingHours?: string;
  description?: string;
  
  // Parent specific
  emergencyContact?: string;
  relationship?: string;
  
  // School Viewer specific
  position?: string;
  schoolId?: string;
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

export function CreateUserModal({ isOpen, onClose, onUserCreated }: CreateUserModalProps) {
  const { toast } = useToast();
  const [schools, setSchools] = useState<any[]>([]);
  const createUserMutation = useCreateUser();
  
  const [userData, setUserData] = useState<BaseUserData>({
    email: '',
    password: '',
    role: UserRole.SPECIAL_EDUCATOR
  });
  
  const [profileData, setProfileData] = useState<ProfileData>({
    fullName: '',
    phone: '',
    address: ''
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      loadSchools();
      resetForm();
    }
  }, [isOpen]);

  const loadSchools = async () => {
    try {
      const response = await apiClient.getAllSchools({ page: 1, limit: 100 });
      setSchools(response.data || []);
    } catch (error) {
      console.error('Failed to load schools:', error);
    }
  };

  const resetForm = () => {
    setUserData({
      email: '',
      password: '',
      role: UserRole.SPECIAL_EDUCATOR
    });
    setProfileData({
      fullName: '',
      phone: '',
      address: ''
    });
    setErrors({});
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!userData.email) newErrors.email = 'Email is required';
    if (!userData.password) newErrors.password = 'Password is required';
    if (userData.password && userData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    // Role-specific validations
    switch (userData.role) {
      case UserRole.CENTER:
        if (!profileData.centerName) newErrors.centerName = 'Center name is required';
        break;
      case UserRole.SCHOOL_VIEWER:
        if (!profileData.schoolId) newErrors.schoolId = 'School selection is required';
        break;
      default:
        if (!profileData.fullName) newErrors.fullName = 'Full name is required';
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    const payload = {
      ...userData,
      profileData
    };

    createUserMutation.mutate(payload, {
      onSuccess: () => {
        onUserCreated();
        onClose();
        // Reset form
        setUserData({
          email: '',
          password: '',
          role: UserRole.SPECIAL_EDUCATOR
        });
        setProfileData({
          fullName: '',
          phone: '',
          address: ''
        });
        setErrors({});
      }
    });
  };

  const handleArrayFieldChange = (field: keyof ProfileData, value: string, checked: boolean) => {
    setProfileData(prev => {
      const currentArray = (prev[field] as string[]) || [];
      if (checked) {
        return { ...prev, [field]: [...currentArray, value] };
      } else {
        return { ...prev, [field]: currentArray.filter(item => item !== value) };
      }
    });
  };

  const renderBasicFields = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            value={userData.email}
            onChange={(e) => setUserData(prev => ({ ...prev, email: e.target.value }))}
            placeholder="user@example.com"
            className={errors.email ? 'border-destructive' : ''}
          />
          {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="password">Password *</Label>
          <Input
            id="password"
            type="password"
            value={userData.password}
            onChange={(e) => setUserData(prev => ({ ...prev, password: e.target.value }))}
            placeholder="Minimum 6 characters"
            className={errors.password ? 'border-destructive' : ''}
          />
          {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="role">Role *</Label>
        <Select
          value={userData.role}
          onValueChange={(value) => setUserData(prev => ({ ...prev, role: value as UserRole }))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(USER_ROLE_LABELS).map(([role, label]) => (
              <SelectItem key={role} value={role}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  const renderProfileFields = () => {
    switch (userData.role) {
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
          value={profileData.fullName || ''}
          onChange={(e) => setProfileData(prev => ({ ...prev, fullName: e.target.value }))}
          placeholder="Enter full name"
          className={errors.fullName ? 'border-destructive' : ''}
        />
        {errors.fullName && <p className="text-sm text-destructive">{errors.fullName}</p>}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="phone">Phone</Label>
        <Input
          id="phone"
          value={profileData.phone || ''}
          onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
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
          value={profileData.centerName || ''}
          onChange={(e) => setProfileData(prev => ({ ...prev, centerName: e.target.value }))}
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
            value={profileData.contactPerson || ''}
            onChange={(e) => setProfileData(prev => ({ ...prev, contactPerson: e.target.value }))}
            placeholder="Enter contact person name"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            value={profileData.phone || ''}
            onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
            placeholder="Enter phone number"
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Textarea
          id="address"
          value={profileData.address || ''}
          onChange={(e) => setProfileData(prev => ({ ...prev, address: e.target.value }))}
          placeholder="Enter center address"
          rows={3}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="operatingHours">Operating Hours</Label>
        <Input
          id="operatingHours"
          value={profileData.operatingHours || ''}
          onChange={(e) => setProfileData(prev => ({ ...prev, operatingHours: e.target.value }))}
          placeholder="e.g., Mon-Fri 9:00 AM - 5:00 PM"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={profileData.description || ''}
          onChange={(e) => setProfileData(prev => ({ ...prev, description: e.target.value }))}
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
          value={profileData.fullName || ''}
          onChange={(e) => setProfileData(prev => ({ ...prev, fullName: e.target.value }))}
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
            value={profileData.position || ''}
            onChange={(e) => setProfileData(prev => ({ ...prev, position: e.target.value }))}
            placeholder="e.g., Principal, Teacher"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            value={profileData.phone || ''}
            onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
            placeholder="Enter phone number"
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="schoolId">School *</Label>
        <Select
          value={profileData.schoolId || ''}
          onValueChange={(value) => setProfileData(prev => ({ ...prev, schoolId: value }))}
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
          value={profileData.fullName || ''}
          onChange={(e) => setProfileData(prev => ({ ...prev, fullName: e.target.value }))}
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
            value={profileData.phone || ''}
            onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
            placeholder="Enter phone number"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="relationship">Relationship</Label>
          <Select
            value={profileData.relationship || 'Parent'}
            onValueChange={(value) => setProfileData(prev => ({ ...prev, relationship: value }))}
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
          value={profileData.address || ''}
          onChange={(e) => setProfileData(prev => ({ ...prev, address: e.target.value }))}
          placeholder="Enter address"
          rows={3}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="emergencyContact">Emergency Contact</Label>
        <Input
          id="emergencyContact"
          value={profileData.emergencyContact || ''}
          onChange={(e) => setProfileData(prev => ({ ...prev, emergencyContact: e.target.value }))}
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
            value={profileData.fullName || ''}
            onChange={(e) => setProfileData(prev => ({ ...prev, fullName: e.target.value }))}
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
              value={profileData.phone || ''}
              onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="Enter phone number"
            />
          </div>
          
          <ProfessionalDatePicker
            label="Date of Birth"
            value={profileData.dateOfBirth ? new Date(profileData.dateOfBirth) : null}
            onChange={(date) => setProfileData(prev => ({ ...prev, dateOfBirth: date ? date.toISOString().split('T')[0] : '' }))}
            placeholder="Select date of birth"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="gender">Gender</Label>
            <Select
              value={profileData.gender || ''}
              onValueChange={(value) => setProfileData(prev => ({ ...prev, gender: value as Gender }))}
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
              value={profileData.primaryLanguage || ''}
              onChange={(e) => setProfileData(prev => ({ ...prev, primaryLanguage: e.target.value }))}
              placeholder="e.g., English"
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="address">Address</Label>
          <Textarea
            id="address"
            value={profileData.address || ''}
            onChange={(e) => setProfileData(prev => ({ ...prev, address: e.target.value }))}
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
              value={profileData.highestQualification || ''}
              onChange={(e) => setProfileData(prev => ({ ...prev, highestQualification: e.target.value }))}
              placeholder="e.g., Master's Degree"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="fieldOfStudy">Field of Study</Label>
            <Input
              id="fieldOfStudy"
              value={profileData.fieldOfStudy || ''}
              onChange={(e) => setProfileData(prev => ({ ...prev, fieldOfStudy: e.target.value }))}
              placeholder="e.g., Special Education"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="institutionName">Institution Name</Label>
            <Input
              id="institutionName"
              value={profileData.institutionName || ''}
              onChange={(e) => setProfileData(prev => ({ ...prev, institutionName: e.target.value }))}
              placeholder="University/College name"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="yearOfGraduation">Year of Graduation</Label>
            <Input
              id="yearOfGraduation"
              type="number"
              value={profileData.yearOfGraduation || ''}
              onChange={(e) => setProfileData(prev => ({ ...prev, yearOfGraduation: parseInt(e.target.value) || undefined }))}
              placeholder="e.g., 2020"
            />
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="rciCertified"
              checked={profileData.rciCertified || false}
              onCheckedChange={(checked) => setProfileData(prev => ({ ...prev, rciCertified: checked as boolean }))}
            />
            <Label htmlFor="rciCertified">RCI Certified</Label>
          </div>
          
          {profileData.rciCertified && (
            <ProfessionalDatePicker
              label="RCI Validity Date"
              value={profileData.rciValidityDate ? new Date(profileData.rciValidityDate) : null}
              onChange={(date) => setProfileData(prev => ({ ...prev, rciValidityDate: date ? date.toISOString().split('T')[0] : '' }))}
              placeholder="Select RCI validity date"
            />
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="specialEdQualification">Special Education Qualification</Label>
          <Input
            id="specialEdQualification"
            value={profileData.specialEdQualification || ''}
            onChange={(e) => setProfileData(prev => ({ ...prev, specialEdQualification: e.target.value }))}
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
                  checked={(profileData.specializationAreas || []).includes(area)}
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
              value={profileData.yearsOfExperience || ''}
              onChange={(e) => setProfileData(prev => ({ ...prev, yearsOfExperience: parseInt(e.target.value) || undefined }))}
              placeholder="e.g., 5"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="maxGroupSize">Maximum Group Size</Label>
            <Input
              id="maxGroupSize"
              type="number"
              value={profileData.maxGroupSize || ''}
              onChange={(e) => setProfileData(prev => ({ ...prev, maxGroupSize: parseInt(e.target.value) || undefined }))}
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
                  checked={(profileData.experienceTypes || []).includes(type)}
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
                  checked={(profileData.gradeLevelsServed || []).includes(grade)}
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
                  checked={(profileData.ldTypesHandled || []).includes(type)}
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
            value={profileData.assessmentTools || ''}
            onChange={(e) => setProfileData(prev => ({ ...prev, assessmentTools: e.target.value }))}
            placeholder="List assessment tools you're familiar with"
            rows={3}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="personalStatement">Personal Statement</Label>
          <Textarea
            id="personalStatement"
            value={profileData.personalStatement || ''}
            onChange={(e) => setProfileData(prev => ({ ...prev, personalStatement: e.target.value }))}
            placeholder="Brief personal statement about your experience and approach"
            rows={4}
          />
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="consentToShare"
              checked={profileData.consentToShare || false}
              onCheckedChange={(checked) => setProfileData(prev => ({ ...prev, consentToShare: checked as boolean }))}
            />
            <Label htmlFor="consentToShare">Consent to share profile information</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="agreementToPolicies"
              checked={profileData.agreementToPolicies || false}
              onCheckedChange={(checked) => setProfileData(prev => ({ ...prev, agreementToPolicies: checked as boolean }))}
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
            <UserPlus className="mr-2 h-5 w-5" />
            Create New User
          </DialogTitle>
          <DialogDescription>
            Create a new user account with role-specific profile information.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic Information</CardTitle>
              <CardDescription>
                Set up the user's account credentials and role
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
                Role-specific profile details for {USER_ROLE_LABELS[userData.role]}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderProfileFields()}
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={onClose} disabled={createUserMutation.isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={createUserMutation.isPending}>
            {createUserMutation.isPending ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-foreground" />
                Creating...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Create User
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}