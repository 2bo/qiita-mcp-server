import { afterEach, describe, expect, it, vi } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createServer } from "../../src/server.js";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("createServer", () => {
  it("registers the Qiita tools over MCP", async () => {
    const mockService = {
      getAuthenticatedUserItems: vi.fn().mockResolvedValue([]),
      getItem: vi.fn().mockResolvedValue({ id: "item-1" }),
      updateItem: vi.fn().mockResolvedValue({ id: "item-1", title: "Updated" }),
      createItem: vi.fn().mockResolvedValue({ id: "item-1", title: "Created" }),
      getMarkdownRules: vi.fn().mockResolvedValue("rules"),
    };
    const server = createServer(mockService);
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    const client = new Client({ name: "test-client", version: "1.0.0" });

    await server.connect(serverTransport);
    await client.connect(clientTransport);

    const tools = await client.listTools();

    expect(tools.tools.map((tool) => tool.name)).toEqual([
      "get_my_qiita_articles",
      "get_qiita_item",
      "update_qiita_article",
      "post_qiita_article",
      "get_qiita_markdown_rules",
    ]);
  });

  it("applies default pagination when called through MCP", async () => {
    const mockService = {
      getAuthenticatedUserItems: vi.fn().mockResolvedValue([{ id: "item-1" }]),
      getItem: vi.fn(),
      updateItem: vi.fn(),
      createItem: vi.fn(),
      getMarkdownRules: vi.fn(),
    };
    const server = createServer(mockService);
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    const client = new Client({ name: "test-client", version: "1.0.0" });

    await server.connect(serverTransport);
    await client.connect(clientTransport);

    const result = await client.callTool({
      name: "get_my_qiita_articles",
      arguments: {},
    });

    expect(mockService.getAuthenticatedUserItems).toHaveBeenCalledWith(1, 20);
    expect(result.isError).toBeUndefined();
    expect(result.content).toEqual([
      {
        type: "text",
        text: JSON.stringify([{ id: "item-1" }], null, 2),
      },
    ]);
  });

  it("returns tool failures as MCP error results", async () => {
    const mockService = {
      getAuthenticatedUserItems: vi.fn().mockRejectedValue(new Error("boom")),
      getItem: vi.fn(),
      updateItem: vi.fn(),
      createItem: vi.fn(),
      getMarkdownRules: vi.fn(),
    };
    const server = createServer(mockService);
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    const client = new Client({ name: "test-client", version: "1.0.0" });

    await server.connect(serverTransport);
    await client.connect(clientTransport);

    const result = await client.callTool({
      name: "get_my_qiita_articles",
      arguments: { page: 1, per_page: 20 },
    });

    expect(result.isError).toBe(true);
    expect(result.content).toEqual([
      {
        type: "text",
        text: "Error: Error fetching Qiita items: boom",
      },
    ]);
  });
});
