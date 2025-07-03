import { redirect } from "next/navigation"

export default function FavoritesPage() {
  // Redirecionar para a página inicial, já que a categoria de favoritos foi removida
  redirect("/")
}
