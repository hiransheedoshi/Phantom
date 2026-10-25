import serverless from 'serverless-http';
import buildApp from '../../server';

// Netlify does not guarantee NODE_ENV inside functions; the app must always
// take its production branch here (no dev-time Vite server).
process.env.NODE_ENV = 'production';

type App = Awaited<ReturnType<typeof buildApp>>;
let appPromise: Promise<App> | null = null;

// Netlify rewrites `/api/*` onto this single function so every request talks to
// the same instance of the in-memory deception engine.
const FUNCTION_PREFIX = '/.netlify/functions/express/';

/**
 * Express is wrapped with serverless-http: Netlify hands us the original
 * request, we normalise the path (the rewrite above may have stripped the
 * `/api` segment) and let the existing router handle it.
 */
export const handler = serverless(
  (req: any, res: any, next?: (err?: unknown) => void) => {
    const url: string = req.url || '/';
    const q = url.indexOf('?');
    const path = q === -1 ? url : url.slice(0, q);
    const query = q === -1 ? '' : url.slice(q);
    if (path.startsWith(FUNCTION_PREFIX)) {
      req.url = `/api/${path.slice(FUNCTION_PREFIX.length)}${query}`;
      req.originalUrl = req.url;
    }

    if (!appPromise) appPromise = buildApp();
    appPromise
      .then((app) => app(req, res))
      .catch((err) => {
        if (next) next(err);
        else throw err;
      });
  },
  { binary: false },
);
