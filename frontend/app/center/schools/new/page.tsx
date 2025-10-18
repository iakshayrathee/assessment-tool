'use client';

import React from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/ui/page-header';
import { Textarea } from '@/components/ui/textarea';
import { 
  School, 
  ArrowLeft,
  Save,
  MapPin,
  Phone,
  Mail,
  User
} from 'lucide-react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';

interface SchoolFormData {
  name: string;
  address: string;
  phone: string;
  email: string;
  principalName: string;
}

export default function NewSchool() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<SchoolFormData>({
    name: '',
    address: '',
    phone: '',
    email: '',
    principalName: ''
  });
  const [errors, setErrors] = useState<Partial<SchoolFormData>>({});

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
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

      router.push('/center/schools');
    } catch (error: any) {
      console.error('Failed to create school:', error);
      // Handle specific error cases
      if (error.response?.data?.error?.includes('already exists')) {
        setErrors({ name: 'A school with this name already exists in your center' });
      } else {
        setErrors({ name: 'Failed to create school. Please try again.' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Link New School"
        description="Add a new school to your center"
        actions={[
          {
            label: 'Back to Schools',
            onClick: () => router.back(),
            icon: ArrowLeft,
            variant: 'outline'
          }
        ]}
      />

      <div className="p-6 space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <School className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <CardTitle>School Information</CardTitle>
                <CardDescription>
                  Enter the details of the school you want to link to your center
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* School Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">
                  School Name *
                </Label>
                <Input
                  id="name"
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
                <Label htmlFor="address" className="text-sm font-medium flex items-center">
                  <MapPin className="h-4 w-4 mr-1" />
                  Address *
                </Label>
                <Textarea
                  id="address"
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
                <Label htmlFor="principalName" className="text-sm font-medium flex items-center">
                  <User className="h-4 w-4 mr-1" />
                  Principal Name *
                </Label>
                <Input
                  id="principalName"
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
                  <Label htmlFor="phone" className="text-sm font-medium flex items-center">
                    <Phone className="h-4 w-4 mr-1" />
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
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
                  <Label htmlFor="email" className="text-sm font-medium flex items-center">
                    <Mail className="h-4 w-4 mr-1" />
                    Email Address
                  </Label>
                  <Input
                    id="email"
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

              {/* Form Actions */}
              <div className="flex items-center justify-between pt-6 border-t">
                <div className="text-sm text-gray-600">
                  * Required fields
                </div>
                
                <div className="flex space-x-3">
                  <Link href="/center/schools">
                    <Button type="button" variant="outline" disabled={loading}>
                      Cancel
                    </Button>
                  </Link>
                  
                  <Button type="submit" disabled={loading}>
                    {loading ? (
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
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Help Section */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Need Help?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm text-gray-600">
              <div>
                <h4 className="font-medium text-gray-900 mb-1">What happens after linking a school?</h4>
                <p>Once linked, you can:</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Enroll students from this school to your center</li>
                  <li>Assign special educators to work with students</li>
                  <li>Generate and share reports with school administrators</li>
                  <li>Track student progress and outcomes</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-1">School Viewer Access</h4>
                <p>
                  After linking, you can create School Viewer accounts for principals or counselors 
                  to give them read-only access to their students' reports and progress.
                </p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-1">Contact Information</h4>
                <p>
                  Phone and email are optional but recommended for better communication 
                  and coordination with the school administration.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}