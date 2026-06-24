import { Request, Response, NextFunction } from 'express';
import * as invoiceService from './invoice.service';

export async function createInvoice(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!._id;
    const invoice = await invoiceService.createInvoice(userId.toString(), req.body);
    res.status(201).json({
      success: true,
      data: invoice,
    });
  } catch (error) {
    next(error);
  }
}

export async function getInvoices(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!._id;
    const { page, limit, status } = req.query;

    const { invoices, total } = await invoiceService.getInvoices(userId.toString(), {
      page: page ? parseInt(page as string, 10) : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
      status: status as string,
    });

    const pageNum = page ? parseInt(page as string, 10) : 1;
    const limitNum = limit ? parseInt(limit as string, 10) : 20;

    res.status(200).json({
      success: true,
      data: invoices,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getInvoice(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!._id;
    const { id } = req.params;
    const invoice = await invoiceService.getInvoiceById(userId.toString(), id as string);
    res.status(200).json({
      success: true,
      data: invoice,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateInvoice(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!._id;
    const { id } = req.params;
    const invoice = await invoiceService.updateInvoice(userId.toString(), id as string, req.body);
    res.status(200).json({
      success: true,
      data: invoice,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteInvoice(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!._id;
    const { id } = req.params;
    await invoiceService.deleteInvoice(userId.toString(), id as string);
    res.status(200).json({
      success: true,
      data: { message: 'Invoice successfully deleted' },
    });
  } catch (error) {
    next(error);
  }
}

export async function getDeletedInvoices(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!._id;
    const { page, limit } = req.query;

    const { invoices, total } = await invoiceService.getDeletedInvoices(userId.toString(), {
      page: page ? parseInt(page as string, 10) : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
    });

    const pageNum = page ? parseInt(page as string, 10) : 1;
    const limitNum = limit ? parseInt(limit as string, 10) : 20;

    res.status(200).json({
      success: true,
      data: invoices,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function restoreInvoice(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!._id;
    const { id } = req.params;
    const invoice = await invoiceService.restoreInvoice(userId.toString(), id as string);
    res.status(200).json({
      success: true,
      data: invoice,
    });
  } catch (error) {
    next(error);
  }
}

export async function permanentDeleteInvoice(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!._id;
    const { id } = req.params;
    await invoiceService.permanentDeleteInvoice(userId.toString(), id as string);
    res.status(200).json({
      success: true,
      data: { message: 'Invoice permanently deleted' },
    });
  } catch (error) {
    next(error);
  }
}
