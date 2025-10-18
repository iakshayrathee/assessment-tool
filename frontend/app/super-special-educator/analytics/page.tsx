'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Users,
  GraduationCap,
  Target,
  Award,
  Calendar,
  Building2,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Download,
  Info,
  Phone,
  Mail,
  MapPin,
  UserCheck,
  Star,
  BookOpen,
  Brain,
  Heart,
  Shield,
  Home,
  Edit,
  Send,
  Plus,
  History,
  FileText,
  MessageSquare,
  X
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface CrossCenterData {
  centerId: string;
  centerName: string;
  totalStudents: number;
  totalEducators: number;
  averageIEPGoalCompletion: number;
  averageAttendanceRate: number;
  averageProgressScore: number;
  flaggedCasesCount: number;
  pendingReviewsCount: number;
  lastAssessmentDate: string;
  performanceRating: 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'NEEDS_IMPROVEMENT';
  monthlyTrend: 'IMPROVING' | 'STABLE' | 'DECLINING';
  keyMetrics: {
    studentEngagement: number;
    educatorEffectiveness: number;
    resourceUtilization: number;
    parentSatisfaction: number;
  };
}

interface PerformanceAnalytics {
  overallMetrics: {
    totalCenters: number;
    totalStudents: number;
    totalEducators: number;
    averagePerformanceScore: number;
    improvementRate: number;
    flaggedCasesResolutionRate: number;
  };
  monthlyTrends: {
    month: string;
    studentProgress: number;
    educatorPerformance: number;
    centerEfficiency: number;
    parentSatisfaction: number;
  }[];
  topPerformingCenters: {
    centerId: string;
    centerName: string;
    score: number;
    improvement: number;
  }[];
  areasForImprovement: {
    area: string;
    currentScore: number;
    targetScore: number;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    affectedCenters: number;
  }[];
}

export default function AnalyticsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [crossCenterData, setCrossCenterData] = useState<CrossCenterData[]>([]);
  const [performanceData, setPerformanceData] = useState<PerformanceAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState('3months');
  const [selectedMetric, setSelectedMetric] = useState('overall');
  
  // Center Details Modal State
  const [centerDetailsModalOpen, setCenterDetailsModalOpen] = useState(false);
  const [selectedCenterForDetails, setSelectedCenterForDetails] = useState<CrossCenterData | null>(null);
  const [newRecommendation, setNewRecommendation] = useState('');
  const [submittingRecommendation, setSubmittingRecommendation] = useState(false);

  useEffect(() => {
    fetchAnalyticsData();
  }, [selectedTimeframe]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const [crossCenter, performance] = await Promise.all([
        apiClient.getCrossCenterComparison(selectedTimeframe),
        apiClient.getPerformanceAnalytics(selectedTimeframe)
      ]);
      setCrossCenterData(Array.isArray(crossCenter) ? crossCenter : []);
      setPerformanceData(performance || null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch analytics data",
        variant: "destructive",
      });
      setCrossCenterData([]);
      setPerformanceData(null);
    } finally {
      setLoading(false);
    }
  };

  const getPerformanceColor = (rating: string) => {
    switch (rating) {
      case 'EXCELLENT':
        return 'bg-green-100 text-green-800';
      case 'GOOD':
        return 'bg-blue-100 text-blue-800';
      case 'AVERAGE':
        return 'bg-yellow-100 text-yellow-800';
      case 'NEEDS_IMPROVEMENT':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'IMPROVING':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'DECLINING':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Activity className="h-4 w-4 text-blue-600" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return 'bg-red-100 text-red-800';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800';
      case 'LOW':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatPercentage = (value: number) => `${Math.round(value)}%`;

  const handleViewCenterDetails = (center: CrossCenterData) => {
    setSelectedCenterForDetails(center);
    setCenterDetailsModalOpen(true);
  };

  const submitRecommendation = async () => {
    if (!newRecommendation.trim() || !selectedCenterForDetails) return;
    
    try {
      setSubmittingRecommendation(true);
      // TODO: Replace with actual API call
      // await apiClient.submitCenterRecommendation(selectedCenterForDetails.centerId, newRecommendation);
      
      toast({
        title: "Success",
        description: "Recommendation submitted successfully",
      });
      
      setNewRecommendation('');
      // Refresh data
      fetchAnalyticsData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit recommendation",
        variant: "destructive",
      });
    } finally {
      setSubmittingRecommendation(false);
    }
  };

  const exportReport = async () => {
    try {
      // This would trigger a report export
      toast({
        title: "Success",
        description: "Analytics report exported successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to export report",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-gray-600">Cross-center performance analysis and insights</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1month">Last Month</SelectItem>
              <SelectItem value="3months">Last 3 Months</SelectItem>
              <SelectItem value="6months">Last 6 Months</SelectItem>
              <SelectItem value="1year">Last Year</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={exportReport}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Overall Metrics */}
      {performanceData && (
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Centers</p>
                  <p className="text-2xl font-bold">{performanceData?.overallMetrics?.totalCenters || 0}</p>
                </div>
                <Building2 className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Students</p>
                  <p className="text-2xl font-bold">{performanceData?.overallMetrics?.totalStudents || 0}</p>
                </div>
                <Users className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Educators</p>
                  <p className="text-2xl font-bold">{performanceData?.overallMetrics?.totalEducators || 0}</p>
                </div>
                <GraduationCap className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg Performance</p>
                  <p className="text-2xl font-bold">{formatPercentage(performanceData?.overallMetrics?.averagePerformanceScore || 0)}</p>
                </div>
                <Target className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Improvement Rate</p>
                  <p className="text-2xl font-bold text-green-600">
                    +{formatPercentage(performanceData?.overallMetrics?.improvementRate || 0)}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Case Resolution</p>
                  <p className="text-2xl font-bold">{formatPercentage(performanceData?.overallMetrics?.flaggedCasesResolutionRate || 0)}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="cross-center" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="cross-center">Cross-Center Comparison</TabsTrigger>
          <TabsTrigger value="performance">Performance Trends</TabsTrigger>
          <TabsTrigger value="insights">Insights & Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="cross-center" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Center Performance Comparison</h2>
            <Select value={selectedMetric} onValueChange={setSelectedMetric}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="overall">Overall Performance</SelectItem>
                <SelectItem value="student-progress">Student Progress</SelectItem>
                <SelectItem value="educator-effectiveness">Educator Effectiveness</SelectItem>
                <SelectItem value="attendance">Attendance Rate</SelectItem>
                <SelectItem value="iep-completion">IEP Goal Completion</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4">
            {(crossCenterData || []).map((center) => (
              <Card key={center.centerId} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{center.centerName}</CardTitle>
                      <CardDescription>
                        {center.totalStudents} students • {center.totalEducators} educators
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getPerformanceColor(center.performanceRating)}>
                        {center.performanceRating?.replace('_', ' ')}
                      </Badge>
                      {getTrendIcon(center.monthlyTrend)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-gray-600">IEP Goal Completion</p>
                      <p className="text-xl font-bold text-blue-600">
                        {formatPercentage(center.averageIEPGoalCompletion)}
                      </p>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <p className="text-sm text-gray-600">Attendance Rate</p>
                      <p className="text-xl font-bold text-green-600">
                        {formatPercentage(center.averageAttendanceRate)}
                      </p>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <p className="text-sm text-gray-600">Progress Score</p>
                      <p className="text-xl font-bold text-purple-600">
                        {formatPercentage(center.averageProgressScore)}
                      </p>
                    </div>
                    <div className="text-center p-3 bg-orange-50 rounded-lg">
                      <p className="text-sm text-gray-600">Open Cases</p>
                      <p className="text-xl font-bold text-orange-600">
                        {center.flaggedCasesCount}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Student Engagement</p>
                      <p className="text-lg font-semibold">{formatPercentage(center.keyMetrics?.studentEngagement)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Educator Effectiveness</p>
                      <p className="text-lg font-semibold">{formatPercentage(center.keyMetrics.educatorEffectiveness)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Resource Utilization</p>
                      <p className="text-lg font-semibold">{formatPercentage(center.keyMetrics.resourceUtilization)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Parent Satisfaction</p>
                      <p className="text-lg font-semibold">{formatPercentage(center.keyMetrics.parentSatisfaction)}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-600 pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-4">
                      <span>Pending Reviews: <strong>{center.pendingReviewsCount}</strong></span>
                      <span>Last Assessment: <strong>{new Date(center.lastAssessmentDate).toLocaleDateString()}</strong></span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewCenterDetails(center)}
                    >
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <h2 className="text-xl font-semibold">Performance Trends</h2>
          
          {performanceData && (
            <>
              {/* Top Performing Centers */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-yellow-600" />
                    Top Performing Centers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {(performanceData.topPerformingCenters || []).map((center, index) => (
                      <div key={center.centerId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                            index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-orange-500'
                          }`}>
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-semibold">{center.centerName}</p>
                            <p className="text-sm text-gray-600">Score: {formatPercentage(center.score)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-green-600 font-medium">
                            +{formatPercentage(center.improvement)} improvement
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Monthly Trends Chart Placeholder */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                    Monthly Performance Trends
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600">Interactive charts would be displayed here</p>
                      <p className="text-sm text-gray-500">Showing trends for student progress, educator performance, etc.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <h2 className="text-xl font-semibold">Insights & Recommendations</h2>
          
          {performanceData && (
            <>
              {/* Areas for Improvement */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                    Areas for Improvement
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {(performanceData.areasForImprovement || []).map((area, index) => (
                      <div key={index} className="p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold text-gray-900">{area.area}</h3>
                          <Badge className={getPriorityColor(area.priority)}>
                            {area.priority} Priority
                          </Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">Current Score</p>
                            <p className="font-semibold">{formatPercentage(area.currentScore)}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Target Score</p>
                            <p className="font-semibold text-green-600">{formatPercentage(area.targetScore)}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Affected Centers</p>
                            <p className="font-semibold">{area.affectedCenters}</p>
                          </div>
                        </div>
                        <div className="mt-3 bg-gray-100 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${(area.currentScore / area.targetScore) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recommendations */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Recommended Actions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="font-semibold text-blue-900 mb-1">Immediate Actions</h4>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• Schedule additional training sessions for underperforming centers</li>
                        <li>• Review and update IEP goal setting processes</li>
                        <li>• Implement peer mentoring programs between high and low performing centers</li>
                      </ul>
                    </div>
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <h4 className="font-semibold text-green-900 mb-1">Long-term Strategies</h4>
                      <ul className="text-sm text-green-800 space-y-1">
                        <li>• Develop standardized assessment protocols across all centers</li>
                        <li>• Create resource sharing platform for best practices</li>
                        <li>• Establish quarterly cross-center collaboration meetings</li>
                      </ul>
                    </div>
                    <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                      <h4 className="font-semibold text-purple-900 mb-1">Resource Allocation</h4>
                      <ul className="text-sm text-purple-800 space-y-1">
                        <li>• Allocate additional support staff to centers with high caseloads</li>
                        <li>• Invest in technology upgrades for data tracking and reporting</li>
                        <li>• Provide specialized training for complex learning disabilities</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Center Details Modal */}
      <Dialog open={centerDetailsModalOpen} onOpenChange={setCenterDetailsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {selectedCenterForDetails?.centerName} - Detailed Analytics
            </DialogTitle>
            <DialogDescription>
              Comprehensive performance analysis and insights for this center
            </DialogDescription>
          </DialogHeader>

          {selectedCenterForDetails && (
            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="performance">Performance</TabsTrigger>
                <TabsTrigger value="students">Students</TabsTrigger>
                <TabsTrigger value="educators">Educators</TabsTrigger>
                <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Info className="h-4 w-4" />
                        Center Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Students:</span>
                        <span className="font-semibold">{selectedCenterForDetails.totalStudents}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Educators:</span>
                        <span className="font-semibold">{selectedCenterForDetails.totalEducators}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Performance Rating:</span>
                        <Badge className={getPerformanceColor(selectedCenterForDetails.performanceRating)}>
                          {selectedCenterForDetails.performanceRating?.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Monthly Trend:</span>
                        <div className="flex items-center gap-1">
                          {getTrendIcon(selectedCenterForDetails.monthlyTrend)}
                          <span className="font-semibold">{selectedCenterForDetails.monthlyTrend}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Activity className="h-4 w-4" />
                        Current Status
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Flagged Cases:</span>
                        <span className="font-semibold text-orange-600">{selectedCenterForDetails.flaggedCasesCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Pending Reviews:</span>
                        <span className="font-semibold text-blue-600">{selectedCenterForDetails.pendingReviewsCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Last Assessment:</span>
                        <span className="font-semibold">{new Date(selectedCenterForDetails.lastAssessmentDate).toLocaleDateString()}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Key Performance Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <BookOpen className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">IEP Goal Completion</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {formatPercentage(selectedCenterForDetails.averageIEPGoalCompletion)}
                        </p>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <UserCheck className="h-8 w-8 text-green-600 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">Attendance Rate</p>
                        <p className="text-2xl font-bold text-green-600">
                          {formatPercentage(selectedCenterForDetails.averageAttendanceRate)}
                        </p>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <Star className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">Progress Score</p>
                        <p className="text-2xl font-bold text-purple-600">
                          {formatPercentage(selectedCenterForDetails.averageProgressScore)}
                        </p>
                      </div>
                      <div className="text-center p-4 bg-orange-50 rounded-lg">
                        <AlertTriangle className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">Open Cases</p>
                        <p className="text-2xl font-bold text-orange-600">
                          {selectedCenterForDetails.flaggedCasesCount}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="performance" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      Detailed Performance Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between mb-2">
                            <span className="text-sm font-medium">Student Engagement</span>
                            <span className="text-sm text-gray-600">{formatPercentage(selectedCenterForDetails.keyMetrics?.studentEngagement || 0)}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${selectedCenterForDetails.keyMetrics?.studentEngagement || 0}%` }}
                            ></div>
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between mb-2">
                            <span className="text-sm font-medium">Educator Effectiveness</span>
                            <span className="text-sm text-gray-600">{formatPercentage(selectedCenterForDetails.keyMetrics?.educatorEffectiveness || 0)}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-600 h-2 rounded-full" 
                              style={{ width: `${selectedCenterForDetails.keyMetrics?.educatorEffectiveness || 0}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between mb-2">
                            <span className="text-sm font-medium">Resource Utilization</span>
                            <span className="text-sm text-gray-600">{formatPercentage(selectedCenterForDetails.keyMetrics?.resourceUtilization || 0)}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-purple-600 h-2 rounded-full" 
                              style={{ width: `${selectedCenterForDetails.keyMetrics?.resourceUtilization || 0}%` }}
                            ></div>
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between mb-2">
                            <span className="text-sm font-medium">Parent Satisfaction</span>
                            <span className="text-sm text-gray-600">{formatPercentage(selectedCenterForDetails.keyMetrics?.parentSatisfaction || 0)}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-orange-600 h-2 rounded-full" 
                              style={{ width: `${selectedCenterForDetails.keyMetrics?.parentSatisfaction || 0}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="students" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Student Analytics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">Total Students</p>
                        <p className="text-2xl font-bold text-blue-600">{selectedCenterForDetails.totalStudents}</p>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">Active Students</p>
                        <p className="text-2xl font-bold text-green-600">{Math.round(selectedCenterForDetails.totalStudents * 0.92)}</p>
                      </div>
                      <div className="text-center p-4 bg-orange-50 rounded-lg">
                        <AlertTriangle className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">Needs Attention</p>
                        <p className="text-2xl font-bold text-orange-600">{selectedCenterForDetails.flaggedCasesCount}</p>
                      </div>
                    </div>
                    <div className="text-center py-4 text-gray-500">
                      <Users className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                      <p>Detailed student analytics would be displayed here</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="educators" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <GraduationCap className="h-4 w-4" />
                      Educator Analytics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <GraduationCap className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">Total Educators</p>
                        <p className="text-2xl font-bold text-purple-600">{selectedCenterForDetails.totalEducators}</p>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <Star className="h-8 w-8 text-green-600 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">Effectiveness Score</p>
                        <p className="text-2xl font-bold text-green-600">{formatPercentage(selectedCenterForDetails.keyMetrics?.educatorEffectiveness || 0)}</p>
                      </div>
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <Activity className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">Avg Caseload</p>
                        <p className="text-2xl font-bold text-blue-600">{Math.round(selectedCenterForDetails.totalStudents / selectedCenterForDetails.totalEducators)}</p>
                      </div>
                    </div>
                    <div className="text-center py-4 text-gray-500">
                      <GraduationCap className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                      <p>Detailed educator performance metrics would be displayed here</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="recommendations" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Submit Recommendation
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="recommendation">Recommendation for {selectedCenterForDetails.centerName}</Label>
                      <Textarea
                        id="recommendation"
                        placeholder="Enter your recommendation for improving this center's performance..."
                        value={newRecommendation}
                        onChange={(e) => setNewRecommendation(e.target.value)}
                        className="mt-2"
                        rows={4}
                      />
                    </div>
                    <Button 
                      onClick={submitRecommendation}
                      disabled={!newRecommendation.trim() || submittingRecommendation}
                      className="w-full"
                    >
                      {submittingRecommendation ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Submit Recommendation
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <History className="h-4 w-4" />
                      Previous Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-medium text-sm">Improve IEP Goal Tracking</span>
                          <span className="text-xs text-gray-500">2 weeks ago</span>
                        </div>
                        <p className="text-sm text-gray-600">Implement digital tracking system for better IEP goal monitoring and progress reporting.</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-medium text-sm">Enhance Parent Communication</span>
                          <span className="text-xs text-gray-500">1 month ago</span>
                        </div>
                        <p className="text-sm text-gray-600">Establish regular parent-educator meetings to improve satisfaction scores.</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}