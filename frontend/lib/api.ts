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
              
              // Redirect to home page if not already there
              if (!window.location.pathname.includes('/login') && window.location.pathname !== '/') {
                window.location.href = '/';
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
    // Clear auth state immediately to prevent UI delay
    useAuthStore.getState().clearAuth();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('knowled-auth-storage');
    
    try {
      await this.client.post('/auth/logout');
    } catch (error) {
      // Continue with logout even if API call fails
      console.warn('Logout API call failed:', error);
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
    await this.client.post('/admin/assignments/student-to-educator', { 
      studentId, 
      specialEducatorId 
    });
  }

  async unassignStudentFromEducator(studentId: string, specialEducatorId: string): Promise<void> {
    await this.client.post(`/students/${studentId}/unassign`, { specialEducatorId });
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

  async assignEducators(assignmentData: {
    educatorIds: string[];
    centerIds?: string[];
    schoolIds?: string[];
  }): Promise<any> {
    const response = await this.client.post<ApiResponse<any>>('/auth/users/assign-educators', assignmentData);
    return response.data.data;
  }

  async updateUser(userId: string, userData: {
    email?: string;
    isActive?: boolean;
    profileData?: any;
  }): Promise<any> {
    const response = await this.client.put<ApiResponse<any>>(`/admin/users/${userId}`, userData);
    return response.data.data;
  }

  async deleteUser(userId: string): Promise<any> {
    const response = await this.client.delete<ApiResponse<any>>(`/admin/users/${userId}`);
    return response.data.data;
  }

  async deactivateUser(userId: string): Promise<any> {
    const response = await this.client.patch<ApiResponse<any>>(`/admin/users/${userId}/deactivate`);
    return response.data.data;
  }

  async activateUser(userId: string): Promise<any> {
    const response = await this.client.patch<ApiResponse<any>>(`/admin/users/${userId}/activate`);
    return response.data.data;
  }

  async createUser(userData: {
    email: string;
    password: string;
    role: string;
    profileData: any;
  }): Promise<any> {
    const response = await this.client.post<ApiResponse<any>>('/admin/users', userData);
    return response.data.data;
  }

  async getAllCenters(filters?: any): Promise<any> {
    const response = await this.client.get<PaginatedResponse<any>>('/admin/centers', { params: filters });
    return response.data;
  }

  async getAllSchools(filters?: any): Promise<any> {
    const response = await this.client.get<PaginatedResponse<any>>('/admin/schools', { params: filters });
    return response.data;
  }

  async getAllUsers(filters?: any): Promise<any> {
    const response = await this.client.get<PaginatedResponse<any>>('/admin/users', { params: filters });
    return response.data;
  }

  async getSystemConfig(): Promise<any> {
    const response = await this.client.get<ApiResponse<any>>('/admin/config');
    return response.data.data;
  }

  async updateSystemConfig(configData: any): Promise<any> {
    const response = await this.client.put<ApiResponse<any>>('/admin/config', configData);
    return response.data.data;
  }

  async updateSpecialEducatorProfile(profileData: any): Promise<any> {
    const response = await this.client.put<ApiResponse<any>>('/special-educators/profile', profileData);
    return response.data.data;
  }

  async updateEducatorProfile(profileData: any): Promise<any> {
    const response = await this.client.put<ApiResponse<any>>('/auth/educator/profile', profileData);
    return response.data.data;
  }

  async getAllReportsAsAdmin(params?: any): Promise<any> {
    const response = await this.client.get<PaginatedResponse<any>>('/admin/reports', { params });
    return response.data;
  }

  async getSpecialEducatorProfile(): Promise<any> {
    const response = await this.client.get<ApiResponse<any>>('/special-educators/profile');
    return response.data.data;
  }


  async getSpecialEducatorDashboard(): Promise<any> {
    const response = await this.client.get<ApiResponse<any>>('/special-educators/dashboard');
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
    const response = await this.client.post<ApiResponse<any>>('/admin/centers', centerData);
    return response.data.data;
  }

  async updateCenter(id: string, centerData: any): Promise<any> {
    const response = await this.client.put<ApiResponse<any>>(`/admin/centers/${id}`, centerData);
    return response.data.data;
  }

  async deleteCenter(id: string): Promise<void> {
    await this.client.delete(`/admin/centers/${id}`);
  }

  async linkSchoolToCenter(centerId: string, schoolData: any): Promise<any> {
    const response = await this.client.post<ApiResponse<any>>(`/centers/${centerId}/schools`, schoolData);
    return response.data.data;
  }

  async assignEducatorToCenter(centerId: string, educatorId: string, educatorType: string): Promise<any> {
    const response = await this.client.post<ApiResponse<any>>('/admin/assignments/educator-to-center', {
      centerId,
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

  async getCenterEducators(centerId: string, params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<PaginatedResponse<any>> {
    const response = await this.client.get<PaginatedResponse<any>>(`/centers/${centerId}/educators`, { params });
    return response.data;
  }

  async removeEducatorFromCenter(centerId: string, assignmentId: string): Promise<void> {
    await this.client.delete(`/admin/assignments/educator-to-center/${assignmentId}`);
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

  async getParentConsentForms(params?: {
    page?: number;
    limit?: number;
    childId?: string;
    status?: string;
  }): Promise<any> {
    const response = await this.client.get<ApiResponse<any>>('/parents/consent-forms', { params });
    return response.data.data;
  }

  async submitParentConsentForm(formId: string, formData: any): Promise<any> {
    const response = await this.client.post<ApiResponse<any>>(`/parents/consent-forms/${formId}/submit`, formData);
    return response.data.data;
  }

  async getChildReports(childId: string, params?: {
    page?: number;
    limit?: number;
    type?: string;
    status?: string;
  }): Promise<any[]> {
    const response = await this.client.get(`/children/${childId}/reports`, { params });
    return response.data.data;
  }

  async getChildIEPGoals(childId: string, params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<any[]> {
    const response = await this.client.get(`/children/${childId}/iep-goals`, { params });
    return response.data.data;
  }

  async updateParentProfile(profileData: any): Promise<any> {
    const response = await this.client.put<ApiResponse<any>>('/parents/profile', profileData);
    return response.data.data;
  }

  async getChildDetails(childId: string): Promise<any> {
    const response = await this.client.get<ApiResponse<any>>(`/parents/children/${childId}`);
    return response.data.data;
  }

  async getParentNotifications(params?: {
    page?: number;
    limit?: number;
    read?: boolean;
    type?: string;
  }): Promise<PaginatedResponse<any>> {
    const response = await this.client.get<ApiResponse<PaginatedResponse<any>>>('/parents/notifications', { params });
    return response.data.data!;
  }

  async markParentNotificationAsRead(notificationId: string): Promise<void> {
    await this.client.put(`/parents/notifications/${notificationId}/read`);
  }

  async markAllParentNotificationsAsRead(): Promise<void> {
    await this.client.put('/parents/notifications/read-all');
  }

  async getParentProfile(): Promise<any> {
    const response = await this.client.get<ApiResponse<any>>('/parents/profile');
    return response.data.data;
  }

  async rescheduleAppointment(appointmentId: string, newDateTime: string): Promise<any> {
    const response = await this.client.patch(`/appointments/${appointmentId}/reschedule`, {
      newDateTime
    });
    return response.data.data;
  }

  async getParentAppointments(params?: {
    page?: number;
    limit?: number;
    status?: string;
    childId?: string;
  }): Promise<PaginatedResponse<any>> {
    const response = await this.client.get('/parent/appointments', { params });
    return response.data;
  }

  async requestAppointment(appointmentData: {
    childId: string;
    educatorId: string;
    preferredDate: string;
    preferredTime: string;
    reason: string;
    notes?: string;
  }): Promise<any> {
    const response = await this.client.post('/parent/appointments/request', appointmentData);
    return response.data.data;
  }

  async cancelAppointment(appointmentId: string, reason?: string): Promise<any> {
    const response = await this.client.patch(`/appointments/${appointmentId}/cancel`, {
      reason
    });
    return response.data.data;
  }

  async getParentCommunications(params?: {
    page?: number;
    limit?: number;
    childId?: string;
    type?: string;
    read?: boolean;
  }): Promise<PaginatedResponse<any>> {
    const response = await this.client.get('/parent/communications', { params });
    return response.data;
  }

  async sendParentMessage(messageData: {
    recipientId: string;
    subject: string;
    content: string;
    childId?: string;
    priority?: string;
  }): Promise<any> {
    const response = await this.client.post('/parent/communications/send', messageData);
    return response.data.data;
  }

  async markParentMessageAsRead(messageId: string): Promise<any> {
    const response = await this.client.patch(`/parent/communications/${messageId}/read`);
    return response.data.data;
  }

  async replyToParentMessage(messageId: string, replyData: {
    content: string;
    attachments?: string[];
  }): Promise<any> {
    const response = await this.client.post(`/parent/communications/${messageId}/reply`, replyData);
    return response.data.data;
  }

  async getParentChildren(params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<PaginatedResponse<any>> {
    const response = await this.client.get('/parent/children', { params });
    return response.data;
  }

  async addChild(childData: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    schoolId?: string;
    centerId?: string;
    specialNeeds?: string;
    notes?: string;
  }): Promise<any> {
    const response = await this.client.post('/parent/children', childData);
    return response.data.data;
  }

  async updateChild(childId: string, childData: any): Promise<any> {
    const response = await this.client.put(`/parent/children/${childId}`, childData);
    return response.data.data;
  }

  async removeChild(childId: string): Promise<any> {
    const response = await this.client.delete(`/parent/children/${childId}`);
    return response.data.data;
  }

  async getChildProgress(childId: string, params?: {
    period?: string;
    goalId?: string;
  }): Promise<any> {
    const response = await this.client.get(`/parent/children/${childId}/progress`, { params });
    return response.data.data;
  }

  async getChildAssessments(childId: string, params?: {
    page?: number;
    limit?: number;
    type?: string;
    status?: string;
  }): Promise<PaginatedResponse<any>> {
    const response = await this.client.get(`/parent/children/${childId}/assessments`, { params });
    return response.data;
  }

  async getChildSessionNotes(childId: string, params?: {
    page?: number;
    limit?: number;
    goalId?: string;
    date?: string;
  }): Promise<PaginatedResponse<any>> {
    const response = await this.client.get(`/parent/children/${childId}/session-notes`, { params });
    return response.data;
  }

  async getChildSchedule(childId: string, params?: {
    date?: string;
    week?: string;
    month?: string;
  }): Promise<any[]> {
    const response = await this.client.get(`/parent/children/${childId}/schedule`, { params });
    return response.data.data;
  }

  async uploadParentDocument(file: File, category: string, description?: string): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);
    if (description) {
      formData.append('description', description);
    }

    const response = await this.client.post('/parents/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  }

  async deleteParentDocument(documentId: string): Promise<void> {
    await this.client.delete(`/parents/documents/${documentId}`);
  }

  // Educator API methods
  async deleteAssessment(assessmentId: string): Promise<void> {
    await this.client.delete(`/educators/assessments/${assessmentId}`);
  }

  async deleteIEPGoal(goalId: string): Promise<void> {
    await this.client.delete(`/educators/iep-goals/${goalId}`);
  }

  async updateSessionNote(noteId: string, noteData: any): Promise<any> {
    const response = await this.client.put<ApiResponse<any>>(`/educators/session-notes/${noteId}`, noteData);
    return response.data.data;
  }

  async deleteSessionNote(noteId: string): Promise<void> {
    await this.client.delete(`/educators/session-notes/${noteId}`);
  }

  async generateReport(reportData: any): Promise<any> {
    const response = await this.client.post<ApiResponse<any>>('/educators/reports/generate', reportData);
    return response.data.data;
  }

  async updateReport(reportId: string, reportData: any): Promise<any> {
    const response = await this.client.put<ApiResponse<any>>(`/educators/reports/${reportId}`, reportData);
    return response.data.data;
  }

  async deleteReport(reportId: string): Promise<void> {
    await this.client.delete(`/educators/reports/${reportId}`);
  }

  async getEducatorProfile(): Promise<any> {
    const response = await this.client.get<ApiResponse<any>>('/educators/profile');
    return response.data.data;
  }

  async getEducatorNotifications(params?: {
    page?: number;
    limit?: number;
    read?: boolean;
    type?: string;
  }): Promise<PaginatedResponse<any>> {
    const response = await this.client.get<ApiResponse<PaginatedResponse<any>>>('/educators/notifications', { params });
    return response.data.data!;
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

  async createSpecialEducator(educatorData: any): Promise<any> {
    const response = await this.client.post<ApiResponse<any>>('/super-special-educators/special-educators', educatorData);
    return response.data.data;
  }

  // School CRUD endpoints
  async createSchool(schoolData: any): Promise<any> {
    const response = await this.client.post<ApiResponse<any>>('/admin/schools', schoolData);
    return response.data.data;
  }

  async updateSchool(schoolId: string, schoolData: any): Promise<any> {
    const response = await this.client.put<ApiResponse<any>>(`/admin/schools/${schoolId}`, schoolData);
    return response.data.data;
  }

  async deleteSchool(schoolId: string): Promise<void> {
    await this.client.delete(`/admin/schools/${schoolId}`);
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

  // Single file upload method
  async uploadSingleFile(file: File, category?: string): Promise<{ filePath: string; fileId: string }> {
    const formData = new FormData();
    formData.append('file', file);
    if (category) {
      formData.append('category', category);
    }

    const response = await this.client.post('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  }

  // Legacy file upload helper (keeping for backward compatibility)
  async uploadFile(file: File, category?: string): Promise<string> {
    const fileData = await this.uploadSingleFile(file, category);
    return fileData.filePath;
  }

  // Missing API methods for hooks
  async getSpecialEducatorStudents(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }): Promise<PaginatedResponse<any>> {
    const response = await this.client.get('/special-educator/students', { params });
    return response.data;
  }

  async getSpecialEducatorStatistics(): Promise<any> {
    const response = await this.client.get('/special-educator/statistics');
    return response.data;
  }

  async getSpecialEducatorSchedule(params?: {
    date?: string;
    week?: string;
    month?: string;
  }): Promise<any[]> {
    const response = await this.client.get('/special-educators/schedule/today', { params });
    return response.data.data;
  }

  async getSpecialEducatorSessionNotes(studentId: string, params?: {
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<any>> {
    const response = await this.client.get(`/special-educator/session-notes/${studentId}`, { params });
    return response.data;
  }

  async getStudentDetailsForSpecialEducator(studentId: string): Promise<any> {
    const response = await this.client.get(`/special-educator/students/${studentId}`);
    return response.data;
  }

  async assignStudentToSpecialEducator(assignmentData: {
    studentId: string;
    specialEducatorId: string;
    notes?: string;
  }): Promise<any> {
    const response = await this.client.post('/special-educator/assign-student', assignmentData);
    return response.data;
  }

  async getSuperSpecialEducatorSpecialEducators(params?: {
    page?: number;
    limit?: number;
    search?: string;
    centerId?: string;
  }): Promise<PaginatedResponse<any>> {
    const response = await this.client.get('/super-special-educator/special-educators', { params });
    return response.data;
  }

  async getSuperSpecialEducatorStudents(params?: {
    page?: number;
    limit?: number;
    search?: string;
    centerId?: string;
    educatorId?: string;
    status?: string;
  }): Promise<PaginatedResponse<any>> {
    const response = await this.client.get('/super-special-educator/students', { params });
    return response.data;
  }

  async getEducatorSchedule(params?: {
    date?: string;
    week?: string;
    month?: string;
  }): Promise<any[]> {
    const response = await this.client.get<ApiResponse<any[]>>('/educators/schedule', { params });
    return response.data.data!;
  }

  async createScheduleEntry(entryData: any): Promise<any> {
    const response = await this.client.post<ApiResponse<any>>('/educators/schedule', entryData);
    return response.data.data;
  }

  async updateScheduleEntry(entryId: string, entryData: any): Promise<any> {
    const response = await this.client.put<ApiResponse<any>>(`/educators/schedule/${entryId}`, entryData);
    return response.data.data;
  }

  async deleteScheduleEntry(entryId: string): Promise<void> {
    await this.client.delete(`/educators/schedule/${entryId}`);
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    await this.client.put(`/educators/notifications/${notificationId}/read`);
  }

  async markAllNotificationsAsRead(): Promise<void> {
    await this.client.put('/educators/notifications/read-all');
  }

  async getFiles(params?: {
    page?: number;
    limit?: number;
    type?: string;
    category?: string;
    search?: string;
    userId?: string;
  }): Promise<PaginatedResponse<any>> {
    const response = await this.client.get('/files', { params });
    return response.data;
  }

  async getFileDetails(fileId: string): Promise<any> {
    const response = await this.client.get(`/files/${fileId}`);
    return response.data;
  }

  async deleteFile(fileId: string): Promise<void> {
    await this.client.delete(`/files/${fileId}`);
  }

  async updateFileMetadata(fileId: string, metadata: any): Promise<any> {
    const response = await this.client.put(`/files/${fileId}/metadata`, metadata);
    return response.data;
  }

  async downloadFile(fileId: string): Promise<Blob> {
    const response = await this.client.get(`/files/${fileId}/download`, {
      responseType: 'blob'
    });
    return response.data;
  }

  async getGlobalStatistics(params?: {
    period?: string;
    type?: string;
  }): Promise<any> {
    const response = await this.client.get('/admin/statistics', { params });
    return response.data.data;
  }

  async updateAppSettings(settings: any): Promise<any> {
    const response = await this.client.put('/admin/settings', settings);
    return response.data.data;
  }

  async getAppSettings(): Promise<any> {
    const response = await this.client.get('/admin/settings');
    return response.data.data;
  }

  async healthCheck(): Promise<any> {
    const response = await this.client.get('/health');
    return response.data;
  }

  async importData(importData: {
    file: File;
    type: string;
    options?: any;
  }): Promise<any> {
    const formData = new FormData();
    formData.append('file', importData.file);
    formData.append('type', importData.type);
    if (importData.options) {
      formData.append('options', JSON.stringify(importData.options));
    }

    const response = await this.client.post('/admin/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  }

  async exportData(exportParams: {
    type: string;
    format?: string;
    filters?: any;
    dateRange?: {
      from: string;
      to: string;
    };
  }): Promise<Blob> {
    const response = await this.client.post('/admin/export', exportParams, {
      responseType: 'blob',
    });
    return response.data;
  }

  async getActivityLogs(params?: {
    page?: number;
    limit?: number;
    userId?: string;
    action?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<PaginatedResponse<any>> {
    const response = await this.client.get('/admin/audit-logs', { params });
    return response.data;
  }

  async getSuperSpecialEducatorNotifications(params?: {
    page?: number;
    limit?: number;
    type?: string;
    read?: boolean;
  }): Promise<PaginatedResponse<any>> {
    const response = await this.client.get('/super-special-educator/notifications', { params });
    return response.data;
  }

  async getSuperSpecialEducatorAuditLogs(params?: any): Promise<any> {
    const response = await this.client.get<ApiResponse<any>>('/super-special-educators/audit-logs', { params });
    return response.data.data;
  }

  async getSuperSpecialEducatorAnalytics(params?: any): Promise<any> {
    const response = await this.client.get<ApiResponse<any>>('/super-special-educators/analytics', { params });
    return response.data.data;
  }

  async getSuperSpecialEducatorReports(params?: any): Promise<any> {
    const response = await this.client.get<ApiResponse<any>>('/super-special-educators/reports', { params });
    return response.data.data;
  }

  async generateSuperSpecialEducatorReport(reportData: any): Promise<any> {
    const response = await this.client.post<ApiResponse<any>>('/super-special-educators/reports/generate', reportData);
    return response.data.data;
  }

  async getSuperSpecialEducatorAssessments(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    studentId?: string;
    educatorId?: string;
    centerId?: string;
  }): Promise<PaginatedResponse<any>> {
    const response = await this.client.get('/super-special-educator/assessments', { params });
    return response.data;
  }

  async reviewAssessment(assessmentId: string, reviewData: any): Promise<any> {
    const response = await this.client.post(`/assessments/${assessmentId}/review`, reviewData);
    return response.data;
  }

  async approveAssessment(assessmentId: string): Promise<any> {
    const response = await this.client.post(`/assessments/${assessmentId}/approve`);
    return response.data;
  }

  async transferStudent(transferData: {
    studentId: string;
    fromEducatorId: string;
    toEducatorId: string;
    reason?: string;
    notes?: string;
  }): Promise<any> {
    const response = await this.client.post('/students/transfer', transferData);
    return response.data;
  }

  async updateSpecialEducator(educatorId: string, educatorData: any): Promise<any> {
    const response = await this.client.put(`/special-educators/${educatorId}`, educatorData);
    return response.data;
  }

  async deleteSpecialEducator(educatorId: string): Promise<any> {
    const response = await this.client.delete(`/special-educators/${educatorId}`);
    return response.data;
  }

  async getSuperSpecialEducatorCenters(params?: any): Promise<any> {
    const response = await this.client.get('/super-special-educators/centers', { params });
    return response.data;
  }

  // Global search methods
  async globalSearch(params?: {
    query?: string;
    type?: string;
    filters?: any;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<any>> {
    const response = await this.client.get('/admin/search', { params });
    return response.data;
  }

  async getSearchSuggestions(query: string): Promise<string[]> {
    const response = await this.client.get('/search/suggestions', { params: { query } });
    return response.data;
  }

  async getRecentSearches(): Promise<string[]> {
    const response = await this.client.get('/search/recent');
    return response.data;
  }

  async clearRecentSearches(): Promise<void> {
    await this.client.delete('/search/recent');
  }

  // Educator-specific methods
  async getAssignedStudents(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }): Promise<PaginatedResponse<any>> {
    const response = await this.client.get('/special-educators/students', { params });
    return response.data;
  }

  // Admin methods
  async getAdminDashboard(): Promise<any> {
    const response = await this.client.get('/admin/dashboard/overview');
    return response.data.data;
  }

  async getPendingApprovals(params?: {
    page?: number;
    limit?: number;
    type?: string;
  }): Promise<PaginatedResponse<any>> {
    const response = await this.client.get('/admin/approvals', { params });
    return response.data;
  }

  async getSystemAnalytics(params?: {
    period?: string;
    metrics?: string[];
  }): Promise<any> {
    const response = await this.client.get<ApiResponse<any>>('/admin/analytics', { params });
    return response.data.data;
  }

  async getAuditLogs(params?: {
    page?: number;
    limit?: number;
    userId?: string;
    action?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<PaginatedResponse<any>> {
    const response = await this.client.get('/admin/audit-logs', { params });
    return response.data;
  }

  async getAllStudentsAsAdmin(params?: {
    page?: number;
    limit?: number;
    search?: string;
    centerId?: string;
    schoolId?: string;
    status?: string;
  }): Promise<PaginatedResponse<any>> {
    const response = await this.client.get('/admin/students', { params });
    return response.data;
  }

  async getStudentDetailsAsAdmin(studentId: string): Promise<any> {
    const response = await this.client.get(`/admin/students/${studentId}`);
    return response.data;
  }

  async getEducatorAssignments(params?: {
    page?: number;
    limit?: number;
    educatorId?: string;
    centerId?: string;
  }): Promise<PaginatedResponse<any>> {
    const response = await this.client.get('/admin/educator-assignments', { params });
    return response.data;
  }

  async approveRequest(requestId: string, comments?: string): Promise<any> {
    const response = await this.client.patch<ApiResponse<any>>(`/admin/approvals/${requestId}/approve`, { comments });
    return response.data.data;
  }

  async rejectRequest(requestId: string, reason?: string): Promise<any> {
    const response = await this.client.patch<ApiResponse<any>>(`/admin/approvals/${requestId}/reject`, { reason });
    return response.data.data;
  }

  // School Viewer endpoints
  async getSchoolViewerProfile(): Promise<any> {
    const response = await this.client.get<ApiResponse<any>>('/school-viewers/profile');
    return response.data.data;
  }

  async updateSchoolViewerProfile(data: {
    fullName?: string;
    position?: string;
    phone?: string;
  }): Promise<any> {
    const response = await this.client.put<ApiResponse<any>>('/school-viewers/profile', data);
    return response.data.data;
  }

  async getSchoolViewerDashboard(): Promise<any> {
    const response = await this.client.get<ApiResponse<any>>('/school-viewers/dashboard');
    return response.data.data;
  }

  async getSchoolViewerStudents(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    grade?: string;
  }): Promise<PaginatedResponse<any>> {
    const response = await this.client.get<PaginatedResponse<any>>('/school-viewers/students', { params });
    return response.data;
  }

  async getSchoolViewerStudent(studentId: string): Promise<any> {
    const response = await this.client.get<ApiResponse<any>>(`/school-viewers/students/${studentId}`);
    return response.data.data;
  }

  async getSchoolViewerReports(params?: {
    page?: number;
    limit?: number;
    type?: string;
    status?: string;
    studentId?: string;
  }): Promise<PaginatedResponse<any>> {
    const response = await this.client.get<PaginatedResponse<any>>('/school-viewers/reports', { params });
    return response.data;
  }

  async getSchoolViewerReport(reportId: string): Promise<any> {
    const response = await this.client.get<ApiResponse<any>>(`/school-viewers/reports/${reportId}`);
    return response.data.data;
  }

  async getSchoolViewerActivity(params?: {
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<any>> {
    const response = await this.client.get<PaginatedResponse<any>>('/school-viewers/activity', { params });
    return response.data;
  }
}

export const apiClient = new ApiClient();
export default apiClient;
