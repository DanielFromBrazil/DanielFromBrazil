import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Heart, ArrowLeft } from "lucide-react"
import { CategoryDisplay } from "@/components/category-display"

export default function CategoryPage({ params }: { params: { id: string } }) {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between px-4 md:px-6">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Voltar para Início
            </Link>
          </Button>
        </div>
      </header>
      <main className="flex-1">
        <div className="container px-4 py-6 md:px-6 md:py-12">
          <CategoryDisplay categoryId={params.id} />
        </div>
      </main>
      <footer className="border-t">
        <div className="container flex flex-col gap-2 py-4 md:h-16 md:flex-row md:items-center md:py-0 px-4 md:px-6">
          <div className="flex items-center gap-2">
            <Heart className="h-4 w-4 text-rose-500" fill="currentColor" />
            <span className="text-sm text-muted-foreground">Diário de Amor © {new Date().getFullYear()}</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
