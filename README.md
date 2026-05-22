# ⚽ WorldCup Hub 2026

Um simulador **Full-Stack interativo** para a **Copa do Mundo FIFA 2026**, com suporte ao novo formato de **48 seleções divididas em 12 grupos**. O sistema permite visualizar o chaveamento oficial, inserir resultados das partidas e calcular a tabela de classificação dinamicamente em tempo real.

---

# 🚀 Funcionalidades

- ✅ **Fase de Grupos Completa**
  - Visualização dos 12 grupos oficiais (A ao L) com as seleções e repescagens definidas de acordo com o sorteio final.

- ✅ **Tabela de Classificação Dinâmica**
  - Cálculo automático de:
    - Pontos
    - Vitórias
    - Empates
    - Derrotas
    - Saldo de Gols
  - Atualização em tempo real conforme os placares são inseridos no frontend.

- ✅ **Bandeiras Dinâmicas**
  - Integração com a FlagsAPI para renderização precisa utilizando o padrão ISO de 2 letras.

- ✅ **Algoritmo de Cruzamento**
  - Geração automática das 72 partidas da fase de grupos utilizando matemática combinatória (*Round-Robin*).

- ✅ **Atributo de Força**
  - Base de dados preparada com pesos estatísticos baseados no ranking real das seleções para futuras simulações probabilísticas.

---

# 🛠️ Tecnologias Utilizadas

## Frontend

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- Axios

## Backend

- Python 3
- Django
- Django REST Framework
- PostgreSQL
- Docker

---

# 📦 Como Rodar o Projeto Localmente

## 📋 Pré-requisitos

Certifique-se de ter instalado em sua máquina:

- Node.js (v18+)
- Python (v3.10+)
- Docker
- Docker Compose

---

# 1️⃣ Clonando o Repositório

Execute no terminal:

```bash
git clone https://github.com/SEU-USUARIO/worldcup-hub-2026.git

cd worldcup-hub-2026
```

---

# 2️⃣ Subindo o Banco de Dados

Na raiz do projeto, onde está localizado o `docker-compose.yml`, execute:

```bash
docker compose up -d
```

---

# 3️⃣ Configurando o Backend (Django)

Acesse a pasta do backend:

```bash
cd backend
```

Crie e ative o ambiente virtual:

```bash
python3 -m venv venv

source venv/bin/activate
```

Instale as dependências:

```bash
pip install -r requirements.txt
```

Execute as migrações e popule o banco:

```bash
python manage.py migrate

python manage.py seed_db
```

Inicie o servidor Django:

```bash
python manage.py runserver
```

O backend ficará disponível em:

```txt
http://localhost:8000
```

---

# 4️⃣ Configurando o Frontend (Next.js)

Abra um novo terminal e execute:

```bash
cd frontend

npm install

npm run dev
```

O frontend ficará disponível em:

```txt
http://localhost:3000
```

---

# 🗺️ Roadmap de Desenvolvimento

- [x] CRUD e modelagem de dados de Seleções e Grupos
- [x] Renderização visual da fase de grupos integrada com API de bandeiras
- [x] Motor de estado derivado em React para cálculo automático da classificação
- [x] Persistência de placares via API REST (POST/PUT)
- [x] Implementação do chaveamento automático do mata-mata
- [x] Árvore visual do mata-mata (*Knockout Tree*)
- [x] Refatoração avançada de UI/UX (Dark Mode de alta densidade e responsividade no mata-mata)
- [x] Configuração DevOps e infraestrutura para deploy em produção (Render/Vercel)
- [ ] Sistema de simulação automática da Copa baseado em estatísticas e fator sorte

---

# 📸 Futuras Funcionalidades

- Simulação automática de partidas
- Estatísticas avançadas
- Ranking de artilheiros
- Histórico de confrontos
- Sistema de probabilidades

---

# 👨‍💻 Autor

Desenvolvido por **Caio Vilas Boas Miranda**  
Estudante de Engenharia de Software na Universidade de Brasília (**UnB**).

## 🔗 Contatos

- LinkedIn: https://www.linkedin.com/in/caio-vilas-boas-miranda-637439271
- GitHub: https://github.com/cvbmiranda

---
```