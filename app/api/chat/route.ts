import { NextRequest } from "next/server";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

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
 */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { messages, threadId: existingThreadId } = body as {
    messages: { role: string; content: string }[];
    threadId?: string;
  };

  // 1. Create or reuse thread
  let threadId = existingThreadId;
  if (!threadId) {
    const threadRes = await fetch(`${BACKEND_URL}/agent/threads`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
  const lastUserMessage = [...messages].reverse().find((m) => m.role === "user");
  const streamRes = await fetch(
    `${BACKEND_URL}/agent/threads/${threadId}/runs/stream`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        input: {
          messages: lastUserMessage
            ? [{ role: "user", content: lastUserMessage.content }]
            : [],
        },
        assistant_id: "travel_agent",
      }),
    }
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

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          let currentEventType = "";

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
                  const isInsideTool = tags.some((t: string) => t === "graph:step:tools");
                  if (isInsideTool) {
                    // Skip text from inside sub-agent tool execution
                    continue;
                  }
                  const chunk = data?.data?.chunk;
                  // LangChain serializes as {lc:1, kwargs:{content:"..."}}
                  const content = chunk?.content ?? chunk?.kwargs?.content;
                  if (content && typeof content === "string") {
                    controller.enqueue(sse("text", { content }));
                  }
                }

                // Graph node started — use on_chain_start with graph:step tag
                // to show which agent is working (supervisor, recommend_agent, etc.)
                if (data.event === "on_chain_start") {
                  const tags = Array.isArray(data.tags) ? data.tags : [];
                  const isGraphStep = tags.some((t: string) => t.startsWith("graph:step:"));
                  const nodeName = data.name as string;
                  if (isGraphStep && nodeName && !nodeName.startsWith("__") && nodeName !== "LangGraph") {
                    controller.enqueue(
                      sse("tool_start", {
                        name: nodeName,
                        input: {},
                        runId: data?.run_id || "",
                      })
                    );
                  }
                }

                // Graph node finished
                if (data.event === "on_chain_end") {
                  const tags = Array.isArray(data.tags) ? data.tags : [];
                  const isGraphStep = tags.some((t: string) => t.startsWith("graph:step:"));
                  const nodeName = data.name as string;
                  if (isGraphStep && nodeName && !nodeName.startsWith("__") && nodeName !== "LangGraph") {
                    controller.enqueue(
                      sse("tool_end", {
                        name: nodeName,
                        output: null,
                        runId: data?.run_id || "",
                      })
                    );
                  }
                }

                // Also forward actual on_tool_start/end if they ever appear
                if (data.event === "on_tool_start") {
                  const toolName = data?.name || "tool";
                  controller.enqueue(
                    sse("tool_start", {
                      name: toolName,
                      input: data?.data?.input?.kwargs || data?.data?.input || {},
                      runId: data?.run_id || "",
                    })
                  );
                }
                if (data.event === "on_tool_end") {
                  const toolName = data?.name || "tool";
                  controller.enqueue(
                    sse("tool_end", {
                      name: toolName,
                      output: null,
                      runId: data?.run_id || "",
                    })
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
          })
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
  state: Record<string, unknown> | null
): { role: string; content: string }[] {
  if (!state || !Array.isArray(state.messages)) return [];
  return state.messages
    .filter(
      (m: Record<string, unknown>) =>
        (m.type === "human" || m.type === "ai") && typeof m.content === "string"
    )
    .map((m: Record<string, unknown>) => ({
      role: m.type === "human" ? "user" : "assistant",
      content: m.content as string,
    }));
}
