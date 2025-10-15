'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Mail,
  Phone,
  UserCheck,
  Calendar,
  Edit,
  Save,
  X
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { CenterDetail } from '../../../app/admin/centers-schools/[id]/page';

interface CenterOverviewProps {
  centerDetail: CenterDetail;
  onUpdate: () => void;
}

interface CenterFormData {
  centerName: string;
  address: string;
  phone: string;
  email: string;
  contactPerson: string;
  operatingHours: string;
  description: string;
}

export default function CenterOverview({ centerDetail, onUpdate }: CenterOverviewProps) {
  const [editingCenter, setEditingCenter] = useState(false);
  const [loading, setLoading] = useState(false);
  const [centerFormData, setCenterFormData] = useState<CenterFormData>({
    centerName: centerDetail.centerProfile?.centerName || '',
    address: centerDetail.centerProfile?.address || '',
    phone: centerDetail.centerProfile?.phone || '',
    email: centerDetail.centerProfile?.email || '',
    contactPerson: centerDetail.centerProfile?.contactPerson || '',
    operatingHours: centerDetail.centerProfile?.operatingHours || '',
    description: centerDetail.centerProfile?.description || ''
  });

  const handleUpdateCenter = async () => {
    try {
      setLoading(true);
      await apiClient.updateCenter(centerDetail.id, centerFormData);
      toast({
        title: "Success",
        description: "Center updated successfully.",
      });
      setEditingCenter(false);
      onUpdate();
    } catch (error) {
      console.error('Failed to update center:', error);
      toast({
        title: "Error",
        description: "Failed to update center. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingCenter(false);
    // Reset form data to original values
    setCenterFormData({
      centerName: centerDetail.centerProfile?.centerName || '',
      address: centerDetail.centerProfile?.address || '',
      phone: centerDetail.centerProfile?.phone || '',
      email: centerDetail.centerProfile?.email || '',
      contactPerson: centerDetail.centerProfile?.contactPerson || '',
      operatingHours: centerDetail.centerProfile?.operatingHours || '',
      description: centerDetail.centerProfile?.description || ''
    });
  };

  const { centerProfile } = centerDetail;
  const schools = centerProfile?.schools || [];
  const students = centerProfile?.students || [];
  const educators = centerProfile?.assignments || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Center Information */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Center Information</CardTitle>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setEditingCenter(!editingCenter)}
            disabled={loading}
          >
            {editingCenter ? <X className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {editingCenter ? (
            <div className="space-y-4">
              <div>
                <Label htmlFor="centerName">Center Name *</Label>
                <Input
                  id="centerName"
                  value={centerFormData.centerName}
                  onChange={(e) => setCenterFormData({...centerFormData, centerName: e.target.value})}
                  placeholder="Enter center name"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={centerFormData.address}
                  onChange={(e) => setCenterFormData({...centerFormData, address: e.target.value})}
                  placeholder="Enter center address"
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={centerFormData.phone}
                    onChange={(e) => setCenterFormData({...centerFormData, phone: e.target.value})}
                    placeholder="Phone number"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={centerFormData.email}
                    onChange={(e) => setCenterFormData({...centerFormData, email: e.target.value})}
                    placeholder="Email address"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="contactPerson">Contact Person</Label>
                <Input
                  id="contactPerson"
                  value={centerFormData.contactPerson}
                  onChange={(e) => setCenterFormData({...centerFormData, contactPerson: e.target.value})}
                  placeholder="Contact person name"
                />
              </div>
              
              <div>
                <Label htmlFor="operatingHours">Operating Hours</Label>
                <Input
                  id="operatingHours"
                  value={centerFormData.operatingHours}
                  onChange={(e) => setCenterFormData({...centerFormData, operatingHours: e.target.value})}
                  placeholder="e.g., 9:00 AM - 5:00 PM"
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={centerFormData.description}
                  onChange={(e) => setCenterFormData({...centerFormData, description: e.target.value})}
                  placeholder="Center description"
                  rows={3}
                />
              </div>
              
              <div className="flex space-x-2 pt-4">
                <Button 
                  onClick={handleUpdateCenter}
                  disabled={loading || !centerFormData.centerName.trim()}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleCancelEdit}
                  disabled={loading}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {centerProfile?.email || 'No email provided'}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {centerProfile?.phone || 'No phone provided'}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {centerProfile?.contactPerson || 'No contact person'}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {centerProfile?.operatingHours || 'No operating hours specified'}
                  </span>
                </div>
              </div>
              
              {centerProfile?.description && (
                <div className="pt-2 border-t">
                  <h4 className="text-sm font-medium mb-2">Description</h4>
                  <p className="text-sm text-muted-foreground">
                    {centerProfile.description}
                  </p>
                </div>
              )}
              
              <div className="pt-2 border-t">
                <h4 className="text-sm font-medium mb-2">Center Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Created:</span>
                    <br />
                    <span>{new Date(centerDetail.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Status:</span>
                    <br />
                    <span className={centerDetail.isActive ? 'text-green-600' : 'text-red-600'}>
                      {centerDetail.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity & Statistics */}
      <div className="space-y-6">
        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{schools.length}</div>
                <div className="text-sm text-blue-600">Schools</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{students.length}</div>
                <div className="text-sm text-green-600">Students</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {educators.filter(e => e.isActive).length}
                </div>
                <div className="text-sm text-purple-600">Educators</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {students.filter(s => s.status === 'ACTIVE').length}
                </div>
                <div className="text-sm text-orange-600">Active Students</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Center created on {new Date(centerDetail.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>{schools.length} schools linked to this center</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>{students.length} students enrolled across all schools</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span>{educators.filter(e => e.isActive).length} educators currently assigned</span>
              </div>
              {schools.length === 0 && (
                <div className="flex items-center gap-2 text-sm text-amber-600">
                  <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                  <span>No schools have been added to this center yet</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
