export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === "GET") {
    const data = await env.KIDS_TASKS.get("tasks");
    return new Response(data || JSON.stringify({ tasks: [], stars: 0, lastLogin: "" }), {
      headers: { "Content-Type": "application/json" }
    });
  }

  if (request.method === "POST") {
    const body = await request.text();
    await env.KIDS_TASKS.put("tasks", body);
    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" }
    });
  }

  return new Response("Method not allowed", { status: 405 });
}