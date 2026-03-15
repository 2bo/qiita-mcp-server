import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { QiitaApiService } from "./qiita.js";
import {
  clearQiitaApiToken,
  jsonResponse,
  restoreQiitaApiToken,
} from "../testUtils.js";

describe("QiitaApiService", () => {
  beforeEach(() => {
    clearQiitaApiToken();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    restoreQiitaApiToken();
  });

  it("throws when the API token is missing", async () => {
    const service = new QiitaApiService();

    await expect(service.getItem("item-1")).rejects.toThrow(
      "Qiita API token is not provided."
    );
  });

  it("fetches authenticated items and strips bulky fields", async () => {
    process.env.QIITA_API_TOKEN = "test-token";
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse([
        {
          id: "item-1",
          title: "Article",
          body: "markdown",
          rendered_body: "<p>markdown</p>",
          user: {
            id: "user-1",
            name: "Kota",
            facebook_id: "fb",
            followers_count: 10,
            website_url: "https://example.com",
          },
        },
      ])
    );
    vi.stubGlobal("fetch", fetchMock);

    const service = new QiitaApiService();
    const items = await service.getAuthenticatedUserItems(2, 10);

    expect(fetchMock).toHaveBeenCalledWith(
      "https://qiita.com/api/v2/authenticated_user/items?page=2&per_page=10",
      {
        headers: {
          Authorization: "Bearer test-token",
          "Content-Type": "application/json",
        },
      }
    );
    expect(items).toEqual([
      {
        id: "item-1",
        title: "Article",
        user: {
          id: "user-1",
          name: "Kota",
        },
      },
    ]);
  });

  it("omits undefined fields when updating an item", async () => {
    process.env.QIITA_API_TOKEN = "test-token";
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        id: "item-1",
        title: "Updated",
        rendered_body: "<p>updated</p>",
        user: { id: "user-1" },
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    const service = new QiitaApiService();
    await service.updateItem("item-1", {
      title: "Updated",
      body: "Body",
      private: undefined,
      slide: true,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://qiita.com/api/v2/items/item-1",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({
          title: "Updated",
          body: "Body",
          slide: true,
        }),
      })
    );
  });

  it("includes response details in API errors", async () => {
    process.env.QIITA_API_TOKEN = "test-token";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response("bad request", {
          status: 400,
          statusText: "Bad Request",
        })
      )
    );

    const service = new QiitaApiService();

    await expect(service.getItem("item-1")).rejects.toThrow(
      "Qiita API returned 400: Bad Request\nbad request"
    );
  });

  it("uses injected token, fetch implementation, and base URL when provided", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        id: "item-1",
        title: "Article",
        rendered_body: "<p>Article</p>",
        user: { id: "user-1" },
      })
    );
    const service = new QiitaApiService({
      apiToken: "injected-token",
      fetchImpl: fetchMock,
      baseUrl: "https://example.test/api",
    });

    await service.getItem("item-1");

    expect(fetchMock).toHaveBeenCalledWith(
      "https://example.test/api/items/item-1",
      {
        headers: {
          Authorization: "Bearer injected-token",
          "Content-Type": "application/json",
        },
      }
    );
  });

  it("returns a fallback message when markdown rules body is missing", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        id: "c686397e4a0f4f11683d",
        title: "Markdown rules",
      })
    );
    const service = new QiitaApiService({
      apiToken: "injected-token",
      fetchImpl: fetchMock,
    });

    await expect(service.getMarkdownRules()).resolves.toBe(
      "Markdownコンテンツが見つかりませんでした。"
    );
  });
});
