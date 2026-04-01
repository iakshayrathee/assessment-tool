import { StudentService } from '../../../services/StudentService';
import { StudentRepository } from '../../../repositories/StudentRepository';

jest.mock('../../../repositories/StudentRepository');

const MockedStudentRepository = StudentRepository as jest.MockedClass<typeof StudentRepository>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const makeStudent = (overrides: Record<string, any> = {}) => ({
  id: 'student-1',
  fullName: 'Rohan Sharma',
  dateOfBirth: new Date('2010-05-20'),
  gender: 'MALE',
  grade: '5',
  centerId: 'center-1',
  parentId: 'parent-1',
  status: 'ACTIVE',
  createdAt: new Date(),
  iepGoals: [],
  sessionNotes: [],
  ...overrides
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('StudentService', () => {
  let service: StudentService;
  let repo: any; // jest.Mocked<StudentRepository> — typed as any to allow prismaClient attachment

  beforeEach(() => {
    MockedStudentRepository.mockClear();
    service = new StudentService({} as any);
    repo = MockedStudentRepository.mock.instances[0];

    // Attach a mock prismaClient to the repo instance (StudentService accesses it directly)
    repo.prismaClient = {
      centerProfile: { findUnique: jest.fn() },
      user: { findUnique: jest.fn() },
      parentProfile: {
        create: jest.fn(),
        update: jest.fn(),
        findUnique: jest.fn()
      },
      studentAssignment: {
        findUnique: jest.fn(),
        update: jest.fn(),
        create: jest.fn()
      },
      student: { findUnique: jest.fn() },
      specialEducatorProfile: { findUnique: jest.fn() },
      schoolViewerProfile: { findUnique: jest.fn() },
      iEPDocument: { findMany: jest.fn().mockResolvedValue([]) },
      assessment: { findMany: jest.fn().mockResolvedValue([]) },
      weeklyLessonPlan: { findMany: jest.fn().mockResolvedValue([]) },
      report: { findMany: jest.fn().mockResolvedValue([]) }
    };
  });

  // ────────────────────────────────────────────────────────────────────────────
  // createStudent
  // ────────────────────────────────────────────────────────────────────────────

  describe('createStudent', () => {
    it('throws on missing required fields', async () => {
      await expect(
        service.createStudent({} as any)
      ).rejects.toThrow('Missing required fields');
    });

    it('throws when the center does not exist', async () => {
      repo.prismaClient.centerProfile.findUnique.mockResolvedValue(null);

      await expect(
        service.createStudent({
          fullName: 'Ali',
          dateOfBirth: new Date('2010-01-01'),
          centerId: 'bad-center-id',
          gender: 'MALE',
          grade: '3'
        } as any)
      ).rejects.toThrow('not found');
    });

    it('throws when dateOfBirth is in the future', async () => {
      repo.prismaClient.centerProfile.findUnique.mockResolvedValue({ id: 'center-1' });

      await expect(
        service.createStudent({
          fullName: 'Ali',
          dateOfBirth: new Date('2099-01-01'),
          centerId: 'center-1',
          gender: 'MALE',
          grade: '3'
        } as any)
      ).rejects.toThrow('Date of birth cannot be in the future');
    });

    it('throws when parentName/parentPhone are given without parentPassword', async () => {
      repo.prismaClient.centerProfile.findUnique.mockResolvedValue({ id: 'center-1' });

      await expect(
        service.createStudent({
          fullName: 'Ali',
          dateOfBirth: new Date('2010-01-01'),
          centerId: 'center-1',
          gender: 'MALE',
          grade: '3',
          parentName: 'Parent Name',
          parentPhone: '9999999999'
          // parentPassword intentionally omitted
        } as any)
      ).rejects.toThrow('Parent password is required');
    });

    it('creates and returns a student when all data is valid', async () => {
      const student = makeStudent();
      repo.prismaClient.centerProfile.findUnique.mockResolvedValue({ id: 'center-1' });
      repo.create.mockResolvedValue(student);

      const result = await service.createStudent({
        fullName: 'Ali Khan',
        dateOfBirth: new Date('2010-05-20'),
        centerId: 'center-1',
        gender: 'MALE',
        grade: '5',
        parentId: 'parent-1'
      } as any);

      expect(result.fullName).toBe('Ali Khan');
      expect(repo.create).toHaveBeenCalled();
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // getStudentById
  // ────────────────────────────────────────────────────────────────────────────

  describe('getStudentById', () => {
    it('throws when student does not exist', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.getStudentById('bad-id')).rejects.toThrow('Student not found');
    });

    it('returns the student when found', async () => {
      const student = makeStudent();
      repo.findById.mockResolvedValue(student);
      await expect(service.getStudentById('student-1')).resolves.toEqual(student);
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // updateStudent
  // ────────────────────────────────────────────────────────────────────────────

  describe('updateStudent', () => {
    it('throws when student does not exist', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.updateStudent('bad-id', {})).rejects.toThrow('Student not found');
    });

    it('throws if the updated dateOfBirth is in the future', async () => {
      repo.findById.mockResolvedValue(makeStudent());
      await expect(
        service.updateStudent('student-1', { dateOfBirth: new Date('2099-01-01') })
      ).rejects.toThrow('Date of birth cannot be in the future');
    });

    it('calls repository update on valid data', async () => {
      const student = makeStudent();
      repo.findById.mockResolvedValue(student);
      repo.update.mockResolvedValue({ ...student, grade: '6' });

      const result = await service.updateStudent('student-1', { grade: '6' });
      expect(result.grade).toBe('6');
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // deleteStudent
  // ────────────────────────────────────────────────────────────────────────────

  describe('deleteStudent', () => {
    it('throws when student does not exist', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.deleteStudent('none')).rejects.toThrow('Student not found');
    });

    it('calls repository delete when student exists', async () => {
      repo.findById.mockResolvedValue(makeStudent());
      repo.delete.mockResolvedValue(undefined);

      await service.deleteStudent('student-1');
      expect(repo.delete).toHaveBeenCalledWith('student-1');
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // searchStudents
  // ────────────────────────────────────────────────────────────────────────────

  describe('searchStudents', () => {
    it('throws when query is too short', async () => {
      await expect(service.searchStudents('a')).rejects.toThrow(
        'at least 2 characters'
      );
    });

    it('throws on empty query', async () => {
      await expect(service.searchStudents('')).rejects.toThrow('at least 2 characters');
    });

    it('calls repository search for valid queries', async () => {
      repo.search.mockResolvedValue({ students: [], total: 0 });
      await service.searchStudents('Ali');
      expect(repo.search).toHaveBeenCalledWith('Ali', undefined, undefined, 1, 10);
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // getStudentProgress
  // ────────────────────────────────────────────────────────────────────────────

  describe('getStudentProgress', () => {
    it('returns zero progress when no IEP goals exist', async () => {
      repo.findById.mockResolvedValue(makeStudent({ iepGoals: [] }));
      const result = await service.getStudentProgress('student-1');
      expect(result.overallProgress).toBe(0);
      expect(result.domainProgress).toEqual({});
    });

    it('calculates correct average progress from goals', async () => {
      repo.findById.mockResolvedValue(
        makeStudent({
          iepGoals: [
            { id: 'g1', domain: 'Communication', progressPercent: 60, status: 'IN_PROGRESS', updatedAt: new Date(), goalStatement: 'Goal 1' },
            { id: 'g2', domain: 'Communication', progressPercent: 80, status: 'IN_PROGRESS', updatedAt: new Date(), goalStatement: 'Goal 2' }
          ]
        })
      );
      const result = await service.getStudentProgress('student-1');
      expect(result.overallProgress).toBe(70);
      expect(result.domainProgress['Communication']).toBe(70);
    });

    it('separates domain progress correctly', async () => {
      repo.findById.mockResolvedValue(
        makeStudent({
          iepGoals: [
            { id: 'g1', domain: 'Reading', progressPercent: 50, status: 'IN_PROGRESS', updatedAt: new Date(), goalStatement: 'R1' },
            { id: 'g2', domain: 'Math', progressPercent: 100, status: 'ACHIEVED', updatedAt: new Date(), goalStatement: 'M1' }
          ]
        })
      );
      const result = await service.getStudentProgress('student-1');
      expect(result.domainProgress['Reading']).toBe(50);
      expect(result.domainProgress['Math']).toBe(100);
      expect(result.goalAchievements).toHaveLength(1);
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // assignStudentToEducator
  // ────────────────────────────────────────────────────────────────────────────

  describe('assignStudentToEducator', () => {
    it('throws when student does not exist', async () => {
      repo.prismaClient.student.findUnique.mockResolvedValue(null);

      await expect(
        service.assignStudentToEducator('bad-student', 'edu-1')
      ).rejects.toThrow('not found');
    });

    it('throws when special educator does not exist', async () => {
      repo.prismaClient.student.findUnique.mockResolvedValue({ id: 'student-1' });
      repo.prismaClient.specialEducatorProfile.findUnique.mockResolvedValue(null);

      await expect(
        service.assignStudentToEducator('student-1', 'bad-edu')
      ).rejects.toThrow('not found');
    });

    it('creates a new assignment when none exists', async () => {
      repo.prismaClient.student.findUnique.mockResolvedValue({ id: 'student-1' });
      repo.prismaClient.specialEducatorProfile.findUnique.mockResolvedValue({ id: 'edu-1' });
      repo.prismaClient.studentAssignment.findUnique.mockResolvedValue(null);
      repo.prismaClient.studentAssignment.create.mockResolvedValue({ id: 'assign-1' });

      await service.assignStudentToEducator('student-1', 'edu-1');

      expect(repo.prismaClient.studentAssignment.create).toHaveBeenCalled();
    });

    it('reactivates an inactive existing assignment instead of creating a new one', async () => {
      repo.prismaClient.student.findUnique.mockResolvedValue({ id: 'student-1' });
      repo.prismaClient.specialEducatorProfile.findUnique.mockResolvedValue({ id: 'edu-1' });
      repo.prismaClient.studentAssignment.findUnique.mockResolvedValue({
        id: 'existing-assign',
        isActive: false
      });
      repo.prismaClient.studentAssignment.update.mockResolvedValue({});

      await service.assignStudentToEducator('student-1', 'edu-1');

      expect(repo.prismaClient.studentAssignment.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { isActive: true } })
      );
      expect(repo.prismaClient.studentAssignment.create).not.toHaveBeenCalled();
    });
  });
});
