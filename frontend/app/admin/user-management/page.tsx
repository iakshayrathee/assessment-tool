'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Users, 
  UserPlus,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  Building,
  School,
  GraduationCap,
  UserCog,
  Eye,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Mail,
  Phone,
  Calendar,
  MapPin,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  Loader2,
  Grid,
  List
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';
import { UserRole, User as UserType } from '@/types';
import { CreateUserModal } from '@/components/modals/CreateUserModal';
import { EditUserModal } from '@/components/modals/EditUserModal';
import { RoleBasedAssignmentModal } from '@/components/modals/RoleBasedAssignmentModal';
import { useUsers, useDeleteUser, useToggleUserStatus } from '@/hooks/useUserManagement';

interface ExtendedUser extends UserType {
  createdAt: string;
  adminProfile?: any;
  specialEducatorProfile?: any;
  superSpecialEducatorProfile?: any;
  centerProfile?: any;
  parentProfile?: any;
  schoolViewerProfile?: any;
}

interface UserFilters {
  search: string;
  status: string;
  role: UserRole | 'all';
}

const USER_ROLE_LABELS = {
  [UserRole.ADMIN]: 'Admin',
  [UserRole.SUPER_SPECIAL_EDUCATOR]: 'Super Special Educator',
  [UserRole.SPECIAL_EDUCATOR]: 'Special Educator',
  [UserRole.CENTER]: 'Center',
  [UserRole.PARENT]: 'Parent',
  [UserRole.SCHOOL_VIEWER]: 'School Viewer',
  [UserRole.STUDENT]: 'Student'
};

const USER_ROLE_ICONS = {
  [UserRole.ADMIN]: UserCog,
  [UserRole.SUPER_SPECIAL_EDUCATOR]: GraduationCap,
  [UserRole.SPECIAL_EDUCATOR]: Users,
  [UserRole.CENTER]: Building,
  [UserRole.PARENT]: Users,
  [UserRole.SCHOOL_VIEWER]: School,
  [UserRole.STUDENT]: GraduationCap
};

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: "easeOut"
    }
  }
};

const cardVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.2,
      ease: "easeOut"
    }
  },
  hover: {
    scale: 1.02,
    transition: {
      duration: 0.2,
      ease: "easeInOut"
    }
  }
};

export default function UserManagementPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<UserRole | 'all'>('all');
  const [filters, setFilters] = useState<UserFilters>({
    search: '',
    status: 'all',
    role: 'all'
  });
  
  // Modal states
  const [createUserModalOpen, setCreateUserModalOpen] = useState(false);
  const [editUserModalOpen, setEditUserModalOpen] = useState(false);
  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ExtendedUser | null>(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [roleCounts, setRoleCounts] = useState<Record<string, number>>({});
  const itemsPerPage = 10;

  // UI states
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // React Query hooks
  const queryParams = {
    page: currentPage,
    limit: itemsPerPage,
    role: activeTab !== 'all' ? activeTab : undefined,
    search: filters.search || undefined,
    status: filters.status !== 'all' ? filters.status : undefined
  };

  const { 
    data: usersResponse, 
    isLoading: loading, 
    error: usersError,
    refetch: refetchUsers 
  } = useUsers(queryParams);

  // Fetch counts for all roles
  const { data: allUsersResponse } = useUsers({ 
    page: 1, 
    limit: 1000, // Get all users to count by role
    status: filters.status !== 'all' ? filters.status : undefined,
    search: filters.search || undefined
  });
  
  const deleteUserMutation = useDeleteUser();
  const toggleUserStatusMutation = useToggleUserStatus();

  const users = usersResponse?.data || [];
  const pagination = usersResponse?.pagination || { total: 0, totalPages: 1 };
  const allUsers = allUsersResponse?.data || [];

  useEffect(() => {
    if (usersResponse?.pagination) {
      setTotalPages(usersResponse.pagination.totalPages || 1);
    }
  }, [usersResponse]);

  // Calculate role counts from all users
  useEffect(() => {
    if (allUsers.length > 0) {
      const counts: Record<string, number> = {};
      let total = 0;
      
      // Count users by role
      Object.keys(USER_ROLE_LABELS).forEach(role => {
        counts[role] = allUsers.filter((user: ExtendedUser) => user.role === role).length;
      });
      
      // Calculate total
      total = allUsers.length;
      
      setRoleCounts(counts);
      setTotalUsers(total);
    }
  }, [allUsers]);

  const loadUsers = async () => {
    setIsRefreshing(true);
    try {
      await refetchUsers();
    } finally {
      setTimeout(() => setIsRefreshing(false), 500); // Minimum loading time for UX
    }
  };

  const handleCreateUser = () => {
    setCreateUserModalOpen(true);
  };

  const handleEditUser = (user: ExtendedUser) => {
    setSelectedUser(user);
    setEditUserModalOpen(true);
  };

  const handleAssignUser = (user: ExtendedUser) => {
    setSelectedUser(user);
    setAssignmentModalOpen(true);
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    deleteUserMutation.mutate(userId);
  };

  const handleToggleUserStatus = async (userId: string, isActive: boolean) => {
    toggleUserStatusMutation.mutate({ userId, isActive });
  };

  const getUserDisplayName = (user: ExtendedUser): string => {
    const profile = user.profile || 
                   user.adminProfile || 
                   user.specialEducatorProfile || 
                   user.superSpecialEducatorProfile || 
                   user.centerProfile || 
                   user.parentProfile || 
                   user.schoolViewerProfile;
    
    return profile?.fullName || profile?.centerName || user.email;
  };



  const renderUserDetails = (user: ExtendedUser) => {
    const profile = user.profile || 
                   user.adminProfile || 
                   user.specialEducatorProfile || 
                   user.superSpecialEducatorProfile || 
                   user.centerProfile || 
                   user.parentProfile || 
                   user.schoolViewerProfile;

    return (
      <div className="p-4 bg-muted/50 rounded-lg space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-2">
            <h4 className="font-semibold text-sm text-muted-foreground">Contact Information</h4>
            <div className="space-y-1">
              <div className="flex items-center space-x-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{user.email}</span>
              </div>
              {profile?.phone && (
                <div className="flex items-center space-x-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{profile.phone}</span>
                </div>
              )}
              {profile?.address && (
                <div className="flex items-center space-x-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{profile.address}</span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold text-sm text-muted-foreground">Personal Details</h4>
            <div className="space-y-1">
              {profile?.dateOfBirth && (
                <div className="flex items-center space-x-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{new Date(profile.dateOfBirth).toLocaleDateString()}</span>
                </div>
              )}
              {profile?.gender && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Gender: </span>
                  <span>{profile.gender}</span>
                </div>
              )}
              {profile?.primaryLanguage && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Primary Language: </span>
                  <span>{profile.primaryLanguage}</span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold text-sm text-muted-foreground">Professional Details</h4>
            <div className="space-y-1">
              {profile?.highestQualification && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Qualification: </span>
                  <span>{profile.highestQualification}</span>
                </div>
              )}
              {profile?.yearsOfExperience && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Experience: </span>
                  <span>{profile.yearsOfExperience} years</span>
                </div>
              )}
              {profile?.specializationAreas && profile.specializationAreas.length > 0 && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Specializations: </span>
                  <span>{profile.specializationAreas.join(', ')}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Role-specific details */}
        {user.role === UserRole.CENTER && profile?.centerName && (
          <div className="border-t pt-4">
            <h4 className="font-semibold text-sm text-muted-foreground mb-2">Center Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="text-sm">
                <span className="text-muted-foreground">Center Name: </span>
                <span>{profile.centerName}</span>
              </div>
              {profile.centerType && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Type: </span>
                  <span>{profile.centerType}</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="border-t pt-4">
          <h4 className="font-semibold text-sm text-muted-foreground mb-2">Account Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Created: </span>
              <span>{new Date(user.createdAt).toLocaleDateString()}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Last Login: </span>
              <span>{user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Status: </span>
              <Badge variant={user.isActive ? "default" : "secondary"}>
                {user.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const UserCard = ({ user }: { user: ExtendedUser }) => {
    const IconComponent = USER_ROLE_ICONS[user.role];
    
    return (
      <motion.div
        variants={cardVariants}
        whileHover="hover"
        layout
      >
        <Card className="h-full transition-all duration-200 hover:shadow-lg border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <IconComponent className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base font-semibold truncate">
                    {getUserDisplayName(user)}
                  </CardTitle>
                  <CardDescription className="text-sm truncate">
                    {user.email}
                  </CardDescription>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => handleEditUser(user)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleAssignUser(user)}>
                    <UserCheck className="mr-2 h-4 w-4" />
                    Assign
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => handleToggleUserStatus(user.id, user.isActive)}
                    disabled={toggleUserStatusMutation.isPending}
                  >
                    {toggleUserStatusMutation.isPending ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        {user.isActive ? 'Deactivating...' : 'Activating...'}
                      </>
                    ) : user.isActive ? (
                      <>
                        <UserX className="mr-2 h-4 w-4" />
                        Deactivate
                      </>
                    ) : (
                      <>
                        <UserCheck className="mr-2 h-4 w-4" />
                        Activate
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => handleDeleteUser(user.id)}
                    className="text-destructive"
                    disabled={deleteUserMutation.isPending}
                  >
                    {deleteUserMutation.isPending ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </>
                    )}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-xs">
                  {USER_ROLE_LABELS[user.role]}
                </Badge>
                <Badge variant={user.isActive ? "default" : "secondary"} className="text-xs">
                  {user.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                Last login: {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never logged in'}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  const UserAccordionTable = ({ users }: { users: ExtendedUser[] }) => (
    <div className="space-y-2">
      {users.map((user) => {
        const IconComponent = USER_ROLE_ICONS[user.role];
        const isExpanded = expandedRows.has(user.id);
        
        return (
          <div key={user.id} className="will-change-auto">
            <Collapsible 
              open={isExpanded} 
              onOpenChange={(open) => {
                const newExpanded = new Set(expandedRows);
                if (open) {
                  newExpanded.add(user.id);
                } else {
                  newExpanded.delete(user.id);
                }
                setExpandedRows(newExpanded);
              }}
            >
              <Card className="transition-all duration-300 ease-in-out hover:shadow-lg hover:shadow-blue-500/10 hover:-translate-y-1">
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 flex-1 min-w-0">
                          <div className="flex items-center space-x-2 flex-shrink-0">
                            <motion.div
                              animate={{ rotate: isExpanded ? 90 : 0 }}
                              transition={{ duration: 0.2 }}
                            >
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            </motion.div>
                            <IconComponent className="h-5 w-5 text-muted-foreground" />
                          </div>
                          
                          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-4 min-w-0">
                            <div className="min-w-0">
                              <div className="font-medium truncate">{getUserDisplayName(user)}</div>
                              <div className="text-sm text-muted-foreground truncate">{user.email}</div>
                            </div>
                            
                            <div className="flex items-center">
                              <Badge variant="outline" className="text-xs">
                                {USER_ROLE_LABELS[user.role]}
                              </Badge>
                            </div>
                            
                            <div className="flex items-center">
                              <Badge variant={user.isActive ? "default" : "secondary"} className="text-xs">
                                {user.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                            
                            <div className="text-sm text-muted-foreground hidden lg:block">
                              {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never logged in'}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => handleEditUser(user)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleAssignUser(user)}>
                                <UserCheck className="mr-2 h-4 w-4" />
                                Assign
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleToggleUserStatus(user.id, user.isActive)}
                                disabled={toggleUserStatusMutation.isPending}
                              >
                                {toggleUserStatusMutation.isPending ? (
                                  <>
                                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                    {user.isActive ? 'Deactivating...' : 'Activating...'}
                                  </>
                                ) : user.isActive ? (
                                  <>
                                    <UserX className="mr-2 h-4 w-4" />
                                    Deactivate
                                  </>
                                ) : (
                                  <>
                                    <UserCheck className="mr-2 h-4 w-4" />
                                    Activate
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleDeleteUser(user.id)}
                                className="text-destructive"
                                disabled={deleteUserMutation.isPending}
                              >
                                {deleteUserMutation.isPending ? (
                                  <>
                                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                    Deleting...
                                  </>
                                ) : (
                                  <>
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </>
                                )}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent className="transition-all duration-300 ease-in-out data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
                    <CardContent className="pt-0">
                      {renderUserDetails(user)}
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            </div>
          );
        })}
    </div>
  );

  const UserGridView = ({ users }: { users: ExtendedUser[] }) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      <AnimatePresence>
        {users.map((user) => (
          <UserCard key={user.id} user={user} />
        ))}
      </AnimatePresence>
    </div>
  );

  const PaginationControls = () => (
    <motion.div 
      variants={itemVariants}
      className="flex flex-col sm:flex-row items-center justify-between gap-4"
    >
      <div className="text-sm text-muted-foreground">
        Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalUsers)} of {totalUsers} users
      </div>
      
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
          disabled={currentPage === 1}
          className="transition-all duration-200"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline ml-1">Previous</span>
        </Button>
        
        <div className="flex items-center space-x-1">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (currentPage <= 3) {
              pageNum = i + 1;
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = currentPage - 2 + i;
            }
            
            return (
              <Button
                key={pageNum}
                variant={currentPage === pageNum ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentPage(pageNum)}
                className="w-8 h-8 p-0 transition-all duration-200"
              >
                {pageNum}
              </Button>
            );
          })}
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
          disabled={currentPage === totalPages}
          className="transition-all duration-200"
        >
          <span className="hidden sm:inline mr-1">Next</span>
          <ChevronRightIcon className="h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  );

  const filteredUsers = users.filter((user: ExtendedUser) => {
    if (activeTab !== 'all' && user.role !== activeTab) return false;
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      const displayName = getUserDisplayName(user).toLowerCase();
      const email = user.email.toLowerCase();
      if (!displayName.includes(searchTerm) && !email.includes(searchTerm)) return false;
    }
    if (filters.status !== 'all') {
      if (filters.status === 'active' && !user.isActive) return false;
      if (filters.status === 'inactive' && user.isActive) return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Page Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white border-b border-gray-200 shadow-sm"
      >
        <div className="px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <motion.div 
              variants={itemVariants}
              className="space-y-1"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">User Management</h1>
                  <p className="text-gray-600 font-medium text-sm sm:text-base">
                    Create, edit, assign, or remove users across all roles
                  </p>
                </div>
              </div>
            </motion.div>
            <motion.div 
              variants={itemVariants}
              className="flex items-center space-x-3 w-full sm:w-auto"
            >
              <Button 
                variant="outline" 
                onClick={loadUsers} 
                className="shadow-sm transition-all duration-200 flex-1 sm:flex-none"
                disabled={isRefreshing}
              >
                {isRefreshing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Refreshing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh
                  </>
                )}
              </Button>
              <Button 
                onClick={handleCreateUser} 
                className="shadow-sm transition-all duration-200 flex-1 sm:flex-none"
              >
                <UserPlus className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Add User</span>
                <span className="sm:hidden">Add</span>
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="px-4 sm:px-6 py-6 space-y-6"
      >
        {/* Filters and Controls */}
        <motion.div variants={itemVariants}>
          <Card className="shadow-sm border-0">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Search */}
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search users by name or email..."
                      value={filters.search}
                      onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                      className="pl-10 transition-all duration-200 focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3 lg:gap-4">
                  <Select
                    value={filters.status}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger className="w-full sm:w-[140px] transition-all duration-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={filters.role}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, role: value as UserRole | 'all' }))}
                  >
                    <SelectTrigger className="w-full sm:w-[180px] transition-all duration-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      {Object.entries(USER_ROLE_LABELS).map(([role, label]) => (
                        <SelectItem key={role} value={role}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* View Mode Toggle */}
                  <div className="flex items-center border rounded-lg p-1 bg-muted/50">
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                      className="h-8 px-3 transition-all duration-200"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                      className="h-8 px-3 transition-all duration-200"
                    >
                      <Grid className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Role Tabs */}
        <motion.div variants={itemVariants}>
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as UserRole | 'all')}>
            <div className="w-full overflow-x-auto">
              <TabsList className="inline-flex h-10 items-center justify-start rounded-md bg-muted/50 p-1 text-muted-foreground min-w-full sm:min-w-0 sm:w-auto">
                <TabsTrigger value="all" className="transition-all duration-200 whitespace-nowrap px-3 py-1.5 text-xs sm:text-sm">
                  All ({totalUsers})
                </TabsTrigger>
                {Object.entries(USER_ROLE_LABELS).map(([role, label]) => {
                  const count = roleCounts[role] || 0;
                  return (
                    <TabsTrigger key={role} value={role} className="transition-all duration-200 whitespace-nowrap px-3 py-1.5 text-xs sm:text-sm">
                      <span className="hidden sm:inline">{label}</span>
                      <span className="sm:hidden">{label.split(' ')[0]}</span>
                      <span className="ml-1">({count})</span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </div>

            <TabsContent value={activeTab} className="mt-6">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                    <span className="text-muted-foreground">Loading users...</span>
                  </div>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-muted-foreground mb-2">No users found</h3>
                  <p className="text-muted-foreground mb-4">
                    {filters.search || filters.status !== 'all' || activeTab !== 'all'
                      ? 'Try adjusting your filters to see more results.'
                      : 'Get started by creating your first user.'}
                  </p>
                  <Button onClick={handleCreateUser} className="transition-all duration-200">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Create User
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {viewMode === 'list' ? (
                    <UserAccordionTable users={filteredUsers} />
                  ) : (
                    <UserGridView users={filteredUsers} />
                  )}
                  
                  {totalPages > 1 && <PaginationControls />}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </motion.div>
      </motion.div>

      {/* Modals */}
      <AnimatePresence mode="wait">
        {createUserModalOpen && (
          <motion.div
            key="create-modal"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <CreateUserModal
              isOpen={createUserModalOpen}
              onClose={() => setCreateUserModalOpen(false)}
              onUserCreated={loadUsers}
            />
          </motion.div>
        )}

        {editUserModalOpen && (
          <motion.div
            key="edit-modal"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <EditUserModal
              isOpen={editUserModalOpen}
              onClose={() => setEditUserModalOpen(false)}
              onUserUpdated={loadUsers}
              user={selectedUser}
            />
          </motion.div>
        )}

        {assignmentModalOpen && (
          <motion.div
            key="assignment-modal"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <RoleBasedAssignmentModal
              isOpen={assignmentModalOpen}
              onClose={() => setAssignmentModalOpen(false)}
              onAssignmentComplete={loadUsers}
              selectedUser={selectedUser}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}