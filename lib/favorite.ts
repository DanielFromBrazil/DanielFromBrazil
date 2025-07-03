import { createConnection } from "./db_connection"

// Toggle favorite status for a media item
export async function toggleFavorite(mediaId: number) {
  let connection

  try {
    connection = await createConnection()

    // Check if the item is already a favorite
    const [existingRows] = await connection.execute("SELECT * FROM favorites WHERE media_id = ?", [mediaId])
    const existingFavorites = existingRows as any[]

    if (existingFavorites.length > 0) {
      // If it's already a favorite, remove it
      await connection.execute("DELETE FROM favorites WHERE media_id = ?", [mediaId])
      return { isFavorite: false }
    } else {
      // If it's not a favorite, add it
      await connection.execute("INSERT INTO favorites (media_id) VALUES (?)", [mediaId])
      return { isFavorite: true }
    }
  } catch (error) {
    console.error("Error toggling favorite:", error)
    throw error
  } finally {
    if (connection) await connection.end()
  }
}

// Check if a media item is a favorite
export async function checkFavorite(mediaId: number) {
  let connection

  try {
    connection = await createConnection()
    const [rows] = await connection.execute("SELECT * FROM favorites WHERE media_id = ?", [mediaId])
    const favorites = rows as any[]
    return { isFavorite: favorites.length > 0 }
  } catch (error) {
    console.error("Error checking favorite:", error)
    throw error
  } finally {
    if (connection) await connection.end()
  }
}
