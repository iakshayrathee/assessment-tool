'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Shield,
  Search,
  Download,
  RefreshCw,
  User,
  Activity,
  Database,
  Eye,
  Edit,
  Trash2,
  Plus,
  LogIn,
  LogOut,
  FileText,
  Users,
  Building,
  School
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { ProfessionalDatePicker } from '@/components/ui/professional-date-picker';

interface AuditLog {
  id: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  user: {
    id: string;
    email: string;
    role: string;
  };
}

interface AuditLogsData {
  logs: AuditLog[];
  total: number;
  page: number;
  totalPages: number;
}

export default function AdminAuditLogsPage() {
  useAuth();
  const [logsData, setLogsData] = useState<AuditLogsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAction, setSelectedAction] = useState('');
  const [selectedResource, setSelectedResource] = useState('');
  const [selectedUserId] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      // Since the audit logs endpoint is not implemented, show an error message
      setLogsData(null);
      console.warn('Audit logs endpoint not implemented in backend');
    } catch (error) {
      console.error('Failed to load audit logs:', error);
      setLogsData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAuditLogs();
  }, [currentPage, searchQuery, selectedAction, selectedResource, selectedUserId, startDate, endDate, loadAuditLogs]);

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'LOGIN': return <LogIn className="h-4 w-4 text-success" />;
      case 'LOGOUT': return <LogOut className="h-4 w-4 text-muted-foreground" />;
      case 'CREATE': return <Plus className="h-4 w-4 text-primary" />;
      case 'UPDATE': return <Edit className="h-4 w-4 text-warning" />;
      case 'DELETE': return <Trash2 className="h-4 w-4 text-destructive" />;
      case 'VIEW': return <Eye className="h-4 w-4 text-info" />;
      default: return <Activity className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getResourceIcon = (resource: string) => {
    switch (resource) {
      case 'User': return <Users className="h-4 w-4" />;
      case 'Student': return <User className="h-4 w-4" />;
      case 'Center': return <Building className="h-4 w-4" />;
      case 'School': return <School className="h-4 w-4" />;
      case 'Assessment': return <FileText className="h-4 w-4" />;
      case 'Report': return <FileText className="h-4 w-4" />;
      case 'IEPGoal': return <FileText className="h-4 w-4" />;
      default: return <Database className="h-4 w-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-destructive/10 text-foreground';
      case 'SUPER_SPECIAL_EDUCATOR': return 'bg-info/10 text-foreground';
      case 'SPECIAL_EDUCATOR': return 'bg-primary/10 text-primary';
      case 'CENTER': return 'bg-success/10 text-foreground';
      case 'PARENT': return 'bg-warning/10 text-foreground';
      case 'SCHOOL_VIEWER': return 'bg-muted text-foreground';
      default: return 'bg-muted text-foreground';
    }
  };

  const exportLogs = async () => {
    try {
      const params = {
        type: 'audit_logs',
        format: 'csv',
        filters: {
          action: selectedAction,
          resource: selectedResource,
          userId: selectedUserId,
          startDate,
          endDate
        }
      };
      
      await apiClient.exportData(params);
      alert('Export started. You will receive a download link shortly.');
    } catch (error) {
      console.error('Failed to export logs:', error);
      alert('Failed to export logs. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading audit logs...</p>
        </div>
      </div>
    );
  }

  if (!logsData) {
    return (
      <PageWrapper
        title="Audit Logs"
        description="Monitor system activities and user actions"
        breadcrumbs={[{ label: 'Admin' }, { label: 'Audit Logs' }]}
      >
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">Audit Logs Not Available</h3>
                <p className="text-muted-foreground mb-4">
                  The audit logs feature is currently under development. 
                  The backend API endpoints for audit log management are not yet implemented.
                </p>
                <Button variant="outline" onClick={() => window.location.reload()}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
              </div>
            </CardContent>
          </Card>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper
      title="Audit Logs"
      description="Monitor system activities and user actions"
      breadcrumbs={[{ label: 'Admin' }, { label: 'Audit Logs' }]}
      actions={
        <>
          <Button variant="outline" onClick={loadAuditLogs}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={exportLogs}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </>
      }
    >
            <div className="flex gap-3">
              <Button variant="outline" onClick={loadAuditLogs}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button variant="outline" onClick={exportLogs}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>

      <div className="p-6">
        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              {/* Action Filter */}
              <select
                value={selectedAction}
                onChange={(e) => setSelectedAction(e.target.value)}
                className="px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Actions</option>
                <option value="LOGIN">Login</option>
                <option value="LOGOUT">Logout</option>
                <option value="CREATE">Create</option>
                <option value="UPDATE">Update</option>
                <option value="DELETE">Delete</option>
                <option value="VIEW">View</option>
              </select>

              {/* Resource Filter */}
              <select
                value={selectedResource}
                onChange={(e) => setSelectedResource(e.target.value)}
                className="px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Resources</option>
                <option value="User">User</option>
                <option value="Student">Student</option>
                <option value="Center">Center</option>
                <option value="School">School</option>
                <option value="Assessment">Assessment</option>
                <option value="Report">Report</option>
                <option value="IEPGoal">IEP Goal</option>
              </select>

              {/* Start Date */}
              <ProfessionalDatePicker
                label="Start Date"
                value={startDate}
                onChange={setStartDate}
                placeholder="Select start date"
              />

              {/* End Date */}
              <ProfessionalDatePicker
                label="End Date"
                value={endDate}
                onChange={setEndDate}
                placeholder="Select end date"
              />
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <input
                type="text"
                placeholder="Search by user email, details, or IP address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </CardContent>
        </Card>

        {/* Audit Logs Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Audit Logs ({logsData?.total || 0})
            </CardTitle>
            <CardDescription>
              System activity logs and user actions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold">Action</th>
                    <th className="text-left py-3 px-4 font-semibold">Resource</th>
                    <th className="text-left py-3 px-4 font-semibold">User</th>
                    <th className="text-left py-3 px-4 font-semibold">Details</th>
                    <th className="text-left py-3 px-4 font-semibold">IP Address</th>
                    <th className="text-left py-3 px-4 font-semibold">Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {logsData?.logs.map((log) => (
                    <tr key={log.id} className="border-b hover:bg-muted/40">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          {getActionIcon(log.action)}
                          <span className="font-medium">{log.action}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          {getResourceIcon(log.resource)}
                          <span>{log.resource}</span>
                          {log.resourceId && (
                            <Badge variant="outline" className="text-xs">
                              {log.resourceId.slice(0, 8)}...
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div>
                          <div className="font-medium text-foreground">{log.user.email}</div>
                          <Badge className={`text-xs ${getRoleColor(log.user.role)}`}>
                            {log.user.role.replace('_', ' ')}
                          </Badge>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-sm text-muted-foreground max-w-xs truncate">
                          {log.details || 'No details available'}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-sm text-muted-foreground font-mono">
                          {log.ipAddress || 'N/A'}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-sm text-muted-foreground">
                          <div>{new Date(log.createdAt).toLocaleDateString()}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(log.createdAt).toLocaleTimeString()}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {logsData && logsData.totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-muted-foreground">
                  Showing {((logsData.page - 1) * 20) + 1} to {Math.min(logsData.page * 20, logsData.total)} of {logsData.total} logs
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={logsData.page === 1}
                    onClick={() => setCurrentPage(logsData.page - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={logsData.page === logsData.totalPages}
                    onClick={() => setCurrentPage(logsData.page + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  );
}
