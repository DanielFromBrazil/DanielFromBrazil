import { type NextRequest, NextResponse } from "next/server"

// Função para obter o token de acesso do Spotify
async function getSpotifyToken() {
  const clientId = process.env.SPOTIFY_CLIENT_ID
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    console.error("Credenciais do Spotify não configuradas:", { clientId: !!clientId, clientSecret: !!clientSecret })
    throw new Error("Credenciais do Spotify não configuradas")
  }

  try {
    console.log("Obtendo token do Spotify...")

    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      },
      body: new URLSearchParams({
        grant_type: "client_credentials",
      }),
      cache: "no-store",
    })

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      console.error("Erro na resposta do token Spotify:", {
        status: response.status,
        statusText: response.statusText,
        data,
      })
      throw new Error(
        `Erro ao obter token do Spotify: ${data.error_description || response.statusText || "Erro desconhecido"}`,
      )
    }

    const data = await response.json()
    console.log("Token obtido com sucesso")
    return data.access_token
  } catch (error) {
    console.error("Erro ao obter token do Spotify:", error)
    throw error
  }
}

export async function GET(request: NextRequest) {
  try {
    // Obter o parâmetro de consulta
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get("q")

    if (!query) {
      return NextResponse.json({ error: "Parâmetro de pesquisa não fornecido" }, { status: 400 })
    }

    console.log("Pesquisando por:", query)

    // Obter token do Spotify
    const token = await getSpotifyToken()
    console.log("Token obtido com sucesso")

    // Fazer a pesquisa no Spotify
    console.log(
      `Fazendo requisição para API do Spotify: https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=10&market=BR`,
    )

    const response = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=10&market=BR`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      },
    )

    console.log("Status da resposta da API do Spotify:", response.status)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error("Erro na API do Spotify:", {
        status: response.status,
        statusText: response.statusText,
        errorData,
      })
      return NextResponse.json(
        { error: `Erro na API do Spotify: ${errorData.error?.message || response.statusText || "Erro desconhecido"}` },
        { status: response.status },
      )
    }

    const data = await response.json()
    console.log("Resposta da API do Spotify recebida")

    if (!data.tracks || !data.tracks.items) {
      console.error("Resposta inesperada da API do Spotify:", data)
      return NextResponse.json({ error: "Formato de resposta inesperado da API do Spotify" }, { status: 500 })
    }

    // Transformar os resultados no formato que precisamos
    const tracks = data.tracks.items.map((track: any) => ({
      id: track.id,
      name: track.name,
      artist: track.artists.map((artist: any) => artist.name).join(", "),
      album: track.album.name,
      albumArt: track.album.images[0]?.url || null,
      previewUrl: track.preview_url,
      duration: track.duration_ms,
    }))

    console.log(`Encontrados ${tracks.length} resultados`)

    return NextResponse.json({ tracks })
  } catch (error) {
    console.error("Erro ao pesquisar músicas:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao pesquisar músicas" },
      { status: 500 },
    )
  }
}
