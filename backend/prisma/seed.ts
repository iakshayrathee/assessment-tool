import { PrismaClient, UserRole, Gender, StudentStatus, User, AssessmentStatus, IEPGoalStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create 20 NEW Admin Users
  const newAdminData = [
    { name: 'Pradeep Singh', email: 'pradeep.admin@knowled.com', phone: '+919876543220' },
    { name: 'Kavitha Reddy', email: 'kavitha.admin@knowled.com', phone: '+919876543221' },
    { name: 'Amit Sharma', email: 'amit.admin@knowled.com', phone: '+919876543222' },
    { name: 'Deepika Nair', email: 'deepika.admin@knowled.com', phone: '+919876543223' },
    { name: 'Ravi Patel', email: 'ravi.admin@knowled.com', phone: '+919876543224' },
    { name: 'Meera Joshi', email: 'meera.admin@knowled.com', phone: '+919876543225' },
    { name: 'Suresh Gupta', email: 'suresh.admin@knowled.com', phone: '+919876543226' },
    { name: 'Anita Bansal', email: 'anita.admin@knowled.com', phone: '+919876543227' },
    { name: 'Vikram Chandra', email: 'vikram.admin@knowled.com', phone: '+919876543228' },
    { name: 'Pooja Agarwal', email: 'pooja.admin@knowled.com', phone: '+919876543229' },
    { name: 'Manoj Yadav', email: 'manoj.admin@knowled.com', phone: '+919876543230' },
    { name: 'Sunita Kapoor', email: 'sunita.admin@knowled.com', phone: '+919876543231' },
    { name: 'Rohit Malhotra', email: 'rohit.admin@knowled.com', phone: '+919876543232' },
    { name: 'Seema Verma', email: 'seema.admin@knowled.com', phone: '+919876543233' },
    { name: 'Ashok Kumar', email: 'ashok.admin@knowled.com', phone: '+919876543234' },
    { name: 'Nisha Sinha', email: 'nisha.admin@knowled.com', phone: '+919876543235' },
    { name: 'Gopal Rao', email: 'gopal.admin@knowled.com', phone: '+919876543236' },
    { name: 'Rekha Iyer', email: 'rekha.admin@knowled.com', phone: '+919876543237' },
    { name: 'Ajay Pandey', email: 'ajay.admin@knowled.com', phone: '+919876543238' },
    { name: 'Latha Menon', email: 'latha.admin@knowled.com', phone: '+919876543239' }
  ];

  for (const admin of newAdminData) {
    const adminPassword = await bcrypt.hash('admin123', 12);
    await prisma.user.create({
      data: {
        email: admin.email,
        password: adminPassword,
        role: UserRole.ADMIN,
        adminProfile: {
          create: {
            fullName: admin.name,
            phone: admin.phone
          }
        }
      }
    });
  }
  console.log('✅ Created 20 new admin users');

  // Create 20 NEW Super Special Educators
  const newSuperEducatorData = [
    { name: 'Dr. Ramesh Krishnan', email: 'ramesh.super@knowled.com', phone: '+919876543240', dob: '1975-03-10', gender: Gender.MALE, address: '15, Anna Nagar, Chennai, Tamil Nadu, 600040', lang1: 'Tamil', lang2: ['English', 'Hindi'], qualification: 'Ph.D. in Psychology', field: 'Clinical Psychology', institution: 'University of Madras', year: 2000 },
    { name: 'Dr. Sushma Desai', email: 'sushma.super@knowled.com', phone: '+919876543241', dob: '1978-07-20', gender: Gender.FEMALE, address: '88, Camp Area, Pune, Maharashtra, 411001', lang1: 'Marathi', lang2: ['English', 'Hindi'], qualification: 'Ph.D. in Special Education', field: 'Developmental Disabilities', institution: 'Pune University', year: 2003 },
    { name: 'Dr. Harish Bhatia', email: 'harish.super@knowled.com', phone: '+919876543242', dob: '1972-11-15', gender: Gender.MALE, address: '23, Model Town, Ludhiana, Punjab, 141002', lang1: 'Punjabi', lang2: ['Hindi', 'English'], qualification: 'Ph.D. in Educational Psychology', field: 'Learning Disabilities', institution: 'Punjab University', year: 1998 },
    { name: 'Dr. Bharti Saxena', email: 'bharti.super@knowled.com', phone: '+919876543243', dob: '1980-01-25', gender: Gender.FEMALE, address: '67, Civil Lines, Allahabad, Uttar Pradesh, 211001', lang1: 'Hindi', lang2: ['English', 'Urdu'], qualification: 'Ph.D. in Special Education', field: 'Autism Research', institution: 'Allahabad University', year: 2005 },
    { name: 'Dr. Kiran Jain', email: 'kiran.super@knowled.com', phone: '+919876543244', dob: '1977-09-12', gender: Gender.FEMALE, address: '34, C-Scheme, Jaipur, Rajasthan, 302001', lang1: 'Hindi', lang2: ['English', 'Rajasthani'], qualification: 'Ph.D. in Rehabilitation Psychology', field: 'Cognitive Rehabilitation', institution: 'Rajasthan University', year: 2002 },
    { name: 'Dr. Anil Reddy', email: 'anil.super@knowled.com', phone: '+919876543245', dob: '1974-06-08', gender: Gender.MALE, address: '12, Banjara Hills, Hyderabad, Telangana, 500034', lang1: 'Telugu', lang2: ['English', 'Hindi'], qualification: 'Ph.D. in Applied Psychology', field: 'Behavioral Analysis', institution: 'Osmania University', year: 1999 },
    { name: 'Dr. Shanti Pillai', email: 'shanti.super@knowled.com', phone: '+919876543246', dob: '1979-04-18', gender: Gender.FEMALE, address: '56, Marine Drive, Kochi, Kerala, 682031', lang1: 'Malayalam', lang2: ['English', 'Tamil'], qualification: 'Ph.D. in Special Education', field: 'Inclusive Education', institution: 'Kerala University', year: 2004 },
    { name: 'Dr. Vinod Agarwal', email: 'vinod.super@knowled.com', phone: '+919876543247', dob: '1976-12-03', gender: Gender.MALE, address: '78, Park Street, Kolkata, West Bengal, 700016', lang1: 'Bengali', lang2: ['Hindi', 'English'], qualification: 'Ph.D. in Educational Psychology', field: 'Learning Disorders', institution: 'Calcutta University', year: 2001 },
    { name: 'Dr. Nalini Rao', email: 'nalini.super@knowled.com', phone: '+919876543248', dob: '1981-08-14', gender: Gender.FEMALE, address: '45, Jayanagar, Bangalore, Karnataka, 560011', lang1: 'Kannada', lang2: ['English', 'Tamil'], qualification: 'Ph.D. in Developmental Psychology', field: 'Child Development', institution: 'Bangalore University', year: 2006 },
    { name: 'Dr. Rajiv Chopra', email: 'rajiv.super@knowled.com', phone: '+919876543249', dob: '1973-10-22', gender: Gender.MALE, address: '29, Sector 17, Chandigarh, 160017', lang1: 'Hindi', lang2: ['Punjabi', 'English'], qualification: 'Ph.D. in Clinical Psychology', field: 'Neuropsychology', institution: 'Panjab University', year: 1997 },
    { name: 'Dr. Gayatri Sharma', email: 'gayatri.super@knowled.com', phone: '+919876543250', dob: '1982-02-28', gender: Gender.FEMALE, address: '91, Lajpat Nagar, New Delhi, 110024', lang1: 'Hindi', lang2: ['English', 'Punjabi'], qualification: 'Ph.D. in Special Education', field: 'Speech Therapy', institution: 'JNU Delhi', year: 2007 },
    { name: 'Dr. Mohan Das', email: 'mohan.super@knowled.com', phone: '+919876543251', dob: '1975-05-16', gender: Gender.MALE, address: '63, Model Colony, Patna, Bihar, 800020', lang1: 'Hindi', lang2: ['Bhojpuri', 'English'], qualification: 'Ph.D. in Educational Psychology', field: 'Rural Education', institution: 'Patna University', year: 2000 },
    { name: 'Dr. Lakshmi Menon', email: 'lakshmi.super@knowled.com', phone: '+919876543252', dob: '1978-11-30', gender: Gender.FEMALE, address: '17, Pattom, Thiruvananthapuram, Kerala, 695004', lang1: 'Malayalam', lang2: ['English', 'Tamil'], qualification: 'Ph.D. in Applied Behavior Analysis', field: 'Autism Intervention', institution: 'Kerala University', year: 2003 },
    { name: 'Dr. Satish Kumar', email: 'satish.super@knowled.com', phone: '+919876543253', dob: '1974-01-12', gender: Gender.MALE, address: '52, Residency Road, Indore, Madhya Pradesh, 452001', lang1: 'Hindi', lang2: ['English', 'Marathi'], qualification: 'Ph.D. in Special Education', field: 'Intellectual Disabilities', institution: 'Devi Ahilya University', year: 1999 },
    { name: 'Dr. Usha Patel', email: 'usha.super@knowled.com', phone: '+919876543254', dob: '1980-09-05', gender: Gender.FEMALE, address: '38, Vastrapur, Ahmedabad, Gujarat, 380015', lang1: 'Gujarati', lang2: ['Hindi', 'English'], qualification: 'Ph.D. in Rehabilitation Science', field: 'Physical Disabilities', institution: 'Gujarat University', year: 2005 },
    { name: 'Dr. Prasad Kulkarni', email: 'prasad.super@knowled.com', phone: '+919876543255', dob: '1977-07-19', gender: Gender.MALE, address: '74, Shivaji Nagar, Nagpur, Maharashtra, 440010', lang1: 'Marathi', lang2: ['Hindi', 'English'], qualification: 'Ph.D. in Educational Psychology', field: 'ADHD Research', institution: 'Nagpur University', year: 2002 },
    { name: 'Dr. Radha Singh', email: 'radha.super@knowled.com', phone: '+919876543256', dob: '1979-03-27', gender: Gender.FEMALE, address: '26, Hazratganj, Lucknow, Uttar Pradesh, 226001', lang1: 'Hindi', lang2: ['Urdu', 'English'], qualification: 'Ph.D. in Special Education', field: 'Sensory Impairments', institution: 'Lucknow University', year: 2004 },
    { name: 'Dr. Sudhir Nair', email: 'sudhir.super@knowled.com', phone: '+919876543257', dob: '1976-12-11', gender: Gender.MALE, address: '83, Panampilly Nagar, Kochi, Kerala, 682036', lang1: 'Malayalam', lang2: ['English', 'Tamil'], qualification: 'Ph.D. in Clinical Psychology', field: 'Developmental Disorders', institution: 'Cochin University', year: 2001 },
    { name: 'Dr. Meenakshi Joshi', email: 'meenakshi.super@knowled.com', phone: '+919876543258', dob: '1981-06-23', gender: Gender.FEMALE, address: '19, Malviya Nagar, Bhopal, Madhya Pradesh, 462003', lang1: 'Hindi', lang2: ['English', 'Marathi'], qualification: 'Ph.D. in Special Education', field: 'Multiple Disabilities', institution: 'Barkatullah University', year: 2006 },
    { name: 'Dr. Raman Gupta', email: 'raman.super@knowled.com', phone: '+919876543259', dob: '1975-04-07', gender: Gender.MALE, address: '41, Salt Lake City, Kolkata, West Bengal, 700064', lang1: 'Bengali', lang2: ['Hindi', 'English'], qualification: 'Ph.D. in Applied Psychology', field: 'Cognitive Disabilities', institution: 'Jadavpur University', year: 2000 }
  ];

  for (const educator of newSuperEducatorData) {
    const superEducatorPassword = await bcrypt.hash('super123', 12);
    await prisma.user.create({
      data: {
        email: educator.email,
        password: superEducatorPassword,
        role: UserRole.SUPER_SPECIAL_EDUCATOR,
        superSpecialEducatorProfile: {
          create: {
            fullName: educator.name,
            phone: educator.phone,
            dateOfBirth: new Date(educator.dob),
            gender: educator.gender,
            address: educator.address,
            primaryLanguage: educator.lang1,
            secondaryLanguages: educator.lang2,
            highestQualification: educator.qualification,
            fieldOfStudy: educator.field,
            institutionName: educator.institution,
            yearOfGraduation: educator.year,
            rciCertified: true,
            rciValidityDate: new Date('2025-12-31'),
            specialEdQualification: 'M.Ed. Special Education',
            specializationAreas: ['Learning Disabilities', 'Autism Spectrum Disorders'],
            yearsOfExperience: Math.floor(Math.random() * 10) + 10,
            experienceTypes: ['Assessment', 'Intervention', 'Research'],
            maxGroupSize: Math.floor(Math.random() * 10) + 10,
            currentWorkLocations: ['Main Center'],
            ldTypesHandled: ['Dyslexia', 'ADHD', 'Autism'],
            gradeLevelsServed: ['Classes 1-12'],
            assessmentTools: 'NIMHANS Battery, MISIC, Vineland-3',
            assistiveTechProficiency: ['Screen Readers', 'Communication Devices'],
            areasOfInterest: ['Research', 'Training'],
            consentToShare: true,
            agreementToPolicies: true,
            personalStatement: `Dedicated special educator with expertise in ${educator.field}.`
          }
        }
      }
    });
  }
  console.log('✅ Created 20 new super special educators');

  // Create 20 NEW Special Educators
  const newEducatorData = [
    { name: 'Ms. Rashmi Gupta', email: 'rashmi.educator@knowled.com', phone: '+919876543260', dob: '1987-03-15', gender: Gender.FEMALE, address: '22, Saket, New Delhi, 110017', lang1: 'Hindi', lang2: ['English', 'Punjabi'] },
    { name: 'Mr. Arjun Nair', email: 'arjun.educator@knowled.com', phone: '+919876543261', dob: '1985-07-22', gender: Gender.MALE, address: '45, Kakkanad, Kochi, Kerala, 682030', lang1: 'Malayalam', lang2: ['English', 'Tamil'] },
    { name: 'Ms. Priya Sengupta', email: 'priya.educator@knowled.com', phone: '+919876543262', dob: '1989-11-08', gender: Gender.FEMALE, address: '78, Ballygunge, Kolkata, West Bengal, 700019', lang1: 'Bengali', lang2: ['Hindi', 'English'] },
    { name: 'Mr. Karthik Reddy', email: 'karthik.educator@knowled.com', phone: '+919876543263', dob: '1986-05-12', gender: Gender.MALE, address: '56, Jubilee Hills, Hyderabad, Telangana, 500033', lang1: 'Telugu', lang2: ['English', 'Hindi'] },
    { name: 'Ms. Neha Jain', email: 'neha.educator@knowled.com', phone: '+919876543264', dob: '1988-09-18', gender: Gender.FEMALE, address: '33, Vaishali Nagar, Jaipur, Rajasthan, 302021', lang1: 'Hindi', lang2: ['English', 'Rajasthani'] },
    { name: 'Mr. Ravi Kumar', email: 'ravi.educator@knowled.com', phone: '+919876543265', dob: '1984-12-03', gender: Gender.MALE, address: '67, Anna Nagar, Chennai, Tamil Nadu, 600040', lang1: 'Tamil', lang2: ['English', 'Hindi'] },
    { name: 'Ms. Pooja Sharma', email: 'pooja.educator@knowled.com', phone: '+919876543266', dob: '1990-02-14', gender: Gender.FEMALE, address: '89, Sector 22, Gurgaon, Haryana, 122015', lang1: 'Hindi', lang2: ['English', 'Punjabi'] },
    { name: 'Mr. Arun Desai', email: 'arun.educator@knowled.com', phone: '+919876543267', dob: '1987-06-25', gender: Gender.MALE, address: '12, Koregaon Park, Pune, Maharashtra, 411001', lang1: 'Marathi', lang2: ['Hindi', 'English'] },
    { name: 'Ms. Kavya Pillai', email: 'kavya.educator@knowled.com', phone: '+919876543268', dob: '1986-10-30', gender: Gender.FEMALE, address: '45, Jayanagar, Bangalore, Karnataka, 560011', lang1: 'Kannada', lang2: ['English', 'Tamil'] },
    { name: 'Mr. Sunil Singh', email: 'sunil.educator@knowled.com', phone: '+919876543269', dob: '1985-01-17', gender: Gender.MALE, address: '78, Gomti Nagar, Lucknow, Uttar Pradesh, 226010', lang1: 'Hindi', lang2: ['Urdu', 'English'] },
    { name: 'Ms. Divya Agarwal', email: 'divya.educator@knowled.com', phone: '+919876543270', dob: '1989-04-09', gender: Gender.FEMALE, address: '23, Linking Road, Mumbai, Maharashtra, 400050', lang1: 'Hindi', lang2: ['Marathi', 'English'] },
    { name: 'Mr. Rohit Patel', email: 'rohit.educator@knowled.com', phone: '+919876543271', dob: '1987-08-21', gender: Gender.MALE, address: '56, Satellite, Ahmedabad, Gujarat, 380015', lang1: 'Gujarati', lang2: ['Hindi', 'English'] },
    { name: 'Ms. Shreya Das', email: 'shreya.educator@knowled.com', phone: '+919876543272', dob: '1988-12-05', gender: Gender.FEMALE, address: '34, Shyamali Colony, Bhubaneswar, Odisha, 751003', lang1: 'Odia', lang2: ['Hindi', 'English'] },
    { name: 'Mr. Vikash Kumar', email: 'vikash.educator@knowled.com', phone: '+919876543273', dob: '1986-03-28', gender: Gender.MALE, address: '67, Boring Road, Patna, Bihar, 800013', lang1: 'Hindi', lang2: ['Bhojpuri', 'English'] },
    { name: 'Ms. Ananya Mishra', email: 'ananya.educator@knowled.com', phone: '+919876543274', dob: '1990-07-11', gender: Gender.FEMALE, address: '89, Saheed Nagar, Bhubaneswar, Odisha, 751007', lang1: 'Odia', lang2: ['Hindi', 'English'] },
    { name: 'Mr. Deepak Yadav', email: 'deepak.educator@knowled.com', phone: '+919876543275', dob: '1985-11-19', gender: Gender.MALE, address: '12, Hazratganj, Lucknow, Uttar Pradesh, 226001', lang1: 'Hindi', lang2: ['Urdu', 'English'] },
    { name: 'Ms. Ritu Bansal', email: 'ritu.educator@knowled.com', phone: '+919876543276', dob: '1987-05-24', gender: Gender.FEMALE, address: '45, Model Town, Ludhiana, Punjab, 141002', lang1: 'Punjabi', lang2: ['Hindi', 'English'] },
    { name: 'Mr. Manish Kulkarni', email: 'manish.educator@knowled.com', phone: '+919876543277', dob: '1988-09-07', gender: Gender.MALE, address: '78, Shivaji Nagar, Nagpur, Maharashtra, 440010', lang1: 'Marathi', lang2: ['Hindi', 'English'] },
    { name: 'Ms. Sneha Iyer', email: 'sneha.educator@knowled.com', phone: '+919876543278', dob: '1989-01-15', gender: Gender.FEMALE, address: '23, T Nagar, Chennai, Tamil Nadu, 600017', lang1: 'Tamil', lang2: ['English', 'Hindi'] },
    { name: 'Mr. Abhishek Tripathi', email: 'abhishek.educator@knowled.com', phone: '+919876543279', dob: '1986-06-13', gender: Gender.MALE, address: '56, Civil Lines, Allahabad, Uttar Pradesh, 211001', lang1: 'Hindi', lang2: ['English', 'Urdu'] }
  ];

  const createdEducators = [];
  for (const educator of newEducatorData) {
    const educatorPassword = await bcrypt.hash('educator123', 12);
    const createdEducator = await prisma.user.create({
      data: {
        email: educator.email,
        password: educatorPassword,
        role: UserRole.SPECIAL_EDUCATOR,
        specialEducatorProfile: {
          create: {
            fullName: educator.name,
            phone: educator.phone,
            dateOfBirth: new Date(educator.dob),
            gender: educator.gender,
            address: educator.address,
            primaryLanguage: educator.lang1,
            secondaryLanguages: educator.lang2,
            highestQualification: 'M.Ed. Special Education',
            fieldOfStudy: 'Special Education',
            institutionName: 'Various Universities',
            yearOfGraduation: Math.floor(Math.random() * 10) + 2010,
            rciCertified: true,
            rciValidityDate: new Date('2024-12-31'),
            specialEdQualification: 'B.Ed. Special Education',
            specializationAreas: ['Learning Disabilities', 'Behavioral Interventions'],
            yearsOfExperience: Math.floor(Math.random() * 8) + 5,
            experienceTypes: ['Direct Instruction', 'Assessment'],
            maxGroupSize: Math.floor(Math.random() * 5) + 5,
            currentWorkLocations: ['Main Center'],
            ldTypesHandled: ['Dyslexia', 'ADHD'],
            gradeLevelsServed: ['Primary', 'Middle School'],
            assessmentTools: 'NIMHANS Battery, Academic assessments',
            assistiveTechProficiency: ['Educational Software', 'Tablets'],
            areasOfInterest: ['Inclusive Education', 'Technology Integration'],
            consentToShare: true,
            agreementToPolicies: true,
            personalStatement: 'Committed to inclusive education for all children.'
          }
        }
      },
      include: { specialEducatorProfile: true }
    });
    createdEducators.push(createdEducator);
  }
  console.log('✅ Created 20 new special educators');

  // Create 20 NEW Centers
  const newCenterData = [
    { name: 'Knowled Learning Center - Mumbai Branch', address: '45, Linking Road, Bandra West, Mumbai, Maharashtra, 400050', phone: '+919876543280', email: 'mumbai@knowled.com', contact: 'Ms. Priya Shah' },
    { name: 'Knowled Learning Center - Bangalore Branch', address: '78, Brigade Road, Bangalore, Karnataka, 560025', phone: '+919876543281', email: 'bangalore@knowled.com', contact: 'Mr. Rajesh Kumar' },
    { name: 'Knowled Learning Center - Chennai Branch', address: '23, Anna Salai, Chennai, Tamil Nadu, 600002', phone: '+919876543282', email: 'chennai@knowled.com', contact: 'Dr. Lakshmi Raman' },
    { name: 'Knowled Learning Center - Hyderabad Branch', address: '56, HITEC City, Hyderabad, Telangana, 500081', phone: '+919876543283', email: 'hyderabad@knowled.com', contact: 'Mr. Anil Reddy' },
    { name: 'Knowled Learning Center - Pune Branch', address: '89, FC Road, Pune, Maharashtra, 411005', phone: '+919876543284', email: 'pune@knowled.com', contact: 'Ms. Kavitha Desai' },
    { name: 'Knowled Learning Center - Kolkata Branch', address: '34, Park Street, Kolkata, West Bengal, 700016', phone: '+919876543285', email: 'kolkata@knowled.com', contact: 'Dr. Sanjay Chatterjee' },
    { name: 'Knowled Learning Center - Ahmedabad Branch', address: '67, CG Road, Ahmedabad, Gujarat, 380009', phone: '+919876543286', email: 'ahmedabad@knowled.com', contact: 'Mr. Jigar Patel' },
    { name: 'Knowled Learning Center - Jaipur Branch', address: '12, MI Road, Jaipur, Rajasthan, 302001', phone: '+919876543287', email: 'jaipur@knowled.com', contact: 'Ms. Sunita Sharma' },
    { name: 'Knowled Learning Center - Kochi Branch', address: '45, MG Road, Kochi, Kerala, 682035', phone: '+919876543288', email: 'kochi@knowled.com', contact: 'Dr. Ravi Nair' },
    { name: 'Knowled Learning Center - Lucknow Branch', address: '78, Hazratganj, Lucknow, Uttar Pradesh, 226001', phone: '+919876543289', email: 'lucknow@knowled.com', contact: 'Mr. Suresh Gupta' },
    { name: 'Knowled Learning Center - Indore Branch', address: '23, MG Road, Indore, Madhya Pradesh, 452001', phone: '+919876543290', email: 'indore@knowled.com', contact: 'Ms. Pooja Agarwal' },
    { name: 'Knowled Learning Center - Bhopal Branch', address: '56, New Market, Bhopal, Madhya Pradesh, 462001', phone: '+919876543291', email: 'bhopal@knowled.com', contact: 'Dr. Vinod Tiwari' },
    { name: 'Knowled Learning Center - Chandigarh Branch', address: '89, Sector 17, Chandigarh, 160017', phone: '+919876543292', email: 'chandigarh@knowled.com', contact: 'Mr. Rajiv Chopra' },
    { name: 'Knowled Learning Center - Nagpur Branch', address: '34, Sitabuldi, Nagpur, Maharashtra, 440012', phone: '+919876543293', email: 'nagpur@knowled.com', contact: 'Ms. Meera Kulkarni' },
    { name: 'Knowled Learning Center - Visakhapatnam Branch', address: '67, Beach Road, Visakhapatnam, Andhra Pradesh, 530003', phone: '+919876543294', email: 'vizag@knowled.com', contact: 'Dr. Srinivas Rao' },
    { name: 'Knowled Learning Center - Guwahati Branch', address: '12, GS Road, Guwahati, Assam, 781005', phone: '+919876543295', email: 'guwahati@knowled.com', contact: 'Ms. Priyanka Sharma' },
    { name: 'Knowled Learning Center - Bhubaneswar Branch', address: '45, Saheed Nagar, Bhubaneswar, Odisha, 751007', phone: '+919876543296', email: 'bhubaneswar@knowled.com', contact: 'Mr. Deepak Mishra' },
    { name: 'Knowled Learning Center - Coimbatore Branch', address: '78, RS Puram, Coimbatore, Tamil Nadu, 641002', phone: '+919876543297', email: 'coimbatore@knowled.com', contact: 'Dr. Radha Krishnan' },
    { name: 'Knowled Learning Center - Thiruvananthapuram Branch', address: '23, MG Road, Thiruvananthapuram, Kerala, 695001', phone: '+919876543298', email: 'trivandrum@knowled.com', contact: 'Ms. Lakshmi Menon' },
    { name: 'Knowled Learning Center - Patna Branch', address: '56, Boring Road, Patna, Bihar, 800013', phone: '+919876543299', email: 'patna@knowled.com', contact: 'Dr. Manoj Kumar' }
  ];

  const createdCenters = [];
  for (const centerData of newCenterData) {
    const centerPassword = await bcrypt.hash('center123', 12);
    const createdCenter = await prisma.user.create({
      data: {
        email: centerData.email,
        password: centerPassword,
        role: UserRole.CENTER,
        centerProfile: {
          create: {
            centerName: centerData.name,
            address: centerData.address,
            phone: centerData.phone,
            email: centerData.email,
            contactPerson: centerData.contact,
            operatingHours: 'Monday-Saturday: 9:00 AM - 6:00 PM',
            description: `Comprehensive special education center serving the local community with expert care and individualized programs.`
          }
        }
      },
      include: { centerProfile: true }
    });
    createdCenters.push(createdCenter);
  }
  console.log('✅ Created 20 new centers');

  // Create 20 NEW Parents
  const newParentData = [
    { name: 'Mrs. Kavita Sharma', email: 'kavita.parent@knowled.com', phone: '+919876543300', address: '12, Vasant Vihar, New Delhi, 110057', emergency: '+919876543301 (Rajesh Sharma - Father)', relation: 'Mother' },
    { name: 'Mr. Anil Kumar', email: 'anil.parent@knowled.com', phone: '+919876543302', address: '45, Juhu, Mumbai, Maharashtra, 400049', emergency: '+919876543303 (Priya Kumar - Mother)', relation: 'Father' },
    { name: 'Mrs. Deepika Nair', email: 'deepika.parent@knowled.com', phone: '+919876543304', address: '78, Indiranagar, Bangalore, Karnataka, 560038', emergency: '+919876543305 (Suresh Nair - Father)', relation: 'Mother' },
    { name: 'Mr. Ravi Reddy', email: 'ravi.parent@knowled.com', phone: '+919876543306', address: '23, Banjara Hills, Hyderabad, Telangana, 500034', emergency: '+919876543307 (Sita Reddy - Mother)', relation: 'Father' },
    { name: 'Mrs. Meera Patel', email: 'meera.parent@knowled.com', phone: '+919876543308', address: '56, Ellis Bridge, Ahmedabad, Gujarat, 380006', emergency: '+919876543309 (Kiran Patel - Father)', relation: 'Mother' },
    { name: 'Mr. Sunil Das', email: 'sunil.parent@knowled.com', phone: '+919876543310', address: '89, Salt Lake, Kolkata, West Bengal, 700064', emergency: '+919876543311 (Rina Das - Mother)', relation: 'Father' },
    { name: 'Mrs. Pooja Jain', email: 'pooja.parent@knowled.com', phone: '+919876543312', address: '34, Malviya Nagar, Jaipur, Rajasthan, 302017', emergency: '+919876543313 (Amit Jain - Father)', relation: 'Mother' },
    { name: 'Mr. Vinod Pillai', email: 'vinod.parent@knowled.com', phone: '+919876543314', address: '67, Marine Drive, Kochi, Kerala, 682031', emergency: '+919876543315 (Latha Pillai - Mother)', relation: 'Father' },
    { name: 'Mrs. Sunita Gupta', email: 'sunita.parent@knowled.com', phone: '+919876543316', address: '12, Hazratganj, Lucknow, Uttar Pradesh, 226001', emergency: '+919876543317 (Manoj Gupta - Father)', relation: 'Mother' },
    { name: 'Mr. Rajesh Agarwal', email: 'rajesh.parent@knowled.com', phone: '+919876543318', address: '45, Koregaon Park, Pune, Maharashtra, 411001', emergency: '+919876543319 (Neha Agarwal - Mother)', relation: 'Father' },
    { name: 'Mrs. Anita Singh', email: 'anita.parent@knowled.com', phone: '+919876543320', address: '78, Model Town, Ludhiana, Punjab, 141002', emergency: '+919876543321 (Raman Singh - Father)', relation: 'Mother' },
    { name: 'Mr. Kiran Kumar', email: 'kiran.parent@knowled.com', phone: '+919876543322', address: '23, Anna Nagar, Chennai, Tamil Nadu, 600040', emergency: '+919876543323 (Priya Kumar - Mother)', relation: 'Father' },
    { name: 'Mrs. Rekha Desai', email: 'rekha.parent@knowled.com', phone: '+919876543324', address: '56, Shivaji Nagar, Nagpur, Maharashtra, 440010', emergency: '+919876543325 (Ashok Desai - Father)', relation: 'Mother' },
    { name: 'Mr. Mohan Rao', email: 'mohan.parent@knowled.com', phone: '+919876543326', address: '89, Beach Road, Visakhapatnam, Andhra Pradesh, 530003', emergency: '+919876543327 (Lakshmi Rao - Mother)', relation: 'Father' },
    { name: 'Mrs. Divya Sharma', email: 'divya.parent@knowled.com', phone: '+919876543328', address: '34, Sector 17, Chandigarh, 160017', emergency: '+919876543329 (Vikram Sharma - Father)', relation: 'Mother' },
    { name: 'Mr. Satish Mishra', email: 'satish.parent@knowled.com', phone: '+919876543330', address: '67, Saheed Nagar, Bhubaneswar, Odisha, 751007', emergency: '+919876543331 (Usha Mishra - Mother)', relation: 'Father' },
    { name: 'Mrs. Priya Iyer', email: 'priya.parent@knowled.com', phone: '+919876543332', address: '12, RS Puram, Coimbatore, Tamil Nadu, 641002', emergency: '+919876543333 (Ravi Iyer - Father)', relation: 'Mother' },
    { name: 'Mr. Deepak Menon', email: 'deepak.parent@knowled.com', phone: '+919876543334', address: '45, MG Road, Thiruvananthapuram, Kerala, 695001', emergency: '+919876543335 (Suja Menon - Mother)', relation: 'Father' },
    { name: 'Mrs. Seema Yadav', email: 'seema.parent@knowled.com', phone: '+919876543336', address: '78, Boring Road, Patna, Bihar, 800013', emergency: '+919876543337 (Rajesh Yadav - Father)', relation: 'Mother' },
    { name: 'Mr. Gopal Krishnan', email: 'gopal.parent@knowled.com', phone: '+919876543338', address: '23, GS Road, Guwahati, Assam, 781005', emergency: '+919876543339 (Radha Krishnan - Mother)', relation: 'Father' }
  ];

  const createdParents = [];
  for (const parentData of newParentData) {
    const parentPassword = await bcrypt.hash('parent123', 12);
    const createdParent = await prisma.user.create({
      data: {
        email: parentData.email,
        password: parentPassword,
        role: UserRole.PARENT,
        parentProfile: {
          create: {
            fullName: parentData.name,
            phone: parentData.phone,
            address: parentData.address,
            emergencyContact: parentData.emergency,
            relationship: parentData.relation
          }
        }
      },
      include: { parentProfile: true }
    });
    createdParents.push(createdParent);
  }
  console.log('✅ Created 20 new parents');

  // Create 20 NEW Schools
  const newSchoolData = [
    { name: 'Delhi Public School, Vasant Kunj', address: 'Vasant Kunj, New Delhi, 110070', phone: '+911126134567', email: 'info@dpsvasantkunj.com', principal: 'Dr. Rashmi Malik' },
    { name: 'Ryan International School, Mumbai', address: 'Kandivali East, Mumbai, Maharashtra, 400101', phone: '+912228474567', email: 'info@ryanmumbai.com', principal: 'Ms. Priya Menon' },
    { name: 'Bishop Cotton Boys School, Bangalore', address: 'Brigade Road, Bangalore, Karnataka, 560025', phone: '+918022201234', email: 'info@bishopsbangalore.com', principal: 'Dr. Michael Johnson' },
    { name: 'DAV Public School, Chennai', address: 'T Nagar, Chennai, Tamil Nadu, 600017', phone: '+914424332567', email: 'info@davchennai.com', principal: 'Mrs. Kamala Devi' },
    { name: 'Kendriya Vidyalaya, Hyderabad', address: 'Secunderabad, Hyderabad, Telangana, 500015', phone: '+914027896543', email: 'info@kvhyd.com', principal: 'Mr. Srinivas Reddy' },
    { name: 'St. Marys School, Pune', address: 'Camp Area, Pune, Maharashtra, 411001', phone: '+912026129876', email: 'info@stmaryspune.com', principal: 'Sister Margaret' },
    { name: 'Don Bosco School, Kolkata', address: 'Park Circus, Kolkata, West Bengal, 700017', phone: '+913324567890', email: 'info@donboscokol.com', principal: 'Fr. Anthony D Souza' },
    { name: 'Zilla Parishad High School, Ahmedabad', address: 'Satellite, Ahmedabad, Gujarat, 380015', phone: '+917923456789', email: 'info@zpahd.com', principal: 'Mrs. Bharti Patel' },
    { name: 'Maharani Gayatri Devi School, Jaipur', address: 'City Palace Road, Jaipur, Rajasthan, 302002', phone: '+911412345678', email: 'info@mgdjaipur.com', principal: 'Ms. Sunita Rajput' },
    { name: 'Chinmaya Vidyalaya, Kochi', address: 'Kaloor, Kochi, Kerala, 682017', phone: '+914842345678', email: 'info@chinmayakochi.com', principal: 'Dr. Ravi Nair' },
    { name: 'La Martiniere College, Lucknow', address: 'Gomti Nagar, Lucknow, Uttar Pradesh, 226010', phone: '+915222345678', email: 'info@lamartlucknow.com', principal: 'Mr. Charles Williams' },
    { name: 'Carmel Convent School, Bhopal', address: 'TT Nagar, Bhopal, Madhya Pradesh, 462003', phone: '+917552345678', email: 'info@carmelbhopal.com', principal: 'Sister Rose Mary' },
    { name: 'Sacred Heart Convent, Chandigarh', address: 'Sector 26, Chandigarh, 160026', phone: '+911722345678', email: 'info@sacredchd.com', principal: 'Sister Maria' },
    { name: 'Somalwar High School, Nagpur', address: 'Civil Lines, Nagpur, Maharashtra, 440001', phone: '+917122345678', email: 'info@somalwarnagpur.com', principal: 'Dr. Vijay Somalwar' },
    { name: 'Sri Chaitanya School, Visakhapatnam', address: 'Siripuram, Visakhapatnam, Andhra Pradesh, 530003', phone: '+918912345678', email: 'info@chaityavizag.com', principal: 'Mr. Krishna Rao' },
    { name: 'Cotton Collegiate School, Guwahati', address: 'Pan Bazaar, Guwahati, Assam, 781001', phone: '+913612345678', email: 'info@cottonguwahati.com', principal: 'Dr. Bhupen Hazarika' },
    { name: 'DAV Public School, Bhubaneswar', address: 'Unit 8, Bhubaneswar, Odisha, 751012', phone: '+916742345678', email: 'info@davbbsr.com', principal: 'Mrs. Sangeeta Panda' },
    { name: 'PSG Public School, Coimbatore', address: 'Peelamedu, Coimbatore, Tamil Nadu, 641004', phone: '+914222345678', email: 'info@psgcbe.com', principal: 'Dr. Raman Kumar' },
    { name: 'Loyola School, Thiruvananthapuram', address: 'Sreekariyam, Thiruvananthapuram, Kerala, 695017', phone: '+914712345678', email: 'info@loyolatvm.com', principal: 'Fr. Joseph Francis' },
    { name: 'St. Michaels High School, Patna', address: 'Danapur, Patna, Bihar, 801503', phone: '+916122345678', email: 'info@stmichaelspatna.com', principal: 'Brother Michael' }
  ];

  const createdSchools = [];
  for (let i = 0; i < newSchoolData.length; i++) {
    const schoolData = newSchoolData[i];
    const school = await prisma.school.create({
      data: {
        name: schoolData.name,
        address: schoolData.address,
        phone: schoolData.phone,
        email: schoolData.email,
        principalName: schoolData.principal,
        centerId: createdCenters[i].centerProfile!.id
      }
    });
    createdSchools.push(school);
  }
  console.log('✅ Created 20 new schools');

  // Create 20 NEW School Viewers
  const newViewerData = [
    { name: 'Ms. Rashmi Gupta', email: 'rashmi.viewer@knowled.com', phone: '+919876543350', position: 'Special Educator' },
    { name: 'Mr. Arjun Nair', email: 'arjun.viewer@knowled.com', phone: '+919876543351', position: 'Counselor' },
    { name: 'Ms. Priya Sengupta', email: 'priya.viewer@knowled.com', phone: '+919876543352', position: 'Learning Support Coordinator' },
    { name: 'Mr. Karthik Reddy', email: 'karthik.viewer@knowled.com', phone: '+919876543353', position: 'Academic Coordinator' },
    { name: 'Ms. Neha Jain', email: 'neha.viewer@knowled.com', phone: '+919876543354', position: 'Student Counselor' },
    { name: 'Mr. Ravi Kumar', email: 'ravi.viewer@knowled.com', phone: '+919876543355', position: 'Resource Teacher' },
    { name: 'Ms. Pooja Sharma', email: 'pooja.viewer@knowled.com', phone: '+919876543356', position: 'Inclusion Specialist' },
    { name: 'Mr. Arun Desai', email: 'arun.viewer@knowled.com', phone: '+919876543357', position: 'Learning Facilitator' },
    { name: 'Ms. Kavya Pillai', email: 'kavya.viewer@knowled.com', phone: '+919876543358', position: 'Special Needs Coordinator' },
    { name: 'Mr. Sunil Singh', email: 'sunil.viewer@knowled.com', phone: '+919876543359', position: 'Educational Psychologist' },
    { name: 'Ms. Divya Agarwal', email: 'divya.viewer@knowled.com', phone: '+919876543360', position: 'Speech Therapist' },
    { name: 'Mr. Rohit Patel', email: 'rohit.viewer@knowled.com', phone: '+919876543361', position: 'Occupational Therapist' },
    { name: 'Ms. Shreya Das', email: 'shreya.viewer@knowled.com', phone: '+919876543362', position: 'Behavioral Specialist' },
    { name: 'Mr. Vikash Kumar', email: 'vikash.viewer@knowled.com', phone: '+919876543363', position: 'Learning Support Teacher' },
    { name: 'Ms. Ananya Mishra', email: 'ananya.viewer@knowled.com', phone: '+919876543364', position: 'Remedial Educator' },
    { name: 'Mr. Deepak Yadav', email: 'deepak.viewer@knowled.com', phone: '+919876543365', position: 'School Counselor' },
    { name: 'Ms. Ritu Bansal', email: 'ritu.viewer@knowled.com', phone: '+919876543366', position: 'Curriculum Specialist' },
    { name: 'Mr. Manish Kulkarni', email: 'manish.viewer@knowled.com', phone: '+919876543367', position: 'Assessment Coordinator' },
    { name: 'Ms. Sneha Iyer', email: 'sneha.viewer@knowled.com', phone: '+919876543368', position: 'Student Support Services' },
    { name: 'Mr. Abhishek Tripathi', email: 'abhishek.viewer@knowled.com', phone: '+919876543369', position: 'Educational Coordinator' }
  ];

  for (let i = 0; i < newViewerData.length; i++) {
    const viewerData = newViewerData[i];
    const viewerPassword = await bcrypt.hash('viewer123', 12);
    await prisma.user.create({
      data: {
        email: viewerData.email,
        password: viewerPassword,
        role: UserRole.SCHOOL_VIEWER,
        schoolViewerProfile: {
          create: {
            fullName: viewerData.name,
            position: viewerData.position,
            phone: viewerData.phone,
            schoolId: createdSchools[i].id
          }
        }
      }
    });
  }
  console.log('✅ Created 20 new school viewers');

  // Create 40 NEW Students (2 per parent)
  const studentNames = [
    // Male names
    'Aarav Sharma', 'Vivaan Kumar', 'Aditya Patel', 'Vihaan Reddy', 'Arjun Nair',
    'Sai Das', 'Reyansh Jain', 'Ayaan Pillai', 'Krishna Gupta', 'Ishaan Agarwal',
    'Shaurya Singh', 'Atharv Kumar', 'Aadhya Desai', 'Kiaan Rao', 'Aryan Sharma',
    'Rudra Mishra', 'Veer Iyer', 'Om Menon', 'Darsh Yadav', 'Kairav Krishnan',
    // Female names
    'Aadhya Sharma', 'Ananya Kumar', 'Avni Patel', 'Diya Reddy', 'Ira Nair',
    'Kavya Das', 'Myra Jain', 'Pihu Pillai', 'Saanvi Gupta', 'Tara Agarwal',
    'Anika Singh', 'Aditi Kumar', 'Priya Desai', 'Riya Rao', 'Shreya Sharma',
    'Tanvi Mishra', 'Vaani Iyer', 'Zara Menon', 'Ishika Yadav', 'Naina Krishnan'
  ];

  const createdStudents = [];
  for (let i = 0; i < createdParents.length; i++) {
    // Create 2 students per parent
    for (let j = 0; j < 2; j++) {
      const studentIndex = (i * 2) + j;
      const isFirstChild = j === 0;
      const age = isFirstChild ? Math.floor(Math.random() * 5) + 8 : Math.floor(Math.random() * 3) + 6; // First child 8-12, second child 6-8
      const grade = `Class ${age - 5}`;
      
      const student = await prisma.student.create({
        data: {
          fullName: studentNames[studentIndex],
          dateOfBirth: new Date(new Date().getFullYear() - age, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
          age: age,
          gender: studentIndex < 20 ? Gender.MALE : Gender.FEMALE,
          grade: grade,
          motherTongue: ['Hindi', 'Tamil', 'Telugu', 'Malayalam', 'Kannada', 'Bengali', 'Gujarati', 'Marathi'][Math.floor(Math.random() * 8)],
          syllabus: ['CBSE', 'ICSE', 'State Board'][Math.floor(Math.random() * 3)],
          status: StudentStatus.ACTIVE,
          centerId: createdCenters[i].centerProfile!.id,
          schoolId: createdSchools[i].id,
          parentId: createdParents[i].parentProfile!.id
        }
      });
      createdStudents.push(student);
    }
  }
  console.log('✅ Created 40 new students');

  // Assign students to special educators
  const assignments = [];
  for (let i = 0; i < createdStudents.length; i++) {
    const educatorIndex = Math.floor(i / 2); // 2 students per educator
    assignments.push({
      studentId: createdStudents[i].id,
      specialEducatorId: createdEducators[educatorIndex].specialEducatorProfile!.id,
      isActive: true
    });
  }

  await prisma.studentAssignment.createMany({
    data: assignments
  });
  console.log('✅ Assigned students to special educators');

  // Assign educators to centers
  const centerAssignments = [];
  for (let i = 0; i < createdEducators.length; i++) {
    centerAssignments.push({
      centerId: createdCenters[i].centerProfile!.id,
      specialEducatorId: createdEducators[i].specialEducatorProfile!.id,
      isActive: true
    });
  }

  await prisma.centerAssignment.createMany({
    data: centerAssignments
  });
  console.log('✅ Assigned educators to centers');

  // Create sample intake forms for first 20 students
  const intakeForms = [];
  for (let i = 0; i < 20; i++) {
    intakeForms.push({
      studentId: createdStudents[i].id,
      specialEducatorId: createdEducators[Math.floor(i / 2)].specialEducatorProfile!.id,
      address: createdParents[Math.floor(i / 2)].parentProfile!.address,
      familyType: ['Nuclear', 'Joint', 'Extended'][Math.floor(Math.random() * 3)],
      digitalResourcesAtHome: Math.random() > 0.3,
      dailyDigitalUse: Math.floor(Math.random() * 4) + 1,
      enjoysSchool: Math.random() > 0.2,
      studyAssistant: ['Mother', 'Father', 'Sibling', 'Tutor'][Math.floor(Math.random() * 4)],
      externalAcademicSupport: Math.random() > 0.4,
      enjoysReading: Math.random() > 0.3,
      dailyParentChildTime: Math.floor(Math.random() * 3) + 2,
      childType: 'Biological',
      fatherName: `Father of ${createdStudents[i].fullName}`,
      motherName: `Mother of ${createdStudents[i].fullName}`,
      pregnancyNormal: Math.random() > 0.1,
      fullTermOrPremature: Math.random() > 0.1 ? 'Full Term' : 'Premature',
      deliveryType: Math.random() > 0.3 ? 'Normal' : 'C-Section',
      breastFed: Math.random() > 0.1,
      infantJaundice: Math.random() < 0.2,
      incubation: Math.random() < 0.1,
      immunizationDone: Math.random() > 0.05,
      consanguineousMarriage: Math.random() < 0.1,
      birthCry: Math.random() > 0.1 ? 'Immediate' : 'Delayed',
      ageOfWalking: Math.floor(Math.random() * 6) + 10,
      ageOfTwoWordSpeech: Math.floor(Math.random() * 6) + 15,
      healthConcerns: Math.random() > 0.7 ? 'Mild concerns noted' : 'None reported',
      epilepticHistory: Math.random() < 0.05,
      onMedication: Math.random() < 0.1,
      asthmaWheezing: Math.random() < 0.15,
      wearsGlasses: Math.random() < 0.2,
      visionTestDone: Math.random() > 0.1,
      hearingTestDone: Math.random() > 0.1,
      attendedPreschool: Math.random() > 0.3,
      repeatedGrades: Math.random() < 0.2,
      dominantWritingHand: Math.random() > 0.1 ? 'Right' : 'Left',
      strugglesInLanguages: Math.random() < 0.4,
      status: AssessmentStatus.COMPLETED,
      completedAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000)
    });
  }

  await prisma.intakeForm.createMany({
    data: intakeForms
  });
  console.log('✅ Created 20 sample intake forms');

  // Create sample IEP goals for first 20 students
  const domains = ['Reading', 'Math', 'Writing', 'Social Skills', 'Communication', 'Motor Skills'];
  const iepGoals = [];
  
  for (let i = 0; i < 20; i++) {
    const numGoals = Math.floor(Math.random() * 3) + 2; // 2-4 goals per student
    for (let j = 0; j < numGoals; j++) {
      const domain = domains[j % domains.length];
      iepGoals.push({
        studentId: createdStudents[i].id,
        specialEducatorId: createdEducators[Math.floor(i / 2)].specialEducatorProfile!.id,
        domain: domain,
        goalStatement: `${createdStudents[i].fullName} will improve ${domain.toLowerCase()} skills with ${Math.floor(Math.random() * 20) + 70}% accuracy`,
        strategy: `Structured intervention using evidence-based practices for ${domain.toLowerCase()}`,
        startDate: new Date(Date.now() - Math.floor(Math.random() * 60) * 24 * 60 * 60 * 1000),
        targetDate: new Date(Date.now() + Math.floor(Math.random() * 120 + 30) * 24 * 60 * 60 * 1000),
        expectedOutcome: `Significant improvement in ${domain.toLowerCase()} abilities`,
        progressPercent: Math.floor(Math.random() * 80) + 10,
        status: [IEPGoalStatus.IN_PROGRESS, IEPGoalStatus.ACHIEVED, IEPGoalStatus.NOT_STARTED][Math.floor(Math.random() * 3)]
      });
    }
  }

  await prisma.iEPGoal.createMany({
    data: iepGoals
  });
  console.log('✅ Created sample IEP goals');

  // Create sample session notes
  const sessionNotes = [];
  for (let i = 0; i < 30; i++) {
    const studentIndex = i % 20; // Cycle through first 20 students
    const activities = [
      'Reading comprehension exercises with phonics support',
      'Mathematical problem-solving with visual aids',
      'Writing practice with adapted tools',
      'Social skills training through role-play',
      'Communication exercises using AAC devices',
      'Fine motor skill development activities',
      'Behavioral intervention strategies',
      'Memory enhancement techniques'
    ];
    
    sessionNotes.push({
      studentId: createdStudents[studentIndex].id,
      specialEducatorId: createdEducators[Math.floor(studentIndex / 2)].specialEducatorProfile!.id,
      sessionDate: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000),
      duration: [30, 45, 60][Math.floor(Math.random() * 3)],
      activities: activities[Math.floor(Math.random() * activities.length)],
      observations: `${createdStudents[studentIndex].fullName} showed positive engagement and made measurable progress during the session`,
      progress: ['Excellent progress noted', 'Good improvement observed', 'Steady progress made', 'Significant gains achieved'][Math.floor(Math.random() * 4)],
      nextSteps: 'Continue current strategies with increased complexity and introduce new skill areas'
    });
  }

  await prisma.sessionNote.createMany({
    data: sessionNotes
  });
  console.log('✅ Created 30 sample session notes');

  console.log('\n🎉 Database seeding completed successfully with all new entries!');
  console.log('\n📊 Summary of New Entries Created:');
  console.log('├── 20 new Admin Users');
  console.log('├── 20 new Super Special Educators');
  console.log('├── 20 new Special Educators');
  console.log('├── 20 new Centers');
  console.log('├── 20 new Parents');
  console.log('├── 20 new Schools');
  console.log('├── 20 new School Viewers');
  console.log('├── 40 new Students (2 per parent)');
  console.log('├── 40 new Student Assignments');
  console.log('├── 20 new Center Assignments');
  console.log('├── 20 new Intake Forms');
  console.log('├── 60+ new IEP Goals');
  console.log('└── 30 new Session Notes');
  
  console.log('\n📋 All entries use Indian names, addresses, and culturally relevant data');
  console.log('📋 Email patterns: [name].[role]@knowled.com');
  console.log('📋 Phone patterns: +9198765432XX (sequential)');
  console.log('📋 Password: respective role names (admin123, super123, etc.)');

  // Additional sample data creation
  console.log('\n🔄 Creating additional relationships and sample data...');

  // Create some assessment records
  const assessmentData = [];
  for (let i = 0; i < 15; i++) {
    assessmentData.push({
      studentId: createdStudents[i].id,
      specialEducatorId: createdEducators[Math.floor(i / 2)].specialEducatorProfile!.id,
      assessmentType: ['Initial Assessment', 'Progress Review', 'Annual Assessment', 'Diagnostic Assessment'][Math.floor(Math.random() * 4)],
      assessmentDate: new Date(Date.now() - Math.floor(Math.random() * 90) * 24 * 60 * 60 * 1000),
      findings: `Comprehensive assessment findings for ${createdStudents[i].fullName} indicating specific learning profile and intervention needs`,
      recommendations: 'Structured intervention program with regular progress monitoring recommended',
      nextReviewDate: new Date(Date.now() + Math.floor(Math.random() * 90 + 30) * 24 * 60 * 60 * 1000)
    });
  }

  // Note: Add this to your schema if you have an Assessment model
  // await prisma.assessment.createMany({ data: assessmentData });
  console.log('✅ Assessment data prepared (add Assessment model to schema if needed)');

  // Create some progress reports
  const progressReports = [];
  for (let i = 0; i < 10; i++) {
    progressReports.push({
      studentId: createdStudents[i].id,
      specialEducatorId: createdEducators[Math.floor(i / 2)].specialEducatorProfile!.id,
      reportDate: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000),
      academicProgress: Math.floor(Math.random() * 30) + 60, // 60-89%
      behavioralProgress: Math.floor(Math.random() * 30) + 65, // 65-94%
      socialProgress: Math.floor(Math.random() * 25) + 70, // 70-94%
      overallComments: `${createdStudents[i].fullName} continues to make steady progress across all developmental domains with consistent support`,
      parentFeedback: 'Parents report positive changes at home and increased confidence in academic tasks',
      nextGoals: 'Focus on advanced skill development and increased independence'
    });
  }

  // Note: Add this to your schema if you have a ProgressReport model
  // await prisma.progressReport.createMany({ data: progressReports });
  console.log('✅ Progress report data prepared (add ProgressReport model to schema if needed)');

  // Create some parent-teacher meeting records
  const meetingRecords = [];
  for (let i = 0; i < 12; i++) {
    meetingRecords.push({
      studentId: createdStudents[i].id,
      parentId: createdParents[Math.floor(i / 2)].parentProfile!.id,
      specialEducatorId: createdEducators[Math.floor(i / 2)].specialEducatorProfile!.id,
      meetingDate: new Date(Date.now() - Math.floor(Math.random() * 45) * 24 * 60 * 60 * 1000),
      meetingType: ['Regular Review', 'IEP Meeting', 'Progress Discussion', 'Concern Meeting'][Math.floor(Math.random() * 4)],
      attendees: ['Parent', 'Special Educator', 'School Representative'].join(', '),
      discussionPoints: 'Student progress, home-school coordination, upcoming goals and strategies discussed',
      actionItems: 'Continue current interventions, implement home practice activities, schedule follow-up meeting',
      nextMeetingDate: new Date(Date.now() + Math.floor(Math.random() * 30 + 20) * 24 * 60 * 60 * 1000)
    });
  }

  // Note: Add this to your schema if you have a Meeting model
  // await prisma.meeting.createMany({ data: meetingRecords });
  console.log('✅ Meeting records data prepared (add Meeting model to schema if needed)');

  console.log('\n✨ Enhanced seeding completed with comprehensive Indian educational data!');
  console.log('🏫 All data reflects Indian educational system, cultural contexts, and naming conventions');
  console.log('🌏 Geographic distribution covers major Indian cities and states');
  console.log('📚 Educational approaches incorporate Indian pedagogical methods');
  console.log('👨‍👩‍👧‍👦 Family structures and relationships reflect Indian social contexts');

  // Final verification
  const totalUsers = await prisma.user.count();
  const totalStudents = await prisma.student.count();
  const totalSchools = await prisma.school.count();
  
  console.log(`\n📈 Final Database Statistics:`);
  console.log(`├── Total Users: ${totalUsers}`);
  console.log(`├── Total Students: ${totalStudents}`);
  console.log(`├── Total Schools: ${totalSchools}`);
  console.log(`└── All entries successfully created with Indian context!`);
}

// Call the main function
main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });