#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { getToolDefinitions } from "./tools/qiitaTools.js";

/**
 * Model Context Protocol (MCP) サーバー for Qiita
 * QiitaのAPIを利用するためのMCPツールを提供します
 */

// MCPサーバーを作成
const server = new McpServer({
  name: "Qiita MCP Server",
  version: "0.1.0"
});

// ツールの定義を取得して登録（モジュールベースの実装）
getToolDefinitions().forEach(({ name, description, parameters, handler }) => {
  server.tool(name, description, parameters, handler);
});

// STDIOトランスポートでMCPサーバーを起動
const transport = new StdioServerTransport();
await server.connect(transport);