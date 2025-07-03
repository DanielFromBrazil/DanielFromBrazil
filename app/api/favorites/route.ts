import { type NextRequest, NextResponse } from "next/server"
import { toggleFavorite, checkFavorite, getFavorites } from "@/app/actions"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const mediaId = searchParams.get("mediaId")

    if (mediaId) {
      // Se tiver um mediaId, verificar se é favorito
      const result = await checkFavorite(Number(mediaId))
      return NextResponse.json(result)
    } else {
      // Se não tiver mediaId, retornar todos os favoritos
      const favorites = await getFavorites()

      // Log para debug
      console.log("API de favoritos - Favoritos encontrados:", favorites.length)

      return NextResponse.json(favorites)
    }
  } catch (error) {
    console.error("Erro ao buscar favoritos:", error)
    return NextResponse.json({ error: "Falha ao buscar favoritos" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { mediaId } = body

    if (!mediaId) {
      return NextResponse.json({ error: "ID da mídia é obrigatório" }, { status: 400 })
    }

    const result = await toggleFavorite(Number(mediaId))

    // Revalidar a página de favoritos após alteração
    // Isso não é necessário com o client-side fetching, mas é uma boa prática

    return NextResponse.json(result)
  } catch (error) {
    console.error("Erro ao alternar favorito:", error)
    return NextResponse.json({ error: "Falha ao alternar favorito" }, { status: 500 })
  }
}
