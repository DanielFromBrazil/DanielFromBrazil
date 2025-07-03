// Re-exportar as funções do sqlite-db.ts
import {
  initSQLiteDatabase,
  getSQLiteDb,
  getSQLiteCategories,
  getSQLiteMediaByCategory,
  addSQLiteMedia,
  addSQLiteFile,
  toggleSQLiteFavorite,
  checkSQLiteFavorite,
  getSQLiteFavorites,
  deleteSQLiteMedia,
  getSQLiteAllMedia,
} from "./sqlite-db"

export {
  initSQLiteDatabase,
  getSQLiteDb,
  getSQLiteCategories,
  getSQLiteMediaByCategory,
  addSQLiteMedia,
  addSQLiteFile,
  toggleSQLiteFavorite,
  checkSQLiteFavorite,
  getSQLiteFavorites,
  deleteSQLiteMedia,
  getSQLiteAllMedia,
}
