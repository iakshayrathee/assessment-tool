import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
    ChevronDown,
    ChevronRight,
    Calendar,
    Target,
    Pencil,
    CheckCircle2,
} from 'lucide-react';
import { format } from 'date-fns';

interface HierarchyViewProps {
    ltps: any[];
    stps: any[];
    wlps: any[];
    expandedLTPs: Set<string>;
    expandedSTPs: Set<string>;
    toggleLTPExpansion: (id: string) => void;
    toggleSTPExpansion: (id: string) => void;
    getStatusColor: (status: string) => string;
    onEditLTP: (ltp: any) => void;
    onEditSTP: (stp: any) => void;
    onEditWLP: (wlp: any) => void;
}

export function HierarchyView({
    ltps,
    stps,
    wlps,
    expandedLTPs,
    expandedSTPs,
    toggleLTPExpansion,
    toggleSTPExpansion,
    getStatusColor,
    onEditLTP,
    onEditSTP,
    onEditWLP,
}: HierarchyViewProps) {
    return (
        <div className="space-y-4">
            {ltps.map((ltp) => {
                const ltpSTPs = stps.filter((stp) => stp.longTermPlanId === ltp.id);
                const isExpanded = expandedLTPs.has(ltp.id);

                return (
                    <Card key={ltp.id} className="border-l-4 border-l-blue-500">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 flex-1">
                                    <button
                                        onClick={() => toggleLTPExpansion(ltp.id)}
                                        className="hover:bg-gray-100 p-1 rounded"
                                    >
                                        {isExpanded ? (
                                            <ChevronDown className="h-5 w-5" />
                                        ) : (
                                            <ChevronRight className="h-5 w-5" />
                                        )}
                                    </button>
                                    <Target className="h-5 w-5 text-blue-600" />
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-lg">
                                            LTP: {ltp.domains.join(', ')}
                                        </h3>
                                        <p className="text-sm text-gray-600">
                                            {format(new Date(ltp.startDate), 'MMM dd, yyyy')} -{' '}
                                            {format(new Date(ltp.endDate), 'MMM dd, yyyy')} ({ltp.durationMonths} months)
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge className={getStatusColor(ltp.status)}>{ltp.status}</Badge>
                                    <Button size="sm" variant="ghost" onClick={() => onEditLTP(ltp)}>
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>

                        {isExpanded && (
                            <CardContent className="space-y-4">
                                {/* LTP Goals */}
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <h4 className="font-medium mb-2">Goals ({ltp.goals?.length || 0})</h4>
                                    <div className="space-y-2">
                                        {ltp.goals?.map((goal: any, idx: number) => (
                                            <div key={idx} className="flex items-start gap-2 text-sm">
                                                <span className="font-medium text-gray-500">{idx + 1}.</span>
                                                <div className="flex-1">
                                                    <p>{goal.goalStatement}</p>
                                                    <p className="text-xs text-gray-500">
                                                        {goal.domain} • Target: {goal.targetAccuracy}%
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* STPs under this LTP */}
                                {ltpSTPs.length > 0 ? (
                                    <div className="ml-8 space-y-3">
                                        {ltpSTPs.map((stp) => {
                                            const stpWLPs = wlps.filter((wlp) => wlp.shortTermPlanId === stp.id);
                                            const isStpExpanded = expandedSTPs.has(stp.id);

                                            return (
                                                <Card key={stp.id} className="border-l-4 border-l-green-500">
                                                    <CardHeader className="py-3">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-3 flex-1">
                                                                <button
                                                                    onClick={() => toggleSTPExpansion(stp.id)}
                                                                    className="hover:bg-gray-100 p-1 rounded"
                                                                >
                                                                    {isStpExpanded ? (
                                                                        <ChevronDown className="h-4 w-4" />
                                                                    ) : (
                                                                        <ChevronRight className="h-4 w-4" />
                                                                    )}
                                                                </button>
                                                                <div className="flex-1">
                                                                    <h4 className="font-medium">STP: {stp.stpGoal}</h4>
                                                                    <p className="text-xs text-gray-600">
                                                                        {format(new Date(stp.startDate), 'MMM dd')} -{' '}
                                                                        {format(new Date(stp.endDate), 'MMM dd')} ({stp.durationWeeks} weeks)
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-24">
                                                                    <Progress value={stp.progressPercentage} className="h-2" />
                                                                    <p className="text-xs text-center mt-1">{stp.progressPercentage}%</p>
                                                                </div>
                                                                <Badge className={getStatusColor(stp.status)}>{stp.status}</Badge>
                                                                <Button size="sm" variant="ghost" onClick={() => onEditSTP(stp)}>
                                                                    <Pencil className="h-3 w-3" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </CardHeader>

                                                    {isStpExpanded && (
                                                        <CardContent className="py-3 space-y-3">
                                                            {/* Sub-goals */}
                                                            <div className="bg-gray-50 p-3 rounded">
                                                                <h5 className="text-sm font-medium mb-2">Sub-Goals</h5>
                                                                <div className="space-y-1">
                                                                    {stp.subGoals?.map((subGoal: any, idx: number) => (
                                                                        <div key={idx} className="flex items-center gap-2 text-sm">
                                                                            <CheckCircle2
                                                                                className={`h-4 w-4 ${subGoal.isAchieved ? 'text-green-600' : 'text-gray-300'
                                                                                    }`}
                                                                            />
                                                                            <span className={subGoal.isAchieved ? 'line-through text-gray-500' : ''}>
                                                                                {subGoal.goalStatement}
                                                                            </span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>

                                                            {/* WLPs under this STP */}
                                                            {stpWLPs.length > 0 && (
                                                                <div className="ml-6 space-y-2">
                                                                    {stpWLPs.map((wlp) => (
                                                                        <div
                                                                            key={wlp.id}
                                                                            className="flex items-center gap-3 p-2 bg-white border rounded hover:bg-gray-50"
                                                                        >
                                                                            <Calendar className="h-4 w-4 text-purple-600" />
                                                                            <div className="flex-1">
                                                                                <p className="text-sm font-medium">
                                                                                    Week {wlp.weekNumber}: {wlp.topics}
                                                                                </p>
                                                                                <p className="text-xs text-gray-500">
                                                                                    {format(new Date(wlp.sessionDate), 'MMM dd, yyyy')}
                                                                                </p>
                                                                            </div>
                                                                            <Badge className={getStatusColor(wlp.status)} variant="outline">
                                                                                {wlp.status}
                                                                            </Badge>
                                                                            <Button size="sm" variant="ghost" onClick={() => onEditWLP(wlp)}>
                                                                                <Pencil className="h-3 w-3" />
                                                                            </Button>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </CardContent>
                                                    )}
                                                </Card>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500 ml-8">No short-term plans yet</p>
                                )}
                            </CardContent>
                        )}
                    </Card>
                );
            })}
        </div>
    );
}
