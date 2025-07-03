"use server"

import { revalidatePath } from "next/cache"
import {
  initDatabase,
  checkDatabase as dbCheckDatabase,
  checkFavorite as mysqlCheckFavorite,
  getFavorites as mysqlGetFavorites,
} from "@/lib/db"
import { mkdir, writeFile, readFile } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"
import mysql from "mysql2/promise"
import dns from "dns"
import net from "net"
import { promisify } from "util"
import { initSQLiteDatabase, checkSQLiteFavorite, getSQLiteFavorites } from "@/lib/sqlite"
import { getSQLiteDb } from "@/lib/sqlite"
import { createConnection } from "@/lib/db_connection"

const dnsLookup = promisify(dns.lookup)

// Re-exportar a função checkDatabase do módulo db
export const checkDatabase = dbCheckDatabase

// Variável global para controlar qual banco de dados usar
let useMySQL = true

// Função para testar conexão MySQL
export async function testMySQLConnection() {
  try {
    if (
      !process.env.MYSQL_HOST ||
      !process.env.MYSQL_USER ||
      !process.env.MYSQL_PASSWORD ||
      !process.env.MYSQL_DATABASE
    ) {
      return {
        success: false,
        message: "Configurações MySQL incompletas. Verifique as variáveis de ambiente.",
      }
    }

    const connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
      connectTimeout: 10000, // 10 segundos
    })

    await connection.ping()
    await connection.end()

    return {
      success: true,
      message: "Conexão MySQL estabelecida com sucesso!",
    }
  } catch (error) {
    return {
      success: false,
      message: `Falha ao conectar ao MySQL: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}

// Função para obter a configuração atual do banco de dados
export async function getCurrentDbConfig() {
  try {
    // Verificar se existe um arquivo de configuração
    const configPath = process.env.VERCEL ? "/tmp/db-config.json" : join(process.cwd(), "data", "db-config.json")

    if (existsSync(configPath)) {
      try {
        const configData = JSON.parse(await readFile(configPath, "utf-8"))
        return {
          useMySQL: configData.useMySQL !== false,
          message: `Configuração carregada do arquivo (${new Date(configData.timestamp).toLocaleString()})`,
        }
      } catch (error) {
        console.error("Erro ao ler arquivo de configuração:", error)
        return {
          useMySQL: true,
          message: `Erro ao ler configuração: ${error instanceof Error ? error.message : String(error)}`,
        }
      }
    } else {
      // Testar conexão MySQL para determinar configuração padrão
      try {
        const mysqlTest = await testMySQLConnection()
        return {
          useMySQL: mysqlTest.success,
          message: mysqlTest.success
            ? "Usando MySQL (conexão testada com sucesso)"
            : "MySQL indisponível, considere mudar para SQLite",
        }
      } catch (error) {
        return {
          useMySQL: false,
          message: "Erro ao testar MySQL, recomendado usar SQLite",
        }
      }
    }
  } catch (error) {
    console.error("Erro ao obter configuração do banco de dados:", error)
    return {
      useMySQL: true,
      message: `Erro ao determinar configuração: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}

// Função para mudar para SQLite
export async function switchToSQLite() {
  try {
    // Inicializar banco de dados SQLite
    await initSQLiteDatabase()

    // Mudar a variável global para usar SQLite
    useMySQL = false

    // Criar um arquivo de configuração para persistir a escolha
    // Em ambiente Vercel, usamos o /tmp
    const configPath = process.env.VERCEL ? "/tmp/db-config.json" : join(process.cwd(), "data", "db-config.json")

    // Certifique-se de que o diretório existe em ambiente de desenvolvimento
    if (!process.env.VERCEL && !existsSync(join(process.cwd(), "data"))) {
      await mkdir(join(process.cwd(), "data"), { recursive: true })
    }

    await writeFile(configPath, JSON.stringify({ useMySQL: false, timestamp: new Date().toISOString() }), "utf-8")

    return {
      success: true,
      message: "Mudança para SQLite concluída com sucesso!",
    }
  } catch (error) {
    console.error("Erro ao mudar para SQLite:", error)
    return {
      success: false,
      message: `Falha ao mudar para SQLite: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}

// Função de diagnóstico
export async function runDiagnostic() {
  const results: any = {
    timestamp: new Date().toISOString(),
    environment: {},
    dnsLookup: {},
    portCheck: {},
    mysqlConnection: {},
  }

  // Informações do ambiente
  results.environment = {
    nodeEnv: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV,
    region: process.env.VERCEL_REGION,
    mysqlHost: process.env.MYSQL_HOST,
    mysqlDatabase: process.env.MYSQL_DATABASE,
    mysqlUser: process.env.MYSQL_USER,
    // Não incluímos a senha por segurança
    mysqlPasswordLength: process.env.MYSQL_PASSWORD ? process.env.MYSQL_PASSWORD.length : 0,
  }

  // Teste de DNS
  try {
    if (process.env.MYSQL_HOST) {
      // Verifica se o host não é um IP
      if (!/^\d+\.\d+\.\d+\.\d+$/.test(process.env.MYSQL_HOST)) {
        const dnsResult = await dnsLookup(process.env.MYSQL_HOST)
        results.dnsLookup = {
          success: true,
          host: process.env.MYSQL_HOST,
          ip: dnsResult.address,
          family: dnsResult.family,
        }
      } else {
        results.dnsLookup = {
          success: true,
          message: "Host já é um endereço IP, pulando resolução DNS",
          ip: process.env.MYSQL_HOST,
        }
      }
    } else {
      results.dnsLookup = {
        success: false,
        message: "MYSQL_HOST não está definido",
      }
    }
  } catch (error) {
    results.dnsLookup = {
      success: false,
      message: `Erro ao resolver DNS: ${error instanceof Error ? error.message : String(error)}`,
    }
  }

  // Teste de porta
  try {
    if (process.env.MYSQL_HOST) {
      const host = process.env.MYSQL_HOST
      const port = 3306 // Porta padrão do MySQL

      const portCheckPromise = new Promise<{ success: boolean; message: string }>((resolve) => {
        const socket = new net.Socket()

        // Timeout após 5 segundos
        socket.setTimeout(5000)

        socket.on("connect", () => {
          socket.end()
          resolve({ success: true, message: `Porta ${port} está aberta em ${host}` })
        })

        socket.on("timeout", () => {
          socket.destroy()
          resolve({
            success: false,
            message: `Timeout ao tentar conectar na porta ${port} em ${host}. Isso pode indicar um firewall bloqueando a conexão.`,
          })
        })

        socket.on("error", (err) => {
          resolve({
            success: false,
            message: `Erro ao conectar na porta ${port} em ${host}: ${err.message}`,
          })
        })

        socket.connect(port, host)
      })

      results.portCheck = await portCheckPromise
    } else {
      results.portCheck = {
        success: false,
        message: "MYSQL_HOST não está definido",
      }
    }
  } catch (error) {
    results.portCheck = {
      success: false,
      message: `Erro ao verificar porta: ${error instanceof Error ? error.message : String(error)}`,
    }
  }

  // Teste de conexão MySQL
  try {
    if (process.env.MYSQL_HOST && process.env.MYSQL_USER && process.env.MYSQL_PASSWORD && process.env.MYSQL_DATABASE) {
      try {
        const connection = await mysql.createConnection({
          host: process.env.MYSQL_HOST,
          user: process.env.MYSQL_USER,
          password: process.env.MYSQL_PASSWORD,
          database: process.env.MYSQL_DATABASE,
          connectTimeout: 10000, // 10 segundos
        })

        await connection.ping()
        await connection.end()

        results.mysqlConnection = {
          success: true,
          message: "Conexão MySQL estabelecida com sucesso",
        }
      } catch (error) {
        results.mysqlConnection = {
          success: false,
          message: `Erro ao conectar ao MySQL: ${error instanceof Error ? error.message : String(error)}`,
        }
      }
    } else {
      results.mysqlConnection = {
        success: false,
        message: "Configurações MySQL incompletas",
      }
    }
  } catch (error) {
    results.mysqlConnection = {
      success: false,
      message: `Erro ao testar conexão MySQL: ${error instanceof Error ? error.message : String(error)}`,
    }
  }

  return results
}

// Initialize the database and create uploads directory
export async function initApp() {
  try {
    // Verificar si existe un archivo de configuração para determinar qual banco de dados usar
    const configPath = process.env.VERCEL ? "/tmp/db-config.json" : join(process.cwd(), "data", "db-config.json")

    if (existsSync(configPath)) {
      try {
        const configData = JSON.parse(await readFile(configPath, "utf-8"))
        useMySQL = configData.useMySQL !== false // Se não for explicitamente false, use MySQL
        console.log(`Configuração de banco de dados carregada: usando ${useMySQL ? "MySQL" : "SQLite"}`)
      } catch (error) {
        console.error("Erro ao ler arquivo de configuração de banco de dados:", error)
        // Em caso de erro, continua com a configuração padrão (MySQL)
      }
    }

    // Verificar se devemos usar SQLite ou MySQL
    if (useMySQL) {
      // Verificar conexão com o banco de dados MySQL
      const dbCheck = await dbCheckDatabase()
      if (!dbCheck.success) {
        console.log("Falha na conexão MySQL, tentando inicializar SQLite como fallback")
        // Se falhar a conexão MySQL, tenta usar SQLite como fallback
        try {
          await initSQLiteDatabase()
          useMySQL = false
          console.log("SQLite inicializado com sucesso como fallback")
        } catch (sqliteError) {
          console.error("Erro ao inicializar SQLite como fallback:", sqliteError)
          return dbCheck // Retorna o erro original do MySQL
        }
      } else {
        // Initialize MySQL database
        await initDatabase()
      }
    } else {
      // Initialize SQLite database
      await initSQLiteDatabase()
    }

    // Create uploads directory if it doesn't exist and we're not in Vercel
    if (!process.env.VERCEL) {
      const uploadsDir = join(process.cwd(), "public", "uploads")
      if (!existsSync(uploadsDir)) {
        try {
          await mkdir(uploadsDir, { recursive: true })
          console.log("Diretório de uploads criado em:", uploadsDir)
        } catch (error) {
          console.error("Erro ao criar diretório de uploads:", error)
          // Não falha a inicialização se não conseguir criar o diretório de uploads
        }
      }
    } else {
      // No Vercel, tentamos criar o diretório de uploads no /tmp
      const tmpUploadsDir = join("/tmp", "uploads")
      if (!existsSync(tmpUploadsDir)) {
        try {
          await mkdir(tmpUploadsDir, { recursive: true })
          console.log("Diretório de uploads criado em:", tmpUploadsDir)
        } catch (error) {
          console.error("Erro ao criar diretório de uploads temporário:", error)
          // Não falha a inicialização se não conseguir criar o diretório de uploads
        }
      }
    }

    return { success: true, message: `Aplicativo inicializado com sucesso usando ${useMySQL ? "MySQL" : "SQLite"}!` }
  } catch (error) {
    console.error("Erro ao inicializar aplicativo:", error)
    return {
      success: false,
      message: `Falha ao inicializar aplicativo: ${error instanceof Error ? error.message : String(error)}`,
      error,
    }
  }
}

// Modificar a função addMemory para melhorar o tratamento de erros e adicionar mais logs

export async function addMemory(formData: FormData) {
  try {
    const title = formData.get("title") as string
    const category = formData.get("category") as string
    const description = formData.get("description") as string
    const date = formData.get("date") as string
    const contentType = (formData.get("contentType") as string) || "files"

    // Validar campos obrigatórios
    if (!title || !category || !date) {
      return { success: false, error: "Campos obrigatórios não preenchidos" }
    }

    // Conectar ao banco de dados
    const connection = await createConnection()

    try {
      // Iniciar transação
      await connection.beginTransaction()

      // Inserir na tabela media
      const [mediaResult] = await connection.execute(
        "INSERT INTO media (title, description, category_id, date) VALUES (?, ?, ?, ?)",
        [title, description, category, date],
      )

      const mediaId = (mediaResult as any).insertId

      // Processar dados de arquivo ou música dependendo do tipo de conteúdo
      if (contentType === "files") {
        // Processar arquivos
        const fileDataStr = formData.get("fileData") as string

        if (fileDataStr) {
          const fileData = JSON.parse(fileDataStr)

          // Inserir cada arquivo na tabela files
          for (const file of fileData) {
            await connection.execute(
              "INSERT INTO files (media_id, file_path, file_name, file_type, file_size, public_id) VALUES (?, ?, ?, ?, ?, ?)",
              [mediaId, file.path, file.name, file.type, file.size, file.public_id || null],
            )
          }
        }
      } else if (contentType === "music") {
        // Processar dados da música
        const trackDataStr = formData.get("trackData") as string

        if (trackDataStr) {
          console.log("Salvando dados da música:", trackDataStr.substring(0, 100) + "...")

          try {
            // Verificar se os dados são JSON válido
            JSON.parse(trackDataStr)

            // Atualizar o registro de mídia com os dados da faixa
            await connection.execute("UPDATE media SET track_data = ? WHERE id = ?", [trackDataStr, mediaId])

            console.log("Dados da música salvos com sucesso para o ID:", mediaId)
          } catch (error) {
            console.error("Erro ao processar dados da música:", error)
            throw new Error("Dados da música inválidos")
          }
        }
      }

      // Confirmar transação
      await connection.commit()

      // Revalidar caminhos
      revalidatePath("/")
      revalidatePath(`/category/${category}`)

      return { success: true, mediaId }
    } catch (error) {
      // Reverter transação em caso de erro
      await connection.rollback()
      console.error("Erro ao adicionar memória:", error)
      throw error
    } finally {
      // Fechar conexão
      await connection.end()
    }
  } catch (error) {
    console.error("Erro ao adicionar memória:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    }
  }
}

// Adicionar após a função addMemory

// Alternar favorito
export async function toggleFavorite(mediaId: number) {
  try {
    const connection = await createConnection()

    try {
      // Verificar se já é favorito
      const [rows] = await connection.execute("SELECT * FROM favorites WHERE media_id = ?", [mediaId])
      const favorites = rows as any[]

      if (favorites.length > 0) {
        // Remover dos favoritos
        await connection.execute("DELETE FROM favorites WHERE media_id = ?", [mediaId])
      } else {
        // Adicionar aos favoritos
        await connection.execute("INSERT INTO favorites (media_id) VALUES (?)", [mediaId])
      }

      // Revalidar caminhos
      revalidatePath("/")
      revalidatePath("/favorites")
      revalidatePath("/category/[id]")

      return { success: true, isFavorite: favorites.length === 0 }
    } finally {
      await connection.end()
    }
  } catch (error) {
    console.error("Erro ao alternar favorito:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    }
  }
}

// Verificar favorito
export async function checkFavorite(mediaId: number) {
  try {
    if (useMySQL) {
      return await mysqlCheckFavorite(mediaId)
    } else {
      return await checkSQLiteFavorite(mediaId)
    }
  } catch (error) {
    console.error("Erro ao verificar favorito:", error)
    return {
      success: false,
      isFavorite: false,
      error: `Falha ao verificar favorito: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}

// Obter favoritos
export async function getFavorites() {
  try {
    console.log("Obtendo favoritos, usando MySQL:", useMySQL)

    let favorites
    if (useMySQL) {
      favorites = await mysqlGetFavorites()
    } else {
      favorites = await getSQLiteFavorites()
    }

    console.log("Favoritos obtidos:", favorites.length)
    return favorites
  } catch (error) {
    console.error("Erro ao obter favoritos:", error)
    throw error
  }
}

// Verificar si un item es favorito
export async function isFavorite(mediaId: number) {
  try {
    const result = await checkFavorite(mediaId)
    return result.isFavorite
  } catch (error) {
    console.error("Erro ao verificar favorito:", error)
    return false
  }
}

// Adicione esta função ao arquivo app/actions.ts

// Função para executar migração do banco de dados
export async function runDatabaseMigration() {
  try {
    // Verificar qual banco de dados está sendo usado
    const config = await getCurrentDbConfig()

    if (config.useMySQL) {
      // Migração para MySQL
      const connection = await mysql.createConnection({
        host: process.env.MYSQL_HOST,
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DATABASE,
      })

      try {
        // Verificar se a coluna public_id existe na tabela files
        const [columns] = await connection.execute(`
          SHOW COLUMNS FROM files LIKE 'public_id'
        `)

        if (Array.isArray(columns) && columns.length === 0) {
          // Se a coluna não existir, adicionar
          await connection.execute(`
            ALTER TABLE files ADD COLUMN public_id VARCHAR(255)
          `)
          console.log("Coluna public_id adicionada à tabela files")
        } else {
          console.log("Coluna public_id já existe na tabela files")
        }

        await connection.end()
        return { success: true, message: "Migração concluída com sucesso" }
      } catch (error) {
        console.error("Erro durante a migração MySQL:", error)
        await connection.end()
        throw error
      }
    } else {
      // Migração para SQLite
      // SQLite já deve ter a coluna public_id, pois está no esquema inicial
      // Mas vamos verificar e adicionar se necessário
      const db = await getSQLiteDb()

      try {
        // Verificar se a coluna public_id existe na tabela files
        const pragma = await db.all("PRAGMA table_info(files)")
        const hasPublicId = pragma.some((col) => col.name === "public_id")

        if (!hasPublicId) {
          // Se a coluna não existir, adicionar
          await db.exec(`
            ALTER TABLE files ADD COLUMN public_id TEXT
          `)
          console.log("Coluna public_id adicionada à tabela files do SQLite")
        } else {
          console.log("Coluna public_id já existe na tabela files do SQLite")
        }

        await db.close()
        return { success: true, message: "Migração SQLite concluída com sucesso" }
      } catch (error) {
        console.error("Erro durante a migração SQLite:", error)
        await db.close()
        throw error
      }
    }
  } catch (error) {
    console.error("Erro ao executar migração:", error)
    return {
      success: false,
      message: `Falha na migração: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}

export async function deleteMemory(id: number) {
  try {
    const connection = await createConnection()

    try {
      // Obter informações da mídia antes de excluir (para revalidação)
      const [mediaRows] = await connection.execute("SELECT category_id FROM media WHERE id = ?", [id])
      const media = (mediaRows as any[])[0]

      if (!media) {
        return { success: false, error: "Memória não encontrada" }
      }

      const categoryId = media.category_id

      // Excluir da tabela favorites primeiro (chave estrangeira)
      await connection.execute("DELETE FROM favorites WHERE media_id = ?", [id])

      // Excluir da tabela files (chave estrangeira)
      await connection.execute("DELETE FROM files WHERE media_id = ?", [id])

      // Finalmente, excluir da tabela media
      await connection.execute("DELETE FROM media WHERE id = ?", [id])

      // Revalidar caminhos
      revalidatePath("/")
      revalidatePath("/favorites")
      revalidatePath(`/category/${categoryId}`)

      return { success: true }
    } finally {
      await connection.end()
    }
  } catch (error) {
    console.error("Erro ao excluir memória:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    }
  }
}
