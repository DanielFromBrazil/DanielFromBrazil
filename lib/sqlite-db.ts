import sqlite3 from "sqlite3"
import { open } from "sqlite"
import { mkdir } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"
import { deleteFromCloudinary } from "./cloudinary"

// Função para obter o caminho do banco de dados
function getDbPath() {
  // Em ambiente de produção (Vercel), use o diretório /tmp
  if (process.env.VERCEL) {
    return "/tmp/love-journal.db"
  }

  // Em desenvolvimento, use o diretório data no projeto
  return join(process.cwd(), "data", "love-journal.db")
}

// Caminho para o banco de dados SQLite
const DB_PATH = getDbPath()

// Função para inicializar o banco de dados
export async function initSQLiteDatabase() {
  try {
    // Em ambiente de desenvolvimento, criar diretório de dados se não existir
    if (!process.env.VERCEL) {
      const dataDir = join(process.cwd(), "data")
      if (!existsSync(dataDir)) {
        await mkdir(dataDir, { recursive: true })
      }
    }

    console.log(`Inicializando banco de dados SQLite em: ${DB_PATH}`)

    // Abrir conexão com o banco de dados
    const db = await open({
      filename: DB_PATH,
      driver: sqlite3.Database,
    })

    // Criar tabelas
    await db.exec(`
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT
      )
    `)

    await db.exec(`
      CREATE TABLE IF NOT EXISTS media (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        category_id TEXT NOT NULL,
        date TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id)
      )
    `)

    await db.exec(`
      CREATE TABLE IF NOT EXISTS files (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        media_id INTEGER NOT NULL,
        file_name TEXT NOT NULL,
        file_path TEXT NOT NULL,
        public_id TEXT,
        file_type TEXT NOT NULL,
        file_size INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (media_id) REFERENCES media(id) ON DELETE CASCADE
      )
    `)

    // Criar tabela de favoritos
    await db.exec(`
      CREATE TABLE IF NOT EXISTS favorites (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        media_id INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (media_id) REFERENCES media(id) ON DELETE CASCADE
      )
    `)

    // Inserir categorias padrão
    const categories = [
      { id: "photos", name: "Fotos", description: "Nossos momentos especiais capturados em imagens." },
      { id: "videos", name: "Vídeos", description: "Memórias em movimento do nosso tempo juntos." },
      { id: "letters", name: "Cartas", description: "Palavras sinceras e mensagens de amor." },
      { id: "music", name: "Músicas", description: "Canções que contam nossa história." },
      { id: "voice", name: "Mensagens de Voz", description: "O som do nosso amor em suas próprias palavras." },
      { id: "dates", name: "Datas Especiais", description: "Aniversários e momentos para lembrar." },
      { id: "favorites", name: "Favoritos", description: "Suas memórias favoritas reunidas em um só lugar." },
    ]

    for (const category of categories) {
      await db.run("INSERT OR IGNORE INTO categories (id, name, description) VALUES (?, ?, ?)", [
        category.id,
        category.name,
        category.description,
      ])
    }

    await db.close()
    console.log("Banco de dados SQLite inicializado com sucesso")
    return true
  } catch (error) {
    console.error("Erro ao inicializar banco de dados SQLite:", error)
    throw error
  }
}

// Função para obter conexão com o banco de dados
export async function getSQLiteDb() {
  return open({
    filename: DB_PATH,
    driver: sqlite3.Database,
  })
}

// Obter todas as categorias
export async function getSQLiteCategories() {
  const db = await getSQLiteDb()
  try {
    const categories = await db.all("SELECT * FROM categories")
    return categories
  } finally {
    await db.close()
  }
}

// Obter mídia por categoria
export async function getSQLiteMediaByCategory(categoryId: string) {
  const db = await getSQLiteDb()
  try {
    // Primeiro, obter todas as mídias da categoria
    const mediaItems = await db.all(
      `SELECT m.* 
       FROM media m 
       WHERE m.category_id = ? 
       ORDER BY m.date DESC, m.id DESC`, // Adicionado ordenação por ID para garantir que as mais recentes apareçam primeiro
      [categoryId],
    )

    // Para cada mídia, buscar todos os arquivos associados
    for (const media of mediaItems) {
      const files = await db.all("SELECT * FROM files WHERE media_id = ? ORDER BY id ASC", [media.id])

      // Adicionar os arquivos à mídia
      media.files = files

      // Manter a compatibilidade com o código existente
      if (files.length > 0) {
        media.file_path = files[0].file_path
      }
    }

    return mediaItems
  } finally {
    await db.close()
  }
}

// Adicionar nova mídia
export async function addSQLiteMedia(data: {
  title: string
  description: string
  categoryId: string
  date: string
}) {
  const db = await getSQLiteDb()
  try {
    const result = await db.run("INSERT INTO media (title, description, category_id, date) VALUES (?, ?, ?, ?)", [
      data.title,
      data.description,
      data.categoryId,
      data.date,
    ])
    return result.lastID
  } finally {
    await db.close()
  }
}

// Adicionar arquivo para mídia
export async function addSQLiteFile(data: {
  mediaId: number
  fileName: string
  filePath: string
  fileType: string
  fileSize: number
  publicId?: string
}) {
  const db = await getSQLiteDb()
  try {
    // Verificar se o arquivo já existe para esta mídia (para evitar duplicação)
    const existingFile = await db.get("SELECT * FROM files WHERE media_id = ? AND file_name = ?", [
      data.mediaId,
      data.fileName,
    ])

    // Se o arquivo já existe, não adicionar novamente
    if (existingFile) {
      console.log(`Arquivo ${data.fileName} já existe para a mídia ${data.mediaId}, pulando...`)
      return
    }

    // Adicionar o arquivo
    await db.run(
      "INSERT INTO files (media_id, file_name, file_path, file_type, file_size, public_id) VALUES (?, ?, ?, ?, ?, ?)",
      [data.mediaId, data.fileName, data.filePath, data.fileType, data.fileSize, data.publicId || null],
    )

    console.log(`Arquivo ${data.fileName} adicionado com sucesso para a mídia ${data.mediaId}`)
  } finally {
    await db.close()
  }
}

// Adicionar ou remover favorito
export async function toggleSQLiteFavorite(mediaId: number) {
  const db = await getSQLiteDb()
  try {
    // Verificar se o item já é favorito
    const existingFavorite = await db.get("SELECT * FROM favorites WHERE media_id = ?", [mediaId])

    if (existingFavorite) {
      // Se já é favorito, remover
      await db.run("DELETE FROM favorites WHERE media_id = ?", [mediaId])
      return { isFavorite: false }
    } else {
      // Se não é favorito, adicionar
      await db.run("INSERT INTO favorites (media_id) VALUES (?)", [mediaId])
      return { isFavorite: true }
    }
  } finally {
    await db.close()
  }
}

// Verificar se um item é favorito
export async function checkSQLiteFavorite(mediaId: number) {
  const db = await getSQLiteDb()
  try {
    const favorite = await db.get("SELECT * FROM favorites WHERE media_id = ?", [mediaId])
    return { isFavorite: !!favorite }
  } finally {
    await db.close()
  }
}

// Obter todos os favoritos
export async function getSQLiteFavorites() {
  const db = await getSQLiteDb()
  try {
    // Primeiro, obter todas as mídias favoritas
    const mediaItems = await db.all(`
      SELECT m.* 
      FROM media m 
      JOIN favorites fav ON m.id = fav.media_id 
      ORDER BY m.date DESC, m.id DESC`) // Adicionado ordenação por ID para garantir que as mais recentes apareçam primeiro

    // Para cada mídia, buscar todos os arquivos associados
    for (const media of mediaItems) {
      const files = await db.all("SELECT * FROM files WHERE media_id = ? ORDER BY id ASC", [media.id])

      // Adicionar os arquivos à mídia
      media.files = files

      // Manter a compatibilidade com o código existente
      if (files.length > 0) {
        media.file_path = files[0].file_path
      }
    }

    return mediaItems
  } finally {
    await db.close()
  }
}

// Excluir mídia
export async function deleteSQLiteMedia(id: number) {
  const db = await getSQLiteDb()
  try {
    // First, get all files associated with this media to delete from Cloudinary
    const files = await db.all("SELECT * FROM files WHERE media_id = ?", [id])

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

    // Primeiro, excluir registros relacionados na tabela de favoritos
    await db.run("DELETE FROM favorites WHERE media_id = ?", [id])

    // Depois, excluir registros relacionados na tabela de arquivos
    await db.run("DELETE FROM files WHERE media_id = ?", [id])

    // Por fim, excluir o registro da mídia
    await db.run("DELETE FROM media WHERE id = ?", [id])

    return { success: true }
  } finally {
    await db.close()
  }
}

// Obter todas as mídias
export async function getSQLiteAllMedia() {
  const db = await getSQLiteDb()
  try {
    // Obter todas as mídias com ordenação por data e ID
    const mediaItems = await db.all(
      `SELECT m.* 
       FROM media m 
       ORDER BY m.date DESC, m.id DESC`,
    )

    // Para cada mídia, buscar todos os arquivos associados
    for (const media of mediaItems) {
      const files = await db.all("SELECT * FROM files WHERE media_id = ? ORDER BY id ASC", [media.id])

      // Adicionar os arquivos à mídia
      media.files = files

      // Manter a compatibilidade com o código existente
      if (files.length > 0) {
        media.file_path = files[0].file_path
      }
    }

    return mediaItems
  } finally {
    await db.close()
  }
}

// Adicionar função para obter todos os arquivos de uma mídia
export async function getSQLiteFilesByMediaId(mediaId: number) {
  const db = await getSQLiteDb()
  try {
    const files = await db.all("SELECT * FROM files WHERE media_id = ? ORDER BY id ASC", [mediaId])
    return files
  } finally {
    await db.close()
  }
}
