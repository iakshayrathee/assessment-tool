import { queryKeys, invalidationPatterns } from '@/lib/queryKeys';

describe('queryKeys', () => {
  describe('auth', () => {
    it('returns base auth key', () => {
      expect(queryKeys.auth.all).toEqual(['auth']);
    });

    it('returns user key with auth prefix', () => {
      expect(queryKeys.auth.user()).toEqual(['auth', 'user']);
    });

    it('returns profile key', () => {
      expect(queryKeys.auth.profile()).toEqual(['auth', 'profile']);
    });
  });

  describe('students', () => {
    it('returns base students key', () => {
      expect(queryKeys.students.all).toEqual(['students']);
    });

    it('returns detail key with student id', () => {
      expect(queryKeys.students.detail('s123')).toEqual(['students', 'detail', 's123']);
    });

    it('returns list key with params', () => {
      const params = { page: 1 };
      expect(queryKeys.students.list(params)).toEqual(['students', 'list', params]);
    });

    it('returns dashboard key', () => {
      expect(queryKeys.students.dashboard('s1')).toEqual(['students', 'detail', 's1', 'dashboard']);
    });

    it('returns stats key', () => {
      expect(queryKeys.students.stats('c1', 's1')).toEqual(['students', 'stats', 'c1', 's1']);
    });
  });

  describe('assessments', () => {
    it('returns byStudent key', () => {
      expect(queryKeys.assessments.byStudent('s1')).toEqual(['assessments', 'list', 'student', 's1']);
    });

    it('returns history key', () => {
      expect(queryKeys.assessments.history('s1')).toEqual(['assessments', 'list', 'student', 's1', 'history']);
    });
  });

  describe('reports', () => {
    it('returns detail key with id', () => {
      expect(queryKeys.reports.detail('r1')).toEqual(['reports', 'detail', 'r1']);
    });

    it('returns byStudent key', () => {
      expect(queryKeys.reports.byStudent('s1')).toEqual(['reports', 'student', 's1']);
    });
  });

  describe('ai', () => {
    it('returns health key', () => {
      expect(queryKeys.ai.health()).toEqual(['ai', 'health']);
    });

    it('returns assessment key with studentId', () => {
      expect(queryKeys.ai.assessment('s1')).toEqual(['ai', 'assessment', 's1']);
    });

    it('returns lessonPlan key with week', () => {
      expect(queryKeys.ai.lessonPlan('s1', 3)).toEqual(['ai', 'lessonPlan', 's1', 3]);
    });

    it('returns educatorInsights key', () => {
      expect(queryKeys.ai.educatorInsights()).toEqual(['ai', 'educatorInsights']);
    });
  });

  describe('centers', () => {
    it('returns dashboard key with center id', () => {
      expect(queryKeys.centers.dashboard('c1')).toEqual(['centers', 'dashboard', 'c1']);
    });

    it('returns students key with center id and params', () => {
      const params = { page: 1 };
      expect(queryKeys.centers.students('c1', params)).toEqual(['centers', 'detail', 'c1', 'students', params]);
    });
  });
});

describe('invalidationPatterns', () => {
  it('returns correct keys for student invalidation', () => {
    const keys = invalidationPatterns.student('s1');
    expect(keys).toHaveLength(7);
    expect(keys[0]).toEqual(queryKeys.students.detail('s1'));
  });

  it('returns correct keys for center invalidation', () => {
    const keys = invalidationPatterns.center('c1');
    expect(keys).toHaveLength(6);
    expect(keys[0]).toEqual(queryKeys.centers.detail('c1'));
  });

  it('returns correct keys for user invalidation', () => {
    const keys = invalidationPatterns.user();
    expect(keys).toHaveLength(3);
  });

  it('returns correct keys for assessment invalidation', () => {
    const keys = invalidationPatterns.assessment('s1');
    expect(keys).toHaveLength(4);
  });

  it('returns correct keys for report invalidation', () => {
    const keys = invalidationPatterns.report('r1');
    expect(keys).toHaveLength(3);
  });
});
