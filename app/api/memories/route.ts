import { type NextRequest, NextResponse } from "next/server"
import { getMediaByCategory, getAllMedia } from "@/lib/db"
import { getSQLiteMediaByCategory, getSQLiteAllMedia } from "@/lib/sqlite"

export async function GET(request: NextRequest) {
  try {
    // Get category ID from query parameters
    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get("categoryId")

    // Determine which database to use
    const useMySQL = process.env.USE_MYSQL !== "false"

    let mediaItems
    if (categoryId) {
      // Fetch media items for the category
      mediaItems = useMySQL ? await getMediaByCategory(categoryId) : await getSQLiteMediaByCategory(categoryId)
    } else {
      // Fetch all media items
      mediaItems = useMySQL ? await getAllMedia() : await getSQLiteAllMedia()
    }

    return NextResponse.json(mediaItems)
  } catch (error) {
    console.error("Error fetching media:", error)
    return NextResponse.json({ error: "Failed to fetch media" }, { status: 500 })
  }
}
