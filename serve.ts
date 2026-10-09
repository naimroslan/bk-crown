// tiny static server for local testing
Bun.serve({
  port: 8899,
  fetch(req) {
    const path = new URL(req.url).pathname;
    const file = path === "/" ? "/index.html" : path;
    try {
      const body = Bun.file("public" + file);
      return new Response(body);
    } catch {
      return new Response("not found", { status: 404 });
    }
  },
});
console.log("http://localhost:8899");
