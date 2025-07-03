import { NextResponse } from "next/server"
import { getSQLiteDb } from "@/lib/sqlite-db"

export async function GET() {
  try {
    const db = await getSQLiteDb()
    const files = await db.all("SELECT * FROM files ORDER BY created_at DESC")
    await db.close()
    return NextResponse.json(files)
  } catch (error) {
    console.error("Erro ao buscar arquivos:", error)
    return NextResponse.json({ error: "Erro ao buscar arquivos" }, { status: 500 })
  }
}
