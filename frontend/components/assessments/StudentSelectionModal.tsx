'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Filter, Loader2 } from 'lucide-react';
import { useEducatorStudents } from '@/hooks/useEducator';
import { GradeDisplay } from '@/components/ui/GradeDisplay';
import { GRADE_LIST } from '@/lib/gradeConfig';

interface StudentSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (studentId: string, student: any) => void;
  selectedStudentId?: string;
}

export function StudentSelectionModal({
  isOpen,
  onClose,
  onSelect,
  selectedStudentId
}: StudentSelectionModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12; // Show 12 students per page (2 columns x 6 rows)

  // Fetch students with server-side pagination and filtering
  const { students, pagination, isLoading } = useEducatorStudents({
    page: currentPage,
    limit: pageSize,
    search: searchTerm,
    status: 'ACTIVE' // Only show active students in selection
  });

  // Reset to page 1 when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Client-side grade filtering (if needed)
  const filteredStudents = gradeFilter
    ? students?.filter((student: any) => student.grade?.toString() === gradeFilter) || []
    : students || [];

  const handleStudentSelect = (student: any) => {
    onSelect(student.id, student);
    onClose();
  };

  const clearFilters = () => {
    setSearchTerm('');
    setGradeFilter('');
    setCurrentPage(1);
  };

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    if (pagination && currentPage < pagination.totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Select Student</DialogTitle>
          {pagination && (
            <p className="text-sm text-muted-foreground">
              {pagination.total} active student{pagination.total !== 1 ? 's' : ''} available
            </p>
          )}
        </DialogHeader>

        {/* Search and Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-4 p-4 bg-muted/40 rounded-lg">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search students by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={gradeFilter} onValueChange={setGradeFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="All Grades" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Grades</SelectItem>
                {GRADE_LIST.map((grade) => (
                  <SelectItem key={grade} value={grade}>
                    {grade}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {(searchTerm || gradeFilter) && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Student List */}
        <div className="flex-1 overflow-y-auto min-h-[400px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
                <p className="text-muted-foreground">Loading students...</p>
              </div>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-2">
                {searchTerm || gradeFilter
                  ? 'No students match your search criteria.'
                  : 'No active students found.'
                }
              </p>
              {(searchTerm || gradeFilter) && (
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4">
              {filteredStudents.map((student: any) => {
                const studentId = student.id || '';
                const fullName = student.fullName || student.name || 'Unknown Student';
                const grade = student.grade || 'N/A';
                const age = student.age || 'N/A';
                const school = student.school?.name || student.schoolName || '';

                return (
                  <Card
                    key={studentId}
                    className={`cursor-pointer transition-all hover:shadow-md ${selectedStudentId === studentId
                      ? 'border-2 border-blue-500 bg-primary/10'
                      : 'border hover:border-border'
                      }`}
                    onClick={() => handleStudentSelect(student)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-foreground truncate">{fullName}</h3>
                          <p className="text-sm text-muted-foreground">
                            <GradeDisplay grade={grade} /> • Age {age}
                          </p>
                          {school && (
                            <p className="text-xs text-muted-foreground mt-1 truncate">{school}</p>
                          )}
                        </div>
                        {selectedStudentId === studentId && (
                          <div className="w-3 h-3 rounded-full bg-blue-500 flex-shrink-0 ml-2"></div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t bg-muted/40">
            <div className="text-sm text-muted-foreground">
              Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, pagination.total)} of{' '}
              {pagination.total} students
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviousPage}
                disabled={currentPage === 1 || isLoading}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground min-w-[100px] text-center">
                Page {currentPage} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={currentPage >= pagination.totalPages || isLoading}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}