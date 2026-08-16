# 📰 Projeto C7 Notícias

Bem-vindo à documentação oficial do projeto **C7 Notícias**. Este é um portal de notícias dinâmico e responsivo, acompanhado de um robusto painel administrativo para gerenciamento de conteúdo.

---

## 🏗️ Arquitetura do Sistema: Client-Server

O sistema foi desenvolvido seguindo a arquitetura **Client-Server (Cliente-Servidor)** com comunicação estrita via **API REST**. Isso significa que as responsabilidades estão totalmente desacopladas:

1.  **Client (Front-End)**: É a interface gráfica que roda no navegador do usuário. Ele não possui acesso direto ao banco de dados. Sua função é renderizar as páginas (HTML/CSS) e, através do JavaScript, fazer requisições (HTTP GET, POST, PUT, DELETE) para solicitar ou enviar dados.
2.  **Server (Back-End)**: É o "motor" invisível da aplicação. Fica hospedado em um servidor rodando ininterruptamente. Ele recebe as requisições do Front-End, aplica as regras de negócio, comunica-se com o banco de dados para ler ou salvar informações, e devolve a resposta no formato JSON para o Front-End.

---

## ✨ Funcionalidades do Sistema

O projeto é dividido em dois grandes escopos de interação:

### Área Pública (Portal do Leitor - `index.html`)
*   **Feed de Notícias**: Listagem cronológica ou por relevância das matérias publicadas.
*   **Filtro por Categorias**: Navegação em seções específicas (ex: Esportes, Política, Entretenimento).
*   **Leitura de Matérias**: Visualização completa das notícias com textos e imagens.
*   **Sistema de Anúncios**: Exibição de banners publicitários integrados organicamente ao portal.
*   **Layout Responsivo**: Adaptação perfeita para dispositivos móveis, tablets e desktops.

### Área Administrativa (Painel do Autor - `admin.html`)
*   **Autenticação**: Sistema de login seguro para restringir acesso apenas a administradores/autores autorizados.
*   **CRUD de Notícias**: Criar, Ler, Atualizar e Deletar matérias jornalísticas.
*   **Gerenciamento de Categorias**: Criação e organização das seções do portal.
*   **Gerenciamento de Usuários**: Controle de quem tem acesso ao painel (criação de novos autores).
*   **Gerenciamento de Anúncios**: Inserção e controle dos banners publicitários exibidos na área pública.
*   **Upload e Tratamento de Imagens**: Ferramenta para subir fotos que são automaticamente otimizadas antes de serem salvas.

---

## 🛠️ Tecnologias e Ferramentas Utilizadas

O desenvolvimento foi baseado em um ecossistema Javascript (Stack MEVN/MERN adaptado para Vanilla).

### Front-End (O que o usuário vê)
*   **HTML5 & CSS3**: Estruturação semântica e estilização completa da interface (variáveis CSS, Grid, Flexbox).
*   **JavaScript (Vanilla)**: Toda a lógica do cliente sem dependência de frameworks pesados (como React ou Angular). Utiliza a Fetch API nativa para comunicação com o Back-End.

### Back-End (A lógica de servidor)
*   **Node.js**: O ambiente de execução (runtime) que permite rodar Javascript no servidor.
*   **Express.js**: O framework minimalista para Node.js, responsável por gerenciar as rotas e requisições HTTP da nossa API.
*   **Multer**: Um middleware (interceptador) utilizado para lidar com upload de arquivos (multipart/form-data), essencial para o envio de imagens das notícias.
*   **Sharp**: Uma biblioteca de altíssimo desempenho usada para processar imagens (redimensionar, comprimir, converter formatos) logo após o upload, economizando espaço em disco e melhorando a velocidade de carregamento do site.
*   **Cors**: Gerencia a política de segurança de mesma origem, permitindo que o Front-End (em um domínio) acesse o Back-End (em outro domínio).
*   **Dotenv**: Gerencia variáveis de ambiente (senhas, chaves secretas), mantendo-as seguras e fora do código fonte.
*   **Express Validator**: Garante que os dados enviados pelo Front-End (como um email válido num cadastro) estejam corretos antes de salvar no banco.

### Banco de Dados
*   **MongoDB**: Banco de dados NoSQL, não relacional, orientado a documentos (JSON). Ideal para armazenar notícias e dados não rígidos.
*   **Mongoose**: Uma biblioteca de modelagem de dados para o MongoDB. Ela cria uma estrutura lógica rigorosa para garantir que os dados sigam um padrão de esquema no banco.

---

## 📂 Estrutura de Diretórios Detalhada

O projeto é modularizado para facilitar a manutenção e escalar facilmente.

```text
C7 Noticias/
│
├── Front-End/                   # Camada de Apresentação
│   ├── css/                     # Estilos visuais (admin.css, etc.)
│   ├── img/                     # Imagens estáticas (logos, ícones)
│   ├── js/                      # Lógica do navegador, chamadas de API
│   ├── admin.html               # Tela do painel de controle
│   ├── index.html               # Tela principal do portal
│   └── dev-server.js            # Servidor local para testes do Front-End
│
└── Back-End/                    # Camada de Servidor (API)
    ├── config/                  # Configurações gerais (conexão com BD)
    ├── controllers/             # O "cérebro" das rotas. Lida com a lógica de negócio (ex: como salvar uma notícia)
    ├── models/                  # Esquemas do Mongoose (estrutura da Notícia, Usuário, Categoria)
    ├── routes/                  # Os "Caminhos" da API (Endpoints)
    ├── utils/                   # Funções auxiliares reaproveitáveis
    ├── .env.example             # Exemplo do arquivo de variáveis de segurança
    ├── package.json             # Lista as bibliotecas (Node.js) usadas no projeto
    └── server.js                # O arquivo principal que inicializa o servidor
```

---

## 🔌 APIs e Rotas do Sistema

O Back-End expõe diversos "Endpoints" (caminhos) para que o Front-End interaja. Eles estão separados nos arquivos da pasta `routes/`:

*   **`/api/auth`**: 
    *   Lida com a segurança. Responsável pelo *Login*, geração e validação de Tokens de sessão.
*   **`/api/noticias`**: 
    *   O coração do sistema. Rotas para listar, criar, editar e excluir as reportagens. Pode incluir filtros (por categoria, destaques).
*   **`/api/categorias`**: 
    *   Permite cadastrar ou buscar os "temas" das notícias do site.
*   **`/api/usuarios`**: 
    *   Administração de contas. Criar novos redatores, gerenciar senhas e permissões.
*   **`/api/anuncios`**: 
    *   Gerencia o upload e a exibição de banners de propaganda.
*   **`/api/imagens`**: 
    *   Rota dedicada a receber arquivos de foto, utilizar a biblioteca `sharp` para otimizar e salvar no servidor, devolvendo o link público da imagem.
*   **`/api/utils`**: 
    *   Rotas para funcionalidades auxiliares diversas.

---

## 🚀 Infraestrutura e Hospedagem (Hostinger)

A estratégia de implantação do sistema (Deploy) adotada foi planejada para garantir máxima performance, acabando com os problemas de "Cold Start" (lentidão por inatividade) comuns em servidores gratuitos.

**Plano de Hospedagem na Hostinger:**
Para que esta arquitetura Cliente-Servidor funcione com perfeição na Hostinger, o projeto exige um ambiente que suporte **Node.js**.

1.  **Hospedagem do Front-End (HTML/CSS/JS)**:
    *   Os arquivos da pasta `Front-End` são estáticos. Eles serão hospedados para serem entregues de forma extremamente rápida diretamente ao navegador do usuário pelo servidor web da Hostinger.
2.  **Hospedagem do Back-End (Node.js)**:
    *   O conteúdo da pasta `Back-End` não pode rodar em hospedagens compartilhadas simples (exclusivas para PHP). É necessária uma **Hospedagem Node.js ou um Servidor VPS** na Hostinger.
    *   No VPS, o arquivo `server.js` ficará rodando 24 horas por dia (geralmente sob um gerenciador de processos como PM2). Isso garante que quando o usuário abrir o site, a API responda instantaneamente, entregando as notícias na hora.
3.  **Banco de Dados (MongoDB)**:
    *   Pode ser instalado no mesmo servidor VPS da Hostinger ou utilizando um serviço em Nuvem específico para Banco de Dados (como o MongoDB Atlas), garantindo que os dados estejam seguros e acessíveis sem interrupções.

---
*Este documento é a base técnica principal para todos os desenvolvedores e mantenedores envolvidos no projeto C7 Notícias.*
