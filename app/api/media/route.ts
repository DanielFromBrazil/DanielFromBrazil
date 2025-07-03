import { type NextRequest, NextResponse } from "next/server"
import { getMediaByCategory, getAllMedia, getSQLiteMediaByCategory, getSQLiteAllMedia } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    // Get category ID from query parameters
    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get("categoryId")

    console.log("Requisição de mídia recebida para categoria:", categoryId || "todas")

    // Determine which database to use
    const useMySQL = process.env.USE_MYSQL !== "false"
    console.log("Usando MySQL:", useMySQL)

    let mediaItems
    if (categoryId) {
      // Fetch media items for the category
      mediaItems = useMySQL ? await getMediaByCategory(categoryId) : await getSQLiteMediaByCategory(categoryId)
    } else {
      // Fetch all media items
      mediaItems = useMySQL ? await getAllMedia() : await getSQLiteAllMedia()
    }

    console.log(`Retornando ${mediaItems.length} itens de mídia`)

    // Log para depuração
    if (mediaItems.length > 0) {
      console.log("Exemplo do primeiro item:", {
        id: mediaItems[0].id,
        title: mediaItems[0].title,
        date: mediaItems[0].date,
        hasFiles: mediaItems[0].files?.length || 0,
        hasTrackData: !!mediaItems[0].track_data,
      })
    }

    return NextResponse.json(mediaItems)
  } catch (error) {
    console.error("Error fetching media:", error)
    return NextResponse.json({ error: "Failed to fetch media" }, { status: 500 })
  }
}
