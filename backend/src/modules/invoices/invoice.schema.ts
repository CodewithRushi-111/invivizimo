import { z } from 'zod';

const invoiceItemSchema = z.object({
  description: z.string().min(1, 'Item description is required'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  price: z.number().int().min(0, 'Price must be greater than or equal to 0'), // Price in cents
});

export const createInvoiceSchema = z.object({
  invoiceNumber: z.string().min(1, 'Invoice number is required'),
  clientName: z.string().min(1, 'Client name is required'),
  clientEmail: z.string().email('Invalid client email address'),
  senderName: z.string().optional(),
  senderEmail: z.string().optional(),
  senderPhone: z.string().optional(),
  senderAddress: z.string().optional(),
  clientAddress: z.string().optional(),
  clientPhone: z.string().optional(),
  taxRate: z.number().min(0).max(100).optional(),
  discountRate: z.number().min(0).max(100).optional(),
  shippingCharges: z.number().min(0).optional(),
  notes: z.string().optional(),
  terms: z.string().optional(),
  issueDate: z.preprocess((val) => (typeof val === 'string' ? new Date(val) : val), z.date()).optional(),
  dueDate: z.preprocess((val) => (typeof val === 'string' ? new Date(val) : val), z.date()),
  items: z.array(invoiceItemSchema).min(1, 'Invoice must contain at least 1 item'),
  status: z.enum(['draft', 'sent', 'paid', 'void']).default('draft'),
});

export const updateInvoiceSchema = z.object({
  invoiceNumber: z.string().min(1).optional(),
  clientName: z.string().min(1).optional(),
  clientEmail: z.string().email().optional(),
  senderName: z.string().optional(),
  senderEmail: z.string().optional(),
  senderPhone: z.string().optional(),
  senderAddress: z.string().optional(),
  clientAddress: z.string().optional(),
  clientPhone: z.string().optional(),
  taxRate: z.number().min(0).max(100).optional(),
  discountRate: z.number().min(0).max(100).optional(),
  shippingCharges: z.number().min(0).optional(),
  notes: z.string().optional(),
  terms: z.string().optional(),
  issueDate: z.preprocess((val) => (typeof val === 'string' ? new Date(val) : val), z.date()).optional(),
  dueDate: z.preprocess((val) => (typeof val === 'string' ? new Date(val) : val), z.date()).optional(),
  items: z.array(invoiceItemSchema).min(1).optional(),
  status: z.enum(['draft', 'sent', 'paid', 'void']).optional(),
});
