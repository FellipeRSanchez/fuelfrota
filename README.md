# FuelFrota

Sistema de gestão de frotas e controle de combustível.

## Stack

- **Next.js 14** (App Router) com TypeScript
- **Tailwind CSS** + **shadcn/ui**
- **Prisma ORM** (Neon PostgreSQL)
- **NextAuth.js** (autenticação)
- **Zod** (validação de dados)
- **next-pwa** (PWA)
- **react-hook-form** (formulários)

## Estrutura

```
src/
├── app/
│   ├── (publico)/          # Rotas públicas (landing, login, registro)
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── (autenticado)/      # Rotas protegidas (painel, etc.)
│   │   ├── layout.tsx
│   │   └── painel/
│   │       └── page.tsx
│   ├── api/
│   │   └── auth/[...nextauth]/route.ts
│   ├── globals.css
│   └── layout.tsx
├── components/
│   ├── forms/              # Componentes de formulário
│   └── ui/                 # Componentes shadcn/ui
├── generated/prisma/       # Prisma Client gerado
├── lib/
│   ├── validacoes/         # Schemas Zod compartilhados
│   │   ├── index.ts
│   │   └── usuario.ts
│   ├── auth.ts             # Configuração NextAuth
│   ├── prisma.ts           # Singleton Prisma Client
│   └── utils.ts            # Funções utilitárias (cn)
└── types/
    ├── index.ts            # Tipos compartilhados
    └── next-auth.d.ts      # Aumento de tipos NextAuth
```

## Convenções

- **Nomes em português**: modelos, funções, variáveis, rotas
- **Server Components por padrão** — `"use client"` só quando necessário
- **Server Actions** para mutações
- **Validação Zod** compartilhada entre cliente e servidor

## Começando

```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Preencher DATABASE_URL com a string de conexão do Neon

# Gerar Prisma Client
npx prisma generate

# Executar migrations (quando o banco estiver configurado)
npx prisma migrate dev

# Iniciar desenvolvimento
npm run dev
```
