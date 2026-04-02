'use client';

import React, { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
} from 'lucide-react';

export interface Column<T> {
  key: keyof T | string;
  header: string;
  sortable?: boolean;
  searchable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
  width?: string;
}

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    onPageChange: (page: number) => void;
    onLimitChange: (limit: number) => void;
  };
  searchable?: boolean;
  onSearch?: (searchTerm: string) => void;
  emptyMessage?: string;
  className?: string;
}

type SortDirection = 'asc' | 'desc' | null;

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  pagination,
  searchable = true,
  onSearch,
  emptyMessage = 'No data available',
  className = '',
}: DataTableProps<T>) {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Handle sorting
  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortDirection(
        sortDirection === 'asc' ? 'desc' : sortDirection === 'desc' ? null : 'asc'
      );
      if (sortDirection === 'desc') {
        setSortColumn(null);
      }
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  // Handle search
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    if (onSearch) {
      onSearch(value);
    }
  };

  // Sort and filter data locally if no external pagination
  const processedData = useMemo(() => {
    let result = [...data];

    // Apply search filter if no external search handler
    if (!onSearch && searchTerm) {
      const searchableColumns = columns.filter(col => col.searchable !== false);
      result = result.filter(row =>
        searchableColumns.some(col => {
          const value = col.key.toString().split('.').reduce((obj, key) => obj?.[key], row);
          return value?.toString().toLowerCase().includes(searchTerm.toLowerCase());
        })
      );
    }

    // Apply sorting if no external pagination
    if (!pagination && sortColumn && sortDirection) {
      result.sort((a, b) => {
        const aValue = sortColumn.split('.').reduce((obj, key) => obj?.[key], a);
        const bValue = sortColumn.split('.').reduce((obj, key) => obj?.[key], b);

        if (aValue === bValue) return 0;
        if (aValue == null) return 1;
        if (bValue == null) return -1;

        const comparison = aValue < bValue ? -1 : 1;
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }

    return result;
  }, [data, searchTerm, sortColumn, sortDirection, columns, onSearch, pagination]);

  // Pagination calculations
  const totalPages = pagination ? Math.ceil(pagination.total / pagination.limit) : 1;
  const startItem = pagination ? (pagination.page - 1) * pagination.limit + 1 : 1;
  const endItem = pagination 
    ? Math.min(pagination.page * pagination.limit, pagination.total)
    : processedData.length;
  const totalItems = pagination ? pagination.total : processedData.length;

  const getSortIcon = (columnKey: string) => {
    if (sortColumn !== columnKey) {
      return <ArrowUpDown className="h-4 w-4" />;
    }
    if (sortDirection === 'asc') {
      return <ArrowUp className="h-4 w-4" />;
    }
    if (sortDirection === 'desc') {
      return <ArrowDown className="h-4 w-4" />;
    }
    return <ArrowUpDown className="h-4 w-4" />;
  };

  const renderCellValue = (column: Column<T>, row: T) => {
    if (column.render) {
      const value = column.key.toString().split('.').reduce((obj, key) => obj?.[key], row);
      return column.render(value, row);
    }
    
    const value = column.key.toString().split('.').reduce((obj, key) => obj?.[key], row);
    return value?.toString() || '-';
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search Bar */}
      {searchable && (
        <div className="flex items-center space-x-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead
                  key={column.key.toString()}
                  className={`${column.width || ''} ${
                    column.sortable !== false ? 'cursor-pointer select-none' : ''
                  }`}
                  onClick={() => 
                    column.sortable !== false && handleSort(column.key.toString())
                  }
                >
                  <div className="flex items-center space-x-2">
                    <span>{column.header}</span>
                    {column.sortable !== false && getSortIcon(column.key.toString())}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center py-8">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-6 w-6 border-primary border-t-transparent"></div>
                    <span>Loading...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : processedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center py-8 text-muted-foreground">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              processedData.map((row, index) => (
                <TableRow key={index} className="hover:bg-muted/40">
                  {columns.map((column) => (
                    <TableCell key={column.key.toString()}>
                      {renderCellValue(column, row)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination && pagination.total > 0 && (
        <div className="flex items-center justify-between px-2 py-4 border-t bg-muted/40/50">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">
              {pagination.total === 0 ? (
                'No entries found'
              ) : (
                <>
                  Showing <span className="font-medium">{((pagination.page - 1) * pagination.limit) + 1}</span> to{' '}
                  <span className="font-medium">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of{' '}
                  <span className="font-medium">{pagination.total}</span> {pagination.total === 1 ? 'entry' : 'entries'}
                </>
              )}
            </span>
          </div>

          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">Rows per page:</span>
              <Select
                value={pagination.limit.toString()}
                onValueChange={(value) => pagination.onLimitChange(Number(value))}
              >
                <SelectTrigger className="w-20 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => pagination.onPageChange(1)}
                  disabled={pagination.page === 1}
                  className="h-8 w-8 p-0"
                  title="First page"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => pagination.onPageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="h-8 w-8 p-0"
                  title="Previous page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <div className="flex items-center space-x-1">
                  {totalPages <= 7 ? (
                    // Show all pages if 7 or fewer
                    Array.from({ length: totalPages }, (_, i) => (
                      <Button
                        key={i + 1}
                        variant={pagination.page === i + 1 ? "default" : "outline"}
                        size="sm"
                        onClick={() => pagination.onPageChange(i + 1)}
                        className="w-8 h-8 p-0"
                      >
                        {i + 1}
                      </Button>
                    ))
                  ) : (
                    // Smart pagination for more than 7 pages
                    <>
                      {pagination.page > 3 && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => pagination.onPageChange(1)}
                            className="w-8 h-8 p-0"
                          >
                            1
                          </Button>
                          {pagination.page > 4 && (
                            <span className="px-2 text-muted-foreground">...</span>
                          )}
                        </>
                      )}
                      
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNumber;
                        if (pagination.page <= 3) {
                          pageNumber = i + 1;
                        } else if (pagination.page >= totalPages - 2) {
                          pageNumber = totalPages - 4 + i;
                        } else {
                          pageNumber = pagination.page - 2 + i;
                        }

                        if (pageNumber < 1 || pageNumber > totalPages) return null;

                        return (
                          <Button
                            key={pageNumber}
                            variant={pagination.page === pageNumber ? "default" : "outline"}
                            size="sm"
                            onClick={() => pagination.onPageChange(pageNumber)}
                            className="w-8 h-8 p-0"
                          >
                            {pageNumber}
                          </Button>
                        );
                      })}
                      
                      {pagination.page < totalPages - 2 && (
                        <>
                          {pagination.page < totalPages - 3 && (
                            <span className="px-2 text-muted-foreground">...</span>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => pagination.onPageChange(totalPages)}
                            className="w-8 h-8 p-0"
                          >
                            {totalPages}
                          </Button>
                        </>
                      )}
                    </>
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => pagination.onPageChange(pagination.page + 1)}
                  disabled={pagination.page === totalPages}
                  className="h-8 w-8 p-0"
                  title="Next page"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => pagination.onPageChange(totalPages)}
                  disabled={pagination.page === totalPages}
                  className="h-8 w-8 p-0"
                  title="Last page"
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}