"use client";

import { useState, useEffect, useCallback } from "react";
import { useSpecialEducatorProfile } from "@/hooks/useSpecialEducator";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, X } from "lucide-react";
import { MultiSelectWithTags } from "@/components/ui/multi-select-with-tags";
import { ProfessionalDatePicker } from "@/components/ui/professional-date-picker";
import { format, parse, isValid } from "date-fns";
import { cn } from "@/lib/utils";

// Constants for dropdown options
const GENDER_OPTIONS = [
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" },
  { value: "OTHER", label: "Other" }
];

const LANGUAGE_OPTIONS = [
  "English", "Hindi", "Tamil", "Telugu", "Kannada", "Malayalam", "Bengali", "Marathi", "Gujarati", "Punjabi", "Urdu", "Odia", "Assamese", "Other"
];

const QUALIFICATION_OPTIONS = [
  "B.Ed.", "M.Ed.", "B.A.", "M.A.", "B.Sc.", "M.Sc.", "B.Com.", "M.Com.", "Ph.D.", "Diploma", "Certificate"
];

const FIELD_OF_STUDY_OPTIONS = [
  "Special Education", "Psychology", "Education", "Child Development", "Rehabilitation Sciences", "Speech Therapy", "Occupational Therapy", "Social Work", "Other"
];

const SPECIALIZATION_AREAS = [
  "Learning Disabilities", "Autism Spectrum Disorders", "Intellectual Disabilities", "Multiple Disabilities",
  "Visual Impairment", "Hearing Impairment", "Physical Disabilities", "Behavioral Disorders", "ADHD", "Dyslexia"
];

const EXPERIENCE_TYPES = [
  "Direct Instruction", "Assessment", "Intervention", "Counseling", "Research", "Administration", "Training", "Consultation"
];

const LD_TYPES = [
  "Dyslexia", "Dyscalculia", "Dysgraphia", "ADHD", "Autism", "Intellectual Disability", "Multiple Disabilities", "Behavioral Issues"
].map(item => ({ value: item, label: item }));

const GRADE_LEVELS = [
  "Pre-Primary", "Primary (1-5)", "Middle School (6-8)", "High School (9-10)", "Senior Secondary (11-12)", "Adult Education"
].map(item => ({ value: item, label: item }));

const ASSISTIVE_TECH = [
  "Screen Readers", "Text-to-Speech", "Communication Devices", "Mobility Aids", "Learning Apps", "Adaptive Software", "Sensory Tools"
];

const AREAS_OF_INTEREST = [
  "Research", "Training", "Policy Development", "Technology Integration", "Community Outreach", "Curriculum Development", "Assessment Tools"
];

const ADDITIONAL_CERTIFICATIONS = [
  "Applied Behavior Analysis (ABA)", "Speech Therapy", "Occupational Therapy", "Assistive Technology", "Autism Intervention", "ADHD Management", "Other"
];

// Generate year options from 1980 to 2025
const YEAR_OPTIONS = Array.from({ length: 46 }, (_, i) => 2025 - i);

// Generate experience year options
const EXPERIENCE_YEARS = Array.from({ length: 41 }, (_, i) => i);

// Generate group size options
const GROUP_SIZE_OPTIONS = Array.from({ length: 21 }, (_, i) => i + 1);

interface FormData {
  // Personal Information
  fullName: string;
  dateOfBirth: Date | null;
  gender: string;
  phone: string;
  address: string;
  primaryLanguage: string;
  secondaryLanguages: string[];

  // Professional Info - General Education
  highestQualification: string;
  fieldOfStudy: string;
  institutionName: string;
  yearOfGraduation: number | null;

  // Professional Info - Special Education
  rciCertified: boolean;
  rciValidityDate: Date | null;
  specialEdQualification: string;
  specializationAreas: string[];
  additionalCertifications: string[];

  // Experience
  yearsOfExperience: number | null;
  experienceTypes: string[];
  maxGroupSize: number | null;
  totalYearsOfExperience: number | null;
  currentWorkLocations: string[];

  // Expertise
  ldTypesHandled: string[];
  gradeLevelsServed: string[];
  assessmentTools: string;
  assistiveTechProficiency: string[];

  // Center Assignment
  workingInMultipleCenters: boolean;
  centerCount: number;

  // Professional Interests
  areasOfInterest: string[];

  // Consent & Agreements
  consentToShare: boolean;
  agreementToPolicies: boolean;

  // Other
  personalStatement: string;
}

export default function EducatorProfile() {
  const { profile, updateProfile, isLoading } = useSpecialEducatorProfile();
  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    dateOfBirth: null,
    gender: "",
    phone: "",
    address: "",
    primaryLanguage: "",
    secondaryLanguages: [],
    highestQualification: "",
    fieldOfStudy: "",
    institutionName: "",
    yearOfGraduation: null,
    rciCertified: false,
    rciValidityDate: null,
    specialEdQualification: "",
    specializationAreas: [],
    additionalCertifications: [],
    yearsOfExperience: null,
    experienceTypes: [],
    maxGroupSize: null,
    totalYearsOfExperience: null,
    currentWorkLocations: [],
    ldTypesHandled: [],
    gradeLevelsServed: [],
    assessmentTools: "",
    assistiveTechProficiency: [],
    workingInMultipleCenters: false,
    centerCount: 0,
    areasOfInterest: [],
    consentToShare: false,
    agreementToPolicies: false,
    personalStatement: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState("personal");
  const [isEditing, setIsEditing] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [customCertification, setCustomCertification] = useState("");
  const [newWorkLocation, setNewWorkLocation] = useState("");
  const [customLanguage, setCustomLanguage] = useState("");
  const [customFieldOfStudy, setCustomFieldOfStudy] = useState("");
  const [dateInputValues, setDateInputValues] = useState<Record<string, string>>({
    dateOfBirth: "",
    rciValidityDate: ""
  });

  // State for cities and centers data
  const [cities, setCities] = useState<string[]>([]);
  const [centersByCity, setCentersByCity] = useState<Record<string, Array<{ id: string; name: string }>>>({});
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedCenter, setSelectedCenter] = useState("");
  const [otherWorkLocation, setOtherWorkLocation] = useState("");
  const [isLoadingCities, setIsLoadingCities] = useState(false);

  // State for dropdown selections that reset after adding to arrays
  const [dropdownSelections, setDropdownSelections] = useState({
    secondaryLanguage: "",
    specializationArea: "",
    additionalCertification: "",
    experienceType: ""
  });

  // Optimized input handlers to prevent focus issues
  const handleInputChange = useCallback((field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSelectChange = useCallback((field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);



  // Fetch cities and centers data on component mount
  useEffect(() => {
    const fetchCitiesAndCenters = async () => {
      setIsLoadingCities(true);
      try {
        const data = await apiClient.getCitiesAndCenters();
        setCities(data.cities);
        setCentersByCity(data.centersByCity);
      } catch (error) {
        console.error("Failed to fetch cities and centers:", error);
      } finally {
        setIsLoadingCities(false);
      }
    };

    fetchCitiesAndCenters();
  }, []);

  useEffect(() => {
    if (profile) {
      // Update date input values when profile loads
      setDateInputValues({
        dateOfBirth: profile.dateOfBirth ? format(new Date(profile.dateOfBirth), "dd/MM/yyyy") : "",
        rciValidityDate: profile.rciValidityDate ? format(new Date(profile.rciValidityDate), "dd/MM/yyyy") : ""
      });

      setFormData({
        fullName: profile.fullName || "",
        dateOfBirth: profile.dateOfBirth ? new Date(profile.dateOfBirth) : null,
        gender: profile.gender || "",
        phone: profile.phone || "",
        address: profile.address || "",
        primaryLanguage: profile.primaryLanguage || "",
        secondaryLanguages: profile.secondaryLanguages || [],
        highestQualification: profile.highestQualification || "",
        fieldOfStudy: profile.fieldOfStudy || "",
        institutionName: profile.institutionName || "",
        yearOfGraduation: profile.yearOfGraduation || null,
        rciCertified: profile.rciCertified || false,
        rciValidityDate: profile.rciValidityDate ? new Date(profile.rciValidityDate) : null,
        specialEdQualification: profile.specialEdQualification || "",
        specializationAreas: profile.specializationAreas || [],
        additionalCertifications: profile.additionalCertifications || [],
        yearsOfExperience: profile.yearsOfExperience || null,
        experienceTypes: profile.experienceTypes || [],
        maxGroupSize: profile.maxGroupSize || null,
        totalYearsOfExperience: profile.totalYearsOfExperience || null,
        currentWorkLocations: profile.currentWorkLocations || [],
        ldTypesHandled: profile.ldTypesHandled || [],
        gradeLevelsServed: profile.gradeLevelsServed || [],
        assessmentTools: profile.assessmentTools || "",
        assistiveTechProficiency: profile.assistiveTechProficiency || [],
        workingInMultipleCenters: (profile.currentWorkLocations?.length || 0) > 1,
        centerCount: profile.currentWorkLocations?.length || 0,
        areasOfInterest: profile.areasOfInterest || [],
        consentToShare: profile.consentToShare || false,
        agreementToPolicies: profile.agreementToPolicies || false,
        personalStatement: profile.personalStatement || "",
      });

      // Reset dropdown selections to ensure they don't interfere with loaded data
      setDropdownSelections({
        secondaryLanguage: "",
        specializationArea: "",
        additionalCertification: "",
        experienceType: ""
      });
    }
  }, [profile]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Personal Information Validations
    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    } else if (!/^[a-zA-Z\s]+$/.test(formData.fullName.trim())) {
      newErrors.fullName = "Full name must contain only alphabets and spaces";
    }

    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = "Date of birth is required";
    } else if (formData.dateOfBirth > new Date()) {
      newErrors.dateOfBirth = "Date of birth cannot be in the future";
    }

    if (!formData.gender) {
      newErrors.gender = "Gender is required";
    }

    // Contact Information Validations
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^\d{10}$/.test(formData.phone.trim())) {
      newErrors.phone = "Phone number must be exactly 10 digits";
    }

    if (!formData.primaryLanguage) {
      newErrors.primaryLanguage = "Primary language is required";
    }

    // Professional Info - General Education Validations
    if (!formData.highestQualification) {
      newErrors.highestQualification = "Highest academic qualification is required";
    }

    if (!formData.fieldOfStudy) {
      newErrors.fieldOfStudy = "Field of study is required";
    }

    if (!formData.institutionName.trim()) {
      newErrors.institutionName = "Institution name is required";
    }

    if (!formData.yearOfGraduation) {
      newErrors.yearOfGraduation = "Year of graduation is required";
    } else {
      const currentYear = new Date().getFullYear();
      if (formData.yearOfGraduation < 1980 || formData.yearOfGraduation > currentYear + 1) {
        newErrors.yearOfGraduation = "Year of graduation must be between 1980 and " + (currentYear + 1);
      }
    }

    // Professional Info - Special Education Validations
    if (formData.rciCertified === null || formData.rciCertified === undefined) {
      newErrors.rciCertified = "RCI certification status is required";
    }

    if (formData.rciCertified && !formData.rciValidityDate) {
      newErrors.rciValidityDate = "RCI validity date is required when certified";
    }

    if (!formData.specialEdQualification) {
      newErrors.specialEdQualification = "Special education qualification is required";
    }

    if (formData.specializationAreas.length === 0) {
      newErrors.specializationAreas = "At least one specialization area is required";
    }

    // Experience Validations
    if (!formData.yearsOfExperience && formData.yearsOfExperience !== 0) {
      newErrors.yearsOfExperience = "Years of experience in inclusive education is required";
    }

    if (formData.experienceTypes.length === 0) {
      newErrors.experienceTypes = "At least one experience type is required";
    }

    if (!formData.totalYearsOfExperience && formData.totalYearsOfExperience !== 0) {
      newErrors.totalYearsOfExperience = "Total years of experience is required";
    }

    if (formData.currentWorkLocations.length === 0) {
      newErrors.currentWorkLocations = "At least one current work location is required";
    }

    // Consent & Agreements Validations
    if (!formData.consentToShare) {
      newErrors.consentToShare = "Consent to share information is required";
    }

    if (!formData.agreementToPolicies) {
      newErrors.agreementToPolicies = "Agreement to policies is required";
    }

    // Cross-field validations
    if (formData.yearsOfExperience && formData.totalYearsOfExperience) {
      if (formData.yearsOfExperience > formData.totalYearsOfExperience) {
        newErrors.yearsOfExperience = "Years of inclusive education experience cannot exceed total experience";
      }
    }

    // Center assignment validation
    if (formData.workingInMultipleCenters && formData.centerCount < 2) {
      newErrors.centerCount = "Center count must be at least 2 when working in multiple centers";
    }

    setErrors(newErrors);

    // Show alert and redirect to relevant tab if there are errors
    if (Object.keys(newErrors).length > 0) {
      const firstError = Object.keys(newErrors)[0];
      const errorMessage = newErrors[firstError];

      // Determine which tab to redirect to based on the error field
      let targetTab = "personal";
      if (["fullName", "dateOfBirth", "gender", "phone", "address", "primaryLanguage", "secondaryLanguages"].includes(firstError)) {
        targetTab = "personal";
      } else if (["highestQualification", "fieldOfStudy", "institutionName", "yearOfGraduation"].includes(firstError)) {
        targetTab = "education";
      } else if (["rciCertified", "rciValidityDate", "specialEdQualification", "specializationAreas", "additionalCertifications", "yearsOfExperience", "experienceTypes", "totalYearsOfExperience", "currentWorkLocations", "maxGroupSize"].includes(firstError)) {
        targetTab = "experience";
      } else if (["ldTypesHandled", "gradeLevelsServed", "assessmentTools", "assistiveTechProficiency"].includes(firstError)) {
        targetTab = "expertise";
      } else if (["consentToShare", "agreementToPolicies", "workingInMultipleCenters", "centerCount", "areasOfInterest"].includes(firstError)) {
        targetTab = "preferences";
      }

      setActiveTab(targetTab);
      setAlertMessage(`Validation Error: ${errorMessage}`);
      setShowAlert(true);

      // Auto-hide alert after 5 seconds
      setTimeout(() => {
        setShowAlert(false);
      }, 5000);
    }

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      // Format data according to backend expectations
      const submitData = {
        // Personal Information
        fullName: formData.fullName.trim(),
        dateOfBirth: formData.dateOfBirth?.toISOString().split('T')[0], // Send as YYYY-MM-DD
        gender: formData.gender,
        phone: formData.phone.trim(),
        address: formData.address.trim() || null,
        primaryLanguage: formData.primaryLanguage,
        secondaryLanguages: formData.secondaryLanguages.length > 0 ? formData.secondaryLanguages : [],

        // Professional Info - General Education
        highestQualification: formData.highestQualification,
        fieldOfStudy: formData.fieldOfStudy,
        institutionName: formData.institutionName.trim(),
        yearOfGraduation: parseInt(formData.yearOfGraduation?.toString() || '0'),

        // Professional Info - Special Education
        rciCertified: formData.rciCertified,
        rciValidityDate: formData.rciCertified && formData.rciValidityDate
          ? formData.rciValidityDate.toISOString().split('T')[0]
          : null,
        specialEdQualification: formData.specialEdQualification,
        specializationAreas: formData.specializationAreas,
        additionalCertifications: formData.additionalCertifications.length > 0 ? formData.additionalCertifications : [],

        // Experience
        yearsOfExperience: parseInt(formData.yearsOfExperience?.toString() || '0'),
        experienceTypes: formData.experienceTypes,
        maxGroupSize: formData.maxGroupSize ? parseInt(formData.maxGroupSize.toString()) : null,
        totalYearsOfExperience: parseInt(formData.totalYearsOfExperience?.toString() || '0'),
        currentWorkLocations: formData.currentWorkLocations,

        // Expertise
        ldTypesHandled: formData.ldTypesHandled.length > 0 ? formData.ldTypesHandled : [],
        gradeLevelsServed: formData.gradeLevelsServed.length > 0 ? formData.gradeLevelsServed : [],
        assessmentTools: formData.assessmentTools.trim() || null,
        assistiveTechProficiency: formData.assistiveTechProficiency.length > 0 ? formData.assistiveTechProficiency : [],

        // Center Assignment
        workingInMultipleCenters: formData.workingInMultipleCenters,
        centerCount: formData.currentWorkLocations.length,

        // Professional Interests
        areasOfInterest: formData.areasOfInterest.length > 0 ? formData.areasOfInterest : [],

        // Consent & Agreements
        consentToShare: formData.consentToShare,
        agreementToPolicies: formData.agreementToPolicies,

        // Other
        personalStatement: formData.personalStatement.trim() || null,
      };

      await updateProfile(submitData);
      setIsEditing(false);
    } catch (error) {
      console.error('Error submitting profile:', error);
      // The error will be handled by the useSpecialEducatorProfile hook
    }
  };

  const handleMultiSelectChange = (field: keyof FormData, value: string, dropdownKey?: string) => {
    setFormData(prev => {
      const currentValues = prev[field] as string[];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value];
      return { ...prev, [field]: newValues };
    });

    // Reset the dropdown selection after adding to array
    if (dropdownKey) {
      setDropdownSelections(prev => ({ ...prev, [dropdownKey]: "" }));
    }
  };

  const addCustomCertification = () => {
    if (customCertification.trim() && !formData.additionalCertifications.includes(customCertification)) {
      setFormData(prev => ({
        ...prev,
        additionalCertifications: [...prev.additionalCertifications, customCertification]
      }));
      setCustomCertification("");
    }
  };



  const removeWorkLocation = (location: string) => {
    setFormData(prev => {
      const newLocations = prev.currentWorkLocations.filter(loc => loc !== location);
      return {
        ...prev,
        currentWorkLocations: newLocations,
        centerCount: newLocations.length,
        workingInMultipleCenters: newLocations.length > 1
      };
    });
  };

  if (isLoading) {
    return (
      <>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading profile...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="container mx-auto p-6 max-w-4xl">
        {/* Alert Component */}
        {showAlert && (
          <div className="fixed top-4 right-4 z-50 bg-red-500 text-white p-4 rounded-lg shadow-lg max-w-md">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <p className="font-semibold">Validation Error</p>
                <p className="text-sm mt-1">{alertMessage}</p>
              </div>
              <button
                onClick={() => setShowAlert(false)}
                className="ml-2 text-white hover:text-gray-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 mb-8 border border-blue-100">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">My Profile 👤</h1>
              <p className="text-gray-600">Manage your professional information and preferences</p>
            </div>
            <div className="flex gap-3">
              {isEditing ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false);
                      // Reset form data back to profile data
                      if (profile) {
                        setFormData({
                          fullName: profile.fullName || "",
                          dateOfBirth: profile.dateOfBirth ? new Date(profile.dateOfBirth) : null,
                          gender: profile.gender || "",
                          phone: profile.phone || "",
                          address: profile.address || "",
                          primaryLanguage: profile.primaryLanguage || "",
                          secondaryLanguages: profile.secondaryLanguages || [],
                          highestQualification: profile.highestQualification || "",
                          fieldOfStudy: profile.fieldOfStudy || "",
                          institutionName: profile.institutionName || "",
                          yearOfGraduation: profile.yearOfGraduation || null,
                          rciCertified: profile.rciCertified || false,
                          rciValidityDate: profile.rciValidityDate ? new Date(profile.rciValidityDate) : null,
                          specialEdQualification: profile.specialEdQualification || "",
                          specializationAreas: profile.specializationAreas || [],
                          additionalCertifications: profile.additionalCertifications || [],
                          yearsOfExperience: profile.yearsOfExperience || null,
                          experienceTypes: profile.experienceTypes || [],
                          maxGroupSize: profile.maxGroupSize || null,
                          totalYearsOfExperience: profile.totalYearsOfExperience || null,
                          currentWorkLocations: profile.currentWorkLocations || [],
                          ldTypesHandled: profile.ldTypesHandled || [],
                          gradeLevelsServed: profile.gradeLevelsServed || [],
                          assessmentTools: profile.assessmentTools || "",
                          assistiveTechProficiency: profile.assistiveTechProficiency || [],
                          workingInMultipleCenters: (profile.currentWorkLocations?.length || 0) > 1,
                          centerCount: profile.currentWorkLocations?.length || 0,
                          areasOfInterest: profile.areasOfInterest || [],
                          consentToShare: profile.consentToShare || false,
                          agreementToPolicies: profile.agreementToPolicies || false,
                          personalStatement: profile.personalStatement || "",
                        });
                      }
                      setErrors({});
                    }}
                    className="px-6 py-2"
                  >
                    ❌ Cancel
                  </Button>
                  <Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700 px-6 py-2 shadow-md">
                    💾 Save Changes
                  </Button>
                </>
              ) : (
                <Button onClick={() => setIsEditing(true)} variant="outline" className="px-6 py-2 shadow-md">
                  ✏️ Edit Profile
                </Button>
              )}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <fieldset disabled={!isEditing} className={cn(!isEditing && "opacity-75")}>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
              <TabsList className="grid w-full grid-cols-5 bg-gray-100 p-1 rounded-lg">
                <TabsTrigger value="personal" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  👤 Personal
                </TabsTrigger>
                <TabsTrigger value="education" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  🎓 Education
                </TabsTrigger>
                <TabsTrigger value="experience" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  💼 Experience
                </TabsTrigger>
                <TabsTrigger value="expertise" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  🎯 Expertise
                </TabsTrigger>
                <TabsTrigger value="preferences" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  ⚙️ Preferences
                </TabsTrigger>
              </TabsList>

              {/* Personal Information Tab */}
              <TabsContent value="personal" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                    <CardDescription>Basic personal details and contact information</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="fullName">Full Name *</Label>
                        <Input
                          id="fullName"
                          value={formData.fullName}
                          onChange={(e) => handleInputChange('fullName', e.target.value)}
                          className={errors.fullName ? "border-red-500" : ""}
                        />
                        {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>}
                      </div>

                      <ProfessionalDatePicker
                        label="Date of Birth"
                        value={formData.dateOfBirth}
                        onChange={(date) => handleInputChange('dateOfBirth', date)}
                        error={errors.dateOfBirth}
                        required={true}
                      />

                      <div>
                        <Label htmlFor="gender">Gender *</Label>
                        <Select key={`gender-${formData.gender}`} value={formData.gender} onValueChange={(value) => handleSelectChange('gender', value)}>
                          <SelectTrigger className={errors.gender ? "border-red-500" : ""}>
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                          <SelectContent>
                            {GENDER_OPTIONS.map(option => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.gender && <p className="text-red-500 text-sm mt-1">{errors.gender}</p>}
                      </div>

                      <div>
                        <Label htmlFor="phone">Phone Number *</Label>
                        <Input
                          id="phone"
                          value={formData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          placeholder="10-digit phone number"
                          className={errors.phone ? "border-red-500" : ""}
                        />
                        {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="address">Address</Label>
                      <Textarea
                        id="address"
                        value={formData.address}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                        placeholder="Complete address"
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="primaryLanguage">Primary Language *</Label>
                        {formData.primaryLanguage === "Other" ? (
                          <div className="space-y-2">
                            <div className="flex gap-2">
                              <Input
                                value={customLanguage}
                                onChange={(e) => setCustomLanguage(e.target.value)}
                                placeholder="Enter your primary language"
                                className={errors.primaryLanguage ? "border-red-500" : ""}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                  if (customLanguage.trim()) {
                                    setFormData(prev => ({ ...prev, primaryLanguage: customLanguage.trim() }));
                                    setCustomLanguage("");
                                  } else {
                                    setFormData(prev => ({ ...prev, primaryLanguage: "" }));
                                  }
                                }}
                              >
                                {customLanguage.trim() ? "Save" : "Cancel"}
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Select key={`primaryLanguage-${formData.primaryLanguage}`} value={formData.primaryLanguage} onValueChange={(value) => {
                            if (value === "Other") {
                              setFormData(prev => ({ ...prev, primaryLanguage: value }));
                              setCustomLanguage("");
                            } else {
                              setFormData(prev => ({ ...prev, primaryLanguage: value }));
                            }
                          }}>
                            <SelectTrigger className={errors.primaryLanguage ? "border-red-500" : ""}>
                              <SelectValue placeholder="Select primary language" />
                            </SelectTrigger>
                            <SelectContent>
                              {LANGUAGE_OPTIONS.map(lang => (
                                <SelectItem key={lang} value={lang}>
                                  {lang}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                        {errors.primaryLanguage && <p className="text-red-500 text-sm mt-1">{errors.primaryLanguage}</p>}
                      </div>

                      <div>
                        <Label>Secondary Languages</Label>
                        <div className="space-y-2">
                          <div className="flex flex-wrap gap-2">
                            {formData.secondaryLanguages.map(lang => (
                              <Badge key={lang} variant="secondary" className="cursor-pointer" onClick={() => handleMultiSelectChange('secondaryLanguages', lang)}>
                                {lang} <X className="ml-1 h-3 w-3" />
                              </Badge>
                            ))}
                          </div>
                          <Select
                            value={dropdownSelections.secondaryLanguage}
                            onValueChange={(value) => {
                              setDropdownSelections(prev => ({ ...prev, secondaryLanguage: value }));
                              handleMultiSelectChange('secondaryLanguages', value, 'secondaryLanguage');
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Add secondary language" />
                            </SelectTrigger>
                            <SelectContent>
                              {LANGUAGE_OPTIONS.filter(lang => !formData.secondaryLanguages.includes(lang) && lang !== formData.primaryLanguage).map(lang => (
                                <SelectItem key={lang} value={lang}>
                                  {lang}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Education Tab */}
              <TabsContent value="education" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>General Education</CardTitle>
                    <CardDescription>Academic qualifications and educational background</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="highestQualification">Highest Academic Qualification *</Label>
                        <Select value={formData.highestQualification} onValueChange={(value) => setFormData(prev => ({ ...prev, highestQualification: value }))}>
                          <SelectTrigger className={errors.highestQualification ? "border-red-500" : ""}>
                            <SelectValue placeholder="Select qualification" />
                          </SelectTrigger>
                          <SelectContent>
                            {QUALIFICATION_OPTIONS.map(qual => (
                              <SelectItem key={qual} value={qual}>
                                {qual}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.highestQualification && <p className="text-red-500 text-sm mt-1">{errors.highestQualification}</p>}
                      </div>

                      <div>
                        <Label htmlFor="fieldOfStudy">Field of Study *</Label>
                        <Select
                          value={formData.fieldOfStudy}
                          onValueChange={(value) => {
                            if (value === "Other") {
                              setCustomFieldOfStudy("");
                            } else {
                              setCustomFieldOfStudy("");
                            }
                            setFormData(prev => ({ ...prev, fieldOfStudy: value }));
                          }}
                        >
                          <SelectTrigger className={errors.fieldOfStudy ? "border-red-500" : ""}>
                            <SelectValue placeholder="Select field of study" />
                          </SelectTrigger>
                          <SelectContent>
                            {FIELD_OF_STUDY_OPTIONS.map(field => (
                              <SelectItem key={field} value={field}>
                                {field}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {formData.fieldOfStudy === "Other" && (
                          <div className="mt-2 flex gap-2">
                            <Input
                              placeholder="Enter custom field of study"
                              value={customFieldOfStudy}
                              onChange={(e) => setCustomFieldOfStudy(e.target.value)}
                              className="flex-1"
                            />
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => {
                                if (customFieldOfStudy.trim()) {
                                  setFormData(prev => ({ ...prev, fieldOfStudy: customFieldOfStudy.trim() }));
                                  setCustomFieldOfStudy("");
                                }
                              }}
                            >
                              Save
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setFormData(prev => ({ ...prev, fieldOfStudy: "" }));
                                setCustomFieldOfStudy("");
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        )}
                        {errors.fieldOfStudy && <p className="text-red-500 text-sm mt-1">{errors.fieldOfStudy}</p>}
                      </div>

                      <div>
                        <Label htmlFor="institutionName">Institution Name *</Label>
                        <Input
                          id="institutionName"
                          value={formData.institutionName}
                          onChange={(e) => handleInputChange('institutionName', e.target.value)}
                          className={errors.institutionName ? "border-red-500" : ""}
                        />
                        {errors.institutionName && <p className="text-red-500 text-sm mt-1">{errors.institutionName}</p>}
                      </div>

                      <div>
                        <Label htmlFor="yearOfGraduation">Year of Graduation *</Label>
                        <Select value={formData.yearOfGraduation?.toString() || ""} onValueChange={(value) => setFormData(prev => ({ ...prev, yearOfGraduation: parseInt(value) }))}>
                          <SelectTrigger className={errors.yearOfGraduation ? "border-red-500" : ""}>
                            <SelectValue placeholder="Select year" />
                          </SelectTrigger>
                          <SelectContent>
                            {YEAR_OPTIONS.map(year => (
                              <SelectItem key={year} value={year.toString()}>
                                {year}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.yearOfGraduation && <p className="text-red-500 text-sm mt-1">{errors.yearOfGraduation}</p>}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Special Education</CardTitle>
                    <CardDescription>Special education qualifications and certifications</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>RCI Certification Status *</Label>
                      <RadioGroup
                        value={formData.rciCertified.toString()}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, rciCertified: value === "true" }))}
                        className="flex space-x-4 mt-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="true" id="rci-yes" />
                          <Label htmlFor="rci-yes">Certified</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="false" id="rci-no" />
                          <Label htmlFor="rci-no">Not Certified</Label>
                        </div>
                      </RadioGroup>
                    </div>

                    {formData.rciCertified && (
                      <ProfessionalDatePicker
                        label="RCI Validity Date"
                        value={formData.rciValidityDate}
                        onChange={(date) => handleInputChange('rciValidityDate', date)}
                        error={errors.rciValidityDate}
                        required={true}
                      />
                    )}

                    <div>
                      <Label htmlFor="specialEdQualification">Qualification (Special Ed) *</Label>
                      <Select value={formData.specialEdQualification} onValueChange={(value) => setFormData(prev => ({ ...prev, specialEdQualification: value }))}>
                        <SelectTrigger className={errors.specialEdQualification ? "border-red-500" : ""}>
                          <SelectValue placeholder="Select special education qualification" />
                        </SelectTrigger>
                        <SelectContent>
                          {QUALIFICATION_OPTIONS.map(qual => (
                            <SelectItem key={qual} value={qual}>
                              {qual}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.specialEdQualification && <p className="text-red-500 text-sm mt-1">{errors.specialEdQualification}</p>}
                    </div>

                    <div>
                      <Label>Specialization Area *</Label>
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-2">
                          {formData.specializationAreas.map(area => (
                            <Badge key={area} variant="secondary" className="cursor-pointer" onClick={() => handleMultiSelectChange('specializationAreas', area)}>
                              {area} <X className="ml-1 h-3 w-3" />
                            </Badge>
                          ))}
                        </div>
                        <Select
                          value={dropdownSelections.specializationArea}
                          onValueChange={(value) => {
                            setDropdownSelections(prev => ({ ...prev, specializationArea: value }));
                            handleMultiSelectChange('specializationAreas', value, 'specializationArea');
                          }}
                        >
                          <SelectTrigger className={errors.specializationAreas ? "border-red-500" : ""}>
                            <SelectValue placeholder="Add specialization area" />
                          </SelectTrigger>
                          <SelectContent>
                            {SPECIALIZATION_AREAS.filter(area => !formData.specializationAreas.includes(area)).map(area => (
                              <SelectItem key={area} value={area}>
                                {area}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.specializationAreas && <p className="text-red-500 text-sm mt-1">{errors.specializationAreas}</p>}
                      </div>
                    </div>

                    <div>
                      <Label>Additional Certifications</Label>
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-2">
                          {formData.additionalCertifications.map(cert => (
                            <Badge key={cert} variant="secondary" className="cursor-pointer" onClick={() => handleMultiSelectChange('additionalCertifications', cert)}>
                              {cert} <X className="ml-1 h-3 w-3" />
                            </Badge>
                          ))}
                        </div>
                        <Select
                          value={dropdownSelections.additionalCertification}
                          onValueChange={(value) => {
                            setDropdownSelections(prev => ({ ...prev, additionalCertification: value }));
                            if (value === "Other") {
                              // Handle custom certification input
                            } else {
                              handleMultiSelectChange('additionalCertifications', value, 'additionalCertification');
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Add certification" />
                          </SelectTrigger>
                          <SelectContent>
                            {ADDITIONAL_CERTIFICATIONS.filter(cert => !formData.additionalCertifications.includes(cert)).map(cert => (
                              <SelectItem key={cert} value={cert}>
                                {cert}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <div className="flex gap-2">
                          <Input
                            placeholder="Custom certification"
                            value={customCertification}
                            onChange={(e) => setCustomCertification(e.target.value)}
                          />
                          <Button type="button" onClick={addCustomCertification} size="sm">
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Experience Tab */}
              <TabsContent value="experience" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Professional Experience</CardTitle>
                    <CardDescription>Work experience and professional background</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="yearsOfExperience">Years of Experience (Inclusive Ed.) *</Label>
                        <Select value={formData.yearsOfExperience?.toString() || ""} onValueChange={(value) => setFormData(prev => ({ ...prev, yearsOfExperience: parseInt(value) }))}>
                          <SelectTrigger className={errors.yearsOfExperience ? "border-red-500" : ""}>
                            <SelectValue placeholder="Select years" />
                          </SelectTrigger>
                          <SelectContent>
                            {EXPERIENCE_YEARS.map(year => (
                              <SelectItem key={year} value={year.toString()}>
                                {year} {year === 1 ? 'year' : 'years'}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.yearsOfExperience && <p className="text-red-500 text-sm mt-1">{errors.yearsOfExperience}</p>}
                      </div>

                      <div>
                        <Label htmlFor="totalYearsOfExperience">Total Years of Experience *</Label>
                        <Select value={formData.totalYearsOfExperience?.toString() || ""} onValueChange={(value) => setFormData(prev => ({ ...prev, totalYearsOfExperience: parseInt(value) }))}>
                          <SelectTrigger className={errors.totalYearsOfExperience ? "border-red-500" : ""}>
                            <SelectValue placeholder="Select total years" />
                          </SelectTrigger>
                          <SelectContent>
                            {EXPERIENCE_YEARS.map(year => (
                              <SelectItem key={year} value={year.toString()}>
                                {year} {year === 1 ? 'year' : 'years'}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.totalYearsOfExperience && <p className="text-red-500 text-sm mt-1">{errors.totalYearsOfExperience}</p>}
                      </div>

                      <div>
                        <Label htmlFor="maxGroupSize">Max Group Size Handled</Label>
                        <Select value={formData.maxGroupSize?.toString() || ""} onValueChange={(value) => setFormData(prev => ({ ...prev, maxGroupSize: parseInt(value) }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select group size" />
                          </SelectTrigger>
                          <SelectContent>
                            {GROUP_SIZE_OPTIONS.map(size => (
                              <SelectItem key={size} value={size.toString()}>
                                {size} {size === 1 ? 'student' : 'students'}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label>Experience Type *</Label>
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-2">
                          {formData.experienceTypes.map(type => (
                            <Badge key={type} variant="secondary" className="cursor-pointer" onClick={() => handleMultiSelectChange('experienceTypes', type)}>
                              {type} <X className="ml-1 h-3 w-3" />
                            </Badge>
                          ))}
                        </div>
                        <Select
                          value={dropdownSelections.experienceType}
                          onValueChange={(value) => {
                            setDropdownSelections(prev => ({ ...prev, experienceType: value }));
                            handleMultiSelectChange('experienceTypes', value, 'experienceType');
                          }}
                        >
                          <SelectTrigger className={errors.experienceTypes ? "border-red-500" : ""}>
                            <SelectValue placeholder="Add experience type" />
                          </SelectTrigger>
                          <SelectContent>
                            {EXPERIENCE_TYPES.filter(type => !formData.experienceTypes.includes(type)).map(type => (
                              <SelectItem key={type} value={type}>
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.experienceTypes && <p className="text-red-500 text-sm mt-1">{errors.experienceTypes}</p>}
                      </div>
                    </div>

                    <div>
                      <Label>Current Work Locations *</Label>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label>Select City</Label>
                            <Select
                              value={selectedCity}
                              onValueChange={(value) => {
                                setSelectedCity(value);
                                setSelectedCenter("");
                              }}
                              disabled={isLoadingCities}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder={isLoadingCities ? "Loading cities..." : "Select a city"} />
                              </SelectTrigger>
                              <SelectContent>
                                {cities.map(city => (
                                  <SelectItem key={city} value={city}>
                                    {city}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label>Select Center</Label>
                            <Select
                              value={selectedCenter}
                              onValueChange={(value) => {
                                setSelectedCenter(value);
                                const center = centersByCity[selectedCity]?.find(c => c.id === value);
                                if (center && !formData.currentWorkLocations.includes(center.name)) {
                                  setFormData(prev => {
                                    const updatedLocations = [...prev.currentWorkLocations, center.name];
                                    return {
                                      ...prev,
                                      currentWorkLocations: updatedLocations,
                                      centerCount: updatedLocations.length,
                                      workingInMultipleCenters: updatedLocations.length > 1
                                    };
                                  });
                                }
                                setSelectedCity("");
                                setSelectedCenter("");
                              }}
                              disabled={!selectedCity || isLoadingCities}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder={selectedCity ? "Select a center" : "Select city first"} />
                              </SelectTrigger>
                              <SelectContent>
                                {selectedCity && centersByCity[selectedCity]?.map(center => (
                                  <SelectItem key={center.id} value={center.id}>
                                    {center.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>



                        <div className="flex flex-wrap gap-2">
                          {formData.currentWorkLocations.map(location => (
                            <Badge key={location} variant="secondary" className="cursor-pointer" onClick={() => removeWorkLocation(location)}>
                              {location} <X className="ml-1 h-3 w-3" />
                            </Badge>
                          ))}
                        </div>
                        {errors.currentWorkLocations && <p className="text-red-500 text-sm mt-1">{errors.currentWorkLocations}</p>}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="workingInMultipleCenters"
                        checked={formData.workingInMultipleCenters}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, workingInMultipleCenters: checked }))}
                      />
                      <Label htmlFor="workingInMultipleCenters">Working in Multiple Centers?</Label>
                    </div>

                    {formData.workingInMultipleCenters && (
                      <div>
                        <Label>Center Count: {formData.centerCount}</Label>
                        <p className="text-sm text-gray-600">Auto-calculated based on work locations</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Expertise Tab */}
              <TabsContent value="expertise" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Areas of Expertise</CardTitle>
                    <CardDescription>
                      Your specialized knowledge and skills
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <MultiSelectWithTags
                      label="Learning Disability Types You Handle"
                      options={LD_TYPES}
                      selectedValues={formData.ldTypesHandled}
                      onSelectionChange={(values) => setFormData(prev => ({ ...prev, ldTypesHandled: values }))}
                      placeholder="Select types of learning disabilities you work with"
                    />

                    <MultiSelectWithTags
                      label="Grade Levels You Serve"
                      options={GRADE_LEVELS}
                      selectedValues={formData.gradeLevelsServed}
                      onSelectionChange={(values) => setFormData(prev => ({ ...prev, gradeLevelsServed: values }))}
                      placeholder="Select grade levels you teach"
                    />

                    <div className="space-y-2">
                      <Label htmlFor="assessmentTools">Assessment Tools You Use</Label>
                      <Textarea
                        id="assessmentTools"
                        value={formData.assessmentTools}
                        onChange={(e) => handleInputChange('assessmentTools', e.target.value)}
                        placeholder="List the assessment tools and methods you use"
                        rows={3}
                      />
                    </div>

                    <MultiSelectWithTags
                      label="Assistive Technology Proficiency"
                      options={ASSISTIVE_TECH.map(item => ({ value: item, label: item }))}
                      selectedValues={formData.assistiveTechProficiency}
                      onSelectionChange={(values) => setFormData(prev => ({ ...prev, assistiveTechProficiency: values }))}
                      placeholder="Select assistive technologies you're proficient with"
                    />

                    <MultiSelectWithTags
                      label="Areas of Interest"
                      options={AREAS_OF_INTEREST.map(item => ({ value: item, label: item }))}
                      selectedValues={formData.areasOfInterest}
                      onSelectionChange={(values) => setFormData(prev => ({ ...prev, areasOfInterest: values }))}
                      placeholder="Select your professional interests"
                    />

                    <div className="space-y-2">
                      <Label htmlFor="personalStatement">Personal Statement</Label>
                      <Textarea
                        id="personalStatement"
                        value={formData.personalStatement}
                        onChange={(e) => handleInputChange('personalStatement', e.target.value)}
                        placeholder="Share your philosophy, approach, or any additional information about yourself"
                        rows={4}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Preferences Tab */}
              <TabsContent value="preferences" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Consent & Agreements</CardTitle>
                    <CardDescription>
                      Please review and agree to the following terms
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-start space-x-2">
                        <Checkbox
                          id="consentToShare"
                          checked={formData.consentToShare}
                          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, consentToShare: checked as boolean }))}
                          className={cn(errors.consentToShare && "border-red-500")}
                        />
                        <div className="space-y-1">
                          <Label htmlFor="consentToShare" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Consent to Share Information *
                          </Label>
                          <p className="text-sm text-gray-600">
                            I consent to sharing my profile information with relevant centers and administrators for assignment purposes.
                          </p>
                        </div>
                      </div>
                      {errors.consentToShare && <p className="text-red-500 text-sm">{errors.consentToShare}</p>}

                      <div className="flex items-start space-x-2">
                        <Checkbox
                          id="agreementToPolicies"
                          checked={formData.agreementToPolicies}
                          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, agreementToPolicies: checked as boolean }))}
                          className={cn(errors.agreementToPolicies && "border-red-500")}
                        />
                        <div className="space-y-1">
                          <Label htmlFor="agreementToPolicies" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Agreement to Policies *
                          </Label>
                          <p className="text-sm text-gray-600">
                            I agree to abide by the organization's policies, code of conduct, and professional standards.
                          </p>
                        </div>
                      </div>
                      {errors.agreementToPolicies && <p className="text-red-500 text-sm">{errors.agreementToPolicies}</p>}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </fieldset>
        </form>
      </div>
    </>
  );
}
