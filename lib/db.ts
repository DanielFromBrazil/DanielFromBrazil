import { createConnection } from "./db_connection"
import { addMedia, getAllMedia } from "./media"
import { initDatabase, checkDatabase } from "./db_init"
import { toggleFavorite, checkFavorite } from "./favorite"
import { deleteFromCloudinary } from "./cloudinary"

// Modificar a função addFile para suportar um array de arquivos
export async function addFile(data: {
  mediaId: number
  fileName: string
  filePath: string
  fileType: string
  fileSize: number
  publicId?: string
}) {
  let connection

  try {
    connection = await createConnection()

    // Verificar se o arquivo já existe para esta mídia (para evitar duplicação)
    const [existingFiles] = await connection.execute("SELECT * FROM files WHERE media_id = ? AND file_name = ?", [
      data.mediaId,
      data.fileName,
    ])

    // Se o arquivo já existe, não adicionar novamente
    if (Array.isArray(existingFiles) && existingFiles.length > 0) {
      console.log(`Arquivo ${data.fileName} já existe para a mídia ${data.mediaId}, pulando...`)
      return
    }

    // Adicionar o arquivo
    await connection.execute(
      "INSERT INTO files (media_id, file_name, file_path, file_type, file_size, public_id) VALUES (?, ?, ?, ?, ?, ?)",
      [data.mediaId, data.fileName, data.filePath, data.fileType, data.fileSize, data.publicId || null],
    )

    console.log(`Arquivo ${data.fileName} adicionado com sucesso para a mídia ${data.mediaId}`)
  } catch (error) {
    console.error("Erro ao adicionar arquivo:", error)
    throw error
  } finally {
    if (connection) await connection.end()
  }
}

// Adicionar função para obter todos os arquivos de uma mídia
export async function getFilesByMediaId(mediaId: number) {
  let connection

  try {
    connection = await createConnection()
    const [rows] = await connection.execute("SELECT * FROM files WHERE media_id = ? ORDER BY id ASC", [mediaId])
    return rows
  } catch (error) {
    console.error(`Erro ao buscar arquivos para mídia ${mediaId}:`, error)
    throw error
  } finally {
    if (connection) await connection.end()
  }
}

// Melhorar a função getMediaByCategory para incluir dados da música

// Modificar a função getMediaByCategory para incluir todos os arquivos
export async function getMediaByCategory(categoryId: string) {
  let connection

  try {
    connection = await createConnection()

    // Primeiro, obter todas as mídias da categoria
    const [mediaRows] = await connection.execute(
      `SELECT m.* 
       FROM media m 
       WHERE m.category_id = ? 
       ORDER BY m.date DESC, m.id DESC`, // Adicionado ordenação por ID para garantir que as mais recentes apareçam primeiro
      [categoryId],
    )

    const mediaItems = mediaRows as any[]
    console.log(`Encontrados ${mediaItems.length} itens para categoria ${categoryId}`)

    // Para cada mídia, buscar todos os arquivos associados
    for (const media of mediaItems) {
      const [fileRows] = await connection.execute("SELECT * FROM files WHERE media_id = ? ORDER BY id ASC", [media.id])

      const files = fileRows as any[]

      // Adicionar os arquivos à mídia
      media.files = files

      // Manter a compatibilidade com o código existente
      if (files.length > 0) {
        media.file_path = files[0].file_path
      }

      // Log para depuração
      console.log(`Item ${media.id}: ${media.title}, arquivos: ${files.length}, tem track_data: ${!!media.track_data}`)
    }

    return mediaItems
  } catch (error) {
    console.error(`Erro ao buscar mídia para categoria ${categoryId}:`, error)
    throw error
  } finally {
    if (connection) await connection.end()
  }
}

// Modificar a função getFavorites para incluir todos os arquivos e garantir que está funcionando corretamente
export async function getFavorites() {
  let connection

  try {
    connection = await createConnection()

    // Primeiro, obter todas as mídias favoritas
    const [mediaRows] = await connection.execute(`
      SELECT m.* 
      FROM media m 
      JOIN favorites fav ON m.id = fav.media_id 
      ORDER BY m.date DESC, m.id DESC`) // Adicionado ordenação por ID para garantir que as mais recentes apareçam primeiro

    const mediaItems = mediaRows as any[]

    console.log("Favoritos encontrados no banco:", mediaItems.length)

    // Para cada mídia, buscar todos os arquivos associados
    for (const media of mediaItems) {
      const [fileRows] = await connection.execute("SELECT * FROM files WHERE media_id = ? ORDER BY id ASC", [media.id])

      const files = fileRows as any[]

      // Adicionar os arquivos à mídia
      media.files = files

      // Manter a compatibilidade com o código existente
      if (files.length > 0) {
        media.file_path = files[0].file_path
      }
    }

    return mediaItems
  } catch (error) {
    console.error("Erro ao buscar favoritos:", error)
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

    // First, get all files associated with this media to delete from Cloudinary
    const [fileRows] = await connection.execute("SELECT * FROM files WHERE media_id = ?", [id])
    const files = fileRows as any[]

    // Delete files from Cloudinary if they have public_id
    for (const file of files) {
      if (file.public_id) {
        try {
          await deleteFromCloudinary(file.public_id)
        } catch (error) {
          console.error(`Error deleting file from Cloudinary (public_id: ${file.public_id}):`, error)
          // Continue with deletion even if Cloudinary deletion fails
        }
      }
    }

    // Delete related records in the favorites table
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

// Re-export all the required functions
export { addMedia, initDatabase, checkDatabase, toggleFavorite, checkFavorite, getAllMedia }

// Placeholder functions for SQLite, to satisfy the imports
export async function getSQLiteMediaByCategory(categoryId: string) {
  console.warn("getSQLiteMediaByCategory called, but SQLite implementation is in sqlite.ts")
  return []
}

export async function getSQLiteAllMedia() {
  console.warn("getSQLiteAllMedia called, but SQLite implementation is in sqlite.ts")
  return []
}
