# Spring Boot MCP Server

A Model Context Protocol (MCP) server that provides AI assistants with access to Spring Boot backend APIs through Swagger/OpenAPI documentation.

## Features

- **List Endpoints**: Get all available API endpoints from your Spring Boot backend
- **Describe Endpoint**: Get detailed information about a specific API endpoint
- **Generate Frontend Calls**: Auto-generate frontend API call code for React or Angular

## Installation

### Global Installation (Recommended)

```bash
npm install -g @yourusername/springboot-mcp
```

### Local Installation

```bash
npm install @yourusername/springboot-mcp
```

## Configuration

### For Claude Desktop / Copilot

Add this to your MCP settings configuration file:

**Windows**: `%APPDATA%\Code\User\globalStorage\github.copilot-chat\mcp.json`  
**macOS/Linux**: `~/.config/Code/User/globalStorage/github.copilot-chat/mcp.json`

```json
{
  "mcpServers": {
    "springboot-mcp": {
      "command": "npx",
      "args": ["-y", "@yourusername/springboot-mcp"],
      "env": {
        "SWAGGER_URL": "http://localhost:8080/v3/api-docs"
      }
    }
  }
}
```

**Important**: Replace `SWAGGER_URL` with your actual Spring Boot Swagger documentation URL.

### Common Swagger URLs

- Spring Boot 3: `http://localhost:8080/v3/api-docs`
- Spring Boot 2: `http://localhost:8080/v2/api-docs`
- Custom path: `http://localhost:8080/your-app/v3/api-docs`

## Usage

Once configured, you can ask your AI assistant:

- "List all available backend endpoints"
- "Describe the GET /api/users endpoint"
- "Generate a React API call for POST /api/users"
- "Show me the Angular code to call the login endpoint"

## Available Tools

### `list_endpoints`
Lists all API endpoints from your Spring Boot backend.

### `describe_endpoint`
Get detailed information about a specific endpoint including parameters, request body, and responses.

**Parameters:**
- `path` (string): The API path (e.g., "/api/users")
- `method` (string): HTTP method (e.g., "get", "post", "put", "delete")

### `generate_frontend_call`
Generates frontend code to call a specific API endpoint.

**Parameters:**
- `path` (string): The API path
- `method` (string): HTTP method
- `framework` (string): "react" or "angular"

## Requirements

- Node.js >= 18.0.0
- A running Spring Boot application with Swagger/OpenAPI enabled

## Development

```bash
# Clone the repository
git clone https://github.com/yourusername/springboot-mcp.git
cd springboot-mcp

# Install dependencies
npm install

# Run locally
SWAGGER_URL=http://localhost:8080/v3/api-docs node server.js
```

## Publishing

Before publishing, update:
1. Package name in `package.json` (replace `@yourusername/springboot-mcp`)
2. Author information
3. Repository URL
4. This README with your actual package name

Then publish:

```bash
npm login
npm publish --access public
```

## License

MIT

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.
