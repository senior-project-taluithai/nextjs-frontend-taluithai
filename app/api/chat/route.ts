/Users/tar/Downloads/openrouter-icon-256x256.pngimport { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const BACKEND_URL =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://localhost:8000";

function jsonResponse(payload: unknown, status: number): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}

function getAuthToken(req: NextRequest): string {
  const authCookie = req.cookies.get("Authentication")?.value || "";
  const authHeader = req.headers.get("Authorization");
  return authHeader?.replace("Bearer ", "") || authCookie;
}

async function toUpstreamErrorResponse(
  stage: string,
  upstreamRes: Response,
): Promise<Response> {
  const rawBody = await upstreamRes.text();

  let parsedBody: unknown = null;
  if (rawBody) {
    try {
      parsedBody = JSON.parse(rawBody);
    } catch {
      parsedBody = rawBody;
    }
  }

  return jsonResponse(
    {
      message: `${stage} failed`,
      stage,
      upstreamStatus: upstreamRes.status,
      upstreamBody: parsedBody,
    },
    upstreamRes.status,
  );
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function isInternalNodeName(name: string): boolean {
  if (!name) {
    return true;
  }

  const lower = name.toLowerCase();

  return (
    name.startsWith("__") ||
    name === "LangGraph" ||
    name.startsWith("Runnable") ||
    lower === "tools"
  );
}

function getGraphStepName(event: Record<string, unknown>): string {
  const metadata = asRecord(event.metadata);
  const metadataNode =
    metadata && typeof metadata.langgraph_node === "string"
      ? metadata.langgraph_node.trim()
      : "";

  if (metadataNode && !isInternalNodeName(metadataNode)) {
    return metadataNode;
  }

  const tags = Array.isArray(event.tags) ? event.tags : [];
  for (const tag of tags) {
    if (typeof tag !== "string") {
      continue;
    }

    if (tag.startsWith("graph:step:")) {
      const tagName = tag.slice("graph:step:".length).trim();
      if (tagName && !isInternalNodeName(tagName)) {
        return tagName;
      }
    }
  }

  const fallbackName = typeof event.name === "string" ? event.name.trim() : "";
  if (fallbackName && !isInternalNodeName(fallbackName)) {
    return fallbackName;
  }

  const data = asRecord(event.data);
  const dataName =
    data && typeof data.name === "string" ? data.name.trim() : "";
  if (dataName && !isInternalNodeName(dataName)) {
    return dataName;
  }

  return "";
}

/**
 * SSE translator: consumes the complex LangGraph SSE from the NestJS backend,
 * and re-emits typed SSE events to the frontend:
 *
 *   event: text        — AI text chunk
 *   event: tool_start  — tool invocation started (name + input)
 *   event: tool_end    — tool invocation finished (name + output)
 *   event: meta        — threadId + final messages
 *   event: done        — stream complete
 *
 * Request body: { messages: [{role, content}], threadId?: string }
 * Request headers: Authorization: Bearer <token>
 */
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ message: "Invalid JSON request body" }, 400);
  }

  const { messages, threadId: existingThreadId } = body as {
    messages: { role: string; content: string }[];
    threadId?: string;
  };

  const token = getAuthToken(req);
  if (!token) {
    return jsonResponse({ message: "Unauthorized: please log in first" }, 401);
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "text/event-stream",
    Authorization: `Bearer ${token}`,
  };

  // 1. Create or reuse thread
  let threadId = existingThreadId;
  if (!threadId) {
    const threadRes = await fetch(`${BACKEND_URL}/agent/threads`, {
      method: "POST",
      headers,
      body: JSON.stringify({}),
    });
    if (!threadRes.ok) {
      return toUpstreamErrorResponse("thread_create", threadRes);
    }

    let threadData: unknown;
    try {
      threadData = await threadRes.json();
    } catch {
      return jsonResponse(
        {
          message: "thread_create failed",
          stage: "thread_create",
          upstreamStatus: 502,
          upstreamBody: "Invalid thread response body",
        },
        502,
      );
    }

    const parsedThreadData = asRecord(threadData);
    const createdThreadId =
      parsedThreadData && typeof parsedThreadData.thread_id === "string"
        ? parsedThreadData.thread_id
        : "";
    if (!createdThreadId) {
      return jsonResponse(
        {
          message: "thread_create failed",
          stage: "thread_create",
          upstreamStatus: 502,
          upstreamBody: "Missing thread_id in response",
        },
        502,
      );
    }

    threadId = createdThreadId;
  }

  // 2. Start streaming run — send only the latest user message
  const lastUserMessage = [...messages]
    .reverse()
    .find((m) => m.role === "user");
  const streamRes = await fetch(
    `${BACKEND_URL}/agent/threads/${threadId}/runs/stream`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({
        input: {
          messages: lastUserMessage
            ? [{ role: "user", content: lastUserMessage.content }]
            : [],
        },
        assistant_id: "travel_agent",
        stream_mode: ["values", "events"],
      }),
    },
  );

  if (!streamRes.ok) {
    return toUpstreamErrorResponse("stream_start", streamRes);
  }

  if (!streamRes.body) {
    return jsonResponse(
      {
        message: "stream_start failed",
        stage: "stream_start",
        upstreamStatus: 502,
        upstreamBody: "Missing stream body",
      },
      502,
    );
  }

  // 3. Parse backend SSE and re-emit typed events
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  let valuesState: Record<string, unknown> | null = null;

  function sse(event: string, data: unknown): Uint8Array {
    return encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  }

  const readable = new ReadableStream({
    async start(controller) {
      try {
        const reader = streamRes.body!.getReader();
        let buffer = "";
        controller.enqueue(sse("meta", { threadId }));

        if (req.signal.aborted) {
          reader.cancel();
          controller.close();
          return;
        }

        const onAbort = () => {
          void reader.cancel();
          if (!streamRes.bodyUsed) {
            controller.close();
          }
        };
        req.signal.addEventListener("abort", onAbort, { once: true });

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const parts = buffer.split("\n\n");
            buffer = parts.pop() || "";

            for (const part of parts) {
              let currentEventType = "";
              let dataStr = "";

              for (const rawLine of part.split("\n")) {
                const line = rawLine.trimEnd();
                if (!line) continue;
                if (line.startsWith("event: ")) {
                  currentEventType = line.slice(7).trim();
                  continue;
                }

                if (line.startsWith("data: ")) {
                  dataStr += line.slice(6);
                }
              }

              if (!dataStr) {
                continue;
              }

              try {
                const data = JSON.parse(dataStr);

                if (currentEventType === "events") {
                  // Text chunks from the LLM — only forward from supervisor agent node
                  // Events from inside sub-agent tools have "graph:step:tools" tag
                  // and produce garbled interleaved text when tools run in parallel
                  if (data.event === "on_chat_model_stream") {
                    const tags = Array.isArray(data.tags) ? data.tags : [];
                    const isInsideTool = tags.some(
                      (t: string) => t === "graph:step:tools",
                    );
                    const chunk = data?.data?.chunk;
                    // LangChain serializes as {lc:1, kwargs:{content:"..."}}
                    const content = chunk?.content ?? chunk?.kwargs?.content;
                    if (
                      !isInsideTool &&
                      content &&
                      typeof content === "string"
                    ) {
                      controller.enqueue(sse("text", { content }));
                    }

                    // Also check for tool calls within the model stream
                    const toolCallChunks =
                      chunk?.tool_call_chunks ??
                      chunk?.kwargs?.tool_call_chunks;
                    if (Array.isArray(toolCallChunks)) {
                      for (const tc of toolCallChunks) {
                        if (tc.name) {
                          controller.enqueue(
                            sse("tool_start", {
                              name: tc.name,
                              input: tc.args || {},
                              runId: tc.id || "",
                            }),
                          );
                        }
                      }
                    }
                  }

                  // Graph node started — use on_chain_start with graph:step tag
                  // to show which agent is working (supervisor, recommend_agent, etc.)
                  if (data.event === "on_chain_start") {
                    const nodeName = getGraphStepName(
                      data as Record<string, unknown>,
                    );
                    if (nodeName) {
                      controller.enqueue(
                        sse("tool_start", {
                          name: nodeName,
                          input: {},
                          runId: data?.run_id || "",
                        }),
                      );
                    }
                  }

                  // Graph node finished
                  if (data.event === "on_chain_end") {
                    const nodeName = getGraphStepName(
                      data as Record<string, unknown>,
                    );
                    if (nodeName) {
                      controller.enqueue(
                        sse("tool_end", {
                          name: nodeName,
                          output: null,
                          runId: data?.run_id || "",
                        }),
                      );
                    }
                  }

                  // Also forward actual on_tool_start/end if they ever appear
                  if (data.event === "on_tool_start") {
                    const toolName = data?.name || "tool";
                    controller.enqueue(
                      sse("tool_start", {
                        name: toolName,
                        input:
                          data?.data?.input?.kwargs || data?.data?.input || {},
                        runId: data?.run_id || "",
                      }),
                    );
                  }
                  if (data.event === "on_tool_end") {
                    const toolName = data?.name || "tool";
                    controller.enqueue(
                      sse("tool_end", {
                        name: toolName,
                        output: null,
                        runId: data?.run_id || "",
                      }),
                    );
                  }
                }

                if (currentEventType === "error") {
                  controller.enqueue(sse("error", data));
                }

                if (currentEventType === "values") {
                  valuesState = data;
                }

                if (currentEventType === "tool_start") {
                  controller.enqueue(sse("tool_start", data));
                }
                if (currentEventType === "tool_end") {
                  controller.enqueue(sse("tool_end", data));
                }
                if (currentEventType === "progress") {
                  controller.enqueue(sse("progress", data));
                }
              } catch {
                // Skip unparseable lines
              }
            }
          }
        } finally {
          req.signal.removeEventListener("abort", onAbort);
        }

        // Send metadata
        controller.enqueue(
          sse("meta", {
            threadId,
            messages: extractMessages(valuesState),
          }),
        );
        controller.enqueue(sse("done", {}));
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
      "Content-Encoding": "identity",
    },
  });
}

/** Extract simple messages from the final values state */
function extractMessages(
  state: Record<string, unknown> | null,
): { role: string; content: string }[] {
  if (!state || !Array.isArray(state.messages)) return [];

  return state.messages
    .map((m: Record<string, unknown>) => {
      // Handle standard basic objects
      if (m.type === "human")
        return {
          role: "user",
          content: typeof m.content === "string" ? m.content : "",
        };
      if (m.type === "ai")
        return {
          role: "assistant",
          content: typeof m.content === "string" ? m.content : "",
        };

      // Handle serialized LangChain messages
      if (m.type === "constructor" && m.id && Array.isArray(m.id)) {
        const typeStr = m.id.join(".");
        const kwargs = m.kwargs as Record<string, unknown> | undefined;
        if (typeStr.includes("HumanMessage")) {
          return { role: "user", content: (kwargs?.content as string) || "" };
        }
        if (typeStr.includes("AIMessage")) {
          return {
            role: "assistant",
            content: (kwargs?.content as string) || "",
          };
        }
      }
      return null;
    })
    .filter(
      (m): m is { role: string; content: string } =>
        m !== null && m.content !== "",
    );
}
