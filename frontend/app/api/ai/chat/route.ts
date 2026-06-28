import { NextResponse } from "next/server";

function resolveBackendBaseUrl(): string {
  const direct = process.env.BACKEND_URL?.trim();
  if (direct) {
    return direct.replace(/\/$/, "");
  }
  const ws = process.env.NEXT_PUBLIC_WS_URL?.trim();
  if (ws) {
    const http = ws
      .replace(/^wss:\/\//i, "https://")
      .replace(/^ws:\/\//i, "http://");
    return http.replace(/\/?ws\/?$/, "").replace(/\/$/, "");
  }
  return "http://127.0.0.1:8000";
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const base = resolveBackendBaseUrl();
  const url = `${base}/ai/chat`;

  try {
    const upstream = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const text = await upstream.text();
    const contentType = upstream.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      try {
        const data = JSON.parse(text) as unknown;
        return NextResponse.json(data, { status: upstream.status });
      } catch {
        return NextResponse.json(
          { error: "Invalid response from AI service" },
          { status: 502 }
        );
      }
    }

    return new NextResponse(text, {
      status: upstream.status,
      headers: { "Content-Type": contentType || "text/plain" },
    });
  } catch (e) {
    console.error("assistant proxy fetch failed", e);
    return NextResponse.json(
      { error: "Could not reach the AI service. Is the backend running?" },
      { status: 502 }
    );
  }
}
