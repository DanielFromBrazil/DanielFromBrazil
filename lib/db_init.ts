import { createConnection } from "./db_connection"

export async function checkDatabase() {
  let connection

  try {
    connection = await createConnection()

    // Verificar se a tabela media existe
    const [tables] = await connection.execute("SHOW TABLES LIKE 'media'")

    if ((tables as any[]).length === 0) {
      console.log("Criando tabelas iniciais...")

      // Criar tabela media
      await connection.execute(`
        CREATE TABLE media (
          id INT AUTO_INCREMENT PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          category_id VARCHAR(50) NOT NULL,
          date DATE NOT NULL,
          track_data TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `)

      // Criar tabela files
      await connection.execute(`
        CREATE TABLE files (
          id INT AUTO_INCREMENT PRIMARY KEY,
          media_id INT NOT NULL,
          file_path VARCHAR(255) NOT NULL,
          file_name VARCHAR(255) NOT NULL,
          file_type VARCHAR(100),
          file_size INT,
          public_id VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (media_id) REFERENCES media(id) ON DELETE CASCADE
        )
      `)

      // Criar tabela favorites
      await connection.execute(`
        CREATE TABLE favorites (
          id INT AUTO_INCREMENT PRIMARY KEY,
          media_id INT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (media_id) REFERENCES media(id) ON DELETE CASCADE
        )
      `)

      console.log("Tabelas criadas com sucesso!")
    } else {
      // Verificar se a coluna track_data existe na tabela media
      const [columns] = await connection.execute("SHOW COLUMNS FROM media LIKE 'track_data'")

      if ((columns as any[]).length === 0) {
        console.log("Adicionando coluna track_data à tabela media...")
        await connection.execute("ALTER TABLE media ADD COLUMN track_data TEXT")
        console.log("Coluna track_data adicionada com sucesso!")
      }
    }

    return { success: true }
  } catch (error) {
    console.error("Erro ao verificar/criar banco de dados:", error)
    return { success: false, error }
  } finally {
    if (connection) await connection.end()
  }
}

// Exportar a função para uso em outros arquivos
export const initDatabase = checkDatabase
