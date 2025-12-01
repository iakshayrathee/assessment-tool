'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Building, 
  ArrowLeft,
  RefreshCw,
  Download,
  MapPin,
  School,
  GraduationCap,
  Users,
  Activity
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

// Import our custom components
import CenterOverview from '../../../../components/admin/center-school/CenterOverview';
import SchoolsManagement from '../../../../components/admin/center-school/SchoolsManagement';
import StudentsListing from '../../../../components/admin/center-school/StudentsListing';
import EducatorsManagement from '../../../../components/admin/center-school/EducatorsManagement';

export interface CenterDetail {
  id: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  centerProfile: {
    id: string;
    centerName: string;
    address: string;
    phone: string;
    email: string;
    contactPerson: string;
    operatingHours: string;
    description: string;
    schools: School[];
    students: Student[];
    assignments: CenterAssignment[];
  };
}

export interface School {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  principalName: string;
  centerId: string;
  createdAt: string;
  updatedAt: string;
  students: Student[];
}

export interface Student {
  id: string;
  fullName: string;
  dateOfBirth: string;
  age: number;
  gender: string;
  grade: string;
  status: string;
  registrationDate: string;
  schoolId?: string;
  school?: {
    id: string;
    name: string;
  };
}

export interface CenterAssignment {
  id: string;
  specialEducator?: {
    id: string;
    fullName: string;
    yearsOfExperience: number;
  };
  superSpecialEducator?: {
    id: string;
    fullName: string;
    yearsOfExperience: number;
  };
  assignedDate: string;
  isActive: boolean;
}

export default function CenterDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [centerDetail, setCenterDetail] = useState<CenterDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (id) {
      loadCenterDetail();
    }
  }, [id]);

  const loadCenterDetail = async () => {
    try {
      setLoading(true);
      console.log('Loading center details for ID:', id);
      const response = await apiClient.getCenter(id as string);
      console.log('Center details response:', response);
      setCenterDetail(response);
    } catch (error: any) {
      console.error('Failed to load center detail:', error);
      console.error('Error response:', error.response?.data);
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to load center details. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8 p-6">
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!centerDetail) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Building className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-2xl font-semibold">Center not found</h2>
        <p className="text-muted-foreground">The center you're looking for doesn't exist or has been removed.</p>
        <Button onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Go Back
        </Button>
      </div>
    );
  }

  const { centerProfile } = centerDetail;
  const schools = centerProfile?.schools || [];
  const students = centerProfile?.students || [];
  const educators = centerProfile?.assignments || [];

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Building className="h-8 w-8 text-blue-600" />
              {centerProfile?.centerName || 'Unknown Center'}
            </h1>
            <p className="text-muted-foreground flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              {centerProfile?.address || 'No address provided'}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={centerDetail.isActive ? 'default' : 'secondary'}>
            {centerDetail.isActive ? 'Active' : 'Inactive'}
          </Badge>
          <Button variant="outline" onClick={loadCenterDetail}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Schools</CardTitle>
            <School className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{schools.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{students.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assigned Educators</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{educators.filter(e => e.isActive).length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Students</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{students.filter(s => s.status === 'ACTIVE').length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="schools">Schools ({schools.length})</TabsTrigger>
          <TabsTrigger value="students">Students ({students.length})</TabsTrigger>
          <TabsTrigger value="educators">Educators ({educators.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <CenterOverview 
            centerDetail={centerDetail} 
            onUpdate={loadCenterDetail}
          />
        </TabsContent>

        <TabsContent value="schools">
          <SchoolsManagement 
            centerId={id as string}
            schools={schools}
            onUpdate={loadCenterDetail}
          />
        </TabsContent>

        <TabsContent value="students">
          <StudentsListing 
            centerId={id as string}
            students={students}
            schools={schools}
            onUpdate={loadCenterDetail}
          />
        </TabsContent>

        <TabsContent value="educators">
          <EducatorsManagement 
            centerId={id as string}
            educators={educators}
            onUpdate={loadCenterDetail}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
