require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Job = require('./models/Job');
const Application = require('./models/Application');

const seedDatabase = async () => {
  try {
    const connStr = process.env.MONGO_URI || 'mongodb://localhost:27017/placement_tracker';
    console.log('Connecting to database for seeding...');
    await mongoose.connect(connStr);
    console.log('Database connected successfully.');

    // 1. Wipe existing tables to ensure a clean seed run
    console.log('Cleaning existing collection documents...');
    await User.deleteMany({});
    await Job.deleteMany({});
    await Application.deleteMany({});
    console.log('Database cleared.');

    // 2. Seed Mock Student Account with exact required profile data
    console.log('Creating Student Profiles...');
    const studentUser = await User.create({
      name: 'Anurag Student',
      email: 'student@anurag.edu.in',
      password: 'studentpassword123',
      role: 'student',
      profile: {
        cgpa: 8.33,
        branch: 'IT',
        skills: ['MERN stack', 'Java', 'React', 'Node.js', 'MongoDB'],
        resumeText: 'Passionate computer science student specializing in Information Technology. Proficient in MERN stack development and enterprise Java systems. Built multiple web apps and solved complex database structures.',
        resumeUrl: 'https://anurag.edu.in/resumes/anurag_student.pdf',
        phone: '+91 9876543210'
      }
    });

    const studentCSE = await User.create({
      name: 'Amit Kumar',
      email: 'amit@anurag.edu.in',
      password: 'studentpassword123',
      role: 'student',
      profile: {
        cgpa: 9.12,
        branch: 'CSE',
        skills: ['C++', 'Python', 'Machine Learning', 'React'],
        resumeText: 'Computer Science student focusing on Software Engineering and ML models.',
        phone: '+91 9988776655'
      }
    });

    const studentECE = await User.create({
      name: 'Sneha Reddy',
      email: 'sneha@anurag.edu.in',
      password: 'studentpassword123',
      role: 'student',
      profile: {
        cgpa: 8.85,
        branch: 'ECE',
        skills: ['Embedded Systems', 'IoT', 'C', 'Python'],
        resumeText: 'ECE student with strong proficiency in microcontrollers and Internet of Things IoT development.',
        phone: '+91 8877665544'
      }
    });

    const studentME = await User.create({
      name: 'Rohan Sharma',
      email: 'rohan@anurag.edu.in',
      password: 'studentpassword123',
      role: 'student',
      profile: {
        cgpa: 7.65,
        branch: 'ME',
        skills: ['CAD', 'SolidWorks', 'MATLAB'],
        resumeText: 'Mechanical Engineering student interested in automotive design and robotics.',
        phone: '+91 7766554433'
      }
    });

    console.log('Student Accounts Created successfully.');

    // 3. Seed Mock Admin Account
    console.log('Creating Anurag Admin Profile...');
    const adminUser = await User.create({
      name: 'Anurag Placement Admin',
      email: 'admin@anurag.edu.in',
      password: 'adminpassword123',
      role: 'admin'
    });
    console.log(`Admin Account Created: ${adminUser.email}`);

    // 4. Seed Mock Corporate Job Listings (With CGPA thresholds)
    console.log('Creating Mock Placement Drives...');
    const jobs = await Job.create([
      {
        companyName: 'TCS Digital',
        role: 'Systems Engineer',
        description: 'Design and support cloud network infrastructures and corporate microservices. Ideal for MERN and Java enthusiasts.',
        requirements: ['React', 'Node.js', 'Java', 'SQL'],
        cgpaCutoff: 6.5,
        eligibleBranches: ['IT', 'CSE', 'ECE'],
        deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        package: 7.5,
        active: true
      },
      {
        companyName: 'Microsoft',
        role: 'Software Development Engineer',
        description: 'Build enterprise operating layer components and contribute to active Azure server architectures.',
        requirements: ['Java', 'C++', 'System Design', 'Algorithms'],
        cgpaCutoff: 8.5,
        eligibleBranches: ['IT', 'CSE'],
        deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        package: 44.0,
        active: true
      },
      {
        companyName: 'Cognizant',
        role: 'Full Stack Developer',
        description: 'Develop next-generation progressive web applications using JavaScript technologies.',
        requirements: ['MERN stack', 'Git', 'Agile Methodologies'],
        cgpaCutoff: 7.0,
        eligibleBranches: ['IT', 'CSE', 'ECE'],
        deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        package: 9.0,
        active: true
      }
    ]);
    console.log(`Mock Corporate Job Listings Seeding Completed: ${jobs.length} jobs created.`);

    // 5. Setup applications in multiple states
    console.log('Populating initial applications...');
    await Application.create([
      {
        student: studentUser._id,
        job: jobs[2]._id, // Cognizant
        status: 'Wishlist',
        matchScore: 82,
        recommendedKeywords: ['REACT', 'REST API', 'GIT'],
        matchFeedback: 'Great profile! Your experience with the MERN stack is highly aligned. Focus on presenting git workflow knowledge in the interview.'
      },
      {
        student: studentCSE._id,
        job: jobs[1]._id, // Microsoft
        status: 'Offered',
        matchScore: 95,
        recommendedKeywords: ['SYSTEM DESIGN', 'ALGORITHMS'],
        matchFeedback: 'Exceptional match. Coding profile aligns with the role demands perfectly.'
      },
      {
        student: studentECE._id,
        job: jobs[0]._id, // TCS Digital
        status: 'Offered',
        matchScore: 78,
        recommendedKeywords: ['SQL', 'CLOUD INFRASTRUCTURE'],
        matchFeedback: 'Good technical fit. Review system engineering fundamentals.'
      },
      {
        student: studentUser._id,
        job: jobs[0]._id, // TCS Digital
        status: 'Interview',
        matchScore: 85,
        recommendedKeywords: ['REACT', 'REST API'],
        matchFeedback: 'Strong profile match. Excellent communication and projects.'
      }
    ]);

    // 6. Seed some mock security anomalies
    console.log('Seeding security anomaly logs...');
    const Anomaly = require('./models/Anomaly');
    await Anomaly.create([
      {
        student: studentUser._id,
        type: 'ANOMALY_CGPA_BYPASS',
        payload: {
          studentId: studentUser._id,
          studentName: studentUser.name,
          studentCgpa: 8.33,
          companyName: 'Microsoft',
          jobRole: 'Software Development Engineer',
          requiredCgpa: 8.5,
          timestamp: new Date(Date.now() - 3600000)
        },
        status: 'Pending'
      },
      {
        type: 'ANOMALY_RATE_LIMIT',
        payload: {
          ip: '127.0.0.1',
          requestCount: 124,
          route: '/api/auth/login',
          timestamp: new Date(Date.now() - 7200000)
        },
        status: 'Resolved',
        resolvedBy: adminUser._id,
        resolvedAt: new Date()
      }
    ]);

    console.log('Database Seeding Successful!');
    process.exit(0);
  } catch (error) {
    console.error(`Error during Database Seeding: ${error.message}`);
    process.exit(1);
  }
};

seedDatabase();
