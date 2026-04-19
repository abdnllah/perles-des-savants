// functions/api/perles.js
export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // Handle OPTIONS request for CORS
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // GET - Fetch all perles
    if (request.method === 'GET') {
      const { results } = await env.DB.prepare(
        'SELECT * FROM perles ORDER BY id DESC'
      ).all();
      
      return new Response(JSON.stringify(results), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // POST - Add new perle
    if (request.method === 'POST') {
      const data = await request.json();
      
      const result = await env.DB.prepare(
        'INSERT INTO perles (author, text, tag, page, cover_url) VALUES (?, ?, ?, ?, ?)'
      ).bind(
        data.author,
        data.text,
        data.tag,
        data.page || null,
        data.cover_url || null
      ).run();

      return new Response(JSON.stringify({ 
        success: true, 
        id: result.meta.last_row_id 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // DELETE - Remove a perle
    if (request.method === 'DELETE') {
      const id = url.searchParams.get('id');
      
      if (!id) {
        return new Response(JSON.stringify({ error: 'ID required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      await env.DB.prepare('DELETE FROM perles WHERE id = ?')
        .bind(id)
        .run();

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response('Method not allowed', { 
      status: 405,
      headers: corsHeaders 
    });

  } catch (error) {
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}
