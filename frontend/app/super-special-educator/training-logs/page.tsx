'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  BookOpen, 
  Calendar,
  Search,
  ArrowLeft,
  Plus,
  User,
  Clock,
  Filter,
  Download,
  Edit,
  Trash2,
  Users,
  Target,
  CheckCircle,
  AlertCircle,
  FileText,
  GraduationCap,
  Award,
  Activity,
  MessageSquare,
  Eye
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

interface TrainingLog {
  id: string;
  title: string;
  description: string;
  type: 'MENTORSHIP' | 'WORKSHOP' | 'OBSERVATION' | 'FEEDBACK_SESSION' | 'PROFESSIONAL_DEVELOPMENT' | 'CASE_CONSULTATION';
  duration?: number;
  participants: string[];
  notes?: string;
  followUpRequired: boolean;
  followUpDate?: string;
  createdAt: string;
  updatedAt: string;
  specialEducator?: {
    fullName: string;
  };
}

interface NewTrainingLog {
  title: string;
  description: string;
  type: string;
  duration?: number;
  educatorId?: string;
  participants: string[];
  notes: string;
  followUpRequired: boolean;
  followUpDate?: string;
}

export default function TrainingLogsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [trainingLogs, setTrainingLogs] = useState<TrainingLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [educatorFilter, setEducatorFilter] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newLog, setNewLog] = useState<NewTrainingLog>({
    title: '',
    description: '',
    type: 'MENTORSHIP',
    duration: undefined,
    educatorId: '',
    participants: [],
    notes: '',
    followUpRequired: false,
    followUpDate: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [educators, setEducators] = useState<any[]>([]);

  useEffect(() => {
    fetchTrainingLogs();
    fetchEducators();
  }, []);

  const fetchTrainingLogs = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getTrainingLogs();
      setTrainingLogs(response.data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch training logs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchEducators = async () => {
    try {
      const response = await apiClient.getAssignedEducators();
      setEducators(response.data || []);
    } catch (error: any) {
      console.error('Failed to fetch educators:', error);
    }
  };

  const handleCreateLog = async () => {
    try {
      setSubmitting(true);
      await apiClient.createTrainingLog(newLog);
      toast({
        title: "Success",
        description: "Training log created successfully",
      });
      setShowCreateDialog(false);
      setNewLog({
        title: '',
        description: '',
        type: 'MENTORSHIP',
        duration: undefined,
        educatorId: '',
        participants: [],
        notes: '',
        followUpRequired: false,
        followUpDate: ''
      });
      fetchTrainingLogs();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create training log",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'MENTORSHIP':
        return <User className="h-4 w-4" />;
      case 'WORKSHOP':
        return <GraduationCap className="h-4 w-4" />;
      case 'OBSERVATION':
        return <Eye className="h-4 w-4" />;
      case 'FEEDBACK_SESSION':
        return <MessageSquare className="h-4 w-4" />;
      case 'PROFESSIONAL_DEVELOPMENT':
        return <Award className="h-4 w-4" />;
      case 'CASE_CONSULTATION':
        return <FileText className="h-4 w-4" />;
      default:
        return <BookOpen className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'MENTORSHIP':
        return 'bg-blue-100 text-blue-800';
      case 'WORKSHOP':
        return 'bg-green-100 text-green-800';
      case 'OBSERVATION':
        return 'bg-purple-100 text-purple-800';
      case 'FEEDBACK_SESSION':
        return 'bg-orange-100 text-orange-800';
      case 'PROFESSIONAL_DEVELOPMENT':
        return 'bg-indigo-100 text-indigo-800';
      case 'CASE_CONSULTATION':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredLogs = trainingLogs.filter(log => {
    const matchesSearch = log.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.specialEducator?.fullName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || log.type === typeFilter;
    const matchesEducator = educatorFilter === 'all' || log.specialEducator?.fullName === educatorFilter;
    
    return matchesSearch && matchesType && matchesEducator;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => router.push('/super-special-educator')}
            className="flex items-center"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Training Logs</h1>
            <p className="text-gray-600 mt-1">
              Record and track training interactions with Special Educators
            </p>
          </div>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="flex items-center">
          <Plus className="mr-2 h-4 w-4" />
          Add Training Log
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="mr-2 h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="type">Training Type</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="MENTORSHIP">Mentorship</SelectItem>
                  <SelectItem value="WORKSHOP">Workshop</SelectItem>
                  <SelectItem value="OBSERVATION">Observation</SelectItem>
                  <SelectItem value="FEEDBACK_SESSION">Feedback Session</SelectItem>
                  <SelectItem value="PROFESSIONAL_DEVELOPMENT">Professional Development</SelectItem>
                  <SelectItem value="CASE_CONSULTATION">Case Consultation</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="educator">Educator</Label>
              <Select value={educatorFilter} onValueChange={setEducatorFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All educators" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Educators</SelectItem>
                  {educators.map((educator) => (
                    <SelectItem key={educator.id} value={educator.specialEducator?.fullName || ''}>
                      {educator.specialEducator?.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button variant="outline" onClick={() => {
                setSearchTerm('');
                setTypeFilter('all');
                setEducatorFilter('all');
              }}>
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Training Logs Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredLogs.map((log) => (
          <Card key={log.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${getTypeColor(log.type)}`}>
                    {getTypeIcon(log.type)}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{log.title}</CardTitle>
                    <CardDescription className="flex items-center space-x-2 mt-1">
                      <Calendar className="h-3 w-3" />
                      <span>{new Date(log.createdAt).toLocaleDateString()}</span>
                      {log.duration && (
                        <>
                          <Clock className="h-3 w-3 ml-2" />
                          <span>{log.duration} min</span>
                        </>
                      )}
                    </CardDescription>
                  </div>
                </div>
                <Badge variant="outline" className={getTypeColor(log.type)}>
                  {log.type.replace('_', ' ')}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">{log.description}</p>
              
              {log.specialEducator && (
                <div className="flex items-center space-x-2 text-sm">
                  <User className="h-4 w-4 text-gray-400" />
                  <span className="font-medium">{log.specialEducator.fullName}</span>
                </div>
              )}

              {log.participants.length > 0 && (
                <div className="flex items-center space-x-2 text-sm">
                  <Users className="h-4 w-4 text-gray-400" />
                  <span>{log.participants.length} participant(s)</span>
                </div>
              )}

              {log.notes && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <MessageSquare className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Notes</span>
                  </div>
                  <p className="text-sm text-gray-600">{log.notes}</p>
                </div>
              )}

              {log.followUpRequired && (
                <div className="flex items-center space-x-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm text-yellow-800">
                    Follow-up required
                    {log.followUpDate && ` by ${new Date(log.followUpDate).toLocaleDateString()}`}
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center pt-2 border-t">
                <div className="text-xs text-gray-500">
                  Last updated: {new Date(log.updatedAt).toLocaleDateString()}
                </div>
                <div className="flex space-x-2">
                  <Button variant="ghost" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredLogs.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No training logs found</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || typeFilter !== 'all' || educatorFilter !== 'all'
                ? 'Try adjusting your filters to see more results.'
                : 'Start by creating your first training log.'}
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Training Log
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create Training Log Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Training Log</DialogTitle>
            <DialogDescription>
              Record a new training interaction or session with Special Educators.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={newLog.title}
                onChange={(e) => setNewLog({ ...newLog, title: e.target.value })}
                placeholder="e.g., IEP Best Practices Workshop"
              />
            </div>

            <div>
              <Label htmlFor="type">Training Type *</Label>
              <Select value={newLog.type} onValueChange={(value) => setNewLog({ ...newLog, type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MENTORSHIP">Mentorship</SelectItem>
                  <SelectItem value="WORKSHOP">Workshop</SelectItem>
                  <SelectItem value="OBSERVATION">Observation</SelectItem>
                  <SelectItem value="FEEDBACK_SESSION">Feedback Session</SelectItem>
                  <SelectItem value="PROFESSIONAL_DEVELOPMENT">Professional Development</SelectItem>
                  <SelectItem value="CASE_CONSULTATION">Case Consultation</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="educator">Primary Educator</Label>
              <Select value={newLog.educatorId} onValueChange={(value) => setNewLog({ ...newLog, educatorId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an educator" />
                </SelectTrigger>
                <SelectContent>
                  {educators.map((educator) => (
                    <SelectItem key={educator.id} value={educator.specialEducatorId}>
                      {educator.specialEducator?.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={newLog.duration || ''}
                  onChange={(e) => setNewLog({ ...newLog, duration: e.target.value ? parseInt(e.target.value) : undefined })}
                  placeholder="60"
                />
              </div>
              <div>
                <Label htmlFor="followUpDate">Follow-up Date</Label>
                <Input
                  id="followUpDate"
                  type="date"
                  value={newLog.followUpDate}
                  onChange={(e) => setNewLog({ ...newLog, followUpDate: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={newLog.description}
                onChange={(e) => setNewLog({ ...newLog, description: e.target.value })}
                placeholder="Describe the training session, topics covered, and objectives..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={newLog.notes}
                onChange={(e) => setNewLog({ ...newLog, notes: e.target.value })}
                placeholder="Additional notes, observations, or action items..."
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="followUp"
                checked={newLog.followUpRequired}
                onCheckedChange={(checked) => setNewLog({ ...newLog, followUpRequired: !!checked })}
              />
              <Label htmlFor="followUp">Follow-up required</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateLog} 
              disabled={submitting || !newLog.title || !newLog.description}
            >
              {submitting ? 'Creating...' : 'Create Log'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
