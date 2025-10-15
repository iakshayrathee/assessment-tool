import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { ApiResponse, PaginatedResponse, LoginRequest, LoginResponse, User } from '@/types';
import { useAuthStore } from '@/lib/store/authStore';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        // Skip token for login request
        if (config.url === '/auth/login') {
          return config;
        }
        
        const token = this.getToken();
        
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        } else {
          // Try to recover token from localStorage if it exists
          const localStorageToken = localStorage.getItem('token');
          if (localStorageToken && !useAuthStore.getState().token) {
            const userStr = localStorage.getItem('user');
            if (userStr) {
              try {
                const user = JSON.parse(userStr);
                useAuthStore.getState().setAuth(localStorageToken, user, '');
                config.headers.Authorization = `Bearer ${localStorageToken}`;
              } catch (e) {
                console.error('Failed to parse user from localStorage', e);
              }
            }
          }
        }
        
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle errors
    this.client.interceptors.response.use(
      (response) => {
        return response;
      },
      (error) => {
        // Handle 401 Unauthorized errors
        if (error.response?.status === 401) {
          // Don't clear auth on login endpoint failures
          if (error.config?.url !== '/auth/login') {
            if (typeof window !== 'undefined') {
              // Clear auth state from Zustand store
              useAuthStore.getState().clearAuth();
              
              // Redirect to login if not already there
              if (!window.location.pathname.includes('/login')) {
                window.location.href = '/login';
              }
            }
          }
        }
        return Promise.reject(error);
      }
    );
  }

  private getToken(): string | null {
    if (typeof window !== 'undefined') {
      // Try to get token from Zustand store
      const tokenFromStore = useAuthStore.getState().getToken();
      
      // If token exists in store, return it
      if (tokenFromStore) {
        return tokenFromStore;
      }
      
      // If no token in store, check localStorage directly
      const tokenFromLocalStorage = localStorage.getItem('token');
      if (tokenFromLocalStorage) {
        // Try to get user from localStorage
        const userStr = localStorage.getItem('user');
        if (userStr) {
          try {
            const user = JSON.parse(userStr);
            // Update the store with the token from localStorage
            useAuthStore.getState().setAuth(tokenFromLocalStorage, user, '');
            return tokenFromLocalStorage;
          } catch (e) {
            console.error('Error parsing user from localStorage', e);
          }
        }
        
        // If we couldn't get the user, still return the token
        return tokenFromLocalStorage;
      }
      
      // No token found anywhere
      return null;
    }
    return null;
  }

  private setToken(token: string): void {
    // This method is kept for compatibility
    // The actual token setting is done in the login method
  }

  private removeToken(): void {
    if (typeof window !== 'undefined') {
      useAuthStore.getState().clearAuth();
    }
  }

  // Auth endpoints
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await this.client.post<ApiResponse<LoginResponse>>('/auth/login', credentials);
    const { data } = response.data;
    
    if (data?.token) {
      if (typeof window !== 'undefined') {
        // Clear any existing auth data first
        useAuthStore.getState().clearAuth();
        
        // Set the new auth data
        useAuthStore.getState().setAuth(data.token, data.user, data.expiresIn);
        
        // Also set in localStorage directly as a backup
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
      }
    }
    
    return data!;
  }

  async logout(): Promise<void> {
    try {
      await this.client.post('/auth/logout');
    } catch (error) {
      // Continue with logout even if API call fails
    } finally {
      // Clear auth state from Zustand store
      useAuthStore.getState().clearAuth();
      
      // Also clear localStorage directly
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('knowled-auth-storage');
    }
  }

  async getProfile(): Promise<User> {
    const response = await this.client.get<ApiResponse<User>>('/auth/profile');
    const user = response.data.data!;
    
    // Update the user in the auth store
    if (typeof window !== 'undefined') {
      useAuthStore.getState().updateUser(user);
    }
    
    return user;
  }

  async updateProfile(profileData: any): Promise<User> {
    const response = await this.client.put<ApiResponse<User>>('/auth/profile', profileData);
    const updatedUser = response.data.data!;
    
    // Update the user in the auth store
    if (typeof window !== 'undefined') {
      useAuthStore.getState().updateUser(updatedUser);
    }
    
    return updatedUser;
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await this.client.post('/auth/change-password', { currentPassword, newPassword });
  }

  // Student endpoints
  async getStudents(params?: {
    page?: number;
    limit?: number;
    search?: string;
    centerId?: string;
    schoolId?: string;
  }): Promise<PaginatedResponse<any>> {
    try {
      const response = await this.client.get<PaginatedResponse<any>>('/students', { params });
      return response.data;
    } catch (error) {
      console.error('Failed to load students:', error);
      throw error;
    }
  }

  async getStudent(id: string): Promise<any> {
    const response = await this.client.get<ApiResponse<any>>(`/students/${id}`);
    return response.data.data;
  }

  async createStudent(studentData: any): Promise<any> {
    const response = await this.client.post<ApiResponse<any>>('/students', studentData);
    return response.data.data;
  }

  async updateStudent(id: string, studentData: any): Promise<any> {
    const response = await this.client.put<ApiResponse<any>>(`/students/${id}`, studentData);
    return response.data.data;
  }

  async deleteStudent(id: string): Promise<void> {
    await this.client.delete(`/students/${id}`);
  }

  async getStudentDashboard(id: string): Promise<any> {
    const response = await this.client.get<ApiResponse<any>>(`/students/${id}/dashboard`);
    return response.data.data;
  }

  async getStudentProgress(id: string): Promise<any> {
    const response = await this.client.get<ApiResponse<any>>(`/students/${id}/progress`);
    return response.data.data;
  }

  async assignStudentToEducator(studentId: string, specialEducatorId: string): Promise<void> {
    await this.client.post(`/students/${studentId}/assign`, { specialEducatorId });
  }

  async getStudentStats(centerId?: string, schoolId?: string): Promise<any> {
    try {
      const response = await this.client.get<ApiResponse<any>>('/students/stats', {
        params: { centerId, schoolId }
      });
      return response.data.data;
    } catch (error) {
      console.error('Failed to load student stats:', error);
      throw error;
    }
  }

  // Assessment endpoints
  async createIntakeForm(intakeData: any): Promise<any> {
    const response = await this.client.post<ApiResponse<any>>('/assessments/intake', intakeData);
    return response.data.data;
  }

  async updateIntakeForm(id: string, intakeData: any): Promise<any> {
    const response = await this.client.put<ApiResponse<any>>(`/assessments/intake/${id}`, intakeData);
    return response.data.data;
  }

  async completeIntakeForm(id: string): Promise<any> {
    const response = await this.client.post<ApiResponse<any>>(`/assessments/intake/${id}/complete`);
    return response.data.data;
  }

  async getIntakeFormByStudent(studentId: string): Promise<any> {
    const response = await this.client.get<ApiResponse<any>>(`/assessments/intake/student/${studentId}`);
    return response.data.data;
  }

  async createAssessment(assessmentData: any): Promise<any> {
    const response = await this.client.post<ApiResponse<any>>('/assessments', assessmentData);
    return response.data.data;
  }

  async updateAssessment(id: string, assessmentData: any): Promise<any> {
    const response = await this.client.put<ApiResponse<any>>(`/assessments/${id}`, assessmentData);
    return response.data.data;
  }

  async getAssessmentsByStudent(studentId: string): Promise<any[]> {
    const response = await this.client.get<ApiResponse<any[]>>(`/assessments/student/${studentId}`);
    return response.data.data!;
  }

  async getAssessmentHistory(studentId: string): Promise<{
    hasSuccessfulAssessments: boolean;
    hasDrafts: boolean;
    totalAssessments: number;
    completedAssessments: number;
    inProgressAssessments: number;
    draftAssessments: number;
    assessments: Array<{
      id: string;
      assessmentType: string;
      status: string;
      createdAt: string;
      completedAt?: string;
    }>;
  }> {
    const response = await this.client.get<ApiResponse<any>>(`/assessments/history/${studentId}`);
    return response.data.data!;
  }

  async createIEPGoal(goalData: any): Promise<any> {
    const response = await this.client.post<ApiResponse<any>>('/assessments/iep-goals', goalData);
    return response.data.data;
  }

  async updateIEPGoal(id: string, goalData: any): Promise<any> {
    const response = await this.client.put<ApiResponse<any>>(`/assessments/iep-goals/${id}`, goalData);
    return response.data.data;
  }

  async updateIEPGoalProgress(goalId: string, progress: number, notes?: string, rating?: string): Promise<void> {
    const url = `/assessments/iep-goals/${goalId}/progress`;
    await this.client.post(url, { progress, notes, rating });
  }

  async getIEPGoalsByStudent(studentId: string): Promise<any[]> {
    const response = await this.client.get<ApiResponse<any[]>>(`/assessments/iep-goals/student/${studentId}`);
    return response.data.data!;
  }

  async getIEPGoalsByEducator(educatorId: string): Promise<any[]> {
    const response = await this.client.get<ApiResponse<any[]>>(`/assessments/iep-goals/educator/${educatorId}`);
    return response.data.data!;
  }

  async createSessionNote(sessionData: any): Promise<any> {
    const response = await this.client.post<ApiResponse<any>>('/assessments/session-notes', sessionData);
    return response.data.data;
  }

  async getSessionNotesByStudent(studentId: string, page = 1, limit = 10): Promise<PaginatedResponse<any>> {
    const response = await this.client.get<PaginatedResponse<any>>(`/assessments/session-notes/student/${studentId}`, {
      params: { page, limit }
    });
    return response.data;
  }

  async createReport(reportData: any): Promise<any> {
    const response = await this.client.post<ApiResponse<any>>('/assessments/reports', reportData);
    return response.data.data;
  }

  async getReportsByStudent(studentId: string): Promise<any[]> {
    const response = await this.client.get<ApiResponse<any[]>>(`/assessments/reports/student/${studentId}`);
    return response.data.data!;
  }

  async submitReport(reportId: string, signature: string): Promise<any> {
    const response = await this.client.post<ApiResponse<any>>(`/assessments/reports/${reportId}/submit`, { signature });
    return response.data.data;
  }

  async getAssessmentStats(centerId?: string): Promise<any> {
    const response = await this.client.get<ApiResponse<any>>('/assessments/stats', {
      params: { centerId }
    });
    return response.data.data;
  }

  async getStudentAssessmentSummary(studentId: string): Promise<any> {
    const response = await this.client.get<ApiResponse<any>>(`/assessments/summary/student/${studentId}`);
    return response.data.data;
  }

  // User management endpoints
  async getUsersByRole(role: string, page = 1, limit = 10): Promise<PaginatedResponse<User>> {
    const response = await this.client.get<PaginatedResponse<User>>(`/auth/users/role/${role}`, {
      params: { page, limit }
    });
    return response.data;
  }

  async searchUsers(query: string, role?: string, page = 1, limit = 10): Promise<PaginatedResponse<User>> {
    const response = await this.client.get<PaginatedResponse<User>>('/auth/users/search', {
      params: { query, role, page, limit }
    });
    return response.data;
  }

  async getUserStats(): Promise<any> {
    const response = await this.client.get<ApiResponse<any>>('/auth/users/stats');
    return response.data.data;
  }

  // Center endpoints
  async getCenters(params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<PaginatedResponse<any>> {
    const response = await this.client.get<PaginatedResponse<any>>('/centers', { params });
    return response.data;
  }

  async getCenter(id: string): Promise<any> {
    const response = await this.client.get<ApiResponse<any>>(`/centers/${id}`);
    return response.data.data;
  }

  async getCenterDashboard(id?: string): Promise<any> {
    try {
      // Backend only has /centers/dashboard endpoint based on the routes analysis
      const response = await this.client.get<ApiResponse<any>>('/centers/dashboard');
      return response.data.data;
    } catch (error) {
      console.error('Failed to load center dashboard:', error);
      throw error;
    }
  }

  async createCenter(centerData: any): Promise<any> {
    const response = await this.client.post<ApiResponse<any>>('/centers', centerData);
    return response.data.data;
  }

  async updateCenter(id: string, centerData: any): Promise<any> {
    const response = await this.client.put<ApiResponse<any>>(`/centers/${id}`, centerData);
    return response.data.data;
  }

  async linkSchoolToCenter(centerId: string, schoolData: any): Promise<any> {
    const response = await this.client.post<ApiResponse<any>>(`/centers/${centerId}/schools`, schoolData);
    return response.data.data;
  }

  async assignEducatorToCenter(centerId: string, educatorId: string, educatorType: string): Promise<any> {
    const response = await this.client.post<ApiResponse<any>>(`/centers/${centerId}/assign-educator`, {
      educatorId,
      educatorType
    });
    return response.data.data;
  }

  async getCenterStudents(centerId: string, params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    schoolId?: string;
    hasAssignment?: boolean;
  }): Promise<PaginatedResponse<any>> {
    const response = await this.client.get<PaginatedResponse<any>>(`/centers/${centerId}/students`, { params });
    return response.data;
  }

  async getCenterSchools(centerId: string): Promise<any[]> {
    const response = await this.client.get<ApiResponse<any[]>>(`/centers/${centerId}/schools`);
    return response.data.data!;
  }

  async getCenterEducators(centerId: string): Promise<any[]> {
    const response = await this.client.get<ApiResponse<any[]>>(`/centers/${centerId}/educators`);
    return response.data.data!;
  }

  async removeEducatorFromCenter(centerId: string, assignmentId: string): Promise<void> {
    await this.client.delete(`/centers/${centerId}/assignments/${assignmentId}`);
  }

  async getCenterReports(centerId: string, params?: {
    page?: number;
    limit?: number;
    type?: string;
    status?: string;
  }): Promise<PaginatedResponse<any>> {
    const response = await this.client.get<PaginatedResponse<any>>(`/centers/${centerId}/reports`, { params });
    return response.data;
  }

  async getReport(reportId: string): Promise<any> {
    const response = await this.client.get<ApiResponse<any>>(`/reports/${reportId}`);
    return response.data.data;
  }

  async downloadReport(reportId: string): Promise<Blob> {
    const response = await this.client.get(`/reports/${reportId}/download`, {
      responseType: 'blob'
    });
    return response.data;
  }

  async getCenterCompliance(centerId: string): Promise<any> {
    const response = await this.client.get<ApiResponse<any>>(`/centers/${centerId}/compliance`);
    return response.data.data;
  }

  async getCenterOverdueReports(centerId: string, params?: {
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<any>> {
    const response = await this.client.get<PaginatedResponse<any>>(`/centers/${centerId}/overdue-reports`, { params });
    return response.data;
  }

  // Parent endpoints
  async getParentDashboard(): Promise<any> {
    const response = await this.client.get<ApiResponse<any>>('/parents/dashboard');
    return response.data.data;
  }

  async submitParentConcern(concernData: any): Promise<any> {
    const response = await this.client.post<ApiResponse<any>>('/parents/concerns', concernData);
    return response.data.data;
  }

  async getParentConcerns(params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<PaginatedResponse<any>> {
    const response = await this.client.get<PaginatedResponse<any>>('/parents/concerns', { params });
    return response.data;
  }

  async getParentDocuments(params?: {
    page?: number;
    limit?: number;
    category?: string;
  }): Promise<PaginatedResponse<any>> {
    const response = await this.client.get<PaginatedResponse<any>>('/parents/documents', { params });
    return response.data;
  }

  async getChildReports(childId: string): Promise<any[]> {
    const response = await this.client.get<ApiResponse<any[]>>(`/parents/children/${childId}/reports`);
    return response.data.data!;
  }

  async getChildIEPGoals(childId: string): Promise<any[]> {
    const response = await this.client.get<ApiResponse<any[]>>(`/parents/children/${childId}/iep-goals`);
    return response.data.data!;
  }

  async updateParentProfile(profileData: any): Promise<any> {
    const response = await this.client.put<ApiResponse<any>>('/parents/profile', profileData);
    return response.data.data;
  }

  async getChildDetails(childId: string): Promise<any> {
    const response = await this.client.get<ApiResponse<any>>(`/parents/children/${childId}`);
    return response.data.data!;
  }

  // File upload endpoints
  async uploadSingleFile(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await this.client.post<ApiResponse<any>>('/files/upload/single', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data.data;
  }

  async uploadMultipleFiles(files: File[]): Promise<any> {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));

    const response = await this.client.post<ApiResponse<any>>('/files/upload/multiple', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data.data;
  }

  async uploadAssessmentWorksheets(files: File[], studentId: string, assessmentId: string, domain: string): Promise<any> {
    const formData = new FormData();
    files.forEach(file => formData.append('worksheets', file));
    formData.append('studentId', studentId);
    formData.append('assessmentId', assessmentId);
    formData.append('domain', domain);

    const response = await this.client.post<ApiResponse<any>>('/files/upload/worksheets', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data.data;
  }

  async uploadParentDocument(file: File, category?: string, description?: string): Promise<any> {
    // First upload the file to get file metadata
    const uploadedFile = await this.uploadSingleFile(file);
    
    // Then create the parent document record
    const documentData = {
      fileName: uploadedFile.fileName || file.name,
      filePath: uploadedFile.filePath,
      fileType: uploadedFile.fileType || file.type,
      fileSize: uploadedFile.fileSize || file.size,
      category: category || 'GENERAL',
      description: description || ''
    };

    const response = await this.client.post<ApiResponse<any>>('/parents/documents', documentData);
    return response.data.data;
  }

  async downloadFile(type: string, fileId: string): Promise<Blob> {
    const response = await this.client.get(`/files/download/${type}/${fileId}`, {
      responseType: 'blob'
    });
    return response.data;
  }

  async deleteFile(type: string, fileId: string): Promise<void> {
    await this.client.delete(`/files/${type}/${fileId}`);
  }

  // Admin endpoints
  async getAdminDashboard(): Promise<any> {
    try {
      const response = await this.client.get<ApiResponse<any>>('/admin/dashboard/overview');
      return response.data.data;
    } catch (error) {
      console.error('Failed to load admin dashboard:', error);
      throw error; // Don't fallback to mock data
    }
  }

  async getAllUsers(params?: {
    page?: number;
    limit?: number;
    role?: string;
    search?: string;
    status?: string;
  }): Promise<PaginatedResponse<any>> {
    try {
      const response = await this.client.get<PaginatedResponse<any>>('/admin/users', { params });
      return response.data;
    } catch (error) {
      console.error('Failed to load users:', error);
      throw error;
    }
  }

  async createUser(userData: any): Promise<any> {
    const response = await this.client.post<ApiResponse<any>>('/admin/users', userData);
    return response.data.data;
  }

  async updateUser(userId: string, userData: any): Promise<any> {
    const response = await this.client.put<ApiResponse<any>>(`/admin/users/${userId}`, userData);
    return response.data.data;
  }

  async deleteUser(userId: string): Promise<void> {
    await this.client.delete(`/admin/users/${userId}`);
  }

  async activateUser(userId: string): Promise<void> {
    await this.client.patch(`/admin/users/${userId}/activate`);
  }

  async deactivateUser(userId: string): Promise<void> {
    await this.client.patch(`/admin/users/${userId}/deactivate`);
  }

  async getAllCenters(params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<PaginatedResponse<any>> {
    // Use the regular centers endpoint since admin-specific endpoint doesn't exist
    const response = await this.client.get<PaginatedResponse<any>>('/centers', { params });
    return response.data;
  }

  async createCenterAsAdmin(centerData: any): Promise<any> {
    const response = await this.client.post<ApiResponse<any>>('/admin/centers', centerData);
    return response.data.data;
  }

  async updateCenterAsAdmin(centerId: string, centerData: any): Promise<any> {
    const response = await this.client.put<ApiResponse<any>>(`/admin/centers/${centerId}`, centerData);
    return response.data.data;
  }

  async deleteCenterAsAdmin(centerId: string): Promise<void> {
    await this.client.delete(`/admin/centers/${centerId}`);
  }

  async getAllSchools(params?: {
    page?: number;
    limit?: number;
    search?: string;
    centerId?: string;
  }): Promise<PaginatedResponse<any>> {
    // Since there's no admin schools endpoint, we'll need to create a mock response
    // or implement the endpoint. For now, return mock data structure.
    throw new Error('Admin schools endpoint not implemented in backend');
  }

  async createSchoolAsAdmin(schoolData: any): Promise<any> {
    const response = await this.client.post<ApiResponse<any>>('/admin/schools', schoolData);
    return response.data.data;
  }

  async updateSchoolAsAdmin(schoolId: string, schoolData: any): Promise<any> {
    const response = await this.client.put<ApiResponse<any>>(`/admin/schools/${schoolId}`, schoolData);
    return response.data.data;
  }

  async deleteSchoolAsAdmin(schoolId: string): Promise<void> {
    await this.client.delete(`/admin/schools/${schoolId}`);
  }

  async assignEducatorToCenterAsAdmin(assignmentData: {
    centerId: string;
    educatorId: string;
    educatorType: string;
  }): Promise<any> {
    const response = await this.client.post<ApiResponse<any>>('/admin/assignments/educator-to-center', assignmentData);
    return response.data.data;
  }

  async removeEducatorFromCenterAsAdmin(assignmentId: string): Promise<void> {
    await this.client.delete(`/admin/assignments/educator-to-center/${assignmentId}`);
  }

  async assignStudentToEducatorAsAdmin(assignmentData: {
    studentId: string;
    specialEducatorId: string;
  }): Promise<any> {
    const response = await this.client.post<ApiResponse<any>>('/admin/assignments/student-to-educator', assignmentData);
    return response.data.data;
  }

  async getPendingApprovals(params?: {
    page?: number;
    limit?: number;
    type?: string;
  }): Promise<PaginatedResponse<any>> {
    const response = await this.client.get<PaginatedResponse<any>>('/admin/approvals', { params });
    return response.data;
  }

  async approveRequest(requestId: string, comments?: string): Promise<void> {
    await this.client.patch(`/admin/approvals/${requestId}/approve`, { comments });
  }

  async rejectRequest(requestId: string, reason?: string): Promise<void> {
    await this.client.patch(`/admin/approvals/${requestId}/reject`, { reason });
  }

  async getAllStudentsAsAdmin(params?: {
    page?: number;
    limit?: number;
    search?: string;
    centerId?: string;
    status?: string;
  }): Promise<PaginatedResponse<any>> {
    const response = await this.client.get<PaginatedResponse<any>>('/admin/students', { params });
    return response.data;
  }

  async getStudentDetailsAsAdmin(studentId: string): Promise<any> {
    const response = await this.client.get<ApiResponse<any>>(`/admin/students/${studentId}`);
    return response.data.data;
  }

  async getAllReportsAsAdmin(params?: {
    page?: number;
    limit?: number;
    type?: string;
    status?: string;
    centerId?: string;
  }): Promise<PaginatedResponse<any>> {
    const response = await this.client.get<PaginatedResponse<any>>('/admin/reports', { params });
    return response.data;
  }

  async getSystemAnalytics(period?: string): Promise<any> {
    try {
      const response = await this.client.get<ApiResponse<any>>('/admin/analytics', {
        params: { period }
      });
      return response.data.data;
    } catch (error) {
      console.error('Failed to load analytics:', error);
      throw error;
    }
  }

  async getAuditLogs(params?: {
    page?: number;
    limit?: number;
    action?: string;
    userId?: string;
    resource?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<PaginatedResponse<any>> {
    // Audit logs endpoint not implemented in backend
    throw new Error('Audit logs endpoint not implemented in backend');
  }

  async globalSearch(query: string, type?: string): Promise<any> {
    const response = await this.client.get<ApiResponse<any>>('/admin/search', {
      params: { query, type }
    });
    return response.data.data;
  }

  async getSystemConfig(): Promise<any> {
    // System config endpoint not implemented in backend
    throw new Error('System config endpoint not implemented in backend');
  }

  async updateSystemConfig(configData: any): Promise<any> {
    // System config endpoint not implemented in backend
    throw new Error('System config endpoint not implemented in backend');
  }

  async exportData(exportData: {
    type: string;
    format: string;
    filters?: any;
  }): Promise<any> {
    const response = await this.client.post<ApiResponse<any>>('/admin/export', exportData);
    return response.data.data;
  }

  // Special Educator endpoints
  async checkSpecialEducatorToken(): Promise<any> {
    console.log('\n🎯 FRONTEND API: checkSpecialEducatorToken START');
    console.log('🎯 Endpoint: /special-educators/check-token');
    console.log('🎯 Method: GET');
    
    try {
      const response = await this.client.get<ApiResponse<any>>('/special-educators/check-token');
      console.log('✅ checkSpecialEducatorToken SUCCESS');
      console.log('🎯 Response status:', response.status);
      console.log('🎯 Response data:', response.data);
      return response.data.data;
    } catch (error: any) {
      console.error('❌ checkSpecialEducatorToken FAILED');
      console.error('🎯 Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      throw error;
    }
  }

  async getSpecialEducatorDashboard(): Promise<any> {
    console.log('\n🎯 FRONTEND API: getSpecialEducatorDashboard START');
    console.log('🎯 Endpoint: /special-educators/dashboard');
    console.log('🎯 Method: GET');
    
    try {
      const response = await this.client.get<ApiResponse<any>>('/special-educators/dashboard');
      console.log('✅ getSpecialEducatorDashboard SUCCESS');
      console.log('🎯 Response status:', response.status);
      console.log('🎯 Response data:', response.data);
      return response.data.data;
    } catch (error: any) {
      console.error('❌ getSpecialEducatorDashboard FAILED');
      console.error('🎯 Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      throw error;
    }
  }

  async getSpecialEducatorProfile(): Promise<any> {
    console.log('\n🎯 FRONTEND API: getSpecialEducatorProfile START');
    console.log('🎯 Endpoint: /special-educators/profile');
    console.log('🎯 Method: GET');
    
    try {
      const response = await this.client.get<ApiResponse<any>>('/special-educators/profile');
      console.log('✅ getSpecialEducatorProfile SUCCESS');
      console.log('🎯 Response status:', response.status);
      console.log('🎯 Response data:', response.data);
      return response.data.data;
    } catch (error: any) {
      console.error('❌ getSpecialEducatorProfile FAILED');
      console.error('🎯 Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      throw error;
    }
  }

  async updateSpecialEducatorProfile(profileData: any): Promise<any> {
    console.log('\n🎯 FRONTEND API: updateSpecialEducatorProfile START');
    console.log('🎯 Endpoint: /special-educators/profile');
    console.log('🎯 Method: PUT');
    console.log('🎯 Profile data:', profileData);
    
    try {
      const response = await this.client.put<ApiResponse<any>>('/special-educators/profile', profileData);
      console.log('✅ updateSpecialEducatorProfile SUCCESS');
      console.log('🎯 Response status:', response.status);
      console.log('🎯 Response data:', response.data);
      return response.data.data;
    } catch (error: any) {
      console.error('❌ updateSpecialEducatorProfile FAILED');
      console.error('🎯 Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      throw error;
    }
  }

  async getAssignedStudents(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }): Promise<PaginatedResponse<any>> {
    console.log('\n🎯 FRONTEND API: getAssignedStudents START');
    console.log('🎯 Endpoint: /special-educators/students');
    console.log('🎯 Method: GET');
    console.log('🎯 Params:', params);
    
    try {
      const response = await this.client.get<PaginatedResponse<any>>('/special-educators/students', { params });
      console.log('✅ getAssignedStudents SUCCESS');
      console.log('🎯 Response status:', response.status);
      console.log('🎯 Response data:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ getAssignedStudents FAILED');
      console.error('🎯 Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      throw error;
    }
  }

  async getStudentDetailsForEducator(studentId: string): Promise<any> {
    const response = await this.client.get<ApiResponse<any>>(`/special-educators/students/${studentId}`);
    return response.data.data;
  }

  async getEducatorRecentActivities(limit?: number): Promise<any[]> {
    const response = await this.client.get<ApiResponse<any[]>>('/special-educators/activities', {
      params: { limit }
    });
    return response.data.data!;
  }

  async getEducatorStatistics(): Promise<any> {
    const response = await this.client.get<ApiResponse<any>>('/special-educators/statistics');
    return response.data.data;
  }

  async getTodaysSchedule(): Promise<any[]> {
    const response = await this.client.get<ApiResponse<any[]>>('/special-educators/schedule/today');
    return response.data.data!;
  }

  async createEducatorSessionNote(sessionData: any): Promise<any> {
    const response = await this.client.post<ApiResponse<any>>('/special-educators/session-notes', sessionData);
    return response.data.data;
  }

  async getEducatorSessionNotes(studentId: string, params?: {
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<any>> {
    const response = await this.client.get<PaginatedResponse<any>>(`/special-educators/students/${studentId}/session-notes`, { params });
    return response.data;
  }

  // Super Special Educator endpoints
  async getSuperSpecialEducatorDashboard(): Promise<any> {
    const response = await this.client.get<ApiResponse<any>>('/super-special-educators/dashboard');
    return response.data.data;
  }

  async getSuperSpecialEducatorProfile(): Promise<any> {
    const response = await this.client.get<ApiResponse<any>>('/super-special-educators/profile');
    return response.data.data;
  }

  async updateSuperSpecialEducatorProfile(profileData: any): Promise<any> {
    const response = await this.client.put<ApiResponse<any>>('/super-special-educators/profile', profileData);
    return response.data.data;
  }

  async getAssignedCenters(params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<PaginatedResponse<any>> {
    const response = await this.client.get<PaginatedResponse<any>>('/super-special-educators/centers', { params });
    return response.data;
  }

  async getAssignedEducators(params?: {
    page?: number;
    limit?: number;
    search?: string;
    centerId?: string;
  }): Promise<PaginatedResponse<any>> {
    const response = await this.client.get<PaginatedResponse<any>>('/super-special-educators/educators', { params });
    return response.data;
  }

  async getStudentsUnderSupervision(params?: {
    page?: number;
    limit?: number;
    search?: string;
    centerId?: string;
    educatorId?: string;
    status?: string;
  }): Promise<PaginatedResponse<any>> {
    const response = await this.client.get<PaginatedResponse<any>>('/super-special-educators/students', { params });
    return response.data;
  }

  async getPendingReviews(params?: {
    page?: number;
    limit?: number;
    type?: string;
    priority?: string;
  }): Promise<PaginatedResponse<any>> {
    const response = await this.client.get<PaginatedResponse<any>>('/super-special-educators/reviews/pending', { params });
    return response.data;
  }

  async reviewReport(reportId: string, action: 'APPROVE' | 'REJECT', comments?: string, recommendations?: string): Promise<any> {
    const response = await this.client.post<ApiResponse<any>>(`/super-special-educators/reviews/${reportId}`, {
      action,
      comments,
      recommendations
    });
    return response.data.data;
  }

  async getFlaggedCases(params?: {
    page?: number;
    limit?: number;
    severity?: string;
    centerId?: string;
  }): Promise<PaginatedResponse<any>> {
    const response = await this.client.get<PaginatedResponse<any>>('/super-special-educators/flagged-cases', { params });
    return response.data;
  }

  async createTrainingLog(logData: any): Promise<any> {
    const response = await this.client.post<ApiResponse<any>>('/super-special-educators/training-logs', logData);
    return response.data.data;
  }

  async getTrainingLogs(params?: {
    page?: number;
    limit?: number;
    educatorId?: string;
  }): Promise<PaginatedResponse<any>> {
    const response = await this.client.get<PaginatedResponse<any>>('/super-special-educators/training-logs', { params });
    return response.data;
  }

  async getCrossCenterComparison(period?: string, metrics?: string[]): Promise<any> {
    const response = await this.client.get<ApiResponse<any>>('/super-special-educators/analytics/cross-center', {
      params: { period, metrics: metrics?.join(',') }
    });
    return response.data.data;
  }

  async getPerformanceAnalytics(period?: string, centerId?: string): Promise<any> {
    const response = await this.client.get<ApiResponse<any>>('/super-special-educators/analytics/performance', {
      params: { period, centerId }
    });
    return response.data.data;
  }

  async getSuperSpecialEducatorActivities(limit?: number, type?: string): Promise<any[]> {
    const response = await this.client.get<ApiResponse<any[]>>('/super-special-educators/activities', {
      params: { limit, type }
    });
    return response.data.data!;
  }

  // School CRUD endpoints
  async updateSchool(schoolId: string, schoolData: any): Promise<any> {
    const response = await this.client.put<ApiResponse<any>>(`/schools/${schoolId}`, schoolData);
    return response.data.data;
  }

  async deleteSchool(schoolId: string): Promise<void> {
    await this.client.delete(`/schools/${schoolId}`);
  }

  async getSchool(schoolId: string): Promise<any> {
    const response = await this.client.get<ApiResponse<any>>(`/schools/${schoolId}`);
    return response.data.data;
  }

  async activateSchool(schoolId: string): Promise<void> {
    await this.client.patch(`/schools/${schoolId}/activate`);
  }

  async deactivateSchool(schoolId: string): Promise<void> {
    await this.client.patch(`/schools/${schoolId}/deactivate`);
  }

  // Legacy file upload helper (keeping for backward compatibility)
  async uploadFile(file: File, category?: string): Promise<string> {
    const fileData = await this.uploadSingleFile(file);
    return fileData.filePath;
  }

}

export const apiClient = new ApiClient();
export default apiClient;
