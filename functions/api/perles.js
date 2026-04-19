export async function onRequest(context) {
    const { request, env } = context;

    if (request.method === "POST") {
        try {
            const formData = await request.formData();
            
            const author = formData.get('author');
            const text = formData.get('text');
            const tag = formData.get('tag');
            const page = formData.get('page');
            const cover = formData.get('cover'); // Récupération du fichier

            let coverUrl = null;

            // --- DEBUG LOGS (Visibles dans Cloudflare Dashboard) ---
            console.log("Données reçues - Auteur:", author);
            console.log("Vérification Image - Existe ?:", !!cover);
            if (cover) console.log("Vérification Image - Taille:", cover.size);

            // Tentative d'upload vers R2
            if (cover && cover.size > 0) {
                const key = crypto.randomUUID();
                try {
                    // On vérifie si BUCKET existe avant d'écrire
                    if (env.BUCKET) {
                        await env.BUCKET.put(key, cover);
                        coverUrl = `/api/image/${key}`;
                        console.log("Image stockée avec succès:", coverUrl);
                    } else {
                        console.error("ERREUR: env.BUCKET n'est pas défini. Vérifiez le wrangler.toml");
                    }
                } catch (r2Error) {
                    console.error("Erreur fatale R2:", r2Error.message);
                }
            }

            // INSERTION SQL (Ordre conforme à ton PRAGMA)
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
