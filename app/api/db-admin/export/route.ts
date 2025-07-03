import { NextResponse } from "next/server"
import { getSQLiteDb } from "@/lib/sqlite-db"

export async function GET() {
  try {
    const db = await getSQLiteDb()

    // Buscar todos os dados
    const [media, files, favorites, categories] = await Promise.all([
      db.all("SELECT * FROM media ORDER BY id"),
      db.all("SELECT * FROM files ORDER BY id"),
      db.all("SELECT * FROM favorites ORDER BY id"),
      db.all("SELECT * FROM categories ORDER BY id"),
    ])

    await db.close()

    const exportData = {
      timestamp: new Date().toISOString(),
      tables: {
        media,
        files,
        favorites,
        categories,
      },
      stats: {
        totalMedia: media.length,
        totalFiles: files.length,
        totalFavorites: favorites.length,
        totalCategories: categories.length,
      },
    }

    const jsonString = JSON.stringify(exportData, null, 2)

    return new NextResponse(jsonString, {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="backup-${new Date().toISOString().split("T")[0]}.json"`,
      },
    })
  } catch (error) {
    console.error("Erro ao exportar dados:", error)
    return NextResponse.json({ error: "Erro ao exportar dados" }, { status: 500 })
  }
}
