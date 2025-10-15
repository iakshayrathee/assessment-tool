'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Settings,
  Save,
  RefreshCw,
  Shield,
  Database,
  Bell,
  Mail,
  Smartphone,
  Globe,
  Lock,
  Users,
  FileText,
  GraduationCap,
  BookOpen,
  AlertTriangle,
  CheckCircle,
  Info
} from 'lucide-react';
import { apiClient } from '@/lib/api';

interface SystemConfig {
  platform: {
    name: string;
    version: string;
    maintenance: boolean;
  };
  features: {
    assessmentDomains: string[];
    gradeList: string[];
    syllabusList: string[];
    reportTypes: string[];
  };
  security: {
    passwordMinLength: number;
    sessionTimeout: number;
    maxLoginAttempts: number;
  };
  notifications: {
    emailEnabled: boolean;
    smsEnabled: boolean;
  };
}

export default function AdminSettingsPage() {
  const { user } = useAuth();
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('platform');

  useEffect(() => {
    loadSystemConfig();
  }, []);

  const loadSystemConfig = async () => {
    try {
      setLoading(true);
      // Since the system config endpoint is not implemented, show an error message
      setConfig(null);
      console.warn('System config endpoint not implemented in backend');
    } catch (error) {
      console.error('Failed to load system config:', error);
      setConfig(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async () => {
    if (!config) return;

    try {
      setSaving(true);
      await apiClient.updateSystemConfig(config);
      alert('System configuration updated successfully!');
    } catch (error) {
      console.error('Failed to save config:', error);
      alert('Failed to save configuration. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const updateConfig = (section: keyof SystemConfig, field: string, value: any) => {
    if (!config) return;
    
    setConfig(prev => ({
      ...prev!,
      [section]: {
        ...prev![section],
        [field]: value
      }
    }));
  };

  const updateArrayConfig = (section: keyof SystemConfig, field: string, values: string[]) => {
    if (!config) return;
    
    setConfig(prev => ({
      ...prev!,
      [section]: {
        ...prev![section],
        [field]: values
      }
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading system settings...</p>
        </div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
                <p className="text-gray-600">Configure platform settings and preferences</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">System Settings Not Available</h3>
                <p className="text-gray-600 mb-4">
                  The system settings feature is currently under development. 
                  The backend API endpoints for system configuration are not yet implemented.
                </p>
                <Button variant="outline" onClick={() => window.location.reload()}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
              <p className="text-gray-600">Configure platform settings and preferences</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={loadSystemConfig}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button onClick={handleSaveConfig} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="platform">Platform</TabsTrigger>
            <TabsTrigger value="features">Features</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          </TabsList>

          <TabsContent value="platform" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Platform Configuration
                </CardTitle>
                <CardDescription>
                  Basic platform settings and information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Platform Name
                    </label>
                    <input
                      type="text"
                      value={config?.platform.name || ''}
                      onChange={(e) => updateConfig('platform', 'name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Version
                    </label>
                    <input
                      type="text"
                      value={config?.platform.version || ''}
                      onChange={(e) => updateConfig('platform', 'version', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="maintenance"
                    checked={config?.platform.maintenance || false}
                    onChange={(e) => updateConfig('platform', 'maintenance', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="maintenance" className="text-sm font-medium text-gray-700">
                    Maintenance Mode
                  </label>
                  {config?.platform.maintenance && (
                    <Badge variant="destructive">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="features" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5" />
                    Assessment Domains
                  </CardTitle>
                  <CardDescription>
                    Configure available assessment skill domains
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {config?.features.assessmentDomains.map((domain, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={domain}
                          onChange={(e) => {
                            const newDomains = [...config.features.assessmentDomains];
                            newDomains[index] = e.target.value;
                            updateArrayConfig('features', 'assessmentDomains', newDomains);
                          }}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newDomains = config.features.assessmentDomains.filter((_, i) => i !== index);
                            updateArrayConfig('features', 'assessmentDomains', newDomains);
                          }}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      onClick={() => {
                        const newDomains = [...(config?.features.assessmentDomains || []), 'New Domain'];
                        updateArrayConfig('features', 'assessmentDomains', newDomains);
                      }}
                    >
                      Add Domain
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Grade Levels
                  </CardTitle>
                  <CardDescription>
                    Configure available grade levels
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {config?.features.gradeList.map((grade, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={grade}
                          onChange={(e) => {
                            const newGrades = [...config.features.gradeList];
                            newGrades[index] = e.target.value;
                            updateArrayConfig('features', 'gradeList', newGrades);
                          }}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newGrades = config.features.gradeList.filter((_, i) => i !== index);
                            updateArrayConfig('features', 'gradeList', newGrades);
                          }}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      onClick={() => {
                        const newGrades = [...(config?.features.gradeList || []), 'New Grade'];
                        updateArrayConfig('features', 'gradeList', newGrades);
                      }}
                    >
                      Add Grade
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Syllabus Types
                  </CardTitle>
                  <CardDescription>
                    Configure available syllabus options
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {config?.features.syllabusList.map((syllabus, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={syllabus}
                          onChange={(e) => {
                            const newSyllabus = [...config.features.syllabusList];
                            newSyllabus[index] = e.target.value;
                            updateArrayConfig('features', 'syllabusList', newSyllabus);
                          }}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newSyllabus = config.features.syllabusList.filter((_, i) => i !== index);
                            updateArrayConfig('features', 'syllabusList', newSyllabus);
                          }}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      onClick={() => {
                        const newSyllabus = [...(config?.features.syllabusList || []), 'New Syllabus'];
                        updateArrayConfig('features', 'syllabusList', newSyllabus);
                      }}
                    >
                      Add Syllabus
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security Settings
                </CardTitle>
                <CardDescription>
                  Configure security policies and authentication settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Minimum Password Length
                    </label>
                    <input
                      type="number"
                      min="6"
                      max="20"
                      value={config?.security.passwordMinLength || 6}
                      onChange={(e) => updateConfig('security', 'passwordMinLength', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Session Timeout (hours)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="720"
                      value={config?.security.sessionTimeout ? Math.floor(config.security.sessionTimeout / (60 * 60 * 1000)) : 168}
                      onChange={(e) => updateConfig('security', 'sessionTimeout', parseInt(e.target.value) * 60 * 60 * 1000)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max Login Attempts
                    </label>
                    <input
                      type="number"
                      min="3"
                      max="10"
                      value={config?.security.maxLoginAttempts || 5}
                      onChange={(e) => updateConfig('security', 'maxLoginAttempts', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notification Settings
                </CardTitle>
                <CardDescription>
                  Configure notification channels and preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-blue-600" />
                    <div>
                      <div className="font-medium">Email Notifications</div>
                      <div className="text-sm text-gray-500">Send notifications via email</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="emailEnabled"
                      checked={config?.notifications.emailEnabled || false}
                      onChange={(e) => updateConfig('notifications', 'emailEnabled', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <Badge variant={config?.notifications.emailEnabled ? 'default' : 'secondary'}>
                      {config?.notifications.emailEnabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Smartphone className="h-5 w-5 text-green-600" />
                    <div>
                      <div className="font-medium">SMS Notifications</div>
                      <div className="text-sm text-gray-500">Send notifications via SMS</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="smsEnabled"
                      checked={config?.notifications.smsEnabled || false}
                      onChange={(e) => updateConfig('notifications', 'smsEnabled', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <Badge variant={config?.notifications.smsEnabled ? 'default' : 'secondary'}>
                      {config?.notifications.smsEnabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="maintenance" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Database Maintenance
                  </CardTitle>
                  <CardDescription>
                    Database optimization and backup operations
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button variant="outline" className="w-full">
                    <Database className="h-4 w-4 mr-2" />
                    Backup Database
                  </Button>
                  <Button variant="outline" className="w-full">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Optimize Database
                  </Button>
                  <Button variant="outline" className="w-full">
                    <FileText className="h-4 w-4 mr-2" />
                    Generate System Report
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Info className="h-5 w-5" />
                    System Information
                  </CardTitle>
                  <CardDescription>
                    Current system status and information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Platform Version</span>
                    <Badge variant="outline">{config?.platform.version}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Maintenance Mode</span>
                    <Badge variant={config?.platform.maintenance ? 'destructive' : 'default'}>
                      {config?.platform.maintenance ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Email Notifications</span>
                    <Badge variant={config?.notifications.emailEnabled ? 'default' : 'secondary'}>
                      {config?.notifications.emailEnabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">SMS Notifications</span>
                    <Badge variant={config?.notifications.smsEnabled ? 'default' : 'secondary'}>
                      {config?.notifications.smsEnabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
