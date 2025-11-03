// server/auth/jwt.ts
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const JWT_EXPIRES = process.env.JWT_EXPIRES || "7d";

export type JwtPayload = {
  sub: string;
  role: "SUPERUSER" | "MODERATOR" | "USER";
};

export function signJwt(payload: JwtPayload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

export function verifyJwt(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}

// Express middleware to protect admin endpoints
export function requireAdmin(req: any, res: any, next: any) {
  const h = req.headers["authorization"] || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Missing token" });
  try {
    const decoded = verifyJwt(token);
    if (decoded.role !== "SUPERUSER" && decoded.role !== "MODERATOR") {
      return res.status(403).json({ error: "Forbidden" });
    }
    // attach for downstream
    req.user = decoded;
    next();
  } catch (e: any) {
    return res.status(401).json({ error: "Invalid token" });
  }
}
