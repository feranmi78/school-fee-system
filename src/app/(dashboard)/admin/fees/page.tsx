import prisma from "@/lib/db";
import { formatCurrency, formatDate } from "@/lib/utils";
import CreateFeeModal from "@/components/admin/CreateFeeModal";

async function getFeeStructures() {
  return prisma.feeStructure.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { payments: true } },
    },
  });
}

export default async function FeesPage() {
  const fees = await getFeeStructures();

  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-fade-in">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Fee Structures
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Manage term-based fee configurations
          </p>
        </div>
        <CreateFeeModal />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {fees.length === 0 ? (
          <div className="col-span-full card p-12 text-center text-slate-500 dark:text-slate-400">
            <svg className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <p className="font-medium mb-1">No fee structures yet</p>
            <p className="text-sm">Create your first term fee structure to get started</p>
          </div>
        ) : (
          fees.map((fee) => (
            <div key={fee.id} className="card p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center">
                  <svg className="w-5 h-5 text-brand-600 dark:text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="badge-paid">{fee._count.payments} payments</span>
              </div>

              <h3 className="font-bold text-slate-900 dark:text-white text-lg">
                {fee.term}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
                Session: {fee.session}
              </p>
              <p className="text-3xl font-bold text-brand-600 dark:text-brand-400 mb-4">
                {formatCurrency(fee.amount)}
              </p>

              <p className="text-xs text-slate-400">
                Created {formatDate(fee.createdAt)}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
