import { NextResponse } from "next/server"
import { getSQLiteDb } from "@/lib/sqlite-db"

export async function GET() {
  try {
    const db = await getSQLiteDb()
    const favorites = await db.all("SELECT * FROM favorites ORDER BY created_at DESC")
    await db.close()
    return NextResponse.json(favorites)
  } catch (error) {
    console.error("Erro ao buscar favoritos:", error)
    return NextResponse.json({ error: "Erro ao buscar favoritos" }, { status: 500 })
  }
}
