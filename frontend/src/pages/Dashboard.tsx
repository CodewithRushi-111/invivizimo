import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useInvoices, useDeleteInvoice, useDeletedInvoices, useRestoreInvoice, usePermanentDeleteInvoice, type Invoice } from '../features/invoices/api';
import { useCurrency } from '../context/CurrencyContext';

export const Dashboard: React.FC = () => {
  const { formatAmount } = useCurrency();

  // Search & Filter State
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'draft' | 'sent' | 'paid' | 'void'>('all');
  const [page, setPage] = useState(1);
  const limit = 10;

  // Fetch Invoices
  const { data: responseData, isLoading, isError, refetch } = useInvoices({
    page,
    limit,
    status: activeTab === 'all' ? undefined : activeTab,
  });

  // Trash State
  const [showTrash, setShowTrash] = useState(false);
  const [trashPage] = useState(1);
  const { data: trashData, isLoading: trashLoading } = useDeletedInvoices({ page: trashPage, limit: 10 });

  // Mutations
  const deleteMutation = useDeleteInvoice();
  const restoreMutation = useRestoreInvoice();
  const permanentDeleteMutation = usePermanentDeleteInvoice();

  const handleDelete = async (id: string) => {
    if (window.confirm('Move this invoice to Trash?')) {
      try { await deleteMutation.mutateAsync(id); } catch (err) { console.error(err); }
    }
  };
  const handleRestore = async (id: string) => {
    try { await restoreMutation.mutateAsync(id); } catch (err: any) { alert(err.response?.data?.error?.message || 'Restore failed'); }
  };
  const handlePermanentDelete = async (id: string) => {
    if (window.confirm('Permanently delete this invoice? This cannot be undone.')) {
      try { await permanentDeleteMutation.mutateAsync(id); } catch (err) { console.error(err); }
    }
  };

  // Filter items locally based on search string
  const invoices = responseData?.data || [];
  const filteredInvoices = invoices.filter((inv) => {
    const numMatch = inv.invoiceNumber.toLowerCase().includes(search.toLowerCase());
    const clientMatch = inv.clientName.toLowerCase().includes(search.toLowerCase());
    return numMatch || clientMatch;
  });

  // Calculate Metrics based on all visible items
  const stats = {
    total: 0,
    paid: 0,
    sent: 0,
    draft: 0,
  };

  invoices.forEach((inv) => {
    stats.total += inv.totalAmount;
    if (inv.status === 'paid') stats.paid += inv.totalAmount;
    else if (inv.status === 'sent') stats.sent += inv.totalAmount;
    else if (inv.status === 'draft') stats.draft += inv.totalAmount;
  });

  const getStatusBadgeClass = (status: Invoice['status']) => {
    switch (status) {
      case 'paid':
        return 'bg-secondary/15 text-secondary border-secondary/35';
      case 'sent':
        return 'bg-primary/15 text-primary border-primary/35';
      case 'draft':
        return 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-500 border-yellow-500/35';
      case 'void':
        return 'bg-error/15 text-error border-error/35';
      default:
        return 'bg-surface-container-high text-text-muted border-border-muted';
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Bento Metrics Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Total Receivables */}
        <div className="bg-surface-container-lowest border border-border-muted p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full translate-x-8 -translate-y-8 group-hover:scale-110 transition-transform duration-300" />
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Total Receivables</span>
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
            </div>
          </div>
          <span className="text-2xl md:text-3xl font-extrabold text-on-surface tracking-tight font-mono">
            {formatAmount(stats.total)}
          </span>
        </div>

        {/* Card 2: Paid Invoices */}
        <div className="bg-surface-container-lowest border border-border-muted p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-secondary/5 rounded-full translate-x-8 -translate-y-8 group-hover:scale-110 transition-transform duration-300" />
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Paid Invoices</span>
            <div className="w-9 h-9 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
            </div>
          </div>
          <span className="text-2xl md:text-3xl font-extrabold text-secondary tracking-tight font-mono">
            {formatAmount(stats.paid)}
          </span>
        </div>

        {/* Card 3: Sent/Pending */}
        <div className="bg-surface-container-lowest border border-border-muted p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full translate-x-8 -translate-y-8 group-hover:scale-110 transition-transform duration-300" />
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Sent / Pending</span>
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">send</span>
            </div>
          </div>
          <span className="text-2xl md:text-3xl font-extrabold text-primary tracking-tight font-mono">
            {formatAmount(stats.sent)}
          </span>
        </div>

        {/* Card 4: Draft Value */}
        <div className="bg-surface-container-lowest border border-border-muted p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-500/5 rounded-full translate-x-8 -translate-y-8 group-hover:scale-110 transition-transform duration-300" />
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Draft Value</span>
            <div className="w-9 h-9 rounded-xl bg-yellow-500/10 text-yellow-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">draft</span>
            </div>
          </div>
          <span className="text-2xl md:text-3xl font-extrabold text-yellow-600 dark:text-yellow-500 tracking-tight font-mono">
            {formatAmount(stats.draft)}
          </span>
        </div>
      </section>

      {/* Filter and Search Action Panel */}
      <div className="bg-surface-container-lowest border border-border-muted p-5 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted material-symbols-outlined text-[20px]">
            search
          </span>
          <input
            type="text"
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border-muted bg-surface focus:ring-4 focus:ring-primary-container/15 focus:border-primary-container outline-none transition-all text-sm"
            placeholder="Search by invoice # or client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Filters Tabs */}
        <div className="flex flex-wrap gap-1 bg-surface-container p-1 rounded-xl border border-border-muted self-start md:self-auto">
          {(['all', 'draft', 'sent', 'paid', 'void'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setPage(1);
              }}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === tab
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'
              }`}
            >
              {tab.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Invoices List Card */}
      <div className="bg-surface-container-lowest border border-border-muted rounded-2xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-10 h-10 border-4 border-border-muted border-t-primary rounded-full animate-spin" />
            <span className="text-sm font-medium text-text-muted">Fetching invoices...</span>
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4 text-error">
            <span className="material-symbols-outlined text-[48px]">error</span>
            <span className="text-sm font-medium">Failed to load invoices.</span>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-surface border border-border-muted hover:bg-surface-container-high text-on-surface font-semibold rounded-lg text-xs transition-colors"
            >
              Retry
            </button>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[32px]">drafts</span>
            </div>
            <h3 className="text-lg font-bold text-on-surface">No Invoices Found</h3>
            <p className="text-sm text-text-muted max-w-sm">Get started by creating your first client invoice layout.</p>
            <Link
              to="/invoices/new"
              className="mt-2 px-5 py-2.5 bg-primary-container hover:bg-primary text-on-primary font-semibold rounded-lg text-sm transition-colors shadow-sm"
            >
              Create Invoice
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container border-b border-border-muted text-xs font-bold text-text-muted uppercase tracking-wider">
                  <th className="px-6 py-4">Invoice #</th>
                  <th className="px-6 py-4">Client</th>
                  <th className="px-6 py-4">Issue Date</th>
                  <th className="px-6 py-4">Due Date</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-muted">
                {filteredInvoices.map((inv) => (
                  <tr key={inv._id} className="hover:bg-surface-container-low/50 transition-colors">
                    <td className="px-6 py-4.5 font-mono text-sm font-semibold text-on-surface">
                      {inv.invoiceNumber}
                    </td>
                    <td className="px-6 py-4.5">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-on-surface">{inv.clientName}</span>
                        <span className="text-xs text-text-muted">{inv.clientEmail}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4.5 text-sm text-on-surface-variant">
                      {new Date(inv.issueDate || inv.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4.5 text-sm text-on-surface-variant">
                      {new Date(inv.dueDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4.5 font-mono text-sm font-bold text-on-surface">
                      {formatAmount(inv.totalAmount)}
                    </td>
                    <td className="px-6 py-4.5">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusBadgeClass(inv.status)}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-6 py-4.5 text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          to={`/invoices/${inv._id}`}
                          className="p-1.5 hover:bg-primary/10 text-primary hover:text-primary rounded-lg transition-colors"
                          title="Edit"
                        >
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </Link>
                        <button
                          onClick={() => handleDelete(inv._id)}
                          className="p-1.5 hover:bg-error/10 text-error hover:text-error rounded-lg transition-colors"
                          title="Delete"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {responseData && responseData.pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page === 1}
            className="px-4 py-2 bg-surface-container-lowest border border-border-muted text-on-surface hover:bg-surface-container-low font-semibold rounded-lg text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            Previous
          </button>
          <span className="text-xs font-medium text-text-muted">
            Page {page} of {responseData.pagination.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(p + 1, responseData.pagination.totalPages))}
            disabled={page === responseData.pagination.totalPages}
            className="px-4 py-2 bg-surface-container-lowest border border-border-muted text-on-surface hover:bg-surface-container-low font-semibold rounded-lg text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            Next
          </button>
        </div>
      )}

      {/* Trash Collapsible Card */}
      <div className="bg-surface-container-lowest border border-border-muted rounded-2xl shadow-sm overflow-hidden">
        <button
          onClick={() => setShowTrash((v) => !v)}
          className="w-full flex items-center justify-between px-6 py-4.5 hover:bg-surface-container-low/30 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-text-muted text-[20px]">delete</span>
            <h3 className="text-sm font-bold text-on-surface">
              Trash bin ({trashData?.pagination?.total ?? 0})
            </h3>
          </div>
          <span className="material-symbols-outlined text-text-muted transition-transform duration-200">
            {showTrash ? 'expand_less' : 'expand_more'}
          </span>
        </button>

        {showTrash && (
          <div className="border-t border-border-muted">
            {trashLoading ? (
              <div className="flex items-center justify-center py-10 gap-3">
                <div className="w-5 h-5 border-2 border-border-muted border-t-primary rounded-full animate-spin" />
                <span className="text-xs text-text-muted font-medium">Loading trash...</span>
              </div>
            ) : !trashData?.data?.length ? (
              <p className="text-center text-xs text-text-muted py-8 font-medium">Trash is empty</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-container border-b border-border-muted text-[11px] font-bold text-text-muted uppercase tracking-wider">
                      <th className="px-6 py-3">Invoice #</th>
                      <th className="px-6 py-3">Client</th>
                      <th className="px-6 py-3">Amount</th>
                      <th className="px-6 py-3">Deleted On</th>
                      <th className="px-6 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-muted">
                    {trashData.data.map((inv) => (
                      <tr key={inv._id} className="hover:bg-surface-container-low/20 transition-colors opacity-70">
                        <td className="px-6 py-3.5 font-mono text-xs font-semibold text-on-surface">
                          {inv.invoiceNumber}
                        </td>
                        <td className="px-6 py-3.5 text-xs text-on-surface font-medium">
                          {inv.clientName}
                        </td>
                        <td className="px-6 py-3.5 font-mono text-xs font-bold text-on-surface">
                          {formatAmount(inv.totalAmount)}
                        </td>
                        <td className="px-6 py-3.5 text-xs text-on-surface-variant">
                          {inv.updatedAt ? new Date(inv.updatedAt).toLocaleDateString() : '—'}
                        </td>
                        <td className="px-6 py-3.5 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleRestore(inv._id)}
                              className="p-1.5 hover:bg-secondary/15 text-secondary hover:text-secondary rounded-lg transition-colors"
                              title="Restore"
                            >
                              <span className="material-symbols-outlined text-[16px]">restore</span>
                            </button>
                            <button
                              onClick={() => handlePermanentDelete(inv._id)}
                              className="p-1.5 hover:bg-error/15 text-error hover:text-error rounded-lg transition-colors"
                              title="Delete permanently"
                            >
                              <span className="material-symbols-outlined text-[16px]">delete_forever</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
