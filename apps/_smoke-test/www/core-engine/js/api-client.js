/* App Factory Core Engine — Optional Modular PHP POST API Client
 * Matches Erdem's standard POST-first modular backend architecture:
 * Main Client -> Middleware -> Modules -> Database Layer
 */

export class ApiClient {
  constructor({ baseUrl = '', defaultHeaders = {}, timeoutMs = 12000 } = {}) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.defaultHeaders = { 'Content-Type': 'application/json', ...defaultHeaders };
    this.timeoutMs = timeoutMs;
    this.beforeHooks = [];
    this.afterHooks = [];
  }

  configure(options = {}) {
    if (options.baseUrl !== undefined) this.baseUrl = options.baseUrl.replace(/\/$/, '');
    if (options.defaultHeaders) this.defaultHeaders = { ...this.defaultHeaders, ...options.defaultHeaders };
    if (options.timeoutMs) this.timeoutMs = options.timeoutMs;
  }

  useBefore(fn) {
    this.beforeHooks.push(fn);
  }

  useAfter(fn) {
    this.afterHooks.push(fn);
  }

  async post(moduleName, action, payload = {}) {
    if (!this.baseUrl) {
      throw new Error('ApiClient baseUrl is not configured (offline-first mode)');
    }
    let req = {
      url: `${this.baseUrl}/api.php`,
      headers: { ...this.defaultHeaders },
      body: { module: moduleName, action, payload }
    };
    for (const hook of this.beforeHooks) {
      req = (await hook(req)) || req;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await fetch(req.url, {
        method: 'POST',
        headers: req.headers,
        body: JSON.stringify(req.body),
        signal: controller.signal
      });
      const data = await response.json();
      let result = { ok: response.ok && data.success !== false, status: response.status, data };
      for (const hook of this.afterHooks) {
        result = (await hook(result)) || result;
      }
      if (!result.ok) {
        throw new Error(data.message || `API Error (${response.status})`);
      }
      return result.data;
    } finally {
      clearTimeout(timer);
    }
  }
}

export const apiClient = new ApiClient();
