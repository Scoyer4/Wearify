import { Request, Response } from 'express';
import { adminRepository } from '../repositories/adminRepository';
import { notificationRepository } from '../repositories/notificationRepository';
import supabaseTyped from '../config/db';
const db = supabaseTyped as any;

const PAGE_LIMIT = 20;

// ── Admin controller ───────────────────────────────────────────────────────────

export const adminController = {

  // GET /admin/me
  getMe: async (req: Request, res: Response) => {
    return res.json({ isAdmin: true });
  },

  // GET /admin/stats
  getStats: async (_req: Request, res: Response) => {
    try {
      return res.json(await adminRepository.getStats());
    } catch (e: any) {
      return res.status(500).json({ error: 'Error al obtener estadísticas' });
    }
  },

  // GET /admin/products
  getProducts: async (req: Request, res: Response) => {
    try {
      const page   = Math.max(1, parseInt(req.query.page   as string) || 1);
      const search = req.query.search as string | undefined;
      const status = req.query.status as string | undefined;
      const result = await adminRepository.getProducts(page, PAGE_LIMIT, search, status);
      return res.json({ ...result, page, limit: PAGE_LIMIT });
    } catch (e: any) {
      return res.status(500).json({ error: 'Error al obtener productos' });
    }
  },

  // DELETE /admin/products/:productId
  deleteProduct: async (req: Request, res: Response) => {
    try {
      const { productId } = req.params;
      const { reason } = req.body as { reason?: string };

      const { data: product } = await db
        .from('products')
        .select('title, seller_id')
        .eq('id', productId)
        .maybeSingle();

      await adminRepository.deleteProduct(productId);

      if (product?.seller_id && reason?.trim()) {
        const msg = `Tu producto "${product.title}" ha sido eliminado por el equipo de moderación. Motivo: ${reason.trim()}`;
        await notificationRepository.insert(product.seller_id, 'product_deleted', null, null, msg);
      }

      return res.json({ ok: true });
    } catch (e: any) {
      return res.status(500).json({ error: e.message ?? 'Error al eliminar producto' });
    }
  },

  // GET /admin/users
  getUsers: async (req: Request, res: Response) => {
    try {
      const page   = Math.max(1, parseInt(req.query.page as string) || 1);
      const search = req.query.search as string | undefined;
      const banned = req.query.banned === 'true' ? true
                   : req.query.banned === 'false' ? false
                   : undefined;
      const result = await adminRepository.getUsers(page, PAGE_LIMIT, search, banned);
      return res.json({ ...result, page, limit: PAGE_LIMIT });
    } catch (e: any) {
      return res.status(500).json({ error: 'Error al obtener usuarios' });
    }
  },

  // PATCH /admin/users/:userId/ban
  banUser: async (req: Request, res: Response) => {
    try {
      const { reason } = req.body as { reason?: string };
      if (!reason?.trim()) return res.status(400).json({ error: 'El motivo es obligatorio' });
      await adminRepository.banUser(req.params.userId, reason.trim());
      return res.json({ ok: true });
    } catch (e: any) {
      return res.status(500).json({ error: 'Error al banear usuario' });
    }
  },

  // PATCH /admin/users/:userId/unban
  unbanUser: async (req: Request, res: Response) => {
    try {
      await adminRepository.unbanUser(req.params.userId);
      return res.json({ ok: true });
    } catch (e: any) {
      return res.status(500).json({ error: 'Error al desbanear usuario' });
    }
  },

  // GET /admin/reports
  getReports: async (req: Request, res: Response) => {
    try {
      const page   = Math.max(1, parseInt(req.query.page as string) || 1);
      const status = req.query.status as string | undefined;
      const result = await adminRepository.getReports(page, PAGE_LIMIT, status);
      return res.json({ ...result, page, limit: PAGE_LIMIT });
    } catch (e: any) {
      return res.status(500).json({ error: 'Error al obtener reportes' });
    }
  },

  // PATCH /admin/reports/:reportId/resolve
  resolveReport: async (req: Request, res: Response) => {
    try {
      const { action, productId, userId, banReason, deleteReason } = req.body as {
        action?:       'delete_product' | 'ban_user' | 'none';
        productId?:    string;
        userId?:       string;
        banReason?:    string;
        deleteReason?: string;
      };

      if (action === 'delete_product' && productId) {
        const { data: product } = await db
          .from('products')
          .select('title, seller_id')
          .eq('id', productId)
          .maybeSingle();

        await adminRepository.deleteProduct(productId);

        if (product?.seller_id) {
          const reason = deleteReason?.trim() ?? 'Incumplimiento de las normas de la comunidad';
          const msg = `Tu producto "${product.title}" ha sido eliminado por el equipo de moderación. Motivo: ${reason}`;
          await notificationRepository.insert(product.seller_id, 'product_deleted', null, null, msg);
        }
      } else if (action === 'ban_user' && userId) {
        await adminRepository.banUser(userId, banReason ?? 'Incumplimiento de las normas de la comunidad');
      }

      await adminRepository.updateReportStatus(req.params.reportId, 'resolved');
      return res.json({ ok: true });
    } catch (e: any) {
      return res.status(500).json({ error: 'Error al resolver el reporte' });
    }
  },

  // PATCH /admin/reports/:reportId/ignore
  ignoreReport: async (req: Request, res: Response) => {
    try {
      await adminRepository.updateReportStatus(req.params.reportId, 'ignored');
      return res.json({ ok: true });
    } catch (e: any) {
      return res.status(500).json({ error: 'Error al ignorar el reporte' });
    }
  },
};

// ── Report controller (any authenticated user) ─────────────────────────────────

export const reportController = {

  // POST /reports
  createReport: async (req: Request, res: Response) => {
    try {
      const reporterId = (req as any).user!.id as string;
      const { reason, details, productId, userId } = req.body as {
        reason?:    string;
        details?:   string;
        productId?: string;
        userId?:    string;
      };

      if (!reason?.trim())         return res.status(400).json({ error: 'El motivo es obligatorio' });
      if (!productId && !userId)   return res.status(400).json({ error: 'Debes indicar qué estás reportando' });
      if (userId === reporterId)   return res.status(400).json({ error: 'No puedes reportarte a ti mismo' });

      const report = await adminRepository.createReport(reporterId, reason.trim(), details?.trim(), productId, userId);
      return res.status(201).json(report);
    } catch (e: any) {
      return res.status(500).json({ error: 'Error al enviar el reporte' });
    }
  },
};
