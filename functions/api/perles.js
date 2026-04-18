export async function onRequest(context) {
    const { request, env } = context;
    const url = new URL(request.url);

    // --- GÉRER LA SUPPRESSION (DELETE) ---
    if (request.method === "DELETE") {
        const id = url.searchParams.get("id");
        await env.DB.prepare("DELETE FROM perles WHERE id = ?").bind(id).run();
        return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
    }

    // --- GÉRER L'AJOUT (POST) ---
    if (request.method === "POST") {
        try {
            const formData = await request.formData();
            const author = formData.get('author');
            const text = formData.get('text');
            const tag = formData.get('tag');
            const page = formData.get('page');
            const cover = formData.get('cover'); // Récupère le fichier image

            let coverUrl = null;

            // SI UNE IMAGE EST PRÉSENTE : On l'envoie dans le Bucket R2
            if (cover && cover.size > 0) {
                const key = crypto.randomUUID(); // Génère un nom unique pour l'image
                await env.BUCKET.put(key, cover); // Enregistre dans R2
                coverUrl = `/api/image/${key}`;   // Crée le lien pour le site
            }

            // Insertion dans la base de données
            await env.DB.prepare(
                "INSERT INTO perles (author, text, tag, page, cover_url) VALUES (?, ?, ?, ?, ?)"
            ).bind(author, text, tag, page, coverUrl).run();

            return new Response(JSON.stringify({ success: true }), { status: 201 });
        } catch (err) {
            return new Response(err.message, { status: 500 });
        }
    }

    // --- GÉRER L'AFFICHAGE (GET) ---
    const { results } = await env.DB.prepare("SELECT * FROM perles ORDER BY created_at DESC").all();
    return new Response(JSON.stringify(results), {
        headers: { "Content-Type": "application/json" }
    });
}
