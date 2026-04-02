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
import { toast } from '@/lib/toast';
import { ProfessionalDatePicker } from '@/components/ui/professional-date-picker';
import { useAILessonPlan } from '@/hooks/useAI';

const wlpFormSchema = z.object({
    shortTermPlanId: z.string().optional(),
    weekNumber: z.number().min(1),
    sessionDate: z.date(),
    topics: z.string().min(5, 'Topics must be at least 5 characters'),
    areasOfRemediation: z.array(z.string()).min(1, 'At least one area required'),
    averageTime: z.number().optional(),
    motivationStrategy: z.string().optional(),
    resourcesUsed: z.array(z.string()).min(1, 'At least one resource required'),
    outcome: z.string().optional(),
});

export function WLPDialog({ open, onOpenChange, studentId, stps, editing, onSuccess }: any) {
    const [loading, setLoading] = useState(false);
    const [showAiBanner, setShowAiBanner] = useState(false);
    const aiAppliedRef = useRef(false);

    // AI pre-fill: fetch lesson plan suggestions when creating (not editing)
    const aiLessonPlan = useAILessonPlan(studentId, 1, open && !editing && !!studentId);

    const form = useForm({
        resolver: zodResolver(wlpFormSchema),
        defaultValues: {
            shortTermPlanId: '',
            weekNumber: 1,
            sessionDate: new Date(),
            topics: '',
            areasOfRemediation: [''],
            averageTime: 20,
            motivationStrategy: '',
            resourcesUsed: [''],
            outcome: '',
        },
    });

    const { fields: areaFields, append: appendArea, remove: removeArea, replace: replaceAreas } = useFieldArray({
        control: form.control,
        name: 'areasOfRemediation',
    });

    const { fields: resourceFields, append: appendResource, remove: removeResource, replace: replaceResources } = useFieldArray({
        control: form.control,
        name: 'resourcesUsed',
    });

    // Reset form when editing changes or dialog opens
    useEffect(() => {
        if (open) {
            aiAppliedRef.current = false;
            setShowAiBanner(false);
            if (editing) {
                form.reset({
                    shortTermPlanId: editing.shortTermPlanId || '',
                    weekNumber: editing.weekNumber || 1,
                    sessionDate: new Date(editing.sessionDate),
                    topics: editing.topics || '',
                    areasOfRemediation: editing.areasOfRemediation && editing.areasOfRemediation.length > 0
                        ? editing.areasOfRemediation
                        : [''],
                    averageTime: editing.averageTime || undefined,
                    motivationStrategy: editing.motivationStrategy || '',
                    resourcesUsed: editing.resourcesUsed && editing.resourcesUsed.length > 0
                        ? editing.resourcesUsed
                        : [''],
                    outcome: editing.outcome || '',
                });
            } else {
                form.reset({
                    shortTermPlanId: '',
                    weekNumber: 1,
                    sessionDate: new Date(),
                    topics: '',
                    areasOfRemediation: [''],
                    averageTime: 20,
                    motivationStrategy: '',
                    resourcesUsed: [''],
                    outcome: '',
                });
            }
        }
    }, [editing, open, form]);

    // AI pre-fill: populate WLP form from AI lesson plan data
    useEffect(() => {
        if (!editing && open && aiLessonPlan.data && !aiAppliedRef.current) {
            aiAppliedRef.current = true;
            const data = aiLessonPlan.data;
            const plan = data.lesson_plan || data;

            // Map AI data to form fields
            if (plan.topics) form.setValue('topics', typeof plan.topics === 'string' ? plan.topics : plan.topics.join(', '));
            if (data.motivation_strategy) form.setValue('motivationStrategy', data.motivation_strategy);

            // Map areas of remediation — use replace() so useFieldArray rows re-render
            const areas = data.areas_of_remediation || plan.areas_of_remediation || [];
            if (areas.length > 0) {
                replaceAreas(areas.map((a: string) => a));
            }

            // Map resources — use replace() so useFieldArray rows re-render
            const resources = data.suggested_resources || plan.suggested_resources || [];
            if (resources.length > 0) {
                replaceResources(resources.map((r: string) => r));
            }

            // Map average time: prefer sum of activity durations, fall back to estimated_time
            const totalMins = (data.suggested_activities || []).reduce(
                (sum: number, a: any) => sum + (a.duration_minutes || 0), 0
            );
            const avgTime = totalMins > 0 ? totalMins : (data.estimated_time || 0);
            if (avgTime > 0) form.setValue('averageTime', avgTime);

            setShowAiBanner(true);
        }
    }, [aiLessonPlan.data, editing, open, form, replaceAreas, replaceResources]);

    const onSubmit = async (data: any) => {
        setLoading(true);
        try {
            const payload: any = {
                ...data,
                studentId,
                sessionDate: data.sessionDate.toISOString(),
                areasOfRemediation: data.areasOfRemediation.filter((a: string) => a.trim()),
                resourcesUsed: data.resourcesUsed.filter((r: string) => r.trim()),
                status: 'PLANNED',
            };

            // Remove shortTermPlanId if it's empty, 'all', or undefined (standalone plan)
            if (!payload.shortTermPlanId || payload.shortTermPlanId === 'all' || payload.shortTermPlanId === '') {
                delete payload.shortTermPlanId;
            }

            if (editing) {
                await apiClient.updateWeeklyLessonPlan(editing.id, payload);
                toast.success('Weekly lesson plan updated successfully');
            } else {
                await apiClient.createWeeklyLessonPlan(payload);
                toast.success('Weekly lesson plan created successfully');
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
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl">{editing ? 'Edit' : 'Create'} Weekly Lesson Plan</DialogTitle>
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
                {!editing && aiLessonPlan.isLoading && (
                    <div className="flex items-center gap-2 text-sm text-indigo-500 px-1">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Loading AI suggestions...</span>
                    </div>
                )}

                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {/* Basic Info */}
                    <div className="space-y-4 border-b pb-4">
                        <h3 className="font-semibold text-lg">Basic Information</h3>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <Label>Short-Term Plan (Optional)</Label>
                                <Select
                                    value={form.watch('shortTermPlanId') || ''}
                                    onValueChange={(v) => form.setValue('shortTermPlanId', v || undefined)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Standalone or link to STP..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Standalone (No STP)</SelectItem>
                                        {stps.map((stp: any) => (
                                            <SelectItem key={stp.id} value={stp.id}>
                                                {stp.stpGoal.substring(0, 50)}...
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Week Number *</Label>
                                <Input
                                    type="number"
                                    min={1}
                                    {...form.register('weekNumber', { valueAsNumber: true })}
                                />
                            </div>
                            <div>
                                <Label>Session Date *</Label>
                                <ProfessionalDatePicker
                                    value={form.watch('sessionDate')}
                                    onChange={(date) => form.setValue('sessionDate', date)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Topics & Time */}
                    <div className="space-y-4 border-b pb-4">
                        <h3 className="font-semibold text-lg">Topics & Time</h3>
                        <div>
                            <Label>Topics *</Label>
                            <Textarea
                                {...form.register('topics')}
                                placeholder="e.g., Letter Recognition A-C, CVC word blending"
                                rows={2}
                            />
                            {form.formState.errors.topics && (
                                <p className="text-sm text-destructive mt-1">{form.formState.errors.topics.message}</p>
                            )}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Average Time (minutes)</Label>
                                <Input
                                    type="number"
                                    min={0}
                                    {...form.register('averageTime', { valueAsNumber: true })}
                                    placeholder="20"
                                />
                            </div>
                            <div>
                                <Label>Motivation Strategy</Label>
                                <Input
                                    {...form.register('motivationStrategy')}
                                    placeholder="e.g., Token reward, praise, stickers"
                                />
                            </div>
                        </div>
                    </div>

                    {/* TABULAR AREAS OF REMEDIATION */}
                    <div className="space-y-4 border-b pb-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-semibold text-lg">Areas of Remediation</h3>
                                <p className="text-sm text-muted-foreground">Specific areas to focus on during this session</p>
                            </div>
                            <Button
                                type="button"
                                size="sm"
                                onClick={() => appendArea('')}
                            >
                                <Plus className="h-4 w-4 mr-1" />
                                Add Area
                            </Button>
                        </div>

                        <div className="border rounded-lg overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/40">
                                        <TableHead className="w-12">#</TableHead>
                                        <TableHead>Area of Remediation *</TableHead>
                                        <TableHead className="w-20">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {areaFields.map((field, index) => (
                                        <TableRow key={field.id}>
                                            <TableCell className="font-medium">{index + 1}</TableCell>
                                            <TableCell>
                                                <Input
                                                    {...form.register(`areasOfRemediation.${index}`)}
                                                    placeholder="e.g., Visual Discrimination, Auditory Processing"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => removeArea(index)}
                                                    disabled={areaFields.length <= 1}
                                                >
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                        {form.formState.errors.areasOfRemediation && typeof form.formState.errors.areasOfRemediation === 'object' && 'message' in form.formState.errors.areasOfRemediation && (
                            <p className="text-sm text-destructive">{form.formState.errors.areasOfRemediation.message}</p>
                        )}
                    </div>

                    {/* TABULAR RESOURCES */}
                    <div className="space-y-4 border-b pb-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-semibold text-lg">Resources Used</h3>
                                <p className="text-sm text-muted-foreground">Materials and tools for this session</p>
                            </div>
                            <Button
                                type="button"
                                size="sm"
                                onClick={() => appendResource('')}
                            >
                                <Plus className="h-4 w-4 mr-1" />
                                Add Resource
                            </Button>
                        </div>

                        <div className="border rounded-lg overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/40">
                                        <TableHead className="w-12">#</TableHead>
                                        <TableHead>Resource *</TableHead>
                                        <TableHead className="w-20">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {resourceFields.map((field, index) => (
                                        <TableRow key={field.id}>
                                            <TableCell className="font-medium">{index + 1}</TableCell>
                                            <TableCell>
                                                <Input
                                                    {...form.register(`resourcesUsed.${index}`)}
                                                    placeholder="e.g., Flashcards, Tracing sheets, Digital game"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => removeResource(index)}
                                                    disabled={resourceFields.length <= 1}
                                                >
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                        {form.formState.errors.resourcesUsed && typeof form.formState.errors.resourcesUsed === 'object' && 'message' in form.formState.errors.resourcesUsed && (
                            <p className="text-sm text-destructive">{form.formState.errors.resourcesUsed.message}</p>
                        )}
                    </div>

                    {/* Outcome */}
                    <div>
                        <Label>Outcome (Optional)</Label>
                        <Textarea
                            {...form.register('outcome')}
                            placeholder="Child response and observations (fill after session)"
                            rows={3}
                        />
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
