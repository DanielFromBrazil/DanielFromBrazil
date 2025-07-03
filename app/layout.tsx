import type React from "react"
import { Inter } from "next/font/google"
import "./globals.css"
import { initApp } from "./actions"
import { SiteHeader } from "@/components/site-header"

const inter = Inter({ subsets: ["latin"] })

// Initialize the app on server start
initApp().then((result) => {
  if (result.success) {
    console.log("Aplicativo inicializado com sucesso")
  } else {
    console.error("Falha ao inicializar aplicativo:", result.error)
  }
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <div className="relative flex min-h-screen flex-col">
          <SiteHeader />
          <div className="flex-1">{children}</div>
        </div>
      </body>
    </html>
  )
}

export const metadata = {
      generator: 'v0.dev'
    };
