"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Database, Check, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { switchToSQLite, testMySQLConnection, getCurrentDbConfig } from "../actions"
// Importar o componente de proteção por senha
import { PasswordProtection } from "@/components/password-protection"

export default function ChooseDbPage() {
  const [loading, setLoading] = useState(false)
  const [currentConfig, setCurrentConfig] = useState<{
    useMySQL: boolean
    message: string
  }>({ useMySQL: true, message: "Carregando configuração..." })

  const [mysqlStatus, setMysqlStatus] = useState<{
    tested: boolean
    success: boolean
    message: string
  }>({
    tested: false,
    success: false,
    message: "",
  })

  const [sqliteStatus, setSqliteStatus] = useState<{
    switched: boolean
    success: boolean
    message: string
  }>({
    switched: false,
    success: false,
    message: "",
  })

  useEffect(() => {
    async function loadConfig() {
      try {
        const config = await getCurrentDbConfig()
        setCurrentConfig(config)
      } catch (error) {
        console.error("Erro ao carregar configuração:", error)
        setCurrentConfig({
          useMySQL: true,
          message: "Erro ao carregar configuração",
        })
      }
    }

    loadConfig()
  }, [])

  const testMySQL = async () => {
    setLoading(true)
    try {
      const result = await testMySQLConnection()
      setMysqlStatus({
        tested: true,
        success: result.success,
        message: result.message,
      })
    } catch (error) {
      setMysqlStatus({
        tested: true,
        success: false,
        message: `Erro ao testar MySQL: ${error instanceof Error ? error.message : String(error)}`,
      })
    } finally {
      setLoading(false)
    }
  }

  const switchDatabase = async () => {
    setLoading(true)
    try {
      const result = await switchToSQLite()
      setSqliteStatus({
        switched: true,
        success: result.success,
        message: result.message,
      })

      if (result.success) {
        setCurrentConfig({
          useMySQL: false,
          message: "Usando SQLite",
        })
      }
    } catch (error) {
      setSqliteStatus({
        switched: true,
        success: false,
        message: `Erro ao mudar para SQLite: ${error instanceof Error ? error.message : String(error)}`,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <PasswordProtection returnPath="/">
      <div className="container py-10">
        <h1 className="text-3xl font-bold mb-6">Escolher Banco de Dados</h1>

        <div className="mb-6 p-4 rounded-lg bg-muted">
          <div className="flex items-center gap-2 mb-2">
            <Database className="h-5 w-5" />
            <h2 className="text-lg font-medium">Configuração Atual</h2>
          </div>
          <p>
            {currentConfig.useMySQL ? "Usando MySQL (banco de dados remoto)" : "Usando SQLite (banco de dados local)"}
          </p>
          <p className="text-sm text-muted-foreground mt-1">{currentConfig.message}</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>MySQL</CardTitle>
              <CardDescription>Usar o banco de dados MySQL configurado nas variáveis de ambiente</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Esta opção usa o MySQL configurado no Vercel. Requer que o servidor MySQL permita conexões do Vercel.
              </p>

              {mysqlStatus.tested && (
                <div
                  className={`p-4 rounded-md mb-4 ${mysqlStatus.success ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}
                >
                  {mysqlStatus.success ? (
                    <div className="flex items-center">
                      <Check className="h-5 w-5 mr-2" />
                      <span>Conexão MySQL bem-sucedida!</span>
                    </div>
                  ) : (
                    <div className="flex items-start">
                      <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                      <span>{mysqlStatus.message}</span>
                    </div>
                  )}
                </div>
              )}

              <Button onClick={testMySQL} disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Testando...
                  </>
                ) : (
                  "Testar Conexão MySQL"
                )}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>SQLite</CardTitle>
              <CardDescription>Usar SQLite local (recomendado se o MySQL não estiver funcionando)</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Esta opção usa SQLite, que é um banco de dados local que não requer configuração de servidor. Ideal para
                desenvolvimento e projetos menores.
              </p>

              {sqliteStatus.switched && (
                <div
                  className={`p-4 rounded-md mb-4 ${sqliteStatus.success ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}
                >
                  {sqliteStatus.success ? (
                    <div className="flex items-center">
                      <Check className="h-5 w-5 mr-2" />
                      <span>Mudança para SQLite concluída!</span>
                    </div>
                  ) : (
                    <div className="flex items-start">
                      <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                      <span>{sqliteStatus.message}</span>
                    </div>
                  )}
                </div>
              )}

              <Button
                onClick={switchDatabase}
                disabled={loading || (!currentConfig.useMySQL && !sqliteStatus.switched)}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Mudando...
                  </>
                ) : !currentConfig.useMySQL && !sqliteStatus.switched ? (
                  "Já Usando SQLite"
                ) : (
                  "Mudar para SQLite"
                )}
              </Button>
            </CardContent>
            <CardFooter>
              <p className="text-xs text-muted-foreground">
                <strong>Nota sobre o Vercel:</strong> No Vercel, o SQLite usa o diretório /tmp, que é temporário. Os
                dados podem ser perdidos quando a função serverless é reiniciada. Ideal para testes, não para produção.
              </p>
            </CardFooter>
          </Card>
        </div>

        <div className="mt-6">
          <Link href="/" className="text-sm text-primary hover:underline">
            Voltar para a página inicial
          </Link>
        </div>
      </div>
    </PasswordProtection>
  )
}
