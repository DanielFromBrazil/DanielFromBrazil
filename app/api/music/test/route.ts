import { NextResponse } from "next/server"

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

export async function GET() {
  try {
    // Verificar se as credenciais do Spotify estão configuradas
    const clientId = process.env.SPOTIFY_CLIENT_ID
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET

    if (!clientId || !clientSecret) {
      console.error("Credenciais do Spotify não configuradas:", {
        clientId: !!clientId,
        clientSecret: !!clientSecret,
      })
      return NextResponse.json(
        {
          error: "Credenciais do Spotify não configuradas",
          details: {
            hasClientId: !!clientId,
            hasClientSecret: !!clientSecret,
          },
        },
        { status: 500 },
      )
    }

    // Tentar obter um token para verificar se as credenciais estão corretas
    const token = await getSpotifyToken()

    // Fazer uma requisição simples para a API do Spotify para verificar se o token funciona
    const response = await fetch("https://api.spotify.com/v1/browse/new-releases?limit=1", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`Erro ao acessar API do Spotify: ${errorData.error?.message || response.statusText}`)
    }

    return NextResponse.json({
      success: true,
      message: "Conexão com a API do Spotify estabelecida com sucesso",
      credentials: {
        hasClientId: !!clientId,
        hasClientSecret: !!clientSecret,
      },
    })
  } catch (error) {
    console.error("Erro no teste de conexão com o Spotify:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Erro desconhecido ao testar conexão com o Spotify",
      },
      { status: 500 },
    )
  }
}
