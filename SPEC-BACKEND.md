# SPEC — Backend · TECnoa
**Sistema de apuestas grupales de fútbol**
Stack: Java 25 · Spring Boot 3.1.x · PostgreSQL

---

## 1. Visión general

API REST que expone toda la lógica del sistema de quinielas: autenticación OAuth2 Google, gestión de grupos de apuesta, ingesta de torneos y resultados desde Football-Data.org, cálculo de puntos y distribución de premios.

---

## 2. Stack y herramientas

| Componente | Tecnología |
|---|---|
| Lenguaje | Java 25 |
| Framework | Spring Boot 3.1.x |
| Build tool | Gradle 8.x (Kotlin DSL) |
| Base de datos | PostgreSQL 16 |
| ORM | Spring Data JPA + Hibernate 6 |
| Migraciones | Flyway |
| Auth | Spring Security + Google OAuth2 token verification |
| JWT | `java-jwt` (Auth0) |
| HTTP client | WebClient (WebFlux) para llamadas a Football-Data.org |
| Jobs | Spring `@Scheduled` + `TaskScheduler` |
| Email | Spring Mail + SendGrid (o SMTP configurable) |
| Push | Firebase Admin SDK (FCM) |
| Cache | Spring Cache + Caffeine |
| Validación | Bean Validation 3.0 (Jakarta) |
| Documentación | SpringDoc OpenAPI 3 (Swagger UI) |
| Tests | JUnit 5 + Testcontainers (PostgreSQL) + MockMvc |
| Containerización | Dockerfile + docker-compose (dev) |

---

## 3. Arquitectura de capas

```
com.tecnoa.apuestas/
├── api/
│   ├── controller/            ← REST controllers (@RestController)
│   ├── dto/                   ← Request/Response DTOs
│   └── exception/             ← @ControllerAdvice, custom exceptions
├── domain/
│   ├── model/                 ← Entidades JPA
│   ├── repository/            ← JpaRepository interfaces
│   └── service/               ← Lógica de negocio
├── infrastructure/
│   ├── footballdata/          ← Cliente Football-Data.org + mappers
│   ├── email/                 ← EmailService
│   ├── fcm/                   ← PushNotificationService
│   └── security/              ← JWT filter, Google token verifier
├── job/                       ← @Scheduled jobs
└── config/                    ← SecurityConfig, WebClientConfig, CacheConfig
```

---

## 4. Configuración (application.yml)

```yaml
spring:
  datasource:
    url: ${DATABASE_URL}
    username: ${DATABASE_USER}
    password: ${DATABASE_PASSWORD}
  jpa:
    hibernate:
      ddl-auto: validate
    properties:
      hibernate:
        default_schema: public
  flyway:
    enabled: true
    locations: classpath:db/migration

app:
  jwt:
    secret: ${JWT_SECRET}
    expiration-days: 7
  google:
    client-id: ${GOOGLE_CLIENT_ID}
  football-data:
    api-key: ${FOOTBALL_DATA_API_KEY}
    base-url: https://api.football-data.org/v4
  mail:
    from: noreply@tecnoa.app
    verification-url: ${APP_BASE_URL}/api/v1/users/verify-email
    token-expiry-hours: 24
  fcm:
    credentials-file: ${GOOGLE_APPLICATION_CREDENTIALS}
```

---

## 5. Base de datos — Esquema

### 5.1 Diagrama de entidades

```
users ──────────────── group_members ─── betting_groups
  │                                           │
  ├── email_verifications                     ├── predictions
  └── fcm_tokens                              ├── wildcards
                                              └── tournaments
                                                      │
                                              matches ─┘
                                                │
                                              teams
```

### 5.2 Migraciones Flyway

#### `V1__init_users.sql`
```sql
CREATE TABLE users (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    google_id             VARCHAR(128) UNIQUE NOT NULL,
    email                 VARCHAR(255) UNIQUE NOT NULL,
    name                  VARCHAR(255) NOT NULL,
    picture_url           TEXT,
    phone                 VARCHAR(30),
    contact_email         VARCHAR(255),
    contact_email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at            TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    last_login            TIMESTAMP WITH TIME ZONE
);

CREATE TABLE fcm_tokens (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token      TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(user_id)
);

CREATE TABLE email_verifications (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    email       VARCHAR(255) NOT NULL,
    token       VARCHAR(64) UNIQUE NOT NULL,
    expires_at  TIMESTAMP WITH TIME ZONE NOT NULL,
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
```

#### `V2__init_tournaments.sql`
```sql
CREATE TYPE tournament_type AS ENUM (
    'WORLD_CUP', 'CHAMPIONS_LEAGUE', 'COPA_AMERICA',
    'EUROPA_LEAGUE', 'NATIONAL_LEAGUE', 'OTHER'
);
CREATE TYPE tournament_status AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'FINISHED', 'SUSPENDED');

CREATE TABLE tournaments (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_id  VARCHAR(64) UNIQUE NOT NULL,   -- Football-Data.org competition id
    name         VARCHAR(255) NOT NULL,
    short_name   VARCHAR(64),
    type         tournament_type NOT NULL DEFAULT 'OTHER',
    country      VARCHAR(100),
    season       VARCHAR(20),                   -- e.g. "2025/26"
    start_date   DATE,
    end_date     DATE,
    status       tournament_status NOT NULL DEFAULT 'SCHEDULED',
    has_phases   BOOLEAN NOT NULL DEFAULT FALSE, -- true = puntuación escalonada por fase
    logo_url     TEXT,
    created_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE teams (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_id VARCHAR(64) UNIQUE NOT NULL,
    name        VARCHAR(255) NOT NULL,
    short_name  VARCHAR(10),
    country     VARCHAR(100),
    flag_url    TEXT,
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TYPE match_stage AS ENUM (
    'GROUP', 'ROUND_OF_16', 'QUARTER_FINAL', 'SEMI_FINAL', 'THIRD_PLACE', 'FINAL'
);
CREATE TYPE match_status AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'FINISHED', 'POSTPONED', 'CANCELLED');

CREATE TABLE matches (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_id           VARCHAR(64) UNIQUE NOT NULL,
    tournament_id         UUID NOT NULL REFERENCES tournaments(id),
    home_team_id          UUID NOT NULL REFERENCES teams(id),
    away_team_id          UUID NOT NULL REFERENCES teams(id),
    scheduled_at          TIMESTAMP WITH TIME ZONE NOT NULL,
    stage                 match_stage NOT NULL DEFAULT 'GROUP',
    group_name            VARCHAR(20),
    match_day             SMALLINT,
    status                match_status NOT NULL DEFAULT 'SCHEDULED',
    home_score            SMALLINT,              -- null hasta que finalice
    away_score            SMALLINT,
    decided_by_penalties  BOOLEAN NOT NULL DEFAULT FALSE,
    created_at            TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_matches_tournament_scheduled ON matches(tournament_id, scheduled_at);
CREATE INDEX idx_matches_status ON matches(status);
```

#### `V3__init_betting_groups.sql`
```sql
CREATE TYPE group_status AS ENUM ('OPEN', 'ACTIVE', 'FINISHED', 'CANCELLED');
CREATE TYPE member_role  AS ENUM ('ORGANIZER', 'PARTICIPANT');

CREATE TABLE betting_groups (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                        VARCHAR(100) NOT NULL,
    tournament_id               UUID NOT NULL REFERENCES tournaments(id),
    organizer_id                UUID NOT NULL REFERENCES users(id),
    max_participants            SMALLINT,                       -- null = sin límite
    is_open                     BOOLEAN NOT NULL DEFAULT TRUE,  -- true = join sin aprobación
    password_hash               VARCHAR(255),                   -- null = sin contraseña
    prediction_deadline_minutes SMALLINT NOT NULL DEFAULT 15,
    wildcards_enabled           BOOLEAN NOT NULL DEFAULT FALSE,
    entry_fee                   DECIMAL(10,2),                  -- informativo
    invite_code                 VARCHAR(16) UNIQUE NOT NULL,
    status                      group_status NOT NULL DEFAULT 'OPEN',
    created_at                  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE group_members (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id     UUID NOT NULL REFERENCES betting_groups(id) ON DELETE CASCADE,
    user_id      UUID NOT NULL REFERENCES users(id),
    role         member_role NOT NULL DEFAULT 'PARTICIPANT',
    total_points INT NOT NULL DEFAULT 0,
    joined_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(group_id, user_id)
);

CREATE INDEX idx_group_members_group ON group_members(group_id);
CREATE INDEX idx_group_members_user  ON group_members(user_id);
```

#### `V4__init_predictions.sql`
```sql
CREATE TABLE predictions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id        UUID NOT NULL REFERENCES betting_groups(id),
    match_id        UUID NOT NULL REFERENCES matches(id),
    user_id         UUID NOT NULL REFERENCES users(id),
    home_score_pred SMALLINT NOT NULL,
    away_score_pred SMALLINT NOT NULL,
    points_earned   SMALLINT,                   -- null hasta que el partido finalice
    submitted_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(group_id, match_id, user_id)
);

CREATE INDEX idx_predictions_group_match ON predictions(group_id, match_id);
CREATE INDEX idx_predictions_user_group  ON predictions(user_id, group_id);
```

#### `V5__init_wildcards.sql`
```sql
CREATE TYPE wildcard_type AS ENUM (
    'FINALIST_1', 'FINALIST_2', 'BEST_PLAYER', 'BEST_GOALKEEPER', 'TOP_SCORER'
);

CREATE TABLE wildcards (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id      UUID NOT NULL REFERENCES betting_groups(id),
    user_id       UUID NOT NULL REFERENCES users(id),
    type          wildcard_type NOT NULL,
    team_id       UUID REFERENCES teams(id),    -- para FINALIST_1/2
    player_name   VARCHAR(100),                 -- para BEST_PLAYER, BEST_GOALKEEPER, TOP_SCORER
    points_earned SMALLINT,                     -- null hasta finalizar torneo
    submitted_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(group_id, user_id, type)
);
```

---

## 6. API REST — Endpoints

Base path: `/api/v1`
Autenticación: `Authorization: Bearer <JWT>` (excepto endpoints marcados como públicos)

### 6.1 Auth

| Método | Endpoint | Auth | Descripción |
|---|---|---|---|
| POST | `/auth/google` | Público | Intercambiar Google idToken por JWT propio |
| POST | `/auth/fcm-token` | Requerida | Registrar/actualizar token FCM del dispositivo |

**POST /auth/google**
```json
// Request
{ "idToken": "eyJh..." }

// Response 200
{
  "accessToken": "eyJh...",
  "user": {
    "id": "uuid",
    "name": "Carlos Méndez",
    "email": "cmendez@gmail.com",
    "pictureUrl": "https://...",
    "contactEmailVerified": false,
    "isProfileComplete": false
  }
}
```

---

### 6.2 Usuarios

| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/users/me` | Perfil del usuario autenticado |
| PUT | `/users/me` | Actualizar teléfono y/o correo de contacto |
| POST | `/users/me/verify-email` | Enviar enlace de verificación al correo de contacto |
| GET | `/users/verify-email/{token}` | Confirmar token de verificación (vía browser) |
| GET | `/users/me/stats` | Estadísticas globales del usuario |

**PUT /users/me**
```json
// Request
{ "phone": "+591 77712345", "contactEmail": "carlos@hotmail.com" }

// Response 200 — usuario actualizado
```

**GET /users/verify-email/{token}**
- Si el token es válido y no expiró → marca `contact_email_verified = true` → redirige a deep link `tecnoa://profile/verified`
- Si expiró → responde HTML con mensaje de error y enlace para reenviar

---

### 6.3 Torneos

| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/tournaments` | Listar torneos (activos + próximos), paginado |
| GET | `/tournaments/{id}` | Detalle de un torneo |
| GET | `/tournaments/{id}/matches` | Partidos del torneo (con filtros: `?stage=GROUP&status=SCHEDULED`) |

**GET /tournaments**
```json
// Query params: ?status=ACTIVE,SCHEDULED&type=WORLD_CUP&page=0&size=20
{
  "content": [{
    "id": "uuid",
    "name": "Mundial 2026",
    "type": "WORLD_CUP",
    "status": "IN_PROGRESS",
    "startDate": "2026-06-11",
    "season": "2026",
    "hasPhases": true,
    "logoUrl": "https://..."
  }],
  "totalElements": 5,
  "page": 0,
  "size": 20
}
```

---

### 6.4 Grupos de apuesta

| Método | Endpoint | Rol requerido | Descripción |
|---|---|---|---|
| POST | `/groups` | Perfil completo | Crear grupo |
| GET | `/groups` | Autenticado | Mis grupos (creados + participando) |
| GET | `/groups/{id}` | Miembro | Detalle del grupo |
| PUT | `/groups/{id}` | Organizador | Actualizar config (solo antes de iniciar torneo) |
| DELETE | `/groups/{id}` | Organizador | Disolver grupo (solo antes de iniciar torneo) |
| POST | `/groups/join` | Autenticado | Unirse con código de invitación |
| GET | `/groups/{id}/leaderboard` | Miembro | Ranking de participantes |
| GET | `/groups/{id}/invite` | Miembro | Obtener/regenerar código de invitación |

**POST /groups**
```json
// Request
{
  "name": "Amigos del Mundial",
  "tournamentId": "uuid",
  "maxParticipants": 20,
  "isOpen": true,
  "password": null,
  "predictionDeadlineMinutes": 15,
  "wildcardsEnabled": true,
  "entryFee": 50.00
}

// Response 201
{
  "id": "uuid",
  "name": "Amigos del Mundial",
  "inviteCode": "AMG-2026-XK7",
  "inviteUrl": "https://tecnoa.app/join/AMG-2026-XK7",
  ...
}
```

**POST /groups/join**
```json
// Request
{ "inviteCode": "AMG-2026-XK7", "password": null }

// Errores:
// 404 — código no existe
// 409 — grupo lleno (maxParticipants alcanzado)
// 403 — contraseña incorrecta
// 409 — ya eres miembro
```

**GET /groups/{id}/leaderboard**
```json
{
  "groupId": "uuid",
  "updatedAt": "2026-06-14T09:00:00Z",
  "entries": [
    {
      "position": 1,
      "userId": "uuid",
      "name": "Mariana V.",
      "pictureUrl": "https://...",
      "totalPoints": 47,
      "exactPredictions": 9,
      "correctResults": 12,
      "positionTrend": 2,     // positivo = subió, negativo = bajó
      "isCurrentUser": false
    }
  ]
}
```

---

### 6.5 Pronósticos

| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/groups/{groupId}/predictions` | Mis pronósticos en el grupo (todos) |
| POST | `/groups/{groupId}/predictions` | Enviar/actualizar pronóstico de un partido |
| GET | `/groups/{groupId}/matches/{matchId}/predictions` | Pronósticos de todos los participantes para un partido (solo si partido ya inició) |

**POST /groups/{groupId}/predictions**
```json
// Request
{
  "matchId": "uuid",
  "homeScore": 2,
  "awayScore": 1
}

// Validaciones:
// — partido debe existir en el torneo del grupo
// — timestamp actual < scheduledAt - predictionDeadlineMinutes
// — si partido IN_PROGRESS o FINISHED → 409 con mensaje "Tiempo expirado"
// — si usuario no es miembro del grupo → 403

// Response 200/201
{
  "id": "uuid",
  "matchId": "uuid",
  "homeScorePred": 2,
  "awayScorePred": 1,
  "submittedAt": "2026-06-14T11:30:00Z",
  "pointsEarned": null   // se calcula cuando finalice el partido
}
```

---

### 6.6 Comodines

| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/groups/{groupId}/wildcards` | Mis comodines en el grupo |
| PUT | `/groups/{groupId}/wildcards` | Actualizar uno o más comodines (antes del inicio del torneo) |

**PUT /groups/{groupId}/wildcards**
```json
// Request (puede enviarse uno o todos)
{
  "wildcards": [
    { "type": "FINALIST_1", "teamId": "uuid-argentina" },
    { "type": "FINALIST_2", "teamId": "uuid-francia" },
    { "type": "TOP_SCORER",  "playerName": "Kylian Mbappé" },
    { "type": "BEST_PLAYER", "playerName": "Lionel Messi" },
    { "type": "BEST_GOALKEEPER", "playerName": "Emiliano Martínez" }
  ]
}

// Error 409 si el torneo ya inició (fase de grupos comenzó)
```

---

### 6.7 Premiación

| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/groups/{groupId}/awards` | Distribución de premios (solo cuando torneo FINISHED) |

```json
{
  "groupId": "uuid",
  "tournamentFinished": true,
  "totalPool": 1200.00,
  "prizes": [
    { "position": 1, "userId": "uuid", "name": "Mariana V.", "points": 52, "percentage": 55, "amount": 660.00 },
    { "position": 2, "userId": "uuid", "name": "Carlos M.",  "points": 47, "percentage": 25, "amount": 300.00 },
    { "position": 3, "userId": "uuid", "name": "Diego F.",   "points": 45, "percentage": 15, "amount": 180.00 }
  ],
  "organizerCommission": { "percentage": 5, "amount": 60.00 }
}
```

---

## 7. Sistema de puntuación

### 7.1 Tabla de puntos

```java
public enum MatchStage {
    GROUP        (1, 3),
    ROUND_OF_16  (3, 5),
    QUARTER_FINAL(5, 8),
    SEMI_FINAL   (7, 10),
    THIRD_PLACE  (8, 12),
    FINAL        (10, 15);

    final int correctResult;  // solo acierto de ganador/empate
    final int exactScore;     // acierto de resultado Y marcador exacto
}
```

### 7.2 Regla de penales

Cuando `match.decided_by_penalties = true`, el sistema evalúa únicamente el marcador al final del tiempo regular/prórroga (el marcador en penales se ignora completamente).

### 7.3 Algoritmo de cálculo (`ScoringService.java`)

```
Para cada partido que cambia a estado FINISHED:
  1. Determinar la fase (stage) del partido
  2. Obtener la tabla de puntos correspondiente
  3. Consultar todas las predictions del partido en todos los grupos
  4. Para cada prediction:
     a. Si homeScorePred == homeScore AND awayScorePred == awayScore → pts = exactScore
     b. Else si signo(homeScorePred - awayScorePred) == signo(homeScore - awayScore) → pts = correctResult
     c. Else → pts = 0
  5. UPDATE predictions SET points_earned = X, updated_at = NOW()
  6. UPDATE group_members SET total_points = total_points + X
     WHERE group_id = ? AND user_id = ?
  7. Invalidar cache del leaderboard para los grupos afectados
  8. Enviar push notification a los participantes con sus puntos obtenidos
```

### 7.4 Cálculo de comodines (`WildcardScoringService.java`)

Se ejecuta al finalizar el torneo:

```
FINALIST_1/2  → si el team_id es uno de los 2 finalistas → +5 pts
TOP_SCORER    → si player_name coincide (case-insensitive) con el goleador oficial → +5 pts
BEST_PLAYER   → si player_name coincide con el MVP oficial → +5 pts
BEST_GOALKEEPER → si player_name coincide con el mejor portero oficial → +5 pts
```

Los valores oficiales se ingresan manualmente por configuración (endpoint de admin protegido) o se leen desde Football-Data.org si el endpoint lo provee.

---

## 8. Integración Football-Data.org

### 8.1 Cliente (`FootballDataClient.java`)

```java
@Service
public class FootballDataClient {
    // WebClient configurado con:
    // — baseUrl: https://api.football-data.org/v4
    // — header "X-Auth-Token": ${app.football-data.api-key}
    // — timeout: 10s
    // — rate limiting: 10 req/min (Bucket4J o manejo manual)

    Mono<List<CompetitionDto>> fetchCompetitions();
    Mono<List<TeamDto>> fetchTeamsByCompetition(String competitionCode);
    Mono<List<MatchDto>> fetchMatchesByCompetition(String competitionCode, String season);
    Mono<MatchDto> fetchMatch(String matchId);
}
```

### 8.2 Sincronización (`SyncService.java`)

**Competiciones y equipos** → Job diario (3:00 AM):
1. Llamar `/competitions?plan=TIER_ONE` — obtener lista de competiciones soportadas
2. Para cada competición: obtener equipos y actualizar tabla `teams`
3. Upsert en tabla `tournaments` por `external_id`

**Fixtures (partidos programados)** → Job diario (4:00 AM):
1. Para cada torneo con status `SCHEDULED` o `IN_PROGRESS`
2. Llamar `/competitions/{code}/matches?season={season}`
3. Upsert en tabla `matches` por `external_id`

**Resultados en tiempo real** → Job con frecuencia variable:
- Si no hay partidos activos: cada **60 minutos**
- Si hay partidos con status `IN_PROGRESS` o que iniciarán en < 30 min: cada **2 minutos**

```java
@Scheduled(fixedDelay = 60_000)
public void syncLiveResults() {
    // 1. Detectar si hay partidos SCHEDULED con scheduledAt <= NOW + 30min o IN_PROGRESS
    // 2. Si sí: consultar Football-Data.org para esos partidos
    // 3. Actualizar scores y status
    // 4. Si status pasó a FINISHED → disparar ScoringService.calculatePoints(matchId)
    // 5. Ajustar frecuencia del próximo run según estado
}
```

### 8.3 Competiciones soportadas (configurable)

```yaml
football-data:
  supported-competitions:
    - code: WC      # FIFA World Cup
      type: WORLD_CUP
      has-phases: true
    - code: CL      # Champions League
      type: CHAMPIONS_LEAGUE
      has-phases: true
    - code: CA      # Copa América
      type: COPA_AMERICA
      has-phases: true
    - code: EL      # Europa League
      type: EUROPA_LEAGUE
      has-phases: true
    - code: PL      # Premier League
      type: NATIONAL_LEAGUE
      has-phases: false
    - code: PD      # La Liga
      type: NATIONAL_LEAGUE
      has-phases: false
```

---

## 9. Autenticación y seguridad

### 9.1 Verificación del Google idToken

```java
@Service
public class GoogleTokenVerifier {
    // Usa GoogleIdTokenVerifier de google-api-client
    // Verifica: firma, audiencia (client_id), expiración
    // Extrae: sub (google_id), email, name, picture

    GoogleIdToken.Payload verify(String idToken);
}
```

### 9.2 JWT propio

- Librería: `auth0/java-jwt`
- Algoritmo: HMAC256
- Claims: `sub` (userId), `email`, `iat`, `exp`
- Vigencia: 7 días
- Secreto: variable de entorno `JWT_SECRET` (mínimo 256 bits)

### 9.3 Filtro de seguridad

```java
// JwtAuthenticationFilter extends OncePerRequestFilter
// — Lee header Authorization: Bearer <token>
// — Valida JWT
// — Establece SecurityContextHolder con UserDetails
// — Si inválido → continúa sin autenticación (Spring Security responde 401)
```

### 9.4 Reglas de acceso

```java
// SecurityConfig.java
http
  .authorizeHttpRequests(auth -> auth
    .requestMatchers("/api/v1/auth/**").permitAll()
    .requestMatchers("/api/v1/users/verify-email/**").permitAll()
    .requestMatchers("/swagger-ui/**", "/v3/api-docs/**").permitAll()
    .anyRequest().authenticated()
  )
  .sessionManagement(s -> s.sessionCreationPolicy(STATELESS))
  .csrf(AbstractHttpConfigurer::disable);
```

### 9.5 Validación de roles en grupos

- `@PreAuthorize` en métodos de servicio verifican que el usuario sea `ORGANIZER` donde se requiere
- Verificación de membresía antes de cualquier operación sobre un grupo

---

## 10. Servicio de email (`EmailService.java`)

```java
// Usa Spring Mail (JavaMailSender) o SendGrid API

void sendVerificationEmail(String toEmail, String userName, String verificationToken);
// Plantilla: HTML + texto plano
// Asunto: "Verifica tu correo en TECnoa"
// Cuerpo: incluye enlace https://{base-url}/api/v1/users/verify-email/{token}
// Vigencia del token: 24 horas
```

Generación del token:
```java
String token = UUID.randomUUID().toString().replace("-", ""); // 32 chars hex
```

---

## 11. Notificaciones Push (`PushNotificationService.java`)

```java
// Firebase Admin SDK

public enum NotificationType {
    PREDICTION_REMINDER,   // 1h antes del cierre
    MATCH_RESULT,          // al calcularse puntos
    GROUP_INVITE,          // alguien acepta una invitación
    TOURNAMENT_START       // torneo inicia
}

void sendToUser(String userId, String title, String body, Map<String,String> data);
void sendToGroup(String groupId, String title, String body, Map<String,String> data);
```

**Job de recordatorios:**
```java
@Scheduled(cron = "0 * * * * *")  // cada minuto
public void sendPredictionReminders() {
    // Buscar partidos cuyo (scheduledAt - predictionDeadlineMinutes - 60min) == NOW ± 30s
    // Para cada grupo que tiene ese torneo
    // Para cada miembro que NO tiene prediction para ese partido
    // Enviar notificación PREDICTION_REMINDER
}
```

---

## 12. Caché (`CacheConfig.java`)

| Cache | TTL | Invalidación |
|---|---|---|
| `tournaments` | 1 hora | Al sync de Football-Data.org |
| `matches` | 5 min | Al actualizar resultados |
| `leaderboard:{groupId}` | 5 min | Al calcular puntos de un partido |
| `group:{id}` | 10 min | Al modificar configuración del grupo |

Implementación: **Caffeine** (in-memory). Para producción escalable → reemplazar con Redis.

```java
@Cacheable(value = "leaderboard", key = "#groupId")
List<LeaderboardEntryDto> getLeaderboard(UUID groupId) { ... }

@CacheEvict(value = "leaderboard", key = "#groupId")
void evictLeaderboard(UUID groupId) { ... }
```

---

## 13. Manejo de errores

### `GlobalExceptionHandler.java` (`@ControllerAdvice`)

```java
// Formato estándar de error:
{
  "status": 409,
  "error": "PREDICTION_DEADLINE_PASSED",
  "message": "El tiempo para ingresar pronósticos ha expirado.",
  "timestamp": "2026-06-14T13:44:00Z"
}
```

| Código de error | Status HTTP | Escenario |
|---|---|---|
| `PREDICTION_DEADLINE_PASSED` | 409 | Pronóstico enviado fuera de tiempo |
| `GROUP_FULL` | 409 | Grupo ha alcanzado maxParticipants |
| `WRONG_PASSWORD` | 403 | Contraseña de grupo incorrecta |
| `ALREADY_MEMBER` | 409 | Usuario ya es miembro del grupo |
| `PROFILE_INCOMPLETE` | 403 | Intento de crear grupo sin verificación |
| `GROUP_ALREADY_STARTED` | 409 | Modificación de grupo después del inicio |
| `WILDCARDS_LOCKED` | 409 | Comodín enviado después del inicio del torneo |
| `TOKEN_EXPIRED` | 410 | Enlace de verificación de email expirado |
| `INVALID_INVITE_CODE` | 404 | Código de invitación inexistente |

---

## 14. Lógica de negocio — reglas clave

### Creación de grupo
- El usuario debe tener `contact_email_verified = true`
- Se genera `invite_code` único: formato `{3 letras iniciales del nombre}-{año}-{4 chars aleatorios}` en mayúsculas
- El organizador se agrega automáticamente como `ORGANIZER` en `group_members`
- Si el torneo ya tiene status `IN_PROGRESS`, el grupo se crea con status `ACTIVE` directamente

### Unirse a un grupo
- Si `max_participants` está definido: verificar que `COUNT(group_members) < max_participants`
- Si `password_hash` está definido: verificar la contraseña con BCrypt
- Si `is_open = false`: el organizador debe aprobar (endpoint separado: `POST /groups/{id}/approve/{userId}`)
- No se puede unir a un grupo con status `FINISHED` o `CANCELLED`

### Pronóstico
- El cierre es: `match.scheduled_at - group.prediction_deadline_minutes`
- La validación se hace server-side (no confiar en el cliente)
- Permitir **editar** un pronóstico existente mientras no haya cerrado
- El resultado de `points_earned` permanece `null` hasta que el partido sea `FINISHED`

### Modificar configuración del grupo
- Solo el organizador puede modificar
- Solo se puede modificar mientras el torneo esté en `SCHEDULED`
- Una vez `IN_PROGRESS`, la configuración es inmutable

### Eliminar grupo
- Solo el organizador puede eliminar
- Solo se puede eliminar mientras el torneo esté en `SCHEDULED`
- Al eliminar, se borran en cascada: `group_members`, `predictions`, `wildcards`

---

## 15. Endpoints de administración (protegidos)

Acceso solo con rol `ADMIN` (header especial o endpoint separado no documentado en Swagger público):

| Endpoint | Descripción |
|---|---|
| POST `/admin/sync/tournaments` | Forzar sync inmediato de Football-Data.org |
| PUT `/admin/tournaments/{id}/awards-data` | Ingresar manualmente: goleador, MVP, mejor portero |
| GET `/admin/jobs/status` | Estado de los jobs de sincronización |

---

## 16. Testing

### Estrategia

| Capa | Tipo | Herramienta |
|---|---|---|
| Servicios | Unit tests | JUnit 5 + Mockito |
| Repositorios | Integration tests | Testcontainers (PostgreSQL) |
| Controllers | Web layer tests | MockMvc + @WebMvcTest |
| Scoring | Unit tests | JUnit 5, tablas de verdad por fase |
| Flujo completo | Integration tests | @SpringBootTest + Testcontainers |

### Casos críticos a cubrir con tests

- `ScoringServiceTest`: todas las combinaciones de fase × (exacto / resultado / fallo)
- `ScoringServiceTest`: partido decidido por penales (score de penales ignorado)
- `PredictionControllerTest`: pronóstico justo antes del límite (válido) vs. justo después (409)
- `GroupServiceTest`: unirse a grupo lleno (409)
- `GroupServiceTest`: modificar grupo con torneo en curso (409)
- `WildcardServiceTest`: enviar comodín con torneo iniciado (409)

---

## 17. Docker y despliegue

### `docker-compose.yml` (desarrollo)

```yaml
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: tecnoa
      POSTGRES_USER: tecnoa
      POSTGRES_PASSWORD: tecnoa_dev
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  app:
    build: .
    ports:
      - "8080:8080"
    environment:
      DATABASE_URL: jdbc:postgresql://db:5432/tecnoa
      DATABASE_USER: tecnoa
      DATABASE_PASSWORD: tecnoa_dev
      JWT_SECRET: ${JWT_SECRET}
      GOOGLE_CLIENT_ID: ${GOOGLE_CLIENT_ID}
      FOOTBALL_DATA_API_KEY: ${FOOTBALL_DATA_API_KEY}
      GOOGLE_APPLICATION_CREDENTIALS: /app/firebase-credentials.json
    depends_on:
      - db
    volumes:
      - ./firebase-credentials.json:/app/firebase-credentials.json:ro

volumes:
  postgres_data:
```

### `Dockerfile`

```dockerfile
FROM eclipse-temurin:25-jdk-alpine AS build
WORKDIR /app
COPY . .
RUN ./gradlew bootJar -x test

FROM eclipse-temurin:25-jre-alpine
WORKDIR /app
COPY --from=build /app/build/libs/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

---

## 18. Variables de entorno requeridas

| Variable | Descripción | Ejemplo |
|---|---|---|
| `DATABASE_URL` | JDBC URL de PostgreSQL | `jdbc:postgresql://localhost:5432/tecnoa` |
| `DATABASE_USER` | Usuario de la DB | `tecnoa` |
| `DATABASE_PASSWORD` | Contraseña de la DB | — |
| `JWT_SECRET` | Secreto HMAC256 (mín. 32 chars) | — |
| `GOOGLE_CLIENT_ID` | Client ID de Google OAuth2 | `xxxx.apps.googleusercontent.com` |
| `FOOTBALL_DATA_API_KEY` | API key de Football-Data.org | — |
| `GOOGLE_APPLICATION_CREDENTIALS` | Ruta al JSON de Firebase Admin | `/app/firebase.json` |
| `MAIL_HOST` | Servidor SMTP | `smtp.sendgrid.net` |
| `MAIL_PORT` | Puerto SMTP | `587` |
| `MAIL_USERNAME` | Usuario SMTP | `apikey` |
| `MAIL_PASSWORD` | Clave SMTP / API key SendGrid | — |
| `APP_BASE_URL` | URL pública del backend | `https://api.tecnoa.app` |
