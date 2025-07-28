# EstoquePRO - Sistema de Controle de Estoque

<p align="center">
  <img src="public/Logo.svg" alt="ScanPRO Logo" width="250"/>
</p>

<p align="center">
  <img src="public/Logo.svg" alt="EstoquePRO Logo" width="250"/>
</p>

<p align="center">
![Badge de Licença](https://img.shields.io/badge/licen%C3%A7a-MIT-blue.svg)
![Badge de Tecnologia](https://img.shields.io/badge/tecnologia-Next.js-black?logo=next.js)
![Badge de Tecnologia](https://img.shields.io/badge/backend-Firebase-orange?logo=firebase)
![Badge de Estilo](https://img.shields.io/badge/estilo-Tailwind%20CSS-blue?logo=tailwind-css)
</p>

**EstoquePRO** é uma aplicação web completa e responsiva para controle de estoque, desenvolvida com as tecnologias mais modernas para garantir performance, segurança e uma excelente experiência de usuário.

O sistema foi projetado para ser intuitivo e poderoso, permitindo que equipes gerenciem produtos, movimentações e cadastros de forma centralizada e eficiente.

---

## ✨ Funcionalidades Principais

O sistema conta com um conjunto robusto de funcionalidades prontas para produção:

* **Dashboard Inteligente:**
    * Cards de resumo com indicadores-chave (Total de Produtos, Itens com Estoque Baixo, etc.).
    * Lista de movimentações recentes para acompanhamento rápido.
    * Gráfico visual com os produtos de maior volume em estoque.
    * Alertas visuais para produtos que atingiram o estoque mínimo ou crítico.

* **Gestão Completa de Produtos:**
    * CRUD completo (Criar, Ler, Atualizar, Excluir) para produtos.
    * Upload de imagens direto da interface para o **Firebase Storage**, com nomenclatura padronizada.
    * Filtros avançados por categoria, fornecedor, localidade e busca por nome.
    * Múltiplos modos de visualização (grade de cards ou lista detalhada).
    * Paginação para lidar com grandes volumes de produtos.

* **Controle de Acesso e Segurança:**
    * Sistema de autenticação com dois níveis de permissão: **Master** e **Comum**.
    * Menu de perfil com opção para o usuário alterar a própria senha via e-mail.
    * **Log de Auditoria Completo:** Registra todas as ações importantes (criação, edição, exclusão) realizadas no sistema, visível apenas para usuários Master.

* **Administração Centralizada:**
    * Páginas de cadastro dedicadas para **Projetos, Localidades, Fornecedores, Categorias e Fabricantes**.
    * Localidades com seletor de cor para fácil identificação visual.
    * Gestão de usuários (criar, editar perfil, desativar) para administradores.

* **Relatórios e Exportação:**
    * Página de relatórios consolidada com filtros avançados.
    * Relatório de Estoque Geral e de Movimentações.
    * Funcionalidade para **exportar relatórios para CSV**, pronta para análise em planilhas.

* **Interface e Usabilidade (UX):**
    * Design totalmente **responsivo**, adaptado para desktop, tablets e celulares.
    * **Tema Claro e Escuro** com persistência da preferência do usuário.
    * Sistema de notificações "toast" para feedback visual das ações.
    * Interface limpa e intuitiva, construída com foco na experiência do usuário.

---

## 🚀 Stack de Tecnologia

* **Framework:** [Next.js](https://nextjs.org/) (com App Router)
* **Linguagem:** [TypeScript](https://www.typescriptlang.org/)
* **Estilização:** [Tailwind CSS](https://tailwindcss.com/)
* **Backend & Banco de Dados:** [Firebase](https://firebase.google.com/) (Firestore, Authentication, Storage)
* **Gráficos:** [Recharts](https://recharts.org/)
* **Deploy:** [Vercel](https://vercel.com/)

---

## ⚙️ Como Rodar o Projeto Localmente

Para configurar e rodar o projeto no seu ambiente de desenvolvimento, siga os passos abaixo.

### Pré-requisitos

* [Node.js](https://nodejs.org/) (versão 18 ou superior)
* Um projeto Firebase configurado com Authentication, Firestore e Storage habilitados.

### Instalação

1.  **Clone o repositório:**
    ```bash
    git clone [https://github.com/seu-usuario/estoquepro.git](https://github.com/seu-usuario/estoquepro.git)
    cd estoquepro
    ```

2.  **Instale as dependências:**
    ```bash
    npm install
    ```

3.  **Configure as Variáveis de Ambiente:**
    * No arquivo `lib/firebase.js`, substitua o objeto `firebaseConfig` pelas chaves do seu próprio projeto Firebase.

4.  **Rode o servidor de desenvolvimento:**
    ```bash
    npm run dev
    ```

5.  Abra [http://localhost:3000](http://localhost:3000) no seu navegador para ver o resultado.

---

## 📂 Estrutura do Projeto

A estrutura de arquivos foi organizada para manter o código limpo e escalável:

* **/app:** Contém todas as rotas e páginas da aplicação, seguindo o padrão do App Router do Next.js.
* **/components:** Armazena todos os componentes React reutilizáveis (modais, cards, tabelas, etc.).
* **/contexts:** Gerencia os estados globais da aplicação, como autenticação, tema e notificações.
* **/lib:** Inclui arquivos de configuração e helpers, como a inicialização do Firebase e a função de log de auditoria.
* **/types:** Centraliza todas as definições de interface do TypeScript, garantindo a consistência dos dados em toda a aplicação.
