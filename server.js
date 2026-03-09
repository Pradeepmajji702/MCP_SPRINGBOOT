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

// Resolve $ref references in schemas
function resolveSchema(schema, swagger, visited = new Set()) {
  if (!schema) return null;
  
  // Handle $ref
  if (schema.$ref) {
    const refPath = schema.$ref;
    
    // Prevent circular references
    if (visited.has(refPath)) {
      return { $ref: refPath, note: "Circular reference detected" };
    }
    visited.add(refPath);
    
    // Extract reference path (e.g., "#/components/schemas/User" -> ["components", "schemas", "User"])
    const parts = refPath.replace(/^#\//, "").split("/");
    
    // Navigate to the referenced schema
    let resolved = swagger;
    for (const part of parts) {
      resolved = resolved?.[part];
    }
    
    if (resolved) {
      // Recursively resolve any nested references
      return resolveSchema(resolved, swagger, visited);
    }
    
    return { $ref: refPath, note: "Reference not found" };
  }
  
  // Handle arrays
  if (schema.type === "array" && schema.items) {
    return {
      ...schema,
      items: resolveSchema(schema.items, swagger, visited)
    };
  }
  
  // Handle objects with properties
  if (schema.type === "object" && schema.properties) {
    const resolvedProperties = {};
    for (const [key, value] of Object.entries(schema.properties)) {
      resolvedProperties[key] = resolveSchema(value, swagger, visited);
    }
    return {
      ...schema,
      properties: resolvedProperties
    };
  }
  
  // Handle allOf, anyOf, oneOf
  if (schema.allOf) {
    return {
      ...schema,
      allOf: schema.allOf.map(s => resolveSchema(s, swagger, visited))
    };
  }
  if (schema.anyOf) {
    return {
      ...schema,
      anyOf: schema.anyOf.map(s => resolveSchema(s, swagger, visited))
    };
  }
  if (schema.oneOf) {
    return {
      ...schema,
      oneOf: schema.oneOf.map(s => resolveSchema(s, swagger, visited))
    };
  }
  
  // Return schema as-is if no special handling needed
  return schema;
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

      // Extract request body schema
      let requestBodySchema = null;
      if (endpoint.requestBody && endpoint.requestBody.content && endpoint.requestBody.content["application/json"]) {
        const rawSchema = endpoint.requestBody.content["application/json"].schema;
        requestBodySchema = resolveSchema(rawSchema, swagger);
      }

      // Extract response body schema (prefer 200, fallback to first available)
      let responseBodySchema = null;
      if (endpoint.responses) {
        const response200 = endpoint.responses["200"];
        if (response200 && response200.content) {
          // Check for application/json or */* content types
          const schema200 = response200.content["application/json"]?.schema || response200.content["*/*"]?.schema;
          if (schema200) {
            responseBodySchema = resolveSchema(schema200, swagger);
          }
        }
        
        // Fallback: find first response with any content
        if (!responseBodySchema) {
          for (const status in endpoint.responses) {
            const resp = endpoint.responses[status];
            if (resp.content) {
              const anySchema = resp.content["application/json"]?.schema || resp.content["*/*"]?.schema;
              if (anySchema) {
                responseBodySchema = resolveSchema(anySchema, swagger);
                break;
              }
            }
          }
        }
      }

      // Compose output
      const output = {
        endpoint,
        requestBodySchema,
        responseBodySchema
      };

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(output, null, 2)
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

    // Extract and resolve schemas
    let requestBodySchema = null;
    if (endpoint.requestBody && endpoint.requestBody.content && endpoint.requestBody.content["application/json"]) {
      const rawSchema = endpoint.requestBody.content["application/json"].schema;
      requestBodySchema = resolveSchema(rawSchema, swagger);
    }

    let responseBodySchema = null;
    if (endpoint.responses && endpoint.responses["200"] && endpoint.responses["200"].content) {
      const schema200 = endpoint.responses["200"].content["application/json"]?.schema || endpoint.responses["200"].content["*/*"]?.schema;
      if (schema200) {
        responseBodySchema = resolveSchema(schema200, swagger);
      }
    }

    let code = "";

    // React Axios Example
    if (framework === "react") {
      code = `
import axios from "axios";

${requestBodySchema ? `// Request Type\ntype RequestPayload = ${JSON.stringify(requestBodySchema, null, 2)};\n` : ''}
${responseBodySchema ? `// Response Type\ntype ResponseData = ${JSON.stringify(responseBodySchema, null, 2)};\n` : ''}
export async function callApi(${requestBodySchema ? 'payload: RequestPayload' : ''}) {
  const res = await axios.${method}${requestBodySchema ? `<ResponseData>` : ''}(
    "http://localhost:8080${path}"${requestBodySchema ? ',\n    payload' : ''}
  );
  return res.data;
}
      `;
    }

    // Angular HttpClient Example
    if (framework === "angular") {
      code = `
import { HttpClient } from "@angular/common/http";

${requestBodySchema ? `// Request Type\ninterface RequestPayload ${JSON.stringify(requestBodySchema, null, 2)}\n` : ''}
${responseBodySchema ? `// Response Type\ninterface ResponseData ${JSON.stringify(responseBodySchema, null, 2)}\n` : ''}
constructor(private http: HttpClient) {}

callApi(${requestBodySchema ? 'payload: RequestPayload' : ''}) {
  return this.http.${method}${responseBodySchema ? '<ResponseData>' : ''}(
    "http://localhost:8080${path}"${requestBodySchema ? ',\n    payload' : ''}
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
