import { NextResponse } from "next/server"
import { deleteSQLiteMedia } from "@/lib/sqlite-db"

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)
    await deleteSQLiteMedia(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao excluir memória:", error)
    return NextResponse.json({ error: "Erro ao excluir memória" }, { status: 500 })
  }
}
