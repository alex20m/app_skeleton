/**
 * Stands in for the app's own API at the network boundary of a Playwright
 * page, so end-to-end tests need no database, no credentials and no test mode
 * compiled into the app.
 *
 * Start small — register the responses a test needs with `on` — and grow it
 * into a stateful fake of your API as the app grows, so a test can create
 * something and then see it listed. Keep its shapes and status codes the
 * same as the real routes', which the unit suite tests directly.
 *
 * Any request it does not know is answered 501 and recorded in `unhandled`,
 * and the fixture fails the test if that list is not empty — a fake that
 * silently answered everything would hide a UI calling a route that does not
 * exist.
 */

import type { Page, Route } from '@playwright/test';

type Handler = (body: unknown, url: URL) => { status?: number; body: unknown };
type Failure = { method: string; path: RegExp; status?: number; body?: unknown; text?: string; abort?: boolean };

export class FakeApi {
  /** Every request the UI made that changes something: `METHOD /path`, with its body. */
  calls: { call: string; body: unknown }[] = [];
  unhandled: string[] = [];
  private handlers: { method: string; path: RegExp; handle: Handler }[] = [];
  private failures: Failure[] = [];

  /** Answer `method path` with what `handle` returns. Later registrations win. */
  on(method: string, path: RegExp, handle: Handler) {
    this.handlers.unshift({ method, path, handle });
    return this;
  }

  /** The next matching request fails: with `status` and a JSON `body` or plain `text`, or as a network error. */
  failNext(method: string, path: RegExp, how: Omit<Failure, 'method' | 'path'>) {
    this.failures.push({ method, path, ...how });
  }

  callsTo(prefix: string) {
    return this.calls.filter((c) => c.call.startsWith(prefix));
  }

  async install(page: Page) {
    await page.route('**/api/**', (route) => this.handle(route));
  }

  private async handle(route: Route) {
    const req = route.request();
    const url = new URL(req.url());
    const method = req.method();
    const raw = req.postData();
    let body: unknown;
    try {
      body = raw ? JSON.parse(raw) : undefined;
    } catch {
      body = raw;
    }
    if (method !== 'GET') this.calls.push({ call: `${method} ${url.pathname}`, body });

    const failure = this.failures.find((f) => f.method === method && f.path.test(url.pathname));
    if (failure) {
      this.failures.splice(this.failures.indexOf(failure), 1);
      if (failure.abort) return route.abort('failed');
      if (failure.text !== undefined) return route.fulfill({ status: failure.status ?? 500, contentType: 'text/plain', body: failure.text });
      return json(route, failure.body ?? { error: 'Something broke' }, failure.status ?? 500);
    }

    const handler = this.handlers.find((h) => h.method === method && h.path.test(url.pathname));
    if (!handler) {
      this.unhandled.push(`${method} ${url.pathname}`);
      return json(route, { error: 'Not implemented in FakeApi' }, 501);
    }
    const answer = handler.handle(body, url);
    return json(route, answer.body, answer.status ?? 200);
  }
}

function json(route: Route, body: unknown, status = 200) {
  return route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
}
