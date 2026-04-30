'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Users, 
  Building, 
  School, 
  GraduationCap,
  UserCheck,
  FileText,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Filter,
  MapPin,
  Activity,
  BarChart3,
  RefreshCw,
  Download
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PageWrapper } from '@/components/layout/PageWrapper';

interface OverviewStats {
  totalCenters: number;
  totalSchools: number;
  totalEducators: number;
  totalParents: number;
  totalStudents: number;
  activeUsers: number;
  pendingApprovals: number;
  recentActivity: number;
}

interface QuickFilter {
  role: string;
  location: string;
  status: string;
}

export default function GlobalOverviewPage() {
  const { user } = useAuth();
  const { t } = useTranslation('admin');
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<QuickFilter>({
    role: 'all',
    location: 'all',
    status: 'all'
  });

  useEffect(() => {
    loadOverviewData();
  }, []);

  const loadOverviewData = async () => {
    try {
      setLoading(true);
      
      // Load real data from backend
      const dashboardData = await apiClient.getAdminDashboard();
      
      // Map the actual API response structure to our interface
      const overview = dashboardData.overview || {};
      const usersByRole = dashboardData.usersByRole || {};
      
      const transformedStats: OverviewStats = {
        totalCenters: overview.totalCenters || 0,
        totalSchools: overview.totalSchools || 0,
        totalEducators: (usersByRole.SPECIAL_EDUCATOR || 0) + (usersByRole.SUPER_SPECIAL_EDUCATOR || 0),
        totalParents: usersByRole.PARENT || 0,
        totalStudents: overview.totalStudents || 0,
        activeUsers: overview.activeUsers || 0,
        pendingApprovals: overview.pendingApprovals || 0,
        recentActivity: dashboardData.recentActivity?.length || 0
      };
      
      setStats(transformedStats);
    } catch (error) {
      console.error('Failed to load overview data:', error);
      // Set empty stats on error
      setStats({
        totalCenters: 0,
        totalSchools: 0,
        totalEducators: 0,
        totalParents: 0,
        totalStudents: 0,
        activeUsers: 0,
        pendingApprovals: 0,
        recentActivity: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon, trend, trendValue, description, color = "blue" }: {
    title: string;
    value: number;
    icon: React.ReactNode;
    trend?: 'up' | 'down';
    trendValue?: string;
    description: string;
    color?: string;
  }) => (
    <Card className="overflow-hidden">
      <CardHeader className={`bg-gradient-to-r from-${color}-50 to-${color}-100 dark:from-${color}-950 dark:to-${color}-900 pb-3`}>
        <div className="flex items-center justify-between">
          <div className={`p-2 rounded-lg bg-${color}-100 dark:bg-${color}-900`}>
            {icon}
          </div>
          {trend && (
            <Badge variant={trend === 'up' ? 'default' : 'secondary'} className="text-xs">
              <TrendingUp className={`h-3 w-3 mr-1 ${trend === 'down' ? 'rotate-180' : ''}`} />
              {trendValue}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-2">
          <div className="text-2xl font-bold">{value.toLocaleString()}</div>
          <div className="text-sm font-medium text-muted-foreground">{title}</div>
          <div className="text-xs text-muted-foreground">{description}</div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="space-y-8 p-6">
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-12 w-12" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-20 mb-2" />
                <Skeleton className="h-4 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <PageWrapper
      title={t('overview.title')}
      description={t('overview.subtitle')}
      breadcrumbs={[{ label: t('overview.breadcrumb') }]}
      actions={
        <>
          <Button variant="outline" onClick={loadOverviewData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            {t('overview.refresh')}
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            {t('overview.exportReport')}
          </Button>
        </>
      }
    >

      {/* Quick Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-primary" />
              {t('overview.quickFilters')}
            </CardTitle>
            <CardDescription>
              {t('overview.filterDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Select value={filters.role} onValueChange={(value) => setFilters({...filters, role: value})}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder={t('overview.allRoles')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('overview.allRoles')}</SelectItem>
                  <SelectItem value="educator">{t('overview.totalEducators')}</SelectItem>
                  <SelectItem value="parent">{t('overview.totalParents')}</SelectItem>
                  <SelectItem value="center">{t('overview.totalCenters')}</SelectItem>
                  <SelectItem value="school">{t('overview.totalSchools')}</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.location} onValueChange={(value) => setFilters({...filters, location: value})}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder={t('overview.allLocations')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('overview.allLocations')}</SelectItem>
                  <SelectItem value="mumbai">Mumbai</SelectItem>
                  <SelectItem value="delhi">Delhi</SelectItem>
                  <SelectItem value="bangalore">Bangalore</SelectItem>
                  <SelectItem value="pune">Pune</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.status} onValueChange={(value) => setFilters({...filters, status: value})}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder={t('overview.allStatus')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('overview.allStatus')}</SelectItem>
                  <SelectItem value="active">{t('overview.active')}</SelectItem>
                  <SelectItem value="inactive">{t('overview.inactive')}</SelectItem>
                  <SelectItem value="pending">{t('overview.pending')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid gap-6 md:grid-cols-2 lg:grid-cols-4"
      >
        <StatCard
          title={t('overview.totalCenters')}
          value={stats?.totalCenters || 0}
          icon={<Building className="h-6 w-6 text-primary" />}
          trend="up"
          trendValue="+12%"
          description={t('overview.totalCentersDesc')}
          color="blue"
        />
        
        <StatCard
          title={t('overview.totalSchools')}
          value={stats?.totalSchools || 0}
          icon={<School className="h-6 w-6 text-success" />}
          trend="up"
          trendValue="+8%"
          description={t('overview.totalSchoolsDesc')}
          color="green"
        />
        
        <StatCard
          title={t('overview.totalEducators')}
          value={stats?.totalEducators || 0}
          icon={<GraduationCap className="h-6 w-6 text-info" />}
          trend="up"
          trendValue="+15%"
          description={t('overview.totalEducatorsDesc')}
          color="purple"
        />
        
        <StatCard
          title={t('overview.totalParents')}
          value={stats?.totalParents || 0}
          icon={<Users className="h-6 w-6 text-warning" />}
          trend="up"
          trendValue="+22%"
          description={t('overview.totalParentsDesc')}
          color="orange"
        />
        
        <StatCard
          title={t('overview.totalStudents')}
          value={stats?.totalStudents || 0}
          icon={<UserCheck className="h-6 w-6 text-primary" />}
          trend="up"
          trendValue="+18%"
          description={t('overview.totalStudentsDesc')}
          color="indigo"
        />
        
        <StatCard
          title={t('overview.activeUsers')}
          value={stats?.activeUsers || 0}
          icon={<Activity className="h-6 w-6 text-emerald-600" />}
          trend="up"
          trendValue="+5%"
          description={t('overview.activeUsersDesc')}
          color="emerald"
        />
        
        <StatCard
          title={t('overview.pendingApprovals')}
          value={stats?.pendingApprovals || 0}
          icon={<Clock className="h-6 w-6 text-warning" />}
          description={t('overview.pendingApprovalsDesc')}
          color="yellow"
        />
        
        <StatCard
          title={t('overview.recentActivity')}
          value={stats?.recentActivity || 0}
          icon={<BarChart3 className="h-6 w-6 text-destructive" />}
          description={t('overview.recentActivityDesc')}
          color="red"
        />
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>{t('overview.quickActions')}</CardTitle>
            <CardDescription>
              {t('overview.quickActionsDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Button variant="outline" className="h-20 flex-col gap-2" asChild>
                <a href="/admin/approvals">
                  <Clock className="h-6 w-6" />
                  <span>{t('overview.reviewApprovals')}</span>
                  <Badge variant="secondary">{stats?.pendingApprovals}</Badge>
                </a>
              </Button>
              

              
              <Button variant="outline" className="h-20 flex-col gap-2" asChild>
                <a href="/admin/reports">
                  <BarChart3 className="h-6 w-6" />
                  <span>{t('overview.viewReports')}</span>
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </PageWrapper>
  );
}
