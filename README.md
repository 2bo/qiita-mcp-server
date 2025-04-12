# Qiita MCP Server

A Model Context Protocol (MCP) server for interacting with Qiita, the knowledge-sharing platform for engineers.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Overview

This package provides a Model Context Protocol (MCP) server that enables AI agents to interact with the Qiita API. It allows for creating, reading, and updating articles on Qiita through standardized MCP tools.

MCP is an open protocol for building AI agents that can use external tools and services. This server implements the MCP specification to provide tools for working with Qiita content.

## Provided Tools

The server provides the following MCP tools:

| Tool Name | Description |
|-----------|-------------|
| `get_my_qiita_articles` | Get current authenticated user's Qiita articles |
| `get_qiita_item` | Get a specific Qiita article by its ID |
| `post_qiita_article` | Create a new article on Qiita |
| `update_qiita_article` | Update an existing Qiita article |
| `get_qiita_markdown_rules` | Get Qiita markdown syntax rules and cheat sheet |

## Usage

### Prerequisites

- Node.js (>=20.0.0)
- A Qiita account with API access token
  - You can generate a Qiita API token by visiting: https://qiita.com/settings/tokens/new

### Usage with VS Code

1. Create a `.vscode/mcp.json` file in your project with the following content:

```json
{
  "inputs": [
    {
      "type": "promptString",
      "id": "qiita-api-token",
      "description": "Qiita API Token",
      "password": true
    }
  ],
  "servers": {
    "qiita-mcp-server": {
      "type": "stdio",
      "command": "npx",
      "args": ["@2bo/qiita-mcp-server"],
      "env": {
        "QIITA_API_TOKEN": "${input:qiita-api-token}"
      }
    }
  }
}
```

## Development

### Setup

1. Clone the repository:

```bash
git clone https://github.com/2bo/qiita-mcp-server.git
cd qiita-mcp-server
```

2. Install dependencies:

```bash
npm install
```

3. Set up your environment:

- `npm run dev` - Run TypeScript in watch mode for development
- `npm run build` - Build the project
- `npm run prepare` - Prepare the package for publishing

### Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.