import { Router } from 'express';
import * as invoiceController from './invoice.controller';
import { requireAuth } from '../../middleware/requireAuth';
import { validate } from '../../middleware/validate';
import { createInvoiceSchema, updateInvoiceSchema } from './invoice.schema';

const router = Router();

// Enforce authentication on all invoice operations
router.use(requireAuth);

router.post('/', validate({ body: createInvoiceSchema }), invoiceController.createInvoice);
router.get('/', invoiceController.getInvoices);

// Trash routes (must be before /:id to avoid route conflicts)
router.get('/trash', invoiceController.getDeletedInvoices);
router.patch('/trash/:id/restore', invoiceController.restoreInvoice);
router.delete('/trash/:id', invoiceController.permanentDeleteInvoice);

router.get('/:id', invoiceController.getInvoice);
router.patch('/:id', validate({ body: updateInvoiceSchema }), invoiceController.updateInvoice);
router.delete('/:id', invoiceController.deleteInvoice);

export default router;
