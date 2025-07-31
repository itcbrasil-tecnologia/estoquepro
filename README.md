# EstoquePRO - Sistema de Controle de Estoque

<p align="center">
  <img src="public/Logo.svg" alt="EstoquePRO Logo" width="250"/>
</p>

<p align="center">
<img src="https://img.shields.io/badge/status-ativo-success" alt="status">
<img src="https://img.shields.io/badge/versão-1.1.0-blue" alt="versao">
<img src="https://img.shields.io/badge/framework-Next.js-black?logo=next.js" alt="Next.js">
<img src="https://img.shields.io/badge/backend-Firebase-orange?logo=firebase" alt="Next.js">
<img src="https://img.shields.io/badge/estilo-Tailwind%20CSS-blue?logo=tailwind-css" alt="Next.js">
</p>

**EstoquePRO** é uma aplicação web completa e responsiva para controle de estoque, desenvolvida com as tecnologias mais modernas para garantir performance, segurança e uma excelente experiência de usuário.

O sistema foi projetado para ser intuitivo e poderoso, permitindo que equipes gerenciem produtos, movimentações e cadastros de forma centralizada e eficiente.

---

## 📋 Sumário

* [Sobre o Projeto](#-sobre-o-projeto)
* [Principais Funcionalidades](#-principais-funcionalidades)
* [Stack de Tecnologia](#-stack-de-tecnologia)
* [Como Rodar o Projeto Localmente](#-como-rodar-o-projeto-localmente)
* [Variáveis de Ambiente](#️-variáveis-de-ambiente)

---

## 📖 Sobre o Projeto

**EstoquePRO** é uma aplicação web full-stack projetada para oferecer uma solução completa e intuitiva para o gerenciamento de inventário. O sistema permite o controle detalhado de produtos, movimentações de estoque (entrada, saída, transferência) e cadastros auxiliares, tudo centralizado em uma interface limpa e responsiva.

Construído com foco em alta performance e qualidade de código, o projeto utiliza **Next.js** para o frontend e **Firebase** para o backend, garantindo escalabilidade, segurança e desenvolvimento em tempo real.

---

## ✨ Principais Funcionalidades

* **🔐 Autenticação Segura:** Sistema de login com dois níveis de permissão (Master e Comum).
* **📊 Dashboard Inteligente:** Visualização rápida do estado do estoque com cards de resumo (Total de Produtos, Estoque Baixo, Próximo do Mínimo) e últimas movimentações.
* **📦 Gestão de Estoque Híbrido:** Suporte completo para controle de produtos por **Quantidade** ou por **Número de Série (Serial Number)**.
* **⚙️ CRUD Completo:** Gerenciamento total de Produtos, Projetos, Localidades, Fornecedores, Categorias e Fabricantes.
* **👥 Gestão de Usuários:** Interface para o administrador (Master) adicionar, editar e desativar usuários.
* **📜 Log de Auditoria:** Rastreamento de todas as ações importantes realizadas no sistema para máxima segurança e controle.
* **📄 Relatórios Avançados:** Geração de relatórios de estoque e movimentações com filtros dinâmicos e opção de **exportação para CSV**.
* **📱 Design Responsivo:** Interface 100% adaptável para desktops, tablets e celulares.
* **🎨 Tema Light & Dark:** Alternância de tema com persistência da preferência do usuário.
* **🔔 Notificações Toast:** Feedback visual imediato para as ações do usuário.

## 🚀 Stack de Tecnologia

A aplicação foi construída utilizando as seguintes tecnologias:

* **Frontend:**
    * [Next.js](https://nextjs.org/) (App Router)
    * [React](https://reactjs.org/)
    * [TypeScript](https://www.typescriptlang.org/)
    * [Tailwind CSS](https://tailwindcss.com/)
* **Backend & Banco de Dados:**
    * [Firebase](https://firebase.google.com/) (Firestore, Authentication, Storage)
* **Bibliotecas Adicionais:**
    * [Recharts](https://recharts.org/) (Gráficos)
    * [Fort Awesome (FontAwesome)](https://fontawesome.com/) (Ícones)
    * [Papaparse](https://www.papaparse.com/) (Exportação CSV)
* **Deployment:**
    * [Vercel](https://vercel.com/)

---

## 💻 Como Rodar o Projeto Localmente

Siga os passos abaixo para configurar e rodar o EstoquePRO em seu ambiente de desenvolvimento.

### Pré-requisitos

* [Node.js](https://nodejs.org/en/) (versão 18.x ou superior)
* [Yarn](https://yarnpkg.com/) ou [npm](https://www.npmjs.com/)
* Uma conta no [Firebase](https://firebase.google.com/) para configurar o backend.

### Instalação

1.  **Clone o repositório:**
    ```bash
    git clone [https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git](https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git)
    ```

2.  **Navegue até o diretório do projeto:**
    ```bash
    cd estoque-pro
    ```

3.  **Instale as dependências:**
    ```bash
    npm install
    # ou
    yarn install
    ```

4.  **Configure as Variáveis de Ambiente:**
    * Renomeie o arquivo `.env.local.example` para `.env.local`.
    * Preencha o arquivo `.env.local` com as credenciais do seu projeto Firebase. Veja a seção [Variáveis de Ambiente](#️-variáveis-de-ambiente) para mais detalhes.

5.  **Rode o servidor de desenvolvimento:**
    ```bash
    npm run dev
    # ou
    yarn dev
    ```

6.  Abra [http://localhost:3000](http://localhost:3000) no seu navegador para ver a aplicação.

---

## 🛠️ Variáveis de Ambiente

Para que a aplicação se conecte ao Firebase, é essencial criar um arquivo `.env.local` na raiz do projeto. Você pode obter essas credenciais nas configurações do seu projeto no console do Firebase.

Crie o arquivo `.env.local` e adicione as seguintes variáveis:

```env
# Credenciais do Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=SUA_CHAVE_AQUI
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=SEU_DOMINIO_AQUI
NEXT_PUBLIC_FIREBASE_PROJECT_ID=SEU_ID_DE_PROJETO_AQUI
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=SEU_STORAGE_BUCKET_AQUI
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=SEU_SENDER_ID_AQUI
NEXT_PUBLIC_FIREBASE_APP_ID=SEU_APP_ID_AQUI
```

---