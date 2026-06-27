import React, { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useParams, Link } from 'react-router-dom';
import { useInvoice, useCreateInvoice, useUpdateInvoice, type InvoiceItem, type Invoice } from '../features/invoices/api';
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
  const { formatAmount } = useCurrency();
  const { primaryColor } = useTheme();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showNotes, setShowNotes] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  const [savedInvoice, setSavedInvoice] = useState<Invoice | null>(null);
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');

  const { data: invoiceData, isLoading: isInvoiceLoading } = useInvoice(id);
  const createMutation = useCreateInvoice();
  const updateMutation = useUpdateInvoice();

  const { register, control, handleSubmit, setValue, watch, formState: { errors } } = useForm<InvoiceFormFields>({
    resolver: zodResolver(invoiceFormSchema) as any,
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
      let savedResult: Invoice;
      if (isEditMode && id) {
        savedResult = await updateMutation.mutateAsync({ id, body: payload });
      } else {
        savedResult = await createMutation.mutateAsync(payload);
      }
      setSavedInvoice(savedResult);
      setViewMode('preview');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error?.message || 'Failed to save invoice.');
    }
  };

  if (isEditMode && isInvoiceLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-10 h-10 border-4 border-border-muted border-t-primary rounded-full animate-spin" />
        <span className="text-sm font-medium text-text-muted">Loading invoice...</span>
      </div>
    );
  }

  const invoiceToPreview = savedInvoice || invoiceData;

  if (viewMode === 'preview' && invoiceToPreview) {
    const previewSubtotal = invoiceToPreview.items.reduce((acc: number, item: InvoiceItem) => acc + item.quantity * item.price, 0);
    const previewDiscount = Math.round(previewSubtotal * ((invoiceToPreview.discountRate || 0) / 100));
    const previewTaxable = previewSubtotal - previewDiscount;
    const previewTax = Math.round(previewTaxable * ((invoiceToPreview.taxRate || 0) / 100));
    const previewShipping = invoiceToPreview.shippingCharges || 0;
    const previewTotal = previewTaxable + previewTax + previewShipping;

    const formatDate = (isoString: string) => {
      try {
        return new Date(isoString).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
      } catch (e) {
        return isoString;
      }
    };

    return (
      <div className="w-full max-w-4xl mx-auto space-y-6 pb-16">
        {/* Navigation & Actions bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-surface-container-lowest border border-border-muted p-4 rounded-2xl shadow-sm no-print">
          <div className="flex gap-2">
            <Link
              to="/dashboard"
              className="px-4 py-2 bg-surface hover:bg-surface-container-high border border-border-muted text-on-surface font-semibold rounded-lg text-xs transition-colors shadow-sm flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              Dashboard
            </Link>
            <button
              onClick={() => setViewMode('edit')}
              className="px-4 py-2 bg-surface hover:bg-surface-container-high border border-border-muted text-on-surface font-semibold rounded-lg text-xs transition-colors shadow-sm flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">edit</span>
              Edit Invoice
            </button>
          </div>
          
          <button
            onClick={() => window.print()}
            style={{ backgroundColor: primaryColor }}
            className="px-5 py-2 hover:opacity-90 text-on-primary font-semibold rounded-lg text-xs transition-all shadow-md flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">print</span>
            Print / Save PDF
          </button>
        </div>

        {/* Invoice Paper Card */}
        <div className="bg-white text-slate-800 border border-slate-200 p-8 md:p-12 rounded-2xl shadow-lg space-y-8 print:border-0 print:shadow-none print:p-0 print:bg-transparent">
          {/* Logo & Invoice Title */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b border-slate-100 pb-8">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <img src="/logo.png" alt="Invoizmo Logo" className="h-8 object-contain" />
                <span className="text-xl font-bold tracking-tight text-slate-900 font-display">Invoizmo</span>
              </div>
              <div className="text-xs text-slate-500 font-mono">
                Generated via Invoizmo platform
              </div>
            </div>
            <div className="text-left sm:text-right space-y-1.5">
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 font-display uppercase">Invoice</h2>
              <div className="font-mono text-sm text-slate-600 font-bold">
                No: {invoiceToPreview.invoiceNumber}
              </div>
              <div className="pt-1.5">
                <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                  invoiceToPreview.status === 'paid'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : invoiceToPreview.status === 'sent'
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : invoiceToPreview.status === 'void'
                    ? 'bg-slate-50 text-slate-500 border-slate-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                  {invoiceToPreview.status}
                </span>
              </div>
            </div>
          </div>

          {/* Dates & From/To Addresses */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-sm">
            {/* Metadata Dates */}
            <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="text-slate-500 font-semibold uppercase text-[10px] tracking-wider">Invoice Details</div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Issued:</span>
                  <span className="font-semibold text-slate-800">{formatDate(invoiceToPreview.issueDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Due Date:</span>
                  <span className="font-semibold text-slate-800">{formatDate(invoiceToPreview.dueDate)}</span>
                </div>
              </div>
            </div>

            {/* Sender / From */}
            <div className="space-y-2">
              <div className="text-slate-500 font-semibold uppercase text-[10px] tracking-wider">Sender (From)</div>
              <div className="space-y-1">
                <div className="font-bold text-slate-900 text-base">{invoiceToPreview.senderName || 'N/A'}</div>
                {invoiceToPreview.senderEmail && <div className="text-slate-600 text-xs">{invoiceToPreview.senderEmail}</div>}
                {invoiceToPreview.senderPhone && <div className="text-slate-600 text-xs">{invoiceToPreview.senderPhone}</div>}
                {invoiceToPreview.senderAddress && (
                  <div className="text-slate-500 text-xs whitespace-pre-line mt-1.5 leading-relaxed">
                    {invoiceToPreview.senderAddress}
                  </div>
                )}
              </div>
            </div>

            {/* Client / To */}
            <div className="space-y-2">
              <div className="text-slate-500 font-semibold uppercase text-[10px] tracking-wider">Bill To</div>
              <div className="space-y-1">
                <div className="font-bold text-slate-900 text-base">{invoiceToPreview.clientName}</div>
                <div className="text-slate-600 text-xs">{invoiceToPreview.clientEmail}</div>
                {invoiceToPreview.clientPhone && <div className="text-slate-600 text-xs">{invoiceToPreview.clientPhone}</div>}
                {invoiceToPreview.clientAddress && (
                  <div className="text-slate-500 text-xs whitespace-pre-line mt-1.5 leading-relaxed">
                    {invoiceToPreview.clientAddress}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Table of Items */}
          <div className="overflow-x-auto pt-4">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b-2 border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider bg-slate-50/50">
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4 text-center w-24">Quantity</th>
                  <th className="py-3 px-4 text-right w-32">Unit Price</th>
                  <th className="py-3 px-4 text-right w-36">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoiceToPreview.items.map((item: InvoiceItem, idx: number) => (
                  <tr key={idx} className="text-slate-700 hover:bg-slate-50/30 transition-colors">
                    <td className="py-4 px-4 font-medium text-slate-900">{item.description}</td>
                    <td className="py-4 px-4 text-center font-mono">{item.quantity}</td>
                    <td className="py-4 px-4 text-right font-mono">{formatAmount(item.price)}</td>
                    <td className="py-4 px-4 text-right font-mono font-semibold text-slate-900">
                      {formatAmount(item.quantity * item.price)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals Summary */}
          <div className="flex justify-end pt-4">
            <div className="w-full sm:w-80 space-y-2.5 text-sm border-t border-slate-100 pt-4">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal</span>
                <span className="font-mono">{formatAmount(previewSubtotal)}</span>
              </div>
              {invoiceToPreview.discountRate ? (
                <div className="flex justify-between text-slate-500">
                  <span>Discount ({invoiceToPreview.discountRate}%)</span>
                  <span className="font-mono text-rose-600">-{formatAmount(previewDiscount)}</span>
                </div>
              ) : null}
              {invoiceToPreview.taxRate ? (
                <div className="flex justify-between text-slate-500">
                  <span>Tax ({invoiceToPreview.taxRate}%)</span>
                  <span className="font-mono text-slate-700">+{formatAmount(previewTax)}</span>
                </div>
              ) : null}
              {invoiceToPreview.shippingCharges ? (
                <div className="flex justify-between text-slate-500">
                  <span>Shipping & Handling</span>
                  <span className="font-mono text-slate-700">+{formatAmount(previewShipping)}</span>
                </div>
              ) : null}
              <div className="flex justify-between items-center text-slate-900 font-bold border-t border-slate-200 pt-3 text-base">
                <span>Total Due</span>
                <span style={{ color: primaryColor }} className="font-mono text-xl font-extrabold">
                  {formatAmount(previewTotal)}
                </span>
              </div>
            </div>
          </div>

          {/* Notes & Terms */}
          {(invoiceToPreview.notes || invoiceToPreview.terms) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-slate-100 pt-8 text-xs leading-relaxed text-slate-500">
              {invoiceToPreview.notes ? (
                <div className="space-y-1.5">
                  <div className="font-bold text-slate-700 uppercase tracking-wider text-[9px]">Notes & Instructions</div>
                  <div className="whitespace-pre-line bg-slate-50/50 p-3 rounded-lg border border-slate-100 text-slate-600">
                    {invoiceToPreview.notes}
                  </div>
                </div>
              ) : null}
              {invoiceToPreview.terms ? (
                <div className="space-y-1.5">
                  <div className="font-bold text-slate-700 uppercase tracking-wider text-[9px]">Terms & Conditions</div>
                  <div className="whitespace-pre-line bg-slate-50/50 p-3 rounded-lg border border-slate-100 text-slate-600">
                    {invoiceToPreview.terms}
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 pb-16">
      {/* Mode Switch Header */}
      {invoiceToPreview && (
        <div className="flex justify-between items-center bg-surface-container-lowest border border-border-muted p-4 rounded-2xl shadow-sm no-print">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-text-muted">receipt_long</span>
            <span className="font-sans text-sm font-bold text-on-surface">Invoice: {invoiceToPreview.invoiceNumber || 'Draft'}</span>
          </div>
          <div className="flex gap-2 bg-surface-container p-1 rounded-xl border border-border-muted">
            <button
              type="button"
              onClick={() => setViewMode('edit')}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                viewMode === 'edit'
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'
              }`}
            >
              Edit Form
            </button>
            <button
              type="button"
              onClick={() => setViewMode('preview')}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                viewMode === 'preview'
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'
              }`}
            >
              Visual Preview
            </button>
          </div>
        </div>
      )}
      {errorMsg && (
        <div className="p-4 rounded-xl border bg-error-container/10 border-error/20 text-error flex items-start gap-2.5 text-sm font-medium">
          <span className="material-symbols-outlined text-[18px]">warning</span>
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* ─── Invoice Header Card ─── */}
        <div className="bg-surface-container-lowest border border-border-muted p-6 md:p-8 rounded-2xl shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="font-display text-2xl md:text-3xl font-extrabold text-on-surface tracking-tight">
                {isEditMode ? 'Edit Invoice' : 'Create Invoice'}
              </h1>
              <p className="text-xs md:text-sm text-text-muted mt-1">
                {isEditMode ? 'Modify invoice details and line items' : 'Create a new professional layout'}
              </p>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 flex-grow max-w-2xl md:justify-end">
              <div className="space-y-1.5">
                <label className="font-sans text-xs font-semibold text-on-surface-variant block">Invoice No.</label>
                <input
                  type="text"
                  placeholder="INV-001"
                  className={`w-full px-3 py-2 rounded-lg border bg-surface focus:ring-4 focus:ring-primary-container/15 focus:border-primary-container outline-none transition-all text-xs font-medium text-on-surface ${
                    errors.invoiceNumber ? 'border-error focus:ring-error/15' : 'border-border-muted'
                  }`}
                  {...register('invoiceNumber')}
                />
                {errors.invoiceNumber && (
                  <p className="text-[10px] text-error font-medium">{errors.invoiceNumber.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="font-sans text-xs font-semibold text-on-surface-variant block">Issue Date</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 rounded-lg border border-border-muted bg-surface focus:ring-4 focus:ring-primary-container/15 focus:border-primary-container outline-none transition-all text-xs font-medium text-on-surface"
                  {...register('issueDate')}
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-sans text-xs font-semibold text-on-surface-variant block">Due Date</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 rounded-lg border border-border-muted bg-surface focus:ring-4 focus:ring-primary-container/15 focus:border-primary-container outline-none transition-all text-xs font-medium text-on-surface"
                  {...register('dueDate')}
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-sans text-xs font-semibold text-on-surface-variant block">Status</label>
                <select
                  className="w-full px-3 py-2 rounded-lg border border-border-muted bg-surface focus:ring-4 focus:ring-primary-container/15 focus:border-primary-container outline-none transition-all text-xs font-semibold text-on-surface cursor-pointer"
                  {...register('status')}
                >
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Sender Details */}
          <div className="bg-surface-container-lowest border border-border-muted p-6 rounded-2xl shadow-sm space-y-4">
            <h3 className="font-display text-sm font-bold text-on-surface flex items-center gap-2 border-b border-border-muted pb-3">
              <span className="w-2.5 h-2.5 rounded-full bg-primary" />
              Your Details (Sender)
            </h3>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="font-sans text-xs font-semibold text-on-surface-variant block">Business / Name</label>
                <input
                  type="text"
                  placeholder="My Business Name"
                  className="w-full px-3.5 py-2 rounded-lg border border-border-muted bg-surface focus:ring-4 focus:ring-primary-container/15 focus:border-primary-container outline-none transition-all text-xs"
                  {...register('senderName')}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-sans text-xs font-semibold text-on-surface-variant block">Email</label>
                  <input
                    type="email"
                    placeholder="you@company.com"
                    className="w-full px-3.5 py-2 rounded-lg border border-border-muted bg-surface focus:ring-4 focus:ring-primary-container/15 focus:border-primary-container outline-none transition-all text-xs"
                    {...register('senderEmail')}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-sans text-xs font-semibold text-on-surface-variant block">Phone</label>
                  <input
                    type="text"
                    placeholder="+91 98765 43210"
                    className="w-full px-3.5 py-2 rounded-lg border border-border-muted bg-surface focus:ring-4 focus:ring-primary-container/15 focus:border-primary-container outline-none transition-all text-xs"
                    {...register('senderPhone')}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="font-sans text-xs font-semibold text-on-surface-variant block">Address</label>
                <input
                  type="text"
                  placeholder="123 Main St, City, State"
                  className="w-full px-3.5 py-2 rounded-lg border border-border-muted bg-surface focus:ring-4 focus:ring-primary-container/15 focus:border-primary-container outline-none transition-all text-xs"
                  {...register('senderAddress')}
                />
              </div>
            </div>
          </div>

          {/* Client Details */}
          <div className="bg-surface-container-lowest border border-border-muted p-6 rounded-2xl shadow-sm space-y-4">
            <h3 className="font-display text-sm font-bold text-on-surface flex items-center gap-2 border-b border-border-muted pb-3">
              <span className="w-2.5 h-2.5 rounded-full bg-secondary" />
              Client Details (Recipient)
            </h3>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="font-sans text-xs font-semibold text-on-surface block">
                  Client Name <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Client Business Name"
                  className={`w-full px-3.5 py-2 rounded-lg border bg-surface focus:ring-4 focus:ring-primary-container/15 focus:border-primary-container outline-none transition-all text-xs ${
                    errors.clientName ? 'border-error focus:ring-error/15' : 'border-border-muted'
                  }`}
                  {...register('clientName')}
                />
                {errors.clientName && (
                  <p className="text-[10px] text-error font-medium">{errors.clientName.message}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-sans text-xs font-semibold text-on-surface block">
                    Email <span className="text-error">*</span>
                  </label>
                  <input
                    type="email"
                    placeholder="client@company.com"
                    className={`w-full px-3.5 py-2 rounded-lg border bg-surface focus:ring-4 focus:ring-primary-container/15 focus:border-primary-container outline-none transition-all text-xs ${
                      errors.clientEmail ? 'border-error focus:border-error/15' : 'border-border-muted'
                    }`}
                    {...register('clientEmail')}
                  />
                  {errors.clientEmail && (
                    <p className="text-[10px] text-error font-medium">{errors.clientEmail.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="font-sans text-xs font-semibold text-on-surface-variant block">Phone</label>
                  <input
                    type="text"
                    placeholder="+91 98765 43210"
                    className="w-full px-3.5 py-2 rounded-lg border border-border-muted bg-surface focus:ring-4 focus:ring-primary-container/15 focus:border-primary-container outline-none transition-all text-xs"
                    {...register('clientPhone')}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="font-sans text-xs font-semibold text-on-surface-variant block">Address</label>
                <input
                  type="text"
                  placeholder="456 Client Ave, City, State"
                  className="w-full px-3.5 py-2 rounded-lg border border-border-muted bg-surface focus:ring-4 focus:ring-primary-container/15 focus:border-primary-container outline-none transition-all text-xs"
                  {...register('clientAddress')}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ─── Items Table ─── */}
        <div className="bg-surface-container-lowest border border-border-muted rounded-2xl shadow-sm overflow-hidden space-y-4 p-6">
          <div className="flex items-center justify-between border-b border-border-muted pb-4">
            <h3 className="font-display text-sm font-bold text-on-surface flex items-center gap-1.5">
              <span className="material-symbols-outlined text-text-muted text-[18px]">list_alt</span>
              Line Items
            </h3>
            <button
              type="button"
              className="px-3 py-1.5 bg-surface border border-border-muted hover:bg-surface-container-high text-on-surface font-semibold rounded-lg text-xs transition-colors flex items-center gap-1 shadow-sm"
              onClick={() => append({ description: '', quantity: 1, price: 0.01 })}
            >
              <span className="material-symbols-outlined text-[14px]">add</span>
              Add Row
            </button>
          </div>

          {errors.items && (
            <p className="text-xs text-error font-medium px-2 py-1 rounded bg-error-container/10 border border-error/15">
              ⚠️ {errors.items.message}
            </p>
          )}

          <div className="overflow-x-auto -mx-6">
            <table className="w-full border-collapse text-left text-xs min-w-[600px]">
              <thead>
                <tr className="bg-surface-container border-b border-border-muted font-bold text-text-muted uppercase tracking-wider">
                  <th className="px-6 py-3 w-12 text-center">#</th>
                  <th className="px-6 py-3">Description</th>
                  <th className="px-6 py-3 w-24 text-center">Qty</th>
                  <th className="px-6 py-3 w-32">Unit Price</th>
                  <th className="px-6 py-3 w-36 text-right">Amount</th>
                  <th className="px-6 py-3 w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-muted">
                {fields.map((field, index) => {
                  const q = Number(watchedItems?.[index]?.quantity) || 0;
                  const p = Number(watchedItems?.[index]?.price) || 0;
                  const lineTotal = q * Math.round(p * 100);
                  return (
                    <tr key={field.id} className="hover:bg-surface-container-low/20 transition-colors">
                      <td className="px-6 py-3.5 text-center font-semibold text-text-muted">
                        {index + 1}
                      </td>
                      <td className="px-6 py-3.5">
                        <input
                          type="text"
                          placeholder="Item description..."
                          className={`w-full px-3 py-2 rounded-lg border bg-surface focus:ring-4 focus:ring-primary-container/15 focus:border-primary-container outline-none transition-all ${
                            errors.items?.[index]?.description ? 'border-error focus:ring-error/15' : 'border-border-muted'
                          }`}
                          {...register(`items.${index}.description` as const)}
                        />
                      </td>
                      <td className="px-6 py-3.5">
                        <input
                          type="number"
                          placeholder="1"
                          className="w-full px-3 py-2 rounded-lg border border-border-muted bg-surface focus:ring-4 focus:ring-primary-container/15 focus:border-primary-container outline-none transition-all text-center"
                          {...register(`items.${index}.quantity` as const, { valueAsNumber: true })}
                        />
                      </td>
                      <td className="px-6 py-3.5">
                        <input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          className="w-full px-3 py-2 rounded-lg border border-border-muted bg-surface focus:ring-4 focus:ring-primary-container/15 focus:border-primary-container outline-none transition-all"
                          {...register(`items.${index}.price` as const, { valueAsNumber: true })}
                        />
                      </td>
                      <td className="px-6 py-3.5 text-right font-mono font-bold text-on-surface">
                        {formatAmount(lineTotal)}
                      </td>
                      <td className="px-6 py-3.5 text-center">
                        {fields.length > 1 && (
                          <button
                            type="button"
                            onClick={() => remove(index)}
                            className="p-1 hover:bg-error/15 text-error rounded transition-colors"
                            title="Remove Row"
                          >
                            <span className="material-symbols-outlined text-[16px]">close</span>
                          </button>
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
        <div className="flex justify-end">
          <div className="bg-surface-container-lowest border border-border-muted p-6 rounded-2xl shadow-sm w-full max-w-sm space-y-4">
            <h3 className="font-display text-sm font-bold text-on-surface border-b border-border-muted pb-3 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-text-muted text-[18px]">calculate</span>
              Price Summary
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between items-center text-on-surface-variant">
                <span>Subtotal</span>
                <span className="font-mono font-semibold">{formatAmount(subtotalCents)}</span>
              </div>

              <div className="flex justify-between items-center text-on-surface-variant">
                <div className="flex items-center gap-2">
                  <span>Discount</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      className="w-12 px-1.5 py-1 border border-border-muted bg-surface rounded text-center outline-none focus:border-primary font-medium"
                      {...register('discountRate', { valueAsNumber: true })}
                    />
                    <span className="text-[10px] text-text-muted font-bold">%</span>
                  </div>
                </div>
                <span className="font-mono font-semibold text-error">-{formatAmount(discountCents)}</span>
              </div>

              <div className="flex justify-between items-center text-on-surface-variant">
                <div className="flex items-center gap-2">
                  <span>Tax / GST</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      className="w-12 px-1.5 py-1 border border-border-muted bg-surface rounded text-center outline-none focus:border-primary font-medium"
                      {...register('taxRate', { valueAsNumber: true })}
                    />
                    <span className="text-[10px] text-text-muted font-bold">%</span>
                  </div>
                </div>
                <span className="font-mono font-semibold text-secondary">+{formatAmount(taxCents)}</span>
              </div>

              <div className="flex justify-between items-center text-on-surface-variant">
                <div className="flex items-center gap-2">
                  <span>Shipping</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="w-16 px-1.5 py-1 border border-border-muted bg-surface rounded text-center outline-none focus:border-primary font-medium"
                      {...register('shippingCharges', { valueAsNumber: true })}
                    />
                  </div>
                </div>
                <span className="font-mono font-semibold">+{formatAmount(shippingCents)}</span>
              </div>

              <div className="border-t border-border-muted pt-4 flex justify-between items-center text-sm font-bold text-on-surface">
                <span>Total Due</span>
                <span style={{ color: primaryColor }} className="font-mono text-lg font-extrabold">
                  {formatAmount(grandTotal)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Notes & Terms toggles ─── */}
        <div className="flex flex-wrap gap-2.5">
          <button
            type="button"
            className={`px-4 py-2 border rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm ${
              showNotes
                ? 'bg-primary/10 border-primary text-primary'
                : 'bg-surface-container-lowest border-border-muted text-on-surface-variant hover:bg-surface-container-low'
            }`}
            onClick={() => setShowNotes((v) => !v)}
          >
            <span className="material-symbols-outlined text-[14px]">
              {showNotes ? 'check_circle' : 'add'}
            </span>
            Notes & Info
          </button>
          <button
            type="button"
            className={`px-4 py-2 border rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm ${
              showTerms
                ? 'bg-primary/10 border-primary text-primary'
                : 'bg-surface-container-lowest border-border-muted text-on-surface-variant hover:bg-surface-container-low'
            }`}
            onClick={() => setShowTerms((v) => !v)}
          >
            <span className="material-symbols-outlined text-[14px]">
              {showTerms ? 'check_circle' : 'add'}
            </span>
            Terms & Conditions
          </button>
        </div>

        {(showNotes || showTerms) && (
          <div className="bg-surface-container-lowest border border-border-muted p-6 rounded-2xl shadow-sm space-y-4">
            {showNotes && (
              <div className="space-y-1.5">
                <label className="font-sans text-xs font-semibold text-on-surface block">
                  Notes / Payment Instructions
                </label>
                <textarea
                  className="w-full px-4 py-2.5 rounded-lg border border-border-muted bg-surface focus:ring-4 focus:ring-primary-container/15 focus:border-primary-container outline-none transition-all text-xs"
                  rows={3}
                  placeholder="e.g. Bank details, UPI ID, payment link..."
                  {...register('notes')}
                />
              </div>
            )}
            {showTerms && (
              <div className="space-y-1.5">
                <label className="font-sans text-xs font-semibold text-on-surface block">
                  Terms & Conditions
                </label>
                <textarea
                  className="w-full px-4 py-2.5 rounded-lg border border-border-muted bg-surface focus:ring-4 focus:ring-primary-container/15 focus:border-primary-container outline-none transition-all text-xs"
                  rows={3}
                  placeholder="e.g. Late payment fees, refunds, jurisdiction..."
                  {...register('terms')}
                />
              </div>
            )}
          </div>
        )}

        {/* ─── Footer Action Buttons ─── */}
        <div className="flex justify-end gap-3 pt-4 border-t border-border-muted">
          <Link
            to="/dashboard"
            className="px-6 py-2.5 bg-surface hover:bg-surface-container-high border border-border-muted text-on-surface font-semibold rounded-lg text-sm transition-colors shadow-sm"
          >
            Cancel
          </Link>
          <button
            type="submit"
            className="px-8 py-2.5 bg-primary-container hover:bg-primary text-on-primary font-semibold rounded-lg text-sm transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save & Preview'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default InvoiceEditor;
