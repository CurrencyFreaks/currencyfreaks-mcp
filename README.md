# CurrencyFreaks MCP Server

[![npm version](https://img.shields.io/npm/v/%40currencyfreaks%2Fmcp?logo=npm&label=npm&color=CB3837)](https://www.npmjs.com/package/@currencyfreaks/mcp)
[![GitHub](https://img.shields.io/badge/GitHub-CurrencyFreaks-181717?logo=github)](https://github.com/CurrencyFreaks/currencyfreaks-mcp)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-5FA04E?logo=node.js&logoColor=white)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-MIT-16A34A)](https://github.com/CurrencyFreaks/currencyfreaks-mcp/blob/main/LICENSE)

Official MCP server for [CurrencyFreaks](https://currencyfreaks.com). Exposes 7 MCP tools for real-time and historical exchange rates and currency conversion across 1000+ fiat currencies, cryptocurrencies, and precious metals. Your AI assistant asks for rates in plain English; the MCP server handles the API calls.

Works with Claude Desktop, Claude Code, Cursor, Windsurf, VS Code, Cline, Codex, and any other MCP-compatible client.

| Item | Value |
|------|-------|
| Package | `@currencyfreaks/mcp` |
| Transport | `stdio` |
| Node.js | `>=18` |

## Quick Start

1. [Get a free CurrencyFreaks API key](https://currencyfreaks.com/signup) — 1,000 requests a month, no card required.

2. Cursor users can install in one click:

   [![Add to Cursor](https://cursor.com/deeplink/mcp-install-dark.svg)](https://cursor.com/install-mcp?name=currencyfreaks&config=eyJjb21tYW5kIjoibnB4IC15IEBjdXJyZW5jeWZyZWFrcy9tY3AiLCJlbnYiOnsiQ1VSUkVOQ1lGUkVBS1NfQVBJX0tFWSI6IiJ9fQ==)

3. Everyone else: add this to your MCP client config (see [Install by Client](#install-by-client) for the exact file path):

```json
{
  "mcpServers": {
    "currencyfreaks": {
      "command": "npx",
      "args": ["-y", "@currencyfreaks/mcp"],
      "env": {
        "CURRENCYFREAKS_API_KEY": "<YOUR_API_KEY>"
      }
    }
  }
}
```

4. Restart your client.

5. Test it: ask **"What's the current EUR to USD exchange rate?"**

## Table of Contents

- [Quick Start](#quick-start)
- [Install by Client](#install-by-client)
- [Verify It Works](#verify-it-works)
- [Tool Reference](#tool-reference)
- [Plan Requirements](#plan-requirements)
- [Prompt Examples](#prompt-examples)
- [Example Answers and Tool Output](#example-answers-and-tool-output)
- [Error Codes](#error-codes)
- [How It Works](#how-it-works)
- [Environment Variables](#environment-variables)
- [Building from Source](#building-from-source)
- [Troubleshooting](#troubleshooting)
- [Pricing](#pricing)
- [Links](#links)
- [License](#license)

## Install by Client

### Requirements

- Node.js 18 or later
- `npx` available in your terminal
- A CurrencyFreaks API key — [sign up free](https://currencyfreaks.com/signup)

### Claude Desktop

Add to `claude_desktop_config.json` (Settings → Developer → Edit Config):

```json
{
  "mcpServers": {
    "currencyfreaks": {
      "command": "npx",
      "args": ["-y", "@currencyfreaks/mcp"],
      "env": {
        "CURRENCYFREAKS_API_KEY": "<YOUR_API_KEY>"
      }
    }
  }
}
```

Restart Claude Desktop after saving.

### Claude Code

```bash
claude mcp add currencyfreaks --env CURRENCYFREAKS_API_KEY=<YOUR_API_KEY> -- npx -y @currencyfreaks/mcp
```

Start a new Claude Code session after adding the server.

### Cursor

One-click install:

[![Add to Cursor](https://cursor.com/deeplink/mcp-install-dark.svg)](https://cursor.com/install-mcp?name=currencyfreaks&config=eyJjb21tYW5kIjoibnB4IC15IEBjdXJyZW5jeWZyZWFrcy9tY3AiLCJlbnYiOnsiQ1VSUkVOQ1lGUkVBS1NfQVBJX0tFWSI6IiJ9fQ==)

Or add to `.cursor/mcp.json` manually:

```json
{
  "mcpServers": {
    "currencyfreaks": {
      "command": "npx",
      "args": ["-y", "@currencyfreaks/mcp"],
      "env": {
        "CURRENCYFREAKS_API_KEY": "<YOUR_API_KEY>"
      }
    }
  }
}
```

Restart Cursor after saving.

### Windsurf

Add to `~/.codeium/windsurf/mcp_config.json`:

```json
{
  "mcpServers": {
    "currencyfreaks": {
      "command": "npx",
      "args": ["-y", "@currencyfreaks/mcp"],
      "env": {
        "CURRENCYFREAKS_API_KEY": "<YOUR_API_KEY>"
      }
    }
  }
}
```

Restart Windsurf after saving.

### VS Code / GitHub Copilot

Add to your VS Code `settings.json`:

```json
{
  "mcp": {
    "servers": {
      "currencyfreaks": {
        "command": "npx",
        "args": ["-y", "@currencyfreaks/mcp"],
        "env": {
          "CURRENCYFREAKS_API_KEY": "<YOUR_API_KEY>"
        }
      }
    }
  }
}
```

Restart VS Code after saving.

### Cline

Open MCP Servers panel → **Configure** → **Advanced MCP Settings**. Add to `cline_mcp_settings.json`:

```json
{
  "mcpServers": {
    "currencyfreaks": {
      "command": "npx",
      "args": ["-y", "@currencyfreaks/mcp"],
      "env": {
        "CURRENCYFREAKS_API_KEY": "<YOUR_API_KEY>"
      }
    }
  }
}
```

Restart Cline after saving.

### Codex CLI

```bash
codex mcp add currencyfreaks --env CURRENCYFREAKS_API_KEY=<YOUR_API_KEY> -- npx -y @currencyfreaks/mcp
codex mcp list
```

Start a new Codex session after adding the server.

### Any Other MCP Client

Use this config:

```json
{
  "command": "npx",
  "args": ["-y", "@currencyfreaks/mcp"],
  "env": {
    "CURRENCYFREAKS_API_KEY": "<YOUR_API_KEY>"
  }
}
```

## Verify It Works

Try these after setup:

| Prompt | Expected tool |
|--------|---------------|
| What's the current EUR to USD exchange rate? | `get_latest_rates` with `symbols=EUR` |
| Convert 500 USD to PKR. | `convert_currency` |
| What was 1,000 GBP worth in JPY on 2026-01-15? | `convert_currency` with `date` |
| What was the EUR/USD rate on January 2nd, 2020? | `get_historical_rates` |
| Show daily USD to INR rates for the first week of August 2026. | `get_time_series` |
| How much has the yen moved against the dollar since June 1st? | `get_fluctuation` |
| What's the currency code for the Nepalese rupee? | `list_currencies` with `search=nepal` |
| What's 50 USD in the local currency of IP 182.186.18.9? | `ip_to_currency` |

## Tool Reference

All 7 tools wrap the CurrencyFreaks v2.0 REST API. Tools that take `symbols` accept a comma-separated list of currency codes (e.g. `EUR,GBP,PKR`), case-insensitive. Use `list_currencies` to look up a code — there are 1000+ across fiat, crypto, and metals.

Precious metals use ISO 4217 codes: `XAU` (gold), `XAG` (silver), `XPT` (platinum), `XPD` (palladium). The API returns all rates and amounts as strings to preserve precision.

### list_currencies

`GET /v2.0/currency-symbols` (compact) or `GET /v2.0/supported-currencies` (detailed) — the supported currency catalogue. No API key required.

| Parameter | Required | Description |
|-----------|----------|-------------|
| `search` | No | Case-insensitive substring matched against code, name, or (with `detailed`) country name, e.g. `rupee`, `PK`, `bitcoin` |
| `detailed` | No | `true` returns country, status (`AVAILABLE`/`DEPRECATED`), the `availableFrom`/`availableUntil` historical data range, and flag icon per currency. Default `false`. Combine with `search`; the full detailed catalogue is ~270 KB. |

### get_latest_rates

`GET /v2.0/rates/latest` — latest rates for one or more currencies against a base. Refresh frequency depends on plan: daily on Developer (free), hourly on Starter, every 10 minutes on Growth, every 60 seconds on Professional and above.

| Parameter | Required | Description |
|-----------|----------|-------------|
| `symbols` | No | Comma-separated currency codes. Omit for all 1000+ currencies. |
| `base` | No | Base currency code. Default `USD`. Paid plans only. |

### convert_currency

`GET /v2.0/convert/latest`, or `GET /v2.0/convert/historical` when `date` is given — convert an amount between two currencies. Paid plans only.

| Parameter | Required | Description |
|-----------|----------|-------------|
| `from` | Yes | Currency code to convert from |
| `to` | Yes | Currency code to convert to |
| `amount` | No | Amount to convert, greater than 0. Default `1.0`. |
| `date` | No | `YYYY-MM-DD`. Converts at that day's rate instead of the latest. |

### get_historical_rates

`GET /v2.0/rates/historical` — rates on a specific past date. Major fiat currencies go back to 1984-11-28; newer currencies and crypto start from their own listing date. Paid plans only.

| Parameter | Required | Description |
|-----------|----------|-------------|
| `date` | Yes | `YYYY-MM-DD` |
| `symbols` | No | Comma-separated currency codes. Omit for all. |
| `base` | No | Base currency code. Default `USD`. |

### get_time_series

`GET /v2.0/timeseries` — daily rates between two dates, one entry per day. Professional plan and above.

| Parameter | Required | Description |
|-----------|----------|-------------|
| `startDate` | Yes | `YYYY-MM-DD` |
| `endDate` | Yes | `YYYY-MM-DD` |
| `symbols` | No | Comma-separated currency codes |
| `base` | No | Base currency code. Default `USD`. |

### get_fluctuation

`GET /v2.0/fluctuation` — how each currency moved between two dates: start rate, end rate, absolute change, and percent change. Professional plan and above.

Sign convention: `change` is `startRate - endRate`. A positive `change` means the rate fell (the symbol currency strengthened against the base); a negative `change` means the rate rose (the symbol currency weakened).

| Parameter | Required | Description |
|-----------|----------|-------------|
| `startDate` | Yes | `YYYY-MM-DD` |
| `endDate` | No | `YYYY-MM-DD`. Defaults to the day before today. |
| `symbols` | No | Comma-separated currency codes |
| `base` | No | Base currency code. Default `USD`. |

### ip_to_currency

`GET /v2.0/iptocurrency` — resolves the local currency from an IP address's geolocation and converts an amount into it. The target currency comes back in the `to` field. Growth plan and above.

| Parameter | Required | Description |
|-----------|----------|-------------|
| `from` | Yes | Currency code to convert from |
| `ip` | No | IPv4 or IPv6 address. Omit to use the caller's own IP. |
| `amount` | No | Amount to convert. Default `1.0`. |

## Plan Requirements

| Feature | Minimum plan |
|---------|--------------|
| `list_currencies` | None (no API key needed) |
| `get_latest_rates` with default USD base | Developer (free) |
| `base` parameter on any tool | Starter |
| `convert_currency` | Starter |
| `get_historical_rates` | Starter |
| `ip_to_currency` | Growth |
| `get_time_series` | Professional |
| `get_fluctuation` | Professional |

Calls that exceed the plan return a `402` error with guidance (see [Error Codes](#error-codes)).

## Prompt Examples

### Live rates

- What's the current EUR to USD exchange rate?
- Give me the latest rates for GBP, JPY, and CHF against the euro.
- What's bitcoin worth in USD right now?
- What's the gold price in euros?

### Conversion

- Convert 250 USD to Indian rupees.
- How many yen is 1,200 euros?
- What was 500 GBP worth in USD on 2025-12-31?

### Historical data

- What was the USD to PKR rate on January 2nd, 2020?
- Show me daily EUR/USD rates for Q1 2026.
- Compare the pound and the euro against the dollar over the last 30 days.

### Price changes

- How much has the Turkish lira dropped against the dollar since January 1st?
- Did ETH go up or down versus USD this month, and by how much?

### Discovery

- What's the currency code for the Kazakhstani tenge?
- Which currencies does CurrencyFreaks support for Africa?
- How far back does historical data go for the Nigerian naira?

## Example Answers and Tool Output

The text answers show what a client might say; exact wording depends on the model. JSON blocks are raw tool output.

### Latest rates

**Prompt:** What are the latest EUR, GBP, and PKR rates against the dollar?

**Example answer:** As of 2026-08-25 13:26 UTC, 1 USD buys 0.9279 EUR, 0.8173 GBP, or 281.62 PKR.

```json
{
  "date": "2026-08-25 13:26:00+00",
  "base": "USD",
  "rates": {
    "EUR": "0.9278605451274349",
    "GBP": "0.8172754173817152",
    "PKR": "281.6212943333344",
    "USD": "1.0"
  }
}
```

### Conversion

**Prompt:** Convert 500 USD to PKR.

**Example answer:** 500 USD is 140,841.48 PKR at a rate of 281.683.

```json
{
  "date": "2026-08-25 15:22:00+00",
  "from": "USD",
  "to": "PKR",
  "rate": "281.683",
  "givenAmount": "500.0",
  "convertedAmount": "140841.475"
}
```

### Fluctuation

**Prompt:** How did the Pakistani rupee move against the pound between June 1st and June 15th, 2026?

**Example answer:** PKR strengthened against the pound, going from 254.331 to 243.874 per GBP, a move of 10.457 (4.11%).

```json
{
  "startDate": "2026-06-01",
  "endDate": "2026-06-15",
  "base": "GBP",
  "rateFluctuations": {
    "PKR": {
      "startRate": "254.331",
      "endRate": "243.874",
      "change": "10.457",
      "percentChange": "4.11"
    }
  }
}
```

### Currency lookup

**Prompt:** What's the currency code for the Nepalese rupee?

**Example answer:** The Nepalese rupee is `NPR`.

```json
{
  "count": 6,
  "currencies": {
    "SCR": "Seychellois Rupee",
    "MUR": "Mauritius Rupee",
    "INR": "Indian Rupee",
    "PKR": "Pakistani Rupee",
    "LKR": "Sri Lankan Rupee",
    "NPR": "Nepalese Rupee"
  }
}
```

## Error Codes

Tool calls never crash the server. Upstream errors are returned as structured tool results with `error`, `code`, `message`, and a `guidance` field so the client can explain what went wrong instead of echoing a status code.

| Code | Meaning |
|------|---------|
| `400` | Missing API key, or invalid parameters (bad currency code, date format, amount, or IP address) |
| `401` | API key is invalid or inactive — check `CURRENCYFREAKS_API_KEY` in your client config |
| `402` | Feature not included in the current plan — see [Plan Requirements](#plan-requirements) |
| `404` | Rates not found for the requested currency, date, or interval |
| `429` | Monthly request quota exhausted — upgrade or wait for the reset |
| `499` | Request to the upstream API timed out (see `CURRENCYFREAKS_REQUEST_TIMEOUT_MS`) |
| `502` | Server could not reach the upstream API |

Example error result for an invalid key:

```json
{
  "error": "Invalid Api Access Exception",
  "code": 401,
  "message": "Provided API key is invalid. [Contact tech. support for assistance at support@currencyfreaks.com]",
  "guidance": "The API key is invalid or inactive. Check CURRENCYFREAKS_API_KEY in your MCP client config and confirm the key is active on the CurrencyFreaks dashboard."
}
```

## How It Works

This is a stdio MCP server that wraps the CurrencyFreaks v2.0 REST API.

At runtime:

1. Your MCP client starts the server process via `npx`.
2. The client reads the tool list.
3. When a prompt matches a tool, the client calls it.
4. The server validates inputs, calls CurrencyFreaks, and returns structured JSON.

The API key is read from the environment on each call and sent as the `apikey` query parameter. The catalogue endpoints behind `list_currencies` are public, so that tool works even before a key is configured.

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `CURRENCYFREAKS_API_KEY` | Yes | | Your CurrencyFreaks API key |
| `CURRENCYFREAKS_REQUEST_TIMEOUT_MS` | No | `15000` | Upstream request timeout in ms |

## Building from Source

```bash
git clone https://github.com/CurrencyFreaks/currencyfreaks-mcp.git
cd currencyfreaks-mcp
npm install
npm run build
```

Run it directly:

```bash
CURRENCYFREAKS_API_KEY=<YOUR_KEY> node dist/cli.js
```

Inspect with the MCP Inspector:

```bash
CURRENCYFREAKS_API_KEY=<YOUR_KEY> npx @modelcontextprotocol/inspector node dist/cli.js
```

## Troubleshooting

**Client uses an old tool list after updating:** Restart the client and confirm it loaded the latest npm version.

**400 "Please provide API Key":** `CURRENCYFREAKS_API_KEY` is not set in your MCP client config's `env` block.

**401 errors:** The key is wrong or inactive. Copy it again from the [CurrencyFreaks dashboard](https://currencyfreaks.com/dashboard).

**402 errors:** The tool needs a higher plan. See [Plan Requirements](#plan-requirements). On the Developer (free) plan only `get_latest_rates` with the default USD base and `list_currencies` work.

**404 "Rates of provided currency X are available from A to B":** The date is outside that currency's data range. Call `list_currencies` with `search=X` and `detailed=true` to see `availableFrom` and `availableUntil`.

**Huge responses:** Always pass `symbols` to the rate tools and `search` to `list_currencies`. Without them the API returns all 1000+ currencies.

**499 timeouts:** The upstream API did not respond in time. Increase `CURRENCYFREAKS_REQUEST_TIMEOUT_MS` (default: 15000 ms).

## Pricing

Developer plan is free with 1,000 requests a month, no card required. Paid plans add base currency selection, conversion, historical data, time series, fluctuation, and IP-to-currency, with faster refresh rates. See the [CurrencyFreaks pricing page](https://currencyfreaks.com/pricing).

## Links

- [CurrencyFreaks Website](https://currencyfreaks.com)
- [API Documentation](https://currencyfreaks.com/documentation)
- [Supported Currencies](https://currencyfreaks.com/supported-currencies)
- [Pricing](https://currencyfreaks.com/pricing)
- [Sign Up Free](https://currencyfreaks.com/signup)
- [GitHub Repository](https://github.com/CurrencyFreaks/currencyfreaks-mcp)

## License

[MIT](LICENSE)
