import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import StudentProfileForm from "@/components/student/StudentProfileForm";

async function getStudentProfile(userId: string) {
  return prisma.student.findUnique({
    where: { userId },
    include: { user: true },
  });
}

export default async function StudentProfilePage() {
  const session = await getServerSession(authOptions);
  const student = await getStudentProfile(session!.user.id);

  if (!student) {
    return (
      <div className="p-8 text-center text-amber-600">
        Profile not found. Please contact admin.
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800" style={{ fontFamily: "'Playfair Display', serif" }}>
          My Profile
        </h1>
        <p className="text-slate-500 mt-1 text-sm">View and update your personal information</p>
      </div>
      <StudentProfileForm student={student} user={student.user} />
    </div>
  );
}