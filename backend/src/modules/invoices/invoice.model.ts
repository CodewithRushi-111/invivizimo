import { Schema, model, Document, Types } from 'mongoose';

export interface IInvoiceItem {
  description: string;
  quantity: number;
  price: number; // Price in cents
}

export interface IInvoice extends Document {
  userId: Types.ObjectId;
  invoiceNumber: string;
  clientName: string;
  clientEmail: string;
  senderName?: string;
  senderEmail?: string;
  senderPhone?: string;
  senderAddress?: string;
  clientAddress?: string;
  clientPhone?: string;
  taxRate?: number;
  discountRate?: number;
  shippingCharges?: number;
  notes?: string;
  terms?: string;
  issueDate: Date;
  dueDate: Date;
  items: IInvoiceItem[];
  status: 'draft' | 'sent' | 'paid' | 'void';
  totalAmount: number; // Sum in cents
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const invoiceItemSchema = new Schema<IInvoiceItem>({
  description: { type: String, required: true, trim: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true, min: 0 },
}, { _id: false });

const invoiceSchema = new Schema<IInvoice>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  invoiceNumber: {
    type: String,
    required: true,
    trim: true,
  },
  clientName: {
    type: String,
    required: true,
    trim: true,
  },
  clientEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  senderName: { type: String, trim: true, default: '' },
  senderEmail: { type: String, trim: true, default: '' },
  senderPhone: { type: String, trim: true, default: '' },
  senderAddress: { type: String, trim: true, default: '' },
  clientAddress: { type: String, trim: true, default: '' },
  clientPhone: { type: String, trim: true, default: '' },
  taxRate: { type: Number, default: 0, min: 0, max: 100 },
  discountRate: { type: Number, default: 0, min: 0, max: 100 },
  shippingCharges: { type: Number, default: 0, min: 0 },
  notes: { type: String, trim: true, default: '' },
  terms: { type: String, trim: true, default: '' },
  issueDate: {
    type: Date,
    required: true,
    default: Date.now,
  },
  dueDate: {
    type: Date,
    required: true,
  },
  items: {
    type: [invoiceItemSchema],
    required: true,
    validate: [
      (val: IInvoiceItem[]) => val.length > 0,
      'Invoice must have at least one item',
    ],
  },
  status: {
    type: String,
    enum: ['draft', 'sent', 'paid', 'void'],
    default: 'draft',
    required: true,
  },
  totalAmount: {
    type: Number,
    required: true,
    default: 0,
  },
  isDeleted: {
    type: Boolean,
    required: true,
    default: false,
    index: true,
  },
  deletedAt: {
    type: Date,
  },
}, {
  timestamps: true,
});

// Compound index to ensure invoiceNumber is unique PER user (excluding soft-deleted records)
invoiceSchema.index(
  { userId: 1, invoiceNumber: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);

// Pre-save hook to calculate totalAmount dynamically
invoiceSchema.pre('save', function(this: IInvoice) {
  if (this.isModified('items') || this.isModified('taxRate') || this.isModified('discountRate') || this.isModified('shippingCharges')) {
    const subtotal = this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discountAmount = Math.round(subtotal * ((this.discountRate || 0) / 100));
    const taxableAmount = subtotal - discountAmount;
    const taxAmount = Math.round(taxableAmount * ((this.taxRate || 0) / 100));
    this.totalAmount = taxableAmount + taxAmount + (this.shippingCharges || 0);
  }
});

export const Invoice = model<IInvoice>('Invoice', invoiceSchema);
export default Invoice;
