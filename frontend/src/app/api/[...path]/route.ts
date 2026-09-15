import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

const backend = process.env.API_URL ?? "http://localhost:4000";

async function proxy(request: Request, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  const target = `${backend}/api/${path.join("/")}${new URL(request.url).search}`;
  const headers = new Headers();
  const cookie = request.headers.get("cookie");
  const contentType = request.headers.get("content-type");
  if (cookie) headers.set("cookie", cookie);
  if (contentType) headers.set("content-type", contentType);

  const init: RequestInit = { method: request.method, headers };
  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = Buffer.from(await request.arrayBuffer());
  }

  let upstream: Response;
  try {
    upstream = await fetch(target, init);
  } catch {
    return NextResponse.json({ error: "API недоступен. Запустите backend: npm run dev" }, { status: 503 });
  }

  if (upstream.ok && request.method !== "GET" && path[0] === "admin") {
    revalidatePath("/", "layout");
    revalidatePath("/news");
  }

  const response = new NextResponse(Buffer.from(await upstream.arrayBuffer()), { status: upstream.status });
  const type = upstream.headers.get("content-type");
  if (type) response.headers.set("content-type", type);
  for (const item of upstream.headers.getSetCookie()) {
    response.headers.append("set-cookie", item);
  }
  return response;
}

export async function GET(request: Request, context: { params: Promise<{ path: string[] }> }) {
  return proxy(request, context);
}

export async function POST(request: Request, context: { params: Promise<{ path: string[] }> }) {
  return proxy(request, context);
}

export async function DELETE(request: Request, context: { params: Promise<{ path: string[] }> }) {
  return proxy(request, context);
}

export async function PATCH(request: Request, context: { params: Promise<{ path: string[] }> }) {
  return proxy(request, context);
}

export async function PUT(request: Request, context: { params: Promise<{ path: string[] }> }) {
  return proxy(request, context);
}
