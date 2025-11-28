# IEP (Individualized Education Program) Implementation

## Overview

This document describes the complete implementation of the IEP management system that matches the format shown in the provided images. The system allows educators to create, manage, and track IEP documents for students with special educational needs.

## Features Implemented

### 1. IEP Document Structure

The IEP document follows the standard format with the following components:

#### Header Page (IEP 1)
- **Student Information**
  - Name
  - Age (calculated from date of birth)
  - Class/Grade/Standard
- **Program Details**
  - Duration (in months)
  - Start and End dates
- **Areas of Remediation**
  - Reading
  - Writing
  - Math
  - Spelling
  - Oral Language
  - Visual Perception
  - Motor Skills
  - Attention
  - Communication
  - Social Skills

### 2. Assessment Table

A comprehensive assessment table that tracks:
- **Subject**: The area being assessed
- **Test Goal**: The specific goal or activity being tested
- **Analysis**: Observations and analysis of student performance
- **Assessment**: Formal assessment results
- **Behavioral Metrics**:
  - Attention (rotated column header)
  - Behavioral Sitting Tolerance (rotated column header)
  - Task Completion (rotated column header)

### 3. Subject-Specific Sections

Each subject (e.g., Oral Language, Reading, Writing, Spelling, Math) has:

#### Present Level
- **Receptive Skills**: Current abilities in understanding/receiving information
- **Expressive Skills**: Current abilities in expressing/communicating

#### Long-Term Goals
- Numbered objectives (1, 2, 3, 4...)
- Duration in months
- Measurable outcomes

#### Short-Term Goals
- Numbered objectives (1, 2, 3, 4...)
- Teacher assistance level required:
  - Independent
  - Minimal Assistance
  - Moderate Assistance
  - Maximum Assistance
- Target dates

### 4. Weekly Planning Table

A structured weekly plan with:
- **Categories**: Subject areas
- **Specific Objectives**: Detailed learning objectives
- **Daily Columns**: Monday through Thursday
- Activities and assessments for each day

## Technical Implementation

### Frontend Components

#### 1. IEPDocumentForm (`frontend/components/iep/IEPDocumentForm.tsx`)
- Creates new IEP documents
- Captures student information
- Allows selection of areas of remediation
- Sets duration and date ranges
- Supports status management (Draft, Active, Completed, Archived)

#### 2. IEPSubjectSectionForm (`frontend/components/iep/IEPSubjectSectionForm.tsx`)
- Adds subject sections to IEP documents
- Captures present level (Receptive & Expressive)
- Manages long-term goals with duration
- Manages short-term goals with teacher assistance levels

#### 3. WeeklyLessonPlanForm (`frontend/components/iep/WeeklyLessonPlanForm.tsx`)
- Creates weekly evaluation plans
- Captures daily activities (Monday-Thursday)
- Records behavioral observations:
  - Attention levels
  - Sitting tolerance
  - Task completion status

#### 4. IEPDocumentViewer (`frontend/components/iep/IEPDocumentViewer.tsx`)
- Displays complete IEP document in print-friendly format
- Matches the format shown in provided images
- Includes:
  - Header page with student info
  - Assessment table with rotated headers
  - Subject-specific pages
  - Weekly planning tables
- Print and export functionality

#### 5. IEP Management Page (`frontend/app/educator/iep-management/page.tsx`)
- Main interface for educators
- Lists all IEP documents
- Filter and search capabilities
- Actions:
  - Create new IEP
  - Add subject sections
  - Create weekly plans
  - View/Print/Export documents

### Backend Implementation

#### Database Schema (`backend/prisma/schema.prisma`)

**IEPDocument Model**:
```prisma
model IEPDocument {
  id                  String
  studentId           String
  specialEducatorId   String
  title               String
  durationMonths      Int
  startDate           DateTime
  endDate             DateTime
  areasOfRemediation  String[]
  status              IEPStatus (DRAFT, ACTIVE, COMPLETED, ARCHIVED)
  subjectSections     IEPSubjectSection[]
  weeklyEvaluations   IEPWeeklyEvaluation[]
}
```

**IEPSubjectSection Model**:
```prisma
model IEPSubjectSection {
  id                      String
  iepDocumentId           String
  subject                 IEPSubject (ORAL_LANGUAGE, READING, WRITING, SPELLING, MATH)
  presentLevelReceptive   String
  presentLevelExpressive  String
  longTermGoals           IEPLongTermGoal[]
  shortTermGoals          IEPShortTermGoal[]
}
```

**IEPLongTermGoal Model**:
```prisma
model IEPLongTermGoal {
  id                String
  subjectSectionId  String
  goalNumber        Int
  description       String
  durationMonths    Int
}
```

**IEPShortTermGoal Model**:
```prisma
model IEPShortTermGoal {
  id                String
  subjectSectionId  String
  goalNumber        Int
  description       String
  teacherAssistance String
  targetDate        DateTime
}
```

**IEPWeeklyEvaluation Model**:
```prisma
model IEPWeeklyEvaluation {
  id            String
  iepDocumentId String
  weekNumber    Int
  startDate     DateTime
  endDate       DateTime
  strategies    String
  observations  String
  activities    IEPWeeklyActivity[]
}
```

**IEPWeeklyActivity Model**:
```prisma
model IEPWeeklyActivity {
  id                          String
  weeklyEvaluationId          String
  dayOfWeek                   DayOfWeek
  subject                     String
  testGoalActivity            String
  analysis                    String
  assessment                  String
  behavioralAttention         BehavioralAttentionLevel
  behavioralSittingTolerance  BehavioralSittingTolerance
  behavioralTaskCompletion    BehavioralTaskCompletion
}
```

#### API Endpoints (`backend/src/routes/iep.ts`)

**IEP Document Management**:
- `POST /api/iep/documents` - Create new IEP document
- `GET /api/iep/documents/:id` - Get IEP document by ID
- `GET /api/iep/students/:studentId/documents` - Get all IEPs for a student
- `GET /api/iep/educators/:educatorId/documents` - Get all IEPs by educator
- `PUT /api/iep/documents/:id` - Update IEP document
- `DELETE /api/iep/documents/:id` - Delete IEP document

**Subject Section Management**:
- `POST /api/iep/documents/:iepDocumentId/subject-sections` - Add subject section
- `GET /api/iep/subject-sections/:id` - Get subject section details
- `POST /api/iep/subject-sections/:subjectSectionId/long-term-goals` - Add long-term goal
- `POST /api/iep/subject-sections/:subjectSectionId/short-term-goals` - Add short-term goal

**Weekly Evaluation Management**:
- `POST /api/iep/documents/:iepDocumentId/weekly-evaluations` - Add weekly evaluation
- `GET /api/iep/weekly-evaluations/:id` - Get weekly evaluation details
- `POST /api/iep/weekly-evaluations/:weeklyEvaluationId/activities` - Add weekly activity

#### Services and Repositories

**IEPService** (`backend/src/services/IEPService.ts`):
- Business logic for IEP operations
- Validation of IEP data
- Coordination between repositories

**IEPRepository** (`backend/src/repositories/IEPRepository.ts`):
- Database operations for IEP entities
- CRUD operations with Prisma
- Complex queries with relations

## Usage Guide

### For Educators

#### Creating a New IEP

1. Navigate to **IEP Management** page
2. Click **"New IEP"** button
3. Fill in the form:
   - Enter IEP title
   - Select student
   - Set duration (months)
   - Choose start and end dates
   - Select areas of remediation (checkboxes)
   - Set status (Draft/Active)
4. Click **"Create IEP Document"**

#### Adding Subject Sections

1. Find the IEP document in the list
2. Click **"Add Subject"** button
3. Fill in the form:
   - Select subject (Oral Language, Reading, etc.)
   - Describe present level - Receptive skills
   - Describe present level - Expressive skills
   - Add long-term goals (with duration)
   - Add short-term goals (with assistance level)
4. Click **"Add Subject Section"**

#### Creating Weekly Plans

1. Find the IEP document in the list
2. Click **"Weekly Plan"** button
3. Select week start date
4. For each day (Monday-Thursday):
   - Enter subject
   - Describe test goal/activity
   - Add analysis
   - Add assessment
   - Select behavioral attention level
   - Select sitting tolerance
   - Select task completion status
5. Click **"Create Weekly Plan"**

#### Viewing and Printing IEPs

1. Find the IEP document in the list
2. Click **"View"** button
3. Review the complete IEP document
4. Click **"Print"** to print the document
5. Click **"Export PDF"** to download (coming soon)

### Print Format

The IEP document is formatted for A4 paper with:
- Professional layout matching standard IEP format
- Page breaks between major sections
- Rotated column headers for behavioral metrics
- Clear typography and spacing
- Print-optimized colors and borders

## Data Flow

```
Educator → IEP Management Page
  ↓
Create IEP Document → IEPDocumentForm
  ↓
API Client → POST /api/iep/documents
  ↓
IEP Controller → IEP Service → IEP Repository
  ↓
Database (PostgreSQL via Prisma)
  ↓
Return IEP Document with Relations
  ↓
Display in IEPDocumentViewer
```

## Status Management

IEP documents have four statuses:

1. **DRAFT**: Initial state, being prepared
2. **ACTIVE**: Currently being implemented
3. **COMPLETED**: Goals achieved, program finished
4. **ARCHIVED**: Historical record, no longer active

## Behavioral Assessment Levels

### Attention Levels
- EXCELLENT: Sustained focus throughout
- GOOD: Generally attentive with minor lapses
- FAIR: Moderate attention with regular redirection
- POOR: Frequent distraction, significant redirection needed
- VERY_POOR: Unable to maintain attention

### Sitting Tolerance
- EXCELLENT: Sits appropriately for entire session
- GOOD: Generally sits well with minimal breaks
- FAIR: Requires regular movement breaks
- POOR: Difficulty sitting, frequent breaks needed
- VERY_POOR: Unable to sit for required duration

### Task Completion
- COMPLETED_INDEPENDENTLY: Finished without help
- COMPLETED_WITH_ASSISTANCE: Finished with teacher support
- PARTIALLY_COMPLETED: Some parts finished
- NOT_COMPLETED: Unable to complete task

## Future Enhancements

1. **PDF Export**: Generate downloadable PDF versions
2. **Progress Tracking**: Visual charts showing goal progress
3. **Parent Portal**: Allow parents to view IEPs
4. **Goal Templates**: Pre-defined goal templates for common areas
5. **Collaboration**: Multiple educators working on same IEP
6. **Version History**: Track changes to IEP over time
7. **Digital Signatures**: Electronic approval workflow
8. **Reminders**: Notifications for review dates and milestones

## Testing

### Manual Testing Checklist

- [ ] Create new IEP document
- [ ] Add multiple subject sections
- [ ] Add long-term and short-term goals
- [ ] Create weekly evaluation plans
- [ ] View complete IEP document
- [ ] Print IEP document
- [ ] Filter and search IEPs
- [ ] Update IEP status
- [ ] Delete IEP document

### Test Data

Sample student information:
- Name: P (as shown in image)
- Age: 7 years
- Class: II Standard
- Duration: 4 months
- Areas: Oral Language, Reading, Writing, Spelling, Maths

## Troubleshooting

### Common Issues

1. **IEP not saving**: Check that all required fields are filled
2. **Print layout issues**: Ensure browser print settings are set to A4
3. **Missing data**: Verify database migrations have been run
4. **Permission errors**: Ensure user has educator role

## Database Migration

To apply the schema changes:

```bash
cd backend
npx prisma migrate dev --name add_iep_document_fields
npx prisma generate
```

## Environment Setup

Ensure these environment variables are set:

```env
DATABASE_URL="postgresql://..."
JWT_SECRET="your-secret-key"
NEXT_PUBLIC_API_URL="http://localhost:5000/api"
```

## Support

For issues or questions:
1. Check this documentation
2. Review the code comments
3. Contact the development team
4. Submit an issue in the project repository

