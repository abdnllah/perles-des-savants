export async function onRequest(context) {
    const { request, env } = context;

    if (request.method === "POST") {
        const formData = await request.formData();
        
        // On récupère les champs
        const author = formData.get('author');
        const text = formData.get('text');
        const tag = formData.get('tag');
        const page = formData.get('page');
        const cover = formData.get('cover'); // Le fichier image

        let coverUrl = null;

        // VERIFICATION CRUCIALE DE L'IMAGE
        if (cover && cover.size > 0) {
            const key = crypto.randomUUID();
            // On tente l'écriture dans R2
            try {
                await env.BUCKET.put(key, cover);
                coverUrl = `/api/image/${key}`;
            } catch (e) {
                // Si R2 échoue, on log l'erreur mais on continue pour ne pas bloquer le texte
                console.error("Erreur R2:", e.message);
            }
        }

        // Insertion SQL
        await env.DB.prepare(
            "INSERT INTO perles (author, text, tag, page, cover_url) VALUES (?, ?, ?, ?, ?)"
        ).bind(author, text, tag, page, coverUrl).run();

        return new Response(JSON.stringify({ success: true }), { status: 200 });
    }

    // Le reste du code (GET/DELETE) reste identique...
    const { results } = await env.DB.prepare("SELECT * FROM perles ORDER BY created_at DESC").all();
    return new Response(JSON.stringify(results));
}
