'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import { PageHeader } from '@/components/ui/page-header';
import { useToast } from '@/hooks/use-toast';
import { 
  User, 
  UserCheck, 
  Search,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Clock,
  Star,
  Users,
  GraduationCap
} from 'lucide-react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';

interface Student {
  id: string;
  fullName: string;
  grade: string;
  status: string;
}

interface Educator {
  id: string;
  fullName: string;
  yearsOfExperience: number;
  specializationAreas: string[];
  assignedStudentCount: number;
  isActive: boolean;
  user: {
    email: string;
    lastLogin?: string;
  };
}

export default function AssignStudentPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [student, setStudent] = useState<Student | null>(null);
  const [educators, setEducators] = useState<Educator[]>([]);
  const [filteredEducators, setFilteredEducators] = useState<Educator[]>([]);
  const [selectedEducatorId, setSelectedEducatorId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [experienceFilter, setExperienceFilter] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const studentId = params.id as string;

  useEffect(() => {
    loadData();
  }, [studentId]);

  useEffect(() => {
    filterEducators();
  }, [educators, searchTerm, experienceFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const centerId = user?.profile?.id;
      if (!centerId) {
        setError('Center ID not found');
        return;
      }

      const [studentData, educatorsData] = await Promise.all([
        apiClient.getStudent(studentId),
        apiClient.getCenterEducators(centerId)
      ]);

      setStudent(studentData);
      // Filter only special educators (not super special educators)
      const specialEducators = educatorsData.filter(edu => edu.type === 'Special Educator');
      setEducators(specialEducators);
    } catch (error) {
      console.error('Failed to load data:', error);
      setError('Failed to load assignment data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filterEducators = () => {
    let filtered = educators.filter(educator => educator.isActive);

    if (searchTerm) {
      filtered = filtered.filter(educator =>
        educator.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        educator.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        educator.specializationAreas.some(area => 
          area.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    if (experienceFilter) {
      const minExperience = parseInt(experienceFilter);
      filtered = filtered.filter(educator => educator.yearsOfExperience >= minExperience);
    }

    // Sort by workload (fewer students first) and then by experience
    filtered.sort((a, b) => {
      if (a.assignedStudentCount !== b.assignedStudentCount) {
        return a.assignedStudentCount - b.assignedStudentCount;
      }
      return b.yearsOfExperience - a.yearsOfExperience;
    });

    setFilteredEducators(filtered);
  };

  const handleAssignEducator = async () => {
    if (!selectedEducatorId) {
      toast({
        title: "Error",
        description: "Please select an educator to assign.",
        variant: "destructive",
      });
      return;
    }

    try {
      setAssigning(true);
      await apiClient.assignStudentToEducator(studentId, selectedEducatorId);
      
      toast({
        title: "Success",
        description: "Student assigned to educator successfully.",
      });
      
      router.push(`/center/students/${studentId}`);
    } catch (error) {
      console.error('Failed to assign educator:', error);
      toast({
        title: "Error",
        description: "Failed to assign educator. Please try again.",
        variant: "destructive",
      });
    } finally {
      setAssigning(false);
    }
  };

  const getWorkloadColor = (studentCount: number) => {
    if (studentCount <= 5) return 'text-green-600 bg-green-50';
    if (studentCount <= 10) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getExperienceLevel = (years: number) => {
    if (years >= 10) return { label: 'Senior', color: 'text-purple-600 bg-purple-50' };
    if (years >= 5) return { label: 'Experienced', color: 'text-blue-600 bg-blue-50' };
    if (years >= 2) return { label: 'Mid-level', color: 'text-green-600 bg-green-50' };
    return { label: 'Junior', color: 'text-orange-600 bg-orange-50' };
  };

  if (loading) {
    return (
      <div className="space-y-8 p-6">
        <LoadingSkeleton className="h-32" />
        <div className="grid grid-cols-1 gap-6">
          <LoadingSkeleton className="h-24" />
          <LoadingSkeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">{error || 'Student not found'}</p>
          <div className="flex gap-4 justify-center">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
            <Button onClick={loadData}>
              Try Again
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      <PageHeader
        title={`Assign Educator to ${student.fullName}`}
        description={`Grade ${student.grade} • Select a special educator for this student`}
        badge={{
          text: `${filteredEducators.length} Available`,
          variant: 'secondary'
        }}
        actions={[
          {
            label: 'Back to Student',
            href: `/center/students/${studentId}`,
            icon: ArrowLeft,
            variant: 'outline'
          }
        ]}
      />

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Filter Educators
            </CardTitle>
            <CardDescription>
              Find the best educator match for this student
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Search by name, email, or specialization</label>
                <Input
                  placeholder="Search educators..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Minimum experience</label>
                <Select value={experienceFilter} onValueChange={setExperienceFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Any experience level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any experience level</SelectItem>
                    <SelectItem value="1">1+ years</SelectItem>
                    <SelectItem value="2">2+ years</SelectItem>
                    <SelectItem value="5">5+ years</SelectItem>
                    <SelectItem value="10">10+ years</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Educator Selection */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Available Educators
            </CardTitle>
            <CardDescription>
              Select an educator to assign to {student.fullName}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredEducators.length > 0 ? (
              <div className="space-y-4">
                {filteredEducators.map((educator) => {
                  const experienceLevel = getExperienceLevel(educator.yearsOfExperience);
                  const isSelected = selectedEducatorId === educator.id;
                  
                  return (
                    <motion.div
                      key={educator.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      whileHover={{ scale: 1.02 }}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                        isSelected 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => setSelectedEducatorId(educator.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                            isSelected ? 'bg-primary text-primary-foreground' : 'bg-blue-100'
                          }`}>
                            {isSelected ? (
                              <CheckCircle className="h-6 w-6" />
                            ) : (
                              <span className="text-blue-600 font-semibold">
                                {educator.fullName.split(' ').map(n => n[0]).join('')}
                              </span>
                            )}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{educator.fullName}</h3>
                            <p className="text-sm text-muted-foreground">{educator.user.email}</p>
                            
                            <div className="flex items-center gap-2 mt-2">
                              <Badge className={experienceLevel.color}>
                                <GraduationCap className="h-3 w-3 mr-1" />
                                {experienceLevel.label} ({educator.yearsOfExperience}y)
                              </Badge>
                              
                              <Badge className={getWorkloadColor(educator.assignedStudentCount)}>
                                <Users className="h-3 w-3 mr-1" />
                                {educator.assignedStudentCount} students
                              </Badge>
                              
                              {educator.user.lastLogin && (
                                <Badge variant="outline">
                                  <Clock className="h-3 w-3 mr-1" />
                                  Last active: {new Date(educator.user.lastLogin).toLocaleDateString()}
                                </Badge>
                              )}
                            </div>
                            
                            {educator.specializationAreas.length > 0 && (
                              <div className="mt-2">
                                <p className="text-sm text-muted-foreground mb-1">Specializations:</p>
                                <div className="flex flex-wrap gap-1">
                                  {educator.specializationAreas.map((area, index) => (
                                    <Badge key={index} variant="secondary" className="text-xs">
                                      {area}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end gap-2">
                          {educator.assignedStudentCount <= 5 && (
                            <Badge className="text-green-600 bg-green-50">
                              <Star className="h-3 w-3 mr-1" />
                              Recommended
                            </Badge>
                          )}
                          
                          <div className="text-right">
                            <p className="text-sm font-medium">Workload</p>
                            <p className={`text-xs ${
                              educator.assignedStudentCount <= 5 ? 'text-green-600' :
                              educator.assignedStudentCount <= 10 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {educator.assignedStudentCount <= 5 ? 'Light' :
                               educator.assignedStudentCount <= 10 ? 'Moderate' : 'Heavy'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <UserCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-2">No educators match your criteria</p>
                <p className="text-sm text-muted-foreground">Try adjusting your filters</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Assignment Actions */}
      {selectedEducatorId && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-end gap-4"
        >
          <Button 
            variant="outline" 
            onClick={() => router.back()}
            disabled={assigning}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleAssignEducator}
            disabled={assigning}
            className="min-w-32"
          >
            {assigning ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                />
                Assigning...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Assign Educator
              </>
            )}
          </Button>
        </motion.div>
      )}
    </div>
  );
}
