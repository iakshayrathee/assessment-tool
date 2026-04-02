'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ArrowLeft,
  Send,
  AlertTriangle
} from 'lucide-react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { toast } from '@/lib/toast';
import { PageWrapper } from '@/components/layout/PageWrapper';

export default function NewConcern() {
  const router = useRouter();
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    priority: '',
    studentId: '' // Optional - if concern is about specific child
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.description.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      await apiClient.submitParentConcern({
        title: formData.title,
        description: formData.description,
        category: formData.category || 'General',
        priority: formData.priority || 'Medium',
        studentId: formData.studentId || undefined
      });
      
      toast.success('Concern submitted successfully');
      router.push('/parent/concerns');
    } catch (error) {
      console.error('Failed to submit concern:', error);
      toast.error('Failed to submit concern. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <PageWrapper
      title="Submit New Concern"
      description="Share your observations or concerns about your child"
      breadcrumbs={[{ label: 'Dashboard', href: '/parent/dashboard' }, { label: 'Concerns', href: '/parent/concerns' }, { label: 'New Concern' }]}
    >
      <div className="max-w-4xl grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Guidelines */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2 text-warning" />
                  Guidelines
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-sm mb-2">What to include:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Specific behaviors or situations</li>
                    <li>• When and where it occurs</li>
                    <li>• How often it happens</li>
                    <li>• Any triggers you've noticed</li>
                    <li>• What you've tried so far</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold text-sm mb-2">Response time:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• High priority: 24-48 hours</li>
                    <li>• Medium priority: 3-5 days</li>
                    <li>• Low priority: 1-2 weeks</li>
                  </ul>
                </div>

                <div className="p-3 bg-primary/10 rounded-lg">
                  <p className="text-sm text-primary">
                    <strong>Emergency:</strong> For urgent medical or safety concerns, 
                    please contact your child's educator directly or call the center.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Concern Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Concern Details</CardTitle>
                <CardDescription>
                  Please provide as much detail as possible to help us understand and address your concern.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="title">Concern Title *</Label>
                    <Input
                      id="title"
                      type="text"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      placeholder="Brief summary of your concern"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Academic">Academic</SelectItem>
                          <SelectItem value="Behavioral">Behavioral</SelectItem>
                          <SelectItem value="Social">Social</SelectItem>
                          <SelectItem value="Medical">Medical</SelectItem>
                          <SelectItem value="Communication">Communication</SelectItem>
                          <SelectItem value="General">General</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="priority">Priority Level</Label>
                      <Select value={formData.priority} onValueChange={(value) => handleInputChange('priority', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="High">High - Urgent attention needed</SelectItem>
                          <SelectItem value="Medium">Medium - Important but not urgent</SelectItem>
                          <SelectItem value="Low">Low - General feedback</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Detailed Description *</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Please describe your concern in detail. Include specific examples, when it occurs, and any patterns you've noticed."
                      rows={6}
                      required
                    />
                    <p className="text-sm text-muted-foreground">
                      The more specific information you provide, the better we can help.
                    </p>
                  </div>

                  <div className="flex justify-end space-x-4 pt-6 border-t">
                    <Link href="/parent/concerns">
                      <Button type="button" variant="outline">
                        Cancel
                      </Button>
                    </Link>
                    <Button type="submit" disabled={submitting}>
                      {submitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Submit Concern
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
    </PageWrapper>
  );
}
