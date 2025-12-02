'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, 
  Building, 
  School as SchoolIcon,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface Center {
  id: string;
  name: string;
  address?: string;
}

interface School {
  id: string;
  name: string;
  address?: string;
}

interface CenterSchoolSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSchoolSelected: (schoolId: string, schoolName: string) => void;
}

export default function CenterSchoolSelectionModal({ 
  isOpen, 
  onClose, 
  onSchoolSelected 
}: CenterSchoolSelectionModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [centers, setCenters] = useState<Center[]>([]);
  const [selectedCenter, setSelectedCenter] = useState<string>('');
  const [schools, setSchools] = useState<School[]>([]);
  const [filteredSchools, setFilteredSchools] = useState<School[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    if (isOpen) {
      loadCenters();
      setSelectedCenter('');
      setSchools([]);
      setSearchTerm('');
      setCurrentPage(1);
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedCenter) {
      loadSchools(selectedCenter);
    }
  }, [selectedCenter]);

  useEffect(() => {
    // Filter schools based on search term
    const filtered = schools.filter(school =>
      school.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (school.address && school.address.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredSchools(filtered);
    setCurrentPage(1); // Reset to first page when search changes
  }, [schools, searchTerm]);

  const loadCenters = async () => {
    try {
      setLoading(true);
      
      // For special educators, get their assigned centers
      if (user?.role === 'SPECIAL_EDUCATOR') {
        const educatorProfile = await apiClient.getSpecialEducatorProfile();
        console.log('Educator profile:', educatorProfile);
        
        if (educatorProfile.centerAssignments && educatorProfile.centerAssignments.length > 0) {
          // Extract center information directly from the assignments
          const centersData = educatorProfile.centerAssignments.map((assignment: any) => {
            console.log('Assignment:', assignment);
            return {
              id: assignment.centerId,
              name: assignment.center?.centerName || assignment.center?.name || 'Unknown Center',
              address: assignment.center?.address || ''
            };
          });
          
          setCenters(centersData);
          console.log('Centers data:', centersData);
        } else {
          toast({
            title: "No Centers Assigned",
            description: "You are not assigned to any centers. Please contact your administrator.",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error('Failed to load centers:', error);
      toast({
        title: "Error",
        description: "Failed to load centers. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadSchools = async (centerId: string) => {
    try {
      setLoading(true);
      const schoolsData = await apiClient.getCenterSchools(centerId);
      setSchools(schoolsData);
      setFilteredSchools(schoolsData); // Initialize filtered schools with all schools
    } catch (error) {
      console.error('Failed to load schools:', error);
      toast({
        title: "Error",
        description: "Failed to load schools. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Pagination calculations
  const totalPages = Math.ceil(filteredSchools.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentSchools = filteredSchools.slice(startIndex, endIndex);

  const handleSchoolSelect = (school: School) => {
    onSchoolSelected(school.id, school.name);
    onClose();
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Select School
          </DialogTitle>
          <DialogDescription>
            Choose a center and then select a school from the list
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Center Selection */}
          <div className="space-y-2">
            <Label htmlFor="center">Select Center *</Label>
            {loading ? (
              <div className="p-3 bg-gray-50 rounded-md text-sm text-gray-500">
                Loading centers...
              </div>
            ) : (
              <>
                <Select 
                  value={selectedCenter} 
                  onValueChange={setSelectedCenter}
                  disabled={centers.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a center" />
                  </SelectTrigger>
                  <SelectContent>
                    {centers.map((center) => (
                      <SelectItem key={center.id} value={center.id}>
                        {center.name}
                        {center.address && ` - ${center.address}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {centers.length === 0 && (
                  <p className="text-sm text-gray-500">
                    No centers assigned to your account. Please contact your administrator.
                  </p>
                )}
              </>
            )}
          </div>

          {/* School Selection (only shown when center is selected) */}
          {selectedCenter && (
            <>
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search schools..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  disabled={loading}
                />
              </div>

              {/* Schools List */}
              <div className="border rounded-lg overflow-hidden">
                <div className="max-h-64 overflow-y-auto">
                  {loading ? (
                    <div className="p-4 text-center text-gray-500">
                      Loading schools...
                    </div>
                  ) : currentSchools.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      {searchTerm ? 'No schools found matching your search' : 'No schools available for this center'}
                    </div>
                  ) : (
                    <div className="divide-y">
                      {currentSchools.map((school) => (
                        <button
                          key={school.id}
                          onClick={() => handleSchoolSelect(school)}
                          className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <SchoolIcon className="h-5 w-5 text-blue-600" />
                            <div>
                              <p className="font-medium">{school.name}</p>
                              {school.address && (
                                <p className="text-sm text-gray-500">{school.address}</p>
                              )}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Pagination */}
                {filteredSchools.length > itemsPerPage && (
                  <div className="flex items-center justify-between p-4 border-t bg-gray-50">
                    <div className="text-sm text-gray-500">
                      Showing {startIndex + 1}-{Math.min(endIndex, filteredSchools.length)} of {filteredSchools.length} schools
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePreviousPage}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleNextPage}
                        disabled={currentPage === totalPages}
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}