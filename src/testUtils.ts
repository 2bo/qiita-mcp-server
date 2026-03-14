import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { vi } from "vitest";
import { createServer } from "./server.js";

type QiitaService = NonNullable<Parameters<typeof createServer>[0]>;

const originalQiitaApiToken = process.env.QIITA_API_TOKEN;

export const clearQiitaApiToken = () => {
  delete process.env.QIITA_API_TOKEN;
};

export const restoreQiitaApiToken = () => {
  if (originalQiitaApiToken === undefined) {
    delete process.env.QIITA_API_TOKEN;
    return;
  }

  process.env.QIITA_API_TOKEN = originalQiitaApiToken;
};

export const jsonResponse = (body: unknown, init?: ResponseInit) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
    ...init,
  });

export const createMockQiitaService = (
  overrides: Partial<QiitaService> = {}
): QiitaService => ({
  getAuthenticatedUserItems: vi.fn().mockResolvedValue([]),
  getItem: vi.fn(),
  updateItem: vi.fn(),
  createItem: vi.fn(),
  getMarkdownRules: vi.fn(),
  ...overrides,
});

export const connectTestClient = async (mockService: QiitaService) => {
  const server = createServer(mockService);
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: "test-client", version: "1.0.0" });

  await server.connect(serverTransport);
  await client.connect(clientTransport);

  return { client, server };
};
