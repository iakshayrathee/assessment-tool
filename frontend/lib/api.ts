import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { ApiResponse, PaginatedResponse, LoginRequest, LoginResponse, User } from '@/types';
import { useAuthStore } from '@/lib/store/authStore';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
      timeout: 30000, // Increased from 10s to 30s for AI operations
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
              // Get current user role before clearing auth
              const currentUser = useAuthStore.getState().user;
              const userRole = currentUser?.role;

              // Clear auth state from Zustand store
              useAuthStore.getState().clearAuth();

              // Redirect to role-specific login page if not already there
              if (!window.location.pathname.includes('/login') && window.location.pathname !== '/') {
                let loginRedirect = '/';
                if (userRole) {
                  // Map user roles to their specific login pages
                  const roleLoginMap: Record<string, string> = {
                    'ADMIN': '/login/admin',
                    'SUPER_SPECIAL_EDUCATOR': '/login/super-special-educator',
                    'SPECIAL_EDUCATOR': '/login/special-educator',
                    'CENTER': '/login/center',
                    'PARENT': '/login/parent',
                    'SCHOOL_VIEWER': '/login/school-viewer'
                  };
                  loginRedirect = roleLoginMap[userRole] || '/';
                }
                window.location.href = loginRedirect;
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

  async forgotPassword(email: string): Promise<{ message: string; previewUrl?: string }> {
    const response = await this.client.post<ApiResponse<{ message: string; previewUrl?: string }>>('/auth/forgot-password', { email });
    return response.data.data!;
  }

  async resetPassword(token: string, password: string): Promise<{ message: string }> {
    const response = await this.client.post<ApiResponse<{ message: string }>>('/auth/reset-password', { token, password });
    return response.data.data!;
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
    const response = await this.client.put<ApiResponse<any>>(`/assessments/intake/${id}/complete`);
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

  async completeAssessment(id: string): Promise<any> {
    const response = await this.client.patch<ApiResponse<any>>(`/assessments/${id}/complete`);
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

  async getIEPGoalsByStudent(studentId: string, page = 1, limit = 10, filters?: {
    domain?: string;
    status?: string;
    search?: string;
    startDateFrom?: string;
    startDateTo?: string;
    targetDateFrom?: string;
    targetDateTo?: string;
  }): Promise<PaginatedResponse<any>> {
    const params: any = { page, limit, ...filters };
    const response = await this.client.get<PaginatedResponse<any>>(`/assessments/iep-goals/student/${studentId}`, {
      params
    });
    return response.data;
  }

  async getIEPGoalsByEducator(educatorId: string, page = 1, limit = 10, filters?: {
    studentId?: string;
    domain?: string;
    status?: string;
    search?: string;
    startDateFrom?: string;
    startDateTo?: string;
    targetDateFrom?: string;
    targetDateTo?: string;
  }): Promise<PaginatedResponse<any>> {
    const params: any = { page, limit, ...filters };
    const response = await this.client.get<PaginatedResponse<any>>(`/assessments/iep-goals/educator/${educatorId}`, {
      params
    });
    return response.data;
  }

  // New IEP Document Methods
  async createIEPDocument(documentData: any): Promise<any> {
    const response = await this.client.post('/iep/documents', documentData);
    // Backend returns the document directly, not wrapped in ApiResponse
    return response.data;
  }

  async getIEPDocumentById(id: string): Promise<any> {
    const response = await this.client.get(`/iep/documents/${id}`);
    // Backend returns document directly
    return response.data;
  }

  async getIEPDocumentsByStudent(studentId: string): Promise<any[]> {
    const response = await this.client.get(`/iep/students/${studentId}/documents`);
    // Backend returns array directly
    return response.data;
  }

  async getIEPDocumentsByEducator(educatorId: string): Promise<any[]> {
    const response = await this.client.get(`/iep/educators/${educatorId}/documents`);
    // Backend returns array directly, not wrapped in ApiResponse
    return response.data;
  }

  async updateIEPDocument(id: string, updates: any): Promise<any> {
    const response = await this.client.put<ApiResponse<any>>(`/iep/documents/${id}`, updates);
    return response.data.data;
  }

  async deleteIEPDocument(id: string): Promise<void> {
    await this.client.delete(`/iep/documents/${id}`);
  }

  async addSubjectSection(iepDocumentId: string, sectionData: any): Promise<any> {
    const response = await this.client.post<ApiResponse<any>>(`/iep/documents/${iepDocumentId}/subject-sections`, sectionData);
    return response.data.data;
  }

  async addLongTermGoal(subjectSectionId: string, goalData: any): Promise<any> {
    const response = await this.client.post<ApiResponse<any>>(`/iep/subject-sections/${subjectSectionId}/long-term-goals`, goalData);
    return response.data.data;
  }

  async addShortTermGoal(subjectSectionId: string, goalData: any): Promise<any> {
    const response = await this.client.post<ApiResponse<any>>(`/iep/subject-sections/${subjectSectionId}/short-term-goals`, goalData);
    return response.data.data;
  }

  async addWeeklyEvaluation(iepDocumentId: string, evaluationData: any): Promise<any> {
    const response = await this.client.post<ApiResponse<any>>(`/iep/documents/${iepDocumentId}/weekly-evaluations`, evaluationData);
    return response.data.data;
  }

  async addWeeklyActivity(weeklyEvaluationId: string, activityData: any): Promise<any> {
    const response = await this.client.post<ApiResponse<any>>(`/iep/weekly-evaluations/${weeklyEvaluationId}/activities`, activityData);
    return response.data.data;
  }

  async getWeeklyEvaluationById(id: string): Promise<any> {
    const response = await this.client.get<ApiResponse<any>>(`/iep/weekly-evaluations/${id}`);
    return response.data.data;
  }

  async getSubjectSectionById(id: string): Promise<any> {
    const response = await this.client.get<ApiResponse<any>>(`/iep/subject-sections/${id}`);
    return response.data.data;
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
    const response = await this.client.get<ApiResponse<any[]>>(`/reports?studentId=${studentId}`);
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

  async getUserById(userId: string): Promise<any> {
    const response = await this.client.get<ApiResponse<any>>(`/admin/users/${userId}`);
    return response.data.data;
  }

  async updateUser(userId: string, userData: any): Promise<any> {
    const response = await this.client.put<ApiResponse<any>>(`/admin/users/${userId}`, userData);
    return response.data.data;
  }

  async deleteUser(userId: string): Promise<any> {
    const response = await this.client.delete<ApiResponse<any>>(`/admin/users/${userId}`);
    return response.data;
  }

  async activateUser(userId: string): Promise<any> {
    const response = await this.client.patch<ApiResponse<any>>(`/admin/users/${userId}/activate`);
    return response.data;
  }

  async deactivateUser(userId: string): Promise<any> {
    const response = await this.client.patch<ApiResponse<any>>(`/admin/users/${userId}/deactivate`);
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
    // Backend returns { success: true, data: dashboardData }
    return response.data.data || {
      assignedStudents: 0,
      pendingAssessments: 0,
      activeIEPGoals: 0,
      completedReports: 0,
      recentActivities: []
    };
  }

  async getSpecialEducatorStudents(params?: any): Promise<any> {
    const response = await this.client.get<ApiResponse<any>>('/special-educators/students', { params });
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

  async getCitiesAndCenters(): Promise<{
    cities: string[];
    centersByCity: Record<string, Array<{ id: string; name: string }>>;
  }> {
    const response = await this.client.get<ApiResponse<{
      cities: string[];
      centersByCity: Record<string, Array<{ id: string; name: string }>>;
    }>>('/centers/cities-centers');
    return response.data.data!;
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

  async linkSchoolToCenter(centerId: string, schoolId: string): Promise<any> {
    const response = await this.client.post<ApiResponse<any>>(`/centers/${centerId}/schools`, { schoolId });
    return response.data.data;
  }

  async assignEducator(centerId: string, educatorId: string, educatorType: string): Promise<any> {
    const response = await this.client.post<ApiResponse<any>>(`/centers/${centerId}/assign-educator`, {
      educatorId,
      educatorType
    });
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

  async getCenterSchools(centerId: string, params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<PaginatedResponse<any>> {
    const response = await this.client.get<PaginatedResponse<any>>(`/centers/${centerId}/schools`, { params });
    return response.data;
  }

  async getCenterEducators(centerId: string, params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<PaginatedResponse<any>> {
    const response = await this.client.get<PaginatedResponse<any>>(`/centers/${centerId}/educators`, { params });
    return response.data;
  }

  async getUnlinkedSchools(params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<PaginatedResponse<any>> {
    const response = await this.client.get<PaginatedResponse<any>>('/centers/unlinked-schools', { params });
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

  // Center Report Generation endpoints
  async listCenterSnapshots(centerId: string, params?: {
    page?: number;
    limit?: number;
    periodType?: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  }): Promise<PaginatedResponse<any>> {
    const response = await this.client.get<PaginatedResponse<any>>(`/centers/${centerId}/report-snapshots`, { params });
    return response.data;
  }

  async generateCenterSnapshot(centerId: string, params?: {
    periodType?: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
    startDate?: Date;
    endDate?: Date;
  }): Promise<any> {
    const response = await this.client.post<ApiResponse<any>>(`/centers/${centerId}/report-snapshots/generate`, params);
    return response.data.data;
  }

  async getCompleteCenterReportData(centerId: string, params?: {
    snapshotId?: string;
    periodType?: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
    startDate?: Date;
    endDate?: Date;
  }): Promise<any> {
    const response = await this.client.get<ApiResponse<any>>(`/centers/${centerId}/report-data/complete`, { params });
    return response.data.data;
  }

  // Parent Report Generation Methods
  async listParentSnapshots(studentId: string, params?: {
    page?: number;
    limit?: number;
    periodType?: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  }): Promise<PaginatedResponse<any>> {
    const response = await this.client.get<PaginatedResponse<any>>(`/parents/students/${studentId}/report-snapshots`, { params });
    return response.data;
  }

  async generateParentSnapshot(studentId: string, params?: {
    periodType?: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
    startDate?: string;
    endDate?: string;
  }): Promise<any> {
    const response = await this.client.post<ApiResponse<any>>(`/parents/students/${studentId}/report-snapshots/generate`, params);
    return response.data;
  }

  async getCompleteParentReportData(studentId: string, params?: {
    snapshotId?: string;
    periodType?: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
    startDate?: string;
    endDate?: string;
  }): Promise<any> {
    const response = await this.client.get<ApiResponse<any>>(`/parents/students/${studentId}/report-data/complete`, { params });
    return response.data.data;
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

  async generateAIReport(studentId: string, reportType: 'ASSESSMENT' | 'LESSON_PLAN' = 'ASSESSMENT'): Promise<any> {
    console.log(`Generating AI report for student: ${studentId}, type: ${reportType}`);
    const response = await this.client.post<ApiResponse<any>>(`/reports/ai/generate/${studentId}`, { reportType }, { timeout: 120000 });
    console.log('AI report generation response:', response.data);
    return response.data.report || response.data.data;
  }

  async previewAIReport(studentId: string, reportType: 'ASSESSMENT' | 'LESSON_PLAN' = 'ASSESSMENT'): Promise<any> {
    console.log(`Previewing AI report for student: ${studentId}, type: ${reportType}`);
    const response = await this.client.get<ApiResponse<any>>(`/reports/ai/preview/${studentId}?reportType=${reportType}`, { timeout: 120000 });
    console.log('AI report preview response:', response.data);
    return response.data.report || response.data.data;
  }

  async updateReport(reportId: string, reportData: any): Promise<any> {
    const response = await this.client.put<ApiResponse<any>>(`/reports/${reportId}`, reportData);
    return response.data.data;
  }

  async refineReportWithAI(reportId: string, content: string, prompt: string): Promise<{ refinedContent: string; changes: string[] }> {
    const response = await this.client.post<ApiResponse<any>>('/reports/ai/refine', {
      reportId,
      content,
      prompt
    }, { timeout: 120000 });
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

  async searchSchools(params?: {
    name?: string;
    exactMatch?: boolean;
    page?: number;
    limit?: number;
    search?: string;
    unlinkedOnly?: boolean;
  }): Promise<PaginatedResponse<any>> {
    const response = await this.client.get<PaginatedResponse<any>>('/schools/search', { params });
    return response.data;
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
    const response = await this.client.get('/special-educators/students', { params });
    return response.data;
  }

  async getSpecialEducatorStatistics(): Promise<any> {
    const response = await this.client.get('/special-educators/statistics');
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
    const response = await this.client.get(`/special-educators/session-notes/${studentId}`, { params });
    return response.data;
  }

  async getStudentDetailsForSpecialEducator(studentId: string): Promise<any> {
    const response = await this.client.get(`/special-educators/students/${studentId}`);
    return response.data;
  }

  async assignStudentToSpecialEducator(assignmentData: {
    studentId: string;
    specialEducatorId: string;
    notes?: string;
  }): Promise<any> {
    const response = await this.client.post('/special-educators/assign-student', assignmentData);
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
    // Backend returns { success: true, data: students[], pagination: {...} }
    return {
      data: response.data.data || [],
      pagination: response.data.pagination || {
        currentPage: 1,
        totalPages: 1,
        totalCount: response.data.data?.length || 0,
        hasNext: false,
        hasPrev: false
      }
    };
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

  // ==================== NEW ASSESSMENT METHODS ====================

  // Formal Assessments
  async createFormalAssessment(data: any): Promise<any> {
    const response = await this.client.post('/assessments/formal', data);
    return response.data.data;
  }

  async getFormalAssessmentsByStudent(studentId: string): Promise<any[]> {
    const response = await this.client.get(`/assessments/formal/student/${studentId}`);
    return response.data.data;
  }

  async getFormalAssessmentById(id: string): Promise<any> {
    const response = await this.client.get(`/assessments/formal/${id}`);
    return response.data.data;
  }

  async updateFormalAssessment(id: string, data: any): Promise<any> {
    const response = await this.client.put(`/assessments/formal/${id}`, data);
    return response.data.data;
  }

  async completeFormalAssessment(id: string): Promise<any> {
    const response = await this.client.put(`/assessments/formal/${id}/complete`);
    return response.data.data;
  }

  async deleteFormalAssessment(id: string): Promise<void> {
    await this.client.delete(`/assessments/formal/${id}`);
  }

  // Reading Skill Assessment
  async createReadingSkillAssessment(data: any): Promise<any> {
    const response = await this.client.post('/assessments/skill/reading', data);
    return response.data.data;
  }

  async getReadingSkillAssessmentsByStudent(studentId: string): Promise<any[]> {
    const response = await this.client.get(`/assessments/skill/reading/student/${studentId}`);
    return response.data.data;
  }

  async getReadingSkillAssessmentById(id: string): Promise<any> {
    const response = await this.client.get(`/assessments/skill/reading/${id}`);
    return response.data.data;
  }

  async updateReadingSkillAssessment(id: string, data: any): Promise<any> {
    const response = await this.client.put(`/assessments/skill/reading/${id}`, data);
    return response.data.data;
  }

  async completeReadingSkillAssessment(id: string): Promise<any> {
    const response = await this.client.put(`/assessments/skill/reading/${id}/complete`);
    return response.data.data;
  }

  // Writing Skill Assessment
  async createWritingSkillAssessment(data: any): Promise<any> {
    const response = await this.client.post('/assessments/skill/writing', data);
    return response.data.data;
  }

  async getWritingSkillAssessmentsByStudent(studentId: string): Promise<any[]> {
    const response = await this.client.get(`/assessments/skill/writing/student/${studentId}`);
    return response.data.data;
  }

  async getWritingSkillAssessmentById(id: string): Promise<any> {
    const response = await this.client.get(`/assessments/skill/writing/${id}`);
    return response.data.data;
  }

  async updateWritingSkillAssessment(id: string, data: any): Promise<any> {
    const response = await this.client.put(`/assessments/skill/writing/${id}`, data);
    return response.data.data;
  }

  async completeWritingSkillAssessment(id: string): Promise<any> {
    const response = await this.client.put(`/assessments/skill/writing/${id}/complete`);
    return response.data.data;
  }

  // Math Skill Assessment
  async createMathSkillAssessment(data: any): Promise<any> {
    const response = await this.client.post('/assessments/skill/math', data);
    return response.data.data;
  }

  async getMathSkillAssessmentsByStudent(studentId: string): Promise<any[]> {
    const response = await this.client.get(`/assessments/skill/math/student/${studentId}`);
    return response.data.data;
  }

  async getMathSkillAssessmentById(id: string): Promise<any> {
    const response = await this.client.get(`/assessments/skill/math/${id}`);
    return response.data.data;
  }

  async updateMathSkillAssessment(id: string, data: any): Promise<any> {
    const response = await this.client.put(`/assessments/skill/math/${id}`, data);
    return response.data.data;
  }

  async completeMathSkillAssessment(id: string): Promise<any> {
    const response = await this.client.put(`/assessments/skill/math/${id}/complete`);
    return response.data.data;
  }

  // ========== LONG-TERM PLANS ==========
  async createLongTermPlan(data: any): Promise<any> {
    const response = await this.client.post('/lesson-plans/long-term', data);
    return response.data.data;
  }

  async getLongTermPlanById(id: string): Promise<any> {
    const response = await this.client.get(`/lesson-plans/long-term/${id}`);
    return response.data.data;
  }

  async getLongTermPlanWithHierarchy(id: string): Promise<any> {
    const response = await this.client.get(`/lesson-plans/long-term/${id}/hierarchy`);
    return response.data.data;
  }

  async getLongTermPlansByStudent(studentId: string, page = 1, limit = 20): Promise<any> {
    const response = await this.client.get(`/lesson-plans/long-term/student/${studentId}`, {
      params: { page, limit }
    });
    return response.data.data;
  }

  async getLongTermPlansByEducator(params?: {
    page?: number;
    limit?: number;
    studentId?: string;
    status?: string;
    domain?: string;
  }): Promise<any> {
    const response = await this.client.get('/lesson-plans/long-term/educator/me', { params });
    return response.data.data;
  }

  async updateLongTermPlan(id: string, data: any): Promise<any> {
    const response = await this.client.put(`/lesson-plans/long-term/${id}`, data);
    return response.data.data;
  }

  async deleteLongTermPlan(id: string): Promise<void> {
    await this.client.delete(`/lesson-plans/long-term/${id}`);
  }

  // ========== SHORT-TERM PLANS ==========
  async createShortTermPlan(data: any): Promise<any> {
    const response = await this.client.post('/lesson-plans/short-term', data);
    return response.data.data;
  }

  async getShortTermPlanById(id: string): Promise<any> {
    const response = await this.client.get(`/lesson-plans/short-term/${id}`);
    return response.data.data;
  }

  async getShortTermPlanWithWeeklyPlans(id: string): Promise<any> {
    const response = await this.client.get(`/lesson-plans/short-term/${id}/with-weekly`);
    return response.data.data;
  }

  async getShortTermPlansByLongTermPlan(ltpId: string, page = 1, limit = 20): Promise<any> {
    const response = await this.client.get(`/lesson-plans/short-term/long-term/${ltpId}`, {
      params: { page, limit }
    });
    return response.data.data;
  }

  async getShortTermPlansByStudent(studentId: string, page = 1, limit = 20): Promise<any> {
    const response = await this.client.get(`/lesson-plans/short-term/student/${studentId}`, {
      params: { page, limit }
    });
    return response.data.data;
  }

  async getShortTermPlansByEducator(params?: {
    page?: number;
    limit?: number;
    studentId?: string;
    longTermPlanId?: string;
    status?: string;
  }): Promise<any> {
    const response = await this.client.get('/lesson-plans/short-term/educator/me', { params });
    return response.data.data;
  }

  async updateShortTermPlan(id: string, data: any): Promise<any> {
    const response = await this.client.put(`/lesson-plans/short-term/${id}`, data);
    return response.data.data;
  }

  async updateShortTermPlanProgress(id: string): Promise<any> {
    const response = await this.client.put(`/lesson-plans/short-term/${id}/progress`, {});
    return response.data.data;
  }

  async deleteShortTermPlan(id: string): Promise<void> {
    await this.client.delete(`/lesson-plans/short-term/${id}`);
  }

  // ========== WEEKLY LESSON PLANS ==========
  async createWeeklyLessonPlan(data: any): Promise<any> {
    const response = await this.client.post('/lesson-plans/weekly', data);
    return response.data.data;
  }

  async getWeeklyLessonPlanById(id: string): Promise<any> {
    const response = await this.client.get(`/lesson-plans/weekly/${id}`);
    return response.data.data;
  }

  async getWeeklyLessonPlansByShortTermPlan(stpId: string, page = 1, limit = 20): Promise<any> {
    const response = await this.client.get(`/lesson-plans/weekly/short-term/${stpId}`, {
      params: { page, limit }
    });
    return response.data.data;
  }

  async getWeeklyLessonPlansByStudent(studentId: string, page = 1, limit = 20): Promise<any> {
    const response = await this.client.get(`/lesson-plans/weekly/student/${studentId}`, {
      params: { page, limit }
    });
    return response.data.data;
  }

  async getWeeklyLessonPlansByEducator(params?: {
    page?: number;
    limit?: number;
    studentId?: string;
    shortTermPlanId?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<any> {
    const response = await this.client.get('/lesson-plans/weekly/educator/me', { params });
    return response.data.data;
  }

  async updateWeeklyLessonPlan(id: string, data: any): Promise<any> {
    const response = await this.client.put(`/lesson-plans/weekly/${id}`, data);
    return response.data.data;
  }

  async completeWeeklyLessonPlan(id: string, actualTime: number, outcome: string): Promise<any> {
    const response = await this.client.put(`/lesson-plans/weekly/${id}/complete`, {
      actualTime,
      outcome
    });
    return response.data.data;
  }

  async deleteWeeklyLessonPlan(id: string): Promise<void> {
    await this.client.delete(`/lesson-plans/weekly/${id}`);
  }

  // Homework
  async createHomework(data: any): Promise<any> {
    const response = await this.client.post('/lesson-plans/homework', data);
    return response.data.data;
  }

  async getHomeworkByStudent(studentId: string, page = 1, limit = 20): Promise<any> {
    const response = await this.client.get(`/lesson-plans/homework/student/${studentId}`, {
      params: { page, limit }
    });
    return response.data.data;
  }

  async getHomeworkByParent(page = 1, limit = 20): Promise<any> {
    const response = await this.client.get('/lesson-plans/homework/parent/me', {
      params: { page, limit }
    });
    return response.data.data;
  }

  async getHomeworkByEducator(page = 1, limit = 20): Promise<any> {
    const response = await this.client.get('/lesson-plans/homework/educator/me', {
      params: { page, limit }
    });
    return response.data.data;
  }

  async getHomeworkById(id: string): Promise<any> {
    const response = await this.client.get(`/lesson-plans/homework/${id}`);
    return response.data.data;
  }

  async updateHomework(id: string, data: any): Promise<any> {
    const response = await this.client.put(`/lesson-plans/homework/${id}`, data);
    return response.data.data;
  }

  async submitHomework(id: string, parentFeedback?: string): Promise<any> {
    const response = await this.client.put(`/lesson-plans/homework/${id}/submit`, { parentFeedback });
    return response.data.data;
  }

  async reviewHomework(id: string, educatorFeedback: string): Promise<any> {
    const response = await this.client.put(`/lesson-plans/homework/${id}/review`, { educatorFeedback });
    return response.data.data;
  }

  async completeHomework(id: string): Promise<any> {
    const response = await this.client.put(`/lesson-plans/homework/${id}/complete`);
    return response.data.data;
  }

  // Homework File Management
  async uploadHomeworkFiles(homeworkId: string, files: File[]): Promise<any> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });

    const response = await this.client.post(`/lesson-plans/homework/${homeworkId}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  }

  async getHomeworkFiles(homeworkId: string): Promise<Array<{ key: string; url: string; fileName: string }>> {
    const response = await this.client.get(`/lesson-plans/homework/${homeworkId}/files`);
    return response.data.data.files;
  }

  async deleteHomeworkFile(homeworkId: string, fileKey: string): Promise<any> {
    const encodedFileKey = encodeURIComponent(fileKey);
    const response = await this.client.delete(`/lesson-plans/homework/${homeworkId}/files/${encodedFileKey}`);
    return response.data.data;
  }

  async deleteHomework(id: string): Promise<void> {
    await this.client.delete(`/lesson-plans/homework/${id}`);
  }

  // Learning Materials
  async createLearningMaterial(data: any): Promise<any> {
    const response = await this.client.post('/lesson-plans/materials', data);
    return response.data.data;
  }

  async getLearningMaterials(params: any): Promise<any> {
    const response = await this.client.get('/lesson-plans/materials', { params });
    return response.data.data;
  }

  async getLearningMaterialsBySubjectAndGrade(subject: string, grade: number): Promise<any[]> {
    const response = await this.client.get(`/lesson-plans/materials/${subject}/${grade}`);
    return response.data.data;
  }

  async getLearningMaterialById(id: string): Promise<any> {
    const response = await this.client.get(`/lesson-plans/materials/${id}`);
    return response.data.data;
  }

  async updateLearningMaterial(id: string, data: any): Promise<any> {
    const response = await this.client.put(`/lesson-plans/materials/${id}`, data);
    return response.data.data;
  }

  async deleteLearningMaterial(id: string): Promise<void> {
    await this.client.delete(`/lesson-plans/materials/${id}`);
  }

  // Educator Document Management
  async uploadEducatorDocuments(files: File[]): Promise<any> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });

    const response = await this.client.post('/special-educators/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  }

  async getEducatorDocuments(): Promise<Array<{
    key: string;
    fileName: string;
    size: number;
    lastModified: Date;
    url: string;
  }>> {
    const response = await this.client.get('/special-educators/documents');
    return response.data.data.files;
  }

  async deleteEducatorDocument(fileKey: string): Promise<void> {
    const encodedKey = encodeURIComponent(fileKey);
    await this.client.delete(`/special-educators/documents/${encodedKey}`);
  }

  // Notification endpoints
  async getNotifications(params?: {
    page?: number;
    limit?: number;
    type?: string;
    isRead?: boolean;
    startDate?: string;
    endDate?: string;
  }): Promise<{
    success: boolean;
    data: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const response = await this.client.get('/notifications', { params });
    return response.data;
  }

  async getUnreadNotificationCount(): Promise<{ count: number }> {
    const response = await this.client.get<{ success: boolean; data: { count: number } }>('/notifications/unread-count');
    return response.data.data;
  }

  async getNotificationById(id: string): Promise<any> {
    const response = await this.client.get<{ success: boolean; data: any }>(`/notifications/${id}`);
    return response.data.data;
  }

  async markNotificationAsRead(id: string): Promise<any> {
    const response = await this.client.put<{ success: boolean; data: any }>(`/notifications/${id}/read`);
    return response.data.data;
  }

  async markAllNotificationsAsRead(): Promise<{ count: number }> {
    const response = await this.client.put<{ success: boolean; data: { count: number } }>('/notifications/mark-all-read');
    return response.data.data;
  }

  async deleteNotification(id: string): Promise<void> {
    await this.client.delete(`/notifications/${id}`);
  }

  // School Reports endpoints
  async getSchoolOverviewReport(params?: { snapshotId?: string; periodType?: string; startDate?: string; endDate?: string }): Promise<any> {
    const response = await this.client.get<ApiResponse<any>>('/school-viewers/school-reports/overview', { params });
    return response.data;
  }

  async getAssessmentCoverageReport(params?: { snapshotId?: string; periodType?: string; startDate?: string; endDate?: string }): Promise<any> {
    const response = await this.client.get<ApiResponse<any>>('/school-viewers/school-reports/assessment-coverage', { params });
    return response.data;
  }

  async getSchoolImpactReport(params?: { snapshotId?: string; periodType?: string; startDate?: string; endDate?: string }): Promise<any> {
    const response = await this.client.get<ApiResponse<any>>('/school-viewers/school-reports/school-impact', { params });
    return response.data;
  }

  async getStudentDeepAssessment(studentId: string): Promise<any> {
    const response = await this.client.get<ApiResponse<any>>(`/school-viewers/school-reports/student-deep/${studentId}`);
    return response.data;
  }

  async generateSchoolSnapshot(data: { periodType?: string; startDate?: string; endDate?: string }): Promise<any> {
    const response = await this.client.post<ApiResponse<any>>('/school-viewers/school-reports/generate-snapshot', data);
    return response.data;
  }

  async generateSchoolAINarrative(data: { snapshotId: string; narrativeType: string }): Promise<any> {
    const response = await this.client.post<ApiResponse<any>>('/school-viewers/school-reports/generate-ai-narrative', data);
    return response.data;
  }

  async listSchoolSnapshots(params?: { page?: number; limit?: number; periodType?: string }): Promise<PaginatedResponse<any>> {
    const response = await this.client.get<{ success: boolean; data: any[]; pagination: any }>('/school-viewers/school-reports/snapshots', { params });
    return {
      data: response.data.data,
      pagination: {
        currentPage: response.data.pagination.page,
        totalPages: response.data.pagination.totalPages,
        totalCount: response.data.pagination.total,
        hasNext: response.data.pagination.page < response.data.pagination.totalPages,
        hasPrev: response.data.pagination.page > 1
      }
    };
  }

  // NEW: Get complete report data for all dashboards (single API call)
  async getCompleteReportData(params?: {
    snapshotId?: string | null;
    periodType?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<any> {
    const response = await this.client.get<ApiResponse<any>>('/school-viewers/school-reports/complete-data', { params });
    return response.data;
  }

  // NEW: Get targeted students for deep assessment
  async getTargetedStudents(riskLevel?: string): Promise<any> {
    const response = await this.client.get<ApiResponse<any>>('/school-viewers/school-reports/targeted-students', {
      params: riskLevel ? { riskLevel } : undefined
    });
    return response.data;
  }

  // ── Lesson Plan CRUD Methods ───────────────────────────────────────────────

  async getLongTermPlansByStudent(studentId: string): Promise<any> {
    const response = await this.client.get<ApiResponse<any>>(`/lesson-plans/long-term/student/${studentId}`);
    return response.data.data;
  }

  async getShortTermPlansByStudent(studentId: string): Promise<any> {
    const response = await this.client.get<ApiResponse<any>>(`/lesson-plans/short-term/student/${studentId}`);
    return response.data.data;
  }

  async getWeeklyLessonPlansByStudent(studentId: string): Promise<any> {
    const response = await this.client.get<ApiResponse<any>>(`/lesson-plans/weekly/student/${studentId}`);
    return response.data.data;
  }

  async createLongTermPlan(planData: any): Promise<any> {
    const response = await this.client.post<ApiResponse<any>>('/lesson-plans/long-term', planData);
    return response.data.data;
  }

  async createShortTermPlan(planData: any): Promise<any> {
    const response = await this.client.post<ApiResponse<any>>('/lesson-plans/short-term', planData);
    return response.data.data;
  }

  async createWeeklyLessonPlan(planData: any): Promise<any> {
    const response = await this.client.post<ApiResponse<any>>('/lesson-plans/weekly', planData);
    return response.data.data;
  }

  /**
   * Save AI-generated IEP plan (LTP + STPs + WLPs) to the database as DRAFT records.
   * Returns the created LTP with its ID so STPs/WLPs can be linked.
   */
  async saveAILessonPlan(studentId: string, aiPlanData: {
    generated_ltp: any;
    generated_stps: any[];
    generated_wlps: any[];
  }): Promise<any> {
    const response = await this.client.post<ApiResponse<any>>(`/ai/iep/${studentId}/save`, aiPlanData, {
      timeout: 30000,
    });
    return response.data.data;
  }

  // ── AI Agent Methods ───────────────────────────────────────────────────────

  /**
   * Save AI-generated risk assessment to the student profile.
   */
  async saveAIRisk(studentId: string, riskLevel: string): Promise<any> {
    const response = await this.client.post<ApiResponse<any>>(`/ai/risk/${studentId}/save`, { riskLevel });
    return response.data.data;
  }

  /**
   * Get AI-powered assessment analysis for a student.
   * Returns symptom analysis, severity scores, domain profile, risk classification,
   * differential indicators, and recommended next steps.
   */
  async getAIAssessmentAnalysis(studentId: string, assessmentType: string = 'ALL'): Promise<any> {
    const response = await this.client.get<ApiResponse<any>>(`/ai/assessment/${studentId}`, {
      params: { type: assessmentType },
      timeout: 120000, // AI pipelines can take up to 2 minutes
    });
    return response.data.data;
  }

  /**
   * Generate AI-suggested IEP goals, LTP, STPs, and WLPs.
   * Optionally pass assessment analysis for better results.
   */
  async getAIIEPSuggestions(studentId: string, assessmentAnalysis?: any): Promise<any> {
    const response = await this.client.post<ApiResponse<any>>(`/ai/iep/${studentId}`, {
      assessment_analysis: assessmentAnalysis || {},
    }, {
      timeout: 120000,
    });
    return response.data.data;
  }

  /**
   * Get AI-suggested lesson plan for a specific week.
   */
  async getAILessonPlan(studentId: string, weekNumber: number = 1): Promise<any> {
    const response = await this.client.get<ApiResponse<any>>(`/ai/lesson-plan/${studentId}`, {
      params: { week: weekNumber },
      timeout: 120000,
    });
    return response.data.data;
  }

  /**
   * Get AI risk analysis for a student.
   * Returns risk classification, progress trends, early warnings, and recommendations.
   */
  async getAIStudentRisk(studentId: string): Promise<any> {
    const response = await this.client.get<ApiResponse<any>>(`/ai/risk/student/${studentId}`, {
      timeout: 60000,
    });
    return response.data.data;
  }

  /**
   * Get AI risk distribution across a school.
   */
  async getAISchoolRisk(schoolId: string): Promise<any> {
    const response = await this.client.get<ApiResponse<any>>(`/ai/risk/school/${schoolId}`, {
      timeout: 120000,
    });
    return response.data.data;
  }

  /**
   * Get AI-powered educator insights — performance summary, mentoring insights,
   * training recommendations, and student priority list.
   */
  async getAIEducatorInsights(): Promise<any> {
    const response = await this.client.get<ApiResponse<any>>('/ai/educator/insights', {
      timeout: 120000,
    });
    return response.data.data;
  }

  /**
   * Check if the AI backend is available.
   */
  async checkAIHealth(): Promise<{ available: boolean; data?: any }> {
    try {
      const response = await this.client.get<ApiResponse<any>>('/ai/health', {
        timeout: 5000,
      });
      return { available: true, data: response.data.data };
    } catch {
      return { available: false };
    }
  }

}

export const apiClient = new ApiClient();
export default apiClient;
