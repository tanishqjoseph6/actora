import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    openapi: "3.1.0",
    info: { title: "Actora Public API", version: "1.0.0", description: "Workspace-scoped REST API for Actora and Roxx AI." },
    servers: [{ url: "/api/v1" }],
    components: { securitySchemes: { bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "Actora API key" } } },
    security: [{ bearerAuth: [] }],
    paths: {
      "/tasks": {
        get: { summary: "List tasks", responses: { "200": { description: "Task collection" }, "401": { description: "Unauthorized" }, "429": { description: "Rate limited" } } },
        post: { summary: "Create task", responses: { "201": { description: "Task created" }, "400": { description: "Validation error" } } },
      },
      "/roxx/chat": { post: { summary: "Chat with Roxx AI", responses: { "200": { description: "Streaming AI response" } } } },
    },
  });
}
