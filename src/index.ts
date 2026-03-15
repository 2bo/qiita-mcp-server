#!/usr/bin/env node

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer } from "./server.js";

/**
 * Model Context Protocol (MCP) サーバー for Qiita
 * QiitaのAPIを利用するためのMCPツールを提供します
 */

const server = createServer();

// STDIOトランスポートでMCPサーバーを起動
const transport = new StdioServerTransport();
await server.connect(transport);
