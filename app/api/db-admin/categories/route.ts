import { NextResponse } from "next/server"
import { getSQLiteCategories } from "@/lib/sqlite-db"

export async function GET() {
  try {
    const categories = await getSQLiteCategories()
    return NextResponse.json(categories)
  } catch (error) {
    console.error("Erro ao buscar categorias:", error)
    return NextResponse.json({ error: "Erro ao buscar categorias" }, { status: 500 })
  }
}
