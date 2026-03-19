'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
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
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Plus, Trash2, Loader2, Sparkles, X } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { toast } from 'react-hot-toast';
import { ProfessionalDatePicker } from '@/components/ui/professional-date-picker';
import { addMonths } from 'date-fns';
import { useAIIEPSuggestions } from '@/hooks/useAI';

const DOMAINS = ['READING', 'WRITING', 'MATH', 'COGNITIVE', 'MOTOR', 'BEHAVIOURAL', 'READING_COMPREHENSION', 'ORAL_LANGUAGE', 'SPELLING'];
const REVIEW_CYCLES = ['MONTHLY', 'QUARTERLY', 'BIANNUAL'];

// Helper function to format domain names
const formatDomainName = (domain: string) => {
    return domain
        .split('_')
        .map(word => word.charAt(0) + word.slice(1).toLowerCase())
        .join(' ');
};

const ltpGoalSchema = z.object({
    goalStatement: z.string().min(10, 'Goal must be at least 10 characters'),
    domain: z.string(),
    targetAccuracy: z.number().min(0).max(100),
    order: z.number(),
});

const ltpFormSchema = z.object({
    studentId: z.string(),
    diagnosis: z.string().optional(),
    suspectedLD: z.string().optional(),
    learningStrengths: z.string(),
    challengeAreas: z.string(),
    startDate: z.date(),
    endDate: z.date(),
    durationMonths: z.number().min(6).max(12),
    domains: z.array(z.string()).optional(), // Optional since we extract from goals
    reviewCycle: z.string(),
    goals: z.array(ltpGoalSchema).min(1, 'At least 1 goal required').max(5, 'Maximum 5 goals'),
});

export function LTPDialog({ open, onOpenChange, studentId, editing, onSuccess }: any) {
    const [loading, setLoading] = useState(false);
    const [showAiBanner, setShowAiBanner] = useState(false);
    const aiAppliedRef = useRef(false);

    // AI pre-fill: fetch IEP suggestions when creating (not editing)
    const aiIEP = useAIIEPSuggestions(studentId, open && !editing && !!studentId);

    const form = useForm({
        resolver: zodResolver(ltpFormSchema),
        defaultValues: {
            studentId,
            diagnosis: '',
            suspectedLD: '',
            learningStrengths: '',
            challengeAreas: '',
            startDate: new Date(),
            endDate: addMonths(new Date(), 12),
            durationMonths: 12,
            domains: [],
            reviewCycle: 'QUARTERLY',
            goals: [
                { goalStatement: '', domain: 'READING', targetAccuracy: 80, order: 1 },
                { goalStatement: '', domain: 'WRITING', targetAccuracy: 80, order: 2 },
                { goalStatement: '', domain: 'MATH', targetAccuracy: 80, order: 3 },
            ],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: 'goals',
    });

    // Reset form when editing changes or dialog opens
    useEffect(() => {
        if (open) {
            aiAppliedRef.current = false;
            setShowAiBanner(false);
            if (editing) {
                form.reset({
                    studentId: editing.studentId || studentId,
                    diagnosis: editing.diagnosis || '',
                    suspectedLD: editing.suspectedLD || '',
                    learningStrengths: editing.learningStrengths?.join(', ') || '',
                    challengeAreas: editing.challengeAreas?.join(', ') || '',
                    startDate: new Date(editing.startDate),
                    endDate: new Date(editing.endDate),
                    durationMonths: editing.durationMonths || 12,
                    domains: editing.domains || [],
                    reviewCycle: editing.reviewCycle || 'QUARTERLY',
                    goals: editing.goals && editing.goals.length > 0 ? editing.goals : [
                        { goalStatement: '', domain: 'READING', targetAccuracy: 80, order: 1 },
                        { goalStatement: '', domain: 'WRITING', targetAccuracy: 80, order: 2 },
                        { goalStatement: '', domain: 'MATH', targetAccuracy: 80, order: 3 },
                    ],
                });
            } else {
                form.reset({
                    studentId,
                    diagnosis: '',
                    suspectedLD: '',
                    learningStrengths: '',
                    challengeAreas: '',
                    startDate: new Date(),
                    endDate: addMonths(new Date(), 12),
                    durationMonths: 12,
                    domains: [],
                    reviewCycle: 'QUARTERLY',
                    goals: [
                        { goalStatement: '', domain: 'READING', targetAccuracy: 80, order: 1 },
                        { goalStatement: '', domain: 'WRITING', targetAccuracy: 80, order: 2 },
                        { goalStatement: '', domain: 'MATH', targetAccuracy: 80, order: 3 },
                    ],
                });
            }
        }
    }, [editing, open, studentId, form]);

    // AI pre-fill: populate form fields from AI IEP suggestions when data arrives
    useEffect(() => {
        if (!editing && open && aiIEP.data && !aiAppliedRef.current) {
            aiAppliedRef.current = true;
            const data = aiIEP.data;
            const ltp = data.generated_ltp || {};
            const goals = data.generated_goals || [];

            // Map AI data to form fields
            if (ltp.diagnosis) form.setValue('diagnosis', ltp.diagnosis);
            if (ltp.suspected_ld) form.setValue('suspectedLD', ltp.suspected_ld);
            if (ltp.learning_strengths?.length) form.setValue('learningStrengths', ltp.learning_strengths.join(', '));
            if (ltp.challenge_areas?.length) form.setValue('challengeAreas', ltp.challenge_areas.join(', '));
            if (ltp.duration_months) form.setValue('durationMonths', ltp.duration_months);

            // Map AI goals to form goals
            if (goals.length > 0) {
                const mappedGoals = goals.slice(0, 5).map((g: any, i: number) => ({
                    goalStatement: g.goal_statement || g.goalStatement || '',
                    domain: (g.domain || 'READING').toUpperCase(),
                    targetAccuracy: g.target_accuracy || g.targetAccuracy || 80,
                    order: i + 1,
                }));
                form.setValue('goals', mappedGoals);
            }

            setShowAiBanner(true);
        }
    }, [aiIEP.data, editing, open, form]);

    const onSubmit = async (data: any) => {
        setLoading(true);
        try {
            // Extract unique domains from goals
            const uniqueDomains = Array.from(new Set(data.goals.map((goal: any) => goal.domain)));

            const payload = {
                ...data,
                domains: uniqueDomains,
                learningStrengths: data.learningStrengths.split(',').map((s: string) => s.trim()).filter(Boolean),
                challengeAreas: data.challengeAreas.split(',').map((s: string) => s.trim()).filter(Boolean),
                startDate: data.startDate.toISOString(),
                endDate: data.endDate.toISOString(),
                nextReviewDate: addMonths(data.startDate, data.reviewCycle === 'MONTHLY' ? 1 : data.reviewCycle === 'QUARTERLY' ? 3 : 6).toISOString(),
            };

            if (editing) {
                await apiClient.updateLongTermPlan(editing.id, payload);
                toast.success('Long-term plan updated successfully');
            } else {
                await apiClient.createLongTermPlan(payload);
                toast.success('Long-term plan created successfully');
            }

            onSuccess();
            onOpenChange(false);
            form.reset();
        } catch (error: any) {
            toast.error('Error: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl">{editing ? 'Edit' : 'Create'} Long-Term Plan</DialogTitle>
                </DialogHeader>

                {/* AI Pre-fill Banner */}
                {showAiBanner && (
                    <div className="flex items-center justify-between bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg px-4 py-2.5">
                        <div className="flex items-center gap-2 text-sm text-indigo-700">
                            <Sparkles className="h-4 w-4" />
                            <span>Pre-filled with AI suggestions — all fields are editable</span>
                        </div>
                        <Button type="button" variant="ghost" size="sm" className="h-6 w-6 p-0 text-indigo-400 hover:text-indigo-600" onClick={() => setShowAiBanner(false)}>
                            <X className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                )}
                {!editing && aiIEP.isLoading && (
                    <div className="flex items-center gap-2 text-sm text-indigo-500 px-1">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Loading AI suggestions...</span>
                    </div>
                )}

                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {/* Student Profile Section */}
                    <div className="space-y-4 border-b pb-4">
                        <h3 className="font-semibold text-lg">Student Profile</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Diagnosis (Optional)</Label>
                                <Input {...form.register('diagnosis')} placeholder="e.g., Dyslexia" />
                            </div>
                            <div>
                                <Label>Suspected LD (Optional)</Label>
                                <Input {...form.register('suspectedLD')} placeholder="e.g., Dyscalculia" />
                            </div>
                            <div>
                                <Label>Learning Strengths (comma-separated)</Label>
                                <Textarea
                                    {...form.register('learningStrengths')}
                                    placeholder="Visual learning, Hands-on activities, Good memory"
                                    rows={2}
                                />
                            </div>
                            <div>
                                <Label>Challenge Areas (comma-separated)</Label>
                                <Textarea
                                    {...form.register('challengeAreas')}
                                    placeholder="Reading fluency, Letter recognition, Number sense"
                                    rows={2}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Duration Section */}
                    <div className="space-y-4 border-b pb-4">
                        <h3 className="font-semibold text-lg">Duration & Review</h3>
                        <div className="grid grid-cols-4 gap-4 items-start">
                            <div>
                                <ProfessionalDatePicker
                                    label="Start Date"
                                    value={form.watch('startDate')}
                                    onChange={(date) => date && form.setValue('startDate', date)}
                                    required
                                />
                            </div>
                            <div>
                                <ProfessionalDatePicker
                                    label="End Date"
                                    value={form.watch('endDate')}
                                    onChange={(date) => date && form.setValue('endDate', date)}
                                    required
                                />
                            </div>
                            <div>
                                <Label>Duration (months) *</Label>
                                <Input
                                    type="number"
                                    min={6}
                                    max={12}
                                    {...form.register('durationMonths', { valueAsNumber: true })}
                                />
                                {form.formState.errors.durationMonths && (
                                    <p className="text-sm text-red-600">{form.formState.errors.durationMonths.message}</p>
                                )}
                            </div>
                            <div>
                                <Label>Review Cycle *</Label>
                                <Select
                                    value={form.watch('reviewCycle')}
                                    onValueChange={(v) => form.setValue('reviewCycle', v)}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {REVIEW_CYCLES.map((cycle) => (
                                            <SelectItem key={cycle} value={cycle}>{formatDomainName(cycle)}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>



                    {/* TABULAR GOALS INPUT */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-semibold text-lg">Goals (1-5 required)</h3>
                                <p className="text-sm text-gray-600">Add specific, measurable goals for this plan</p>
                            </div>
                            <Button
                                type="button"
                                size="sm"
                                onClick={() => append({
                                    goalStatement: '',
                                    domain: 'READING',
                                    targetAccuracy: 80,
                                    order: fields.length + 1,
                                })}
                                disabled={fields.length >= 5}
                            >
                                <Plus className="h-4 w-4 mr-1" />
                                Add Goal
                            </Button>
                        </div>

                        <div className="border rounded-lg overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-gray-50">
                                        <TableHead className="w-12">#</TableHead>
                                        <TableHead className="w-40">Domain *</TableHead>
                                        <TableHead>Goal Statement *</TableHead>
                                        <TableHead className="w-32">Target % *</TableHead>
                                        <TableHead className="w-20">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {fields.map((field, index) => (
                                        <TableRow key={field.id}>
                                            <TableCell className="font-medium">{index + 1}</TableCell>
                                            <TableCell>
                                                <Select
                                                    value={form.watch(`goals.${index}.domain`)}
                                                    onValueChange={(v) => form.setValue(`goals.${index}.domain`, v)}
                                                >
                                                    <SelectTrigger className="h-9">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {DOMAINS.map((d) => (
                                                            <SelectItem key={d} value={d}>{formatDomainName(d)}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    {...form.register(`goals.${index}.goalStatement`)}
                                                    placeholder="e.g., Student will read CVC words with 80% accuracy"
                                                />
                                                {form.formState.errors.goals?.[index]?.goalStatement && (
                                                    <p className="text-xs text-red-600 mt-1">
                                                        {form.formState.errors.goals[index]?.goalStatement?.message}
                                                    </p>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    type="number"
                                                    min={0}
                                                    max={100}
                                                    {...form.register(`goals.${index}.targetAccuracy`, { valueAsNumber: true })}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => remove(index)}
                                                    disabled={fields.length <= 1}
                                                >
                                                    <Trash2 className="h-4 w-4 text-red-600" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                        {form.formState.errors.goals && typeof form.formState.errors.goals === 'object' && 'message' in form.formState.errors.goals && (
                            <p className="text-sm text-red-600">{form.formState.errors.goals.message}</p>
                        )}
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                editing ? 'Update Plan' : 'Create Plan'
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
