# Qiita MCP Server

Un servidor de Model Context Protocol (MCP) para interactuar con Qiita, la plataforma de intercambio de conocimientos para ingenieros.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Descripción General

Este paquete proporciona un servidor de Model Context Protocol (MCP) que permite a los agentes de IA interactuar con la API de Qiita. Permite crear, leer y actualizar artículos en Qiita a través de herramientas MCP estandarizadas.

MCP es un protocolo abierto para construir agentes de IA que pueden utilizar herramientas y servicios externos. Este servidor implementa la especificación MCP para proporcionar herramientas de trabajo con el contenido de Qiita.

## Herramientas Proporcionadas

El servidor proporciona las siguientes herramientas MCP:

| Nombre de la Herramienta | Descripción |
|--------------------------|-------------|
| `get_my_qiita_articles` | Obtener los artículos de Qiita del usuario autenticado actual |
| `get_qiita_item` | Obtener un artículo específico de Qiita mediante su ID |
| `post_qiita_article` | Crear un nuevo artículo en Qiita |
| `update_qiita_article` | Actualizar un artículo existente de Qiita |
| `get_qiita_markdown_rules` | Obtener las reglas de sintaxis markdown de Qiita y la hoja de trucos |

## Uso

### Prerrequisitos

- Node.js (>=20.0.0)
- Una cuenta de Qiita con un token de acceso a la API
  - Puede generar un token de la API de Qiita visitando: https://qiita.com/settings/tokens/new

### Uso con VS Code

1. Cree un archivo `.vscode/mcp.json` en su proyecto con el siguiente contenido:

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

## Desarrollo

### Configuración

1. Clone el repositorio:

```bash
git clone https://github.com/2bo/qiita-mcp-server.git
cd qiita-mcp-server
```

2. Instale las dependencias:

```bash
npm install
```

3. Configure su entorno:

- `npm run dev` - Ejecuta TypeScript en modo watch para desarrollo
- `npm run build` - Compila el proyecto
- `npm run prepare` - Prepara el paquete para su publicación

### Contribuciones

¡Las contribuciones son bienvenidas! No dude en enviar un Pull Request.

## Licencia

Este proyecto está licenciado bajo la Licencia MIT; consulte el archivo LICENSE para obtener más detalles.
