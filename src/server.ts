import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { callCurrencyFreaksApi, CurrencyFreaksApiError } from "./client.js";

const symbolsParam = z
  .string()
  .optional()
  .describe(
    "Comma-separated currency codes to return, e.g. 'EUR,GBP,PKR' or 'BTC,ETH' or 'XAU,XAG'. Case-insensitive. Omit to get every supported currency (1000+ entries) — prefer passing symbols to keep responses small. Use list_currencies to look up a code."
  );

const baseParam = z
  .string()
  .optional()
  .describe(
    "Base currency code the rates are expressed against (e.g. 'EUR'). Default is USD. Changing the base requires the Starter plan or above (any paid plan)."
  );

const dateParam = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format.")
  .describe("Date in YYYY-MM-DD format.");

const amountParam = z
  .number()
  .positive()
  .optional()
  .describe("Amount to convert. Must be greater than 0. Default is 1.0.");

function textResult(data: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(data, null, 2),
      },
    ],
  };
}

function errorResult(err: unknown) {
  if (err instanceof CurrencyFreaksApiError) {
    return {
      isError: true,
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              error: err.errorType,
              code: err.code,
              message: err.message,
              guidance: guidanceFor(err.code, err.errorType, err.message),
            },
            null,
            2
          ),
        },
      ],
    };
  }
  return {
    isError: true,
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(
          { error: "UNEXPECTED_ERROR", message: (err as Error).message },
          null,
          2
        ),
      },
    ],
  };
}

function guidanceFor(code: number, errorType: string, message: string): string {
  const msg = message.toLowerCase();
  switch (code) {
    case 400:
      if (errorType === "MISSING_API_KEY" || msg.includes("api key")) {
        return "Set CURRENCYFREAKS_API_KEY in your MCP client config's env block. Get a free key at https://currencyfreaks.com/signup.";
      }
      if (msg.includes("date")) {
        return "Check the date parameters: they must be YYYY-MM-DD, the start date cannot be after today or after the end date.";
      }
      if (msg.includes("amount")) {
        return "Pass a positive decimal amount, e.g. 100 or 49.99.";
      }
      if (msg.includes("ip address")) {
        return "Pass a valid IPv4 or IPv6 address, or omit 'ip' to use the caller's own address.";
      }
      return "One or more parameters are invalid for this endpoint. Check currency codes with list_currencies and date formats (YYYY-MM-DD).";
    case 401:
      return "The API key is invalid or inactive. Check CURRENCYFREAKS_API_KEY in your MCP client config and confirm the key is active on the CurrencyFreaks dashboard.";
    case 402:
      return "This feature is not included in the current plan. The Developer (free) plan only covers latest rates with USD as base. Changing the base currency, conversion, and historical rates need Starter or above; IP-to-currency needs Growth or above; time series and fluctuation need Professional or above. See https://currencyfreaks.com/pricing.";
    case 404:
      if (msg.includes("available from")) {
        return "The requested date is outside the range CurrencyFreaks has for that currency. The message above gives the available range; use list_currencies with detailed=true to see availableFrom/availableUntil per currency.";
      }
      if (msg.includes("geolocation")) {
        return "The IP address could not be geolocated. Try a different public IP address.";
      }
      if (msg.includes("currency") || msg.includes("symbols") || msg.includes("base")) {
        return "One or more currency codes are not supported, or no rates exist for the requested interval. Call list_currencies to find valid codes.";
      }
      if (msg.includes("date")) {
        return "No rates exist for that date. Try a nearby business day, or check the currency's availability with list_currencies (detailed=true).";
      }
      return "The requested resource was not found.";
    case 429:
      return "The monthly request quota for this plan is exhausted. Upgrade the plan at https://currencyfreaks.com/pricing or wait for the quota to reset.";
    case 499:
      return "The upstream request timed out. Retry, or raise CURRENCYFREAKS_REQUEST_TIMEOUT_MS (default 15000).";
    case 502:
      return "CurrencyFreaks could not be reached. Check network connectivity and retry.";
    default:
      return "CurrencyFreaks returned an error outside the documented cases; treat the message above as authoritative.";
  }
}

type SupportedCurrency = {
  currencyCode: string;
  currencyName: string | null;
  countryCode: string | null;
  countryName: string | null;
  status: string;
  availableFrom: string;
  availableUntil: string;
  icon: string;
};

// Some catalogue entries have null names or countries, so every field is
// treated as optional here.
function matches(
  search: string,
  ...fields: Array<string | null | undefined>
): boolean {
  const q = search.toLowerCase();
  return fields.some((f) => typeof f === "string" && f.toLowerCase().includes(q));
}

export function createServer(): McpServer {
  const server = new McpServer({
    name: "currencyfreaks-mcp",
    version: "1.0.0",
  });

  server.registerTool(
    "list_currencies",
    {
      title: "List supported currencies",
      description:
        "Returns the currencies supported by CurrencyFreaks: 1000+ fiat currencies, cryptocurrencies, and precious metals (XAU gold, XAG silver, XPT platinum, XPD palladium). Use it to find a currency code before calling rate or conversion tools. No API key needed. " +
        "By default returns a compact code → name map. Pass 'search' to filter by code, name, or country (e.g. 'rupee', 'PK', 'bitcoin'). Pass detailed=true for country, status (AVAILABLE/DEPRECATED), and the availableFrom/availableUntil date range of historical data per currency — combine with 'search' because the full detailed catalogue is very large.",
      inputSchema: {
        search: z
          .string()
          .optional()
          .describe("Case-insensitive substring to match against currency code, name, or (with detailed=true) country name."),
        detailed: z
          .boolean()
          .optional()
          .describe("Return full details per currency (country, status, historical availability range, icon). Default false."),
      },
    },
    async ({ search, detailed }) => {
      try {
        if (detailed) {
          const data = await callCurrencyFreaksApi<{
            supportedCurrenciesMap: Record<string, SupportedCurrency>;
          }>("/supported-currencies");
          let entries = Object.values(data.supportedCurrenciesMap);
          if (search) {
            entries = entries.filter((c) =>
              matches(search, c.currencyCode, c.currencyName, c.countryName)
            );
          }
          return textResult({ count: entries.length, currencies: entries });
        }

        const data = await callCurrencyFreaksApi<{
          currencySymbols: Record<string, string>;
        }>("/currency-symbols");
        let entries = Object.entries(data.currencySymbols);
        if (search) {
          entries = entries.filter(([code, name]) => matches(search, code, name));
        }
        return textResult({
          count: entries.length,
          currencies: Object.fromEntries(entries),
        });
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  server.registerTool(
    "get_latest_rates",
    {
      title: "Get latest exchange rates",
      description:
        "Returns the latest exchange rates for one or more currencies against a base currency (USD by default). Covers fiat, crypto, and metals. Rates are returned as strings; refresh frequency depends on the plan (daily on Developer/free, hourly on Starter, every 10 minutes on Growth, every 60 seconds on Professional). Omit 'symbols' to get all 1000+ currencies.",
      inputSchema: {
        symbols: symbolsParam,
        base: baseParam,
      },
    },
    async ({ symbols, base }) => {
      try {
        const data = await callCurrencyFreaksApi("/rates/latest", { symbols, base });
        return textResult(data);
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  server.registerTool(
    "convert_currency",
    {
      title: "Convert an amount between currencies",
      description:
        "Converts an amount from one currency to another using the latest rate, or the rate on a past date if 'date' is given. Returns the rate used, the given amount, and the converted amount. Starter plan and above (any paid plan).",
      inputSchema: {
        from: z.string().describe("Currency code to convert from, e.g. 'USD'."),
        to: z.string().describe("Currency code to convert to, e.g. 'EUR'."),
        amount: amountParam,
        date: dateParam
          .optional()
          .describe("Optional past date (YYYY-MM-DD) to convert at that day's rate instead of the latest rate."),
      },
    },
    async ({ from, to, amount, date }) => {
      try {
        const data = date
          ? await callCurrencyFreaksApi("/convert/historical", { from, to, amount, date })
          : await callCurrencyFreaksApi("/convert/latest", { from, to, amount });
        return textResult(data);
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  server.registerTool(
    "get_historical_rates",
    {
      title: "Get historical exchange rates",
      description:
        "Returns exchange rates for a specific past date. Major fiat currencies go back to 1984-11-28; newer currencies and crypto start from their own listing date (see list_currencies with detailed=true). Starter plan and above (any paid plan).",
      inputSchema: {
        date: dateParam,
        symbols: symbolsParam,
        base: baseParam,
      },
    },
    async ({ date, symbols, base }) => {
      try {
        const data = await callCurrencyFreaksApi("/rates/historical", { date, symbols, base });
        return textResult(data);
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  server.registerTool(
    "get_time_series",
    {
      title: "Get daily exchange rate time series",
      description:
        "Returns daily exchange rates for one or more currencies between two dates, one entry per day. Professional plan and above.",
      inputSchema: {
        startDate: dateParam.describe("Start date in YYYY-MM-DD format."),
        endDate: dateParam.describe("End date in YYYY-MM-DD format."),
        symbols: symbolsParam,
        base: baseParam,
      },
    },
    async ({ startDate, endDate, symbols, base }) => {
      try {
        const data = await callCurrencyFreaksApi("/timeseries", {
          startDate,
          endDate,
          symbols,
          base,
        });
        return textResult(data);
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  server.registerTool(
    "get_fluctuation",
    {
      title: "Get exchange rate fluctuation",
      description:
        "Returns how currencies moved between two dates: start rate, end rate, absolute change, and percent change for each symbol against the base. Note the sign convention: change = startRate - endRate, so a POSITIVE change means fewer units per base, i.e. the symbol currency strengthened against the base, and a NEGATIVE change means the rate rose and the symbol currency weakened. Professional plan and above.",
      inputSchema: {
        startDate: dateParam.describe("Start date in YYYY-MM-DD format."),
        endDate: dateParam
          .optional()
          .describe("End date in YYYY-MM-DD format. Defaults to the day before today."),
        symbols: symbolsParam,
        base: baseParam,
      },
    },
    async ({ startDate, endDate, symbols, base }) => {
      try {
        const data = await callCurrencyFreaksApi("/fluctuation", {
          startDate,
          endDate,
          symbols,
          base,
        });
        return textResult(data);
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  server.registerTool(
    "ip_to_currency",
    {
      title: "Convert to the local currency of an IP address",
      description:
        "Resolves the local currency from an IP address's geolocation and converts an amount into it using the latest rate. Useful for localizing prices for a visitor. The target currency is returned in the 'to' field. Growth plan and above.",
      inputSchema: {
        from: z.string().describe("Currency code to convert from, e.g. 'USD'."),
        ip: z
          .string()
          .optional()
          .describe("IPv4 or IPv6 address to geolocate. Omit to use the caller's own IP address."),
        amount: amountParam,
      },
    },
    async ({ from, ip, amount }) => {
      try {
        const data = await callCurrencyFreaksApi("/iptocurrency", { from, ip, amount });
        return textResult(data);
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  return server;
}
