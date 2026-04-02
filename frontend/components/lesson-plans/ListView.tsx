import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Loader2, Pencil, Target } from 'lucide-react';
import { format } from 'date-fns';

export function LTPListView({ ltps, loading, getStatusColor, onEdit }: any) {
    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (ltps.length === 0) {
        return (
            <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                    No long-term plans yet.
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Domains</TableHead>
                            <TableHead>Duration</TableHead>
                            <TableHead>Goals</TableHead>
                            <TableHead>Review Cycle</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {ltps.map((ltp: any) => (
                            <TableRow key={ltp.id}>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <Target className="h-4 w-4 text-primary" />
                                        <span className="font-medium">{ltp.domains.join(', ')}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="text-sm">
                                        <div>{format(new Date(ltp.startDate), 'MMM dd, yyyy')}</div>
                                        <div className="text-muted-foreground">to {format(new Date(ltp.endDate), 'MMM dd, yyyy')}</div>
                                        <div className="text-xs text-muted-foreground">{ltp.durationMonths} months</div>
                                    </div>
                                </TableCell>
                                <TableCell>{ltp.goals?.length || 0} goals</TableCell>
                                <TableCell>{ltp.reviewCycle}</TableCell>
                                <TableCell>
                                    <Badge className={getStatusColor(ltp.status)}>{ltp.status}</Badge>
                                </TableCell>
                                <TableCell>
                                    <Button size="sm" variant="ghost" onClick={() => onEdit(ltp)}>
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

export function STPListView({ stps, loading, getStatusColor, onEdit }: any) {
    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (stps.length === 0) {
        return (
            <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                    No short-term plans yet.
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Goal</TableHead>
                            <TableHead>Duration</TableHead>
                            <TableHead>Sub-Goals</TableHead>
                            <TableHead>Progress</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {stps.map((stp: any) => (
                            <TableRow key={stp.id}>
                                <TableCell className="font-medium max-w-xs">{stp.stpGoal}</TableCell>
                                <TableCell>
                                    <div className="text-sm">
                                        <div>{format(new Date(stp.startDate), 'MMM dd')}</div>
                                        <div className="text-muted-foreground">to {format(new Date(stp.endDate), 'MMM dd')}</div>
                                        <div className="text-xs text-muted-foreground">{stp.durationWeeks} weeks</div>
                                    </div>
                                </TableCell>
                                <TableCell>{stp.subGoals?.length || 0}</TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <div className="w-20 bg-muted rounded-full h-2">
                                            <div
                                                className="bg-green-600 h-2 rounded-full"
                                                style={{ width: `${stp.progressPercentage}%` }}
                                            />
                                        </div>
                                        <span className="text-sm">{stp.progressPercentage}%</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge className={getStatusColor(stp.status)}>{stp.status}</Badge>
                                </TableCell>
                                <TableCell>
                                    <Button size="sm" variant="ghost" onClick={() => onEdit(stp)}>
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

export function WLPListView({ wlps, loading, getStatusColor, onEdit }: any) {
    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (wlps.length === 0) {
        return (
            <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                    No weekly lesson plans yet.
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Week #</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Topics</TableHead>
                            <TableHead>Areas</TableHead>
                            <TableHead>Time (Avg/Actual)</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {wlps.map((wlp: any) => (
                            <TableRow key={wlp.id}>
                                <TableCell className="font-medium">Week {wlp.weekNumber}</TableCell>
                                <TableCell>{format(new Date(wlp.sessionDate), 'MMM dd, yyyy')}</TableCell>
                                <TableCell className="max-w-xs">{wlp.topics}</TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                    {wlp.areasOfRemediation.slice(0, 2).join(', ')}
                                    {wlp.areasOfRemediation.length > 2 && ` +${wlp.areasOfRemediation.length - 2}`}
                                </TableCell>
                                <TableCell>
                                    <div className="text-sm">
                                        {wlp.averageTime || '-'}m / {wlp.actualTime || '-'}m
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge className={getStatusColor(wlp.status)}>{wlp.status}</Badge>
                                </TableCell>
                                <TableCell>
                                    <Button size="sm" variant="ghost" onClick={() => onEdit(wlp)}>
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
