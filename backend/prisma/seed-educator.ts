import { PrismaClient, UserRole, Gender, StudentStatus, RiskCategory } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting specialized seeding for Special Educator with students (Test Dummy Data)...');

    // Note: This script preserves existing data and adds test dummy data
    console.log('ℹ️  Preserving existing data and adding test dummy data...');

    // Hash password for all users (using 'password123' as default)
    const hashedPassword = await bcrypt.hash('password123', 10);

    // ============================================
    // 1. CREATE CENTER (1)
    // ============================================
    console.log('🏢 Creating Center...');
    const center = await prisma.user.create({
        data: {
            email: 'test-center@knowled.com',
            password: hashedPassword,
            role: UserRole.CENTER,
            isActive: true,
            centerProfile: {
                create: {
                    centerName: '[TEST] Bright Futures Learning Center',
                    address: '123 Education Street, Bangalore, Karnataka 560001',
                    phone: '+91-80-1234-5678',
                    email: 'test-center@knowled.com',
                    contactPerson: 'Dr. Sarah Johnson',
                    operatingHours: '9:00 AM - 6:00 PM, Mon-Sat',
                    description: '[TEST DATA] A premier special education center dedicated to helping children with learning differences reach their full potential through evidence-based interventions and compassionate care.',
                },
            },
        },
        include: { centerProfile: true },
    });
    console.log(`  ✓ Created center: ${center.centerProfile?.centerName}`);

    // ============================================
    // 2. CREATE SCHOOLS (2)
    // ============================================
    console.log('🏫 Creating Schools...');
    const schools: any[] = [];

    const school1 = await prisma.school.create({
        data: {
            name: '[TEST] Delhi Public School - Bangalore North',
            address: '456 School Road, Indiranagar, Bangalore 560038',
            phone: '+91-80-2345-6789',
            email: 'test-north@dpsbangalore.edu',
            principalName: 'Ms. Priya Nair',
            centerId: center.centerProfile!.id,
        },
    });
    schools.push(school1);
    console.log(`  ✓ Created school: ${school1.name}`);

    const school2 = await prisma.school.create({
        data: {
            name: '[TEST] National Public School - Koramangala',
            address: '789 Education Avenue, Koramangala, Bangalore 560095',
            phone: '+91-80-3456-7890',
            email: 'test-koramangala@nps.edu',
            principalName: 'Mr. Rajesh Kumar',
            centerId: center.centerProfile!.id,
        },
    });
    schools.push(school2);
    console.log(`  ✓ Created school: ${school2.name}`);

    // ============================================
    // 3. CREATE SPECIAL EDUCATOR (1)
    // ============================================
    console.log('👩‍🏫 Creating Special Educator...');
    const educator = await prisma.user.create({
        data: {
            email: 'educator@knowled.com',
            password: hashedPassword,
            role: UserRole.SPECIAL_EDUCATOR,
            isActive: true,
            specialEducatorProfile: {
                create: {
                    fullName: '[TEST] Sarah Elizabeth Thompson',
                    phone: '+91-80-9876-5432',
                    dateOfBirth: new Date(1988, 5, 15),
                    gender: Gender.FEMALE,
                    address: '101 Teacher Colony, Whitefield, Bangalore 560066',
                    primaryLanguage: 'English',
                    secondaryLanguages: ['Hindi', 'Tamil', 'Kannada'],
                    highestQualification: 'M.Ed. Special Education',
                    fieldOfStudy: 'Special Education and Learning Disabilities',
                    institutionName: 'University of Mumbai',
                    yearOfGraduation: 2012,
                    rciCertified: true,
                    rciValidityDate: new Date(2027, 11, 31),
                    specialEdQualification: 'B.Ed. Special Education (Learning Disabilities)',
                    specializationAreas: ['Dyslexia', 'ADHD', 'Autism Spectrum Disorders', 'Executive Functioning'],
                    yearsOfExperience: 12,
                    experienceTypes: ['Educational', 'Therapeutic', 'Behavioral Intervention'],
                    maxGroupSize: 4,
                    currentWorkLocations: ['Center', 'School', 'Home-based'],
                    ldTypesHandled: ['Dyslexia', 'Dyscalculia', 'Dysgraphia', 'ADHD', 'High-Functioning Autism'],
                    gradeLevelsServed: ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5'],
                    assessmentTools: 'WIAT-III, Woodcock-Johnson IV, CTP-5, BRSA, Informal Assessments',
                    assistiveTechProficiency: ['Text-to-Speech', 'Speech-to-Text', 'Educational Apps', 'Interactive Whiteboards'],
                    areasOfInterest: ['Multisensory Teaching', 'Executive Functioning Skills', 'Reading Interventions', 'Math Strategies'],
                    consentToShare: true,
                    agreementToPolicies: true,
                    personalStatement: '[TEST DATA] I believe every child has unique strengths and learns differently. My goal is to create a supportive, engaging environment where students can build confidence, develop skills, and discover their love for learning.',
                    additionalCertifications: ['Orton-Gillingham Associate Level', 'Wilson Reading System Level 1', 'Lindamood-Bell Seeing Stars', 'Executive Functioning Coaching'],
                    totalYearsOfExperience: 12,
                },
            },
        },
        include: { specialEducatorProfile: true },
    });
    console.log(`  ✓ Created educator: ${educator.specialEducatorProfile?.fullName}`);

    // ============================================
    // 4. CREATE PARENTS (5)
    // ============================================
    console.log('👨‍👩‍👧 Creating Parents...');
    const parents: any[] = [];

    const parentData = [
        { name: '[TEST] Rahul Sharma', email: 'test-rahul.sharma@gmail.com', phone: '+91-80-1111-2222', address: '201 Park Avenue, Bangalore 560001' },
        { name: '[TEST] Priya Nair', email: 'test-priya.nair@yahoo.com', phone: '+91-80-3333-4444', address: '502 Garden Layout, Bangalore 560034' },
        { name: '[TEST] Anil Kumar', email: 'test-anil.kumar@hotmail.com', phone: '+91-80-5555-6666', address: '303 Lake View Road, Bangalore 560078' },
        { name: '[TEST] Meera Reddy', email: 'test-meera.reddy@gmail.com', phone: '+91-80-7777-8888', address: '104 Hill Street, Bangalore 560043' },
        { name: '[TEST] Suresh Patel', email: 'test-suresh.patel@yahoo.com', phone: '+91-80-9999-0000', address: '205 Tech Park, Bangalore 560103' },
    ];

    for (let i = 0; i < 5; i++) {
        const parent = await prisma.user.create({
            data: {
                email: parentData[i].email,
                password: hashedPassword,
                role: UserRole.PARENT,
                isActive: true,
                parentProfile: {
                    create: {
                        fullName: parentData[i].name,
                        phone: parentData[i].phone,
                        address: parentData[i].address,
                        emergencyContact: `+91-80-${1000 + i}000`,
                        relationship: i % 3 === 0 ? 'Father' : 'Mother',
                    },
                },
            },
            include: { parentProfile: true },
        });
        parents.push(parent);
        console.log(`  ✓ Created parent: ${parent.parentProfile?.fullName}`);
    }

    // ============================================
    // 5. CREATE STUDENTS (5)
    // ============================================
    console.log('👦👧 Creating Students...');
    const students = [];

    const studentData = [
        {
            fullName: '[TEST] Aarav Sharma',
            dateOfBirth: new Date('2017-03-15'),
            age: 8,
            gender: Gender.MALE,
            grade: 'Grade 2',
            motherTongue: 'Hindi',
            syllabus: 'CBSE',
            riskCategory: RiskCategory.MODERATE_SUPPORT,
            parentId: 0,
            schoolId: 0,
        },
        {
            fullName: '[TEST] Diya Nair',
            dateOfBirth: new Date('2018-07-22'),
            age: 7,
            gender: Gender.FEMALE,
            grade: 'Grade 1',
            motherTongue: 'Malayalam',
            syllabus: 'ICSE',
            riskCategory: RiskCategory.HIGH_SUPPORT,
            parentId: 1,
            schoolId: 1,
        },
        {
            fullName: '[TEST] Arjun Kumar',
            dateOfBirth: new Date('2016-11-08'),
            age: 9,
            gender: Gender.MALE,
            grade: 'Grade 3',
            motherTongue: 'English',
            syllabus: 'CBSE',
            riskCategory: RiskCategory.MODERATE_SUPPORT,
            parentId: 2,
            schoolId: 0,
        },
        {
            fullName: '[TEST] Ananya Reddy',
            dateOfBirth: new Date('2019-01-30'),
            age: 6,
            gender: Gender.FEMALE,
            grade: 'Grade 1',
            motherTongue: 'Telugu',
            syllabus: 'State Board',
            riskCategory: RiskCategory.HIGH_SUPPORT,
            parentId: 3,
            schoolId: 1,
        },
        {
            fullName: '[TEST] Vihaan Patel',
            dateOfBirth: new Date('2017-09-12'),
            age: 8,
            gender: Gender.MALE,
            grade: 'Grade 2',
            motherTongue: 'Gujarati',
            syllabus: 'CBSE',
            riskCategory: RiskCategory.ON_TRACK,
            parentId: 4,
            schoolId: 0,
        },
    ];

    for (let i = 0; i < 5; i++) {
        const student = await prisma.student.create({
            data: {
                fullName: studentData[i].fullName,
                dateOfBirth: studentData[i].dateOfBirth,
                age: studentData[i].age,
                gender: studentData[i].gender,
                grade: studentData[i].grade,
                motherTongue: studentData[i].motherTongue,
                syllabus: studentData[i].syllabus,
                status: StudentStatus.ACTIVE,
                centerId: center.centerProfile!.id,
                schoolId: schools[studentData[i].schoolId].id,
                parentId: parents[studentData[i].parentId].parentProfile!.id,
                riskCategory: studentData[i].riskCategory,
                lastRiskAssessment: new Date(),
            },
        });
        students.push(student);
        console.log(`  ✓ Created student: ${student.fullName} (${student.grade})`);
    }

    // ============================================
    // 6. CREATE ASSIGNMENTS
    // ============================================
    console.log('🔗 Creating Assignments...');

    // Assign educator to center
    await prisma.centerAssignment.create({
        data: {
            centerId: center.centerProfile!.id,
            specialEducatorId: educator.specialEducatorProfile!.id,
            isActive: true,
        },
    });
    console.log(`  ✓ Assigned ${educator.specialEducatorProfile?.fullName} to ${center.centerProfile?.centerName}`);

    // Assign educator to schools
    for (const school of schools) {
        await prisma.schoolAssignment.create({
            data: {
                schoolId: school.id,
                specialEducatorId: educator.specialEducatorProfile!.id,
                isActive: true,
            },
        });
    }
    console.log(`  ✓ Assigned ${educator.specialEducatorProfile?.fullName} to ${schools.length} schools`);

    // Assign students to educator
    for (const student of students) {
        await prisma.studentAssignment.create({
            data: {
                studentId: student.id,
                specialEducatorId: educator.specialEducatorProfile!.id,
                isActive: true,
            },
        });
        console.log(`  ✓ Assigned ${student.fullName} to ${educator.specialEducatorProfile?.fullName}`);
    }

    console.log('\n✅ Test dummy data seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`  - Centers: 1 (TEST DATA)`);
    console.log(`  - Schools: ${schools.length} (TEST DATA)`);
    console.log(`  - Special Educator: 1 (TEST DATA)`);
    console.log(`  - Parents: ${parents.length} (TEST DATA)`);
    console.log(`  - Students: ${students.length} (TEST DATA)`);
    console.log('\n🔑 Test Login Credentials:');
    console.log('  Center: test-center@knowled.com');
    console.log('  Educator: test-sarah.educator@knowled.com');
    console.log('  Parents: test-rahul.sharma@gmail.com, test-priya.nair@yahoo.com, etc.');
    console.log('\n🔑 Default password for all test accounts: password123');

    console.log('\n👩‍🏫 Test Special Educator Profile:');
    console.log(`  Name: ${educator.specialEducatorProfile?.fullName}`);
    console.log(`  Experience: ${educator.specialEducatorProfile?.yearsOfExperience} years`);
    console.log(`  Specializations: ${educator.specialEducatorProfile?.specializationAreas?.join(', ')}`);
    console.log(`  Certifications: ${educator.specialEducatorProfile?.additionalCertifications?.join(', ')}`);

    console.log('\n👦👧 Test Students Overview:');
    students.forEach((student, index) => {
        const parent = parents.find(p => p.parentProfile?.id === student.parentId);
        const school = schools.find(s => s.id === student.schoolId);
        console.log(`  ${index + 1}. ${student.fullName} - Grade: ${student.grade}, School: ${school?.name}, Parent: ${parent?.parentProfile?.fullName}, Risk: ${student.riskCategory}`);
    });
}

main()
    .catch((e) => {
        console.error('❌ Error during seeding:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });