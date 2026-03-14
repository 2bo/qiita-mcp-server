import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const originalToken = process.env.QIITA_API_TOKEN;

const jsonResponse = (body: unknown, init?: ResponseInit) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
    ...init,
  });

describe("getToolDefinitions", () => {
  beforeEach(() => {
    delete process.env.QIITA_API_TOKEN;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    if (originalToken === undefined) {
      delete process.env.QIITA_API_TOKEN;
    } else {
      process.env.QIITA_API_TOKEN = originalToken;
    }
  });

  it("exposes the expected tool names", async () => {
    const { getToolDefinitions } = await importCurrentModule();

    expect(getToolDefinitions().map((tool) => tool.name)).toEqual([
      "get_my_qiita_articles",
      "get_qiita_item",
      "update_qiita_article",
      "post_qiita_article",
      "get_qiita_markdown_rules",
    ]);
  });

  it("returns a success response for get_qiita_item", async () => {
    process.env.QIITA_API_TOKEN = "test-token";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({
          id: "item-1",
          title: "Article",
          rendered_body: "<p>Article</p>",
          user: { id: "user-1", facebook_id: "fb" },
        })
      )
    );

    const { getToolDefinitions } = await importCurrentModule();
    const tool = getToolDefinitions().find(({ name }) => name === "get_qiita_item");
    const result = await tool?.handler({ item_id: "item-1" });

    expect(result).toEqual({
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              id: "item-1",
              title: "Article",
              user: { id: "user-1" },
            },
            null,
            2
          ),
        },
      ],
    });
  });

  it("returns an MCP error result when the token is missing", async () => {
    const { getToolDefinitions } = await importCurrentModule();
    const tool = getToolDefinitions().find(
      ({ name }) => name === "get_qiita_markdown_rules"
    );
    const result = await tool?.handler({});

    expect(result).toEqual({
      content: [
        {
          type: "text",
          text: expect.stringContaining(
            "Error fetching Qiita markdown rules: Qiita API token is not provided."
          ),
        },
      ],
      isError: true,
    });
  });

  it("uses an injected service instead of the module default", async () => {
    const { getToolDefinitions } = await importCurrentModule();
    const mockService = {
      getAuthenticatedUserItems: vi.fn().mockResolvedValue([{ id: "item-1" }]),
      getItem: vi.fn(),
      updateItem: vi.fn(),
      createItem: vi.fn(),
      getMarkdownRules: vi.fn(),
    };

    const tool = getToolDefinitions(mockService).find(
      ({ name }) => name === "get_my_qiita_articles"
    );
    const result = await tool?.handler({ page: 3, per_page: 5 });

    expect(mockService.getAuthenticatedUserItems).toHaveBeenCalledWith(3, 5);
    expect(result).toEqual({
      content: [
        {
          type: "text",
          text: JSON.stringify([{ id: "item-1" }], null, 2),
        },
      ],
    });
  });
});

const importCurrentModule = async () => {
  vi.resetModules();
  return import("../../src/tools/qiitaTools.js");
};
