'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { 
  Building, 
  School,
  Plus,
  Search,
  Filter,
  Edit,
  Eye,
  UserCheck,
  Users,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Activity,
  RefreshCw,
  Download,
  MoreHorizontal,
  Trash2,
  CheckCircle,
  XCircle
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

interface Center {
  id: string;
  name: string;
  location: string;
  contactPerson: string;
  email: string;
  phone: string;
  isActive: boolean;
  linkedUsers: number;
  linkedStudents: number;
  createdAt: string;
}

interface School {
  id: string;
  name: string;
  location: string;
  principalName: string;
  email: string;
  phone: string;
  isActive: boolean;
  linkedUsers: number;
  linkedStudents: number;
  createdAt: string;
}

export default function CentersSchoolsPage() {
  const { user } = useAuth();
  const [centers, setCenters] = useState<Center[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('centers');
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load centers from backend API
      const centersResponse = await apiClient.getAllCenters({ 
        page: 1, 
        limit: 100,
        search: searchQuery || undefined 
      });
      
      // Transform centers data - extract from nested centerProfile
      const transformedCenters: Center[] = centersResponse.data.map((center: any) => {
        const profile = center.centerProfile || {};
        return {
          id: center.id,
          name: profile.centerName || 'Unknown Center',
          location: profile.address || 'Location not specified',
          contactPerson: profile.contactPerson || 'Not specified',
          email: profile.email || center.email || '',
          phone: profile.phone || 'Not specified',
          isActive: center.isActive ?? true,
          linkedUsers: profile.assignments?.length || 0,
          linkedStudents: profile.students?.length || 0,
          createdAt: center.createdAt
        };
      });

      // Extract schools data from centers response since separate endpoint doesn't exist
      let transformedSchools: School[] = [];
      try {
        // Flatten all schools from all centers
        const allSchools = centersResponse.data.flatMap((center: any) => 
          (center.centerProfile?.schools || []).map((school: any) => ({
            ...school,
            centerName: center.centerProfile?.centerName || 'Unknown Center'
          }))
        );
        
        transformedSchools = allSchools.map((school: any) => ({
          id: school.id,
          name: school.name || 'Unknown School',
          location: school.address || 'Location not specified',
          principalName: school.principalName || 'Not specified',
          email: school.email || '',
          phone: school.phone || 'Not specified',
          isActive: true, // Schools don't have isActive field in current API
          linkedUsers: 0, // Not available in current structure
          linkedStudents: 0, // Not available in current structure
          createdAt: school.createdAt
        }));
      } catch (schoolError) {
        console.warn('Failed to extract schools from centers:', schoolError);
        transformedSchools = [];
      }

      setCenters(transformedCenters);
      setSchools(transformedSchools);
    } catch (error) {
      console.error('Failed to load data:', error);
      setCenters([]);
      setSchools([]);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id: string, type: 'center' | 'school', currentStatus: boolean) => {
    try {
      const action = currentStatus ? 'deactivated' : 'activated';
      toast({
        title: `${type === 'center' ? 'Center' : 'School'} ${action}`,
        description: `The ${type} has been ${action} successfully.`,
      });
      loadData();
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to update ${type} status. Please try again.`,
        variant: "destructive",
      });
    }
  };

  const filterCenters = (data: Center[]) => {
    return data.filter(item => {
      const matchesSearch = !searchQuery || 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.contactPerson.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesLocation = !locationFilter || 
        item.location.toLowerCase().includes(locationFilter.toLowerCase());
      
      const matchesStatus = !statusFilter || 
        (statusFilter === 'active' && item.isActive) ||
        (statusFilter === 'inactive' && !item.isActive);
      
      return matchesSearch && matchesLocation && matchesStatus;
    });
  };

  const filterSchools = (data: School[]) => {
    return data.filter(item => {
      const matchesSearch = !searchQuery || 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.principalName.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesLocation = !locationFilter || 
        item.location.toLowerCase().includes(locationFilter.toLowerCase());
      
      const matchesStatus = !statusFilter || 
        (statusFilter === 'active' && item.isActive) ||
        (statusFilter === 'inactive' && !item.isActive);
      
      return matchesSearch && matchesLocation && matchesStatus;
    });
  };

  const CentersTable = ({ data }: { data: Center[] }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Center Details</TableHead>
          <TableHead>Contact Person</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Linked Users</TableHead>
          <TableHead>Students</TableHead>
          <TableHead>Created</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((center) => (
          <TableRow key={center.id}>
            <TableCell>
              <div>
                <div className="font-medium">{center.name}</div>
                <div className="text-sm text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {center.location}
                </div>
              </div>
            </TableCell>
            <TableCell>
              <div>
                <div className="font-medium text-sm">{center.contactPerson}</div>
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {center.email}
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {center.phone}
                </div>
              </div>
            </TableCell>
            <TableCell>
              <Badge variant={center.isActive ? 'default' : 'secondary'}>
                {center.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4 text-muted-foreground" />
                {center.linkedUsers}
              </div>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-1">
                <UserCheck className="h-4 w-4 text-muted-foreground" />
                {center.linkedStudents}
              </div>
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {new Date(center.createdAt).toLocaleDateString()}
            </TableCell>
            <TableCell>
              <div className="flex items-center justify-end gap-2">
                <Link href={`/admin/centers-schools/${center.id}`}>
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                </Link>
                <Button variant="ghost" size="sm">
                  <Edit className="h-4 w-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" className={center.isActive ? "text-red-600" : "text-green-600"}>
                      {center.isActive ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        {center.isActive ? 'Deactivate' : 'Activate'} Center
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to {center.isActive ? 'deactivate' : 'activate'} {center.name}?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleToggleStatus(center.id, 'center', center.isActive)}>
                        {center.isActive ? 'Deactivate' : 'Activate'}
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
  );

  const SchoolsTable = ({ data }: { data: School[] }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>School Details</TableHead>
          <TableHead>Principal</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Linked Users</TableHead>
          <TableHead>Students</TableHead>
          <TableHead>Created</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((school) => (
          <TableRow key={school.id}>
            <TableCell>
              <div>
                <div className="font-medium">{school.name}</div>
                <div className="text-sm text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {school.location}
                </div>
              </div>
            </TableCell>
            <TableCell>
              <div>
                <div className="font-medium text-sm">{school.principalName}</div>
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {school.email}
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {school.phone}
                </div>
              </div>
            </TableCell>
            <TableCell>
              <Badge variant={school.isActive ? 'default' : 'secondary'}>
                {school.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4 text-muted-foreground" />
                {school.linkedUsers}
              </div>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-1">
                <UserCheck className="h-4 w-4 text-muted-foreground" />
                {school.linkedStudents}
              </div>
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {new Date(school.createdAt).toLocaleDateString()}
            </TableCell>
            <TableCell>
              <div className="flex items-center justify-end gap-2">
                <Button variant="ghost" size="sm">
                  <Eye className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Edit className="h-4 w-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" className={school.isActive ? "text-red-600" : "text-green-600"}>
                      {school.isActive ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        {school.isActive ? 'Deactivate' : 'Activate'} School
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to {school.isActive ? 'deactivate' : 'activate'} {school.name}?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleToggleStatus(school.id, 'school', school.isActive)}>
                        {school.isActive ? 'Deactivate' : 'Activate'}
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
  );

  if (loading) {
    return (
      <div className="space-y-8 p-6">
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
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

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Centers & Schools</h1>
          <p className="text-muted-foreground">
            Manage learning centers and partner schools
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary">
            {centers.length} Centers • {schools.length} Schools
          </Badge>
          <Button variant="outline" onClick={loadData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add New
          </Button>
        </div>
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-blue-600" />
              Search & Filter
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-64">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search by name, location, or contact..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Select value={locationFilter} onValueChange={setLocationFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Locations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  <SelectItem value="mumbai">Mumbai</SelectItem>
                  <SelectItem value="delhi">Delhi</SelectItem>
                  <SelectItem value="bangalore">Bangalore</SelectItem>
                  <SelectItem value="pune">Pune</SelectItem>
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

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="centers" className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              Centers ({centers.length})
            </TabsTrigger>
            <TabsTrigger value="schools" className="flex items-center gap-2">
              <School className="h-4 w-4" />
              Schools ({schools.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="centers">
            <Card>
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5 text-blue-600" />
                  Learning Centers ({filterCenters(centers).length})
                </CardTitle>
                <CardDescription>
                  Manage learning centers and their linked users and students
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CentersTable data={filterCenters(centers)} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="schools">
            <Card>
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
                <CardTitle className="flex items-center gap-2">
                  <School className="h-5 w-5 text-green-600" />
                  Partner Schools ({filterSchools(schools).length})
                </CardTitle>
                <CardDescription>
                  Manage partner schools and their linked users and students
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SchoolsTable data={filterSchools(schools)} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
