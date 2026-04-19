export async function onRequest(context) {
    const { request, env } = context;
    const url = new URL(request.url);

    // --- GÉRER LA SUPPRESSION (DELETE) ---
    if (request.method === "DELETE") {
        const id = url.searchParams.get("id");
        if (id) {
            await env.DB.prepare("DELETE FROM perles WHERE id = ?").bind(id).run();
        }
        return new Response(JSON.stringify({ success: true }), { 
            headers: { "Content-Type": "application/json" } 
        });
    }

    // --- GÉRER L'AJOUT (POST) ---
    if (request.method === "POST") {
        try {
            const formData = await request.formData();
            
            const author = formData.get('author');
            const text = formData.get('text');
            const tag = formData.get('tag');
            const page = formData.get('page');
            const cover = formData.get('cover');

            let coverUrl = null;

            // Tentative d'upload vers R2 si une image est présente
            if (cover && cover.size > 0) {
                const key = crypto.randomUUID();
                try {
                    await env.BUCKET.put(key, cover);
                    coverUrl = `/api/image/${key}`;
                } catch (r2Error) {
                    console.error("Erreur R2:", r2Error.message);
                    // On continue quand même pour ne pas perdre la citation
                }
            }

            // INSERTION SQL CORRIGÉE : 
            // Selon ton PRAGMA : author(1), text(2), tag(3), cover_url(4), page(6)
            await env.DB.prepare(
                "INSERT INTO perles (author, text, tag, cover_url, page) VALUES (?, ?, ?, ?, ?)"
            ).bind(author, text, tag, coverUrl, page).run();

            return new Response(JSON.stringify({ success: true }), { 
                status: 200,
                headers: { "Content-Type": "application/json" }
            });
        } catch (err) {
            return new Response(JSON.stringify({ error: err.message }), { 
                status: 500,
                headers: { "Content-Type": "application/json" }
            });
        }
    }

    // --- GÉRER L'AFFICHAGE (GET) ---
    try {
        const { results } = await env.DB.prepare("SELECT * FROM perles ORDER BY created_at DESC").all();
        return new Response(JSON.stringify(results), {
            headers: { "Content-Type": "application/json" }
        });
    } catch (dbError) {
        return new Response(JSON.stringify({ error: dbError.message }), { status: 500 });
    }
}
