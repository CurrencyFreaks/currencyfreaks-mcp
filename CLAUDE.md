# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

MCP server (stdio transport) exposing the CurrencyFreaks v2.0 API as 7 MCP tools. Published to npm as `@currencyfreaks/mcp`, run by clients via `npx`. TypeScript, ESM (`"type": "module"`), Node >= 18, no test suite or linter configured. Sibling project to `@commoditypriceapi/mcp` and follows the same layout.

## Commands

```bash
npm run build   # tsc → dist/, then chmod +x dist/cli.js
npm run dev     # tsc --watch
npm start       # node dist/cli.js (requires CURRENCYFREAKS_API_KEY env var)

# Manual testing with the MCP Inspector:
CURRENCYFREAKS_API_KEY=<KEY> npx @modelcontextprotocol/inspector node dist/cli.js
```

## Architecture

Three-layer flow, one file each in `src/`:

- `cli.ts` — bin entry point. Creates the server and connects it to `StdioServerTransport`. **stdout is reserved for the MCP protocol stream — all logging must go to stderr** (`console.error`).
- `server.ts` — `createServer()` registers all 7 tools on an `McpServer`, with zod input schemas. Every tool handler is a thin try/catch wrapper around `callCurrencyFreaksApi()`: success → `textResult()` (pretty-printed JSON), failure → `errorResult()`. Two tools do more than pass through: `convert_currency` picks `/convert/latest` or `/convert/historical` based on whether `date` is set, and `list_currencies` filters the catalogue client-side by `search` (the detailed catalogue is ~270 KB and some entries have null `currencyName`/`countryName`, so filtering must be null-safe).
- `client.ts` — `callCurrencyFreaksApi(path, params)` is the single HTTP function all tools go through. Hardcodes `BASE_URL` (`https://api.currencyfreaks.com/v2.0`), reads `CURRENCYFREAKS_API_KEY` at call time (not startup), sends it as the `apikey` query param (the only auth method the API supports), and skips the key for the public catalogue paths in `PUBLIC_PATHS`. Applies an AbortController timeout (`CURRENCYFREAKS_REQUEST_TIMEOUT_MS`, default 15000). All failures — missing key (400), timeout (499), unreachable (502), non-JSON body, upstream error status — are normalized into `CurrencyFreaksApiError { code, errorType, message, path }`. The upstream error envelope is `{ timestamp, status, error, message, path }`.

`index.ts` is the library export (`createServer` only).

### Error-handling contract

Tool calls must never crash the server. `errorResult()` in `server.ts` converts `CurrencyFreaksApiError` into a structured `isError` tool result with `error`, `code`, `message`, and a human-readable `guidance` string. `guidanceFor()` maps status codes 400/401/402/404/429/499/502 to actionable advice and inspects the upstream message text to distinguish sub-cases (missing key vs bad date vs bad IP, etc.). Keep this contract when adding tools: wrap the handler body in try/catch and route errors through `errorResult()`.

### Plan gating

The API returns 402 for features outside the plan. Tool descriptions state the minimum plan so the model can explain failures: `base` param, conversion, and historical rates need any paid plan; time series and fluctuation need Professional; IP-to-currency needs Growth. Keep these notes accurate if CurrencyFreaks changes its tiers.

### Adding a tool

Register it in `createServer()` (`server.ts`) following the existing pattern: `server.registerTool(name, { title, description, inputSchema }, handler)`. Reuse `symbolsParam`/`baseParam`/`dateParam`/`amountParam` zod schemas where applicable, and update the tools table and Plan Requirements in README.md.
