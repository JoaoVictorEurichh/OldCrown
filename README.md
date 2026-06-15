# Old Crown — Sistema de Agendamento para Barbearia

Sistema web completo para gerenciamento de agendamentos de barbearia, com autenticação JWT, controle de acesso por perfil (Admin/Cliente), tabela de horários em tempo real e WebSockets.

---

## Sumário

- [Sobre o Projeto](#sobre-o-projeto)
- [Funcionalidades](#funcionalidades)
- [Tecnologias](#tecnologias)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Pré-requisitos](#pré-requisitos)
- [Como Rodar](#como-rodar)
- [Variáveis de Ambiente](#variáveis-de-ambiente)
- [Usuário Admin Padrão](#usuário-admin-padrão)
- [Rotas da API](#rotas-da-api)
- [Desenvolvedores](#desenvolvedores)

---

## Sobre o Projeto

O **Old Crown** resolve o problema de barbearias que gerenciam horários pelo WhatsApp — causando conflitos, falta de organização e dificuldade no controle de clientes. O sistema oferece:

- Agendamento online com visualização em tabela (08:00 – 18:00, intervalos de 30 min)
- Escolha entre 3 barbeiros: João, Carlos e Rafael
- Painel administrativo com relatórios por barbeiro
- Atualizações em tempo real via WebSocket

Protótipo no Figma: https://www.figma.com/design/HW5unbWaDvy55Yqpm6YMtf/Barber?node-id=11-4349

---

## Funcionalidades

### Cliente
- Cadastro e login com e-mail e senha
- Visualização da apresentação e serviços da barbearia
- Agendamento de **1 horário** por vez com escolha de barbeiro e serviço
- Edição e cancelamento apenas do próprio agendamento
- Card com status do agendamento ativo na tela inicial

### Administrador
- Painel com resumo de hoje por barbeiro (WebSocket em tempo real)
- Agendamento de clientes pelo nome em qualquer horário
- Edição e cancelamento de qualquer agendamento
- Relatórios com atendimentos e receita por barbeiro e total da barbearia
- Proteção de rota: clientes não conseguem acessar a página de relatórios

### Sistema
- Controle de concorrência com transação `Serializable` no PostgreSQL (dois clientes não conseguem pegar o mesmo horário)
- Soft delete no cancelamento (status → `CANCELED`, registro mantido)
- Horários passados bloqueados no frontend e no backend

---

## Tecnologias

### Frontend
| Tecnologia | Versão |
|---|---|
| Next.js (App Router) | 16.2.6 |
| React | 19 |
| TypeScript | 5 |
| Tailwind CSS | 4 |
| Socket.IO Client | 4.8 |
| Lucide React | 0.577 |

### Backend
| Tecnologia | Versão |
|---|---|
| NestJS | 11 |
| Prisma ORM | 6.8 |
| PostgreSQL | — |
| JWT (passport-jwt) | — |
| bcrypt | — |
| Socket.IO (WebSockets) | — |
| Helmet | — |

---

## Estrutura do Projeto

```
OldCrown-main/
├── FrontEnd/                    # Next.js App Router
│   ├── app/
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx       # Guard de autenticação
│   │   │   ├── login/           # Página de login
│   │   │   ├── cadastro/        # Cadastro de conta
│   │   │   ├── home/            # Home (Admin: painel | Cliente: apresentação)
│   │   │   │   ├── Agendar/     # Tabela de horários para agendar
│   │   │   │   ├── Editar/      # Tabela para reagendar
│   │   │   │   └── Cancelar/    # Tabela para cancelar
│   │   │   └── relatorios/      # Relatórios (somente Admin)
│   │   ├── components/
│   │   │   ├── layout/sidebar.tsx
│   │   │   └── ui/nav-link.tsx
│   │   └── services/api.ts      # Client HTTP + helpers de auth
│   └── package.json
│
└── backend/                     # NestJS
    ├── src/
    │   ├── appointments/        # CRUD + WebSocket Gateway
    │   ├── auth/                # Login JWT
    │   ├── users/               # Cadastro de usuários
    │   ├── prisma/              # PrismaService
    │   └── guards/              # JwtAuthGuard
    ├── prisma/
    │   ├── schema.prisma
    │   ├── seed.ts              # Dados iniciais (admin + agendamentos)
    │   └── migrations/
    └── package.json
```

---

## Pré-requisitos

- Node.js 18+
- PostgreSQL rodando localmente (ou via Docker)
- npm ou yarn

---

## Como Rodar

### 1. Clone o repositório

```bash
git clone https://github.com/JoaoVictorEurichh/OldCrown-main.git
cd OldCrown-main
```

### 2. Configure o banco de dados

Crie um banco PostgreSQL chamado `oldcrown` e configure o `.env` no backend:

```bash
cd backend
cp .env.example .env
# Edite o .env com suas credenciais (veja seção abaixo)
```

### 3. Suba o backend

```bash
cd backend
npm install
npx prisma migrate deploy
npx prisma generate
npx prisma db seed       # cria admin + agendamentos de exemplo
npm run start:dev        # porta 3333
```

### 4. Suba o frontend

```bash
cd FrontEnd
npm install
npm run dev              # porta 3000
```

Acesse: **http://localhost:3000**

---

## Variáveis de Ambiente

Crie o arquivo `backend/.env` com base em `backend/.env.example`:

```env
DATABASE_URL="postgresql://USUARIO:SENHA@localhost:5432/oldcrown"
JWT_SECRET="troque-por-um-segredo-forte"
PORT=3333
```

---

## Usuários Padrão

Criados automaticamente pelo seed (`npx prisma db seed`):

### Administrador

| Campo | Valor |
|---|---|
| E-mail | `admin@email.com` |
| Senha | `123456` |
| Perfil | ADMIN |

### Barbeiros

| Nome | E-mail | Senha | Perfil |
|---|---|---|---|
| João | `joao@oldcrown.com` | `123456` | BARBER |
| Carlos | `carlos@oldcrown.com` | `123456` | BARBER |
| Rafael | `rafael@oldcrown.com` | `123456` | BARBER |

> Cada barbeiro acessa apenas sua própria agenda, seus agendamentos e seu relatório individual.

---

## Rotas da API

Base URL: `http://localhost:3333`

### Auth
| Método | Rota | Descrição |
|---|---|---|
| POST | `/auth/login` | Login — retorna `access_token` + dados do usuário |

### Usuários
| Método | Rota | Descrição | Auth |
|---|---|---|---|
| POST | `/users` | Cadastrar conta | Não |
| GET | `/users` | Listar usuários | Sim |

### Agendamentos
| Método | Rota | Descrição | Auth |
|---|---|---|---|
| GET | `/appointments` | Listar agendamentos ativos | Sim |
| POST | `/appointments` | Criar agendamento | Sim |
| PUT | `/appointments/:id` | Editar agendamento | Sim |
| DELETE | `/appointments/:id` | Cancelar agendamento (soft delete) | Sim |

### WebSocket
Conecte em `ws://localhost:3333`. Eventos emitidos pelo servidor:

| Evento | Payload | Descrição |
|---|---|---|
| `appointment:created` | Appointment | Novo agendamento criado |
| `appointment:updated` | Appointment | Agendamento editado |
| `appointment:canceled` | `{ id }` | Agendamento cancelado |

---

## Serviços e Preços

| Serviço | Preço |
|---|---|
| Corte | R$ 35,00 |
| Barba | R$ 25,00 |
| Corte + Barba | R$ 55,00 |

---

## Desenvolvedores

| Nome | GitHub |
|---|---|
| João Victor Eurich | [@JoaoVictorEurichh](https://github.com/JoaoVictorEurichh) |
| Allan Lemos | [@Allanclms](https://github.com/Allanclms) |
| Roger Felipe Farias da Maia | [@rogerfelipe10](https://github.com/rogerfelipe10) |
