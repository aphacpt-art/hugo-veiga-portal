# Portal Hugo Veiga

Portal privado de catálogos e tabelas de preços para clientes (www.hugoveiga.pt, app "Hugo Veiga").

## Stack
- Next.js 15 (App Router), instalável como app (PWA)
- Supabase (projeto `hugo-veiga-portal`, região eu-west-3): login, base de dados, ficheiros
- Segurança por linha (RLS): cada cliente só lê empresas, documentos e ficheiros autorizados na tabela `acessos`

## Variáveis de ambiente (Vercel > Settings > Environment Variables)
| Nome | Onde obter |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://fhpgpfmkxxtwlfbghncg.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | chave publicável (ver `.env.example`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase > Project Settings > API keys > secret. **Só no servidor.** Necessária para enviar convites |
| `NEXT_PUBLIC_SITE_URL` | `https://www.hugoveiga.pt` |

## Configuração no Supabase (uma vez)
- Authentication > URL Configuration: Site URL `https://www.hugoveiga.pt`; Redirect URLs `https://www.hugoveiga.pt/**`
- Authentication > Sign In / Providers > Email: desligar "Allow new users to sign up" (só entra quem é convidado)
- Authentication > Users > Add user: criar o administrador `comercial@hugoveiga.pt`
- Recomendado: SMTP próprio (Authentication > Emails > SMTP) para os convites saírem de @hugoveiga.pt

## Desenvolvimento
```
cp .env.example .env.local
npm install
npm run dev
```

O esquema da base de dados está em `supabase/esquema.sql`.
