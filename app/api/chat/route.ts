import { NextRequest } from "next/server";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function isGraphStepEvent(event: Record<string, unknown>): boolean {
  const tags = Array.isArray(event.tags) ? event.tags : [];
  const hasGraphStepTag = tags.some(
    (tag): tag is string =>
      typeof tag === "string" && tag.startsWith("graph:step:"),
  );
  if (hasGraphStepTag) {
    return true;
  }

  const metadata = asRecord(event.metadata);
  if (!metadata) {
    return false;
  }

  return (
    typeof metadata.langgraph_node === "string" ||
    typeof metadata.langgraph_step === "number" ||
    typeof metadata.langgraph_step === "string"
  );
}

function getGraphStepName(event: Record<string, unknown>): string {
  const metadata = asRecord(event.metadata);
  const metadataNode =
    metadata && typeof metadata.langgraph_node === "string"
      ? metadata.langgraph_node.trim()
      : "";

  if (metadataNode && !metadataNode.startsWith("__")) {
    return metadataNode;
  }

  const fallbackName = typeof event.name === "string" ? event.name.trim() : "";
  if (
    fallbackName &&
    !fallbackName.startsWith("__") &&
    fallbackName !== "LangGraph"
  ) {
    return fallbackName;
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
  const body = await req.json();
  const { messages, threadId: existingThreadId } = body as {
    messages: { role: string; content: string }[];
    threadId?: string;
  };

  const cookies = req.cookies;
  const authCookie = cookies.get("Authentication")?.value || "";
  const authHeader = req.headers.get("Authorization");
  const token = authHeader?.replace("Bearer ", "") || authCookie;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // 1. Create or reuse thread
  let threadId = existingThreadId;
  if (!threadId) {
    const threadRes = await fetch(`${BACKEND_URL}/agent/threads`, {
      method: "POST",
      headers,
      body: JSON.stringify({}),
    });
    if (!threadRes.ok) {
      return new Response(`Failed to create thread: ${threadRes.status}`, {
        status: 500,
      });
    }
    const threadData = await threadRes.json();
    threadId = threadData.thread_id;
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

  if (!streamRes.ok || !streamRes.body) {
    return new Response(`Backend stream failed: ${streamRes.status}`, {
      status: 502,
    });
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
        let currentEventType = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("event: ")) {
              currentEventType = line.slice(7).trim();
              continue;
            }

            if (!line.startsWith("data: ")) continue;
            const dataStr = line.slice(6);

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
                  if (!isInsideTool && content && typeof content === "string") {
                    controller.enqueue(sse("text", { content }));
                  }

                  // Also check for tool calls within the model stream
                  const toolCallChunks =
                    chunk?.tool_call_chunks ?? chunk?.kwargs?.tool_call_chunks;
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
                  const isGraphStep = isGraphStepEvent(
                    data as Record<string, unknown>,
                  );
                  const nodeName = getGraphStepName(
                    data as Record<string, unknown>,
                  );
                  if (isGraphStep && nodeName) {
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
                  const isGraphStep = isGraphStepEvent(
                    data as Record<string, unknown>,
                  );
                  const nodeName = getGraphStepName(
                    data as Record<string, unknown>,
                  );
                  if (isGraphStep && nodeName) {
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

              if (currentEventType === "values") {
                valuesState = data;
              }
            } catch {
              // Skip unparseable lines
            }
          }
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
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
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
