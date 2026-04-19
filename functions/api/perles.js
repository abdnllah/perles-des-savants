export async function onRequest(context) {
    const { request, env } = context;

    if (request.method === "POST") {
        try {
            const data = await request.json();
            
            const author = data.author;
            const text = data.text;
            const tag = data.tag;
            const page = data.page;
            const coverUrl = data.cover_url || null;

            // Simple SQL insert - no R2 handling
            await env.DB.prepare(
                "INSERT INTO perles (author, text, tag, cover_url, page) VALUES (?, ?, ?, ?, ?)"
            ).bind(author, text, tag, coverUrl, page).run();

            return new Response(JSON.stringify({ success: true }), { 
                status: 200,
                headers: { "Content-Type": "application/json" }
            });

        } catch (err) {
            return new Response(JSON.stringify({ error: err.message }), { status: 500 });
        }
    }

    // --- GET ---
    const { results } = await env.DB.prepare("SELECT * FROM perles ORDER BY created_at DESC").all();
    return new Response(JSON.stringify(results), {
        headers: { "Content-Type": "application/json" }
    });
}
