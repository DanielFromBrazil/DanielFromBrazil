import { createConnection } from "./db_connection"

// Get all media items
export async function getAllMedia() {
  let connection

  try {
    connection = await createConnection()

    // First, get all media items
    const [mediaRows] = await connection.execute(
      `SELECT m.* 
       FROM media m 
       ORDER BY m.date DESC`,
    )

    const mediaItems = mediaRows as any[]

    // For each media item, get all associated files
    for (const media of mediaItems) {
      const [fileRows] = await connection.execute("SELECT * FROM files WHERE media_id = ? ORDER BY id ASC", [media.id])

      const files = fileRows as any[]

      // Add files to the media item
      media.files = files

      // Maintain compatibility with existing code
      if (files.length > 0) {
        media.file_path = files[0].file_path
      }
    }

    return mediaItems
  } catch (error) {
    console.error("Error fetching all media:", error)
    throw error
  } finally {
    if (connection) await connection.end()
  }
}

// Add media item
export async function addMedia(data: {
  title: string
  description: string
  categoryId: string
  date: string
}) {
  let connection

  try {
    connection = await createConnection()
    const [result] = await connection.execute(
      "INSERT INTO media (title, description, category_id, date) VALUES (?, ?, ?, ?)",
      [data.title, data.description, data.categoryId, data.date],
    )

    return (result as any).insertId
  } catch (error) {
    console.error("Error adding media:", error)
    throw error
  } finally {
    if (connection) await connection.end()
  }
}

// Delete media item
export async function deleteMedia(id: number) {
  let connection

  try {
    connection = await createConnection()

    // First, delete related records in the favorites table
    await connection.execute("DELETE FROM favorites WHERE media_id = ?", [id])

    // Then, delete related records in the files table
    await connection.execute("DELETE FROM files WHERE media_id = ?", [id])

    // Finally, delete the media record
    await connection.execute("DELETE FROM media WHERE id = ?", [id])

    return { success: true }
  } catch (error) {
    console.error("Error deleting media:", error)
    throw error
  } finally {
    if (connection) await connection.end()
  }
}
