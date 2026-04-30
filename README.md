# Knowled - Special Education Management Platform

A comprehensive, enterprise-grade platform for managing special education programs, assessments, and student progress tracking. This full-stack application provides role-based access for administrators, centers, educators, parents, and school viewers to collaborate effectively in special education management with advanced features for intake forms, IEP goals, assessments, and detailed reporting.

## 🏗️ Architecture Overview

This project follows a modern full-stack architecture with clear separation of concerns and enterprise-level scalability:

### Technology Stack
- **Frontend**: Next.js 14 with App Router, TypeScript, TanStack Query (React Query), and Tailwind CSS
- **Backend**: Node.js with Express.js and TypeScript
- **AI Backend**: FastAPI (Python 3.12) with LangGraph multi-agent workflows
- **AI Orchestration**: LangGraph state machines + LangChain + OpenAI (GPT-4o-mini / GPT-4o)
- **AI Observability**: LangSmith for tracing, monitoring, and cost tracking
- **Database**: PostgreSQL with Prisma ORM v5.7.1 (Node.js) and asyncpg + SQLAlchemy (AI backend)
- **Cache / State Persistence**: Redis for LangGraph checkpoints and response caching
- **File Storage**: AWS S3 for secure document and file storage
- **Real-time Communication**: Socket.IO for live notifications and updates
- **Authentication**: JWT-based authentication with role-based access control (RBAC)
- **UI Framework**: Radix UI primitives with shadcn/ui design system
- **State Management**: Zustand for client-side state management
- **Form Handling**: React Hook Form with Zod validation
- **Charts & Analytics**: Recharts for data visualization
- **Document Processing**: PDF.js, Mammoth (DOCX), html2pdf.js, xlsx for file handling
- **Testing**: Jest + Testing Library (frontend), Jest + Supertest (backend), Pytest (AI backend)

## 📁 Project Structure

```
assessment-tool/
├── ai-backend/                 # FastAPI AI agent service (Python 3.12)
│   ├── app/
│   │   ├── agents/            # LangGraph agent definitions
│   │   │   ├── assessment_agent.py   # Symptom analysis, severity scoring, LD detection
│   │   │   ├── iep_agent.py          # SMART goals, LTP/STP/WLP generation
│   │   │   ├── lesson_plan_agent.py  # Weekly lesson plan suggestions
│   │   │   ├── report_agent.py       # Multi-type report generation
│   │   │   ├── risk_agent.py         # Batch risk classification & early warnings
│   │   │   └── educator_agent.py     # Teaching effectiveness & mentoring insights
│   │   ├── api/               # FastAPI route handlers
│   │   ├── models/            # Pydantic request/response models
│   │   ├── services/          # Shared services (DB, cache, LLM)
│   │   ├── states/            # LangGraph state definitions
│   │   ├── prompts/           # LLM prompt templates
│   │   ├── utils/             # Utility helpers
│   │   └── main.py            # FastAPI application entry point
│   ├── tests/                 # Pytest test suite
│   ├── scripts/               # Utility scripts
│   ├── Dockerfile             # Container definition
│   └── requirements.txt       # Python dependencies
├── backend/                    # Node.js/Express API server
│   ├── src/
│   │   ├── controllers/        # Request handlers
│   │   │   ├── AIReportController.ts        # AI report generation proxy
│   │   │   ├── AdminController.ts
│   │   │   ├── AuthController.ts
│   │   │   ├── CenterController.ts
│   │   │   ├── FileController.ts
│   │   │   ├── IEPController.ts             # IEP management
│   │   │   ├── LessonPlanHomeworkController.ts
│   │   │   ├── NewAssessmentController.ts   # Skill assessments (reading/writing/math)
│   │   │   ├── NotificationController.ts
│   │   │   ├── ParentController.ts
│   │   │   ├── SchoolController.ts
│   │   │   ├── SchoolReportController.ts
│   │   │   ├── SchoolViewerController.ts
│   │   │   ├── SpecialEducatorController.ts
│   │   │   ├── StudentController.ts
│   │   │   └── SuperSpecialEducatorController.ts
│   │   ├── middleware/         # Custom middleware
│   │   │   ├── profileMiddleware.ts
│   │   │   └── upload.ts                    # Multer + S3 upload middleware
│   │   ├── models/            # TypeScript interfaces
│   │   ├── repositories/      # Data access layer
│   │   │   ├── AssessmentRepository.ts
│   │   │   ├── FormalAssessmentRepository.ts
│   │   │   ├── HomeworkRepository.ts
│   │   │   ├── IepRepository.ts
│   │   │   ├── LearningMaterialRepository.ts
│   │   │   ├── LongTermPlanRepository.ts
│   │   │   ├── NotificationRepository.ts
│   │   │   ├── ShortTermPlanRepository.ts
│   │   │   ├── SkillAssessmentRepository.ts
│   │   │   ├── StudentRepository.ts
│   │   │   ├── UserRepository.ts
│   │   │   └── WeeklyLessonPlanRepository.ts
│   │   ├── routes/            # API route definitions
│   │   │   ├── admin.ts
│   │   │   ├── ai.ts                        # AI backend proxy routes
│   │   │   ├── auth.ts
│   │   │   ├── centers.ts
│   │   │   ├── files.ts
│   │   │   ├── iep.ts                       # IEP management routes
│   │   │   ├── lessonPlansHomework.ts
│   │   │   ├── newAssessments.ts            # Skill assessment routes
│   │   │   ├── notifications.ts
│   │   │   ├── parents.ts
│   │   │   ├── reports.ts
│   │   │   ├── schoolViewers.ts
│   │   │   ├── schools.ts
│   │   │   ├── specialEducators.ts
│   │   │   ├── students.ts
│   │   │   └── superSpecialEducators.ts
│   │   ├── services/          # Business logic layer
│   │   │   ├── AdminService.ts
│   │   │   ├── AssessmentService.ts
│   │   │   ├── AuthService.ts
│   │   │   ├── CenterReportService.ts
│   │   │   ├── CenterService.ts
│   │   │   ├── HomeworkService.ts
│   │   │   ├── IEPService.ts
│   │   │   ├── LearningMaterialService.ts
│   │   │   ├── LongTermPlanService.ts
│   │   │   ├── NewAssessmentService.ts
│   │   │   ├── NotificationService.ts
│   │   │   ├── ParentReportService.ts
│   │   │   ├── ParentService.ts
│   │   │   ├── ReadingScoreService.ts
│   │   │   ├── SchoolAIReportService.ts
│   │   │   ├── SchoolReportService.ts
│   │   │   ├── SchoolViewerService.ts
│   │   │   ├── ShortTermPlanService.ts
│   │   │   ├── SpecialEducatorService.ts
│   │   │   ├── StudentService.ts
│   │   │   ├── SuperSpecialEducatorService.ts
│   │   │   ├── WeeklyLessonPlanService.ts
│   │   │   ├── aiBackendProxy.ts            # HTTP proxy to FastAPI AI service
│   │   │   └── s3Service.ts                 # AWS S3 file operations
│   │   ├── utils/             # Utility functions
│   │   │   ├── auth.ts
│   │   │   ├── email.ts                     # Nodemailer email helpers
│   │   │   ├── errors.ts
│   │   │   ├── helpers.ts
│   │   │   ├── notificationHelpers.ts
│   │   │   ├── validation.ts
│   │   │   └── websocket.ts                 # Socket.IO event helpers
│   │   └── __tests__/         # Jest test suite
│   │       ├── unit/          # Unit tests
│   │       └── integration/   # Integration tests
│   ├── prisma/
│   │   ├── migrations/        # 26+ database migrations
│   │   ├── schema.prisma      # Complete database schema
│   │   ├── seed.ts            # Database seeding scripts
│   │   └── seed-educator.ts   # Educator-specific seed data
│   ├── package.json          # Backend dependencies
│   └── tsconfig.json         # TypeScript configuration
└── frontend/                   # Next.js React application
    ├── app/                   # Next.js App Router (file-based routing)
    │   ├── admin/             # Admin dashboard pages
    │   │   ├── approvals/     # Assessment approvals
    │   │   ├── audit-logs/    # System audit logs
    │   │   ├── notifications/ # Admin notifications
    │   │   ├── overview/      # System overview & statistics
    │   │   ├── reports/       # Administrative reports
    │   │   ├── settings/      # System settings
    │   │   └── user-management/ # User account management
    │   ├── center/            # Center management pages
    │   │   ├── compliance/    # Compliance tracking
    │   │   ├── dashboard/     # Center dashboard
    │   │   ├── educators/     # Educator assignments
    │   │   ├── notifications/ # Center notifications
    │   │   ├── reports/       # Center reports
    │   │   ├── schools/       # School management
    │   │   └── students/      # Student management
    │   ├── educator/          # Special educator pages
    │   │   ├── ai-transparency/  # AI decision explanation
    │   │   ├── assessments/   # Skill assessments (reading/writing/math)
    │   │   ├── dashboard/     # Educator dashboard
    │   │   ├── data-bank/     # Learning materials & resources
    │   │   ├── homework/      # Homework management
    │   │   ├── iep-management/ # IEP goals (LTP/STP/WLP)
    │   │   ├── intake/        # Student intake forms
    │   │   ├── lesson-plans-new/ # Lesson plan management
    │   │   ├── notifications/ # Educator notifications
    │   │   ├── profile/       # Educator profile
    │   │   ├── reports/       # Progress reports
    │   │   ├── students/      # Student management
    │   │   └── text-to-speech/ # Text-to-speech tools
    │   ├── parent/            # Parent portal pages
    │   │   ├── children/      # Child information & progress
    │   │   ├── concerns/      # Parent concerns submission
    │   │   ├── dashboard/     # Parent dashboard
    │   │   ├── documents/     # Document management
    │   │   ├── homework/      # Child homework view
    │   │   ├── notifications/ # Parent notifications
    │   │   ├── profile/       # Parent profile
    │   │   └── reports/       # Child reports
    │   ├── school-viewer/     # School viewer portal (read-only)
    │   │   ├── dashboard/     # School overview
    │   │   ├── notifications/ # School viewer notifications
    │   │   ├── school-reports/ # School-level reports
    │   │   └── students/      # Student progress view
    │   ├── super-special-educator/ # Super educator pages
    │   │   ├── analytics/     # Advanced analytics
    │   │   ├── centers/       # Center oversight
    │   │   ├── educators/     # Educator supervision
    │   │   ├── flagged-cases/ # Cases requiring attention
    │   │   ├── notifications/ # Notifications
    │   │   ├── profile/       # Super educator profile
    │   │   ├── reviews/       # Assessment reviews
    │   │   ├── students/      # Student oversight
    │   │   └── training-logs/ # Educator training records
    │   ├── login/             # Role-specific login pages
    │   │   ├── admin/
    │   │   ├── center/
    │   │   ├── parent/
    │   │   ├── school-viewer/
    │   │   ├── special-educator/
    │   │   └── super-special-educator/
    │   ├── mass-assessment/   # Bulk assessment workflows
    │   ├── forgot-password/   # Password recovery
    │   └── reset-password/    # Password reset
    ├── components/            # Reusable React components
    │   ├── ai/                # AI transparency & result components
    │   ├── assessments/       # Assessment components
    │   │   ├── ReadingAssessmentWizard.tsx
    │   │   ├── ReadingSkillAssessment.tsx
    │   │   ├── WritingSkillAssessment.tsx
    │   │   ├── MathSkillAssessment.tsx
    │   │   ├── FormalAssessmentForm.tsx
    │   │   └── reading-sections/ # Reading sub-section components
    │   ├── educator/          # Educator-specific components
    │   ├── iep/               # IEP goal components
    │   ├── layout/            # Layout components
    │   │   ├── AppLayout.tsx
    │   │   ├── EducatorLayout.tsx
    │   │   ├── UnifiedLayout.tsx
    │   │   ├── UnifiedSidebar.tsx
    │   │   ├── TopHeader.tsx
    │   │   ├── NotificationDropdown.tsx
    │   │   ├── LoadingScreen.tsx
    │   │   └── PageWrapper.tsx
    │   ├── lesson-plans/      # Lesson plan components
    │   ├── modals/            # Modal components
    │   │   ├── AddStudentModal.tsx
    │   │   ├── AssignEducatorModal.tsx
    │   │   ├── CenterSchoolSelectionModal.tsx
    │   │   ├── CreateUserModal.tsx
    │   │   ├── EditUserModal.tsx
    │   │   ├── RoleBasedAssignmentModal.tsx
    │   │   ├── StudentDetailsModal.tsx
    │   │   └── UserAssignmentModal.tsx
    │   ├── school-viewer/     # School viewer components
    │   ├── text-to-speech/    # TTS playback components
    │   └── ui/                # Base UI components (47 components)
    ├── hooks/                 # Custom React hooks (24 hooks)
    │   ├── useAI.ts           # AI agent integration
    │   ├── useAdmin.ts        # Admin functionality
    │   ├── useAssessments.ts  # Assessment management
    │   ├── useAuth.ts         # Authentication
    │   ├── useCenter.ts       # Center management
    │   ├── useCenterReports.ts
    │   ├── useDocumentParser.ts  # PDF/DOCX parsing
    │   ├── useEducator.ts
    │   ├── useGlobal.ts       # Global app state
    │   ├── useNotifications.ts
    │   ├── useParent.ts
    │   ├── useParentReports.ts
    │   ├── useReportEditor.ts
    │   ├── useSchoolReports.ts
    │   ├── useSchoolViewer.ts
    │   ├── useSpecialEducator.ts
    │   ├── useSpeechSynthesis.ts # Text-to-speech
    │   ├── useStudents.ts
    │   ├── useSuperSpecialEducator.ts
    │   └── useUserManagement.ts
    ├── lib/                   # Utility libraries
    │   ├── api.ts             # Axios API client (all endpoints)
    │   ├── queryKeys.ts       # TanStack Query key definitions
    │   ├── reportUtils.ts     # Report generation utilities
    │   ├── websocketClient.ts # Socket.IO client
    │   └── store/             # Zustand stores
    ├── types/                 # TypeScript type definitions
    ├── __tests__/             # Jest + Testing Library test suite
    ├── package.json           # Frontend dependencies
    └── next.config.js         # Next.js configuration
```

## 👥 User Roles & Permissions

The platform supports six distinct user roles with specific permissions:

### 1. **Admin** (`ADMIN`)
- Full system access and user management
- Create and manage centers, schools, and all user types
- View system-wide analytics and reports
- Manage platform settings and configurations

### 2. **Center** (`CENTER`)
- Manage center-specific operations
- Create and assign students to educators
- Oversee center's schools and staff
- View center-specific reports and analytics

### 3. **Special Educator** (`SPECIAL_EDUCATOR`)
- Conduct assessments and create IEP goals
- Manage assigned students
- Create session notes and progress reports
- Access assessment tools and resources

### 4. **Super Special Educator** (`SUPER_SPECIAL_EDUCATOR`)
- Review and approve assessments from special educators
- Provide oversight across multiple centers
- Access advanced reporting and analytics
- Mentor and guide special educators

### 5. **Parent** (`PARENT`)
- View their child's progress and reports
- Access assessment results and IEP goals
- Communicate with educators
- Upload relevant documents

### 6. **School Viewer** (`SCHOOL_VIEWER`)
- Read-only access to school-specific data
- View student progress within their school
- Access reports for administrative purposes

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18.0.0 or higher) - [Download here](https://nodejs.org/)
- **Python** (v3.12 or higher) - [Download here](https://www.python.org/downloads/)
- **PostgreSQL** (v14 or higher) - [Download here](https://www.postgresql.org/download/)
- **Redis** (v7 or higher) - [Download here](https://redis.io/downloads/) *(required for AI agent state persistence)*
- **npm** (comes with Node.js) or **yarn** package manager
- **Git** for version control

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd assessment-tool
   ```

2. **Install dependencies for all services**
   ```bash
   # Install backend dependencies
   cd backend
   npm install
   
   # Install frontend dependencies
   cd ../frontend
   npm install

   # Install AI backend dependencies
   cd ../ai-backend
   python -m venv venv
   venv\Scripts\activate   # Windows
   # source venv/bin/activate  # macOS/Linux
   pip install -r requirements.txt
   ```
   
   Or use the root convenience script:
   ```bash
   npm run install:all
   ```

3. **Environment Configuration**
   
   **Backend Environment** (Create `backend/.env`):
   ```env
   # Database Configuration
   DATABASE_URL="postgresql://username:password@localhost:5432/knowled_assessment_db"
   
   # JWT Configuration
   JWT_SECRET="your-super-secure-jwt-secret-key-here"
   JWT_EXPIRES_IN="7d"
   
   # Server Configuration
   PORT=5000
   NODE_ENV="development"
   
   # CORS Configuration
   FRONTEND_URL="http://localhost:3000"
   
   # AI Backend Integration
   AI_BACKEND_URL="http://localhost:8000"
   
   # File Upload Configuration
   MAX_FILE_SIZE=10485760  # 10MB in bytes
   UPLOAD_PATH="./uploads"
   
   # Email Configuration (Optional)
   SMTP_HOST="your-smtp-host"
   SMTP_PORT=587
   SMTP_USER="your-email@domain.com"
   SMTP_PASS="your-email-password"
   ```
   
   **Frontend Environment** (Create `frontend/.env.local`):
   ```env
   # API Configuration
   NEXT_PUBLIC_API_URL="http://localhost:5000/api"
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   
   # Application Configuration
   NEXT_PUBLIC_APP_NAME="Knowled Assessment Platform"
   NEXT_PUBLIC_APP_VERSION="1.0.0"
   
   # Feature Flags
   NEXT_PUBLIC_ENABLE_ANALYTICS=false
   NEXT_PUBLIC_ENABLE_PWA=true
   ```
   
   **AI Backend Environment** (Create `ai-backend/.env`):
   ```env
   # OpenAI
   OPENAI_API_KEY="your-openai-api-key"
   
   # Database (asyncpg format for SQLAlchemy)
   DATABASE_URL="postgresql+asyncpg://username:password@localhost:5432/knowled_assessment_db"
   
   # Node.js Backend (for write-back operations)
   BACKEND_API_URL="http://localhost:5000"
   BACKEND_API_KEY="your-internal-api-key"
   
   # LangSmith Observability (Optional)
   LANGCHAIN_TRACING_V2=true
   LANGCHAIN_API_KEY="your-langsmith-api-key"
   LANGCHAIN_PROJECT=assessment-tool
   
   # Redis (LangGraph checkpointer)
   REDIS_URL="redis://localhost:6379/0"
   
   # LLM Configuration
   DEFAULT_MODEL="gpt-4o-mini"
   REPORT_MODEL="gpt-4o-mini"
   TEMPERATURE=0.3
   MAX_TOKENS=4000
   MAX_REPORT_TOKENS=4000
   
   # Cost Optimizations
   ENABLE_CACHE=true
   CACHE_TTL_SECONDS=86400
   ENABLE_BATCH_CALLS=true
   USE_JSON_MODE=true
   ```

4. **Database Setup**
   ```bash
   cd backend
   
   # Generate Prisma client
   npx prisma generate
   
   # Run database migrations
   npx prisma migrate dev --name init
   
   # Seed database with initial data
   npx prisma db seed
   
   # (Optional) Open Prisma Studio to view data
   npx prisma studio
   ```

5. **Start Development Servers**
   
   **Option 1: Start all three servers simultaneously**
   ```bash
   # From the root directory
   npm run dev:all
   ```
   
   **Option 2: Start servers in separate terminals**
   ```bash
   # Terminal 1 - Node.js Backend
   cd backend
   npm run dev
   
   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   
   # Terminal 3 - AI Backend
   cd ai-backend
   venv\Scripts\activate   # Windows
   # source venv/bin/activate  # macOS/Linux
   uvicorn app.main:app --reload --port 8000
   ```

6. **Access the Application**
   - **Frontend Application**: [http://localhost:3000](http://localhost:3000)
   - **Backend API**: [http://localhost:5000](http://localhost:5000)
   - **API Documentation**: [http://localhost:5000/api-docs](http://localhost:5000/api-docs) (if Swagger is configured)
   - **AI Backend API**: [http://localhost:8000](http://localhost:8000)
   - **AI Backend Docs (Swagger)**: [http://localhost:8000/docs](http://localhost:8000/docs)
   - **Prisma Studio**: [http://localhost:5555](http://localhost:5555) (when running `npx prisma studio`)

### Default Login Credentials
After seeding the database, you can use these default accounts:

```
Super Admin:
Email: admin@knowled.com
Password: admin123

Super Special Educator:
Email: super.educator@knowled.com
Password: educator123

Special Educator:
Email: educator@knowled.com
Password: educator123

Parent:
Email: parent@knowled.com
Password: parent123
```

### Troubleshooting

**Common Issues:**

1. **Database Connection Error**
   - Ensure PostgreSQL is running
   - Verify DATABASE_URL in `.env` file
   - Check database credentials and permissions

2. **Port Already in Use**
   - Change PORT in backend `.env` file
   - Update NEXT_PUBLIC_API_URL in frontend `.env.local`

3. **Prisma Client Issues**
   ```bash
   cd backend
   npx prisma generate
   npx prisma db push
   ```

4. **Node Modules Issues**
   ```bash
   # Clean install
   rm -rf node_modules package-lock.json
   npm install
   ```

## 🤖 AI Agents

The AI backend exposes six LangGraph-powered agents, each implemented as a multi-step state machine:

| Agent | Endpoint | Description |
|-------|----------|-------------|
| **Assessment Intelligence** | `POST /api/assessment/analyze` | Symptom analysis, severity scoring, risk classification, learning disability detection (7 nodes) |
| **IEP & Goal Planning** | `POST /api/iep/generate` | SMART goal generation — LTP, STP, and WLP planning (7 nodes) |
| **Lesson Plan** | `POST /api/lesson-plan/suggest` | Weekly lesson plan suggestions based on recent session progress (3 nodes) |
| **Report Generation** | `POST /api/report/generate` | Assessment, Lesson Plan, Parent, School, and Center reports (3 nodes) |
| **Risk & Progress** | `POST /api/risk/analyze` | Batch risk classification, trend analysis, and early warning detection (4 nodes) |
| **Educator Intelligence** | `POST /api/educator/insights` | Teaching effectiveness analysis, mentoring insights, and training recommendations (3 nodes) |

### AI Design Principles
- All AI-generated content (goals, plans, reports) is returned with `status: "AI_DRAFT"` and `editable: true` — educators review and approve before finalizing.
- Cost-optimized: GPT-4o-mini for agents, batched calls, response caching (Redis), JSON mode, and prompt compression.
- The Node.js backend integrates with the AI service via `aiBackendProxy.ts` using the `AI_BACKEND_URL` env variable.

### Estimated AI Costs
| Scale | First Run | With Caching |
|-------|-----------|-------------|
| 1 student | ~$0.011 | $0 (if cached) |
| 1,000 / month | ~$11 | ~$2–5 |
| 10,000 / month | ~$110 | ~$20–50 |

## 🔧 Key Technologies & Dependencies

### AI Backend Dependencies (Python)
- **fastapi** (>=0.115.0): High-performance async web framework
- **uvicorn** (>=0.30.0): ASGI server for FastAPI
- **pydantic** (>=2.9.0) & **pydantic-settings** (>=2.5.0): Data validation and settings management
- **langchain** (>=0.3.0): LLM orchestration framework
- **langchain-openai** (>=0.2.0): OpenAI integration for LangChain
- **langgraph** (>=0.2.28): Multi-step agent workflow engine with state machines
- **langgraph-checkpoint-postgres** (>=2.0.0): Persistent LangGraph state via PostgreSQL
- **langsmith** (>=0.1.120): LLM tracing, monitoring, and cost observability
- **asyncpg** (>=0.29.0) & **sqlalchemy[asyncio]** (>=2.0.35): Async PostgreSQL access
- **redis** (>=5.1.0): Response caching and LangGraph checkpoint storage
- **httpx** (>=0.27.0): Async HTTP client for Node.js backend write-back

### Backend Dependencies (Production)
- **@prisma/client** (^5.7.1): Modern database toolkit and ORM
- **express** (^4.18.2): Fast, unopinionated web framework
- **jsonwebtoken** (^9.0.2): JSON Web Token implementation
- **bcryptjs** (^2.4.3): Password hashing library
- **cors** (^2.8.5): Cross-origin resource sharing middleware
- **helmet** (^7.1.0): Security middleware for Express
- **multer** (^1.4.5-lts.1): Multipart/form-data middleware
- **express-validator** (^7.0.1): Request validation middleware
- **dotenv** (^16.3.1): Environment variable loader
- **socket.io** (^4.7.2): Real-time bidirectional communication
- **nodemailer** (^8.0.1): Email sending via SMTP
- **openai** (^6.10.0): OpenAI SDK for AI features
- **axios** (^1.13.6): HTTP client for AI backend proxy calls
- **@aws-sdk/client-s3** (^3.948.0): AWS S3 file storage
- **@aws-sdk/s3-request-presigner** (^3.948.0): Presigned URL generation
- **uuid** (^13.0.0): UUID generation

### Backend Development Dependencies
- **typescript** (^5.3.3): TypeScript language support
- **ts-node** (^10.9.2): TypeScript execution environment
- **ts-node-dev** (^2.0.0): Development server with auto-restart
- **prisma** (^5.7.1): Prisma CLI and development tools
- **jest** (^30.3.0) & **ts-jest** (^29.4.6): Test runner and TypeScript transformer
- **supertest** (^7.2.2): HTTP integration testing
- **jest-mock-extended** (^4.0.0): Type-safe mocking for Jest
- **@types/*** packages: TypeScript type definitions

### Frontend Dependencies (Production)
- **next** (^14.0.4): React framework with App Router
- **react** (^18.2.0) & **react-dom** (^18.2.0): React library
- **@tanstack/react-query** (^5.17.9): Powerful data synchronization for React
- **@tanstack/react-query-devtools** (^5.17.9): DevTools for React Query
- **axios** (^1.6.2): Promise-based HTTP client
- **react-hook-form** (^7.62.0): Performant forms with easy validation
- **zod** (^4.1.9): TypeScript-first schema validation
- **zustand** (^5.0.8): Small, fast, and scalable state management
- **socket.io-client** (^4.7.2): WebSocket client for real-time notifications
- **xlsx** (^0.18.5): Excel file reading and generation
- **mammoth** (^1.11.0): DOCX to HTML document conversion
- **pdfjs-dist** (^3.4.120): PDF rendering and text extraction
- **html2pdf.js** (^0.12.1): Client-side PDF report generation

### UI & Design System
- **@radix-ui/react-*** (Multiple packages): Accessible component primitives
  - alert-dialog, avatar, checkbox, dialog, dropdown-menu, popover, select, tabs, tooltip, and more
- **@shadcn/ui** (^0.0.4): Re-usable components built with Radix UI and Tailwind CSS
- **tailwindcss** (^3.4.0): Utility-first CSS framework
- **tailwindcss-animate** (^1.0.7): Animation utilities for Tailwind
- **tailwind-merge** (^2.6.0): Utility for merging Tailwind CSS classes
- **class-variance-authority** (^0.7.1): CVA for component variants
- **clsx** (^2.1.1): Utility for constructing className strings

### Animation & Motion
- **motion** (^12.23.15): Lightweight animation utilities

### Data Visualization & Icons
- **recharts** (^2.8.0): Composable charting library for React
- **lucide-react** (^0.303.0): Beautiful & consistent icon toolkit
- **@tabler/icons-react** (^3.35.0): Additional icon set

### Date & Time Handling
- **date-fns** (^3.6.0): Modern JavaScript date utility library
- **react-day-picker** (^9.11.0): Date picker component for React

### Development Tools & Utilities
- **react-use-measure** (^2.1.7): React hook for measuring elements
- **immer** (^10.1.3): Immutable state updates
- **@hookform/resolvers** (^5.2.2): Validation resolvers for React Hook Form

### Frontend Development Dependencies
- **typescript** (^5.3.3): TypeScript language support
- **eslint** (^8.56.0) & **eslint-config-next** (^14.0.4): Code linting
- **@typescript-eslint/*** packages: TypeScript-specific linting rules
- **autoprefixer** (^10.4.16) & **postcss** (^8.4.32): CSS processing
- **jest** (^30.3.0) & **jest-environment-jsdom** (^30.3.0): Test runner
- **@testing-library/react** (^16.3.2), **@testing-library/jest-dom** (^6.9.1): Component testing

## 🗄️ Database Schema

The application uses a comprehensive PostgreSQL schema with 40+ interconnected models managed through 26+ Prisma migrations:

### Core Authentication & User Management
- **User**: Base user authentication with role-based access (6 roles)
- **AdminProfile**: Administrator details and system access
- **CenterProfile**: Center/organization information and management
- **SpecialEducatorProfile**: Educator qualifications, RCI certifications, and specializations
- **SuperSpecialEducatorProfile**: Senior educator credentials with oversight capabilities
- **ParentProfile**: Parent/guardian information and emergency contacts
- **SchoolViewerProfile**: School staff with read-only access permissions

### Student & Educational Entities
- **Student**: Comprehensive demographics, academic details, and status tracking
- **School**: Educational institutions with center associations
- **IntakeForm**: Detailed intake with family background, medical history, and developmental information
- **StudentAssignment**: Student-educator assignments with active status tracking
- **CenterAssignment**: Educator-center relationships
- **SchoolAssignment**: Educator-school assignments with date tracking

### Assessment System
- **Assessment** / **NewAssessment**: Assessment records with status tracking and approval workflows
- **SkillAssessment**: Domain-specific skill evaluations (reading, writing, math)
- **FormalAssessment**: Standardized formal assessment records
- **ReadingAssessment**: Structured reading evaluation with section-level scoring
- **MathAssessment** / **WritingAssessment**: Subject-specific assessment models
- **AssessmentDomain**: Domain and sub-domain definitions for skill mapping

### IEP & Planning
- **IEPGoal**: Individualized Education Program goals with progress tracking
- **LongTermPlan** (LTP): Multi-year educational goals
- **ShortTermPlan** (STP): Term-level objectives linked to LTPs
- **WeeklyLessonPlan** (WLP): Weekly session plans linked to STPs
- **LearningMaterial**: Reusable resources attached to lesson plans
- **Homework**: Homework assignments with submission tracking

### Reporting
- **Report**: Multi-type reports (Intake, Assessment, IEP, LessonPlan, Progress) with approval workflows
- **CenterReportSnapshot**: Point-in-time center performance snapshots
- **ParentReportSnapshot**: Parent-facing progress snapshots
- **SchoolReport** / **SchoolAIReport**: School-level reports with AI-generated summaries

### Communication & Notifications
- **Notification**: In-app notifications with type enum and read status (Socket.IO delivered)
- **ParentConcern**: Parent-submitted concerns with priority levels and response tracking

### Document & Audit Management
- **StudentDocument**: S3-backed file storage for student documents
- **ParentDocument**: Parent-uploaded documents with categorization
- **AuditLog**: Comprehensive activity logging with user tracking and IP addresses

### Key Enums
- **UserRole**: ADMIN, SUPER_SPECIAL_EDUCATOR, SPECIAL_EDUCATOR, CENTER, PARENT, SCHOOL_VIEWER
- **AssessmentStatus**: PENDING, IN_PROGRESS, COMPLETED, REVIEWED
- **IEPGoalStatus**: NOT_STARTED, IN_PROGRESS, ACHIEVED, DISCONTINUED
- **ReportType**: INTAKE, ASSESSMENT, IEP, LESSON_PLAN, PROGRESS
- **NotificationType**: System-defined notification categories
- **StudentStatus**: ACTIVE, INACTIVE, GRADUATED, TRANSFERRED
- **Gender**: MALE, FEMALE, OTHER

## 🔐 Authentication & Security

### JWT Authentication
- Secure token-based authentication
- Role-based access control (RBAC)
- Token expiration and refresh mechanisms
- Password hashing with bcrypt

### API Security
- CORS configuration for cross-origin requests
- Helmet.js for security headers
- Input validation and sanitization
- Protected routes with middleware

### Frontend Security
- Secure token storage
- Route protection based on user roles
- Form validation and error handling
- XSS protection

## 📊 API Endpoints

### Authentication (`/api/auth`)
- `POST /login` - User login with role-based access
- `POST /change-password` - Secure password change
- `GET /profile` - Get authenticated user profile
- `PUT /profile` - Update user profile
- `POST /validate-token` - JWT token validation
- `POST /forgot-password` - Initiate password reset via email
- `POST /reset-password` - Complete password reset
- `POST /logout` - Logout and session cleanup

### Admin (`/api/admin`)
- `GET /users` - List all users with filtering and pagination
- `POST /users` - Create new user accounts
- `PUT /users/:id` - Update user information
- `DELETE /users/:id` - Delete user accounts
- `POST /users/:id/activate` / `POST /users/:id/deactivate` - Toggle user status
- `GET /audit-logs` - System audit trail
- `GET /system-overview` - Platform-wide statistics

### Centers (`/api/centers`)
- `GET /` / `POST /` / `PUT /:id` - CRUD for centers
- `GET /:id/schools` - Schools under a center
- `GET /:id/students` - Students in a center
- `GET /:id/educators` - Assigned educators
- `POST /:id/assign-educator` - Assign educators

### Schools (`/api/schools`)
- `GET /` / `POST /` / `PUT /:id` - CRUD for schools
- `GET /:id/students` - Students in a school
- `POST /:id/assign-educator` - Assign educators to schools

### School Viewers (`/api/schoolViewers`)
- `GET /dashboard` - School overview dashboard
- `GET /students` - Students in assigned school
- `GET /students/:id` - Student detail view
- `GET /reports` - School-level reports

### Students (`/api/students`)
- `GET /` / `POST /` / `PUT /:id` / `GET /:id` - Student CRUD
- `POST /:id/assign-educator` - Assign educators
- `GET /:id/assessments` - Student assessments
- `GET /:id/reports` - Progress reports
- `GET /:id/documents` / `POST /:id/documents` - Document management
- `GET /:id/intake-form` / `POST /:id/intake-form` - Intake form management

### Skill Assessments (`/api/newAssessments`)
- `POST /reading` / `POST /writing` / `POST /math` - Create domain assessments
- `GET /:id` - Get assessment details
- `PUT /:id` - Update assessment
- `POST /:id/submit` / `POST /:id/approve` / `POST /:id/reject` - Assessment workflow
- `POST /formal` - Submit formal assessment results

### IEP Management (`/api/iep`)
- `POST /ltp` - Create Long-Term Plan
- `GET /ltp/:studentId` - Get student LTPs
- `POST /stp` - Create Short-Term Plan linked to LTP
- `POST /wlp` - Create Weekly Lesson Plan linked to STP
- `PUT /ltp/:id` / `PUT /stp/:id` / `PUT /wlp/:id` - Update plans
- `GET /student/:studentId` - Full IEP hierarchy for a student

### Lesson Plans & Homework (`/api/lessonPlansHomework`)
- `GET /lesson-plans` / `POST /lesson-plans` - Lesson plan management
- `GET /lesson-plans/:id` / `PUT /lesson-plans/:id` - Plan details and updates
- `POST /homework` - Assign homework
- `GET /homework/:studentId` - Get student homework
- `PUT /homework/:id` - Update homework status

### Special Educators (`/api/specialEducators`)
- `GET /profile` / `PUT /profile` - Profile management
- `GET /students` - Assigned students
- `GET /assessments` - Educator's assessments
- `GET /reports` - Educator's reports

### Super Special Educators (`/api/superSpecialEducators`)
- `GET /profile` / `PUT /profile` - Profile management
- `GET /pending-reviews` - Assessments awaiting review
- `GET /educators` - Supervised educators
- `GET /centers` - Assigned centers
- `GET /analytics` - Advanced analytics
- `GET /flagged-cases` - Cases requiring attention
- `POST /reviews/:assessmentId` - Submit review

### Parents (`/api/parents`)
- `GET /profile` / `PUT /profile` - Profile management
- `GET /children` - Children information
- `GET /children/:id/reports` / `GET /children/:id/assessments` - Child data
- `POST /concerns` / `GET /concerns` - Concern management
- `POST /documents` / `GET /documents` - Document management
- `GET /children/:id/homework` - Child homework view

### Reports (`/api/reports`)
- `GET /` / `POST /` - List and generate reports
- `GET /:id` / `POST /:id/approve` - Report detail and approval
- `GET /center/:centerId` - Center reports with snapshots
- `GET /school/:schoolId` - School reports
- `GET /parent/:parentId` - Parent-facing reports

### Notifications (`/api/notifications`)
- `GET /` - Get user notifications
- `PUT /:id/read` - Mark notification as read
- `PUT /read-all` - Mark all as read
- `GET /unread-count` - Unread notification count

### AI Proxy (`/api/ai`)
- `POST /assessment/analyze` - Proxy to AI assessment agent
- `POST /iep/generate` - Proxy to IEP generation agent
- `POST /lesson-plan/suggest` - Proxy to lesson plan agent
- `POST /report/generate` - Proxy to report generation agent
- `POST /risk/analyze` - Proxy to risk analysis agent
- `POST /educator/insights` - Proxy to educator intelligence agent

### Files (`/api/files`)
- `POST /upload` - Upload to AWS S3
- `GET /:id` - Presigned download URL
- `DELETE /:id` - Delete file (authorized users only)

## 🎨 UI/UX Features

### Design System
- Consistent design language with shadcn/ui
- Accessible components with Radix UI
- Responsive design for all screen sizes
- Dark/light mode support (configurable)

### User Experience
- Role-based dashboards and navigation
- Real-time notifications via Socket.IO
- AI-assisted content with inline editing and approval workflow
- Text-to-speech accessibility features
- Form validation with helpful error messages

### Responsive Design
- Mobile-first approach
- Tablet and desktop optimizations
- Touch-friendly interfaces
- Progressive web app capabilities

## 🛠️ Development Scripts

### Backend Scripts
```bash
# Development & Build
npm run dev          # Start with ts-node-dev hot reload
npm run build        # Compile TypeScript (runs prisma generate first)
npm run start        # Start production server from compiled JS

# Database Management
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema changes to database
npm run db:migrate   # Run migrations (dev mode)
npm run db:migrate:deploy  # Run migrations (production)
npm run db:seed      # Seed database with sample data

# Testing
npm run test              # Run all Jest tests
npm run test:watch        # Run tests in watch mode
npm run test:coverage     # Generate coverage report
npm run test:unit         # Run unit tests only
npm run test:integration  # Run integration tests only
npm run test:file         # Run tests matching a file pattern
```

### Frontend Scripts
```bash
# Development & Build
npm run dev          # Start Next.js development server (localhost:3000)
npm run build        # Build optimized production bundle
npm run start        # Start production server

# Code Quality
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking without emitting

# Testing
npm run test          # Run all Jest tests
npm run test:watch    # Run tests in watch mode
npm run test:coverage # Generate coverage report
```

### AI Backend Scripts
```bash
# Activate virtual environment first
venv\Scripts\activate        # Windows
source venv/bin/activate     # macOS/Linux

# Development
uvicorn app.main:app --reload --port 8000   # Start dev server with hot-reload

# Testing
pytest tests/ -v             # Run full test suite
pytest tests/ -v -k "test_name"  # Run specific test

# Dependency management
pip install -r requirements.txt  # Install dependencies
pip freeze > requirements.txt    # Update pinned versions
```

### Full Stack Development
```bash
# Root level scripts for managing all three services
npm run install:all   # Install all dependencies (Node.js + Python venv)
npm run dev:all       # Start frontend, backend, and AI backend concurrently
npm run build:all     # Build both Node.js services for production
npm run dev:frontend  # Start frontend only
npm run dev:backend   # Start Node.js backend only
npm run dev:ai-backend  # Start AI backend only
```

## 🚀 Deployment

### Backend Deployment
1. Build the application: `npm run build`
2. Set production environment variables
3. Run database migrations: `npm run db:migrate`
4. Start the server: `npm start`

### Frontend Deployment
1. Build the application: `npm run build`
2. Deploy to your preferred hosting platform (Vercel, Netlify, etc.)
3. Configure environment variables for production API URL

### AI Backend Deployment
1. **Docker** (recommended):
   ```bash
   cd ai-backend
   docker build -t knowled-ai-backend .
   docker run -p 8000:8000 --env-file .env knowled-ai-backend
   ```
2. Set all required environment variables (see AI Backend Environment section above)
3. Ensure Redis and PostgreSQL are accessible from the deployment environment
4. Update `AI_BACKEND_URL` in the Node.js backend's production `.env`



## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👨‍💻 Development Team

**Knowled Team** - Special Education Technology Specialists

## 📞 Support

For support and questions, please contact the development team or create an issue in the repository.

---

*This platform is designed to empower special education professionals, students, and families through technology-enhanced learning and assessment tools.*