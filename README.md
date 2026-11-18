# BusMauá

Sistema de rastreamento e gestão integrada dos ônibus e vans universitárias do Instituto Mauá de Tecnologia.
Continuação do projeto **Mauá Moove**.

**Projeto Integrador (8º semestre), Sistemas de Informação, IMT**
Daniela Jacome · Nicolas Alencar · Ligia de Lima Marchina
Orientador: Prof. Dr. Jhonny Frank Sousa Joca

---

## O que o sistema faz

**App do estudante**

- **Mapa ao vivo**: veículos em rota no mapa, com estimativa de chegada ao seu ponto, lotação e motorista.
- **Fila virtual**: o aluno registra a intenção de embarcar em uma saída e acompanha a posição. Quando o veículo está chegando e há lugar, ele é chamado e tem 5 minutos para embarcar.
- **Confirmação de embarque**: feita pelo aluno ou pelo motorista.
- **Itinerários e horários**: linhas, paradas e o horário previsto em cada ponto.
- **Notificações**: viagem iniciada, veículo chegando, sua vez na fila, atraso e embarque confirmado.

**Área do motorista** (contas criadas pela administração)

- **Início da viagem**: escolhe veículo, linha e horário. O app checa GPS, internet e tela ligada.
- **Viagem em andamento**: o celular envia a posição ao vivo para os alunos da linha. O motorista pode pausar, informar atraso e encerrar a viagem.
- **Embarque**: lista da fila com check-in, ajuste manual da lotação e liberação da saída.

**Interface administrativa**

- Frota ao vivo e resumo do dia.
- **Demanda por horário**: média de solicitações na fila × embarques confirmados, comparecimento e ocupação, com uma indicação de van ou ônibus. A indicação é só apoio: a decisão sobre a frota continua com a gestão.

## Arquitetura

```
┌───────────────────────────┐        REST (JWT)         ┌──────────────────────────────┐
│  App (React + Vite, PWA)  │ ───────────────────────▶ │  API Spring Boot             │
│  aluno · motorista · adm  │ ◀─────────────────────── │  /api/...                    │
│                           │   WebSocket (STOMP) /ws   │  H2 (dev) ou PostgreSQL      │
│  GPS do celular motorista │ ◀═══════════════════════ │  /topic/frota, /topic/...    │
└───────────────────────────┘                           └──────────────────────────────┘
```

- O celular do motorista envia a posição para `POST /api/motorista/viagens/{id}/localizacao` a cada ~4 s.
- O servidor grava a posição, recalcula a fila e publica a viagem atualizada em `/topic/frota`. Os apps dos alunos recebem a atualização na hora.
- A estimativa de chegada usa a distância até o ponto (com um fator para o traçado das ruas) e a velocidade atual. Antes da viagem começar, ela usa a grade de horários.

| Camada   | Tecnologias                                                                                          |
| -------- | ---------------------------------------------------------------------------------------------------- |
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, Leaflet (mapa OpenStreetMap/CARTO), STOMP.js, lucide-react |
| Backend  | Java 21, Spring Boot 3.3 (Web, WebSocket, Data JPA, Security, Validation), JWT (jjwt), Lombok        |
| Banco    | H2 em memória (desenvolvimento) ou PostgreSQL (perfil `postgres`)                                    |

## Como rodar

### Pré-requisitos

- Java 21 e Maven 3.9+ (ou abrir a pasta `backend` no IntelliJ / VS Code)
- Node.js 18+

### 1. Backend

```bash
cd backend
mvn spring-boot:run
```

A API sobe em `http://localhost:8080`. O banco H2 é recriado a cada execução, já com frota, linhas, horários, contas e um histórico de 3 semanas de viagens para o painel de demanda. Console do banco: `http://localhost:8080/h2-console` (JDBC URL `jdbc:h2:mem:busmaua`, usuário `sa`).

Com PostgreSQL:

```bash
DB_URL=jdbc:postgresql://localhost:5432/busmaua DB_USUARIO=busmaua DB_SENHA=busmaua \
JWT_SECRET=<chave-base64-com-32-bytes-ou-mais> \
mvn spring-boot:run -Dspring-boot.run.profiles=postgres
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Abra `http://localhost:5173`. Em desenvolvimento, o Vite encaminha `/api` e `/ws` para o backend.

### Contas de teste (senha `maua123`)

| Perfil        | E-mail                                                            |
| ------------- | ----------------------------------------------------------------- |
| Aluno         | `aluno@maua.br` (há também `aluno01@maua.br` … `aluno50@maua.br`) |
| Motorista     | `carlos@maua.br`, `marcos@maua.br`                                |
| Administração | `admin@maua.br` (entrar pela aba Aluno)                           |

### Roteiro rápido de demonstração

1. Em uma janela, entre como **motorista** (`carlos@maua.br`) e inicie a viagem da próxima saída.
2. Em outra janela (ou no celular), entre como **aluno**: o veículo aparece no mapa e a notificação "iniciou a viagem" chega.
3. O aluno entra na fila virtual. Na aba **Passageiros**, o motorista vê o aluno e confirma o check-in.
4. Entre como **admin** para ver a frota ao vivo e a demanda por horário.

### Testar o GPS pelo celular

Navegadores só liberam a localização em páginas **HTTPS** (ou `localhost`). Para usar o celular:

```bash
npx ngrok http 5173      # gera um endereço https://xxxx.ngrok-free.app
```

Abra o endereço gerado no celular do motorista.

Para apresentar sem sair do lugar, crie `frontend/.env` com `VITE_SIMULAR_GPS=true`: o "motorista" percorre as paradas da linha a 35 km/h.

> Limitação conhecida: por ser um app web, o envio da localização para quando o navegador vai para segundo plano. Por isso o app mantém a tela ligada durante a viagem (Wake Lock API).

## Principais endpoints

| Método       | Caminho                                                                  | Perfil    | Descrição                                 |
| ------------ | ------------------------------------------------------------------------ | --------- | ----------------------------------------- |
| POST         | `/api/auth/login`                                                        | —         | Login (`email`, `senha`, `perfil`)        |
| POST         | `/api/auth/cadastro`                                                     | —         | Cadastro de aluno (e-mail `@maua.br`)     |
| GET          | `/api/linhas`                                                            | todos     | Linhas, paradas e horários                |
| GET          | `/api/viagens/proximas`                                                  | todos     | Saídas de hoje (agendadas e em rota)      |
| GET          | `/api/notificacoes`                                                      | todos     | Avisos do usuário e gerais                |
| POST         | `/api/fila`                                                              | aluno     | Entrar na fila (`viagemId`, `paradaId`)   |
| GET / DELETE | `/api/fila/minha`                                                        | aluno     | Situação na fila / sair da fila           |
| POST         | `/api/fila/minha/embarque`                                               | aluno     | Confirmar embarque                        |
| POST         | `/api/motorista/viagens/iniciar`                                         | motorista | Iniciar viagem (`veiculoId`, `horarioId`) |
| POST         | `/api/motorista/viagens/{id}/localizacao`                                | motorista | Enviar posição GPS                        |
| POST         | `/api/motorista/viagens/{id}/pausar` · `retomar` · `atraso` · `encerrar` | motorista | Controle da viagem                        |
| GET          | `/api/motorista/viagens/{id}/fila`                                       | motorista | Fila da viagem                            |
| POST         | `/api/motorista/viagens/{id}/fila/{entradaId}/confirmar`                 | motorista | Check-in de um aluno                      |
| POST         | `/api/motorista/viagens/{id}/lotacao`                                    | motorista | Ajuste manual da lotação (`delta`)        |
| GET          | `/api/admin/resumo` · `/api/admin/demanda?dias=14`                       | admin     | Painel de gestão                          |

Tópicos WebSocket (`/ws`, STOMP): `/topic/frota`, `/topic/viagens/{id}/fila`, `/topic/notificacoes`.

## Estrutura

```
backend/
  src/main/java/br/maua/busmaua/
    config/       segurança, WebSocket e carga inicial de dados
    controller/   endpoints REST
    domain/       entidades JPA (Usuario, Veiculo, Linha, Parada, Horario, Viagem, FilaEntrada, Notificacao)
    dto/          objetos de entrada e saída da API
    repository/   Spring Data JPA
    security/     JWT
    service/      regras de negócio (viagens, fila virtual, ETA, notificações, demanda)
frontend/
  src/
    components/   mapa, navegação e componentes visuais
    lib/          API, autenticação, tempo real (STOMP), GPS e utilitários
    telas/        aluno/, motorista/, admin/, login e cadastro
```

## Privacidade (LGPD)

- São coletados só os dados necessários: nome, e-mail institucional e registros de fila/embarque.
- O motorista vê apenas o primeiro nome e a inicial do sobrenome dos alunos.
- A localização compartilhada é a do **veículo**, somente durante uma viagem iniciada pelo motorista. A dos alunos fica no aparelho, usada para mostrar "Você" no mapa e sugerir o ponto mais próximo.
- Senhas guardadas com BCrypt; acesso à API com token JWT.

> As coordenadas das paradas são aproximadas e podem ser ajustadas em `backend/src/main/java/br/maua/busmaua/config/CargaInicial.java`.

Para rodar backend:

mvn -s ../settings-publico.xml -gs ../settings-publico.xml spring-boot:run

Para rodar frontend:
npm run dev

### Contas de teste

| Perfil          | E-mail                                | Senha     | Aba no login | O que dá para fazer                                          |
| --------------- | ------------------------------------- | --------- | ------------ | ------------------------------------------------------------ |
| Aluno           | `aluno@maua.br`                       | `maua123` | Aluno        | Mapa ao vivo, fila virtual, horários e notificações          |
| Motorista       | `carlos@maua.br`                      | `maua123` | Motorista    | Iniciar viagem, compartilhar GPS e controlar o embarque      |
| Motorista       | `marcos@maua.br`                      | `maua123` | Motorista    | Igual ao anterior (para testar dois veículos ao mesmo tempo) |
| Administração   | `admin@maua.br`                       | `maua123` | Aluno        | Frota ao vivo e demanda por horário                          |
| Alunos de teste | `aluno01@maua.br` … `aluno50@maua.br` | `maua123` | Aluno        | Contas usadas no histórico e na fila de exemplo              |

> O banco H2 é recriado a cada vez que o backend inicia. As contas acima são criadas automaticamente, e qualquer cadastro novo é perdido ao reiniciar.
