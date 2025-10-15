'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  School,
  Plus,
  Edit,
  Eye,
  Trash2,
  MapPin,
  Phone,
  Mail,
  GraduationCap,
  Save,
  X,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { School as SchoolType } from '../../../app/admin/centers-schools/[id]/page';

interface SchoolsManagementProps {
  centerId: string;
  schools: SchoolType[];
  onUpdate: () => void;
}

interface SchoolFormData {
  name: string;
  address: string;
  phone: string;
  email: string;
  principalName: string;
}

export default function SchoolsManagement({ centerId, schools, onUpdate }: SchoolsManagementProps) {
  const [showAddSchool, setShowAddSchool] = useState(false);
  const [editingSchool, setEditingSchool] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [schoolFormData, setSchoolFormData] = useState<SchoolFormData>({
    name: '',
    address: '',
    phone: '',
    email: '',
    principalName: ''
  });

  const resetForm = () => {
    setSchoolFormData({
      name: '',
      address: '',
      phone: '',
      email: '',
      principalName: ''
    });
  };

  const handleAddSchool = async () => {
    if (!schoolFormData.name.trim()) {
      toast({
        title: "Error",
        description: "School name is required.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      await apiClient.linkSchoolToCenter(centerId, schoolFormData);
      toast({
        title: "Success",
        description: "School added successfully.",
      });
      setShowAddSchool(false);
      resetForm();
      onUpdate();
    } catch (error) {
      console.error('Failed to add school:', error);
      toast({
        title: "Error",
        description: "Failed to add school. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditSchool = (school: SchoolType) => {
    setSchoolFormData({
      name: school.name,
      address: school.address || '',
      phone: school.phone || '',
      email: school.email || '',
      principalName: school.principalName || ''
    });
    setEditingSchool(school.id);
  };

  const handleUpdateSchool = async (schoolId: string) => {
    if (!schoolFormData.name.trim()) {
      toast({
        title: "Error",
        description: "School name is required.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      await apiClient.updateSchool(schoolId, schoolFormData);
      toast({
        title: "Success",
        description: "School updated successfully.",
      });
      setEditingSchool(null);
      resetForm();
      onUpdate();
    } catch (error) {
      console.error('Failed to update school:', error);
      toast({
        title: "Error",
        description: "Failed to update school. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSchool = async (schoolId: string, schoolName: string) => {
    try {
      setLoading(true);
      await apiClient.deleteSchool(schoolId);
      toast({
        title: "Success",
        description: `${schoolName} has been deleted successfully.`,
      });
      onUpdate();
    } catch (error) {
      console.error('Failed to delete school:', error);
      toast({
        title: "Error",
        description: "Failed to delete school. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingSchool(null);
    resetForm();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <School className="h-5 w-5 text-green-600" />
            Schools ({schools.length})
          </CardTitle>
          <CardDescription>
            Manage schools associated with this center
          </CardDescription>
        </div>
        <Dialog open={showAddSchool} onOpenChange={setShowAddSchool}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add School
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New School</DialogTitle>
              <DialogDescription>
                Add a new school to this center
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="schoolName">School Name *</Label>
                <Input
                  id="schoolName"
                  value={schoolFormData.name}
                  onChange={(e) => setSchoolFormData({...schoolFormData, name: e.target.value})}
                  placeholder="Enter school name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="schoolAddress">Address</Label>
                <Textarea
                  id="schoolAddress"
                  value={schoolFormData.address}
                  onChange={(e) => setSchoolFormData({...schoolFormData, address: e.target.value})}
                  placeholder="Enter school address"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="schoolPhone">Phone</Label>
                  <Input
                    id="schoolPhone"
                    value={schoolFormData.phone}
                    onChange={(e) => setSchoolFormData({...schoolFormData, phone: e.target.value})}
                    placeholder="Phone number"
                  />
                </div>
                <div>
                  <Label htmlFor="schoolEmail">Email</Label>
                  <Input
                    id="schoolEmail"
                    type="email"
                    value={schoolFormData.email}
                    onChange={(e) => setSchoolFormData({...schoolFormData, email: e.target.value})}
                    placeholder="Email address"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="principalName">Principal Name</Label>
                <Input
                  id="principalName"
                  value={schoolFormData.principalName}
                  onChange={(e) => setSchoolFormData({...schoolFormData, principalName: e.target.value})}
                  placeholder="Principal's name"
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowAddSchool(false);
                  resetForm();
                }}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleAddSchool}
                disabled={loading || !schoolFormData.name.trim()}
              >
                {loading ? 'Adding...' : 'Add School'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {schools.length === 0 ? (
          <div className="text-center py-12">
            <School className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No schools found</h3>
            <p className="text-muted-foreground mb-6">
              This center doesn't have any schools associated with it yet.
            </p>
            <Button onClick={() => setShowAddSchool(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add First School
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {schools.map((school) => (
              <div key={school.id}>
                {editingSchool === school.id ? (
                  // Edit Mode
                  <Card className="border-blue-200 bg-blue-50/50">
                    <CardHeader>
                      <CardTitle className="text-lg">Edit School</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor={`edit-name-${school.id}`}>School Name *</Label>
                        <Input
                          id={`edit-name-${school.id}`}
                          value={schoolFormData.name}
                          onChange={(e) => setSchoolFormData({...schoolFormData, name: e.target.value})}
                          placeholder="Enter school name"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`edit-address-${school.id}`}>Address</Label>
                        <Textarea
                          id={`edit-address-${school.id}`}
                          value={schoolFormData.address}
                          onChange={(e) => setSchoolFormData({...schoolFormData, address: e.target.value})}
                          placeholder="Enter school address"
                          rows={3}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor={`edit-phone-${school.id}`}>Phone</Label>
                          <Input
                            id={`edit-phone-${school.id}`}
                            value={schoolFormData.phone}
                            onChange={(e) => setSchoolFormData({...schoolFormData, phone: e.target.value})}
                            placeholder="Phone number"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`edit-email-${school.id}`}>Email</Label>
                          <Input
                            id={`edit-email-${school.id}`}
                            type="email"
                            value={schoolFormData.email}
                            onChange={(e) => setSchoolFormData({...schoolFormData, email: e.target.value})}
                            placeholder="Email address"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor={`edit-principal-${school.id}`}>Principal Name</Label>
                        <Input
                          id={`edit-principal-${school.id}`}
                          value={schoolFormData.principalName}
                          onChange={(e) => setSchoolFormData({...schoolFormData, principalName: e.target.value})}
                          placeholder="Principal's name"
                        />
                      </div>
                      <div className="flex space-x-2 pt-4">
                        <Button 
                          onClick={() => handleUpdateSchool(school.id)}
                          disabled={loading || !schoolFormData.name.trim()}
                        >
                          <Save className="h-4 w-4 mr-2" />
                          {loading ? 'Saving...' : 'Save Changes'}
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={handleCancelEdit}
                          disabled={loading}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Cancel
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  // View Mode
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <School className="h-5 w-5 text-green-600" />
                            <h3 className="text-lg font-semibold">{school.name}</h3>
                            <Badge variant="outline" className="text-xs">
                              {school.students?.length || 0} students
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                <span>{school.address || 'No address provided'}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                <span>{school.email || 'No email provided'}</span>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <span>{school.phone || 'No phone provided'}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <GraduationCap className="h-4 w-4 text-muted-foreground" />
                                <span>Principal: {school.principalName || 'Not specified'}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="mt-4 pt-4 border-t text-xs text-muted-foreground">
                            Created: {new Date(school.createdAt).toLocaleDateString()} • 
                            Last updated: {new Date(school.updatedAt).toLocaleDateString()}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 ml-4">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleEditSchool(school)}
                            disabled={loading}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                disabled={loading}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete School</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{school.name}"? This action cannot be undone.
                                  {school.students && school.students.length > 0 && (
                                    <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-amber-800">
                                      <strong>Warning:</strong> This school has {school.students.length} student(s) enrolled. 
                                      Deleting the school will affect these students.
                                    </div>
                                  )}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleDeleteSchool(school.id, school.name)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete School
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
