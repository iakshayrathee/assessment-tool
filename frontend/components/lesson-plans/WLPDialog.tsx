'use client';

import { useState, useEffect } from 'react';
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
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { toast } from 'react-hot-toast';
import { ProfessionalDatePicker } from '@/components/ui/professional-date-picker';

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

    const { fields: areaFields, append: appendArea, remove: removeArea } = useFieldArray({
        control: form.control,
        name: 'areasOfRemediation',
    });

    const { fields: resourceFields, append: appendResource, remove: removeResource } = useFieldArray({
        control: form.control,
        name: 'resourcesUsed',
    });

    // Reset form when editing changes or dialog opens
    useEffect(() => {
        if (open) {
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
                                <p className="text-sm text-red-600 mt-1">{form.formState.errors.topics.message}</p>
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
                                <p className="text-sm text-gray-600">Specific areas to focus on during this session</p>
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
                                    <TableRow className="bg-gray-50">
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
                                                    <Trash2 className="h-4 w-4 text-red-600" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                        {form.formState.errors.areasOfRemediation && typeof form.formState.errors.areasOfRemediation === 'object' && 'message' in form.formState.errors.areasOfRemediation && (
                            <p className="text-sm text-red-600">{form.formState.errors.areasOfRemediation.message}</p>
                        )}
                    </div>

                    {/* TABULAR RESOURCES */}
                    <div className="space-y-4 border-b pb-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-semibold text-lg">Resources Used</h3>
                                <p className="text-sm text-gray-600">Materials and tools for this session</p>
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
                                    <TableRow className="bg-gray-50">
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
                                                    <Trash2 className="h-4 w-4 text-red-600" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                        {form.formState.errors.resourcesUsed && typeof form.formState.errors.resourcesUsed === 'object' && 'message' in form.formState.errors.resourcesUsed && (
                            <p className="text-sm text-red-600">{form.formState.errors.resourcesUsed.message}</p>
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
