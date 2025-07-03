import mysql from "mysql2/promise"

// Database connection configuration
export async function createConnection() {
  try {
    if (
      !process.env.MYSQL_HOST ||
      !process.env.MYSQL_USER ||
      !process.env.MYSQL_PASSWORD ||
      !process.env.MYSQL_DATABASE
    ) {
      throw new Error("Variáveis de ambiente do MySQL não configuradas corretamente")
    }

    const connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
    })

    return connection
  } catch (error) {
    console.error("Erro ao conectar ao banco de dados MySQL:", error)
    throw new Error(`Falha ao conectar ao banco de dados: ${error instanceof Error ? error.message : String(error)}`)
  }
}
