import { connectDatabase, disconnectDatabase } from './src/config/database.js';
import User from './src/models/User.js';
import College from './src/models/College.js';
import Hostel from './src/models/Hostel.js';
import Fee from './src/models/Fee.js';
import SystemSetting from './src/models/SystemSetting.js';

const password = 'hoas12345';

async function main() {
  await connectDatabase();
  console.log('Seeding demo data...');

  await SystemSetting.findOneAndUpdate({ key: 'global' }, {}, { upsert: true });

  const owner = await User.findOneAndUpdate(
    { uid: 'seed-owner' },
    {
      uid: 'seed-owner',
      email: 'owner@hoas.test',
      name: 'Platform Owner',
      role: 'owner',
      status: 'approved',
      approvedAt: new Date(),
    },
    { upsert: true, new: true }
  );

  const college = await College.findOneAndUpdate(
    { name: 'Demo Engineering College' },
    {
      name: 'Demo Engineering College',
      address: 'Hyderabad',
      status: 'approved',
    },
    { upsert: true, new: true }
  );

  const management = await User.findOneAndUpdate(
    { uid: 'seed-management' },
    {
      uid: 'seed-management',
      email: 'principal@demo.test',
      name: 'Dr. Demo Principal',
      role: 'management',
      status: 'approved',
      collegeId: college._id,
      collegeName: college.name,
      approvedAt: new Date(),
    },
    { upsert: true, new: true }
  );
  college.managementId = management._id;
  await college.save();

  const hostel = await Hostel.findOneAndUpdate(
    { collegeId: college._id, name: 'Boys Hostel A' },
    {
      name: 'Boys Hostel A',
      block: 'A',
      collegeId: college._id,
      capacity: 200,
    },
    { upsert: true, new: true }
  );

  const warden = await User.findOneAndUpdate(
    { uid: 'seed-warden' },
    {
      uid: 'seed-warden',
      email: 'warden@demo.test',
      name: 'Warden Kumar',
      role: 'warden',
      status: 'approved',
      collegeId: college._id,
      collegeName: college.name,
      hostelId: hostel._id,
      hostelBlock: 'A',
      approvedAt: new Date(),
    },
    { upsert: true, new: true }
  );
  hostel.wardenId = warden._id;
  await hostel.save();

  const students = [
    { uid: 'seed-student-1', email: 'student1@demo.test', name: 'Ravi Kumar', studentId: 'STU001', paid: 45000, total: 60000 },
    { uid: 'seed-student-2', email: 'student2@demo.test', name: 'Sita Reddy', studentId: 'STU002', paid: 20000, total: 60000 },
    { uid: 'seed-student-3', email: 'student3@demo.test', name: 'Arjun Singh', studentId: 'STU003', paid: 0, total: 60000 },
  ];

  for (const s of students) {
    const student = await User.findOneAndUpdate(
      { uid: s.uid },
      {
        uid: s.uid,
        email: s.email,
        name: s.name,
        role: 'student',
        status: 'approved',
        collegeId: college._id,
        collegeName: college.name,
        hostelId: hostel._id,
        hostelBlock: 'A',
        wardenId: warden._id,
        studentId: s.studentId,
        feeDetails: { totalFee: s.total, paidFee: s.paid, pendingFee: s.total - s.paid },
        managementVerification: 'Verified',
        wardenVerification: 'Verified',
        approvedAt: new Date(),
      },
      { upsert: true, new: true }
    );
    await Fee.findOneAndUpdate(
      { studentId: student._id },
      {
        studentId: student._id,
        collegeId: college._id,
        managementId: management._id,
        wardenId: warden._id,
        totalAmount: s.total,
        paidAmount: s.paid,
        status: s.paid >= s.total ? 'fully_paid' : s.paid > 0 ? 'partially_paid' : 'pending',
        isVerifiedByManagement: true,
        isVerifiedByWarden: true,
        approved: true,
      },
      { upsert: true, new: true }
    );
  }

  console.log('Seeding complete. Demo users:');
  console.log(`  owner      -> uid=seed-owner`);
  console.log(`  management -> uid=seed-management`);
  console.log(`  warden     -> uid=seed-warden`);
  console.log(`  students   -> uid=seed-student-1/2/3`);
  console.log('Get a token: curl -X POST localhost:4000/api/dev/token -d \'{"uid":"seed-warden"}\'');

  await disconnectDatabase();
}

main().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});