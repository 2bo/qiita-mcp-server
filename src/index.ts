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
    page: z.number().optional().default(1),
    per_page: z.number().optional().default(20),
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
      return {
        content: [
          { 
            type: "text", 
            text: JSON.stringify(items, null, 2) 
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
        ]
      };
    }
  }
);

// Start receiving messages on stdin and sending messages on stdout
const transport = new StdioServerTransport();
await server.connect(transport);