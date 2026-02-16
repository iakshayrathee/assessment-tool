// Standardized grade list for Indian schools
// IMPORTANT: This list is the single source of truth for all grade values
// Used in: Backend validation, Frontend forms, Database storage

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
export function isValidGrade(grade: string): grade is GradeValue {
    return GRADE_LIST.includes(grade as GradeValue);
}

// Helper function to format grade for display
export function formatGradeDisplay(grade: string): string {
    // Grade is already in display format
    return grade;
}
