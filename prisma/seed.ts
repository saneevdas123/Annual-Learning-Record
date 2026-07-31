/* eslint-disable no-console */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { RECORD_TYPES, normalizeToWeight, CAMPUSES, type RecordType } from '../src/lib/domain';

const prisma = new PrismaClient();

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? 'admin@cutm.ac.in';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? 'Admin@12345';
const DEMO_PASSWORD = 'Cutm@12345';
const AY = '2025-26';

const COLORS = ['#20223f', '#b23a2e', '#a17c3a', '#3b3f6b', '#4b6b52', '#6b4b6b'];
const pick = (i: number) => COLORS[i % COLORS.length];

async function hash(pw: string) {
  return bcrypt.hash(pw, 10);
}

async function reset() {
  // Delete in FK-safe order (children first).
  await prisma.notification.deleteMany();
  await prisma.scoreAppeal.deleteMany();
  await prisma.recordCompositeScore.deleteMany();
  await prisma.recordEntry.deleteMany();
  await prisma.signoffStep.deleteMany();
  await prisma.creditLedgerEntry.deleteMany();
  await prisma.yearEvaluation.deleteMany();
  await prisma.programEvaluation.deleteMany();
  await prisma.plagiarismCase.deleteMany();
  await prisma.deliverableCandidate.deleteMany();
  await prisma.deliverableSupervisor.deleteMany();
  await prisma.industryToken.deleteMany();
  await prisma.deliverable.deleteMany();
  await prisma.learningRecord.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.committeeMember.deleteMany();
  await prisma.committee.deleteMany();
  await prisma.course.deleteMany();
  await prisma.program.deleteMany();
  await prisma.department.deleteMany();
  await prisma.campus.deleteMany();
  await prisma.user.deleteMany();
}

async function main() {
  console.log('Resetting database…');
  await reset();

  console.log('Seeding campuses…');
  const campuses = await Promise.all(
    CAMPUSES.map((c) => prisma.campus.create({ data: { name: c.name, code: c.code } }))
  );
  const paralakhemundi = campuses[0];

  const dept = await prisma.department.create({
    data: { name: 'Computer Science & Engineering', campusId: paralakhemundi.id },
  });
  const program = await prisma.program.create({
    data: { name: 'B.Tech CSE', degree: 'UG', durationYears: 4, departmentId: dept.id },
  });

  console.log('Seeding users…');
  const admin = await prisma.user.create({
    data: {
      name: 'System Administrator',
      email: ADMIN_EMAIL,
      passwordHash: await hash(ADMIN_PASSWORD),
      role: 'ADMIN',
      avatarColor: pick(0),
      campusId: paralakhemundi.id,
      departmentId: dept.id,
      eDeclarationAt: new Date(),
    },
  });

  const dean = await prisma.user.create({
    data: {
      name: 'Dr. Anjali Rao', email: 'dean@cutm.ac.in', passwordHash: await hash(DEMO_PASSWORD),
      role: 'DEAN', avatarColor: pick(1), campusId: paralakhemundi.id, departmentId: dept.id,
    },
  });
  const hod = await prisma.user.create({
    data: {
      name: 'Dr. Suresh Nair', email: 'hod@cutm.ac.in', passwordHash: await hash(DEMO_PASSWORD),
      role: 'HOD', avatarColor: pick(2), campusId: paralakhemundi.id, departmentId: dept.id,
    },
  });
  const faculty = await prisma.user.create({
    data: {
      name: 'Prof. Meera Iyer', email: 'faculty@cutm.ac.in', passwordHash: await hash(DEMO_PASSWORD),
      role: 'FACULTY', avatarColor: pick(3), campusId: paralakhemundi.id, departmentId: dept.id,
    },
  });
  const mentor = await prisma.user.create({
    data: {
      name: 'Dr. Vikram Bose', email: 'mentor@cutm.ac.in', passwordHash: await hash(DEMO_PASSWORD),
      role: 'MENTOR', avatarColor: pick(4), campusId: paralakhemundi.id, departmentId: dept.id,
    },
  });

  const studentDefs = [
    { name: 'Aarav Sharma', reg: 'CSE21001' },
    { name: 'Diya Patel', reg: 'CSE21002' },
    { name: 'Rohan Das', reg: 'CSE21003' },
    { name: 'Isha Menon', reg: 'CSE21004' },
    { name: 'Kabir Singh', reg: 'CSE21005' },
  ];
  const students = await Promise.all(
    studentDefs.map(async (s, i) =>
      prisma.user.create({
        data: {
          name: s.name,
          email: `${s.reg.toLowerCase()}@cutm.ac.in`,
          passwordHash: await hash(DEMO_PASSWORD),
          role: 'STUDENT',
          registrationNumber: s.reg,
          avatarColor: pick(i),
          campusId: paralakhemundi.id,
          departmentId: dept.id,
          programId: program.id,
          mentorId: mentor.id,
          eDeclarationAt: i % 2 === 0 ? new Date() : null,
        },
      })
    )
  );

  console.log('Seeding courses…');
  const courseDefs = [
    { code: 'CS201', title: 'Data Structures', combinationCode: 'THEORY_PRACTICE', term: 'Sem 3', credits: 4 },
    { code: 'CS202', title: 'Database Systems', combinationCode: 'THEORY_PROJECT', term: 'Sem 3', credits: 4 },
    { code: 'CS210', title: 'Operating Systems', combinationCode: 'THEORY', term: 'Sem 3', credits: 3 },
    { code: 'CS220', title: 'IoT Workshop', combinationCode: 'WORKSHOP', term: 'Sem 3', credits: 2 },
    { code: 'CS230', title: 'Cloud Fundamentals (MOOC)', combinationCode: 'THEORY_MOOC', term: 'Sem 3', credits: 3 },
    { code: 'CS240', title: 'Capstone Practicum', combinationCode: 'THEORY_PRACTICE_PROJECT', term: 'Sem 4', credits: 6 },
  ];
  const courses = await Promise.all(
    courseDefs.map((c) =>
      prisma.course.create({
        data: {
          ...c,
          combinationCode: c.combinationCode as any,
          academicYear: AY,
          campusId: paralakhemundi.id,
          departmentId: dept.id,
          programId: program.id,
          facultyId: faculty.id,
        },
      })
    )
  );

  console.log('Enrolling students…');
  for (const s of students) {
    for (const c of courses) {
      await prisma.enrollment.create({
        data: { studentId: s.id, courseId: c.id, academicYear: AY },
      });
    }
  }

  console.log('Seeding learning records (tracing learning)…');
  // Helper to create a record with entries and, optionally, an approved score.
  async function createRecord(
    studentId: string,
    courseId: string,
    recordType: RecordType,
    opts: { approved?: boolean; facultyScore?: number; entryScores?: number[] }
  ) {
    const spec = RECORD_TYPES[recordType];
    const rec = await prisma.learningRecord.create({
      data: {
        studentId,
        courseId,
        recordType,
        academicYear: AY,
        term: 'Sem 3',
        title: `${spec.label}`,
        description: `Auto-seeded ${spec.label.toLowerCase()} demonstrating the learning trace.`,
        booksReferred: 'Cormen — Introduction to Algorithms; internal lab manual.',
        subjectWeightPct: spec.weightPct,
        perEntryMax: spec.perEntryMax,
        status: opts.approved ? 'APPROVED' : 'SUBMITTED',
        submittedAt: new Date(),
      },
    });

    const scores = opts.entryScores ?? [];
    for (let i = 0; i < scores.length; i += 1) {
      const raw = scores[i];
      const rubricScores: Record<string, number> = {};
      // Spread the raw score across rubric criteria proportionally.
      let remaining = raw;
      spec.rubric.forEach((c, idx) => {
        const v = idx === spec.rubric.length - 1 ? Math.max(0, remaining) : Math.min(c.max, Math.round(raw * (c.max / spec.perEntryMax)));
        rubricScores[c.criterion] = v;
        remaining -= v;
      });
      await prisma.recordEntry.create({
        data: {
          recordId: rec.id,
          title: spec.entryBased ? `Experiment ${i + 1}` : 'Assessment',
          content: 'Seeded entry.',
          rubricScores,
          rawScore: raw,
          maxScore: spec.perEntryMax,
          hoursLogged: spec.hoursBased ? 6 : null,
        },
      });
    }

    // Sign-off chain.
    await prisma.signoffStep.createMany({
      data: [
        { target: 'LEARNING_RECORD', targetId: rec.id, stepOrder: 1, role: 'FACULTY', status: opts.approved ? 'SIGNED' : 'PENDING', signerId: opts.approved ? faculty.id : null, signedAt: opts.approved ? new Date() : null },
        { target: 'LEARNING_RECORD', targetId: rec.id, stepOrder: 2, role: 'MENTOR' },
        { target: 'LEARNING_RECORD', targetId: rec.id, stepOrder: 3, role: 'HOD' },
      ],
    });

    if (opts.approved && opts.facultyScore != null) {
      const { normalized, note } = normalizeToWeight(recordType, opts.facultyScore, spec.perEntryMax, spec.weightPct);
      await prisma.learningRecord.update({
        where: { id: rec.id },
        data: {
          facultyScore: opts.facultyScore,
          normalizedScore: normalized,
          normalizationNote: note,
          reviewedById: faculty.id,
          reviewedAt: new Date(),
        },
      });
    }
    return rec;
  }

  // Student 0: fully traced across a combination subject (Theory + Practice).
  const ds = courses[0]; // CS201 THEORY_PRACTICE → CLASSROOM_LEARNING + APPLIED_ACTION_LEARNING
  await createRecord(students[0].id, ds.id, 'CLASSROOM_LEARNING', { approved: true, facultyScore: 82, entryScores: [82] });
  await createRecord(students[0].id, ds.id, 'APPLIED_ACTION_LEARNING', {
    approved: true, facultyScore: 43, entryScores: [42, 45, 41, 44],
  });
  // A workshop record (hours-based) submitted, awaiting review.
  await createRecord(students[0].id, courses[3].id, 'ACTION_LEARNING', { entryScores: [78, 84] });

  // Student 1: theory approved, project submitted.
  await createRecord(students[1].id, courses[1].id, 'CLASSROOM_LEARNING', { approved: true, facultyScore: 75, entryScores: [75] });
  await createRecord(students[1].id, courses[1].id, 'PROJECT_REPORT', { entryScores: [24] });

  // Students 2-4: one submitted classroom record each (review queue depth).
  for (let i = 2; i < students.length; i += 1) {
    await createRecord(students[i].id, courses[2].id, 'CLASSROOM_LEARNING', { entryScores: [70 + i] });
  }

  console.log('Seeding a signed-off annual evaluation + credit…');
  const total = 17 + 16 + 18 + 15 + 17;
  await prisma.yearEvaluation.create({
    data: {
      studentId: students[0].id,
      academicYear: AY,
      status: 'SIGNED_OFF',
      coverageCourses: 17, coverageComponents: 16, qualityContent: 18, aesthetics: 15, presentation: 17,
      totalMark: total,
      creditAwarded: 1,
    },
  });
  await prisma.creditLedgerEntry.create({
    data: { studentId: students[0].id, academicYear: AY, credits: 1, basket: 'COMPULSORY', source: 'ALR' },
  });

  console.log('Seeding a capstone deliverable + industry token…');
  const deliverable = await prisma.deliverable.create({
    data: {
      type: 'INTERNSHIP',
      title: 'Summer Internship — Cloud Platform Team',
      academicYear: AY,
      status: 'SUBMITTED',
      plagiarismThreshold: 30,
      internalScore: 44,
    },
  });
  await prisma.deliverableCandidate.create({
    data: { deliverableId: deliverable.id, userId: students[1].id, registrationNumber: students[1].registrationNumber },
  });
  await prisma.deliverableSupervisor.create({
    data: { deliverableId: deliverable.id, userId: faculty.id, role: 'SUPERVISOR' },
  });
  await prisma.industryToken.create({
    data: {
      token: 'demo-industry-token-cs21002',
      deliverableId: deliverable.id,
      email: 'supervisor@techcorp.example',
      expiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1000),
    },
  });

  console.log('\nSeed complete.');
  console.log('─'.repeat(48));
  console.log(`Admin:   ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  console.log(`Dean:    dean@cutm.ac.in / ${DEMO_PASSWORD}`);
  console.log(`HoD:     hod@cutm.ac.in / ${DEMO_PASSWORD}`);
  console.log(`Faculty: faculty@cutm.ac.in / ${DEMO_PASSWORD}`);
  console.log(`Mentor:  mentor@cutm.ac.in / ${DEMO_PASSWORD}`);
  console.log(`Student: cse21001@cutm.ac.in / ${DEMO_PASSWORD}`);
  console.log(`Industry link: /industry/demo-industry-token-cs21002`);
  console.log('─'.repeat(48));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
