// Mock for @/backend/providers/p-stream-mock to allow build without external dependency
// This shim provides the necessary types and basic functions used by the frontend.

export const targets = {
  BROWSER: "browser",
  BROWSER_EXTENSION: "browser-extension",
};

export interface ScrapeMedia {
  type: "movie" | "show";
  tmdbId: string;
  imdbId?: string;
  title: string;
  releaseYear: number;
  season?: {
    number: number;
    tmdbId: string;
  };
  episode?: {
    number: number;
    tmdbId: string;
  };
}

export interface MetaOutput {
  id: string;
  type: "source" | "embed";
  name: string;
  rank: number;
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

export interface RunOutput {
  stream: {
    type: "file" | "hls";
    id: string;
    flags: string[];
    qualities: Record<string, { type: "mp4" | "hls"; url: string }>;
    captions: any[];
  };
  sourceId: string;
  embedId?: string;
}

export interface FullScraperEvents {
  init?: (evt: { sourceIds: string[] }) => void;
  start?: (id: string) => void;
  update?: (evt: {
    id: string;
    status: "failure" | "pending" | "notfound" | "success" | "waiting";
    reason?: string;
    error?: any;
    percentage: number;
  }) => void;
  discoverEmbeds?: (evt: {
    sourceId: string;
    embeds: { id: string; embedScraperId: string }[];
  }) => void;
}

export type Fetcher = (
  url: string,
  ops: {
    headers: Record<string, string>;
    method: string;
    body: any;
    readHeaders: string[];
  },
) => Promise<{
  body: any;
  finalUrl: string;
  statusCode: number;
  headers: Headers;
}>;

export function makeSimpleProxyFetcher(
  proxyUrl: string,
  fetcher: any,
): Fetcher {
  return async (url, ops) => {
    // Simple mock implementation
    return {
      body: {},
      finalUrl: url,
      statusCode: 200,
      headers: new Headers(),
    };
  };
}

let m3u8ProxyUrl = "";
export function setM3U8ProxyUrl(url: string) {
  m3u8ProxyUrl = url;
}

export function labelToLanguageCode(label: string): string | null {
  const map: Record<string, string> = {
    english: "en",
    spanish: "es",
    french: "fr",
    german: "de",
    italian: "it",
    portuguese: "pt",
    russian: "ru",
    chinese: "zh",
    japanese: "ja",
    korean: "ko",
    arabic: "ar",
    hindi: "hi",
    turkish: "tr",
    dutch: "nl",
    polish: "pl",
    vietnamese: "vi",
    indonesian: "id",
    thai: "th",
  };
  return map[label.toLowerCase()] || null;
}

export function makeProviders(config: any) {
  return {
    runAll: async (options: any): Promise<RunOutput | null> => {
      console.log("Mock provider runAll called with:", options);
      return null;
    },
    listSources: () => [],
    listEmbeds: () => [],
  };
}

export function makeStandardFetcher(fetchInstance: any) {
  return (url: string, ops: any) => fetchInstance(url, ops);
}
