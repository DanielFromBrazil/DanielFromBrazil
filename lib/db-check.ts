import mysql from "mysql2/promise"

export async function checkDatabaseConnection() {
  try {
    console.log("Tentando conectar ao banco de dados com as seguintes configurações:")
    console.log("Host:", process.env.MYSQL_HOST)
    console.log("Usuário:", process.env.MYSQL_USER)
    console.log("Banco de dados:", process.env.MYSQL_DATABASE)

    const connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
    })

    await connection.ping()
    console.log("Conexão com o banco de dados estabelecida com sucesso!")

    await connection.end()
    return { success: true, message: "Conexão com o banco de dados estabelecida com sucesso!" }
  } catch (error) {
    console.error("Erro ao conectar ao banco de dados:", error)
    return {
      success: false,
      message: `Falha ao conectar ao banco de dados: ${error instanceof Error ? error.message : String(error)}`,
      error,
    }
  }
}
