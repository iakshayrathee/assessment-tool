'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Plus,
  UserCheck,
  School
} from 'lucide-react';
import Link from 'next/link';
import { useCenterSchools, useCenterEducators } from '@/hooks/useCenter';
import { UnifiedStudentView } from '@/components/center/UnifiedStudentView';

export default function CenterStudents() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('all');
  
  return (
    <div className="space-y-8 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Students Management</h1>
          <p className="text-muted-foreground">
            Manage all students assigned to your center
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/center/students/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Student
            </Button>
          </Link>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="all">All Students</TabsTrigger>
          <TabsTrigger value="unassigned">Unassigned</TabsTrigger>
          <TabsTrigger value="by-school">By School</TabsTrigger>
          <TabsTrigger value="by-educator">By Educator</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <UnifiedStudentView viewType="all" />
        </TabsContent>

        <TabsContent value="unassigned">
          <UnifiedStudentView viewType="unassigned" />
        </TabsContent>

        <TabsContent value="by-school">
          <SchoolBasedStudentView />
        </TabsContent>

        <TabsContent value="by-educator">
          <EducatorBasedStudentView />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SchoolBasedStudentView() {
  const { user } = useAuth();
  const centerId = user?.profile?.id;
  const { schools, isLoading } = useCenterSchools(centerId);

  if (isLoading) {
    return <div className="text-center py-8">Loading schools...</div>;
  }

  return (
    <div className="space-y-6">
      {schools.map((school: any) => (
        <Card key={school.id}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <School className="h-5 w-5" />
              {school.name}
            </CardTitle>
            <CardDescription>
              Students enrolled in this school
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UnifiedStudentView 
              viewType="by-school" 
              contextId={school.id}
              contextName={school.name}
            />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function EducatorBasedStudentView() {
  const { user } = useAuth();
  const centerId = user?.profile?.id;
  const { educators, isLoading } = useCenterEducators(centerId);

  if (isLoading) {
    return <div className="text-center py-8">Loading educators...</div>;
  }

  return (
    <div className="space-y-6">
      {educators.map((educator: any) => (
        <Card key={educator.educatorId}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              {educator.fullName}
            </CardTitle>
            <CardDescription>
              Students assigned to this educator
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UnifiedStudentView 
              viewType="by-educator" 
              contextId={educator.educatorId}
              contextName={educator.fullName}
            />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
