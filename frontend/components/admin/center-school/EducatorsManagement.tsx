'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Users,
  Trash2,
  Calendar,
  Award,
  User,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  Mail,
  Phone
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
// Import extended CenterAssignment interface with additional fields
interface CenterAssignment {
  id: string;
  specialEducator?: {
    id: string;
    fullName: string;
    yearsOfExperience: number;
    email?: string;
    phone?: string;
  };
  superSpecialEducator?: {
    id: string;
    fullName: string;
    yearsOfExperience: number;
    email?: string;
    phone?: string;
  };
  assignedDate: string;
  isActive: boolean;
}

interface EducatorsManagementProps {
  centerId: string;
  educators: CenterAssignment[];
  onUpdate: () => void;
}

export default function EducatorsManagement({ centerId, educators, onUpdate }: EducatorsManagementProps) {
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  // Define getEducatorInfo function before using it
  const getEducatorInfo = (assignment: CenterAssignment) => {
    if (assignment.specialEducator) {
      return {
        name: assignment.specialEducator.fullName,
        type: 'Special Educator',
        experience: assignment.specialEducator.yearsOfExperience,
        id: assignment.specialEducator.id,
        email: assignment.specialEducator.email || '',
        phone: assignment.specialEducator.phone || ''
      };
    } else if (assignment.superSpecialEducator) {
      return {
        name: assignment.superSpecialEducator.fullName,
        type: 'Super Special Educator',
        experience: assignment.superSpecialEducator.yearsOfExperience,
        id: assignment.superSpecialEducator.id,
        email: assignment.superSpecialEducator.email || '',
        phone: assignment.superSpecialEducator.phone || ''
      };
    }
    return null;
  };

  // Filter educators based on search and type filter
  const filteredEducators = educators.filter(educator => {
    const educatorInfo = getEducatorInfo(educator);
    if (!educatorInfo) return false;
    
    const matchesSearch = !searchQuery || 
      educatorInfo.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = typeFilter === 'all' || 
      (typeFilter === 'special' && educator.specialEducator) ||
      (typeFilter === 'super' && educator.superSpecialEducator);
    
    return matchesSearch && matchesType;
  });

  const handleRemoveEducator = async (assignmentId: string, educatorName: string) => {
    try {
      setLoading(true);
      await apiClient.removeEducatorFromCenter(centerId, assignmentId);
      toast({
        title: "Success",
        description: `${educatorName} has been removed from this center.`,
      });
      onUpdate();
    } catch (error) {
      console.error('Failed to remove educator:', error);
      toast({
        title: "Error",
        description: "Failed to remove educator. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // getEducatorInfo function moved to the top of the component

  const activeEducators = educators.filter(e => e.isActive);
  const inactiveEducators = educators.filter(e => !e.isActive);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-orange-600" />
              Educators ({activeEducators.length} active, {inactiveEducators.length} inactive)
            </CardTitle>
            <CardDescription>
              Educators assigned to this center
            </CardDescription>
          </div>
          {/* No assign educator button as requested */}
        </CardHeader>
      </Card>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-blue-600" />
            Search & Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="special">Special Educators</SelectItem>
                <SelectItem value="super">Super Special Educators</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Active Educators */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Active Educators ({activeEducators.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredEducators.filter(e => e.isActive).length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No active educators</h3>
              <p className="text-muted-foreground mb-4">
                {activeEducators.length === 0 ? 
                  "This center doesn't have any active educators assigned yet." :
                  "No educators match your search criteria."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredEducators.filter(e => e.isActive).map((assignment) => {
                const educatorInfo = getEducatorInfo(assignment);
                if (!educatorInfo) return null;

                return (
                  <Card key={assignment.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex flex-col md:flex-row md:items-center gap-4">
                          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                            <User className="h-8 w-8 text-orange-600" />
                          </div>
                          <div className="space-y-2">
                            <h3 className="text-xl font-semibold">{educatorInfo.name}</h3>
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant="outline" className="text-sm">{educatorInfo.type}</Badge>
                              {educatorInfo.experience && (
                                <Badge variant="secondary" className="flex items-center gap-1">
                                  <Award className="h-3 w-3" />
                                  {educatorInfo.experience} years experience
                                </Badge>
                              )}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                Assigned: {new Date(assignment.assignedDate).toLocaleDateString()}
                              </div>
                              <div className="flex items-center gap-1">
                                <Mail className="h-4 w-4" />
                                {educatorInfo.email || 'No email provided'}
                              </div>
                              <div className="flex items-center gap-1">
                                <Phone className="h-4 w-4" />
                                {educatorInfo.phone || 'No phone provided'}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              disabled={loading}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remove Educator</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to remove {educatorInfo.name} from this center? 
                                This will end their assignment to this center.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleRemoveEducator(assignment.id, educatorInfo.name)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Remove Educator
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Inactive Educators */}
      {filteredEducators.filter(e => !e.isActive).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-gray-600" />
              Inactive Educators ({inactiveEducators.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredEducators.filter(e => !e.isActive).map((assignment) => {
                const educatorInfo = getEducatorInfo(assignment);
                if (!educatorInfo) return null;

                return (
                  <Card key={assignment.id} className="border-gray-200 bg-gray-50">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                          <User className="h-6 w-6 text-gray-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-700">{educatorInfo.name}</h3>
                          <div className="flex items-center gap-4 mt-1">
                            <Badge variant="secondary">{educatorInfo.type}</Badge>
                            <Badge variant="secondary">Inactive</Badge>
                            {educatorInfo.experience && (
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Award className="h-4 w-4" />
                                {educatorInfo.experience} years experience
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground mt-2">
                            <Calendar className="h-4 w-4" />
                            Was assigned: {new Date(assignment.assignedDate).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Stats - Redesigned with better visual hierarchy */}
      {educators.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="md:col-span-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-blue-800">Educator Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-center gap-4">
                  <div className="bg-green-100 p-3 rounded-full">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-green-600">
                      {activeEducators.length}
                    </div>
                    <div className="text-sm text-muted-foreground">Active Educators</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="bg-blue-100 p-3 rounded-full">
                    <Users className="h-8 w-8 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-blue-600">
                      {activeEducators.filter(e => e.specialEducator).length}
                    </div>
                    <div className="text-sm text-muted-foreground">Special Educators</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="bg-purple-100 p-3 rounded-full">
                    <Award className="h-8 w-8 text-purple-600" />
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-purple-600">
                      {activeEducators.filter(e => e.superSpecialEducator).length}
                    </div>
                    <div className="text-sm text-muted-foreground">Super Special Educators</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
