import { CopilotRuntime, GoogleGenerativeAIAdapter, copilotRuntimeNextJSAppRouterEndpoint } from "@copilotkit/runtime";
import { NextRequest } from "next/server";

const serviceAdapter = new GoogleGenerativeAIAdapter({ model: "gemini-1.5-pro" });
const runtime = new CopilotRuntime();

const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
  runtime,
  serviceAdapter,
  endpoint: "/api/copilotkit",
});

export const POST = async (req: NextRequest) => {
  return handleRequest(req);
};
