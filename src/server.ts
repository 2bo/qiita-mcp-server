import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { QiitaApiService } from "./services/qiita.js";
import { getToolDefinitions } from "./tools/qiitaTools.js";

export const createServer = (
  apiService: Pick<
    QiitaApiService,
    | "getAuthenticatedUserItems"
    | "getItem"
    | "updateItem"
    | "createItem"
    | "getMarkdownRules"
  > = new QiitaApiService()
) => {
  const server = new McpServer({
    name: "Qiita MCP Server",
    version: "0.1.0",
  });

  getToolDefinitions(apiService).forEach(({ name, description, parameters, handler }) => {
    server.tool(name, description, parameters, handler);
  });

  return server;
};
