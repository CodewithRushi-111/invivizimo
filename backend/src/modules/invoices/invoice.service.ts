import { Types } from 'mongoose';
import Invoice, { IInvoice } from './invoice.model';
import { AppError } from '../../utils/ownershipCheck';

/**
 * Create a new invoice
 */
export async function createInvoice(userId: string, data: any): Promise<IInvoice> {
  // Check if invoice number is already in use for active invoices of this user
  const existing = await Invoice.findOne({
    userId: new Types.ObjectId(userId),
    invoiceNumber: data.invoiceNumber,
    isDeleted: false,
  });

  if (existing) {
    const err = new Error('Invoice number is already in use') as AppError;
    err.statusCode = 409;
    err.code = 'CONFLICT';
    throw err;
  }

  const invoice = new Invoice({
    ...data,
    userId: new Types.ObjectId(userId),
  });

  await invoice.save();
  return invoice;
}

/**
 * Get paginated invoices for a user
 */
export async function getInvoices(
  userId: string,
  query: { page?: number; limit?: number; status?: string }
): Promise<{ invoices: IInvoice[]; total: number }> {
  const page = Math.max(1, query.page || 1);
  const limit = Math.max(1, Math.min(100, query.limit || 20));
  const skip = (page - 1) * limit;

  const filter: Record<string, any> = {
    userId: new Types.ObjectId(userId),
    isDeleted: false,
  };

  if (query.status) {
    filter.status = query.status;
  }

  const [invoices, total] = await Promise.all([
    Invoice.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Invoice.countDocuments(filter),
  ]);

  return { invoices, total };
}

/**
 * Get a specific invoice by ID
 */
export async function getInvoiceById(userId: string, invoiceId: string): Promise<IInvoice> {
  const invoice = await Invoice.findOne({
    _id: new Types.ObjectId(invoiceId),
    userId: new Types.ObjectId(userId),
    isDeleted: false,
  });

  if (!invoice) {
    const err = new Error('Invoice not found') as AppError;
    err.statusCode = 404;
    err.code = 'NOT_FOUND';
    throw err;
  }

  return invoice;
}

/**
 * Update a specific invoice
 */
export async function updateInvoice(userId: string, invoiceId: string, data: any): Promise<IInvoice> {
  const invoice = await getInvoiceById(userId, invoiceId);

  // If invoice number is being changed, check uniqueness
  if (data.invoiceNumber && data.invoiceNumber !== invoice.invoiceNumber) {
    const existing = await Invoice.findOne({
      userId: new Types.ObjectId(userId),
      invoiceNumber: data.invoiceNumber,
      isDeleted: false,
      _id: { $ne: invoice._id },
    });

    if (existing) {
      const err = new Error('Invoice number is already in use') as AppError;
      err.statusCode = 409;
      err.code = 'CONFLICT';
      throw err;
    }
  }

  // Update fields
  Object.keys(data).forEach((key) => {
    (invoice as any)[key] = data[key];
  });

  await invoice.save();
  return invoice;
}

/**
 * Soft delete an invoice
 */
export async function deleteInvoice(userId: string, invoiceId: string): Promise<void> {
  const invoice = await getInvoiceById(userId, invoiceId);

  invoice.isDeleted = true;
  invoice.deletedAt = new Date();

  await invoice.save();
}

/**
 * Get paginated soft-deleted invoices for trash view
 */
export async function getDeletedInvoices(
  userId: string,
  query: { page?: number; limit?: number }
): Promise<{ invoices: IInvoice[]; total: number }> {
  const page = Math.max(1, query.page || 1);
  const limit = Math.max(1, Math.min(100, query.limit || 20));
  const skip = (page - 1) * limit;

  const filter = {
    userId: new Types.ObjectId(userId),
    isDeleted: true,
  };

  const [invoices, total] = await Promise.all([
    Invoice.find(filter).sort({ deletedAt: -1 }).skip(skip).limit(limit),
    Invoice.countDocuments(filter),
  ]);

  return { invoices, total };
}

/**
 * Restore a soft-deleted invoice from trash
 */
export async function restoreInvoice(userId: string, invoiceId: string): Promise<IInvoice> {
  const invoice = await Invoice.findOne({
    _id: new Types.ObjectId(invoiceId),
    userId: new Types.ObjectId(userId),
    isDeleted: true,
  });

  if (!invoice) {
    const err = new Error('Invoice not found in trash') as AppError;
    err.statusCode = 404;
    err.code = 'NOT_FOUND';
    throw err;
  }

  // Check if restoring would cause a duplicate invoice number
  const existingActive = await Invoice.findOne({
    userId: new Types.ObjectId(userId),
    invoiceNumber: invoice.invoiceNumber,
    isDeleted: false,
  });

  if (existingActive) {
    const err = new Error('Cannot restore: an active invoice with this number already exists') as AppError;
    err.statusCode = 409;
    err.code = 'CONFLICT';
    throw err;
  }

  invoice.isDeleted = false;
  invoice.deletedAt = undefined;
  await invoice.save();
  return invoice;
}

/**
 * Permanently delete an invoice (from trash only)
 */
export async function permanentDeleteInvoice(userId: string, invoiceId: string): Promise<void> {
  const result = await Invoice.deleteOne({
    _id: new Types.ObjectId(invoiceId),
    userId: new Types.ObjectId(userId),
    isDeleted: true,
  });

  if (result.deletedCount === 0) {
    const err = new Error('Invoice not found in trash') as AppError;
    err.statusCode = 404;
    err.code = 'NOT_FOUND';
    throw err;
  }
}
