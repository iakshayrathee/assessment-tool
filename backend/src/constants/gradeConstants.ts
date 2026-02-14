// Standardized grade list for Indian schools
// IMPORTANT: This must match frontend/lib/gradeConfig.ts exactly

export const GRADE_LIST = [
    'Nursery',
    'LKG',
    'UKG',
    'Kindergarten',
    'Grade 1',
    'Grade 2',
    'Grade 3',
    'Grade 4',
    'Grade 5',
    'Grade 6',
    'Grade 7',
    'Grade 8',
    'Grade 9',
    'Grade 10',
    'Grade 11',
    'Grade 12'
] as const;

export type GradeValue = typeof GRADE_LIST[number];

// Helper function to validate grade value
export function isValidGrade(grade: string): boolean {
    return GRADE_LIST.includes(grade as GradeValue);
}
