'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  MessageCircle,
  Plus,
  Search,
  Filter,
  ArrowLeft,
  AlertCircle,
  Clock,
  CheckCircle,
  Calendar
} from 'lucide-react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { toast } from 'react-hot-toast';

interface Concern {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export default function ParentConcerns() {
  const { user } = useAuth();
  const [concerns, setConcerns] = useState<Concern[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });

  useEffect(() => {
    loadConcerns();
  }, [pagination.page, statusFilter]);

  const loadConcerns = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: pagination.page,
        limit: pagination.limit
      };

      if (statusFilter) {
        params.status = statusFilter;
      }

      const result = await apiClient.getParentConcerns(params);
      setConcerns(result.data);
      setPagination(prev => ({
        ...prev,
        total: result.pagination.total,
        pages: result.pagination.totalPages || Math.ceil(result.pagination.total / result.pagination.limit)
      }));
    } catch (error) {
      console.error('Failed to load concerns:', error);
      toast.error('Failed to load concerns');
      // Mock data for demonstration
      setConcerns([
        {
          id: '1',
          title: 'Difficulty with homework completion',
          description: 'My child is struggling to complete homework assignments on time and needs additional support.',
          category: 'Academic',
          priority: 'High',
          status: 'Open',
          createdAt: '2024-01-14T10:00:00Z',
          updatedAt: '2024-01-14T10:00:00Z'
        },
        {
          id: '2',
          title: 'Social interaction concerns',
          description: 'I have noticed my child has difficulty interacting with peers during group activities.',
          category: 'Social',
          priority: 'Medium',
          status: 'In Progress',
          createdAt: '2024-01-10T10:00:00Z',
          updatedAt: '2024-01-12T10:00:00Z'
        },
        {
          id: '3',
          title: 'Medication timing adjustment needed',
          description: 'The current medication schedule conflicts with school hours. Need to discuss alternatives.',
          category: 'Medical',
          priority: 'High',
          status: 'Resolved',
          createdAt: '2024-01-05T10:00:00Z',
          updatedAt: '2024-01-08T10:00:00Z'
        }
      ]);
      setPagination(prev => ({
        ...prev,
        total: 3,
        pages: 1
      }));
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Open':
        return <AlertCircle className="h-4 w-4" />;
      case 'In Progress':
        return <Clock className="h-4 w-4" />;
      case 'Resolved':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open':
        return 'bg-red-100 text-red-800';
      case 'In Progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'Resolved':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'bg-red-100 text-red-800';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'Low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredConcerns = concerns.filter(concern =>
    concern.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    concern.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading concerns...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <Link href="/parent/dashboard">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">My Concerns</h1>
                <p className="text-gray-600">Submit and track your concerns</p>
              </div>
            </div>
            <Link href="/parent/concerns/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Submit New Concern
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search concerns..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="sm:w-48">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="Open">Open</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Concerns List */}
        <div className="space-y-4">
          {filteredConcerns.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No concerns found</h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm || statusFilter
                    ? 'No concerns match your current filters.'
                    : 'You haven\'t submitted any concerns yet.'}
                </p>
                <Link href="/parent/concerns/new">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Submit Your First Concern
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            filteredConcerns.map((concern) => (
              <Card key={concern.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-semibold text-lg">{concern.title}</h3>
                        <Badge className={getStatusColor(concern.status)}>
                          {getStatusIcon(concern.status)}
                          <span className="ml-1">{concern.status}</span>
                        </Badge>
                        <Badge className={getPriorityColor(concern.priority)}>
                          {concern.priority}
                        </Badge>
                      </div>
                      <p className="text-gray-600 mb-3 line-clamp-2">{concern.description}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          Submitted: {new Date(concern.createdAt).toLocaleDateString()}
                        </div>
                        <Badge variant="outline">{concern.category}</Badge>
                      </div>
                    </div>
                    <div className="ml-4">
                      <Link href={`/parent/concerns/${concern.id}`}>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex justify-center mt-8">
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
              >
                Previous
              </Button>
              <span className="flex items-center px-4 py-2 text-sm text-gray-700">
                Page {pagination.page} of {pagination.pages}
              </span>
              <Button
                variant="outline"
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page === pagination.pages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
