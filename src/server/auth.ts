import crypto from 'crypto';
import type { Request, Response, NextFunction } from 'express';

const SESSION_TTL_MS = 8 * 60 * 60 * 1000;
const COOKIE_NAME = 'phantom_session';

function sessionSecret(): string {
  return process.env.SESSION_SECRET || 'phantom-trace-dev-only-change-me';
}

export function demoCredentials(): { username: string; password: string } {
  return {
    username: process.env.DEMO_USERNAME || 'operator',
    password: process.env.DEMO_PASSWORD || 'phantom-demo-2026',
  };
}

function b64url(input: Buffer | string): string {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input);
  return buf.toString('base64url');
}

function sign(payloadB64: string): string {
  return b64url(crypto.createHmac('sha256', sessionSecret()).update(payloadB64).digest());
}

export function issueToken(username: string): string {
  const payload = b64url(JSON.stringify({ u: username, exp: Date.now() + SESSION_TTL_MS }));
  return `${payload}.${sign(payload)}`;
}

export function verifyToken(token: string | undefined): { username: string } | null {
  if (!token || !token.includes('.')) return null;
  const [payload, sig] = token.split('.');
  const expected = sign(payload);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { u: string; exp: number };
    if (!data.u || typeof data.exp !== 'number' || Date.now() > data.exp) return null;
    return { username: data.u };
  } catch {
    return null;
  }
}

function sha256(value: string): Buffer {
  return crypto.createHash('sha256').update(value, 'utf8').digest();
}

export function verifyPassword(username: string, password: string): boolean {
  const demo = demoCredentials();
  const userOk =
    username.length === demo.username.length &&
    crypto.timingSafeEqual(Buffer.from(username), Buffer.from(demo.username));
  const passA = sha256(password);
  const passB = sha256(demo.password);
  const passOk = passA.length === passB.length && crypto.timingSafeEqual(passA, passB);
  return userOk && passOk;
}

export function readSessionToken(req: Request): string | undefined {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) return header.slice(7).trim();
  const cookie = req.headers.cookie || '';
  for (const part of cookie.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    if (key === COOKIE_NAME) return decodeURIComponent(part.slice(idx + 1).trim());
  }
  return undefined;
}

export function setSessionCookie(res: Response, token: string) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader(
    'Set-Cookie',
    `${COOKIE_NAME}=${encodeURIComponent(token)}; HttpOnly; Path=/; Max-Age=${SESSION_TTL_MS / 1000}; SameSite=Lax${secure}`
  );
}

export function clearSessionCookie(res: Response) {
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`);
}

const PUBLIC_PATHS = new Set(['/api/health', '/api/auth/login', '/api/auth/demo']);

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (req.path === '/api/health' || req.path === '/api/auth/login' || req.path === '/api/auth/demo' || req.path === '/api/auth/logout') {
    next();
    return;
  }
  if (!req.path.startsWith('/api/')) {
    next();
    return;
  }
  if (PUBLIC_PATHS.has(req.path)) {
    next();
    return;
  }
  const session = verifyToken(readSessionToken(req));
  if (!session) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  (req as Request & { operator?: string }).operator = session.username;
  next();
}
