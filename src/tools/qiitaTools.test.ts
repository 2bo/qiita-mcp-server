import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearQiitaApiToken,
  createMockQiitaService,
  jsonResponse,
  restoreQiitaApiToken,
} from "../testUtils.js";

describe("getToolDefinitions", () => {
  beforeEach(() => {
    clearQiitaApiToken();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    restoreQiitaApiToken();
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
    const mockService = createMockQiitaService({
      getAuthenticatedUserItems: vi.fn().mockResolvedValue([{ id: "item-1" }]),
    });

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

  it("returns a formatted success response for post_qiita_article", async () => {
    const { getToolDefinitions } = await importCurrentModule();
    const mockService = createMockQiitaService({
      createItem: vi.fn().mockResolvedValue({
        id: "item-1",
        title: "Created",
        url: "https://qiita.com/example/items/item-1",
      }),
    });

    const tool = getToolDefinitions(mockService).find(
      ({ name }) => name === "post_qiita_article"
    );
    const result = await tool?.handler({
      title: "Created",
      body: "Body",
      tags: [{ name: "TypeScript" }],
    });

    expect(result).toEqual({
      content: [
        {
          type: "text",
          text:
            "記事が正常に投稿されました。\nタイトル: Created\nURL: https://qiita.com/example/items/item-1\n\n" +
            JSON.stringify(
              {
                id: "item-1",
                title: "Created",
                url: "https://qiita.com/example/items/item-1",
              },
              null,
              2
            ),
        },
      ],
    });
  });
});

const importCurrentModule = async () => {
  vi.resetModules();
  return import("./qiitaTools.js");
};
