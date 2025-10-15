'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Search, 
  Filter,
  UserCheck,
  UserX,
  Eye,
  School,
  GraduationCap,
  Calendar,
  BookOpen
} from 'lucide-react';
import Link from 'next/link';
import { useCenterStudents, useCenterSchools, useCenterEducators } from '@/hooks/useCenter';
import { useAuth } from '@/hooks/useAuth';

interface UnifiedStudentViewProps {
  viewType?: 'all' | 'by-school' | 'by-educator' | 'unassigned';
  contextId?: string; // schoolId or educatorId when filtering
  contextName?: string; // school name or educator name
}

export function UnifiedStudentView({ 
  viewType = 'all', 
  contextId, 
  contextName 
}: UnifiedStudentViewProps) {
  const { user } = useAuth();
  const centerId = user?.profile?.id;

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [schoolFilter, setSchoolFilter] = useState(contextId || 'all');
  const [educatorFilter, setEducatorFilter] = useState('all');
  const [assignmentFilter, setAssignmentFilter] = useState(
    viewType === 'unassigned' ? 'unassigned' : 'all'
  );

  // Data fetching with React Query
  const { 
    students, 
    pagination, 
    isLoading, 
    assignStudent, 
    isAssigning 
  } = useCenterStudents(centerId, {
    page: 1,
    limit: 20,
    search: searchTerm,
    status: statusFilter === 'all' ? undefined : statusFilter,
    schoolId: schoolFilter === 'all' ? undefined : schoolFilter,
    hasAssignment: assignmentFilter === 'assigned' ? true : 
                   assignmentFilter === 'unassigned' ? false : undefined
  });

  const { schools } = useCenterSchools(centerId);
  const { educators } = useCenterEducators(centerId);

  // Filter students based on context
  const filteredStudents = useMemo(() => {
    let filtered = students;

    if (viewType === 'by-school' && contextId) {
      filtered = filtered.filter(student => student.school?.id === contextId);
    } else if (viewType === 'by-educator' && contextId) {
      filtered = filtered.filter(student => student.assignedEducator?.id === contextId);
    } else if (viewType === 'unassigned') {
      filtered = filtered.filter(student => !student.hasAssignment);
    }

    return filtered;
  }, [students, viewType, contextId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'INACTIVE': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getViewTitle = () => {
    switch (viewType) {
      case 'by-school': return `Students in ${contextName}`;
      case 'by-educator': return `Students assigned to ${contextName}`;
      case 'unassigned': return 'Unassigned Students';
      default: return 'All Students';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with context */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{getViewTitle()}</h2>
          <p className="text-muted-foreground">
            {filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''}
            {contextName && ` • ${contextName}`}
          </p>
        </div>
        
        {viewType === 'unassigned' && (
          <Badge variant="outline" className="text-orange-600 border-orange-200">
            Needs Assignment
          </Badge>
        )}
      </div>

      {/* Filters - Only show when not in specific context */}
      {viewType === 'all' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filter Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Input
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={schoolFilter} onValueChange={setSchoolFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All schools" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All schools</SelectItem>
                  {schools.map(school => (
                    <SelectItem key={school.id} value={school.id}>
                      {school.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={assignmentFilter} onValueChange={setAssignmentFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Assignment status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All students</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Students List */}
      <div className="grid gap-4">
        {filteredStudents.map((student, index) => (
          <motion.div
            key={student.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-semibold">
                        {student.fullName.split(' ').map((n: string) => n[0]).join('')}
                      </span>
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{student.fullName}</h3>
                        <Badge className={getStatusColor(student.status)}>
                          {student.status}
                        </Badge>
                        {!student.hasAssignment && (
                          <Badge variant="outline" className="text-orange-600">
                            Unassigned
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <BookOpen className="h-3 w-3" />
                          Grade {student.grade}
                        </div>
                        
                        {student.school && (
                          <div className="flex items-center gap-1">
                            <School className="h-3 w-3" />
                            {student.school.name}
                          </div>
                        )}
                        
                        {student.assignedEducator && (
                          <div className="flex items-center gap-1">
                            <GraduationCap className="h-3 w-3" />
                            {student.assignedEducator.fullName}
                          </div>
                        )}
                        
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(student.registrationDate).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Link href={`/center/students/${student.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                    </Link>
                    
                    {!student.hasAssignment && (
                      <Link href={`/center/students/${student.id}/assign`}>
                        <Button size="sm">
                          <UserCheck className="h-3 w-3 mr-1" />
                          Assign
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {filteredStudents.length === 0 && (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-2">
            No students found
          </p>
          <p className="text-sm text-muted-foreground">
            {viewType === 'unassigned' 
              ? 'All students have been assigned to educators'
              : 'Try adjusting your search criteria'
            }
          </p>
        </div>
      )}
    </div>
  );
}
