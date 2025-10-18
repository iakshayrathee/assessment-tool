'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar,
  GraduationCap,
  Award,
  Languages,
  Save,
  ArrowLeft
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { ProfessionalDatePicker } from '@/components/ui/professional-date-picker';

interface SuperSpecialEducatorProfile {
  id: string;
  fullName: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  primaryLanguage?: string;
  secondaryLanguages: string[];
  highestQualification?: string;
  fieldOfStudy?: string;
  institutionName?: string;
  yearOfGraduation?: number;
  rciCertified: boolean;
  rciValidityDate?: string;
  specialEdQualification?: string;
  specializationAreas: string[];
  yearsOfExperience?: number;
  experienceTypes: string[];
  maxGroupSize?: number;
  currentWorkLocations: string[];
  ldTypesHandled: string[];
  gradeLevelsServed: string[];
  assessmentTools?: string;
  assistiveTechProficiency: string[];
  areasOfInterest: string[];
  consentToShare: boolean;
  agreementToPolicies: boolean;
  personalStatement?: string;
}

export default function SuperSpecialEducatorProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [profile, setProfile] = useState<SuperSpecialEducatorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getSuperSpecialEducatorProfile();
      setProfile(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!profile) return;

    try {
      setSaving(true);
      await apiClient.updateSuperSpecialEducatorProfile(profile);
      setIsEditing(false);
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const updateProfile = (field: keyof SuperSpecialEducatorProfile, value: any) => {
    if (!profile) return;
    setProfile({ ...profile, [field]: value });
  };

  const addToArray = (field: keyof SuperSpecialEducatorProfile, value: string) => {
    if (!profile || !value.trim()) return;
    const currentArray = (profile[field] as string[]) || [];
    if (!currentArray.includes(value.trim())) {
      updateProfile(field, [...currentArray, value.trim()]);
    }
  };

  const removeFromArray = (field: keyof SuperSpecialEducatorProfile, value: string) => {
    if (!profile) return;
    const currentArray = (profile[field] as string[]) || [];
    updateProfile(field, currentArray.filter(item => item !== value));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">Profile not found</p>
            <Button onClick={() => router.back()} className="w-full">
              Go Back
            </Button>
          </CardContent>
        </Card>
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
            <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
            <p className="text-gray-600">Manage your professional information</p>
          </div>
        </div>
        <div className="flex space-x-2">
          {isEditing ? (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  fetchProfile(); // Reset changes
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)}>
              Edit Profile
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="personal" className="space-y-4">
        <TabsList>
          <TabsTrigger value="personal">Personal Information</TabsTrigger>
          <TabsTrigger value="education">Education & Qualifications</TabsTrigger>
          <TabsTrigger value="experience">Experience & Skills</TabsTrigger>
          <TabsTrigger value="preferences">Preferences & Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Personal Information
              </CardTitle>
              <CardDescription>
                Basic personal and contact information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={profile.fullName}
                    onChange={(e) => updateProfile('fullName', e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={profile.phone || ''}
                    onChange={(e) => updateProfile('phone', e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <ProfessionalDatePicker
                    label="Date of Birth"
                    value={profile.dateOfBirth ? new Date(profile.dateOfBirth) : null}
                    onChange={(date) => updateProfile('dateOfBirth', date ? date.toISOString().split('T')[0] : '')}
                    placeholder="Select date of birth"
                    disabled={!isEditing}
                    toYear={new Date().getFullYear()}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Select
                    value={profile.gender || ''}
                    onValueChange={(value) => updateProfile('gender', value)}
                    disabled={!isEditing}
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
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={profile.address || ''}
                  onChange={(e) => updateProfile('address', e.target.value)}
                  disabled={!isEditing}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primaryLanguage">Primary Language</Label>
                  <Input
                    id="primaryLanguage"
                    value={profile.primaryLanguage || ''}
                    onChange={(e) => updateProfile('primaryLanguage', e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Secondary Languages</Label>
                  <div className="flex flex-wrap gap-2">
                    {(profile.secondaryLanguages || []).map((lang, index) => (
                      <Badge key={index} variant="secondary">
                        {lang}
                        {isEditing && (
                          <button
                            onClick={() => removeFromArray('secondaryLanguages', lang)}
                            className="ml-2 text-red-500"
                          >
                            ×
                          </button>
                        )}
                      </Badge>
                    ))}
                  </div>
                  {isEditing && (
                    <Input
                      placeholder="Add language and press Enter"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          addToArray('secondaryLanguages', e.currentTarget.value);
                          e.currentTarget.value = '';
                        }
                      }}
                    />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="education" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <GraduationCap className="h-5 w-5 mr-2" />
                Education & Qualifications
              </CardTitle>
              <CardDescription>
                Academic background and professional certifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="highestQualification">Highest Qualification</Label>
                  <Input
                    id="highestQualification"
                    value={profile.highestQualification || ''}
                    onChange={(e) => updateProfile('highestQualification', e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fieldOfStudy">Field of Study</Label>
                  <Input
                    id="fieldOfStudy"
                    value={profile.fieldOfStudy || ''}
                    onChange={(e) => updateProfile('fieldOfStudy', e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="institutionName">Institution Name</Label>
                  <Input
                    id="institutionName"
                    value={profile.institutionName || ''}
                    onChange={(e) => updateProfile('institutionName', e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="yearOfGraduation">Year of Graduation</Label>
                  <Input
                    id="yearOfGraduation"
                    type="number"
                    value={profile.yearOfGraduation || ''}
                    onChange={(e) => updateProfile('yearOfGraduation', e.target.value ? parseInt(e.target.value) : undefined)}
                    disabled={!isEditing}
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="rciCertified"
                    checked={profile.rciCertified}
                    onCheckedChange={(checked) => updateProfile('rciCertified', checked)}
                    disabled={!isEditing}
                  />
                  <Label htmlFor="rciCertified">RCI Certified</Label>
                </div>
                
                {profile.rciCertified && (
                  <div className="space-y-2">
                    <ProfessionalDatePicker
                      label="RCI Validity Date"
                      value={profile.rciValidityDate ? new Date(profile.rciValidityDate) : null}
                      onChange={(date) => updateProfile('rciValidityDate', date ? date.toISOString().split('T')[0] : '')}
                      placeholder="Select RCI validity date"
                      disabled={!isEditing}
                      fromYear={new Date().getFullYear()}
                      toYear={new Date().getFullYear() + 10}
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="specialEdQualification">Special Education Qualification</Label>
                <Input
                  id="specialEdQualification"
                  value={profile.specialEdQualification || ''}
                  onChange={(e) => updateProfile('specialEdQualification', e.target.value)}
                  disabled={!isEditing}
                />
              </div>

              <div className="space-y-2">
                <Label>Specialization Areas</Label>
                <div className="flex flex-wrap gap-2">
                  {(profile.specializationAreas || []).map((area, index) => (
                    <Badge key={index} variant="secondary">
                      {area}
                      {isEditing && (
                        <button
                          onClick={() => removeFromArray('specializationAreas', area)}
                          className="ml-2 text-red-500"
                        >
                          ×
                        </button>
                      )}
                    </Badge>
                  ))}
                </div>
                {isEditing && (
                  <Input
                    placeholder="Add specialization and press Enter"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addToArray('specializationAreas', e.currentTarget.value);
                        e.currentTarget.value = '';
                      }
                    }}
                  />
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="experience" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Award className="h-5 w-5 mr-2" />
                Experience & Skills
              </CardTitle>
              <CardDescription>
                Professional experience and technical skills
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="yearsOfExperience">Years of Experience</Label>
                  <Input
                    id="yearsOfExperience"
                    type="number"
                    value={profile.yearsOfExperience || ''}
                    onChange={(e) => updateProfile('yearsOfExperience', e.target.value ? parseInt(e.target.value) : undefined)}
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxGroupSize">Maximum Group Size</Label>
                  <Input
                    id="maxGroupSize"
                    type="number"
                    value={profile.maxGroupSize || ''}
                    onChange={(e) => updateProfile('maxGroupSize', e.target.value ? parseInt(e.target.value) : undefined)}
                    disabled={!isEditing}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Experience Types</Label>
                <div className="flex flex-wrap gap-2">
                  {(profile.experienceTypes || []).map((type, index) => (
                    <Badge key={index} variant="secondary">
                      {type}
                      {isEditing && (
                        <button
                          onClick={() => removeFromArray('experienceTypes', type)}
                          className="ml-2 text-red-500"
                        >
                          ×
                        </button>
                      )}
                    </Badge>
                  ))}
                </div>
                {isEditing && (
                  <Input
                    placeholder="Add experience type and press Enter"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addToArray('experienceTypes', e.currentTarget.value);
                        e.currentTarget.value = '';
                      }
                    }}
                  />
                )}
              </div>

              <div className="space-y-2">
                <Label>Current Work Locations</Label>
                <div className="flex flex-wrap gap-2">
                  {(profile.currentWorkLocations || []).map((location, index) => (
                    <Badge key={index} variant="secondary">
                      {location}
                      {isEditing && (
                        <button
                          onClick={() => removeFromArray('currentWorkLocations', location)}
                          className="ml-2 text-red-500"
                        >
                          ×
                        </button>
                      )}
                    </Badge>
                  ))}
                </div>
                {isEditing && (
                  <Input
                    placeholder="Add work location and press Enter"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addToArray('currentWorkLocations', e.currentTarget.value);
                        e.currentTarget.value = '';
                      }
                    }}
                  />
                )}
              </div>

              <div className="space-y-2">
                <Label>Learning Disability Types Handled</Label>
                <div className="flex flex-wrap gap-2">
                  {(profile.ldTypesHandled || []).map((type, index) => (
                    <Badge key={index} variant="secondary">
                      {type}
                      {isEditing && (
                        <button
                          onClick={() => removeFromArray('ldTypesHandled', type)}
                          className="ml-2 text-red-500"
                        >
                          ×
                        </button>
                      )}
                    </Badge>
                  ))}
                </div>
                {isEditing && (
                  <Input
                    placeholder="Add LD type and press Enter"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addToArray('ldTypesHandled', e.currentTarget.value);
                        e.currentTarget.value = '';
                      }
                    }}
                  />
                )}
              </div>

              <div className="space-y-2">
                <Label>Grade Levels Served</Label>
                <div className="flex flex-wrap gap-2">
                  {(profile.gradeLevelsServed || []).map((grade, index) => (
                    <Badge key={index} variant="secondary">
                      {grade}
                      {isEditing && (
                        <button
                          onClick={() => removeFromArray('gradeLevelsServed', grade)}
                          className="ml-2 text-red-500"
                        >
                          ×
                        </button>
                      )}
                    </Badge>
                  ))}
                </div>
                {isEditing && (
                  <Input
                    placeholder="Add grade level and press Enter"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addToArray('gradeLevelsServed', e.currentTarget.value);
                        e.currentTarget.value = '';
                      }
                    }}
                  />
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="assessmentTools">Assessment Tools</Label>
                <Textarea
                  id="assessmentTools"
                  value={profile.assessmentTools || ''}
                  onChange={(e) => updateProfile('assessmentTools', e.target.value)}
                  disabled={!isEditing}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Assistive Technology Proficiency</Label>
                <div className="flex flex-wrap gap-2">
                  {(profile.assistiveTechProficiency || []).map((tech, index) => (
                    <Badge key={index} variant="secondary">
                      {tech}
                      {isEditing && (
                        <button
                          onClick={() => removeFromArray('assistiveTechProficiency', tech)}
                          className="ml-2 text-red-500"
                        >
                          ×
                        </button>
                      )}
                    </Badge>
                  ))}
                </div>
                {isEditing && (
                  <Input
                    placeholder="Add technology and press Enter"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addToArray('assistiveTechProficiency', e.currentTarget.value);
                        e.currentTarget.value = '';
                      }
                    }}
                  />
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Preferences & Settings</CardTitle>
              <CardDescription>
                Personal preferences and consent settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Areas of Interest</Label>
                <div className="flex flex-wrap gap-2">
                  {(profile.areasOfInterest || []).map((interest, index) => (
                    <Badge key={index} variant="secondary">
                      {interest}
                      {isEditing && (
                        <button
                          onClick={() => removeFromArray('areasOfInterest', interest)}
                          className="ml-2 text-red-500"
                        >
                          ×
                        </button>
                      )}
                    </Badge>
                  ))}
                </div>
                {isEditing && (
                  <Input
                    placeholder="Add area of interest and press Enter"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addToArray('areasOfInterest', e.currentTarget.value);
                        e.currentTarget.value = '';
                      }
                    }}
                  />
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="personalStatement">Personal Statement</Label>
                <Textarea
                  id="personalStatement"
                  value={profile.personalStatement || ''}
                  onChange={(e) => updateProfile('personalStatement', e.target.value)}
                  disabled={!isEditing}
                  rows={4}
                  placeholder="Share your professional philosophy and approach..."
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="consentToShare"
                    checked={profile.consentToShare}
                    onCheckedChange={(checked) => updateProfile('consentToShare', checked)}
                    disabled={!isEditing}
                  />
                  <Label htmlFor="consentToShare">
                    Consent to share profile information with relevant stakeholders
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="agreementToPolicies"
                    checked={profile.agreementToPolicies}
                    onCheckedChange={(checked) => updateProfile('agreementToPolicies', checked)}
                    disabled={!isEditing}
                  />
                  <Label htmlFor="agreementToPolicies">
                    Agreement to organizational policies and procedures
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}