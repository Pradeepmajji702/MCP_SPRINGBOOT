#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema
} from "@modelcontextprotocol/sdk/types.js";
import axios from "axios";

// Configure via environment variable: SWAGGER_URL
const SWAGGER_URL = process.env.SWAGGER_URL || "";

let swaggerCache = null;

// Load Swagger
async function loadSwagger() {
  if (!swaggerCache) {
    const res = await axios.get(SWAGGER_URL);
    swaggerCache = res.data;
  }
  return swaggerCache;
}

const server = new Server(
  {
    name: "swagger-mcp",
    version: "1.0.0"
  },
  {
    capabilities: { tools: {} }
  }
);


// ===============================
// LIST TOOLS
// ===============================
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "list_endpoints",
      description: "List all backend API endpoints",
      inputSchema: { type: "object", properties: {} }
    },
    {
      name: "describe_endpoint",
      description: "Get details of a backend API",
      inputSchema: {
        type: "object",
        properties: {
          path: { type: "string" },
          method: { type: "string" }
        },
        required: ["path", "method"]
      }
    },
    {
      name: "generate_frontend_call",
      description: "Generate frontend API call code",
      inputSchema: {
        type: "object",
        properties: {
          path: { type: "string" },
          method: { type: "string" },
          framework: { type: "string" }
        },
        required: ["path", "method", "framework"]
      }
    }
  ]
}));


// ===============================
// TOOL EXECUTION
// ===============================
server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const swagger = await loadSwagger();

  // LIST ENDPOINTS
  if (req.params.name === "list_endpoints") {
    const endpoints = [];

    for (const path in swagger.paths) {
      for (const method in swagger.paths[path]) {
        endpoints.push({ path, method });
      }
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(endpoints, null, 2)
        }
      ]
    };
  }


  // DESCRIBE ENDPOINT
  if (req.params.name === "describe_endpoint") {
    const { path, method } = req.params.arguments;
    const endpoint = swagger.paths[path]?.[method];

    if (!endpoint) {
      return {
        content: [{ type: "text", text: "❌ Endpoint not found" }]
      };
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(endpoint, null, 2)
        }
      ]
    };
  }


  // GENERATE FRONTEND API CALL
  if (req.params.name === "generate_frontend_call") {
    const { path, method, framework } = req.params.arguments;
    const endpoint = swagger.paths[path]?.[method];

    if (!endpoint) {
      return {
        content: [{ type: "text", text: "❌ Endpoint not found" }]
      };
    }

    let code = "";

    // React Axios Example
    if (framework === "react") {
      code = `
import axios from "axios";

export async function callApi(payload) {
  const res = await axios.${method}(
    "http://localhost:8080${path}",
    payload
  );
  return res.data;
}
      `;
    }

    // Angular HttpClient Example
    if (framework === "angular") {
      code = `
import { HttpClient } from "@angular/common/http";

constructor(private http: HttpClient) {}

callApi(payload: any) {
  return this.http.${method}(
    "http://localhost:8080${path}",
    payload
  );
}
      `;
    }

    return {
      content: [
        {
          type: "text",
          text: code
        }
      ]
    };
  }
});


// ===============================
// START MCP
// ===============================
const transport = new StdioServerTransport();
await server.connect(transport);
