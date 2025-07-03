"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Lock, Check } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

const CORRECT_PASSWORD = "Daniel777!"
const AUTH_KEY = "love_journal_auth"

interface PasswordProtectionProps {
  children: React.ReactNode
  returnPath?: string
}

export function PasswordProtection({ children, returnPath = "/" }: PasswordProtectionProps) {
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    // Verificar se já está autenticado
    try {
      const authStatus = localStorage.getItem(AUTH_KEY)
      if (authStatus === "true") {
        setIsAuthenticated(true)
      }
    } catch (err) {
      console.error("Erro ao acessar localStorage:", err)
      // Em caso de erro (como em navegadores privados), continuar sem autenticação
    }
    setIsLoading(false)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (password === CORRECT_PASSWORD) {
      // Salvar autenticação no localStorage
      try {
        localStorage.setItem(AUTH_KEY, "true")
      } catch (err) {
        console.error("Erro ao salvar no localStorage:", err)
        // Continuar mesmo se não conseguir salvar (sessão temporária)
      }
      setIsAuthenticated(true)
      setError(null)

      // Mostrar notificação de sucesso
      toast({
        title: "Acesso autorizado",
        description: "Você entrou na área restrita com sucesso.",
        variant: "default",
        icon: <Check className="h-4 w-4 text-green-500" />,
      })
    } else {
      setError("Senha incorreta. Tente novamente.")

      // Mostrar notificação de erro
      toast({
        title: "Acesso negado",
        description: "A senha informada está incorreta. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  const handleLogout = () => {
    try {
      localStorage.removeItem(AUTH_KEY)
    } catch (err) {
      console.error("Erro ao remover do localStorage:", err)
    }
    setIsAuthenticated(false)
    router.push(returnPath)

    // Mostrar notificação de logout
    toast({
      title: "Desconectado",
      description: "Você saiu da área restrita.",
      variant: "default",
    })
  }

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">Carregando...</div>
  }

  if (!isAuthenticated) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-muted/30 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Área Protegida
            </CardTitle>
            <CardDescription>Esta área é restrita. Por favor, digite a senha para continuar.</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Input
                    type="password"
                    placeholder="Digite a senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                </div>
                {error && (
                  <div className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    <span>{error}</span>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" type="button" onClick={() => router.push(returnPath)}>
                Voltar
              </Button>
              <Button type="submit">Entrar</Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    )
  }

  return (
    <div>
      <div className="bg-muted py-2 px-4 flex justify-end">
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          Sair da Área Protegida
        </Button>
      </div>
      {children}
    </div>
  )
}
