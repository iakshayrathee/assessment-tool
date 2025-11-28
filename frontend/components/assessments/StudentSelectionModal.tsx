'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Filter, X } from 'lucide-react';
import { useEducatorStudents } from '@/hooks/useEducator';

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
  const { students, isLoading } = useEducatorStudents();
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
  const paginatedStudents = filteredStudents.slice(startIndex, startIndex + itemsPerPage);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, gradeFilter]);

  const handleStudentSelect = (studentId: string) => {
    onSelect(studentId);
    onClose();
  };

  const clearFilters = () => {
    setSearchTerm('');
    setGradeFilter('all');
    setCurrentPage(1);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Select Student</DialogTitle>
        </DialogHeader>

        {/* Search and Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search students by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <Select value={gradeFilter} onValueChange={setGradeFilter}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Grade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Grades</SelectItem>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((grade) => (
                  <SelectItem key={grade} value={grade.toString()}>
                    Grade {grade}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {(searchTerm || gradeFilter !== 'all') && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Student List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-gray-600">Loading students...</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">
                {searchTerm || gradeFilter !== 'all' 
                  ? 'No students match your search criteria.' 
                  : 'No students found.'
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4">
              {paginatedStudents.map((student: any) => {
                // Safely extract student properties with fallbacks
                const studentId = student.id || '';
                const fullName = student.fullName || student.name || 'Unknown Student';
                const grade = student.grade || 0;
                const age = student.age || 0;
                const school = student.school?.name || student.schoolName || '';
                
                return (
                  <Card
                    key={studentId}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedStudentId === studentId 
                        ? 'border-2 border-blue-500 bg-blue-50' 
                        : 'border hover:border-gray-300'
                    }`}
                    onClick={() => handleStudentSelect(studentId)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">{fullName}</h3>
                          <p className="text-sm text-gray-600">
                            Grade {grade} • Age {age}
                          </p>
                          {school && (
                            <p className="text-xs text-gray-500 mt-1">{school}</p>
                          )}
                        </div>
                        {selectedStudentId === studentId && (
                          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
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
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t">
            <div className="text-sm text-gray-600">
              Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredStudents.length)} of{' '}
              {filteredStudents.length} students
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
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