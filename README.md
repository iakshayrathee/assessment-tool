# Knowled - Special Education Management Platform

A comprehensive, enterprise-grade platform for managing special education programs, assessments, and student progress tracking. This full-stack application provides role-based access for administrators, centers, educators, parents, and school viewers to collaborate effectively in special education management with advanced features for intake forms, IEP goals, assessments, and detailed reporting.

## 🏗️ Architecture Overview

This project follows a modern full-stack architecture with clear separation of concerns and enterprise-level scalability:

### Technology Stack
- **Frontend**: Next.js 14 with App Router, TypeScript, TanStack Query (React Query), and Tailwind CSS
- **Backend**: Node.js with Express.js and TypeScript
- **Database**: PostgreSQL with Prisma ORM v5.7.1
- **Authentication**: JWT-based authentication with role-based access control (RBAC)
- **UI Framework**: Radix UI primitives with shadcn/ui design system
- **State Management**: Zustand for client-side state management
- **Form Handling**: React Hook Form with Zod validation
- **Charts & Analytics**: Recharts for data visualization
- **File Handling**: Multer for secure file uploads
- **Animation**: Framer Motion for smooth UI transitions

## 📁 Project Structure

```
assessment-tool/
├── backend/                    # Node.js/Express API server
│   ├── src/
│   │   ├── controllers/        # Request handlers for all entities
│   │   │   ├── AdminController.ts
│   │   │   ├── AssessmentController.ts
│   │   │   ├── AuthController.ts
│   │   │   ├── CenterController.ts
│   │   │   ├── FileController.ts
│   │   │   ├── ParentController.ts
│   │   │   ├── SchoolController.ts
│   │   │   ├── SpecialEducatorController.ts
│   │   │   ├── StudentController.ts
│   │   │   └── SuperSpecialEducatorController.ts
│   │   ├── middleware/         # Custom middleware
│   │   │   └── profileMiddleware.ts
│   │   ├── models/            # TypeScript interfaces
│   │   ├── repositories/      # Data access layer
│   │   │   ├── AssessmentRepository.ts
│   │   │   ├── StudentRepository.ts
│   │   │   └── UserRepository.ts
│   │   ├── routes/            # API route definitions
│   │   │   ├── admin.ts
│   │   │   ├── assessments.ts
│   │   │   ├── auth.ts
│   │   │   ├── centers.ts
│   │   │   ├── files.ts
│   │   │   ├── parents.ts
│   │   │   ├── reports.ts
│   │   │   ├── schools.ts
│   │   │   ├── specialEducators.ts
│   │   │   ├── students.ts
│   │   │   └── superSpecialEducators.ts
│   │   ├── services/          # Business logic layer
│   │   │   ├── AdminService.ts
│   │   │   ├── AssessmentService.ts
│   │   │   ├── AuthService.ts
│   │   │   ├── CenterService.ts
│   │   │   ├── ParentService.ts
│   │   │   ├── SpecialEducatorService.ts
│   │   │   ├── StudentService.ts
│   │   │   └── SuperSpecialEducatorService.ts
│   │   └── utils/             # Utility functions
│   │       ├── auth.ts
│   │       ├── errors.ts
│   │       ├── helpers.ts
│   │       └── validation.ts
│   ├── prisma/
│   │   ├── migrations/        # Database migrations with history
│   │   │   ├── 20250917231657_init/
│   │   │   ├── 20250926204151_make_parent_optional/
│   │   │   ├── 20251012092744_add_missing_educator_fields/
│   │   │   ├── 20251013085657_add_medication_details_field/
│   │   │   └── 20251016195213_add_school_assignments/
│   │   ├── schema.prisma      # Complete database schema
│   │   └── seed.ts           # Database seeding scripts
│   ├── package.json          # Backend dependencies
│   └── tsconfig.json         # TypeScript configuration
└── frontend/                   # Next.js React application
    ├── app/                   # Next.js App Router (file-based routing)
    │   ├── admin/             # Admin dashboard pages
    │   │   ├── approvals/     # Assessment approvals
    │   │   ├── audit-logs/    # System audit logs
    │   │   ├── centers-schools/ # Center and school management
    │   │   ├── child-records/ # Student records management
    │   │   ├── dashboard/     # Admin overview dashboard
    │   │   ├── educators/     # Educator management
    │   │   ├── overview/      # System overview
    │   │   ├── reports/       # Administrative reports
    │   │   ├── settings/      # System settings
    │   │   └── user-management/ # User account management
    │   ├── center/            # Center management pages
    │   │   ├── compliance/    # Compliance tracking
    │   │   ├── dashboard/     # Center dashboard
    │   │   ├── educators/     # Educator assignments
    │   │   ├── reports/       # Center reports
    │   │   ├── schools/       # School management
    │   │   └── students/      # Student management
    │   ├── educator/          # Special educator pages
    │   │   ├── assessments/   # Assessment tools
    │   │   ├── dashboard/     # Educator dashboard
    │   │   ├── intake/        # Student intake forms
    │   │   ├── lesson-plans/  # Lesson planning
    │   │   ├── profile/       # Educator profile
    │   │   ├── reports/       # Progress reports
    │   │   └── students/      # Student management
    │   ├── parent/            # Parent portal pages
    │   │   ├── children/      # Child information
    │   │   ├── concerns/      # Parent concerns
    │   │   ├── dashboard/     # Parent dashboard
    │   │   ├── documents/     # Document management
    │   │   └── profile/       # Parent profile
    │   ├── super-special-educator/ # Super educator pages
    │   │   ├── analytics/     # Advanced analytics
    │   │   ├── centers/       # Center oversight
    │   │   ├── educators/     # Educator supervision
    │   │   ├── flagged-cases/ # Cases requiring attention
    │   │   ├── reviews/       # Assessment reviews
    │   │   └── students/      # Student oversight
    │   ├── login/             # Role-based login pages
    │   ├── forgot-password/   # Password recovery
    │   └── reset-password/    # Password reset
    ├── components/            # Reusable React components
    │   ├── admin/             # Admin-specific components
    │   ├── center/            # Center-specific components
    │   ├── layout/            # Layout components
    │   │   ├── AppLayout.tsx
    │   │   ├── EducatorLayout.tsx
    │   │   ├── UnifiedLayout.tsx
    │   │   └── Sidebar components
    │   ├── modals/            # Modal components
    │   │   ├── AddStudentModal.tsx
    │   │   ├── AssignEducatorModal.tsx
    │   │   ├── CreateUserModal.tsx
    │   │   └── UserAssignmentModal.tsx
    │   └── ui/                # Base UI components (40+ components)
    ├── hooks/                 # Custom React hooks
    │   ├── useAuth.ts         # Authentication hooks
    │   ├── useAdmin.ts        # Admin functionality
    │   ├── useEducator.ts     # Educator functionality
    │   ├── useStudents.ts     # Student management
    │   └── useAssessments.ts  # Assessment management
    ├── lib/                   # Utility libraries
    ├── types/                 # TypeScript type definitions
    ├── package.json          # Frontend dependencies
    └── next.config.js        # Next.js configuration
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
- **PostgreSQL** (v14 or higher) - [Download here](https://www.postgresql.org/download/)
- **npm** (comes with Node.js) or **yarn** package manager
- **Git** for version control

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd assessment-tool
   ```

2. **Install dependencies for both frontend and backend**
   ```bash
   # Install backend dependencies
   cd backend
   npm install
   
   # Install frontend dependencies
   cd ../frontend
   npm install
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
   
   **Option 1: Start both servers simultaneously**
   ```bash
   # From the root directory (if you have a root package.json)
   npm run dev:all
   ```
   
   **Option 2: Start servers in separate terminals**
   ```bash
   # Terminal 1 - Backend Server
   cd backend
   npm run dev
   
   # Terminal 2 - Frontend Server
   cd frontend
   npm run dev
   ```

6. **Access the Application**
   - **Frontend Application**: [http://localhost:3000](http://localhost:3000)
   - **Backend API**: [http://localhost:5000](http://localhost:5000)
   - **API Documentation**: [http://localhost:5000/api-docs](http://localhost:5000/api-docs) (if Swagger is configured)
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

## 🔧 Key Technologies & Dependencies

### Backend Dependencies (Production)
- **@prisma/client** (^5.7.1): Modern database toolkit and ORM
- **express** (^4.18.2): Fast, unopinionated web framework
- **jsonwebtoken** (^9.0.2): JSON Web Token implementation
- **bcryptjs** (^2.4.3): Password hashing library
- **cors** (^2.8.5): Cross-origin resource sharing middleware
- **helmet** (^7.1.0): Security middleware for Express
- **multer** (^1.4.5-lts.1): Middleware for handling multipart/form-data
- **express-validator** (^7.0.1): Express middleware for validation
- **dotenv** (^16.3.1): Environment variable loader

### Backend Development Dependencies
- **typescript** (^5.3.3): TypeScript language support
- **ts-node** (^10.9.2): TypeScript execution environment
- **ts-node-dev** (^2.0.0): Development server with auto-restart
- **prisma** (^5.7.1): Prisma CLI and development tools
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

### UI & Design System
- **@radix-ui/react-*** (Multiple packages): Accessible component primitives
  - alert-dialog, avatar, checkbox, dialog, dropdown-menu, popover, select, tabs, tooltip, and more
- **@shadcn/ui** (^0.0.4): Re-usable components built with Radix UI and Tailwind CSS
- **tailwindcss** (^3.4.0): Utility-first CSS framework
- **tailwindcss-animate** (^1.0.7): Animation utilities for Tailwind
- **tailwind-merge** (^2.6.0): Utility for merging Tailwind CSS classes
- **class-variance-authority** (^0.7.1): CVA for component variants
- **clsx** (^2.1.1): Utility for constructing className strings

### Animation & Interaction
- **framer-motion** (^10.18.0): Production-ready motion library for React
- **motion** (^12.23.15): Additional motion utilities
- **@react-spring/web** (^10.0.2): Spring-physics based animations

### Data Visualization & Icons
- **recharts** (^2.8.0): Composable charting library for React
- **lucide-react** (^0.303.0): Beautiful & consistent icon toolkit
- **@tabler/icons-react** (^3.35.0): Additional icon set

### Date & Time Handling
- **date-fns** (^3.6.0): Modern JavaScript date utility library
- **react-day-picker** (^9.11.0): Date picker component for React

### Development Tools & Utilities
- **react-hot-toast** (^2.4.1): Smoking hot React notifications
- **react-use-measure** (^2.1.7): React hook for measuring elements
- **immer** (^10.1.3): Immutable state updates
- **@hookform/resolvers** (^5.2.2): Validation resolvers for React Hook Form

### Frontend Development Dependencies
- **typescript** (^5.3.3): TypeScript language support
- **eslint** (^8.56.0) & **eslint-config-next** (^14.0.4): Code linting
- **@typescript-eslint/*** packages: TypeScript-specific linting rules
- **autoprefixer** (^10.4.16) & **postcss** (^8.4.32): CSS processing

## 🗄️ Database Schema

The application uses a comprehensive PostgreSQL schema with 20+ interconnected models designed for scalability and data integrity:

### Core Authentication & User Management
- **User**: Base user authentication with role-based access (6 roles)
- **AdminProfile**: Administrator details and system access
- **CenterProfile**: Center/organization information and management
- **SpecialEducatorProfile**: Detailed educator qualifications, certifications, and specializations
- **SuperSpecialEducatorProfile**: Senior educator credentials with oversight capabilities
- **ParentProfile**: Parent/guardian information and emergency contacts
- **SchoolViewerProfile**: School staff with read-only access permissions

### Educational Entities
- **Student**: Comprehensive student information including demographics, academic details, and status tracking
- **School**: Educational institutions with contact information and center associations
- **IntakeForm**: Detailed student intake with family background, medical history, and developmental information
- **Assessment**: Assessment records with status tracking and educator assignments
- **IEPGoal**: Individualized Education Program goals with progress tracking
- **SessionNote**: Detailed session documentation and progress notes
- **Report**: Multi-type reports (Intake, Assessment, IEP, Progress) with approval workflows

### Assignment & Relationship Management
- **StudentAssignment**: Student-educator assignments with active status tracking
- **CenterAssignment**: Educator-center relationships for both special and super special educators
- **SchoolAssignment**: Educator-school assignments with date tracking
- **ParentConcern**: Parent-submitted concerns with priority levels and response tracking

### Document & Audit Management
- **StudentDocument**: Secure file storage for student-related documents
- **ParentDocument**: Parent-uploaded documents with categorization
- **AuditLog**: Comprehensive system activity logging with user tracking and IP addresses

### Key Enums & Status Types
- **UserRole**: ADMIN, SUPER_SPECIAL_EDUCATOR, SPECIAL_EDUCATOR, CENTER, PARENT, SCHOOL_VIEWER
- **AssessmentStatus**: PENDING, IN_PROGRESS, COMPLETED, REVIEWED
- **IEPGoalStatus**: NOT_STARTED, IN_PROGRESS, ACHIEVED, DISCONTINUED
- **ReportType**: INTAKE, ASSESSMENT, IEP, PROGRESS
- **StudentStatus**: ACTIVE, INACTIVE, GRADUATED, TRANSFERRED
- **Gender**: MALE, FEMALE, OTHER

### Advanced Features
- **Cascade Deletions**: Proper data cleanup with foreign key constraints
- **Audit Trails**: Complete activity logging for compliance and security
- **File Management**: Secure document storage with metadata tracking
- **Multi-language Support**: Primary and secondary language tracking
- **Certification Tracking**: RCI certification validity and renewal dates
- **Flexible Assignments**: Many-to-many relationships between educators, centers, and schools

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

### Authentication Routes (`/api/auth`)
- `POST /login` - User authentication with role-based access
- `POST /register` - User registration with profile creation
- `POST /change-password` - Secure password change
- `GET /profile` - Get authenticated user profile
- `PUT /profile` - Update user profile information
- `POST /validate-token` - JWT token validation
- `POST /logout` - User logout and session cleanup

### Administrative Routes (`/api/admin`)
- `GET /users` - List all users with filtering and pagination
- `POST /users` - Create new user accounts
- `PUT /users/:id` - Update user information
- `DELETE /users/:id` - Deactivate user accounts
- `GET /users/stats` - User statistics and analytics
- `POST /users/:id/activate` - Activate user accounts
- `POST /users/:id/deactivate` - Deactivate user accounts
- `GET /audit-logs` - System audit trail
- `GET /system-overview` - Platform-wide statistics

### Center Management (`/api/centers`)
- `GET /` - List all centers with details
- `POST /` - Create new centers
- `PUT /:id` - Update center information
- `GET /:id/schools` - Get schools under a center
- `GET /:id/students` - Get students in a center
- `GET /:id/educators` - Get assigned educators
- `POST /:id/assign-educator` - Assign educators to centers
- `GET /:id/reports` - Center-specific reports

### School Management (`/api/schools`)
- `GET /` - List schools with center associations
- `POST /` - Create new schools
- `PUT /:id` - Update school information
- `GET /:id/students` - Get students in a school
- `POST /:id/assign-educator` - Assign educators to schools
- `GET /:id/viewers` - Get school viewer accounts

### Student Management (`/api/students`)
- `GET /` - List students with filtering options
- `POST /` - Register new students
- `PUT /:id` - Update student information
- `GET /:id` - Get detailed student profile
- `POST /:id/assign-educator` - Assign educators to students
- `GET /:id/assessments` - Get student assessments
- `GET /:id/reports` - Get student progress reports
- `GET /:id/documents` - Get student documents
- `POST /:id/documents` - Upload student documents
- `GET /:id/intake-form` - Get student intake form
- `POST /:id/intake-form` - Create/update intake form

### Assessment Management (`/api/assessments`)
- `GET /` - List assessments with status filtering
- `POST /` - Create new assessments
- `PUT /:id` - Update assessment details
- `GET /:id` - Get detailed assessment information
- `POST /:id/submit` - Submit assessment for review
- `POST /:id/approve` - Approve assessment (Super Educator)
- `POST /:id/reject` - Reject assessment with feedback
- `GET /:id/history` - Get assessment revision history

### Special Educator Routes (`/api/specialEducators`)
- `GET /profile` - Get educator profile
- `PUT /profile` - Update educator profile
- `GET /students` - Get assigned students
- `GET /assessments` - Get educator's assessments
- `POST /session-notes` - Create session notes
- `GET /session-notes` - Get session notes history
- `POST /iep-goals` - Create IEP goals
- `PUT /iep-goals/:id` - Update IEP goals
- `GET /reports` - Get educator's reports

### Super Special Educator Routes (`/api/superSpecialEducators`)
- `GET /profile` - Get super educator profile
- `PUT /profile` - Update super educator profile
- `GET /pending-reviews` - Get assessments pending review
- `GET /educators` - Get supervised educators
- `GET /centers` - Get assigned centers
- `GET /analytics` - Get advanced analytics
- `GET /flagged-cases` - Get cases requiring attention
- `POST /reviews/:assessmentId` - Submit assessment review

### Parent Portal Routes (`/api/parents`)
- `GET /profile` - Get parent profile
- `PUT /profile` - Update parent profile
- `GET /children` - Get children information
- `GET /children/:id/reports` - Get child's progress reports
- `GET /children/:id/assessments` - Get child's assessments
- `POST /concerns` - Submit parent concerns
- `GET /concerns` - Get submitted concerns
- `POST /documents` - Upload parent documents
- `GET /documents` - Get uploaded documents

### Report Management (`/api/reports`)
- `GET /` - List reports with filtering
- `POST /` - Generate new reports
- `GET /:id` - Get detailed report
- `POST /:id/approve` - Approve report
- `GET /types` - Get available report types
- `GET /templates` - Get report templates

### File Management (`/api/files`)
- `POST /upload` - Upload files securely
- `GET /:id` - Download files with access control
- `DELETE /:id` - Delete files (authorized users only)
- `GET /:id/metadata` - Get file metadata

### System Routes
- `GET /health` - Health check endpoint
- `GET /version` - API version information
- `GET /config` - Public configuration settings

## 🎨 UI/UX Features

### Design System
- Consistent design language with shadcn/ui
- Accessible components with Radix UI
- Responsive design for all screen sizes
- Dark/light mode support (configurable)

### User Experience
- Role-based dashboards
- Intuitive navigation and workflows
- Real-time data updates with React Query
- Smooth animations with Framer Motion
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
npm run dev          # Start development server with ts-node-dev hot reload
npm run build        # Compile TypeScript to JavaScript
npm run start        # Start production server from compiled JS
npm run prod         # Build and start production server

# Database Management
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema changes to database
npm run db:migrate   # Run database migrations
npm run db:seed      # Seed database with sample data
npm run db:studio    # Open Prisma Studio for database management
npm run db:reset     # Reset database and run migrations

# Code Quality & Testing
npm run lint         # Run ESLint for code quality
npm run lint:fix     # Fix ESLint issues automatically
npm run test         # Run test suite
npm run test:watch   # Run tests in watch mode
npm run type-check   # TypeScript type checking
```

### Frontend Scripts
```bash
# Development & Build
npm run dev          # Start Next.js development server (localhost:3000)
npm run build        # Build optimized production bundle
npm run start        # Start production server
npm run export       # Export static site

# Code Quality & Analysis
npm run lint         # Run ESLint for code quality
npm run lint:fix     # Fix ESLint issues automatically
npm run type-check   # TypeScript type checking without emitting
npm run analyze      # Analyze bundle size

# Styling & UI
npm run ui:add       # Add new shadcn/ui components
npm run ui:update    # Update existing UI components
```

### Full Stack Development
```bash
# Root level scripts for managing both frontend and backend
npm run install:all  # Install dependencies for both frontend and backend
npm run dev:all      # Start both frontend and backend in development mode
npm run build:all    # Build both frontend and backend for production
npm run clean        # Clean all node_modules and build artifacts
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



## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👨‍💻 Development Team

**Knowled Team** - Special Education Technology Specialists

## 📞 Support

For support and questions, please contact the development team or create an issue in the repository.

---

*This platform is designed to empower special education professionals, students, and families through technology-enhanced learning and assessment tools.*