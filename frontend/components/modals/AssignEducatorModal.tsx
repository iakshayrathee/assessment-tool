'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Search,
  UserCheck,
  Mail,
  Phone,
  GraduationCap,
  Users,
  Building2,
  Calendar,
  Award
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface Educator {
  assignmentId?: string;
  educatorId: string;
  type: string;
  fullName: string;
  email: string;
  phone?: string;
  yearsOfExperience: number;
  specializationAreas: string[];
  isActive: boolean;
  lastLogin?: string;
  assignedDate?: string;
  assignedStudentCount: number;
  assignedCenterCount: number;
  assignedStudents: any[];
  assignedSchools: any[];
}

interface AssignEducatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  studentName: string;
  centerId: string;
  onAssignmentComplete: () => void;
}

export default function AssignEducatorModal({ 
  isOpen, 
  onClose, 
  studentId, 
  studentName, 
  centerId,
  onAssignmentComplete 
}: AssignEducatorModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState<string | null>(null);
  const [educators, setEducators] = useState<Educator[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredEducators, setFilteredEducators] = useState<Educator[]>([]);

  useEffect(() => {
    if (isOpen) {
      loadEducators();
    }
  }, [isOpen, centerId]);

  useEffect(() => {
    // Filter educators based on search term
    const filtered = educators.filter(educator =>
      educator.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      educator.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      educator.specializationAreas.some(area => 
        area.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
    setFilteredEducators(filtered);
  }, [educators, searchTerm]);

  const loadEducators = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getCenterEducators(centerId);
      
      // Handle paginated response structure
      const educatorsData = response.data || [];
      
      // Transform backend data to match frontend interface
      const transformedEducators: Educator[] = educatorsData
        .filter((educator: any) => educator.type === 'Special Educator')
        .map((educator: any) => ({
          assignmentId: educator.assignmentId,
          educatorId: educator.educatorId,
          type: educator.type,
          fullName: educator.fullName,
          email: educator.email,
          phone: educator.phone,
          yearsOfExperience: educator.yearsOfExperience || 0,
          specializationAreas: educator.specializationAreas || [],
          isActive: educator.isActive || true,
          lastLogin: educator.lastLogin,
          assignedDate: educator.assignedDate,
          assignedStudentCount: educator.assignedStudentCount || 0,
          assignedCenterCount: educator.assignedCenterCount || 0,
          assignedStudents: educator.assignedStudents || [],
          assignedSchools: educator.assignedSchools || []
        }));

      setEducators(transformedEducators);
    } catch (error) {
      console.error('Failed to load educators:', error);
      toast({
        title: "Error",
        description: "Failed to load educators. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAssignEducator = async (educatorId: string, educatorName: string) => {
    try {
      setAssigning(educatorId);
      await apiClient.assignStudentToEducator(studentId, educatorId);
      
      toast({
        title: "Assignment Successful",
        description: `${studentName} has been assigned to ${educatorName} successfully.`,
      });
      
      onAssignmentComplete();
      onClose();
    } catch (error: any) {
      console.error('Failed to assign educator:', error);
      toast({
        title: "Assignment Failed",
        description: error.response?.data?.error || "Failed to assign educator. Please try again.",
        variant: "destructive",
      });
    } finally {
      setAssigning(null);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  const getExperienceColor = (years: number) => {
    if (years >= 10) return 'bg-success/10 text-foreground';
    if (years >= 5) return 'bg-primary/10 text-primary';
    if (years >= 2) return 'bg-warning/10 text-foreground';
    return 'bg-muted text-foreground';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Assign Educator to {studentName}
          </DialogTitle>
          <DialogDescription>
            Select an educator from the list below to assign to this student.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search educators by name, email, or specialization..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Educators Table */}
          <div className="flex-1 overflow-auto border rounded-lg">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-primary border-t-transparent mx-auto mb-2"></div>
                  <p className="text-muted-foreground">Loading educators...</p>
                </div>
              </div>
            ) : filteredEducators.length === 0 ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">
                    {searchTerm ? 'No educators found matching your search.' : 'No educators available.'}
                  </p>
                </div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Educator</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Experience</TableHead>
                    <TableHead>Specializations</TableHead>
                    <TableHead>Current Load</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEducators.map((educator) => (
                    <TableRow key={educator.educatorId} className="hover:bg-muted/40">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <UserCheck className="h-5 w-5 text-primary" />
                            </div>
                          </div>
                          <div>
                            <div className="font-medium text-foreground">{educator.fullName}</div>
                            <div className="text-sm text-muted-foreground">{educator.type}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            <span className="text-muted-foreground">{educator.email}</span>
                          </div>
                          {educator.phone && (
                            <div className="flex items-center gap-1 text-sm">
                              <Phone className="h-3 w-3 text-muted-foreground" />
                              <span className="text-muted-foreground">{educator.phone}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getExperienceColor(educator.yearsOfExperience)}>
                          {educator.yearsOfExperience} years
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {educator.specializationAreas.slice(0, 2).map((area, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {area}
                            </Badge>
                          ))}
                          {educator.specializationAreas.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{educator.specializationAreas.length - 2} more
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3 text-muted-foreground" />
                            <span>{educator.assignedStudentCount} students</span>
                          </div>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Building2 className="h-3 w-3 text-muted-foreground" />
                            <span>{educator.assignedSchools.length} schools</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {formatDate(educator.lastLogin)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          onClick={() => handleAssignEducator(educator.educatorId, educator.fullName)}
                          disabled={assigning === educator.educatorId}
                          size="sm"
                        >
                          {assigning === educator.educatorId ? (
                            <>
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                              Assigning...
                            </>
                          ) : (
                            <>
                              <UserCheck className="h-4 w-4 mr-1" />
                              Assign
                            </>
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}