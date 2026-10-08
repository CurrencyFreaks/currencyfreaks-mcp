const BASE_URL = "https://api.currencyfreaks.com/v2.0";

/**
 * Endpoints that work without an API key. Everything else requires
 * CURRENCYFREAKS_API_KEY.
 */
const PUBLIC_PATHS = new Set([
  "/supported-currencies",
  "/currency-symbols",
  "/historical-data-limits",
]);

export class CurrencyFreaksApiError extends Error {
  code: number;
  errorType: string;
  path?: string;

  constructor(code: number, errorType: string, message: string, path?: string) {
    super(message);
    this.name = "CurrencyFreaksApiError";
    this.code = code;
    this.errorType = errorType;
    this.path = path;
  }
}

function getApiKey(): string {
  const key = process.env.CURRENCYFREAKS_API_KEY;
  if (!key) {
    throw new CurrencyFreaksApiError(
      400,
      "MISSING_API_KEY",
      "CURRENCYFREAKS_API_KEY is not set. Add it to your MCP client config's env block. Get a free key at https://currencyfreaks.com/signup."
    );
  }
  return key;
}

/**
 * Calls a CurrencyFreaks v2.0 endpoint.
 *
 * The API authenticates via the `apikey` query parameter only. Public lookup
 * endpoints (supported-currencies, currency-symbols, historical-data-limits)
 * are called without a key so they keep working even when none is configured.
 *
 * Every error uses the same JSON envelope:
 *   { timestamp, status, error, message, path }
 * `status` repeats the HTTP code, `error` names the exception type, and
 * `message` carries the human-readable text. All failures — timeout (499),
 * unreachable (502), non-JSON body, upstream error status — are normalized into
 * CurrencyFreaksApiError. A 206 Partial Response is still `response.ok` and the
 * body is passed through as-is.
 */
export async function callCurrencyFreaksApi<T = unknown>(
  path: string,
  params: Record<string, string | number | undefined> = {}
): Promise<T> {
  const url = new URL(BASE_URL + path);

  if (!PUBLIC_PATHS.has(path)) {
    url.searchParams.set("apikey", getApiKey());
  }

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }

  const timeoutMs = Number(process.env.CURRENCYFREAKS_REQUEST_TIMEOUT_MS ?? 15000);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(url.toString(), {
      method: "GET",
      headers: { accept: "application/json" },
      signal: controller.signal,
    });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new CurrencyFreaksApiError(
        499,
        "REQUEST_TIMEOUT",
        `Request to CurrencyFreaks timed out after ${timeoutMs}ms.`
      );
    }
    throw new CurrencyFreaksApiError(
      502,
      "UPSTREAM_UNREACHABLE",
      `Could not reach CurrencyFreaks: ${(err as Error).message}`
    );
  } finally {
    clearTimeout(timer);
  }

  const text = await response.text();
  let body: any;
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    throw new CurrencyFreaksApiError(
      response.status,
      "INVALID_RESPONSE",
      `CurrencyFreaks returned a non-JSON response: ${text.slice(0, 500)}`
    );
  }

  if (!response.ok) {
    throw new CurrencyFreaksApiError(
      response.status,
      body.error ?? "UNKNOWN_ERROR",
      body.message ?? `CurrencyFreaks request failed with status ${response.status}.`,
      body.path
    );
  }

  return body as T;
}
