"use client"

import Link from "next/link"
import { Home, Settings, Heart, PlusCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import SpotifyLogoutButton from "./spotify-logout-button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <Heart className="h-6 w-6 text-rose-500" fill="currentColor" />
            <span className="font-semibold">Diario de Amor</span>
          </Link>
        </div>

        <nav className="flex items-center space-x-4">
          <Link href="/#categories" className="text-sm font-medium">
            Categorias
          </Link>

          <Link href="/#about" className="text-sm font-medium">
            Sobre
          </Link>

          <SpotifyLogoutButton />

          <Link href="/">
            <Button variant="ghost" size="icon">
              <Home className="h-5 w-5" />
              <span className="sr-only">Início</span>
            </Button>
          </Link>

          <Link href="/add-content">
            <Button variant="ghost" size="icon">
              <PlusCircle className="h-5 w-5" />
              <span className="sr-only">Adicionar</span>
            </Button>
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Settings className="h-5 w-5" />
                <span className="sr-only">Configurações</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href="/gerenciar" className="flex items-center">
                  Gerenciar Memórias
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/diagnostico" className="flex items-center">
                  Diagnóstico
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/escolher-db" className="flex items-center">
                  Escolher DB
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/config" className="flex items-center">
                  Configurações
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/admin" className="flex items-center">
                  Administração
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
      </div>
    </header>
  )
}
