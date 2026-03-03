import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import { formatCurrency, formatDate } from "@/lib/utils";
import PayNowButton from "@/components/student/PayNowButton";

async function getStudentData(userId: string) {
  const student = await prisma.student.findUnique({
    where: { userId },
    include: {
      user: true,
      payments: {
        include: { feeStructure: true },
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
  });

  if (!student) return null;

  // Get latest fee structure
  const latestFee = await prisma.feeStructure.findFirst({
    orderBy: { createdAt: "desc" },
  });

  // Check if student already paid for this fee
  let currentPayment = null;
  if (latestFee) {
    currentPayment = await prisma.payment.findFirst({
      where: { studentId: student.id, feeStructureId: latestFee.id },
    });
  }

  const totalPaid = student.payments
    .filter((p) => p.status === "PAID")
    .reduce((sum, p) => sum + p.amount, 0);

  return { student, latestFee, currentPayment, totalPaid };
}

export default async function StudentDashboard() {
  const session = await getServerSession(authOptions);
  const data = await getStudentData(session!.user.id);

  if (!data || !data.student) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-500">Student profile not found. Please contact admin.</p>
      </div>
    );
  }

  const { student, latestFee, currentPayment, totalPaid } = data;

  const isPaid = currentPayment?.status === "PAID";
  const isPending = currentPayment?.status === "PENDING";

  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
          Hello, {student.user.name.split(" ")[0]} 👋
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          {student.admissionNumber} · {student.classLevel}
        </p>
      </div>

      {/* Current Fee Card */}
      {latestFee ? (
        <div className={`rounded-2xl p-6 mb-6 text-white relative overflow-hidden ${isPaid ? "bg-gradient-to-br from-emerald-600 to-emerald-800" : "bg-gradient-to-br from-brand-600 to-brand-900"}`}>
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-10 translate-x-10" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-6 -translate-x-6" />
          <div className="relative">
            <p className="text-white/70 text-sm font-medium">{latestFee.term} · {latestFee.session}</p>
            <p className="text-4xl font-bold mt-1 mb-4">{formatCurrency(latestFee.amount)}</p>

            {isPaid ? (
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="font-semibold">Payment Confirmed</span>
              </div>
            ) : isPending ? (
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-amber-400/30 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-amber-300" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="font-medium text-amber-300">Payment Pending</span>
              </div>
            ) : (
              <PayNowButton feeStructureId={latestFee.id} />
            )}
          </div>
        </div>
      ) : (
        <div className="card p-6 mb-6 text-center text-slate-500 dark:text-slate-400">
          <p>No fee structure configured yet. Check back later.</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="stat-card">
          <p className="text-sm text-slate-500 dark:text-slate-400">Total Paid</p>
          <p className="text-xl font-bold text-slate-900 dark:text-white">{formatCurrency(totalPaid)}</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-slate-500 dark:text-slate-400">Payments</p>
          <p className="text-xl font-bold text-slate-900 dark:text-white">
            {student.payments.filter(p => p.status === "PAID").length}
          </p>
        </div>
      </div>

      {/* Recent history */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900 dark:text-white">Recent Payments</h2>
        </div>
        <div className="divide-y divide-slate-200 dark:divide-slate-800">
          {student.payments.length === 0 ? (
            <p className="px-6 py-8 text-center text-slate-500 dark:text-slate-400 text-sm">No payments yet</p>
          ) : (
            student.payments.map((payment) => (
              <div key={payment.id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    {payment.feeStructure.term}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {payment.feeStructure.session} · {formatDate(payment.createdAt)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {formatCurrency(payment.amount)}
                  </p>
                  <span className={payment.status === "PAID" ? "badge-paid" : payment.status === "PENDING" ? "badge-pending" : "badge-failed"}>
                    {payment.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
