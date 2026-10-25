import type { IncomingMessage, ServerResponse } from 'http';
import buildApp from '../server';

let appPromise: ReturnType<typeof buildApp> | null = null;

/**
 * Single catch-all serverless entry point: every /api/* request is handed to
 * the same Express application so the in-memory deception engine keeps its
 * state between requests (shared warm instance).
 */
export default async function handler(
  req: IncomingMessage & { body?: unknown; _body?: boolean },
  res: ServerResponse,
): Promise<void> {
  // Vercel may have already consumed and parsed the body. Signal body-parser
  // to skip re-reading the (already drained) stream so JSON routes still work.
  if (typeof req.body === 'object' && req.body !== null && !req._body) {
    req._body = true;
  }

  if (!appPromise) appPromise = buildApp();
  const app = await appPromise;
  app(req, res);
}
