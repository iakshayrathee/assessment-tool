'use client';

import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, User, Building, GraduationCap, Users } from 'lucide-react';
import { useEducators, useCenters, useSchools, useUsers } from '@/hooks/useUserManagement';
import { UserRole, User as UserType } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api';

interface RoleBasedAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssignmentComplete: () => void;
  selectedUser: UserType | null;
}

interface AssignmentConfig {
  title: string;
  description: string;
  targetType: 'educators' | 'centers' | 'schools' | 'students' | 'parents';
  data: any[];
  renderItem: (item: any, isSelected: boolean, onToggle: () => void) => React.ReactNode;
}

export function RoleBasedAssignmentModal({
  isOpen,
  onClose,
  onAssignmentComplete,
  selectedUser
}: RoleBasedAssignmentModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isAssigning, setIsAssigning] = useState(false);
  const { toast } = useToast();

  // Fetch data based on user role - only fetch what's needed
  const { data: educatorsData } = useEducators();
  const { data: centersData } = useCenters();
  const { data: schoolsData } = useSchools();
  // Note: Students and parents data fetching removed to prevent 500 errors
  // They should only be fetched when actually needed (not implemented yet in backend)

  const getAssignmentConfig = (): AssignmentConfig | null => {
    if (!selectedUser) return null;

    switch (selectedUser.role) {
      case UserRole.SPECIAL_EDUCATOR:
      case UserRole.SUPER_SPECIAL_EDUCATOR:
        return {
          title: 'Assign Educator to Centers',
          description: 'Select centers to assign this educator to',
          targetType: 'centers',
          data: centersData?.data || [],
          renderItem: (center, isSelected, onToggle) => {
            // Centers are returned as CenterProfile objects with nested user
            // Structure: { id, centerName, address, phone, email, contactPerson, user: {...} }
            const centerId = center.id; // Use the centerProfile ID
            const centerName = center.centerName || center.user?.email || 'Unknown Center';
            const address = center.address;
            const contactPerson = center.contactPerson;
            const phone = center.phone;
            const email = center.email || center.user?.email;
            const centerType = center.centerType;
            const operatingHours = center.operatingHours;

            return (
              <Card key={centerId} className="cursor-pointer hover:bg-gray-50" onClick={onToggle}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1">
                      <Checkbox checked={isSelected} onChange={onToggle} />
                      <Building className="h-5 w-5 text-blue-500" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{centerName}</h4>
                          {centerType && (
                            <Badge variant="secondary" className="text-xs">{centerType}</Badge>
                          )}
                        </div>
                        {address && <p className="text-sm text-gray-500">{address}</p>}
                        <div className="flex gap-3 mt-1 flex-wrap">
                          {contactPerson && (
                            <p className="text-xs text-gray-400">Contact: {contactPerson}</p>
                          )}
                          {phone && (
                            <p className="text-xs text-gray-400">Phone: {phone}</p>
                          )}
                          {operatingHours && (
                            <p className="text-xs text-gray-400">Hours: {operatingHours}</p>
                          )}
                        </div>
                        {email && email !== centerName && (
                          <p className="text-xs text-gray-400">{email}</p>
                        )}
                      </div>
                    </div>
                    <Badge variant="outline">Center</Badge>
                  </div>
                </CardContent>
              </Card>
            );
          }
        };

      case UserRole.STUDENT:
        return {
          title: 'Assign Student to Educator',
          description: 'Select an educator to assign this student to',
          targetType: 'educators',
          data: educatorsData?.data || [],
          renderItem: (educator, isSelected, onToggle) => (
            <Card key={educator.id} className="cursor-pointer hover:bg-gray-50" onClick={onToggle}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Checkbox checked={isSelected} onChange={onToggle} />
                    <User className="h-5 w-5 text-green-500" />
                    <div>
                      <h4 className="font-medium">{educator.email}</h4>
                      <p className="text-sm text-gray-500">{educator.role}</p>
                    </div>
                  </div>
                  <Badge variant="outline">{educator.role}</Badge>
                </div>
              </CardContent>
            </Card>
          )
        };

      case UserRole.PARENT:
        return {
          title: 'Link Parent to Student',
          description: 'Select students to link this parent to',
          targetType: 'students',
          data: [], // Feature not yet implemented in backend
          renderItem: (student, isSelected, onToggle) => (
            <Card key={student.id} className="cursor-pointer hover:bg-gray-50" onClick={onToggle}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Checkbox checked={isSelected} onChange={onToggle} />
                    <GraduationCap className="h-5 w-5 text-purple-500" />
                    <div>
                      <h4 className="font-medium">{student.email}</h4>
                      <p className="text-sm text-gray-500">Student</p>
                    </div>
                  </div>
                  <Badge variant="outline">Student</Badge>
                </div>
              </CardContent>
            </Card>
          )
        };

      case UserRole.SCHOOL_VIEWER:
        return {
          title: 'Link School to Center',
          description: 'Select centers to link this school admin\'s school to',
          targetType: 'centers',
          data: centersData?.data || [],
          renderItem: (center, isSelected, onToggle) => {
            // Centers are returned as CenterProfile objects with nested user
            // Structure: { id, centerName, address, phone, email, contactPerson, user: {...} }
            const centerId = center.id; // Use the centerProfile ID
            const centerName = center.centerName || center.user?.email || 'Unknown Center';
            const address = center.address;
            const contactPerson = center.contactPerson;
            const phone = center.phone;
            const email = center.email || center.user?.email;
            const centerType = center.centerType;
            const operatingHours = center.operatingHours;

            return (
              <Card key={centerId} className="cursor-pointer hover:bg-gray-50" onClick={onToggle}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1">
                      <Checkbox checked={isSelected} onChange={onToggle} />
                      <Building className="h-5 w-5 text-blue-500" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{centerName}</h4>
                          {centerType && (
                            <Badge variant="secondary" className="text-xs">{centerType}</Badge>
                          )}
                        </div>
                        {address && <p className="text-sm text-gray-500">{address}</p>}
                        <div className="flex gap-3 mt-1 flex-wrap">
                          {contactPerson && (
                            <p className="text-xs text-gray-400">Contact: {contactPerson}</p>
                          )}
                          {phone && (
                            <p className="text-xs text-gray-400">Phone: {phone}</p>
                          )}
                          {operatingHours && (
                            <p className="text-xs text-gray-400">Hours: {operatingHours}</p>
                          )}
                        </div>
                        {email && email !== centerName && (
                          <p className="text-xs text-gray-400">{email}</p>
                        )}
                      </div>
                    </div>
                    <Badge variant="outline">{centerType || 'Center'}</Badge>
                  </div>
                </CardContent>
              </Card>
            );
          }
        };

      default:
        return null;
    }
  };

  const handleAssignment = async () => {
    if (!selectedUser || selectedItems.length === 0) return;

    setIsAssigning(true);
    try {
      switch (selectedUser.role) {
        case UserRole.SPECIAL_EDUCATOR:
        case UserRole.SUPER_SPECIAL_EDUCATOR:
          // Determine educator type
          const educatorType = selectedUser.role === UserRole.SPECIAL_EDUCATOR
            ? 'SPECIAL_EDUCATOR'
            : 'SUPER_SPECIAL_EDUCATOR';

          // Assign educator to each selected center individually
          const assignmentPromises = selectedItems.map(async (centerId) => {
            // Centers are CenterProfile objects, so we can use the ID directly
            return apiClient.assignEducatorToCenter(
              centerId,
              selectedUser.id,
              educatorType
            );
          });

          await Promise.all(assignmentPromises);
          break;

        case UserRole.STUDENT:
          // Assign student to educator (only one educator can be selected)
          if (selectedItems.length === 1) {
            await apiClient.assignStudentToEducator(
              selectedUser.id,
              selectedItems[0]
            );
          }
          break;

        case UserRole.PARENT:
          // Note: Parent-student linking is not available in the current backend API
          toast({
            title: "Feature Not Available",
            description: "Parent-student linking is not yet implemented in the backend API.",
            variant: "destructive",
          });
          return;

        case UserRole.SCHOOL_VIEWER:
          // Link school to selected centers
          if (!selectedUser.schoolViewerProfile?.schoolId) {
            toast({
              title: "Error",
              description: "School viewer does not have a school associated with their profile.",
              variant: "destructive",
            });
            return;
          }

          // First get the school details
          const schoolDetails = await apiClient.getSchool(selectedUser.schoolViewerProfile.schoolId);
          
          if (!schoolDetails) {
            toast({
              title: "Error",
              description: "Could not fetch school details. Please try again.",
              variant: "destructive",
            });
            return;
          }

          // Link each selected center to the school by creating a new school instance
          const linkingPromises = selectedItems.map(async (centerId) => {
            return apiClient.linkSchoolToCenter(centerId, {
              name: schoolDetails.name,
              address: schoolDetails.address,
              phone: schoolDetails.phone,
              email: schoolDetails.email,
              principalName: schoolDetails.principalName
            });
          });

          await Promise.all(linkingPromises);
          break;

        default:
          throw new Error('Unsupported user role for assignment');
      }

      toast({
        title: "Success",
        description: "Assignment completed successfully.",
      });

      onAssignmentComplete();
      onClose();
      setSelectedItems([]);
    } catch (error: any) {
      console.error('Assignment failed:', error);
      
      // Extract error message from backend response
      let errorMessage = "Failed to complete assignment. Please try again.";
      
      if (error.response?.data?.error) {
        // Backend returns error in 'error' field: {"success":false,"error":"message"}
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.message) {
        // Some endpoints might use 'message' field
        errorMessage = error.response.data.message;
      } else if (error.message) {
        // Generic error message
        errorMessage = error.message;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsAssigning(false);
    }
  };

  const config = getAssignmentConfig();

  if (!config) {
    return null;
  }

  const filteredData = config.data.filter(item => {
    let searchableText = '';
    
    // Handle different data structures based on target type
    switch (config.targetType) {
      case 'centers':
        // For centers, use centerName, address, contactPerson, phone, email
        searchableText = (
          (item.centerName || '') + ' ' +
          (item.address || '') + ' ' +
          (item.contactPerson || '') + ' ' +
          (item.phone || '') + ' ' +
          (item.email || item.user?.email || '')
        ).toLowerCase();
        break;
      case 'educators':
        // For educators, use email and role
        searchableText = (
          (item.email || '') + ' ' +
          (item.role || '')
        ).toLowerCase();
        break;
      default:
        // Default search for other types
        searchableText = (item.name || item.email || '').toLowerCase();
    }
    
    return searchableText.includes(searchTerm.toLowerCase());
  });

  const toggleSelection = (itemId: string) => {
    setSelectedItems(prev => {
      // For student assignments, only allow one educator selection
      if (selectedUser?.role === UserRole.STUDENT) {
        return prev.includes(itemId) ? [] : [itemId];
      }

      return prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId];
    });
  };



  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>{config.title}</DialogTitle>
          <p className="text-sm text-gray-600">{config.description}</p>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder={`Search ${config.targetType}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Selected items count */}
          {selectedItems.length > 0 && (
            <div className="text-sm text-gray-600">
              {selectedItems.length} {config.targetType} selected
            </div>
          )}

          {/* Items list */}
          <div className="max-h-96 overflow-y-auto space-y-2">
            {filteredData.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No {config.targetType} found
              </div>
            ) : (
              filteredData.map(item =>
                config.renderItem(
                  item,
                  selectedItems.includes(item.id),
                  () => toggleSelection(item.id)
                )
              )
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isAssigning}>
            Cancel
          </Button>
          <Button
            onClick={handleAssignment}
            disabled={selectedItems.length === 0 || isAssigning}
          >
            {isAssigning ? 'Assigning...' : `Assign ${selectedItems.length} ${config.targetType}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}