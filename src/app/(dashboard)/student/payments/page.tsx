import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import { formatCurrency, formatDate } from "@/lib/utils";

async function getStudentPayments(userId: string) {
  const student = await prisma.student.findUnique({
    where: { userId },
    include: {
      payments: {
        include: { feeStructure: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  return student;
}

export default async function StudentPaymentsPage() {
  const session = await getServerSession(authOptions);
  const student = await getStudentPayments(session!.user.id);

  if (!student) {
    return <div className="p-8 text-center text-slate-500">Profile not found</div>;
  }

  const paidTotal = student.payments
    .filter((p) => p.status === "PAID")
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Payment History
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Total paid: {formatCurrency(paidTotal)}
        </p>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Term</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden sm:table-cell">Reference</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden md:table-cell">Date</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {student.payments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                    No payment records yet
                  </td>
                </tr>
              ) : (
                student.payments.map((payment) => (
                  <tr key={payment.id} className="table-row">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">{payment.feeStructure.term}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{payment.feeStructure.session}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{formatCurrency(payment.amount)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={payment.status === "PAID" ? "badge-paid" : payment.status === "PENDING" ? "badge-pending" : "badge-failed"}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 hidden sm:table-cell">
                      <p className="text-xs font-mono text-slate-500 dark:text-slate-400">{payment.reference}</p>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {payment.paidAt ? formatDate(payment.paidAt) : formatDate(payment.createdAt)}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      {payment.status === "PAID" && (
                        <a
                          href={`/api/receipt/${payment.id}`}
                          target="_blank"
                          className="text-brand-600 dark:text-brand-400 hover:underline text-sm font-medium flex items-center gap-1"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          PDF
                        </a>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
