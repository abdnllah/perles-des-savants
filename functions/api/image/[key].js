export async function onRequest(context) {
  const { env, params } = context;
  const key = params.key;

  // 1. Récupérer l'image dans le bucket R2
  const object = await env.BUCKET.get(key);

  if (!object) {
    return new Response("Image non trouvée", { status: 404 });
  }

  // 2. Préparer les entêtes (type de fichier, etc.)
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);

  // 3. Renvoyer l'image au navigateur
  return new Response(object.body, { headers });
}
