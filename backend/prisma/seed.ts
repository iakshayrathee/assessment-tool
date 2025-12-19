import { PrismaClient, UserRole, Gender, StudentStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seeding...');

    // Clear existing data (in reverse order of dependencies)
    console.log('🗑️  Clearing existing data...');
    await prisma.studentAssignment.deleteMany();
    await prisma.centerAssignment.deleteMany();
    await prisma.schoolAssignment.deleteMany();
    await prisma.student.deleteMany();
    await prisma.school.deleteMany();
    await prisma.schoolViewerProfile.deleteMany();
    await prisma.parentProfile.deleteMany();
    await prisma.specialEducatorProfile.deleteMany();
    await prisma.superSpecialEducatorProfile.deleteMany();
    await prisma.centerProfile.deleteMany();
    await prisma.adminProfile.deleteMany();
    await prisma.user.deleteMany();

    // Hash password for all users (using 'password123' as default)
    const hashedPassword = await bcrypt.hash('password123', 10);

    // ============================================
    // 1. CREATE ADMIN USERS (5)
    // ============================================
    console.log('👤 Creating Admin users...');
    const admins = [];
    for (let i = 1; i <= 5; i++) {
        const admin = await prisma.user.create({
            data: {
                email: `admin${i}@knowled.com`,
                password: hashedPassword,
                role: UserRole.ADMIN,
                isActive: true,
                adminProfile: {
                    create: {
                        fullName: `Admin User ${i}`,
                        phone: `+91-98765-432${i}0`,
                    },
                },
            },
            include: { adminProfile: true },
        });
        admins.push(admin);
        console.log(`  ✓ Created admin: ${admin.email}`);
    }

    // ============================================
    // 2. CREATE CENTER USERS (5)
    // ============================================
    console.log('🏢 Creating Center users...');
    const centers = [];
    const centerNames = [
        'Bright Minds Learning Center',
        'Hope Special Education Center',
        'Rainbow Child Development Center',
        'Sunshine Learning Hub',
        'Excellence Special Needs Center',
    ];

    for (let i = 1; i <= 5; i++) {
        const center = await prisma.user.create({
            data: {
                email: `center${i}@knowled.com`,
                password: hashedPassword,
                role: UserRole.CENTER,
                isActive: true,
                centerProfile: {
                    create: {
                        centerName: centerNames[i - 1],
                        address: `${100 + i} Education Street, District ${i}, City`,
                        phone: `+91-98765-${1000 + i}`,
                        email: `contact@center${i}.com`,
                        contactPerson: `Center Manager ${i}`,
                        operatingHours: '9:00 AM - 5:00 PM, Mon-Fri',
                        description: `A dedicated special education center focused on providing quality education and support for children with learning differences.`,
                    },
                },
            },
            include: { centerProfile: true },
        });
        centers.push(center);
        console.log(`  ✓ Created center: ${center.centerProfile?.centerName}`);
    }

    // ============================================
    // 3. CREATE SCHOOLS (10 - 2 per center)
    // ============================================
    console.log('🏫 Creating Schools...');
    const schools = [];
    const schoolPrefixes = ['St. Mary\'s', 'Delhi Public', 'Kendriya Vidyalaya', 'National Public', 'Modern'];

    for (let i = 0; i < 10; i++) {
        const centerIndex = Math.floor(i / 2);
        const school = await prisma.school.create({
            data: {
                name: `${schoolPrefixes[i % 5]} School ${i + 1}`,
                address: `${200 + i} School Road, Area ${i + 1}`,
                phone: `+91-98765-${2000 + i}`,
                email: `school${i + 1}@education.com`,
                principalName: `Principal ${String.fromCharCode(65 + i)}`,
                centerId: centers[centerIndex].centerProfile!.id,
            },
        });
        schools.push(school);
        console.log(`  ✓ Created school: ${school.name}`);
    }

    // ============================================
    // 4. CREATE SUPER SPECIAL EDUCATORS (5)
    // ============================================
    console.log('👨‍🏫 Creating Super Special Educator users...');
    const superEducators = [];
    const superEducatorNames = [
        'Dr. Priya Sharma',
        'Dr. Rajesh Kumar',
        'Dr. Anita Desai',
        'Dr. Vikram Singh',
        'Dr. Meera Patel',
    ];

    for (let i = 1; i <= 5; i++) {
        const superEducator = await prisma.user.create({
            data: {
                email: `supereducator${i}@knowled.com`,
                password: hashedPassword,
                role: UserRole.SUPER_SPECIAL_EDUCATOR,
                isActive: true,
                superSpecialEducatorProfile: {
                    create: {
                        fullName: superEducatorNames[i - 1],
                        phone: `+91-98765-${3000 + i}`,
                        dateOfBirth: new Date(1975 + i, i - 1, 15),
                        gender: i % 2 === 0 ? Gender.MALE : Gender.FEMALE,
                        address: `${300 + i} Educator Colony, Sector ${i}`,
                        primaryLanguage: 'English',
                        secondaryLanguages: ['Hindi', 'Tamil'],
                        highestQualification: 'Ph.D. in Special Education',
                        fieldOfStudy: 'Special Education',
                        institutionName: `University of Education ${i}`,
                        yearOfGraduation: 2000 + i,
                        rciCertified: true,
                        rciValidityDate: new Date(2025 + i, 11, 31),
                        specialEdQualification: 'M.Ed. Special Education',
                        specializationAreas: ['Learning Disabilities', 'Autism Spectrum Disorders', 'ADHD'],
                        yearsOfExperience: 15 + i,
                        experienceTypes: ['Clinical', 'Educational', 'Research'],
                        maxGroupSize: 8,
                        currentWorkLocations: ['Center', 'School'],
                        ldTypesHandled: ['Dyslexia', 'Dyscalculia', 'Dysgraphia'],
                        gradeLevelsServed: ['Pre-K', 'Elementary', 'Middle School'],
                        assessmentTools: 'WISC-V, WIAT-III, Woodcock-Johnson',
                        assistiveTechProficiency: ['Screen Readers', 'Speech-to-Text', 'Educational Apps'],
                        areasOfInterest: ['Inclusive Education', 'Assistive Technology', 'Curriculum Development'],
                        consentToShare: true,
                        agreementToPolicies: true,
                        personalStatement: `Dedicated to empowering children with special needs through evidence-based practices and compassionate support.`,
                    },
                },
            },
            include: { superSpecialEducatorProfile: true },
        });
        superEducators.push(superEducator);
        console.log(`  ✓ Created super educator: ${superEducator.superSpecialEducatorProfile?.fullName}`);
    }

    // ============================================
    // 5. CREATE SPECIAL EDUCATORS (5)
    // ============================================
    console.log('👩‍🏫 Creating Special Educator users...');
    const educators = [];
    const educatorNames = [
        'Sneha Reddy',
        'Amit Verma',
        'Kavita Nair',
        'Rohit Malhotra',
        'Pooja Iyer',
    ];

    for (let i = 1; i <= 5; i++) {
        const educator = await prisma.user.create({
            data: {
                email: `educator${i}@knowled.com`,
                password: hashedPassword,
                role: UserRole.SPECIAL_EDUCATOR,
                isActive: true,
                specialEducatorProfile: {
                    create: {
                        fullName: educatorNames[i - 1],
                        phone: `+91-98765-${4000 + i}`,
                        dateOfBirth: new Date(1985 + i, i - 1, 20),
                        gender: i % 2 === 0 ? Gender.MALE : Gender.FEMALE,
                        address: `${400 + i} Teacher Apartments, Block ${i}`,
                        primaryLanguage: 'English',
                        secondaryLanguages: ['Hindi', 'Regional'],
                        highestQualification: 'M.Ed. Special Education',
                        fieldOfStudy: 'Special Education',
                        institutionName: `Teachers College ${i}`,
                        yearOfGraduation: 2010 + i,
                        rciCertified: true,
                        rciValidityDate: new Date(2026 + i, 11, 31),
                        specialEdQualification: 'B.Ed. Special Education',
                        specializationAreas: ['Learning Disabilities', 'Behavioral Management'],
                        yearsOfExperience: 8 + i,
                        experienceTypes: ['Educational', 'Therapeutic'],
                        maxGroupSize: 6,
                        currentWorkLocations: ['Center', 'School'],
                        ldTypesHandled: ['Dyslexia', 'ADHD'],
                        gradeLevelsServed: ['Elementary', 'Middle School'],
                        assessmentTools: 'Informal assessments, Observation checklists',
                        assistiveTechProficiency: ['Educational Apps', 'Digital Worksheets'],
                        areasOfInterest: ['Reading Intervention', 'Math Support', 'Social Skills'],
                        consentToShare: true,
                        agreementToPolicies: true,
                        personalStatement: `Passionate about helping every child reach their full potential through individualized support.`,
                        additionalCertifications: ['Orton-Gillingham', 'Wilson Reading System'],
                        totalYearsOfExperience: 8 + i,
                    },
                },
            },
            include: { specialEducatorProfile: true },
        });
        educators.push(educator);
        console.log(`  ✓ Created educator: ${educator.specialEducatorProfile?.fullName}`);
    }

    // ============================================
    // 6. CREATE PARENT USERS (5)
    // ============================================
    console.log('👨‍👩‍👧 Creating Parent users...');
    const parents = [];
    const parentNames = [
        'Ramesh Kumar',
        'Sunita Sharma',
        'Anil Gupta',
        'Lakshmi Rao',
        'Suresh Patel',
    ];

    for (let i = 1; i <= 5; i++) {
        const parent = await prisma.user.create({
            data: {
                email: `parent${i}@gmail.com`,
                password: hashedPassword,
                role: UserRole.PARENT,
                isActive: true,
                parentProfile: {
                    create: {
                        fullName: parentNames[i - 1],
                        phone: `+91-98765-${5000 + i}`,
                        address: `${500 + i} Residential Complex, Tower ${i}`,
                        emergencyContact: `+91-98765-${5100 + i}`,
                        relationship: i % 3 === 0 ? 'Guardian' : 'Parent',
                    },
                },
            },
            include: { parentProfile: true },
        });
        parents.push(parent);
        console.log(`  ✓ Created parent: ${parent.parentProfile?.fullName}`);
    }

    // ============================================
    // 7. CREATE SCHOOL VIEWER USERS (5)
    // ============================================
    console.log('👁️ Creating School Viewer users...');
    const schoolViewers = [];

    for (let i = 1; i <= 5; i++) {
        const schoolViewer = await prisma.user.create({
            data: {
                email: `viewer${i}@school.com`,
                password: hashedPassword,
                role: UserRole.SCHOOL_VIEWER,
                isActive: true,
                schoolViewerProfile: {
                    create: {
                        fullName: `School Coordinator ${i}`,
                        position: i % 2 === 0 ? 'Special Education Coordinator' : 'Academic Coordinator',
                        phone: `+91-98765-${6000 + i}`,
                        schoolId: schools[i - 1].id,
                    },
                },
            },
            include: { schoolViewerProfile: true },
        });
        schoolViewers.push(schoolViewer);
        console.log(`  ✓ Created school viewer: ${schoolViewer.schoolViewerProfile?.fullName}`);
    }

    // ============================================
    // 8. CREATE CENTER ASSIGNMENTS
    // ============================================
    console.log('🔗 Creating Center Assignments...');

    // Assign super educators to centers (1 per center)
    for (let i = 0; i < 5; i++) {
        await prisma.centerAssignment.create({
            data: {
                centerId: centers[i].centerProfile!.id,
                superSpecialEducatorId: superEducators[i].superSpecialEducatorProfile!.id,
                isActive: true,
            },
        });
        console.log(`  ✓ Assigned ${superEducators[i].superSpecialEducatorProfile?.fullName} to ${centers[i].centerProfile?.centerName}`);
    }

    // Assign special educators to centers (1 per center)
    for (let i = 0; i < 5; i++) {
        await prisma.centerAssignment.create({
            data: {
                centerId: centers[i].centerProfile!.id,
                specialEducatorId: educators[i].specialEducatorProfile!.id,
                isActive: true,
            },
        });
        console.log(`  ✓ Assigned ${educators[i].specialEducatorProfile?.fullName} to ${centers[i].centerProfile?.centerName}`);
    }

    // ============================================
    // 9. CREATE SCHOOL ASSIGNMENTS
    // ============================================
    console.log('🔗 Creating School Assignments...');

    // Assign educators to schools (2 schools per educator)
    for (let i = 0; i < 5; i++) {
        await prisma.schoolAssignment.create({
            data: {
                schoolId: schools[i * 2].id,
                specialEducatorId: educators[i].specialEducatorProfile!.id,
                isActive: true,
            },
        });

        await prisma.schoolAssignment.create({
            data: {
                schoolId: schools[i * 2 + 1].id,
                specialEducatorId: educators[i].specialEducatorProfile!.id,
                isActive: true,
            },
        });
        console.log(`  ✓ Assigned ${educators[i].specialEducatorProfile?.fullName} to 2 schools`);
    }

    // ============================================
    // 10. CREATE STUDENTS (25 - 5 per center)
    // ============================================
    console.log('👦👧 Creating Students...');
    const students = [];
    const studentFirstNames = ['Aarav', 'Diya', 'Arjun', 'Ananya', 'Vihaan', 'Isha', 'Reyansh', 'Saanvi', 'Aditya', 'Myra'];
    const studentLastNames = ['Kumar', 'Sharma', 'Patel', 'Singh', 'Reddy'];
    const grades = ['LKG', 'UKG', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5'];
    const syllabuses = ['CBSE', 'ICSE', 'State Board'];

    for (let i = 0; i < 25; i++) {
        const centerIndex = i % 5;
        const parentIndex = i % 5;
        const schoolIndex = i % 10;
        const age = 5 + (i % 8);

        const student = await prisma.student.create({
            data: {
                fullName: `${studentFirstNames[i % 10]} ${studentLastNames[i % 5]}`,
                dateOfBirth: new Date(2024 - age, (i % 12), 15),
                age: age,
                gender: i % 2 === 0 ? Gender.MALE : Gender.FEMALE,
                grade: grades[i % 7],
                motherTongue: i % 3 === 0 ? 'Hindi' : i % 3 === 1 ? 'Tamil' : 'English',
                syllabus: syllabuses[i % 3],
                status: StudentStatus.ACTIVE,
                centerId: centers[centerIndex].centerProfile!.id,
                schoolId: schools[schoolIndex].id,
                parentId: parents[parentIndex].parentProfile!.id,
            },
        });
        students.push(student);
        console.log(`  ✓ Created student: ${student.fullName}`);
    }

    // ============================================
    // 11. CREATE STUDENT ASSIGNMENTS
    // ============================================
    console.log('🔗 Creating Student Assignments...');

    // Assign students to educators (5 students per educator)
    for (let i = 0; i < 25; i++) {
        const educatorIndex = i % 5;
        await prisma.studentAssignment.create({
            data: {
                studentId: students[i].id,
                specialEducatorId: educators[educatorIndex].specialEducatorProfile!.id,
                isActive: true,
            },
        });
        console.log(`  ✓ Assigned ${students[i].fullName} to ${educators[educatorIndex].specialEducatorProfile?.fullName}`);
    }

    console.log('\n✅ Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`  - Admins: ${admins.length}`);
    console.log(`  - Centers: ${centers.length}`);
    console.log(`  - Schools: ${schools.length}`);
    console.log(`  - Super Special Educators: ${superEducators.length}`);
    console.log(`  - Special Educators: ${educators.length}`);
    console.log(`  - Parents: ${parents.length}`);
    console.log(`  - School Viewers: ${schoolViewers.length}`);
    console.log(`  - Students: ${students.length}`);
    console.log('\n🔑 Default password for all users: password123');
    console.log('\n📧 Sample login credentials:');
    console.log('  Admin: admin1@knowled.com');
    console.log('  Center: center1@knowled.com');
    console.log('  Super Educator: supereducator1@knowled.com');
    console.log('  Educator: educator1@knowled.com');
    console.log('  Parent: parent1@gmail.com');
    console.log('  School Viewer: viewer1@school.com');
}

main()
    .catch((e) => {
        console.error('❌ Error during seeding:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
