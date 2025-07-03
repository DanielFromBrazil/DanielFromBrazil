"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, AlertCircle, CheckCircle, Database } from "lucide-react"
import Link from "next/link"
import { checkDatabase } from "@/app/actions"
// Importar o componente de proteção por senha
import { PasswordProtection } from "@/components/password-protection"

// Modificar a função de exportação para incluir a proteção por senha
export default function ConfigPage() {
  const [checking, setChecking] = useState(false)
  const [status, setStatus] = useState<{
    checked: boolean
    success: boolean
    message: string
  }>({
    checked: false,
    success: false,
    message: "",
  })

  const [config, setConfig] = useState({
    host: process.env.MYSQL_HOST || "",
    database: process.env.MYSQL_DATABASE || "",
    user: process.env.MYSQL_USER || "",
    password: "********",
  })

  const [customConfig, setCustomConfig] = useState({
    host: "",
    database: "",
    user: "",
    password: "",
  })

  const [useCustomConfig, setUseCustomConfig] = useState(false)

  const checkConnection = async (useCustom = false) => {
    setChecking(true)
    try {
      const testConfig = useCustom ? customConfig : undefined
      const result = await checkDatabase(testConfig)
      setStatus({
        checked: true,
        success: result.success,
        message: result.message || (result.success ? "Conexão bem-sucedida!" : "Falha na conexão."),
      })
    } catch (error) {
      setStatus({
        checked: true,
        success: false,
        message: `Erro ao verificar conexão: ${error instanceof Error ? error.message : String(error)}`,
      })
    } finally {
      setChecking(false)
    }
  }

  useEffect(() => {
    checkConnection()
  }, [])

  return (
    <PasswordProtection returnPath="/">
      <div className="flex min-h-screen flex-col">
        <header className="border-b">
          <div className="container flex h-16 items-center justify-between px-4 md:px-6">
            <Link href="/" className="flex items-center gap-2">
              <Database className="h-6 w-6 text-primary" />
              <span className="text-xl font-semibold">Configuração do Banco de Dados</span>
            </Link>
            <Button variant="outline" size="sm" asChild>
              <Link href="/">Voltar para Início</Link>
            </Button>
          </div>
        </header>
        <main className="flex-1 container py-12">
          <div className="max-w-3xl mx-auto space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Configuração do Banco de Dados MySQL</CardTitle>
                <CardDescription>Verifique e atualize as configurações de conexão com o banco de dados</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {status.checked && (
                  <Alert variant={status.success ? "default" : "destructive"}>
                    {status.success ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                    <AlertTitle>{status.success ? "Conexão bem-sucedida" : "Erro de conexão"}</AlertTitle>
                    <AlertDescription>{status.message}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="host">Host do MySQL</Label>
                    <Input id="host" value={config.host} disabled placeholder="localhost" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="database">Nome do Banco de Dados</Label>
                    <Input id="database" value={config.database} disabled placeholder="love_journal" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="user">Usuário MySQL</Label>
                    <Input id="user" value={config.user} disabled placeholder="root" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Senha MySQL</Label>
                    <Input id="password" type="password" value={config.password} disabled />
                  </div>
                </div>

                <div className="mt-6 border-t pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium">Testar Configuração Personalizada</h3>
                    <Button variant="outline" size="sm" onClick={() => setUseCustomConfig(!useCustomConfig)}>
                      {useCustomConfig ? "Cancelar" : "Personalizar"}
                    </Button>
                  </div>

                  {useCustomConfig && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="custom-host">Host do MySQL</Label>
                        <Input
                          id="custom-host"
                          value={customConfig.host}
                          onChange={(e) => setCustomConfig({ ...customConfig, host: e.target.value })}
                          placeholder="Exemplo: 51.222.255.227"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="custom-database">Nome do Banco de Dados</Label>
                        <Input
                          id="custom-database"
                          value={customConfig.database}
                          onChange={(e) => setCustomConfig({ ...customConfig, database: e.target.value })}
                          placeholder="Exemplo: s6099_mylove"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="custom-user">Usuário MySQL</Label>
                        <Input
                          id="custom-user"
                          value={customConfig.user}
                          onChange={(e) => setCustomConfig({ ...customConfig, user: e.target.value })}
                          placeholder="Exemplo: u6099_VK25DnPhTO"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="custom-password">Senha MySQL</Label>
                        <Input
                          id="custom-password"
                          type="password"
                          value={customConfig.password}
                          onChange={(e) => setCustomConfig({ ...customConfig, password: e.target.value })}
                          placeholder="Digite sua senha"
                        />
                      </div>
                      <Button
                        onClick={() => checkConnection(true)}
                        disabled={
                          checking ||
                          !customConfig.host ||
                          !customConfig.database ||
                          !customConfig.user ||
                          !customConfig.password
                        }
                        className="w-full"
                      >
                        {checking ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Verificando...
                          </>
                        ) : (
                          "Testar Configuração Personalizada"
                        )}
                      </Button>
                    </div>
                  )}
                </div>

                <div className="bg-muted p-4 rounded-md mt-4">
                  <h3 className="font-medium mb-2">Como corrigir problemas de conexão:</h3>
                  <ol className="list-decimal pl-5 space-y-2">
                    <li>Verifique se o servidor MySQL está em execução</li>
                    <li>Confirme se as credenciais estão corretas</li>
                    <li>Certifique-se de que o banco de dados existe</li>
                    <li>Verifique se o host MySQL permite conexões remotas (se não for localhost)</li>
                    <li>
                      Atualize as variáveis de ambiente no arquivo <code>.env.local</code> ou no painel do Vercel:
                      <pre className="bg-background p-2 rounded mt-2 text-xs overflow-x-auto">
                        MYSQL_HOST=seu_host
                        <br />
                        MYSQL_DATABASE=seu_banco_de_dados
                        <br />
                        MYSQL_USER=seu_usuario
                        <br />
                        MYSQL_PASSWORD=sua_senha
                      </pre>
                    </li>
                  </ol>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" asChild>
                  <Link href="/">Voltar para Início</Link>
                </Button>
                <Button onClick={() => checkConnection()} disabled={checking}>
                  {checking ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verificando...
                    </>
                  ) : (
                    "Verificar Conexão"
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </main>
      </div>
    </PasswordProtection>
  )
}
