import { type NextRequest, NextResponse } from "next/server"
import { deleteMedia } from "@/lib/db"
import { deleteSQLiteMedia } from "@/lib/sqlite"
import { revalidatePath } from "next/cache"

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 })
    }

    // Determine which database to use
    const useMySQL = process.env.USE_MYSQL !== "false"

    // Delete the media
    const result = useMySQL ? await deleteMedia(id) : await deleteSQLiteMedia(id)

    // Revalidate all category pages
    revalidatePath("/category/[id]")
    revalidatePath("/favorites")

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting media:", error)
    return NextResponse.json({ error: "Failed to delete media" }, { status: 500 })
  }
}
