'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import {
    User,
    Search,
    BookOpen,
    FileText,
    Target,
    TrendingUp,
    AlertCircle,
    CheckCircle,
    School,
    Phone,
    Users,
    ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { toast } from '@/lib/toast';
import { PageWrapper } from '@/components/layout/PageWrapper';

interface Child {
    id: string;
    fullName: string;
    age: number;
    grade: string;
    status: string;
    center?: string;
    school?: string;
    assignedEducator?: string;
    educatorPhone?: string;
    progressSummary: {
        totalGoals: number;
        inProgress: number;
        achieved: number;
        averageProgress: number;
    };
    recentReports: Array<{
        id: string;
        type: string;
        title: string;
        createdAt: string;
    }>;
    activeGoals: Array<{
        id: string;
        domain: string;
        goalStatement: string;
        progressPercent: number;
        targetDate: string;
    }>;
}

export default function ParentChildrenPage() {
    const { user } = useAuth();
    const [children, setChildren] = useState<Child[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalChildren, setTotalChildren] = useState(0);

    useEffect(() => {
        loadChildren();
    }, [searchQuery, page]);

    const loadChildren = async () => {
        try {
            setLoading(true);
            // Use dashboard endpoint since there's no dedicated children list endpoint
            const dashboardData = await apiClient.getParentDashboard();

            let filteredChildren = dashboardData.children || [];

            // Apply search filter on frontend
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                filteredChildren = filteredChildren.filter((child: Child) =>
                    child.fullName.toLowerCase().includes(query)
                );
            }

            // Calculate pagination on frontend
            const total = filteredChildren.length;
            const startIndex = (page - 1) * 10;
            const endIndex = startIndex + 10;
            const paginatedChildren = filteredChildren.slice(startIndex, endIndex);

            setChildren(paginatedChildren);
            setTotalPages(Math.ceil(total / 10) || 1);
            setTotalChildren(total);
        } catch (error) {
            console.error('Failed to load children:', error);
            toast.error('Failed to load children data');
            setChildren([]);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ACTIVE': return 'bg-success/10 text-foreground';
            case 'INACTIVE': return 'bg-muted text-foreground';
            default: return 'bg-muted text-foreground';
        }
    };

    const getReportTypeColor = (type: string) => {
        switch (type) {
            case 'ASSESSMENT': return 'bg-primary/10 text-primary';
            case 'IEP': return 'bg-info/10 text-foreground';
            case 'PROGRESS': return 'bg-success/10 text-foreground';
            default: return 'bg-muted text-foreground';
        }
    };

    const handleSearch = (value: string) => {
        setSearchQuery(value);
        setPage(1); // Reset to first page on search
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-primary border-t-transparent mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading children...</p>
                </div>
            </div>
        );
    }

    return (
        <PageWrapper
            title="My Children"
            description={`${totalChildren} ${totalChildren === 1 ? 'child' : 'children'} enrolled in the program`}
            breadcrumbs={[{ label: 'Dashboard', href: '/parent/dashboard' }, { label: 'My Children' }]}
            actions={
                <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="text"
                        placeholder="Search by name..."
                        value={searchQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="pl-10"
                    />
                </div>
            }
        >
                {children.length === 0 ? (
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-center py-12">
                                <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-foreground mb-2">No children found</h3>
                                <p className="text-muted-foreground">
                                    {searchQuery
                                        ? 'Try adjusting your search query'
                                        : 'No children are currently enrolled in the program'}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        {/* Children Cards */}
                        <div className="space-y-6">
                            {children.map((child) => (
                                <Card key={child.id} className="hover:shadow-lg transition-shadow">
                                    <CardHeader>
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-start space-x-4">
                                                <div className="bg-primary/10 p-3 rounded-full">
                                                    <User className="h-6 w-6 text-primary" />
                                                </div>
                                                <div>
                                                    <CardTitle className="text-xl">{child.fullName}</CardTitle>
                                                    <CardDescription className="flex items-center gap-2 mt-1">
                                                        <span>{child.age} years</span>
                                                        <span>•</span>
                                                        <span>{child.grade}</span>
                                                        {child.school && (
                                                            <>
                                                                <span>•</span>
                                                                <span className="flex items-center">
                                                                    <School className="h-3 w-3 mr-1" />
                                                                    {child.school}
                                                                </span>
                                                            </>
                                                        )}
                                                    </CardDescription>
                                                </div>
                                            </div>
                                            <Badge className={getStatusColor(child.status)}>
                                                {child.status}
                                            </Badge>
                                        </div>
                                    </CardHeader>

                                    <CardContent className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* Educator Info */}
                                            {child.assignedEducator && (
                                                <div className="bg-primary/10 p-4 rounded-lg">
                                                    <div className="flex items-center mb-2">
                                                        <Users className="h-4 w-4 text-primary mr-2" />
                                                        <h4 className="font-semibold text-blue-900">Assigned Educator</h4>
                                                    </div>
                                                    <p className="text-primary font-medium">{child.assignedEducator}</p>
                                                    {child.educatorPhone && (
                                                        <p className="text-sm text-primary flex items-center mt-1">
                                                            <Phone className="h-3 w-3 mr-1" />
                                                            {child.educatorPhone}
                                                        </p>
                                                    )}
                                                    {child.center && (
                                                        <p className="text-sm text-primary mt-1">{child.center}</p>
                                                    )}
                                                </div>
                                            )}

                                            {/* Progress Summary */}
                                            <div className="bg-gradient-to-br from-purple-50 to-blue-50 p-4 rounded-lg">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center">
                                                        <TrendingUp className="h-4 w-4 text-info mr-2" />
                                                        <h4 className="font-semibold text-purple-900">Overall Progress</h4>
                                                    </div>
                                                    <span className="text-lg font-bold text-purple-900">
                                                        {child.progressSummary.averageProgress}%
                                                    </span>
                                                </div>
                                                <Progress value={child.progressSummary.averageProgress} className="mb-3" />
                                                <div className="grid grid-cols-3 gap-2 text-sm">
                                                    <div className="text-center">
                                                        <div className="flex items-center justify-center mb-1">
                                                            <Target className="h-3 w-3 text-primary mr-1" />
                                                        </div>
                                                        <p className="font-bold text-foreground">{child.progressSummary.totalGoals}</p>
                                                        <p className="text-xs text-muted-foreground">Total Goals</p>
                                                    </div>
                                                    <div className="text-center">
                                                        <div className="flex items-center justify-center mb-1">
                                                            <AlertCircle className="h-3 w-3 text-warning mr-1" />
                                                        </div>
                                                        <p className="font-bold text-foreground">{child.progressSummary.inProgress}</p>
                                                        <p className="text-xs text-muted-foreground">In Progress</p>
                                                    </div>
                                                    <div className="text-center">
                                                        <div className="flex items-center justify-center mb-1">
                                                            <CheckCircle className="h-3 w-3 text-success mr-1" />
                                                        </div>
                                                        <p className="font-bold text-foreground">{child.progressSummary.achieved}</p>
                                                        <p className="text-xs text-muted-foreground">Achieved</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Active Goals */}
                                        {child.activeGoals && child.activeGoals.length > 0 && (
                                            <div>
                                                <h4 className="font-semibold mb-3 flex items-center">
                                                    <Target className="h-4 w-4 mr-2 text-primary" />
                                                    Active Goals ({child.activeGoals.length})
                                                </h4>
                                                <div className="space-y-3">
                                                    {child.activeGoals.slice(0, 3).map((goal) => (
                                                        <div key={goal.id} className="border rounded-lg p-3 bg-background">
                                                            <div className="flex justify-between items-start mb-2">
                                                                <div className="flex-1">
                                                                    <Badge variant="outline" className="mb-1 text-xs">
                                                                        {goal.domain}
                                                                    </Badge>
                                                                    <p className="text-sm font-medium text-foreground">{goal.goalStatement}</p>
                                                                </div>
                                                                <span className="text-sm font-semibold text-primary ml-2">
                                                                    {goal.progressPercent}%
                                                                </span>
                                                            </div>
                                                            <Progress value={goal.progressPercent} className="mb-1 h-2" />
                                                            <p className="text-xs text-muted-foreground">
                                                                Target: {new Date(goal.targetDate).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                    ))}
                                                    {child.activeGoals.length > 3 && (
                                                        <p className="text-sm text-muted-foreground text-center">
                                                            +{child.activeGoals.length - 3} more goals
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Recent Reports */}
                                        {child.recentReports && child.recentReports.length > 0 && (
                                            <div>
                                                <h4 className="font-semibold mb-3 flex items-center">
                                                    <FileText className="h-4 w-4 mr-2 text-info" />
                                                    Recent Reports
                                                </h4>
                                                <div className="space-y-2">
                                                    {child.recentReports.slice(0, 3).map((report) => (
                                                        <div key={report.id} className="flex items-center justify-between p-3 border rounded-lg bg-background hover:bg-muted/40 transition-colors">
                                                            <div className="flex items-center space-x-3 flex-1">
                                                                <FileText className="h-4 w-4 text-muted-foreground" />
                                                                <div className="flex-1">
                                                                    <p className="font-medium text-sm">{report.title}</p>
                                                                    <p className="text-xs text-muted-foreground">
                                                                        {new Date(report.createdAt).toLocaleDateString()}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <Badge className={getReportTypeColor(report.type)} variant="secondary">
                                                                {report.type}
                                                            </Badge>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Action Buttons */}
                                        <div className="flex flex-wrap gap-3 pt-4 border-t">
                                            <Link href={`/parent/children/${child.id}`} className="flex-1 sm:flex-none">
                                                <Button className="w-full">
                                                    <BookOpen className="h-4 w-4 mr-2" />
                                                    View Full Details
                                                    <ArrowRight className="h-4 w-4 ml-2" />
                                                </Button>
                                            </Link>
                                            {child.recentReports && child.recentReports.length > 0 && (
                                                <Link href={`/parent/children/${child.id}#reports`} className="flex-1 sm:flex-none">
                                                    <Button variant="outline" className="w-full">
                                                        <FileText className="h-4 w-4 mr-2" />
                                                        All Reports
                                                    </Button>
                                                </Link>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex justify-center items-center gap-2 mt-8">
                                <Button
                                    variant="outline"
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1 || loading}
                                >
                                    Previous
                                </Button>
                                <span className="text-sm text-muted-foreground">
                                    Page {page} of {totalPages}
                                </span>
                                <Button
                                    variant="outline"
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages || loading}
                                >
                                    Next
                                </Button>
                            </div>
                        )}
                    </>
                )}
        </PageWrapper>
    );
}
