export async function onRequestGet(context) {
    const { env } = context;
    const { results } = await env.DB.prepare("SELECT * FROM quotes ORDER BY id DESC").all();
    return new Response(JSON.stringify(results), {
        headers: { "Content-Type": "application/json" }
    });
}

export async function onRequestPost(context) {
    const { env, request } = context;
    const formData = await request.formData();
    
    const author = formData.get('author');
    const text = formData.get('text');
    const tag = formData.get('tag');
    const cover = formData.get('cover');

    let imageUrl = "";
    if (cover && cover.size > 0) {
        const key = `${Date.now()}-${cover.name}`;
        await env.BUCKET.put(key, cover.stream());
        imageUrl = `/api/image/${key}`;
    }

    await env.DB.prepare(
        "INSERT INTO quotes (author, text, tag, image_url) VALUES (?, ?, ?, ?)"
    ).bind(author, text, tag, imageUrl).run();

    return new Response("Success", { status: 200 });
}
