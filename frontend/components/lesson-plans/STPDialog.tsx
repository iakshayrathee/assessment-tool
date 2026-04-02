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
import { Checkbox } from '@/components/ui/checkbox';
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
import { toast } from '@/lib/toast';
import { ProfessionalDatePicker } from '@/components/ui/professional-date-picker';
import { addWeeks } from 'date-fns';
import { useAIIEPSuggestions } from '@/hooks/useAI';

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
];

const stpSubGoalSchema = z.object({
    goalStatement: z.string().min(5, 'Sub-goal must be at least 5 characters'),
    order: z.number(),
    isAchieved: z.boolean(),
    achievedDate: z.date().optional().nullable(),
});

const stpFormSchema = z.object({
    longTermPlanId: z.string().min(1, 'Long-term plan is required'),
    linkedGoalStatement: z.string().min(1, 'Linked goal is required'),
    startDate: z.date(),
    endDate: z.date(),
    durationWeeks: z.number().min(4).max(8),
    stpGoal: z.string().min(10, 'STP goal must be at least 10 characters'),
    interventionStrategy: z.array(z.string()).optional(),
    targetAccuracy: z.number().min(0).max(100),
    subGoals: z.array(stpSubGoalSchema).min(1, 'At least one sub-goal required'),
});

export function STPDialog({ open, onOpenChange, studentId, ltps, editing, onSuccess }: any) {
    const [loading, setLoading] = useState(false);
    const [selectedLTP, setSelectedLTP] = useState<any>(null);
    const [showAiBanner, setShowAiBanner] = useState(false);
    const aiAppliedRef = useRef(false);

    // AI pre-fill: fetch IEP suggestions when creating (not editing)
    const aiIEP = useAIIEPSuggestions(studentId, open && !editing && !!studentId);

    const form = useForm({
        resolver: zodResolver(stpFormSchema),
        defaultValues: {
            longTermPlanId: '',
            linkedGoalStatement: '',
            startDate: new Date(),
            endDate: addWeeks(new Date(), 8),
            durationWeeks: 8,
            stpGoal: '',
            interventionStrategy: [],
            targetAccuracy: 80,
            subGoals: [
                { goalStatement: '', order: 1, isAchieved: false, achievedDate: null },
            ],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: 'subGoals',
    });

    // Reset form when editing changes or dialog opens
    useEffect(() => {
        if (open) {
            aiAppliedRef.current = false;
            setShowAiBanner(false);
            if (editing) {
                form.reset({
                    longTermPlanId: editing.longTermPlanId || '',
                    linkedGoalStatement: editing.linkedGoalStatement || '',
                    startDate: new Date(editing.startDate),
                    endDate: new Date(editing.endDate),
                    durationWeeks: editing.durationWeeks || 8,
                    stpGoal: editing.stpGoal || '',
                    interventionStrategy: editing.interventionStrategy || [],
                    targetAccuracy: editing.targetAccuracy || 80,
                    subGoals: editing.subGoals && editing.subGoals.length > 0 ? editing.subGoals.map((sg: any) => ({
                        ...sg,
                        achievedDate: sg.achievedDate ? new Date(sg.achievedDate) : null,
                    })) : [
                        { goalStatement: '', order: 1, isAchieved: false, achievedDate: null },
                    ],
                });
                // Set selected LTP for goal dropdown
                const ltp = ltps.find((l: any) => l.id === editing.longTermPlanId);
                setSelectedLTP(ltp);
            } else {
                form.reset({
                    longTermPlanId: '',
                    linkedGoalStatement: '',
                    startDate: new Date(),
                    endDate: addWeeks(new Date(), 8),
                    durationWeeks: 8,
                    stpGoal: '',
                    interventionStrategy: [],
                    targetAccuracy: 80,
                    subGoals: [
                        { goalStatement: '', order: 1, isAchieved: false, achievedDate: null },
                    ],
                });
                setSelectedLTP(null);
            }
        }
    }, [editing, open, ltps, form]);

    // AI pre-fill: populate STP form from AI data when available
    useEffect(() => {
        if (!editing && open && aiIEP.data && !aiAppliedRef.current) {
            aiAppliedRef.current = true;
            const stps = aiIEP.data.generated_stps || [];
            if (stps.length > 0) {
                const stp = stps[0]; // Use first generated STP
                if (stp.stp_goal || stp.stpGoal) form.setValue('stpGoal', stp.stp_goal || stp.stpGoal);
                if (stp.duration_weeks || stp.durationWeeks) form.setValue('durationWeeks', stp.duration_weeks || stp.durationWeeks);
                if (stp.target_accuracy || stp.targetAccuracy) form.setValue('targetAccuracy', stp.target_accuracy || stp.targetAccuracy);
                if (stp.intervention_strategy?.length) form.setValue('interventionStrategy', stp.intervention_strategy);

                // Map sub-goals
                const subGoals = stp.sub_goals || stp.subGoals || [];
                if (subGoals.length > 0) {
                    form.setValue('subGoals', subGoals.map((sg: any, i: number) => ({
                        goalStatement: sg.goal_statement || sg.goalStatement || sg || '',
                        order: i + 1,
                        isAchieved: false,
                        achievedDate: null,
                    })));
                }
                setShowAiBanner(true);
            }
        }
    }, [aiIEP.data, editing, open, form]);

    const handleLTPChange = (ltpId: string) => {
        const ltp = ltps.find((l: any) => l.id === ltpId);
        setSelectedLTP(ltp);
        form.setValue('longTermPlanId', ltpId);
    };

    const onSubmit = async (data: any) => {
        setLoading(true);
        try {
            const payload = {
                ...data,
                studentId,
                startDate: data.startDate.toISOString(),
                endDate: data.endDate.toISOString(),
                subGoals: data.subGoals.map((sg: any) => ({
                    ...sg,
                    achievedDate: sg.achievedDate ? sg.achievedDate.toISOString() : null,
                })),
            };

            if (editing) {
                await apiClient.updateShortTermPlan(editing.id, payload);
                toast.success('Short-term plan updated successfully');
            } else {
                await apiClient.createShortTermPlan(payload);
                toast.success('Short-term plan created successfully');
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
                    <DialogTitle className="text-2xl">{editing ? 'Edit' : 'Create'} Short-Term Plan</DialogTitle>
                </DialogHeader>

                {/* AI Pre-fill Banner */}
                {showAiBanner && (
                    <div className="flex items-center justify-between bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg px-4 py-2.5">
                        <div className="flex items-center gap-2 text-sm text-indigo-700">
                            <Sparkles className="h-4 w-4" />
                            <span>Pre-filled with AI suggestions — all fields are editable</span>
                        </div>
                        <Button type="button" variant="ghost" size="sm" className="h-6 w-6 p-0 text-indigo-400 hover:text-primary" onClick={() => setShowAiBanner(false)}>
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
                    {/* LTP Selection */}
                    <div className="space-y-4 border-b pb-4">
                        <h3 className="font-semibold text-lg">Link to Long-Term Plan</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Long-Term Plan *</Label>
                                <Select
                                    value={form.watch('longTermPlanId')}
                                    onValueChange={handleLTPChange}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select LTP..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {ltps.map((ltp: any) => (
                                            <SelectItem key={ltp.id} value={ltp.id}>
                                                {ltp.domains.join(', ')} ({ltp.durationMonths} months)
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Linked LTP Goal *</Label>
                                <Select
                                    value={form.watch('linkedGoalStatement')}
                                    onValueChange={(v) => form.setValue('linkedGoalStatement', v)}
                                    disabled={!selectedLTP}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select goal..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {selectedLTP?.goals?.map((goal: any, idx: number) => (
                                            <SelectItem key={idx} value={goal.goalStatement}>
                                                {goal.goalStatement}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    {/* STP Goal & Duration */}
                    <div className="space-y-4 border-b pb-4">
                        <h3 className="font-semibold text-lg">Short-Term Goal & Duration</h3>
                        <div>
                            <Label>STP Goal *</Label>
                            <Textarea
                                {...form.register('stpGoal')}
                                placeholder="e.g., Identify A-Z uppercase letters with 80% accuracy"
                                rows={2}
                            />
                            {form.formState.errors.stpGoal && (
                                <p className="text-sm text-destructive mt-1">{form.formState.errors.stpGoal.message}</p>
                            )}
                        </div>
                        <div className="grid grid-cols-4 gap-4">
                            <div>
                                <Label>Start Date *</Label>
                                <ProfessionalDatePicker
                                    value={form.watch('startDate')}
                                    onChange={(date) => form.setValue('startDate', date)}
                                />
                            </div>
                            <div>
                                <Label>End Date *</Label>
                                <ProfessionalDatePicker
                                    value={form.watch('endDate')}
                                    onChange={(date) => form.setValue('endDate', date)}
                                />
                            </div>
                            <div>
                                <Label>Duration (weeks) *</Label>
                                <Input
                                    type="number"
                                    min={4}
                                    max={8}
                                    {...form.register('durationWeeks', { valueAsNumber: true })}
                                />
                            </div>
                            <div>
                                <Label>Target Accuracy % *</Label>
                                <Input
                                    type="number"
                                    min={0}
                                    max={100}
                                    {...form.register('targetAccuracy', { valueAsNumber: true })}
                                />
                            </div>
                        </div>
                    </div>



                    {/* TABULAR SUB-GOALS INPUT */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-semibold text-lg">Sub-Goals (at least 1 required)</h3>
                                <p className="text-sm text-muted-foreground">Break down the STP goal into measurable sub-goals</p>
                            </div>
                            <Button
                                type="button"
                                size="sm"
                                onClick={() => append({
                                    goalStatement: '',
                                    order: fields.length + 1,
                                    isAchieved: false,
                                    achievedDate: null,
                                })}
                            >
                                <Plus className="h-4 w-4 mr-1" />
                                Add Sub-Goal
                            </Button>
                        </div>

                        <div className="border rounded-lg overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/40">
                                        <TableHead className="w-12">#</TableHead>
                                        <TableHead>Goal Statement *</TableHead>
                                        <TableHead className="w-24">Achieved</TableHead>
                                        <TableHead className="w-40">Date Achieved</TableHead>
                                        <TableHead className="w-20">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {fields.map((field, index) => (
                                        <TableRow key={field.id}>
                                            <TableCell className="font-medium">{index + 1}</TableCell>
                                            <TableCell>
                                                <Input
                                                    {...form.register(`subGoals.${index}.goalStatement`)}
                                                    placeholder="e.g., Recognise A-F"
                                                />
                                                {form.formState.errors.subGoals?.[index]?.goalStatement && (
                                                    <p className="text-xs text-destructive mt-1">
                                                        {form.formState.errors.subGoals[index]?.goalStatement?.message}
                                                    </p>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <input
                                                    type="hidden"
                                                    {...form.register(`subGoals.${index}.isAchieved`)}
                                                />
                                                <input
                                                    type="hidden"
                                                    {...form.register(`subGoals.${index}.achievedDate`)}
                                                />
                                                <Checkbox
                                                    checked={form.watch(`subGoals.${index}.isAchieved`)}
                                                    onCheckedChange={(checked) => {
                                                        form.setValue(`subGoals.${index}.isAchieved`, !!checked);
                                                        if (checked) {
                                                            form.setValue(`subGoals.${index}.achievedDate`, new Date());
                                                        } else {
                                                            form.setValue(`subGoals.${index}.achievedDate`, null);
                                                        }
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                {form.watch(`subGoals.${index}.isAchieved`) && (
                                                    <ProfessionalDatePicker
                                                        value={form.watch(`subGoals.${index}.achievedDate`) || new Date()}
                                                        onChange={(date) => form.setValue(`subGoals.${index}.achievedDate`, date)}
                                                    />
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => remove(index)}
                                                    disabled={fields.length <= 1}
                                                >
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                        {form.formState.errors.subGoals && typeof form.formState.errors.subGoals === 'object' && 'message' in form.formState.errors.subGoals && (
                            <p className="text-sm text-destructive">{form.formState.errors.subGoals.message}</p>
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
