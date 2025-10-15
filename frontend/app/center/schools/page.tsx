'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  School, 
  Plus,
  Users,
  MapPin,
  Phone,
  Mail,
  User,
  Eye,
  Edit,
  RefreshCw,
  Building
} from 'lucide-react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';

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

export default function CenterSchools() {
  const { user } = useAuth();
  const [schools, setSchools] = useState<SchoolData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

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
          grade: student.grade
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
    } finally {
      setLoading(false);
    }
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Schools Management</h1>
              <p className="text-gray-600">Manage schools linked to your center</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={loadSchools}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Link href="/center/schools/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Link New School
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

        {/* Schools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSchools.map((school) => (
            <Card key={school.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <School className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{school.name}</CardTitle>
                      <CardDescription>
                        {school.studentCount} students enrolled
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* School Details */}
                <div className="space-y-2 text-sm">
                  {school.principalName && (
                    <div className="flex items-center space-x-2 text-gray-600">
                      <User className="h-4 w-4" />
                      <span>Principal: {school.principalName}</span>
                    </div>
                  )}
                  
                  {school.address && (
                    <div className="flex items-start space-x-2 text-gray-600">
                      <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span className="line-clamp-2">{school.address}</span>
                    </div>
                  )}
                  
                  {school.phone && (
                    <div className="flex items-center space-x-2 text-gray-600">
                      <Phone className="h-4 w-4" />
                      <span>{school.phone}</span>
                    </div>
                  )}
                  
                  {school.email && (
                    <div className="flex items-center space-x-2 text-gray-600">
                      <Mail className="h-4 w-4" />
                      <span className="truncate">{school.email}</span>
                    </div>
                  )}
                </div>

                {/* Statistics */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{school.activeStudentCount}</div>
                    <div className="text-xs text-gray-600">Active Students</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{school.viewerCount}</div>
                    <div className="text-xs text-gray-600">School Viewers</div>
                  </div>
                </div>

                {/* Recent Students */}
                {school.students.length > 0 && (
                  <div className="pt-4 border-t">
                    <h4 className="text-sm font-medium mb-2">Recent Students</h4>
                    <div className="space-y-1">
                      {school.students.slice(0, 3).map((student) => (
                        <div key={student.id} className="flex items-center justify-between text-sm">
                          <span className="truncate">{student.fullName}</span>
                          <Badge variant="outline" className="text-xs">
                            {student.grade}
                          </Badge>
                        </div>
                      ))}
                      {school.students.length > 3 && (
                        <div className="text-xs text-gray-500">
                          +{school.students.length - 3} more students
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-4">
                  <Link href={`/center/schools/${school.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      <Eye className="h-4 w-4 mr-1" />
                      View Details
                    </Button>
                  </Link>
                  <Link href={`/center/schools/${school.id}/students`} className="flex-1">
                    <Button size="sm" className="w-full">
                      <Users className="h-4 w-4 mr-1" />
                      Students
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredSchools.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
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
                <Link href="/center/schools/new">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Link New School
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        {schools.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common tasks for school management
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link href="/center/students">
                  <Button variant="outline" className="w-full h-auto p-4">
                    <div className="text-center">
                      <Users className="h-6 w-6 mx-auto mb-2" />
                      <div className="font-medium">View All Students</div>
                      <div className="text-xs text-gray-600">Across all schools</div>
                    </div>
                  </Button>
                </Link>
                
                <Link href="/center/students/new">
                  <Button variant="outline" className="w-full h-auto p-4">
                    <div className="text-center">
                      <Plus className="h-6 w-6 mx-auto mb-2" />
                      <div className="font-medium">Add New Student</div>
                      <div className="text-xs text-gray-600">Enroll to any school</div>
                    </div>
                  </Button>
                </Link>
                
                <Link href="/center/reports">
                  <Button variant="outline" className="w-full h-auto p-4">
                    <div className="text-center">
                      <Eye className="h-6 w-6 mx-auto mb-2" />
                      <div className="font-medium">View Reports</div>
                      <div className="text-xs text-gray-600">All school reports</div>
                    </div>
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
