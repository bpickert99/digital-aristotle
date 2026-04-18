const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405, headers: corsHeaders });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return new Response('Invalid JSON', { status: 400, headers: corsHeaders });
    }

    // ── Gutenberg proxy ───────────────────────────────
    if (body.gutenberg === true) {
      const urls = body.urls || [];
      for (const url of urls) {
        try {
          const r = await fetch(url, {
            headers: { 'User-Agent': 'Aristotle-App/1.0' }
          });
          if (r.ok) {
            const text = await r.text();
            return new Response(JSON.stringify({ text }), {
              headers: { ...corsHeaders, 'content-type': 'application/json' }
            });
          }
        } catch {}
      }
      return new Response(JSON.stringify({ error: 'Book not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'content-type': 'application/json' }
      });
    }

    // ── Anthropic proxy ───────────────────────────────
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await upstream.json();

    return new Response(JSON.stringify(data), {
      status: upstream.status,
      headers: { ...corsHeaders, 'content-type': 'application/json' },
    });
  },
};
