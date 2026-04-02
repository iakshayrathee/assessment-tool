'use client';

import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Clock, 
  UserPlus,
  UserCheck,
  UserX,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Filter,
  Search,
  Calendar,
  Mail,
  Phone
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { PageWrapper } from '@/components/layout/PageWrapper';

interface PendingRequest {
  id: string;
  type: 'USER_CREATION' | 'ROLE_ASSIGNMENT' | 'CENTER_CREATION' | 'SCHOOL_CREATION';
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  requestedById: string;
  targetUserId?: string;
  targetCenterId?: string;
  targetSchoolId?: string;
  requestedRole?: string;
  requestedData: any;
  comments?: string;
  rejectionReason?: string;
  approvedById?: string;
  rejectedById?: string;
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
  rejectedAt?: string;
  requestedBy: {
    id: string;
    email: string;
    role: string;
    adminProfile?: { fullName: string };
    centerProfile?: { centerName: string };
    specialEducatorProfile?: { fullName: string };
    superSpecialEducatorProfile?: { fullName: string };
    parentProfile?: { fullName: string };
    schoolViewerProfile?: { fullName: string };
  };
  targetUser?: {
    id: string;
    email: string;
    role: string;
  };
  approvedBy?: {
    id: string;
    email: string;
  };
  rejectedBy?: {
    id: string;
    email: string;
  };
}

export default function PendingApprovalsPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<PendingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadPendingRequests();
  }, []);

  const loadPendingRequests = async () => {
    try {
      setLoading(true);
      
      // Load pending approvals from backend API
      const response = await apiClient.getPendingApprovals({
        page: 1,
        limit: 50,
        type: activeTab !== 'all' ? activeTab : undefined
      });
      
      // Use actual data from backend
      setRequests(response.data || []);
    } catch (error) {
      console.error('Failed to load pending requests:', error);
      // Set empty array on error
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRequest = async (requestId: string) => {
    try {
      // API call to approve request
      await apiClient.approveRequest(requestId, { comments: "Approved by admin" });
      toast({
        title: "Request Approved",
        description: "The request has been approved successfully.",
      });
      loadPendingRequests();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to approve request. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      // API call to reject request
      await apiClient.rejectRequest(requestId, { reason: "Rejected by admin" });
      toast({
        title: "Request Rejected",
        description: "The request has been rejected.",
      });
      loadPendingRequests();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to reject request. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getRequestTypeLabel = (type: string) => {
    switch (type) {
      case 'USER_CREATION': return 'User Creation';
      case 'ROLE_ASSIGNMENT': return 'Role Assignment';
      default: return type;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-destructive/10 text-foreground';
      case 'SUPER_SPECIAL_EDUCATOR': return 'bg-info/10 text-foreground';
      case 'SPECIAL_EDUCATOR': return 'bg-primary/10 text-primary';
      case 'CENTER': return 'bg-success/10 text-foreground';
      case 'PARENT': return 'bg-warning/10 text-foreground';
      case 'SCHOOL_VIEWER': return 'bg-muted text-foreground';
      default: return 'bg-muted text-foreground';
    }
  };

  const getRequestedByName = (request: PendingRequest) => {
    if (request.requestedBy.adminProfile?.fullName) return request.requestedBy.adminProfile.fullName;
    if (request.requestedBy.centerProfile?.centerName) return request.requestedBy.centerProfile.centerName;
    if (request.requestedBy.specialEducatorProfile?.fullName) return request.requestedBy.specialEducatorProfile.fullName;
    if (request.requestedBy.superSpecialEducatorProfile?.fullName) return request.requestedBy.superSpecialEducatorProfile.fullName;
    if (request.requestedBy.parentProfile?.fullName) return request.requestedBy.parentProfile.fullName;
    if (request.requestedBy.schoolViewerProfile?.fullName) return request.requestedBy.schoolViewerProfile.fullName;
    return request.requestedBy.email || 'Unknown';
  };

  const getTargetUserName = (request: PendingRequest) => {
    if (request.targetUser) {
      return request.targetUser.email;
    }
    
    // For user creation requests, get name from requestedData
    if (request.type === 'USER_CREATION' && request.requestedData) {
      const profileData = request.requestedData.profileData;
      if (profileData) {
        return profileData.fullName || profileData.centerName || request.requestedData.email;
      }
    }
    
    return 'New User';
  };

  const getTargetUserEmail = (request: PendingRequest) => {
    if (request.targetUser) {
      return request.targetUser.email;
    }
    
    // For user creation requests, get email from requestedData
    if (request.type === 'USER_CREATION' && request.requestedData) {
      return request.requestedData.email;
    }
    
    return '';
  };

  const getRequestedCenter = (request: PendingRequest) => {
    // For center-related requests
    if (request.type === 'CENTER_CREATION' && request.requestedData) {
      return request.requestedData.centerName || '';
    }
    return '';
  };

  const getRequestedRole = (request: PendingRequest) => {
    if (request.requestedRole) {
      return request.requestedRole;
    }
    
    // For user creation requests, get role from requestedData
    if (request.type === 'USER_CREATION' && request.requestedData) {
      return request.requestedData.role;
    }
    
    return '';
  };

  const getNotes = (request: PendingRequest) => {
    return request.comments || '';
  };

  const filteredRequests = requests.filter(request => {
    const matchesFilter = filter === 'all' || request.type === filter;
    const matchesSearch = !searchQuery || 
      getTargetUserName(request).toLowerCase().includes(searchQuery.toLowerCase()) ||
      getTargetUserEmail(request).toLowerCase().includes(searchQuery.toLowerCase()) ||
      getRequestedByName(request).toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

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
    <PageWrapper
      title="Pending Approvals"
      description="Review and approve user creation requests and role assignments"
      breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Approvals' }]}
      actions={
        <div className="flex items-center space-x-2">
          <Badge variant="secondary">
            {filteredRequests.length} Pending
          </Badge>
          <Button variant="outline" onClick={loadPendingRequests}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      }
    >

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-primary" />
              Filter Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-64">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Request Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Request Types</SelectItem>
                  <SelectItem value="USER_CREATION">User Creation</SelectItem>
                  <SelectItem value="ROLE_ASSIGNMENT">Role Assignment</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Requests Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950 dark:to-red-950">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-warning" />
              Pending Requests ({filteredRequests.length})
            </CardTitle>
            <CardDescription>
              Review and take action on pending approval requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Request Type</TableHead>
                  <TableHead>Target User</TableHead>
                  <TableHead>Requested Role</TableHead>
                  <TableHead>Requested By</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      <Badge variant="outline">
                        {getRequestTypeLabel(request.type)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{request.targetUser?.name}</div>
                        <div className="text-sm text-muted-foreground">{request.targetUser?.email}</div>
                        {request.targetUser?.phone && (
                          <div className="text-xs text-muted-foreground">{request.targetUser.phone}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {request.requestedRole && (
                        <Badge className={getRoleColor(request.requestedRole)}>
                          {request.requestedRole.replace('_', ' ')}
                        </Badge>
                      )}
                      {request.requestedCenter && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {request.requestedCenter}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium text-sm">{request.requestedBy.name}</div>
                        <div className="text-xs text-muted-foreground">{request.requestedBy.email}</div>
                        <Badge variant="secondary" className="text-xs mt-1">
                          {request.requestedBy.role}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(request.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-success hover:text-success">
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Approve Request</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to approve this {getRequestTypeLabel(request.type).toLowerCase()} request for {request.targetUser?.name}?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleApproveRequest(request.id)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                Approve
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Reject Request</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to reject this {getRequestTypeLabel(request.type).toLowerCase()} request for {request.targetUser?.name}?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleRejectRequest(request.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Reject
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

            {filteredRequests.length === 0 && (
              <div className="text-center py-12">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">No pending requests</h3>
                <p className="text-sm text-muted-foreground">
                  All approval requests have been processed.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </PageWrapper>
  );
}
