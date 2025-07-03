import { NextResponse } from "next/server"
import { getSQLiteAllMedia } from "@/lib/sqlite-db"

export async function GET() {
  try {
    const media = await getSQLiteAllMedia()
    return NextResponse.json(media)
  } catch (error) {
    console.error("Erro ao buscar memórias:", error)
    return NextResponse.json({ error: "Erro ao buscar memórias" }, { status: 500 })
  }
}
