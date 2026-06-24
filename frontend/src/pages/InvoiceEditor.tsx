import React, { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useInvoice, useCreateInvoice, useUpdateInvoice, type InvoiceItem } from '../features/invoices/api';
import { useCurrency } from '../context/CurrencyContext';
import { useTheme } from '../context/ThemeContext';

const itemSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  quantity: z.number().min(1, 'Qty ≥ 1'),
  price: z.number().min(0.01, 'Price > 0'),
});

const invoiceFormSchema = z.object({
  invoiceNumber: z.string().min(1, 'Invoice number is required'),
  clientName: z.string().min(1, 'Client name is required'),
  clientEmail: z.string().email('Invalid email address'),
  senderName: z.string().optional(),
  senderEmail: z.string().optional(),
  senderPhone: z.string().optional(),
  senderAddress: z.string().optional(),
  clientAddress: z.string().optional(),
  clientPhone: z.string().optional(),
  taxRate: z.number().min(0).max(100).default(0),
  discountRate: z.number().min(0).max(100).default(0),
  shippingCharges: z.number().min(0).default(0),
  notes: z.string().optional(),
  terms: z.string().optional(),
  issueDate: z.string().min(1, 'Issue date is required'),
  dueDate: z.string().min(1, 'Due date is required'),
  status: z.enum(['draft', 'sent', 'paid', 'void']),
  items: z.array(itemSchema).min(1, 'Please add at least one line item'),
});

type InvoiceFormFields = z.infer<typeof invoiceFormSchema>;

export const InvoiceEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  const navigate = useNavigate();
  const { formatAmount } = useCurrency();
  const { primaryColor } = useTheme();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showNotes, setShowNotes] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  const { data: invoiceData, isLoading: isInvoiceLoading } = useInvoice(id);
  const createMutation = useCreateInvoice();
  const updateMutation = useUpdateInvoice();

  const { register, control, handleSubmit, setValue, watch, formState: { errors } } = useForm<InvoiceFormFields>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      invoiceNumber: '', clientName: '', clientEmail: '',
      senderName: '', senderEmail: '', senderPhone: '', senderAddress: '',
      clientAddress: '', clientPhone: '',
      taxRate: 0, discountRate: 0, shippingCharges: 0,
      notes: '', terms: '',
      issueDate: new Date().toISOString().substring(0, 10),
      dueDate: new Date(Date.now() + 30 * 86400000).toISOString().substring(0, 10),
      status: 'draft',
      items: [{ description: '', quantity: 1, price: 0.01 }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const watchedItems = watch('items');

  useEffect(() => {
    if (isEditMode && invoiceData) {
      setValue('invoiceNumber', invoiceData.invoiceNumber);
      setValue('clientName', invoiceData.clientName);
      setValue('clientEmail', invoiceData.clientEmail);
      setValue('senderName', invoiceData.senderName || '');
      setValue('senderEmail', invoiceData.senderEmail || '');
      setValue('senderPhone', invoiceData.senderPhone || '');
      setValue('senderAddress', invoiceData.senderAddress || '');
      setValue('clientAddress', invoiceData.clientAddress || '');
      setValue('clientPhone', invoiceData.clientPhone || '');
      setValue('taxRate', invoiceData.taxRate ?? 0);
      setValue('discountRate', invoiceData.discountRate ?? 0);
      setValue('shippingCharges', (invoiceData.shippingCharges ?? 0) / 100);
      setValue('notes', invoiceData.notes || '');
      setValue('terms', invoiceData.terms || '');
      if (invoiceData.notes) setShowNotes(true);
      if (invoiceData.terms) setShowTerms(true);
      if (invoiceData.issueDate) setValue('issueDate', new Date(invoiceData.issueDate).toISOString().substring(0, 10));
      setValue('dueDate', new Date(invoiceData.dueDate).toISOString().substring(0, 10));
      setValue('status', invoiceData.status);
      setValue('items', invoiceData.items.map(it => ({ description: it.description, quantity: it.quantity, price: it.price / 100 })));
    }
  }, [invoiceData, isEditMode, setValue]);

  const watchedTax = watch('taxRate') ?? 0;
  const watchedDiscount = watch('discountRate') ?? 0;
  const watchedShipping = watch('shippingCharges') ?? 0;

  const subtotalCents = (watchedItems || []).reduce((acc, item) => {
    return acc + (Number(item.quantity) || 0) * Math.round((Number(item.price) || 0) * 100);
  }, 0);
  const discountCents = Math.round(subtotalCents * (Number(watchedDiscount) / 100));
  const taxableCents = subtotalCents - discountCents;
  const taxCents = Math.round(taxableCents * (Number(watchedTax) / 100));
  const shippingCents = Math.round(Number(watchedShipping) * 100);
  const grandTotal = taxableCents + taxCents + shippingCents;

  const onSubmit = async (data: InvoiceFormFields) => {
    setErrorMsg(null);
    const itemsWithCents: InvoiceItem[] = data.items.map(it => ({
      description: it.description, quantity: it.quantity, price: Math.round(it.price * 100),
    }));
    const payload = {
      invoiceNumber: data.invoiceNumber, clientName: data.clientName, clientEmail: data.clientEmail,
      senderName: data.senderName || '', senderEmail: data.senderEmail || '',
      senderPhone: data.senderPhone || '', senderAddress: data.senderAddress || '',
      clientAddress: data.clientAddress || '', clientPhone: data.clientPhone || '',
      taxRate: Number(data.taxRate) || 0, discountRate: Number(data.discountRate) || 0,
      shippingCharges: Math.round((Number(data.shippingCharges) || 0) * 100),
      notes: data.notes || '', terms: data.terms || '',
      issueDate: new Date(data.issueDate).toISOString(), dueDate: new Date(data.dueDate).toISOString(),
      status: data.status, items: itemsWithCents,
    };
    try {
      if (isEditMode && id) await updateMutation.mutateAsync({ id, body: payload });
      else await createMutation.mutateAsync(payload);
      navigate('/dashboard');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error?.message || 'Failed to save invoice.');
    }
  };

  if (isEditMode && isInvoiceLoading) {
    return <div style={S.loadingWrap}><div style={S.spinner} /><span>Loading invoice...</span></div>;
  }

  return (
    <div style={S.outerWrap}>
      {errorMsg && <div className="alert alert-error" style={{ marginBottom: 16 }}>⚠️ {errorMsg}</div>}

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* ─── Invoice Header Card ─── */}
        <div className="card glass-panel" style={S.headerCard}>
          <div style={S.headerTop}>
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 700, color: primaryColor, margin: 0 }}>Invoice</h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: '4px 0 0' }}>
                {isEditMode ? 'Edit invoice details' : 'Create a new professional invoice'}
              </p>
            </div>
            <div style={S.headerMeta}>
              <div className="form-group" style={{ width: 200 }}>
                <label className="form-label">Invoice No.</label>
                <input className={`form-input ${errors.invoiceNumber ? 'is-invalid' : ''}`} placeholder="INV-2026-001" {...register('invoiceNumber')} />
                {errors.invoiceNumber && <span className="error-text">{errors.invoiceNumber.message}</span>}
              </div>
              <div className="form-group" style={{ width: 160 }}>
                <label className="form-label">Issue Date</label>
                <input type="date" className="form-input" {...register('issueDate')} />
              </div>
              <div className="form-group" style={{ width: 160 }}>
                <label className="form-label">Due Date</label>
                <input type="date" className="form-input" {...register('dueDate')} />
              </div>
              <div className="form-group" style={{ width: 130 }}>
                <label className="form-label">Status</label>
                <select className="form-input" style={{ height: 42, cursor: 'pointer' }} {...register('status')}>
                  <option value="draft">Draft</option>
                  <option value="sent">Sent</option>
                  <option value="paid">Paid</option>
                  <option value="void">Void</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Two-Column: Sender & Client Details ─── */}
        <div style={S.twoCol}>
          {/* Your Details */}
          <div className="card glass-panel" style={S.detailCard}>
            <h3 style={S.detailTitle}>
              <span style={{ color: primaryColor }}>⬤</span> Your Details
            </h3>
            <div className="form-group">
              <label className="form-label">Business / Name</label>
              <input className="form-input" placeholder="My Business Name" {...register('senderName')} />
            </div>
            <div style={S.row2}>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Email</label>
                <input className="form-input" placeholder="you@business.com" {...register('senderEmail')} />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Phone</label>
                <input className="form-input" placeholder="+91 9876543210" {...register('senderPhone')} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Address</label>
              <input className="form-input" placeholder="123 Main St, City, State" {...register('senderAddress')} />
            </div>
          </div>

          {/* Client Details */}
          <div className="card glass-panel" style={S.detailCard}>
            <h3 style={S.detailTitle}>
              <span style={{ color: '#3b82f6' }}>⬤</span> Client Details
            </h3>
            <div className="form-group">
              <label className="form-label">Client Name *</label>
              <input className={`form-input ${errors.clientName ? 'is-invalid' : ''}`} placeholder="Client Company" {...register('clientName')} />
              {errors.clientName && <span className="error-text">{errors.clientName.message}</span>}
            </div>
            <div style={S.row2}>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Email *</label>
                <input className={`form-input ${errors.clientEmail ? 'is-invalid' : ''}`} placeholder="client@company.com" {...register('clientEmail')} />
                {errors.clientEmail && <span className="error-text">{errors.clientEmail.message}</span>}
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Phone</label>
                <input className="form-input" placeholder="+91 9876543210" {...register('clientPhone')} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Address</label>
              <input className="form-input" placeholder="456 Client Ave, City, State" {...register('clientAddress')} />
            </div>
          </div>
        </div>

        {/* ─── Items Table ─── */}
        <div className="card glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={S.itemsHeader}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>Items</h3>
            <button type="button" className="btn btn-secondary" style={{ padding: '6px 14px', fontSize: 12 }}
              onClick={() => append({ description: '', quantity: 1, price: 0.01 })}>
              ＋ Add Row
            </button>
          </div>
          {errors.items && <span className="error-text" style={{ display: 'block', padding: '0 24px 8px' }}>{errors.items.message}</span>}

          <div style={{ overflowX: 'auto' }}>
            <table style={S.table}>
              <thead>
                <tr style={S.tableHeaderRow}>
                  <th style={{ ...S.th, width: 40 }}>#</th>
                  <th style={{ ...S.th, textAlign: 'left' as const }}>Description</th>
                  <th style={{ ...S.th, width: 90 }}>Qty</th>
                  <th style={{ ...S.th, width: 120 }}>Unit Price</th>
                  <th style={{ ...S.th, width: 120 }}>Amount</th>
                  <th style={{ ...S.th, width: 50 }}></th>
                </tr>
              </thead>
              <tbody>
                {fields.map((field, index) => {
                  const q = Number(watchedItems?.[index]?.quantity) || 0;
                  const p = Number(watchedItems?.[index]?.price) || 0;
                  const lineTotal = q * Math.round(p * 100);
                  return (
                    <tr key={field.id} style={S.tableRow}>
                      <td style={S.td}>{index + 1}</td>
                      <td style={S.td}>
                        <input className={`form-input ${errors.items?.[index]?.description ? 'is-invalid' : ''}`}
                          placeholder="Item description" {...register(`items.${index}.description` as const)} style={{ width: '100%' }} />
                      </td>
                      <td style={S.td}>
                        <input type="number" className="form-input" placeholder="1" style={{ textAlign: 'center' }}
                          {...register(`items.${index}.quantity` as const, { valueAsNumber: true })} />
                      </td>
                      <td style={S.td}>
                        <input type="number" step="0.01" className="form-input" placeholder="0.00"
                          {...register(`items.${index}.price` as const, { valueAsNumber: true })} />
                      </td>
                      <td style={{ ...S.td, fontWeight: 600, textAlign: 'right' as const, color: 'var(--text-primary)' }}>
                        {formatAmount(lineTotal)}
                      </td>
                      <td style={S.td}>
                        {fields.length > 1 && (
                          <button type="button" onClick={() => remove(index)} style={S.removeBtn} title="Remove">✕</button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ─── Pricing Summary ─── */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
          <div className="card glass-panel" style={{ padding: 24, minWidth: 360, maxWidth: 420 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>Price Summary</h3>
            <div style={S.summaryRow}>
              <span>Subtotal</span><span style={{ fontWeight: 600 }}>{formatAmount(subtotalCents)}</span>
            </div>
            <div style={S.summaryRow}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>Discount</span>
                <input type="number" min="0" max="100" step="1" className="form-input" style={S.miniInput}
                  {...register('discountRate', { valueAsNumber: true })} /><span style={{ fontSize: 12 }}>%</span>
              </div>
              <span style={{ fontWeight: 600, color: '#ef4444' }}>-{formatAmount(discountCents)}</span>
            </div>
            <div style={S.summaryRow}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>Tax / GST</span>
                <input type="number" min="0" max="100" step="1" className="form-input" style={S.miniInput}
                  {...register('taxRate', { valueAsNumber: true })} /><span style={{ fontSize: 12 }}>%</span>
              </div>
              <span style={{ fontWeight: 600, color: '#22c55e' }}>+{formatAmount(taxCents)}</span>
            </div>
            <div style={S.summaryRow}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>Shipping</span>
                <input type="number" min="0" step="0.01" className="form-input" style={{ ...S.miniInput, width: 80 }}
                  {...register('shippingCharges', { valueAsNumber: true })} />
              </div>
              <span style={{ fontWeight: 600 }}>+{formatAmount(shippingCents)}</span>
            </div>
            <div style={S.totalRow}>
              <span style={{ fontSize: 18, fontWeight: 700 }}>Total</span>
              <span style={{ fontSize: 24, fontWeight: 800, color: primaryColor }}>{formatAmount(grandTotal)}</span>
            </div>
          </div>
        </div>

        {/* ─── Notes & Terms (toggle buttons like Refrens) ─── */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 20 }}>
          <button type="button" className="btn btn-secondary" style={{ fontSize: 13 }}
            onClick={() => setShowNotes(v => !v)}>
            {showNotes ? '✓' : '＋'} Notes / Payment Info
          </button>
          <button type="button" className="btn btn-secondary" style={{ fontSize: 13 }}
            onClick={() => setShowTerms(v => !v)}>
            {showTerms ? '✓' : '＋'} Terms & Conditions
          </button>
        </div>

        {(showNotes || showTerms) && (
          <div className="card glass-panel" style={{ marginTop: 12, padding: 24 }}>
            {showNotes && (
              <div className="form-group">
                <label className="form-label">Notes / Payment Instructions</label>
                <textarea className="form-input" rows={3} placeholder="e.g. Bank details, UPI ID, payment link..." {...register('notes')} />
              </div>
            )}
            {showTerms && (
              <div className="form-group" style={{ marginTop: showNotes ? 16 : 0 }}>
                <label className="form-label">Terms & Conditions</label>
                <textarea className="form-input" rows={3} placeholder="e.g. Late fees, refund policy..." {...register('terms')} />
              </div>
            )}
          </div>
        )}

        {/* ─── Action Buttons ─── */}
        <div style={S.actions}>
          <Link to="/dashboard" className="btn btn-secondary" style={{ padding: '12px 28px', textDecoration: 'none' }}>Cancel</Link>
          <button type="submit" className="btn btn-primary" style={{ padding: '12px 40px', fontSize: 15, fontWeight: 600 }}
            disabled={createMutation.isPending || updateMutation.isPending}>
            {createMutation.isPending || updateMutation.isPending ? 'Saving...' : '💾  Save & Preview'}
          </button>
        </div>
      </form>
    </div>
  );
};

const S: Record<string, React.CSSProperties> = {
  outerWrap: { width: '100%', maxWidth: 960, margin: '0 auto' },
  loadingWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px', gap: 16 },
  spinner: { width: 32, height: 32, borderRadius: '50%', border: '2px solid var(--border)', borderTopColor: 'var(--primary)', animation: 'spin 1s linear infinite' },
  headerCard: { padding: '24px 30px', marginBottom: 20 },
  headerTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 20 },
  headerMeta: { display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' },
  twoCol: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20, marginBottom: 20 },
  detailCard: { padding: 24, display: 'flex', flexDirection: 'column', gap: 14 },
  detailTitle: { fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 },
  row2: { display: 'flex', gap: 12 },
  itemsHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid var(--border)' },
  table: { width: '100%', borderCollapse: 'collapse' as const },
  tableHeaderRow: { background: 'var(--glass-bg)' },
  th: { padding: '10px 14px', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' as const, letterSpacing: '0.05em', textAlign: 'center' as const },
  tableRow: { borderBottom: '1px solid var(--border)' },
  td: { padding: '10px 14px', verticalAlign: 'middle' as const },
  removeBtn: { background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', fontSize: 16, fontWeight: 'bold', padding: 6 },
  summaryRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', fontSize: 14, color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)' },
  miniInput: { padding: '4px 6px', height: 30, width: 60, fontSize: 13, textAlign: 'center' as const },
  totalRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, marginTop: 8 },
  actions: { display: 'flex', justifyContent: 'flex-end', gap: 16, marginTop: 24, paddingBottom: 40 },
};

export default InvoiceEditor;
