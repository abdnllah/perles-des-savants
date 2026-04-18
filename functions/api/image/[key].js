export async function onRequestGet(context) {
    const key = context.params.key;
    const object = await context.env.BUCKET.get(key);
    if (!object) return new Response("Not Found", { status: 404 });

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("etag", object.httpEtag);

    return new Response(object.body, { headers });
}
