import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// Create an MCP server
const server = new McpServer({
  name: "Demo",
  version: "1.0.0"
});

// Add Qiita authenticated user items tool
server.tool("get_my_qiita_user_posts",
  "get current authenticated user qiita posts",
  {
    page: z.number().optional().default(1).describe("Page number for pagination"),
    per_page: z.number().optional().default(20).describe("Number of items per page"),
  },
  async ({ page, per_page }) => {
    try {
      // 環境変数からのみトークンを取得
      const apiToken = process.env.QIITA_API_TOKEN;
      
      // トークンが設定されていない場合はエラー
      if (!apiToken) {
        throw new Error('Qiita API token is not provided. Set QIITA_API_TOKEN environment variable before using this tool.');
      }
      
      const response = await fetch(`https://qiita.com/api/v2/authenticated_user/items?page=${page}&per_page=${per_page}`, {
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Qiita API returned ${response.status}: ${response.statusText}`);
      }
      
      const items = await response.json();
      
      // LLMの入力トークン数を削減するために項目を削減
      const filteredItems = items.map((item: any) => {
        const { rendered_body, body, ...rest } = item;
        
        if (rest.user) {
          const {
            facebook_id,
            followees_count,
            followers_count,
            github_login_name,
            profile_image_url,
            team_only,
            twitter_screen_name,
            website_url,
            ...userRest
          } = rest.user;
          rest.user = userRest;
        }
        return rest;
      });
      
      return {
        content: [
          { 
            type: "text", 
            text: JSON.stringify(filteredItems, null, 2) 
          }
        ]
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        content: [
          { 
            type: "text", 
            text: `Error fetching Qiita items: ${errorMessage}` 
          }
        ],
        isError: true
      };
    }
  }
);

// Add Qiita item detail tool
server.tool("get_qiita_item",
  "get a specific Qiita article by its ID",
  {
    item_id: z.string().describe("The ID of the Qiita article to fetch"),
  },
  async ({ item_id }) => {
    try {
      // 環境変数からのみトークンを取得
      const apiToken = process.env.QIITA_API_TOKEN;
      
      // トークンが設定されていない場合はエラー
      if (!apiToken) {
        throw new Error('Qiita API token is not provided. Set QIITA_API_TOKEN environment variable before using this tool.');
      }
      
      const response = await fetch(`https://qiita.com/api/v2/items/${item_id}`, {
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Qiita API returned ${response.status}: ${response.statusText}`);
      }
      
      const item = await response.json();
      // LLMの入力トークン数を削減するために項目を削減 - rendered_bodyだけを除外
      const { rendered_body, ...rest } = item;

      return {
        content: [
          { 
            type: "text", 
            text: JSON.stringify(rest, null, 2) 
          }
        ]
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        content: [
          { 
            type: "text", 
            text: `Error fetching Qiita item: ${errorMessage}` 
          }
        ],
        isError: true
      };
    }
  }
);

// Add Qiita markdown rules tool
server.tool("get_qiita_markdown_rules",
  "get Qiita markdown syntax rules, cheat sheet",
  {},
  async () => {
    try {
      // 環境変数からのみトークンを取得
      const apiToken = process.env.QIITA_API_TOKEN;
      
      // トークンが設定されていない場合はエラー
      if (!apiToken) {
        throw new Error('Qiita API token is not provided. Set QIITA_API_TOKEN environment variable before using this tool.');
      }
      
      // Qiitaのmarkdownルール記事IDを固定で使用
      const item_id = "c686397e4a0f4f11683d";
      
      const response = await fetch(`https://qiita.com/api/v2/items/${item_id}`, {
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Qiita API returned ${response.status}: ${response.statusText}`);
      }
      
      const item = await response.json();
      
      // bodyフィールド（Markdown形式）のみを抽出
      return {
        content: [
          { 
            type: "text", 
            text: item.body || "Markdownコンテンツが見つかりませんでした。"
          }
        ]
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        content: [
          { 
            type: "text", 
            text: `Error fetching Qiita markdown rules: ${errorMessage}` 
          }
        ],
        isError: true
      };
    }
  }
);

// Add Qiita post article tool
server.tool("post_qiita_article",
  "create a new article on Qiita",
  {
    title: z.string().describe("Article title"),
    body: z.string().describe("Markdown formatted content"),
    tags: z.array(z.object({
      name: z.string().describe("Tag name"),
      versions: z.array(z.string()).optional().describe("Versions (optional)")
    })).describe("List of tags for the article"),
    private: z.boolean().optional().default(true).describe("Whether the article is private"),
    tweet: z.boolean().optional().describe("Whether to post to Twitter"),
    organization_url_name: z.string().optional().describe("The url_name of the organization for the article"),
    slide: z.boolean().optional().describe("Whether to enable slide mode")
  },
  async ({ title, body, tags, private: isPrivate = true, tweet, organization_url_name, slide }) => {
    try {
      // 環境変数からのみトークンを取得
      const apiToken = process.env.QIITA_API_TOKEN;
      
      // トークンが設定されていない場合はエラー
      if (!apiToken) {
        throw new Error('Qiita API token is not provided. Set QIITA_API_TOKEN environment variable before using this tool.');
      }

      // リクエストボディの作成
      const requestBody: Record<string, any> = {
        title,
        body,
        tags,
        private: isPrivate,
        tweet,
        organization_url_name,
        slide
      };
      
      // undefinedのフィールドを削除
      Object.keys(requestBody).forEach(key => {
        if (requestBody[key] === undefined) {
          delete requestBody[key];
        }
      });
      
      const response = await fetch('https://qiita.com/api/v2/items', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Qiita API returned ${response.status}: ${response.statusText}\n${errorText}`);
      }
      
      const item = await response.json();
      
      // LLMの入力トークン数を削減するために項目を削減 - rendered_bodyだけを除外
      const { rendered_body, ...rest } = item;
      
      return {
        content: [
          { 
            type: "text", 
            text: `記事が正常に投稿されました。\nタイトル: ${rest.title}\nURL: ${rest.url}\n\n` + 
                  JSON.stringify(rest, null, 2) 
          }
        ]
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        content: [
          { 
            type: "text", 
            text: `Error posting Qiita article: ${errorMessage}` 
          }
        ],
        isError: true
      };
    }
  }
);

// Start receiving messages on stdin and sending messages on stdout
const transport = new StdioServerTransport();
await server.connect(transport);