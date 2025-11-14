'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { 
  GraduationCap,
  Users,
  Plus,
  Search,
  Filter,
  Edit,
  Eye,
  UserCheck,
  UserX,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Activity,
  RefreshCw,
  Download,
  MoreHorizontal,
  Building,
  Star,
  TrendingUp,
  Clock,
  BookOpen,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { CreateUserModal } from '@/components/modals/CreateUserModal';

interface Center {
  id: string;
  name: string;
  address: string;
  email: string;
}

interface Educator {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'SPECIAL_EDUCATOR' | 'SUPER_SPECIAL_EDUCATOR';
  isActive: boolean;
  centerName?: string;
  centerId?: string;
  specializations: string[];
  experience: number;
  linkedStudents: number;
  workloadPercentage: number;
  lastLogin?: string;
  createdAt: string;
  performance: {
    rating: number;
    completedAssessments: number;
    activeIEPs: number;
  };
}

export default function EducatorManagementPage() {
  const { user } = useAuth();
  const [educators, setEducators] = useState<Educator[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [centerFilter, setCenterFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [centers, setCenters] = useState<Center[]>([]);
  const [centersCurrentPage, setCentersCurrentPage] = useState(1);
  const [centersTotalPages, setCentersTotalPages] = useState(1);
  const [centersLoading, setCentersLoading] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedEducator, setSelectedEducator] = useState<Educator | null>(null);
  const [selectedCenterId, setSelectedCenterId] = useState('');
  const [workloadDialogOpen, setWorkloadDialogOpen] = useState(false);
  const [workloadEducator, setWorkloadEducator] = useState<Educator | null>(null);
  const [createUserModalOpen, setCreateUserModalOpen] = useState(false);

  // Load centers only once on mount
  useEffect(() => {
    loadCenters(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadEducators = useCallback(async () => {
    try {
      setLoading(true);
      
      // Load educators from backend API
      // When roleFilter is 'all', we don't pass role filter (get all users) and filter client-side
      const params = {
        page: currentPage,
        limit: 10,
        search: searchQuery || undefined,
        role: roleFilter !== 'all' ? roleFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined
      };

      const response = await apiClient.getAllUsers(params);
      
      console.log('Raw API response:', response);
      console.log('Available users:', response.data?.length || 0);
      console.log('User roles found:', response.data?.map((u: any) => u.role) || []);
      console.log('All users details:', response.data?.map((u: any) => ({
        id: u.id,
        email: u.email,
        role: u.role,
        isActive: u.isActive,
        hasSpecialProfile: !!u.specialEducatorProfile,
        hasSuperSpecialProfile: !!u.superSpecialEducatorProfile
      })) || []);
      
      // Transform backend data to match frontend interface
      let transformedEducators: Educator[] = (response.data || [])
        .filter((user: any) => {
          const hasEducatorRole = user.role === 'SPECIAL_EDUCATOR' || user.role === 'SUPER_SPECIAL_EDUCATOR';
          const hasEducatorProfile = user.specialEducatorProfile || user.superSpecialEducatorProfile;
          console.log(`User ${user.email}: role=${user.role}, hasProfile=${!!hasEducatorProfile}`);
          return hasEducatorRole || hasEducatorProfile;
        })
        .map((user: any) => {
          const profile = user.specialEducatorProfile || user.superSpecialEducatorProfile;
          const linkedStudents = profile?.linkedStudents || 0;
          
          return {
            id: user.id,
            name: profile?.fullName || user.email,
            email: user.email,
            phone: profile?.phone || '',
            role: user.role,
            isActive: user.isActive,
            centerName: profile?.centerName || 'Not Assigned',
            centerId: profile?.centerId || '',
            specializations: profile?.specializations || [],
            experience: profile?.experience || 0,
            linkedStudents: linkedStudents,
            workloadPercentage: Math.min(100, (linkedStudents / 15) * 100),
            lastLogin: user.lastLogin,
            createdAt: user.createdAt,
            performance: {
              rating: 4.5, // This would come from a separate performance API
              completedAssessments: 0, // This would come from assessments API
              activeIEPs: linkedStudents
            }
          };
        });
      
      console.log('Transformed educators:', transformedEducators.length);
      console.log('API response structure:', response);
      
      // Use actual pagination from API response
      // Note: We use the total count from API for pagination controls
      // but we display the filtered educators client-side
      const totalPages = Math.ceil(response.pagination?.total / 10);
      setTotalPages(totalPages);

      setEducators(transformedEducators);
    } catch (error) {
      console.error('Failed to load educators:', error);
      toast({
        title: "Error",
        description: "Failed to load educators. Please try again.",
        variant: "destructive",
      });
      setEducators([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchQuery, roleFilter, centerFilter, statusFilter]);

  // Load educators when filters change
  useEffect(() => {
    loadEducators();
  }, [currentPage, searchQuery, roleFilter, centerFilter, statusFilter]);

  const loadCenters = async (page: number = 1) => {
    try {
      setCentersLoading(true);
      console.log('Loading centers...');
      const response = await apiClient.getAllCenters({ page, limit: 10 });
      console.log('Centers API response:', response);
      
      // Extract center data from the response
      let centerData: Center[] = [];
      if (response && response.data) {
        // Map the data to extract center information from centerProfile
        centerData = response.data.map((item: any) => ({
          id: item.centerProfile?.id || item.id,
          name: item.centerProfile?.centerName || 'Unknown Center',
          address: item.centerProfile?.address || '',
          email: item.centerProfile?.email || item.email || ''
        }));
      }
      
      console.log('Processed center data:', centerData);
      setCenters(centerData);
      setCentersTotalPages(response?.pagination?.totalPages || 1);
      setCentersCurrentPage(page);
    } catch (error) {
      console.error('Failed to load centers:', error);
      // If API fails, provide some demo centers
      setCenters([
        { id: 'center-1', name: 'Knowled Learning Center - Delhi Branch', address: '42, Vasant Kunj, South Delhi', email: 'delhi@knowled.com' },
        { id: 'center-2', name: 'Knowled Learning Center - Mumbai Branch', address: '45, Linking Road, Bandra West', email: 'mumbai@knowled.com' },
        { id: 'center-3', name: 'Knowled Learning Center - Bangalore Branch', address: '78, Brigade Road', email: 'bangalore@knowled.com' },
        { id: 'center-4', name: 'Knowled Learning Center - Chennai Branch', address: '23, Anna Salai', email: 'chennai@knowled.com' }
      ]);
    } finally {
      setCentersLoading(false);
    }
  };

  const handleToggleStatus = async (educatorId: string, currentStatus: boolean) => {
    try {
      // If it's a demo educator, just update the state without API call
      if (educatorId.startsWith('demo')) {
        console.log('Toggling demo educator status:', { educatorId, currentStatus });
        
        // Update the educator in state with the new status
        const updatedEducators = educators.map(e => {
          if (e.id === educatorId) {
            return {
              ...e,
              isActive: !currentStatus
            };
          }
          return e;
        });
        
        setEducators(updatedEducators);
        
        const action = currentStatus ? 'deactivated' : 'activated';
        toast({
          title: `Educator ${action}`,
          description: `The educator has been ${action} successfully.`,
        });
      } else {
        // For real educators, make the API call
        if (currentStatus) {
          await apiClient.deactivateUser(educatorId);
        } else {
          await apiClient.activateUser(educatorId);
        }
        
        const action = currentStatus ? 'deactivated' : 'activated';
        toast({
          title: `Educator ${action}`,
          description: `The educator has been ${action} successfully.`,
        });
        loadEducators();
      }
    } catch (error) {
      console.error('Failed to toggle educator status:', error);
      toast({
        title: "Error",
        description: "Failed to update educator status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAssignToCenter = async (educatorId: string, centerId: string) => {
    try {
      const educator = educators.find(e => e.id === educatorId);
      if (!educator) return;
      
      // If it's a demo educator, just update the state without API call
      if (educatorId.startsWith('demo')) {
        console.log('Assigning demo educator to center:', { educatorId, centerId });
        const selectedCenter = centers.find(c => c.id === centerId);
        
        if (selectedCenter) {
          // Update the educator in state with the new center assignment
          const updatedEducators = educators.map(e => {
            if (e.id === educatorId) {
              return {
                ...e,
                centerId: selectedCenter.id,
                centerName: selectedCenter.name
              };
            }
            return e;
          });
          
          setEducators(updatedEducators);
          
          toast({
            title: "Educator Assigned",
            description: `${educator.name} has been assigned to ${selectedCenter.name} successfully.`,
          });
        }
      } else {
        // For real educators, make the API call
        await apiClient.assignEducatorToCenter(centerId, educatorId, educator.role);
        
        toast({
          title: "Educator Assigned",
          description: "The educator has been assigned to the center successfully.",
        });
        loadEducators();
      }
    } catch (error) {
      console.error('Failed to assign educator to center:', error);
      toast({
        title: "Error",
        description: "Failed to assign educator to center. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'SUPER_SPECIAL_EDUCATOR': return 'bg-purple-100 text-purple-800';
      case 'SPECIAL_EDUCATOR': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getWorkloadColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-green-600';
  };

  const filteredEducators = useMemo(() => {
    return educators.filter(educator => {
      const matchesSearch = !searchQuery || 
        educator.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        educator.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        educator.specializations.some(spec => spec.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesRole = roleFilter === 'all' || educator.role === roleFilter;
      const matchesCenter = centerFilter === 'all' || educator.centerId === centerFilter;
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'active' && educator.isActive) ||
        (statusFilter === 'inactive' && !educator.isActive);
      
      return matchesSearch && matchesRole && matchesCenter && matchesStatus;
    });
  }, [educators, searchQuery, roleFilter, centerFilter, statusFilter]);

  const stats = useMemo(() => ({
    total: filteredEducators.length,
    active: filteredEducators.filter(e => e.isActive).length,
    superSpecial: filteredEducators.filter(e => e.role === 'SUPER_SPECIAL_EDUCATOR').length,
    special: filteredEducators.filter(e => e.role === 'SPECIAL_EDUCATOR').length,
    averageWorkload: filteredEducators.length > 0 ? Math.round(filteredEducators.reduce((sum, e) => sum + e.workloadPercentage, 0) / filteredEducators.length) : 0
  }), [filteredEducators]);

  if (loading) {
    return (
      <div className="space-y-8 p-6">
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-6 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent>
            <div className="space-y-3 mt-6">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Educator Management</h1>
          <p className="text-muted-foreground">
            Manage Special & Super Special Educators, assignments, and workloads
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary">
            {stats.total} Educators
          </Badge>
          <Button variant="outline" onClick={loadEducators}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => setCreateUserModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Educator
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid gap-6 md:grid-cols-4"
      >
        <Card>
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 pb-3">
            <div className="flex items-center justify-between">
              <GraduationCap className="h-8 w-8 text-blue-600" />
              <Badge variant="secondary">{stats.active} Active</Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Total Educators</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 pb-3">
            <div className="flex items-center justify-between">
              <Star className="h-8 w-8 text-purple-600" />
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats.superSpecial}</div>
            <div className="text-sm text-muted-foreground">Super Special Educators</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 pb-3">
            <div className="flex items-center justify-between">
              <BookOpen className="h-8 w-8 text-green-600" />
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats.special}</div>
            <div className="text-sm text-muted-foreground">Special Educators</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950 dark:to-red-950 pb-3">
            <div className="flex items-center justify-between">
              <Activity className="h-8 w-8 text-orange-600" />
              <Badge variant={stats.averageWorkload > 80 ? "destructive" : "secondary"}>
                {stats.averageWorkload}%
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats.averageWorkload}%</div>
            <div className="text-sm text-muted-foreground">Average Workload</div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-blue-600" />
              Search & Filter Educators
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-64">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search by name, email, or specialization..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="SUPER_SPECIAL_EDUCATOR">Super Special Educator</SelectItem>
                  <SelectItem value="SPECIAL_EDUCATOR">Special Educator</SelectItem>
                </SelectContent>
              </Select>

              <Select value={centerFilter} onValueChange={setCenterFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Centers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Centers</SelectItem>
                  {centers.map((center) => (
                    <SelectItem key={center.id} value={center.id}>
                      {center.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Educators Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950">
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-purple-600" />
              Educators ({filteredEducators.length})
            </CardTitle>
            <CardDescription>
              View educator details, workloads, and manage assignments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Educator Details</TableHead>
                  <TableHead>Role & Center</TableHead>
                  <TableHead>Specializations</TableHead>
                  <TableHead>Workload</TableHead>
                  <TableHead>Performance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEducators.map((educator) => (
                  <TableRow key={educator.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{educator.name}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {educator.email}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {educator.phone}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {educator.experience} years exp.
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Badge className={getRoleColor(educator.role)}>
                          {educator.role === 'SUPER_SPECIAL_EDUCATOR' ? 'Super Special' : 'Special'}
                        </Badge>
                        {educator.centerName && (
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <Building className="h-3 w-3" />
                            {educator.centerName}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {educator.specializations.slice(0, 2).map((spec, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {spec}
                          </Badge>
                        ))}
                        {educator.specializations.length > 2 && (
                          <div className="text-xs text-muted-foreground">
                            +{educator.specializations.length - 2} more
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className={`text-sm font-medium ${getWorkloadColor(educator.workloadPercentage)}`}>
                            {educator.workloadPercentage}%
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto p-1 text-xs"
                            onClick={() => {
                              setWorkloadEducator(educator);
                              setWorkloadDialogOpen(true);
                            }}
                          >
                            {educator.linkedStudents} students
                          </Button>
                        </div>
                        <Progress value={educator.workloadPercentage} className="h-2" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-yellow-500 fill-current" />
                          <span className="text-sm font-medium">{educator.performance.rating}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {educator.performance.completedAssessments} assessments
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {educator.performance.activeIEPs} active IEPs
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={educator.isActive ? 'default' : 'secondary'}>
                        {educator.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      {educator.lastLogin && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Last: {new Date(educator.lastLogin).toLocaleDateString()}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={educator.id.startsWith('demo') ? `/admin/educators/view` : `/admin/educators/${educator.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => {
                            setSelectedEducator(educator);
                            setSelectedCenterId(educator.centerId || '');
                            
                            // Show current assignment in toast
                            if (educator.centerName && educator.centerId) {
                              toast({
                                title: "Current Assignment",
                                description: `${educator.name} is currently assigned to ${educator.centerName}`,
                              });
                            } else {
                              toast({
                                title: "No Current Assignment",
                                description: `${educator.name} is not currently assigned to any center`,
                              });
                            }
                            
                            setAssignDialogOpen(true);
                          }}
                        >
                          <Building className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className={educator.isActive ? "text-red-600" : "text-green-600"}>
                              {educator.isActive ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                {educator.isActive ? 'Deactivate' : 'Activate'} Educator
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to {educator.isActive ? 'deactivate' : 'activate'} {educator.name}?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleToggleStatus(educator.id, educator.isActive)}>
                                {educator.isActive ? 'Deactivate' : 'Activate'}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {filteredEducators.length === 0 && (
              <div className="text-center py-12">
                <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">No educators found</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {educators.length === 0 
                    ? "No Special or Super Special Educators are currently registered in the system."
                    : "Try adjusting your search criteria or filters."
                  }
                </p>
                {educators.length === 0 && (
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Educator
                  </Button>
                )}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Center Assignment Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Assign Educator to Center</DialogTitle>
            <DialogDescription>
              Assign {selectedEducator?.name} to a center for management and oversight.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 space-y-4 overflow-hidden">
            {selectedEducator && (
              <div className="p-3 bg-muted rounded-lg">
                <div className="text-sm font-medium">{selectedEducator.name}</div>
                <div className="text-xs text-muted-foreground">{selectedEducator.email}</div>
                <Badge className={getRoleColor(selectedEducator.role)}>
                  {selectedEducator.role === 'SUPER_SPECIAL_EDUCATOR' ? 'Super Special' : 'Special'}
                </Badge>
              </div>
            )}
            
            <div>
              <label className="text-sm font-medium mb-2 block">Select Center</label>
              <div className="border rounded-lg overflow-hidden">
                <div className="max-h-64 overflow-y-auto">
                  {centersLoading ? (
                    <div className="p-4 space-y-2">
                      {[...Array(3)].map((_, i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-1 p-2">
                      {centers.map((center) => (
                        <div
                          key={center.id}
                          className={cn(
                            "p-3 rounded-md cursor-pointer transition-colors hover:bg-muted",
                            selectedCenterId === center.id ? "bg-primary/10 border border-primary" : "border border-transparent"
                          )}
                          onClick={() => setSelectedCenterId(center.id)}
                        >
                          <div className="font-medium text-sm">{center.name}</div>
                          <div className="text-xs text-muted-foreground">{center.address}</div>
                          <div className="text-xs text-muted-foreground">{center.email}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Pagination Controls */}
                <div className="border-t p-2 flex items-center justify-between bg-muted/50">
                  <div className="text-xs text-muted-foreground">
                    Page {centersCurrentPage} of {centersTotalPages}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => loadCenters(centersCurrentPage - 1)}
                      disabled={centersCurrentPage <= 1 || centersLoading}
                    >
                      <ChevronLeft className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => loadCenters(centersCurrentPage + 1)}
                      disabled={centersCurrentPage >= centersTotalPages || centersLoading}
                    >
                      <ChevronRight className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (selectedEducator && selectedCenterId) {
                  handleAssignToCenter(selectedEducator.id, selectedCenterId);
                  setAssignDialogOpen(false);
                }
              }}
              disabled={!selectedCenterId}
            >
              Assign to Center
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Workload Details Dialog */}
      <Dialog open={workloadDialogOpen} onOpenChange={setWorkloadDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Workload Details - {workloadEducator?.name}</DialogTitle>
            <DialogDescription>
              Detailed workload information and student assignments
            </DialogDescription>
          </DialogHeader>
          {workloadEducator && (
            <div className="space-y-6">
              {/* Workload Overview */}
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-2xl font-bold text-center">{workloadEducator.linkedStudents}</div>
                    <div className="text-sm text-muted-foreground text-center">Assigned Students</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className={`text-2xl font-bold text-center ${getWorkloadColor(workloadEducator.workloadPercentage)}`}>
                      {workloadEducator.workloadPercentage}%
                    </div>
                    <div className="text-sm text-muted-foreground text-center">Workload</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-2xl font-bold text-center">{workloadEducator.performance.activeIEPs}</div>
                    <div className="text-sm text-muted-foreground text-center">Active IEPs</div>
                  </CardContent>
                </Card>
              </div>

              {/* Workload Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Current Workload</span>
                  <span className={getWorkloadColor(workloadEducator.workloadPercentage)}>
                    {workloadEducator.linkedStudents}/15 students ({workloadEducator.workloadPercentage}%)
                  </span>
                </div>
                <Progress value={workloadEducator.workloadPercentage} className="h-3" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="space-y-3">
                <h4 className="font-medium">Performance Metrics</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span className="text-sm">Rating</span>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      <span className="font-medium">{workloadEducator.performance.rating}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span className="text-sm">Completed Assessments</span>
                    <span className="font-medium">{workloadEducator.performance.completedAssessments}</span>
                  </div>
                </div>
              </div>

              {/* Specializations */}
              <div className="space-y-3">
                <h4 className="font-medium">Specializations</h4>
                <div className="flex flex-wrap gap-2">
                  {workloadEducator.specializations.length > 0 ? (
                    workloadEducator.specializations.map((spec, index) => (
                      <Badge key={index} variant="outline">
                        {spec}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">No specializations listed</span>
                  )}
                </div>
              </div>

              {/* Workload Status */}
              <div className="p-4 rounded-lg border">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="h-4 w-4" />
                  <span className="font-medium">Workload Status</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {workloadEducator.workloadPercentage >= 90 ? (
                    <span className="text-red-600">⚠️ High workload - Consider redistributing students</span>
                  ) : workloadEducator.workloadPercentage >= 70 ? (
                    <span className="text-yellow-600">⚡ Moderate workload - Monitor closely</span>
                  ) : (
                    <span className="text-green-600">✅ Optimal workload - Can take additional students</span>
                  )}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setWorkloadDialogOpen(false)}>
              Close
            </Button>
            <Button asChild>
              <Link href={workloadEducator?.id.startsWith('demo') ? `/admin/educators/view` : `/admin/educators/${workloadEducator?.id}`}>
                View Full Profile
              </Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create User Modal */}
      <CreateUserModal
        isOpen={createUserModalOpen}
        onClose={() => setCreateUserModalOpen(false)}
        onUserCreated={() => {
          setCreateUserModalOpen(false);
          loadEducators(); // Refresh the educators list
        }}
      />
    </div>
  );
}
