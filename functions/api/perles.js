export async function onRequest(context) {
    const { request, env } = context;
    const { DB, BUCKET } = env;
    const url = new URL(request.url);

    // --- LECTURE (GET) : Utilisé par index.html et admin.html ---
    if (request.method === "GET") {
        try {
            const { results } = await DB.prepare("SELECT * FROM perles ORDER BY created_at DESC").all();
            return new Response(JSON.stringify(results), { 
                headers: { "Content-Type": "application/json" } 
            });
        } catch (e) {
            return new Response(JSON.stringify({ error: e.message }), { status: 500 });
        }
    }

    // --- AJOUT (POST) : Utilisé par admin.html ---
    if (request.method === "POST") {
        try {
            const formData = await request.formData();
            const author = formData.get('author');
            const text = formData.get('text');
            const tag = formData.get('tag');
            const page = formData.get('page');
            const cover = formData.get('cover');

            let coverUrl = null;
            if (cover && cover.size > 0) {
                const key = crypto.randomUUID();
                await BUCKET.put(key, cover.stream(), { 
                    httpMetadata: { contentType: cover.type } 
                });
                coverUrl = `/api/image/${key}`;
            }

            await DB.prepare("INSERT INTO perles (author, text, tag, cover_url, page) VALUES (?, ?, ?, ?, ?)")
                .bind(author, text, tag, coverUrl, page)
                .run();

            return new Response("OK", { status: 200 });
        } catch (e) {
            return new Response("Erreur serveur : " + e.message, { status: 500 });
        }
    }

    // --- SUPPRESSION (DELETE) : Utilisé par admin.html ---
    if (request.method === "DELETE") {
        try {
            const id = url.searchParams.get('id');
            if (!id) return new Response("ID manquant", { status: 400 });
            
            await DB.prepare("DELETE FROM perles WHERE id = ?").bind(id).run();
            return new Response("Supprimé", { status: 200 });
        } catch (e) {
            return new Response("Erreur suppression : " + e.message, { status: 500 });
        }
    }

    return new Response("Méthode non autorisée", { status: 405 });
}
