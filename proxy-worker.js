// Cloudflare Worker para proxy CORS
// Deploy em: https://workers.cloudflare.com/

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  // Pegar URL do parâmetro
  const url = new URL(request.url)
  const targetUrl = url.searchParams.get('url')

  if (!targetUrl) {
    return new Response('Parâmetro "url" é obrigatório', { status: 400 })
  }

  // Validar que é do backend autorizado
  if (!targetUrl.startsWith('http://juniornsmg.ddns.net:5000')) {
    return new Response('URL não autorizada', { status: 403 })
  }

  try {
    // Fazer requisição ao backend
    const response = await fetch(targetUrl, {
      method: request.method,
      headers: request.headers,
      body: request.method !== 'GET' && request.method !== 'HEAD' ? await request.text() : undefined
    })

    // Copiar resposta com headers CORS
    const newResponse = new Response(response.body, response)

    // Adicionar headers CORS
    newResponse.headers.set('Access-Control-Allow-Origin', '*')
    newResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    newResponse.headers.set('Access-Control-Allow-Headers', '*')

    return newResponse

  } catch (error) {
    return new Response(`Erro: ${error.message}`, {
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'text/plain'
      }
    })
  }
}
