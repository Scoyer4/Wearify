import { Request, Response, NextFunction } from "express";
import supabase from "../config/db";

export const verifyAuth = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Missing token. Unauthorized." });
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      console.error("Error validando token de Supabase:", error?.message);
      return res.status(401).json({ error: "Invalid token or session expired" });
    }

    (req as any).user = user; 
    
    return next();
  } catch (error) {
    console.error("Auth middleware unexpected error:", error);
    return res.status(500).json({ error: "Internal server error during authentication" });
  }
}