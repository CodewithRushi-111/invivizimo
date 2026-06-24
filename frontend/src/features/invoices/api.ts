import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { client } from '../../lib/api/client';

export interface InvoiceItem {
  description: string;
  quantity: number;
  price: number; // Price in cents
}

export interface Invoice {
  _id: string;
  userId: string;
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
  issueDate: string;
  dueDate: string;
  items: InvoiceItem[];
  status: 'draft' | 'sent' | 'paid' | 'void';
  totalAmount: number; // Sum in cents
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceListResponse {
  success: boolean;
  data: Invoice[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export function useInvoices(params?: { page?: number; limit?: number; status?: string }) {
  return useQuery<InvoiceListResponse>({
    queryKey: ['invoices', params],
    queryFn: async () => {
      const { data } = await client.get('/invoices', { params });
      return data;
    },
  });
}

export function useInvoice(id: string | undefined) {
  return useQuery<Invoice>({
    queryKey: ['invoice', id],
    queryFn: async () => {
      if (!id) throw new Error('Invoice ID is required');
      const { data } = await client.get(`/invoices/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
}

export function useCreateInvoice() {
  const qc = useQueryClient();
  return useMutation<Invoice, Error, Omit<Invoice, '_id' | 'userId' | 'totalAmount' | 'createdAt' | 'updatedAt'>>({
    mutationFn: async (newInvoice) => {
      const { data } = await client.post('/invoices', newInvoice);
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
}

export function useUpdateInvoice() {
  const qc = useQueryClient();
  return useMutation<Invoice, Error, { id: string; body: Partial<Omit<Invoice, '_id' | 'userId' | 'totalAmount' | 'createdAt' | 'updatedAt'>> }>({
    mutationFn: async ({ id, body }) => {
      const { data } = await client.patch(`/invoices/${id}`, body);
      return data.data;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['invoices'] });
      qc.invalidateQueries({ queryKey: ['invoice', variables.id] });
    },
  });
}

export function useDeleteInvoice() {
  const qc = useQueryClient();
  return useMutation<{ success: boolean; data: { message: string } }, Error, string>({
    mutationFn: async (id) => {
      const { data } = await client.delete(`/invoices/${id}`);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['invoices'] });
      qc.invalidateQueries({ queryKey: ['deleted-invoices'] });
    },
  });
}

export function useDeletedInvoices(params?: { page?: number; limit?: number }) {
  return useQuery<InvoiceListResponse>({
    queryKey: ['deleted-invoices', params],
    queryFn: async () => {
      const { data } = await client.get('/invoices/trash', { params });
      return data;
    },
  });
}

export function useRestoreInvoice() {
  const qc = useQueryClient();
  return useMutation<Invoice, Error, string>({
    mutationFn: async (id) => {
      const { data } = await client.patch(`/invoices/trash/${id}/restore`);
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['invoices'] });
      qc.invalidateQueries({ queryKey: ['deleted-invoices'] });
    },
  });
}

export function usePermanentDeleteInvoice() {
  const qc = useQueryClient();
  return useMutation<{ success: boolean; data: { message: string } }, Error, string>({
    mutationFn: async (id) => {
      const { data } = await client.delete(`/invoices/trash/${id}`);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['deleted-invoices'] });
    },
  });
}
