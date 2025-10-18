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

  // Fetch data based on user role
  const { data: educatorsData } = useEducators();
  const { data: centersData } = useCenters();
  const { data: schoolsData } = useSchools();
  const { data: studentsData } = useUsers({ role: UserRole.STUDENT, limit: 100 });
  const { data: parentsData } = useUsers({ role: UserRole.PARENT, limit: 100 });

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
            // Handle the nested centerProfile structure
            const centerProfile = center.centerProfile;
            const centerId = centerProfile?.id || center.id;
            const centerName = centerProfile?.centerName || center.name || 'Unknown Center';
            const address = centerProfile?.address || center.address;
            const contactPerson = centerProfile?.contactPerson;
            
            return (
              <Card key={centerId} className="cursor-pointer hover:bg-gray-50" onClick={onToggle}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Checkbox checked={isSelected} onChange={onToggle} />
                      <Building className="h-5 w-5 text-blue-500" />
                      <div>
                        <h4 className="font-medium">{centerName}</h4>
                        <p className="text-sm text-gray-500">{address}</p>
                        {contactPerson && (
                          <p className="text-xs text-gray-400">Contact: {contactPerson}</p>
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
          data: studentsData?.data || [],
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
          renderItem: (center, isSelected, onToggle) => (
            <Card key={center.id} className="cursor-pointer hover:bg-gray-50" onClick={onToggle}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Checkbox checked={isSelected} onChange={onToggle} />
                    <Building className="h-5 w-5 text-blue-500" />
                    <div>
                      <h4 className="font-medium">{center.name}</h4>
                      <p className="text-sm text-gray-500">{center.address}</p>
                    </div>
                  </div>
                  <Badge variant="outline">{center.type || 'Center'}</Badge>
                </div>
              </CardContent>
            </Card>
          )
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
          // Convert selected user IDs to centerProfile IDs for assignment
          const centerProfileIds = selectedItems.map(userId => {
            const center = centersData?.data?.find((c: any) => c.id === userId);
            return center?.centerProfile?.id || userId;
          });
          
          // Assign educator to centers using the existing assignEducators method
          await apiClient.assignEducators({
            educatorIds: [selectedUser.id],
            centerIds: centerProfileIds
          });
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
          // Note: School-center linking would require the school ID and use linkSchoolToCenter
          // This would need additional implementation to get the school associated with the admin
          toast({
            title: "Feature Not Available", 
            description: "School-center linking requires additional implementation to identify the admin's school.",
            variant: "destructive",
          });
          return;

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
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to complete assignment. Please try again.",
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
    const searchableText = (item.name || item.email || '').toLowerCase();
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