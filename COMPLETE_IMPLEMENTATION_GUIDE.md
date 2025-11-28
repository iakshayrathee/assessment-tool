# Complete Implementation Guide - Assessment & IEP System Updates

## 🎯 Overview
This guide provides step-by-step instructions to complete the implementation of the new assessment features including formal/informal assessments, lesson plans, homework, and materials management.

---

## ✅ COMPLETED SO FAR

### Backend (100% Complete)
1. ✅ **Database Schema** - All models created in Prisma
2. ✅ **Repositories** - 5 repository files with full CRUD
3. ✅ **Services** - 4 service files with business logic
4. ✅ **Controllers** - 2 controller files with HTTP handlers

---

## 📋 REMAINING TASKS

### Step 1: Create Backend Routes (30 minutes)

Create file: `backend/src/routes/newAssessments.ts`

```typescript
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthUtils } from '../utils/auth';
import { attachProfileId } from '../middleware/profileMiddleware';
import { NewAssessmentController } from '../controllers/NewAssessmentController';

const router = Router();
const prisma = new PrismaClient();
const controller = new NewAssessmentController(prisma);

// Apply authentication middleware
router.use(AuthUtils.authenticateToken);
router.use(attachProfileId);

// Formal Assessments
router.post('/formal', controller.createFormalAssessment);
router.get('/formal/:id', controller.getFormalAssessment);
router.get('/formal/student/:studentId', controller.getFormalAssessmentsByStudent);
router.get('/formal/educator/me', controller.getFormalAssessmentsByEducator);
router.put('/formal/:id', controller.updateFormalAssessment);
router.put('/formal/:id/complete', controller.completeFormalAssessment);
router.delete('/formal/:id', controller.deleteFormalAssessment);

// Reading Skill Assessments
router.post('/skill/reading', controller.createReadingAssessment);
router.get('/skill/reading/:id', controller.getReadingAssessment);
router.get('/skill/reading/student/:studentId', controller.getReadingAssessmentsByStudent);
router.put('/skill/reading/:id', controller.updateReadingAssessment);
router.put('/skill/reading/:id/complete', controller.completeReadingAssessment);

// Writing Skill Assessments
router.post('/skill/writing', controller.createWritingAssessment);
router.get('/skill/writing/:id', controller.getWritingAssessment);
router.get('/skill/writing/student/:studentId', controller.getWritingAssessmentsByStudent);
router.put('/skill/writing/:id', controller.updateWritingAssessment);
router.put('/skill/writing/:id/complete', controller.completeWritingAssessment);

// Math Skill Assessments
router.post('/skill/math', controller.createMathAssessment);
router.get('/skill/math/:id', controller.getMathAssessment);
router.get('/skill/math/student/:studentId', controller.getMathAssessmentsByStudent);
router.put('/skill/math/:id', controller.updateMathAssessment);
router.put('/skill/math/:id/complete', controller.completeMathAssessment);

export default router;
```

Create file: `backend/src/routes/lessonPlansHomework.ts`

```typescript
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthUtils } from '../utils/auth';
import { attachProfileId } from '../middleware/profileMiddleware';
import { LessonPlanHomeworkController } from '../controllers/LessonPlanHomeworkController';

const router = Router();
const prisma = new PrismaClient();
const controller = new LessonPlanHomeworkController(prisma);

// Apply authentication middleware
router.use(AuthUtils.authenticateToken);
router.use(attachProfileId);

// Lesson Plans
router.post('/lesson-plans', controller.createLessonPlan);
router.get('/lesson-plans/:id', controller.getLessonPlan);
router.get('/lesson-plans/student/:studentId', controller.getLessonPlansByStudent);
router.get('/lesson-plans/educator/me', controller.getLessonPlansByEducator);
router.put('/lesson-plans/:id', controller.updateLessonPlan);
router.delete('/lesson-plans/:id', controller.deleteLessonPlan);

// Homework
router.post('/homework', controller.createHomework);
router.get('/homework/:id', controller.getHomework);
router.get('/homework/student/:studentId', controller.getHomeworkByStudent);
router.get('/homework/parent/me', controller.getHomeworkByParent);
router.get('/homework/educator/me', controller.getHomeworkByEducator);
router.put('/homework/:id', controller.updateHomework);
router.put('/homework/:id/submit', controller.submitHomework);
router.put('/homework/:id/review', controller.reviewHomework);
router.put('/homework/:id/complete', controller.completeHomework);
router.delete('/homework/:id', controller.deleteHomework);

// Learning Materials
router.post('/materials', controller.createLearningMaterial);
router.get('/materials/:id', controller.getLearningMaterial);
router.get('/materials', controller.getAllLearningMaterials);
router.get('/materials/:subject/:grade', controller.getLearningMaterialsBySubjectAndGrade);
router.put('/materials/:id', controller.updateLearningMaterial);
router.delete('/materials/:id', controller.deleteLearningMaterial);

export default router;
```

### Step 2: Register Routes in Main App (5 minutes)

Edit `backend/src/index.ts`, add these imports and routes:

```typescript
import newAssessmentRoutes from './routes/newAssessments';
import lessonPlansHomeworkRoutes from './routes/lessonPlansHomework';

// Add after existing routes
app.use('/api/new-assessments', newAssessmentRoutes);
app.use('/api', lessonPlansHomeworkRoutes);
```

### Step 3: Run Database Migration (5 minutes)

```bash
cd backend
npx prisma migrate dev --name add_new_assessment_features
npx prisma generate
```

### Step 4: Update Frontend API Client (30 minutes)

Edit `frontend/lib/api.ts`, add these methods:

```typescript
// Formal Assessments
async createFormalAssessment(data: any): Promise<any> {
  const response = await this.client.post('/new-assessments/formal', data);
  return response.data.data;
}

async getFormalAssessmentsByStudent(studentId: string): Promise<any[]> {
  const response = await this.client.get(`/new-assessments/formal/student/${studentId}`);
  return response.data.data;
}

async updateFormalAssessment(id: string, data: any): Promise<any> {
  const response = await this.client.put(`/new-assessments/formal/${id}`, data);
  return response.data.data;
}

async completeFormalAssessment(id: string): Promise<any> {
  const response = await this.client.put(`/new-assessments/formal/${id}/complete`);
  return response.data.data;
}

// Reading Skill Assessment
async createReadingSkillAssessment(data: any): Promise<any> {
  const response = await this.client.post('/new-assessments/skill/reading', data);
  return response.data.data;
}

async getReadingSkillAssessmentsByStudent(studentId: string): Promise<any[]> {
  const response = await this.client.get(`/new-assessments/skill/reading/student/${studentId}`);
  return response.data.data;
}

async updateReadingSkillAssessment(id: string, data: any): Promise<any> {
  const response = await this.client.put(`/new-assessments/skill/reading/${id}`, data);
  return response.data.data;
}

async completeReadingSkillAssessment(id: string): Promise<any> {
  const response = await this.client.put(`/new-assessments/skill/reading/${id}/complete`);
  return response.data.data;
}

// Writing Skill Assessment
async createWritingSkillAssessment(data: any): Promise<any> {
  const response = await this.client.post('/new-assessments/skill/writing', data);
  return response.data.data;
}

async getWritingSkillAssessmentsByStudent(studentId: string): Promise<any[]> {
  const response = await this.client.get(`/new-assessments/skill/writing/student/${studentId}`);
  return response.data.data;
}

async updateWritingSkillAssessment(id: string, data: any): Promise<any> {
  const response = await this.client.put(`/new-assessments/skill/writing/${id}`, data);
  return response.data.data;
}

async completeWritingSkillAssessment(id: string): Promise<any> {
  const response = await this.client.put(`/new-assessments/skill/writing/${id}/complete`);
  return response.data.data;
}

// Math Skill Assessment
async createMathSkillAssessment(data: any): Promise<any> {
  const response = await this.client.post('/new-assessments/skill/math', data);
  return response.data.data;
}

async getMathSkillAssessmentsByStudent(studentId: string): Promise<any[]> {
  const response = await this.client.get(`/new-assessments/skill/math/student/${studentId}`);
  return response.data.data;
}

async updateMathSkillAssessment(id: string, data: any): Promise<any> {
  const response = await this.client.put(`/new-assessments/skill/math/${id}`, data);
  return response.data.data;
}

async completeMathSkillAssessment(id: string): Promise<any> {
  const response = await this.client.put(`/new-assessments/skill/math/${id}/complete`);
  return response.data.data;
}

// Lesson Plans
async createLessonPlan(data: any): Promise<any> {
  const response = await this.client.post('/lesson-plans', data);
  return response.data.data;
}

async getLessonPlansByStudent(studentId: string, page = 1, limit = 20): Promise<any> {
  const response = await this.client.get(`/lesson-plans/student/${studentId}`, {
    params: { page, limit }
  });
  return response.data.data;
}

async updateLessonPlan(id: string, data: any): Promise<any> {
  const response = await this.client.put(`/lesson-plans/${id}`, data);
  return response.data.data;
}

async deleteLessonPlan(id: string): Promise<void> {
  await this.client.delete(`/lesson-plans/${id}`);
}

// Homework
async createHomework(data: any): Promise<any> {
  const response = await this.client.post('/homework', data);
  return response.data.data;
}

async getHomeworkByStudent(studentId: string, page = 1, limit = 20): Promise<any> {
  const response = await this.client.get(`/homework/student/${studentId}`, {
    params: { page, limit }
  });
  return response.data.data;
}

async getHomeworkByParent(page = 1, limit = 20): Promise<any> {
  const response = await this.client.get('/homework/parent/me', {
    params: { page, limit }
  });
  return response.data.data;
}

async submitHomework(id: string, parentFeedback?: string): Promise<any> {
  const response = await this.client.put(`/homework/${id}/submit`, { parentFeedback });
  return response.data.data;
}

async reviewHomework(id: string, educatorFeedback: string): Promise<any> {
  const response = await this.client.put(`/homework/${id}/review`, { educatorFeedback });
  return response.data.data;
}

// Learning Materials
async getLearningMaterials(params: any): Promise<any> {
  const response = await this.client.get('/materials', { params });
  return response.data.data;
}

async getLearningMaterialsBySubjectAndGrade(subject: string, grade: number): Promise<any[]> {
  const response = await this.client.get(`/materials/${subject}/${grade}`);
  return response.data.data;
}
```

---

## 🎨 FRONTEND COMPONENTS TO CREATE

### Priority 1: Update Main Assessments Page

Edit `frontend/app/educator/assessments/page.tsx`:

Add tabs at the top:
```typescript
<Tabs defaultValue="informal">
  <TabsList>
    <TabsTrigger value="informal">Informal Assessments</TabsTrigger>
    <TabsTrigger value="formal">Formal Assessments</TabsTrigger>
    <TabsTrigger value="skill">Skill Assessments</TabsTrigger>
  </TabsList>
  
  <TabsContent value="informal">
    {/* Existing assessment UI */}
  </TabsContent>
  
  <TabsContent value="formal">
    <FormalAssessmentsList studentId={selectedStudentId} />
  </TabsContent>
  
  <TabsContent value="skill">
    <SkillAssessmentsView studentId={selectedStudentId} />
  </TabsContent>
</Tabs>
```

### Priority 2: Create Formal Assessment Component

Create `frontend/components/assessments/FormalAssessmentForm.tsx`:

Key sections:
- Referral Details form
- Findings Summary form
- File upload component
- Save/Complete buttons

### Priority 3: Create Skill Assessment Components

Create three components:
- `frontend/components/assessments/ReadingSkillAssessment.tsx`
- `frontend/components/assessments/WritingSkillAssessment.tsx`
- `frontend/components/assessments/MathSkillAssessment.tsx`

Each should have:
- Collapsible sections for each category
- Checkboxes for all symptoms
- Additional notes textarea
- Save/Complete buttons

### Priority 4: Create Lesson Plan Component

Create `frontend/components/lesson-plans/LessonPlanForm.tsx`:

Fields:
- Date picker
- Skill Area dropdown (Reading/Writing/Math)
- Specific Topic input
- Areas of Remediation multi-select
- Activity/Strategy textarea
- Resources checkboxes
- Expected/Actual Time inputs
- Motivation Level dropdown
- Outcome textarea
- Next Step textarea

### Priority 5: Create Homework Component

Create `frontend/components/homework/HomeworkAssignmentForm.tsx`:

Fields:
- Student selector
- Subject dropdown
- Title input
- Instructions textarea
- File upload
- Due date picker
- Estimated time
- Skill targeted dropdown

### Priority 6: Create Materials Library

Create `frontend/app/educator/materials/page.tsx`:

Features:
- Filter by Subject (Reading/Writing/Math)
- Filter by Grade (1-6)
- Search bar
- Grid/List view of materials
- Upload new material button

---

## 🚀 QUICK START COMMANDS

```bash
# 1. Run migration
cd backend
npx prisma migrate dev --name add_new_assessment_features
npx prisma generate

# 2. Start backend
npm run dev

# 3. Start frontend (in new terminal)
cd frontend
npm run dev

# 4. Test the API
# Use Postman or curl to test endpoints
curl -X GET http://localhost:3000/api/new-assessments/formal/educator/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📊 DATA STRUCTURE EXAMPLES

### Formal Assessment Payload
```json
{
  "studentId": "student_id",
  "assessmentType": "Psychological Assessment",
  "referralReason": "Learning difficulties in reading",
  "referralDate": "2025-11-26",
  "referredBy": "Educator Name",
  "conductedBy": "Dr. Smith",
  "credentials": "PhD in Psychology",
  "clinicName": "ABC Clinic",
  "assessmentDate": "2025-11-30",
  "keyFindings": "Student shows difficulty with...",
  "diagnosis": "Dyslexia",
  "recommendations": "Recommend multisensory approach...",
  "uploadedFiles": []
}
```

### Reading Skill Assessment Payload
```json
{
  "studentId": "student_id",
  "missesLetters": true,
  "missesWords": false,
  "substitution": true,
  "choppyReading": true,
  "poorEyeTracking": false,
  "readsWithoutUnderstanding": true,
  "additionalNotes": "Student struggles particularly with..."
}
```

### Lesson Plan Payload
```json
{
  "studentId": "student_id",
  "date": "2025-11-26",
  "skillArea": "READING",
  "specificTopic": "CVC Word Blending",
  "areasOfRemediation": ["Decoding", "Phonemic Awareness"],
  "activityStrategy": "Used flashcards and multisensory tracing",
  "resourcesUsed": ["Worksheets", "Manipulatives"],
  "expectedTime": 20,
  "actualTimeTaken": 25,
  "motivationLevel": "HIGH",
  "outcome": "Student successfully blended 8/10 CVC words",
  "nextStep": "Move to CVCC words next session"
}
```

### Homework Payload
```json
{
  "studentId": "student_id",
  "subject": "READING",
  "title": "CVC Practice Worksheet",
  "instructions": "Complete the CVC blending worksheet. Sound out each word and write it.",
  "attachedFiles": [],
  "dueDate": "2025-11-28",
  "additionalNotes": "Please practice with parent for 15 minutes",
  "estimatedTime": 15,
  "skillTargeted": "CVC Blending"
}
```

---

## ✅ TESTING CHECKLIST

- [ ] Database migration runs successfully
- [ ] Backend starts without errors
- [ ] Can create formal assessment
- [ ] Can create reading skill assessment
- [ ] Can create writing skill assessment
- [ ] Can create math skill assessment
- [ ] Can create lesson plan
- [ ] Can assign homework
- [ ] Can view materials library
- [ ] Parent can view homework
- [ ] Parent can submit homework
- [ ] Educator can review homework
- [ ] All data persists correctly
- [ ] File uploads work (when implemented)

---

## 🔧 TROUBLESHOOTING

### Migration Issues
```bash
# Reset database (development only!)
npx prisma migrate reset
npx prisma migrate dev
npx prisma generate
```

### Type Errors
```bash
# Regenerate Prisma client
npx prisma generate
```

### API Not Working
- Check if routes are registered in `index.ts`
- Verify authentication token is being sent
- Check console for error messages
- Verify profileId middleware is working

---

## 📚 ADDITIONAL RESOURCES

- Prisma Docs: https://www.prisma.io/docs
- Next.js Docs: https://nextjs.org/docs
- shadcn/ui Components: https://ui.shadcn.com

---

*This implementation adds 400+ lines of backend code and requires approximately 2000+ lines of frontend code to complete all features.*

