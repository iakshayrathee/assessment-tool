'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useEducatorStudents } from '@/hooks/useEducator';
import { Student } from '@/types';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from '@/components/ui/form';
import { ProfessionalDatePicker } from '@/components/ui/professional-date-picker';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Plus,
    Trash2,
    ChevronDown,
    ChevronRight,
    Calendar,
    Target,
    TrendingUp,
    Loader2,
    Eye,
    Pencil,
    BookOpen,
    Clock,
    CheckCircle2,
    Users,
} from 'lucide-react';
import { format, addMonths, addWeeks } from 'date-fns';
import { apiClient } from '@/lib/api';
import { toast } from 'react-hot-toast';

// Component imports
import { HierarchyView } from '@/components/lesson-plans/HierarchyView';
import { LTPListView, STPListView, WLPListView } from '@/components/lesson-plans/ListView';
import { LTPDialog } from '@/components/lesson-plans/LTPDialog';
import { STPDialog } from '@/components/lesson-plans/STPDialog';
import { WLPDialog } from '@/components/lesson-plans/WLPDialog';
import { StudentSelectionModal } from '@/components/assessments/StudentSelectionModal';

// Constants
const DOMAINS = [
    'READING',
    'WRITING',
    'MATH',
    'COGNITIVE',
    'MOTOR',
    'BEHAVIOURAL',
    'READING_COMPREHENSION',
    'ORAL_LANGUAGE',
    'SPELLING',
] as const;

const REVIEW_CYCLES = ['MONTHLY', 'QUARTERLY', 'BIANNUAL'] as const;

const PLAN_STATUSES = ['DRAFT', 'ACTIVE', 'COMPLETED', 'ARCHIVED', 'ON_HOLD'] as const;

const LESSON_STATUSES = ['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] as const;

const INTERVENTION_STRATEGIES = [
    'Multi-sensory',
    'Tracing',
    'Flashcards',
    'Phonics',
    'Repetition',
    'Visual Aids',
    'Hands-on Activities',
    'Technology-based',
    'Peer Learning',
    'One-on-One',
] as const;

// Types
interface LongTermGoal {
    goalStatement: string;
    domain: string;
    targetAccuracy: number;
    order: number;
}

interface LongTermPlan {
    id: string;
    studentId: string;
    diagnosis?: string;
    suspectedLD?: string;
    learningStrengths: string[];
    challengeAreas: string[];
    startDate: string;
    endDate: string;
    durationMonths: number;
    domains: string[];
    reviewCycle: string;
    status: string;
    goals: LongTermGoal[];
    shortTermPlans?: ShortTermPlan[];
}

interface ShortTermSubGoal {
    goalStatement: string;
    order: number;
    isAchieved: boolean;
    achievedDate?: string;
}

interface ShortTermPlan {
    id: string;
    longTermPlanId: string;
    linkedGoalStatement: string;
    startDate: string;
    endDate: string;
    durationWeeks: number;
    stpGoal: string;
    interventionStrategy: string[];
    targetAccuracy: number;
    progressPercentage: number;
    status: string;
    subGoals: ShortTermSubGoal[];
    weeklyLessonPlans?: WeeklyLessonPlan[];
}

interface WeeklyLessonPlan {
    id: string;
    shortTermPlanId?: string;
    weekNumber: number;
    sessionDate: string;
    topics: string;
    areasOfRemediation: string[];
    averageTime?: number;
    actualTime?: number;
    motivationStrategy?: string;
    resourcesUsed: string[];
    outcome?: string;
    status: string;
}

// Zod Schemas
const ltpGoalSchema = z.object({
    goalStatement: z.string().min(10, 'Goal must be at least 10 characters'),
    domain: z.string(),
    targetAccuracy: z.number().min(0).max(100),
    order: z.number(),
});

const ltpFormSchema = z.object({
    studentId: z.string().min(1, 'Student is required'),
    diagnosis: z.string().optional(),
    suspectedLD: z.string().optional(),
    learningStrengths: z.array(z.string()),
    challengeAreas: z.array(z.string()),
    startDate: z.date(),
    endDate: z.date(),
    durationMonths: z.number().min(6).max(12),
    domains: z.array(z.string()).min(1, 'At least one domain required'),
    reviewCycle: z.string(),
    goals: z.array(ltpGoalSchema).min(1, 'At least 1 goal required').max(5, 'Maximum 5 goals allowed'),
});

const stpSubGoalSchema = z.object({
    goalStatement: z.string().min(5),
    order: z.number(),
    isAchieved: z.boolean(),
    achievedDate: z.date().optional(),
});

const stpFormSchema = z.object({
    longTermPlanId: z.string().min(1),
    linkedGoalStatement: z.string().min(1),
    startDate: z.date(),
    endDate: z.date(),
    durationWeeks: z.number().min(4).max(8),
    stpGoal: z.string().min(10),
    interventionStrategy: z.array(z.string()).min(1),
    targetAccuracy: z.number().min(0).max(100),
    subGoals: z.array(stpSubGoalSchema).min(1),
});

const wlpFormSchema = z.object({
    shortTermPlanId: z.string().optional(),
    weekNumber: z.number().min(1),
    sessionDate: z.date(),
    topics: z.string().min(5),
    areasOfRemediation: z.array(z.string()).min(1),
    averageTime: z.number().optional(),
    motivationStrategy: z.string().optional(),
    resourcesUsed: z.array(z.string()).min(1),
    outcome: z.string().optional(),
});

export default function LessonPlansPage() {
    const { students, loading: studentsLoading } = useEducatorStudents();
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [showStudentModal, setShowStudentModal] = useState(false);
    const [activeTab, setActiveTab] = useState<'hierarchy' | 'ltp' | 'stp' | 'wlp'>('hierarchy');

    // Data state
    const [ltps, setLtps] = useState<LongTermPlan[]>([]);
    const [stps, setStps] = useState<ShortTermPlan[]>([]);
    const [wlps, setWlps] = useState<WeeklyLessonPlan[]>([]);
    const [loading, setLoading] = useState(false);

    // Dialog state
    const [ltpDialogOpen, setLtpDialogOpen] = useState(false);
    const [stpDialogOpen, setStpDialogOpen] = useState(false);
    const [wlpDialogOpen, setWlpDialogOpen] = useState(false);
    const [editingLTP, setEditingLTP] = useState<LongTermPlan | null>(null);
    const [editingSTP, setEditingSTP] = useState<ShortTermPlan | null>(null);
    const [editingWLP, setEditingWLP] = useState<WeeklyLessonPlan | null>(null);

    // Hierarchy expansion state
    const [expandedLTPs, setExpandedLTPs] = useState<Set<string>>(new Set());
    const [expandedSTPs, setExpandedSTPs] = useState<Set<string>>(new Set());

    // Memoize fetchAllData to prevent unnecessary re-renders
    const fetchAllData = useCallback(async () => {
        if (!selectedStudent) return;

        setLoading(true);
        try {
            const [ltpData, stpData, wlpData] = await Promise.all([
                apiClient.getLongTermPlansByStudent(selectedStudent.id),
                apiClient.getShortTermPlansByStudent(selectedStudent.id),
                apiClient.getWeeklyLessonPlansByStudent(selectedStudent.id),
            ]);

            setLtps(ltpData.plans || []);
            setStps(stpData.plans || []);
            setWlps(wlpData.plans || []);
        } catch (error: any) {
            toast.error('Failed to fetch lesson plans: ' + error.message);
        } finally {
            setLoading(false);
        }
    }, [selectedStudent]);

    // Fetch data when student changes
    useEffect(() => {
        if (selectedStudent) {
            fetchAllData();
        }
    }, [selectedStudent, fetchAllData]);

    const toggleLTPExpansion = (ltpId: string) => {
        const newExpanded = new Set(expandedLTPs);
        if (newExpanded.has(ltpId)) {
            newExpanded.delete(ltpId);
        } else {
            newExpanded.add(ltpId);
        }
        setExpandedLTPs(newExpanded);
    };

    const toggleSTPExpansion = (stpId: string) => {
        const newExpanded = new Set(expandedSTPs);
        if (newExpanded.has(stpId)) {
            newExpanded.delete(stpId);
        } else {
            newExpanded.add(stpId);
        }
        setExpandedSTPs(newExpanded);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ACTIVE':
            case 'IN_PROGRESS':
                return 'bg-blue-100 text-blue-800';
            case 'COMPLETED':
                return 'bg-green-100 text-green-800';
            case 'DRAFT':
                return 'bg-gray-100 text-gray-800';
            case 'ON_HOLD':
                return 'bg-yellow-100 text-yellow-800';
            case 'PLANNED':
                return 'bg-purple-100 text-purple-800';
            case 'CANCELLED':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Lesson Plans</h1>
                        <p className="text-gray-600">Manage three-tier lesson plans (Long Term Plan → Short Term Plan → Weekly Lesson Plan)</p>
                    </div>

                    <div className="flex items-center gap-4">
                        {selectedStudent ? (
                            <Button
                                variant="outline"
                                onClick={() => setShowStudentModal(true)}
                                className="flex items-center gap-4 bg-blue-50 px-4 py-3 rounded-lg border border-blue-200 min-w-[250px] hover:bg-blue-100"
                            >
                                <div className="flex-1 min-w-0 text-left">
                                    <p className="font-medium text-blue-900 text-sm truncate">
                                        {selectedStudent.fullName}
                                    </p>
                                    <p className="text-xs text-blue-700">
                                        Grade {selectedStudent.grade || 'N/A'}
                                    </p>
                                </div>
                                <Users className="h-4 w-4 flex-shrink-0" />
                            </Button>
                        ) : (
                            <Button
                                variant="outline"
                                onClick={() => setShowStudentModal(true)}
                                className="flex items-center gap-2 px-4 py-2 min-w-[140px]"
                            >
                                <Users className="h-4 w-4" />
                                Select Student
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {selectedStudent && (
                <>
                    {/* Action Buttons */}
                    <div className="flex gap-3">
                        <Button onClick={() => { setEditingLTP(null); setLtpDialogOpen(true); }}>
                            <Plus className="h-4 w-4 mr-2" />
                            New Long-Term Plan
                        </Button>
                        <Button onClick={() => { setEditingSTP(null); setStpDialogOpen(true); }} variant="outline">
                            <Plus className="h-4 w-4 mr-2" />
                            New Short-Term Plan
                        </Button>
                        <Button onClick={() => { setEditingWLP(null); setWlpDialogOpen(true); }} variant="outline">
                            <Plus className="h-4 w-4 mr-2" />
                            New Weekly Plan
                        </Button>
                    </div>

                    {/* Main Content Tabs */}
                    <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)}>
                        <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="hierarchy">Hierarchy View</TabsTrigger>
                            <TabsTrigger value="ltp">Long-Term Plans</TabsTrigger>
                            <TabsTrigger value="stp">Short-Term Plans</TabsTrigger>
                            <TabsTrigger value="wlp">Weekly Plans</TabsTrigger>
                        </TabsList>

                        {/* Hierarchy View */}
                        <TabsContent value="hierarchy" className="space-y-4">
                            {loading ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="h-8 w-8 animate-spin" />
                                </div>
                            ) : ltps.length === 0 ? (
                                <Card>
                                    <CardContent className="py-12 text-center text-gray-500">
                                        No lesson plans yet. Create a Long-Term Plan to get started.
                                    </CardContent>
                                </Card>
                            ) : (
                                <HierarchyView
                                    ltps={ltps}
                                    stps={stps}
                                    wlps={wlps}
                                    expandedLTPs={expandedLTPs}
                                    expandedSTPs={expandedSTPs}
                                    toggleLTPExpansion={toggleLTPExpansion}
                                    toggleSTPExpansion={toggleSTPExpansion}
                                    getStatusColor={getStatusColor}
                                    onEditLTP={(ltp) => { setEditingLTP(ltp); setLtpDialogOpen(true); }}
                                    onEditSTP={(stp) => { setEditingSTP(stp); setStpDialogOpen(true); }}
                                    onEditWLP={(wlp) => { setEditingWLP(wlp); setWlpDialogOpen(true); }}
                                />
                            )}
                        </TabsContent>

                        {/* LTP List */}
                        <TabsContent value="ltp">
                            <LTPListView
                                ltps={ltps}
                                loading={loading}
                                getStatusColor={getStatusColor}
                                onEdit={(ltp) => { setEditingLTP(ltp); setLtpDialogOpen(true); }}
                            />
                        </TabsContent>

                        {/* STP List */}
                        <TabsContent value="stp">
                            <STPListView
                                stps={stps}
                                loading={loading}
                                getStatusColor={getStatusColor}
                                onEdit={(stp) => { setEditingSTP(stp); setStpDialogOpen(true); }}
                            />
                        </TabsContent>

                        {/* WLP List */}
                        <TabsContent value="wlp">
                            <WLPListView
                                wlps={wlps}
                                loading={loading}
                                getStatusColor={getStatusColor}
                                onEdit={(wlp) => { setEditingWLP(wlp); setWlpDialogOpen(true); }}
                            />
                        </TabsContent>
                    </Tabs>

                    {/* Dialogs */}
                    <LTPDialog
                        open={ltpDialogOpen}
                        onOpenChange={setLtpDialogOpen}
                        studentId={selectedStudent.id}
                        editing={editingLTP}
                        onSuccess={fetchAllData}
                    />

                    <STPDialog
                        open={stpDialogOpen}
                        onOpenChange={setStpDialogOpen}
                        studentId={selectedStudent.id}
                        ltps={ltps}
                        editing={editingSTP}
                        onSuccess={fetchAllData}
                    />

                    <WLPDialog
                        open={wlpDialogOpen}
                        onOpenChange={setWlpDialogOpen}
                        studentId={selectedStudent.id}
                        stps={stps}
                        editing={editingWLP}
                        onSuccess={fetchAllData}
                    />
                </>
            )}

            <StudentSelectionModal
                isOpen={showStudentModal}
                onClose={() => setShowStudentModal(false)}
                onSelect={(studentId) => {
                    const student = students.find((s) => s.id === studentId);
                    setSelectedStudent(student || null);
                }}
                selectedStudentId={selectedStudent?.id || ''}
            />
        </div>
    );
}
