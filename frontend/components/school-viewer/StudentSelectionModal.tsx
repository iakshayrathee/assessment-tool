'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Filter, X } from 'lucide-react';
import { useSchoolViewerStudents } from '@/hooks/useSchoolViewer';
import { GradeDisplay } from '@/components/ui/GradeDisplay';

interface Student {
  id: string;
  fullName: string;
  grade: number;
  age: number;
  school?: string;
}

interface StudentSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (studentId: string) => void;
  selectedStudentId?: string;
}

export function StudentSelectionModal({
  isOpen,
  onClose,
  onSelect,
  selectedStudentId
}: StudentSelectionModalProps) {
  const { students, isLoading } = useSchoolViewerStudents();
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter students based on search and grade filter
  const filteredStudents = students?.filter((student: any) => {
    // Ensure student is an object with expected properties
    if (!student || typeof student !== 'object') return false;

    const studentName = student.fullName || student.name || '';
    const studentGrade = student.grade || 0;

    const matchesSearch = studentName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGrade = gradeFilter === 'all' || studentGrade.toString() === gradeFilter;
    return matchesSearch && matchesGrade;
  }) || [];

  // Pagination
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedStudents = filteredStudents.slice(startIndex, endIndex);

  const handleStudentSelect = (studentId: string) => {
    onSelect(studentId);
    onClose();
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setGradeFilter('all');
    setCurrentPage(1);
  };

  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      setGradeFilter('all');
      setCurrentPage(1);
    }
  }, [isOpen]);

  // Get unique grades for filter
  const uniqueGrades = Array.from(new Set(students?.map((student: any) => student.grade?.toString()).filter(Boolean) || [])).sort();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Select Student</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search and Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search" className="sr-only">Search students</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search students by name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="w-full sm:w-32">
              <Label htmlFor="grade-filter" className="sr-only">Filter by grade</Label>
              <Select value={gradeFilter} onValueChange={setGradeFilter}>
                <SelectTrigger id="grade-filter">
                  <SelectValue placeholder="Grade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Grades</SelectItem>
                  {uniqueGrades.map((grade) => (
                    <SelectItem key={grade} value={grade}>
                      Grade {grade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="outline"
              onClick={handleClearFilters}
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Clear
            </Button>
          </div>

          {/* Student List */}
          <div className="space-y-2">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-primary border-t-transparent"></div>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm || gradeFilter !== 'all' ? (
                  <p>No students match your search criteria.</p>
                ) : (
                  <p>No students available.</p>
                )}
              </div>
            ) : (
              <>
                <div className="grid gap-2">
                  {paginatedStudents.map((student: any) => (
                    <Card
                      key={student.id}
                      className={`cursor-pointer transition-colors hover:bg-muted/40 ${selectedStudentId === student.id ? 'border-primary bg-primary/5' : ''
                        }`}
                      onClick={() => handleStudentSelect(student.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium text-foreground">
                              {student.fullName || student.name}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              <GradeDisplay grade={student.grade.toString()} /> • Age {student.age}
                              {student.school && ` • ${student.school}`}
                            </p>
                          </div>
                          {selectedStudentId === student.id && (
                            <div className="w-2 h-2 bg-primary rounded-full"></div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between pt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}