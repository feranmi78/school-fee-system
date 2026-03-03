import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create admin user
  const adminPassword = await bcrypt.hash("Admin@123456", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@schoolpay.edu.ng" },
    update: {},
    create: {
      name: "School Administrator",
      email: "admin@schoolpay.edu.ng",
      password: adminPassword,
      role: "ADMIN",
    },
  });

  console.log(`✅ Admin created: ${admin.email}`);
  console.log(`   Password: Admin@123456`);

  // Create sample fee structure
  await prisma.feeStructure.upsert({
    where: {
      term_session: {
        term: "First Term",
        session: "2024/2025",
      },
    },
    update: {},
    create: {
      term: "First Term",
      session: "2024/2025",
      amount: 85000,
    },
  });

  console.log("✅ Sample fee structure created");

  // Create sample student
  const studentPassword = await bcrypt.hash("Student@123", 12);

  const studentUser = await prisma.user.upsert({
    where: { email: "john.doe@student.edu.ng" },
    update: {},
    create: {
      name: "John Doe",
      email: "john.doe@student.edu.ng",
      password: studentPassword,
      role: "STUDENT",
    },
  });

  await prisma.student.upsert({
    where: { userId: studentUser.id },
    update: {},
    create: {
      userId: studentUser.id,
      admissionNumber: "SCH/2024/001",
      classLevel: "JSS 3",
      parentPhone: "+2348012345678",
    },
  });

  console.log(`✅ Sample student created: ${studentUser.email}`);
  console.log(`   Password: Student@123`);

  console.log("\n🎉 Seed complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
