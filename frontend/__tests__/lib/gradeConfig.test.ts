import { GRADE_LIST, isValidGrade, formatGradeDisplay } from '@/lib/gradeConfig';

describe('GRADE_LIST', () => {
  it('contains expected Indian school grades', () => {
    expect(GRADE_LIST).toContain('Nursery');
    expect(GRADE_LIST).toContain('LKG');
    expect(GRADE_LIST).toContain('UKG');
    expect(GRADE_LIST).toContain('Kindergarten');
    expect(GRADE_LIST).toContain('Grade 1');
    expect(GRADE_LIST).toContain('Grade 12');
  });

  it('has 16 entries total', () => {
    expect(GRADE_LIST).toHaveLength(16);
  });
});

describe('isValidGrade', () => {
  it('returns true for valid grades', () => {
    expect(isValidGrade('Grade 1')).toBe(true);
    expect(isValidGrade('Nursery')).toBe(true);
    expect(isValidGrade('LKG')).toBe(true);
    expect(isValidGrade('UKG')).toBe(true);
    expect(isValidGrade('Grade 12')).toBe(true);
  });

  it('returns false for invalid grades', () => {
    expect(isValidGrade('Grade 13')).toBe(false);
    expect(isValidGrade('Invalid')).toBe(false);
    expect(isValidGrade('')).toBe(false);
    expect(isValidGrade('grade 1')).toBe(false); // case-sensitive
  });
});

describe('formatGradeDisplay', () => {
  it('returns the grade string as-is', () => {
    expect(formatGradeDisplay('Grade 5')).toBe('Grade 5');
    expect(formatGradeDisplay('LKG')).toBe('LKG');
  });
});
