import { Request, Response, NextFunction } from "express";
import supabase from "../config/db";

const db = supabase as any;

export const verifyAuth = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Missing token. Unauthorized." });
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      if (error?.message !== 'Auth session missing!') {
        console.error("Error validando token de Supabase:", error?.message);
      }
      return res.status(401).json({ error: "Invalid token or session expired" });
    }

    // Check if user is banned
    const { data: profile } = await db
      .from('users')
      .select('is_banned, ban_reason')
      .eq('id', user.id)
      .maybeSingle();

    if (profile?.is_banned) {
      return res.status(403).json({
        code:      'ACCOUNT_BANNED',
        error:     'Tu cuenta ha sido suspendida',
        banReason: profile.ban_reason ?? null,
      });
    }

    (req as any).user = user;
    return next();
  } catch (error) {
    console.error("Auth middleware unexpected error:", error);
    return res.status(500).json({ error: "Internal server error during authentication" });
  }
}