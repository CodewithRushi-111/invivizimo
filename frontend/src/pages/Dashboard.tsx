import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useInvoices, useDeleteInvoice, useDeletedInvoices, useRestoreInvoice, usePermanentDeleteInvoice, type Invoice } from '../features/invoices/api';
import { useCurrency } from '../context/CurrencyContext';
import { useTheme } from '../context/ThemeContext';

export const Dashboard: React.FC = () => {
  const { formatAmount } = useCurrency();
  const { primaryColor } = useTheme();

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
  const [trashPage, setTrashPage] = useState(1);
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

  const getStatusBadgeColor = (status: Invoice['status']) => {
    switch (status) {
      case 'paid':
        return { color: '#22c55e', backgroundColor: 'rgba(34, 197, 94, 0.1)' };
      case 'sent':
        return { color: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.1)' };
      case 'draft':
        return { color: '#ca8a04', backgroundColor: 'rgba(234, 179, 8, 0.1)' };
      case 'void':
        return { color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)' };
    }
  };

  return (
    <div style={styles.container}>
      {/* Stat Cards */}
      <section style={styles.metricsGrid}>
        <div className="card glass-panel" style={styles.statCard}>
          <span style={styles.statTitle}>Total Receivables</span>
          <span style={styles.statValue}>{formatAmount(stats.total)}</span>
        </div>
        <div className="card glass-panel" style={styles.statCard}>
          <span style={styles.statTitle}>Paid Invoices</span>
          <span style={{ ...styles.statValue, color: '#22c55e' }}>{formatAmount(stats.paid)}</span>
        </div>
        <div className="card glass-panel" style={styles.statCard}>
          <span style={styles.statTitle}>Sent/Pending</span>
          <span style={{ ...styles.statValue, color: '#3b82f6' }}>{formatAmount(stats.sent)}</span>
        </div>
        <div className="card glass-panel" style={styles.statCard}>
          <span style={styles.statTitle}>Draft Value</span>
          <span style={{ ...styles.statValue, color: '#ca8a04' }}>{formatAmount(stats.draft)}</span>
        </div>
      </section>

      {/* Filter Options Panel */}
      <div className="card glass-panel" style={styles.filtersBox}>
        <div style={styles.filtersLeft}>
          <input
            type="text"
            className="form-input"
            placeholder="Search by invoice number or client name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={styles.searchInput}
          />
        </div>
        <div style={styles.filtersRight}>
          {(['all', 'draft', 'sent', 'paid', 'void'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setPage(1);
              }}
              style={{
                ...styles.tabBtn,
                ...(activeTab === tab
                  ? { backgroundColor: primaryColor, color: '#fff', borderColor: primaryColor }
                  : {}),
              }}
            >
              {tab.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Table / List Container */}
      <div className="card glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
        {isLoading ? (
          <div style={styles.loadingContainer}>
            <div style={styles.spinner} />
            <span>Fetching invoices...</span>
          </div>
        ) : isError ? (
          <div style={styles.errorContainer}>
            <span>❌ Failed to load invoices.</span>
            <button onClick={() => refetch()} className="btn btn-secondary" style={{ marginTop: '8px' }}>
              Retry
            </button>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div style={styles.emptyContainer}>
            <span style={{ fontSize: '32px' }}>📭</span>
            <h3>No Invoices Found</h3>
            <p>Get started by creating your first client invoice layout.</p>
            <Link to="/invoices/new" className="btn btn-primary" style={{ marginTop: '12px' }}>
              Create Invoice
            </Link>
          </div>
        ) : (
          <div style={styles.tableResponsive}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.trHeader}>
                  <th style={styles.th}>Invoice #</th>
                  <th style={styles.th}>Client</th>
                  <th style={styles.th}>Issue Date</th>
                  <th style={styles.th}>Due Date</th>
                  <th style={styles.th}>Amount</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.thRight}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((inv) => (
                  <tr key={inv._id} style={styles.trRow}>
                    <td style={styles.td}>
                      <strong>{inv.invoiceNumber}</strong>
                    </td>
                    <td style={styles.td}>
                      <div style={styles.clientCell}>
                        <span style={styles.clientNameText}>{inv.clientName}</span>
                        <span style={styles.clientEmailText}>{inv.clientEmail}</span>
                      </div>
                    </td>
                    <td style={styles.td}>
                      {new Date(inv.issueDate || inv.createdAt).toLocaleDateString()}
                    </td>
                    <td style={styles.td}>{new Date(inv.dueDate).toLocaleDateString()}</td>
                    <td style={styles.td}>
                      <span style={styles.amountText}>{formatAmount(inv.totalAmount)}</span>
                    </td>
                    <td style={styles.td}>
                      <span className="status-badge" style={getStatusBadgeColor(inv.status)}>
                        {inv.status}
                      </span>
                    </td>
                    <td style={styles.tdRight}>
                      <div style={styles.actionRow}>
                        <Link to={`/invoices/${inv._id}`} className="btn btn-secondary" style={styles.actionBtn}>
                          ✏️ Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(inv._id)}
                          className="btn btn-secondary"
                          style={{ ...styles.actionBtn, color: 'var(--error)' }}
                        >
                          🗑️ Delete
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
        <div style={styles.paginationRow}>
          <button
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page === 1}
            className="btn btn-secondary"
          >
            Previous
          </button>
          <span style={styles.pageLabel}>
            Page {page} of {responseData.pagination.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(p + 1, responseData.pagination.totalPages))}
            disabled={page === responseData.pagination.totalPages}
            className="btn btn-secondary"
          >
            Next
          </button>
        </div>
      )}

      {/* ─── Trash Section ─── */}
      <div className="card glass-panel" style={{ padding: '20px 24px', border: '1px solid var(--glass-border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
          onClick={() => setShowTrash(v => !v)}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: 'var(--text-secondary)' }}>
            🗑️ Trash ({trashData?.pagination?.total ?? 0})
          </h3>
          <span style={{ fontSize: 20, color: 'var(--text-secondary)' }}>{showTrash ? '▲' : '▼'}</span>
        </div>

        {showTrash && (
          <div style={{ marginTop: 16 }}>
            {trashLoading ? (
              <div style={styles.loadingContainer}><div style={styles.spinner} /><span>Loading trash...</span></div>
            ) : !trashData?.data?.length ? (
              <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '24px 0' }}>Trash is empty</p>
            ) : (
              <div style={styles.tableResponsive}>
                <table style={styles.table}>
                  <thead>
                    <tr style={styles.trHeader}>
                      <th style={styles.th}>Invoice #</th>
                      <th style={styles.th}>Client</th>
                      <th style={styles.th}>Amount</th>
                      <th style={styles.th}>Deleted On</th>
                      <th style={styles.thRight}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trashData.data.map((inv) => (
                      <tr key={inv._id} style={{ ...styles.trRow, opacity: 0.7 }}>
                        <td style={styles.td}><strong>{inv.invoiceNumber}</strong></td>
                        <td style={styles.td}>{inv.clientName}</td>
                        <td style={styles.td}><span style={styles.amountText}>{formatAmount(inv.totalAmount)}</span></td>
                        <td style={styles.td}>{inv.updatedAt ? new Date(inv.updatedAt).toLocaleDateString() : '—'}</td>
                        <td style={styles.tdRight}>
                          <div style={styles.actionRow}>
                            <button onClick={() => handleRestore(inv._id)} className="btn btn-secondary"
                              style={{ ...styles.actionBtn, color: '#22c55e' }}>♻️ Restore</button>
                            <button onClick={() => handlePermanentDelete(inv._id)} className="btn btn-secondary"
                              style={{ ...styles.actionBtn, color: 'var(--error)' }}>🗑️ Delete Forever</button>
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

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '30px',
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '24px',
  },
  statCard: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
    padding: '24px',
    border: '1px solid var(--glass-border)',
  },
  statTitle: {
    fontSize: '13px',
    fontWeight: '500',
    color: 'var(--text-secondary)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  statValue: {
    fontSize: '28px',
    fontWeight: '700',
    color: 'var(--text-primary)',
    letterSpacing: '-0.02em',
  },
  filtersBox: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '20px',
    flexWrap: 'wrap' as const,
    padding: '20px 24px',
    border: '1px solid var(--glass-border)',
  },
  filtersLeft: {
    flex: 1,
    minWidth: '280px',
  },
  searchInput: {
    width: '100%',
  },
  filtersRight: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap' as const,
  },
  tabBtn: {
    padding: '8px 16px',
    fontSize: '12px',
    fontWeight: '600',
    backgroundColor: 'transparent',
    border: '1px solid var(--border)',
    color: 'var(--text-secondary)',
    borderRadius: 'var(--radius-md)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 24px',
    gap: '16px',
  },
  spinner: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    border: '2px solid var(--border)',
    borderTopColor: 'var(--primary)',
    animation: 'spin 1s linear infinite',
  },
  errorContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    padding: '40px 24px',
    color: 'var(--error)',
  },
  emptyContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '80px 24px',
    textAlign: 'center' as const,
    gap: '8px',
  },
  tableResponsive: {
    width: '100%',
    overflowX: 'auto' as const,
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    textAlign: 'left' as const,
  },
  trHeader: {
    borderBottom: '1px solid var(--border)',
    backgroundColor: 'var(--glass-bg)',
  },
  trRow: {
    borderBottom: '1px solid var(--border)',
    transition: 'background-color 0.2s ease',
  },
  th: {
    padding: '16px 24px',
    fontSize: '13px',
    fontWeight: '600',
    color: 'var(--text-secondary)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  thRight: {
    padding: '16px 24px',
    fontSize: '13px',
    fontWeight: '600',
    color: 'var(--text-secondary)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    textAlign: 'right' as const,
  },
  td: {
    padding: '20px 24px',
    fontSize: '14px',
    verticalAlign: 'middle',
  },
  tdRight: {
    padding: '20px 24px',
    fontSize: '14px',
    verticalAlign: 'middle',
    textAlign: 'right' as const,
  },
  clientCell: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '2px',
  },
  clientNameText: {
    fontWeight: '500',
    color: 'var(--text-primary)',
  },
  clientEmailText: {
    fontSize: '12px',
    color: 'var(--text-secondary)',
  },
  amountText: {
    fontWeight: '600',
    color: 'var(--text-primary)',
  },
  actionRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '8px',
  },
  actionBtn: {
    padding: '6px 12px',
    fontSize: '12px',
  },
  paginationRow: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '20px',
    marginTop: '20px',
  },
  pageLabel: {
    fontSize: '14px',
    fontWeight: '500',
    color: 'var(--text-secondary)',
  },
};
export default Dashboard;
