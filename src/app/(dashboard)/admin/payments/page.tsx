import prisma from "@/lib/db";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";

async function getPayments(page = 1, status = "", classLevel = "") {
  const limit = 25;
  const skip = (page - 1) * limit;

  const where: any = {};
  if (status) where.status = status;
  if (classLevel) where.student = { classLevel };

  const [payments, total, totalRevenue] = await Promise.all([
    prisma.payment.findMany({
      where,
      include: {
        student: { include: { user: true } },
        feeStructure: true,
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.payment.count({ where }),
    prisma.payment.aggregate({
      where: { ...where, status: "PAID" },
      _sum: { amount: true },
    }),
  ]);

  return { payments, total, pages: Math.ceil(total / limit), totalRevenue: totalRevenue._sum.amount || 0 };
}

async function getClassLevels() {
  const students = await prisma.student.findMany({ select: { classLevel: true }, distinct: ["classLevel"] });
  return students.map(s => s.classLevel).sort();
}

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: { page?: string; status?: string; class?: string };
}) {
  const page = parseInt(searchParams.page || "1");
  const status = searchParams.status || "";
  const classLevel = searchParams.class || "";

  const [{ payments, total, pages, totalRevenue }, classLevels] = await Promise.all([
    getPayments(page, status, classLevel),
    getClassLevels(),
  ]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-fade-in">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Payments</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            {total} records · {formatCurrency(totalRevenue)} collected
          </p>
        </div>
        <Link href="/api/export?type=payments" className="btn-secondary flex items-center gap-2 text-sm">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export CSV
        </Link>
      </div>

      {/* Filters */}
      <form className="mb-6 flex flex-wrap gap-3">
        <select name="status" defaultValue={status} className="input-field w-auto text-sm">
          <option value="">All Statuses</option>
          <option value="PAID">Paid</option>
          <option value="PENDING">Pending</option>
          <option value="FAILED">Failed</option>
        </select>
        <select name="class" defaultValue={classLevel} className="input-field w-auto text-sm">
          <option value="">All Classes</option>
          {classLevels.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <button type="submit" className="btn-primary text-sm py-2 px-4">Filter</button>
        {(status || classLevel) && (
          <Link href="/admin/payments" className="btn-secondary text-sm py-2 px-4">Clear</Link>
        )}
      </form>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Student</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden sm:table-cell">Term</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden lg:table-cell">Reference</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden md:table-cell">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                    No payments found
                  </td>
                </tr>
              ) : (
                payments.map((payment) => (
                  <tr key={payment.id} className="table-row">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">{payment.student.user.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{payment.student.admissionNumber} · {payment.student.classLevel}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden sm:table-cell">
                      <div>
                        <p className="text-sm text-slate-700 dark:text-slate-300">{payment.feeStructure.term}</p>
                        <p className="text-xs text-slate-400">{payment.feeStructure.session}</p>
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
                    <td className="px-6 py-4 hidden lg:table-cell">
                      <p className="text-xs font-mono text-slate-500 dark:text-slate-400">{payment.reference}</p>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {payment.paidAt ? formatDate(payment.paidAt) : formatDate(payment.createdAt)}
                      </p>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pages > 1 && (
          <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <p className="text-sm text-slate-500 dark:text-slate-400">Page {page} of {pages}</p>
            <div className="flex gap-2">
              {page > 1 && (
                <Link href={`?page=${page - 1}&status=${status}&class=${classLevel}`} className="btn-secondary text-sm py-1.5 px-3">Previous</Link>
              )}
              {page < pages && (
                <Link href={`?page=${page + 1}&status=${status}&class=${classLevel}`} className="btn-primary text-sm py-1.5 px-3">Next</Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
