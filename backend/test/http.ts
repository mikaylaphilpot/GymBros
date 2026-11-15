import type { Express } from "express";

export async function request(
  app: Express,
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  const server = app.listen(0);
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.once("listening", resolve);
  });

  const address = server.address();
  if (!address || typeof address === "string") {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    throw new Error("Test server did not expose a TCP address");
  }

  try {
    const response = await fetch(`http://127.0.0.1:${address.port}${path}`, options);
    const body = await response.arrayBuffer();
    return new Response(body.byteLength ? body : null, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}