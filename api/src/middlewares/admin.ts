import { Request, Response, NextFunction } from 'express';
import supabase from '../config/db';

export const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
  const userId = (req as any).user?.id;
  if (!userId) return res.status(401).json({ error: 'No autenticado' });

  const result = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', userId)
    .maybeSingle();

  const data = result.data as { is_admin: boolean } | null;
  const error = result.error;

  if (error || !data?.is_admin) {
    return res.status(403).json({ error: 'Acceso denegado' });
  }

  return next();
};
