export async function onRequest(context) {
  const { env, params } = context;
  const key = params.key; // Récupère le nom de l'image dans l'URL

  const object = await env.BUCKET.get(key);

  if (!object) {
    return new Response("Image introuvable", { status: 404 });
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);

  return new Response(object.body, { headers });
}
