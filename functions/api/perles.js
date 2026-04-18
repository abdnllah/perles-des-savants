export async function onRequest(context) {
    const { request, env } = context;
    const { DB, BUCKET } = env;
    const url = new URL(request.url);

    // --- LECTURE (GET) ---
    if (request.method === "GET") {
        const { results } = await DB.prepare("SELECT * FROM perles ORDER BY created_at DESC").all();
        return new Response(JSON.stringify(results), { headers: { "Content-Type": "application/json" } });
    }

    // --- AJOUT (POST) ---
    if (request.method === "POST") {
        const formData = await request.formData();
        const author = formData.get('author');
        const text = formData.get('text');
        const tag = formData.get('tag');
        const cover = formData.get('cover');

        let coverUrl = null;
        if (cover && cover.size > 0) {
            const key = crypto.randomUUID(); // Génère une clé unique
            await BUCKET.put(key, cover.stream(), { httpMetadata: { contentType: cover.type } });
            coverUrl = `/api/image/${key}`; // Lien vers ton fichier [key].js
        }

        await DB.prepare("INSERT INTO perles (author, text, tag, cover_url) VALUES (?, ?, ?, ?)")
            .bind(author, text, tag, coverUrl)
            .run();
        return new Response("OK", { status: 200 });
    }

    // --- SUPPRESSION (DELETE) ---
    if (request.method === "DELETE") {
        const id = url.searchParams.get('id');
        if (!id) return new Response("ID manquant", { status: 400 });
        
        await DB.prepare("DELETE FROM perles WHERE id = ?").bind(id).run();
        return new Response("Supprimé", { status: 200 });
    }

    return new Response("Méthode non autorisée", { status: 405 });
}
