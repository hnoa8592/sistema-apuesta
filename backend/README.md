# TECnoa Backend

API REST para el sistema de apuestas grupales de fútbol. Gestiona autenticación OAuth2 con Google, grupos de apuesta, pronósticos, puntuación automática e integración con Football-Data.org.

---

## Tabla de contenidos

1. [Requisitos](#1-requisitos)
2. [Estructura del proyecto](#2-estructura-del-proyecto)
3. [Variables de entorno](#3-variables-de-entorno)
4. [Ambiente de desarrollo](#4-ambiente-de-desarrollo)
5. [Ambiente de producción](#5-ambiente-de-producción)
6. [Base de datos y migraciones](#6-base-de-datos-y-migraciones)
7. [API y documentación](#7-api-y-documentación)
8. [Jobs automáticos](#8-jobs-automáticos)
9. [Tests](#9-tests)
10. [Servicios externos](#10-servicios-externos)

---

## 1. Requisitos

### Herramientas locales

| Herramienta | Versión mínima | Notas |
|---|---|---|
| JDK | 21 | Recomendado: Eclipse Temurin 21 LTS |
| Gradle | 8.5 | Se usa el Gradle Wrapper incluido |
| Docker | 24+ | Para la base de datos en desarrollo |
| Docker Compose | 2.20+ | Incluido con Docker Desktop |
| PostgreSQL | 16 | Solo si no usas Docker |

### Servicios externos requeridos

| Servicio | Propósito | URL |
|---|---|---|
| Google Cloud Console | OAuth2 Client ID + Firebase Admin | https://console.cloud.google.com |
| Football-Data.org | Torneos, equipos y resultados | https://www.football-data.org |
| SendGrid (o SMTP propio) | Envío de emails de verificación | https://sendgrid.com |

---

## 2. Estructura del proyecto

```
backend/
├── build.gradle.kts                    # Dependencias y configuración de build
├── settings.gradle.kts
├── gradle/wrapper/                     # Gradle Wrapper
├── src/
│   ├── main/
│   │   ├── java/com/tecnoa/apuestas/
│   │   │   ├── TecnoaApplication.java  # Entry point
│   │   │   ├── api/                    # Controllers, DTOs, manejo de errores
│   │   │   ├── config/                 # Security, Cache, Firebase, AppProperties
│   │   │   ├── domain/                 # Entidades JPA, Repositorios, Servicios
│   │   │   ├── infrastructure/         # Football-Data, Email, FCM, JWT, Google Auth
│   │   │   └── job/                    # Jobs programados (sync + notificaciones)
│   │   └── resources/
│   │       ├── application.yml         # Configuración principal
│   │       └── db/migration/           # Migraciones Flyway (V1 → V5)
│   └── test/                           # Tests unitarios e integración
```

---

## 3. Variables de entorno

### Tabla completa

| Variable | Requerida | Descripción | Valor por defecto (dev) |
|---|---|---|---|
| `DATABASE_URL` | Sí | URL JDBC de PostgreSQL | `jdbc:postgresql://localhost:5432/tecnoa` |
| `DATABASE_USER` | Sí | Usuario de la base de datos | `tecnoa` |
| `DATABASE_PASSWORD` | Sí | Contraseña de la base de datos | `tecnoa_dev` |
| `JWT_SECRET` | Sí | Clave HMAC256 para firmar JWT (mín. 32 caracteres) | `change-me-in-production...` |
| `GOOGLE_CLIENT_ID` | Sí | Client ID de OAuth2 Google | — |
| `FOOTBALL_DATA_API_KEY` | Sí | API Key de football-data.org | — |
| `GOOGLE_APPLICATION_CREDENTIALS` | No | Ruta al JSON de Firebase Admin (para FCM) | — (push deshabilitado) |
| `MAIL_HOST` | No | Servidor SMTP | `smtp.sendgrid.net` |
| `MAIL_PORT` | No | Puerto SMTP | `587` |
| `MAIL_USERNAME` | No | Usuario SMTP | `apikey` |
| `MAIL_PASSWORD` | No | Contraseña / API Key del SMTP | — |
| `APP_BASE_URL` | No | URL pública del backend (para emails de verificación) | `http://localhost:8080` |

### Cómo configurarlas

**Opción A — Archivo `.env`** (recomendado para desarrollo):

Crea el archivo `backend/.env` (nunca lo subas a git):

```env
DATABASE_URL=jdbc:postgresql://localhost:5432/tecnoa
DATABASE_USER=tecnoa
DATABASE_PASSWORD=tecnoa_dev
JWT_SECRET=mi-secreto-super-seguro-de-al-menos-32-caracteres
GOOGLE_CLIENT_ID=123456789-xxxx.apps.googleusercontent.com
FOOTBALL_DATA_API_KEY=tu_api_key_aqui
GOOGLE_APPLICATION_CREDENTIALS=./firebase-credentials.json
MAIL_HOST=smtp.sendgrid.net
MAIL_PORT=587
MAIL_USERNAME=apikey
MAIL_PASSWORD=SG.xxxxxx
APP_BASE_URL=http://localhost:8080
```

**Opción B — Exportar en la terminal:**

```bash
export JWT_SECRET="mi-secreto-super-seguro-de-al-menos-32-caracteres"
export GOOGLE_CLIENT_ID="123456789-xxxx.apps.googleusercontent.com"
# ... resto de variables
```

---

## 4. Ambiente de desarrollo

### 4.1 Clonar e inicializar el proyecto

```bash
# 1. Entrar al directorio del backend
cd sistema-apuesta/backend

# 2. Generar el Gradle Wrapper (solo la primera vez)
gradle wrapper --gradle-version 8.5

# 3. Verificar que Gradle funciona
./gradlew --version
```

> **Windows:** usa `gradlew.bat` en lugar de `./gradlew`

### 4.2 Levantar la base de datos con Docker

Crea el archivo `docker-compose.yml` en la raíz `backend/`:

```yaml
services:
  db:
    image: postgres:16-alpine
    container_name: tecnoa-db
    environment:
      POSTGRES_DB: tecnoa
      POSTGRES_USER: tecnoa
      POSTGRES_PASSWORD: tecnoa_dev
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U tecnoa"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
```

```bash
# Levantar PostgreSQL en segundo plano
docker compose up -d db

# Verificar que está corriendo
docker compose ps
```

### 4.3 Configurar credenciales de Google OAuth2

1. Ir a [Google Cloud Console → APIs & Services → Credentials](https://console.cloud.google.com/apis/credentials)
2. Crear **OAuth 2.0 Client ID** → tipo **Android** (para la app móvil) y tipo **Web** (para verificar tokens en el backend)
3. Copiar el **Client ID** y asignarlo a `GOOGLE_CLIENT_ID`

### 4.4 Configurar Firebase (FCM) — opcional en desarrollo

Si deseas probar push notifications:

1. Ir a [Firebase Console](https://console.firebase.google.com) → Configuración del proyecto → Cuentas de servicio
2. Generar nueva clave privada → descargar el JSON
3. Guardarlo como `backend/firebase-credentials.json`
4. Configurar `GOOGLE_APPLICATION_CREDENTIALS=./firebase-credentials.json`

Si no configuras Firebase, la app funciona normalmente — solo no se enviarán push notifications.

### 4.5 Ejecutar la aplicación

```bash
# Con variables de entorno exportadas o en .env cargado:
./gradlew bootRun

# Cargar .env automáticamente (Linux/Mac):
export $(cat .env | xargs) && ./gradlew bootRun

# Windows (PowerShell):
Get-Content .env | ForEach-Object {
    if ($_ -match "^([^#].+?)=(.+)$") { [System.Environment]::SetEnvironmentVariable($matches[1], $matches[2]) }
}
./gradlew bootRun
```

La aplicación estará disponible en: **http://localhost:8080**

### 4.6 Verificar que levantó correctamente

```bash
# Health check
curl http://localhost:8080/actuator/health

# Respuesta esperada:
# {"status":"UP"}
```

### 4.7 Sincronización inicial de torneos

La sincronización desde Football-Data.org corre automáticamente cada noche. Para forzarla manualmente en desarrollo:

```bash
# Trigger de sincronización manual (endpoint de admin)
curl -X POST http://localhost:8080/api/v1/admin/sync/tournaments \
  -H "X-Admin-Key: <tu-admin-key>"
```

O en su defecto, esperar al primer job nocturno o reiniciar la app (el job corre al inicio si la base está vacía).

---

## 5. Ambiente de producción

### 5.1 Requisitos de infraestructura

| Componente | Recomendación mínima |
|---|---|
| Servidor | 2 vCPU / 2 GB RAM |
| JDK | Eclipse Temurin 21 (JRE) |
| PostgreSQL | 16 en RDS, Cloud SQL o servidor dedicado |
| SSL/TLS | Nginx como reverse proxy con Let's Encrypt |
| Dominio | `api.tudominio.com` |

### 5.2 Build del JAR

```bash
# Compilar y generar el JAR ejecutable (omite tests para build rápido)
./gradlew bootJar -x test

# El JAR queda en:
ls build/libs/tecnoa-backend-*.jar
```

Para incluir los tests en el build:

```bash
./gradlew build
```

### 5.3 Ejecutar el JAR directamente

```bash
java -jar build/libs/tecnoa-backend-0.0.1-SNAPSHOT.jar \
  --spring.datasource.url=jdbc:postgresql://prod-db:5432/tecnoa \
  --spring.datasource.username=tecnoa_prod \
  --spring.datasource.password=$DB_PASSWORD \
  --app.jwt.secret=$JWT_SECRET \
  --app.google.client-id=$GOOGLE_CLIENT_ID \
  --app.football-data.api-key=$FOOTBALL_DATA_API_KEY \
  --app.mail.from=noreply@tudominio.com \
  --app.base-url=https://api.tudominio.com \
  --spring.mail.host=smtp.sendgrid.net \
  --spring.mail.password=$SENDGRID_API_KEY
```

O mejor, usando variables de entorno del sistema operativo (recomendado para producción).

### 5.4 Despliegue con Docker

**Dockerfile** (ya incluido en el proyecto):

```dockerfile
FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /app
COPY . .
RUN ./gradlew bootJar -x test

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/build/libs/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

**Build de la imagen:**

```bash
docker build -t tecnoa-backend:latest .
```

**`docker-compose.prod.yml`** para producción:

```yaml
services:
  db:
    image: postgres:16-alpine
    restart: always
    environment:
      POSTGRES_DB: tecnoa
      POSTGRES_USER: tecnoa
      POSTGRES_PASSWORD: ${DATABASE_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - tecnoa-net

  app:
    image: tecnoa-backend:latest
    restart: always
    ports:
      - "8080:8080"
    environment:
      DATABASE_URL: jdbc:postgresql://db:5432/tecnoa
      DATABASE_USER: tecnoa
      DATABASE_PASSWORD: ${DATABASE_PASSWORD}
      JWT_SECRET: ${JWT_SECRET}
      GOOGLE_CLIENT_ID: ${GOOGLE_CLIENT_ID}
      FOOTBALL_DATA_API_KEY: ${FOOTBALL_DATA_API_KEY}
      GOOGLE_APPLICATION_CREDENTIALS: /app/firebase-credentials.json
      MAIL_HOST: ${MAIL_HOST}
      MAIL_PORT: ${MAIL_PORT}
      MAIL_USERNAME: ${MAIL_USERNAME}
      MAIL_PASSWORD: ${MAIL_PASSWORD}
      APP_BASE_URL: ${APP_BASE_URL}
    volumes:
      - ./firebase-credentials.json:/app/firebase-credentials.json:ro
    depends_on:
      db:
        condition: service_healthy
    networks:
      - tecnoa-net

networks:
  tecnoa-net:

volumes:
  postgres_data:
```

```bash
# Levantar en producción
docker compose -f docker-compose.prod.yml up -d

# Ver logs en vivo
docker compose -f docker-compose.prod.yml logs -f app

# Reiniciar solo la app (después de una actualización)
docker compose -f docker-compose.prod.yml up -d --build app
```

### 5.5 Nginx como reverse proxy (recomendado)

Instalar Nginx y configurar `/etc/nginx/sites-available/tecnoa`:

```nginx
server {
    listen 80;
    server_name api.tudominio.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name api.tudominio.com;

    ssl_certificate     /etc/letsencrypt/live/api.tudominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.tudominio.com/privkey.pem;

    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
    }
}
```

```bash
# Obtener certificado SSL con Certbot
sudo certbot --nginx -d api.tudominio.com

# Habilitar el sitio
sudo ln -s /etc/nginx/sites-available/tecnoa /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### 5.6 Configurar como servicio systemd (sin Docker)

Crear `/etc/systemd/system/tecnoa.service`:

```ini
[Unit]
Description=TECnoa Backend
After=network.target postgresql.service

[Service]
Type=simple
User=tecnoa
WorkingDirectory=/opt/tecnoa
ExecStart=/usr/bin/java -jar /opt/tecnoa/tecnoa-backend.jar
EnvironmentFile=/opt/tecnoa/.env
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable tecnoa
sudo systemctl start tecnoa
sudo systemctl status tecnoa

# Ver logs
sudo journalctl -u tecnoa -f
```

### 5.7 Actualizar en producción (zero-downtime)

```bash
# 1. Compilar la nueva versión
./gradlew bootJar -x test

# 2. Copiar el JAR al servidor
scp build/libs/tecnoa-backend-*.jar user@prod-server:/opt/tecnoa/tecnoa-backend.jar

# 3. Reiniciar el servicio
ssh user@prod-server "sudo systemctl restart tecnoa"

# 4. Verificar
curl https://api.tudominio.com/actuator/health
```

---

## 6. Base de datos y migraciones

Las migraciones se ejecutan **automáticamente al arrancar la aplicación** usando Flyway. No se requiere ningún comando adicional.

### Migraciones incluidas

| Versión | Archivo | Contenido |
|---|---|---|
| V1 | `V1__init_users.sql` | Tablas `users`, `fcm_tokens`, `email_verifications` |
| V2 | `V2__init_tournaments.sql` | Tablas `tournaments`, `teams`, `matches` + tipos ENUM |
| V3 | `V3__init_betting_groups.sql` | Tablas `betting_groups`, `group_members` |
| V4 | `V4__init_predictions.sql` | Tabla `predictions` + índices |
| V5 | `V5__init_wildcards.sql` | Tabla `wildcards` |

### Agregar una nueva migración

```bash
# Crear el archivo con el siguiente número de versión
touch src/main/resources/db/migration/V6__descripcion_cambio.sql
# Editar el archivo con el SQL
# Al reiniciar la app, Flyway aplica la migración automáticamente
```

### Conectarse a la base de datos en desarrollo

```bash
# Via Docker
docker exec -it tecnoa-db psql -U tecnoa -d tecnoa

# Comandos útiles en psql
\dt                          -- listar tablas
\d users                     -- describir tabla users
SELECT * FROM tournaments;   -- consultar torneos
```

---

## 7. API y documentación

### Swagger UI

Disponible en desarrollo en:

```
http://localhost:8080/swagger-ui.html
```

En producción (si se deja habilitado):

```
https://api.tudominio.com/swagger-ui.html
```

> Para deshabilitar Swagger en producción, agregar a `application.yml`:
> ```yaml
> springdoc:
>   api-docs:
>     enabled: false
>   swagger-ui:
>     enabled: false
> ```

### Endpoints principales

| Método | Endpoint | Auth | Descripción |
|---|---|---|---|
| POST | `/api/v1/auth/google` | No | Login con Google |
| POST | `/api/v1/auth/fcm-token` | Sí | Registrar token FCM |
| GET | `/api/v1/users/me` | Sí | Mi perfil |
| PUT | `/api/v1/users/me` | Sí | Actualizar teléfono/correo |
| POST | `/api/v1/users/me/verify-email` | Sí | Enviar email de verificación |
| GET | `/api/v1/tournaments` | Sí | Listar torneos activos |
| GET | `/api/v1/tournaments/{id}/matches` | Sí | Partidos de un torneo |
| POST | `/api/v1/groups` | Sí | Crear grupo de apuesta |
| GET | `/api/v1/groups` | Sí | Mis grupos |
| POST | `/api/v1/groups/join` | Sí | Unirse a un grupo |
| GET | `/api/v1/groups/{id}/leaderboard` | Sí (miembro) | Ranking del grupo |
| POST | `/api/v1/groups/{id}/predictions` | Sí (miembro) | Enviar pronóstico |
| PUT | `/api/v1/groups/{id}/wildcards` | Sí (miembro) | Actualizar comodines |
| GET | `/api/v1/groups/{id}/awards` | Sí (miembro) | Distribución de premios |

### Autenticación

Todos los endpoints protegidos requieren el header:

```
Authorization: Bearer <JWT>
```

El JWT se obtiene en `POST /api/v1/auth/google` y tiene vigencia de **7 días**.

### Ejemplo de flujo completo

```bash
# 1. Login con Google (idToken obtenido desde la app móvil)
TOKEN=$(curl -s -X POST http://localhost:8080/api/v1/auth/google \
  -H "Content-Type: application/json" \
  -d '{"idToken": "GOOGLE_ID_TOKEN"}' | jq -r '.accessToken')

# 2. Ver perfil
curl http://localhost:8080/api/v1/users/me \
  -H "Authorization: Bearer $TOKEN"

# 3. Listar torneos
curl http://localhost:8080/api/v1/tournaments \
  -H "Authorization: Bearer $TOKEN"

# 4. Crear un grupo de apuesta
curl -X POST http://localhost:8080/api/v1/groups \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Amigos del Mundial",
    "tournamentId": "UUID_DEL_TORNEO",
    "maxParticipants": 20,
    "isOpen": true,
    "predictionDeadlineMinutes": 15,
    "wildcardsEnabled": true,
    "entryFee": 50.00
  }'

# 5. Enviar un pronóstico
curl -X POST http://localhost:8080/api/v1/groups/GROUP_ID/predictions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"matchId": "MATCH_UUID", "homeScore": 2, "awayScore": 1}'
```

---

## 8. Jobs automáticos

| Job | Cron / Intervalo | Descripción |
|---|---|---|
| Sync competiciones y equipos | Diario 03:00 AM | Actualiza torneos y equipos desde Football-Data.org |
| Sync fixtures | Diario 04:00 AM | Actualiza el calendario de partidos |
| Sync resultados en vivo | Cada 60 segundos | Detecta partidos en curso y actualiza scores; calcula puntos cuando un partido termina |
| Recordatorios de pronóstico | Cada minuto | Envía push notification a usuarios sin pronóstico ~60 min antes del cierre |

Los jobs se activan automáticamente al iniciar la aplicación. No requieren configuración adicional.

---

## 9. Tests

### Ejecutar todos los tests

```bash
./gradlew test
```

### Ejecutar un test específico

```bash
./gradlew test --tests "com.tecnoa.apuestas.domain.service.ScoringServiceTest"
```

### Ver reporte de tests

```bash
# Abrir el reporte HTML
open build/reports/tests/test/index.html   # Mac/Linux
start build/reports/tests/test/index.html  # Windows
```

### Tests incluidos

| Test | Tipo | Descripción |
|---|---|---|
| `ScoringServiceTest` | Unitario | 17 casos parametrizados: todas las fases × (exacto/resultado/fallo) + regla de penales |

---

## 10. Servicios externos

### Football-Data.org

1. Registrarse en [football-data.org](https://www.football-data.org/client/register)
2. El plan gratuito (**Tier One**) incluye: Mundial, Champions League, Premier League, La Liga, y más
3. Límite: 10 requests/minuto (el sync está configurado con pausas de 200ms entre llamadas)
4. Asignar la API Key a `FOOTBALL_DATA_API_KEY`

### Google OAuth2

1. Ir a [console.cloud.google.com](https://console.cloud.google.com)
2. Crear un proyecto o seleccionar uno existente
3. Habilitar **Google Sign-In API**
4. Crear credenciales OAuth 2.0:
   - Para el backend: tipo **Web application**
   - Para la app Android: tipo **Android** (requiere SHA-1 del keystore)
5. El **Web Client ID** se usa como `GOOGLE_CLIENT_ID` en el backend

### Firebase (FCM — Push Notifications)

1. Ir a [console.firebase.google.com](https://console.firebase.google.com)
2. Crear proyecto (puede ser el mismo proyecto de Google Cloud)
3. Ir a **Configuración del proyecto → Cuentas de servicio**
4. Clic en **"Generar nueva clave privada"** → descargar JSON
5. Guardar como `firebase-credentials.json` y configurar `GOOGLE_APPLICATION_CREDENTIALS`

### SendGrid (Email)

1. Registrarse en [sendgrid.com](https://sendgrid.com)
2. Crear una **API Key** con permisos de envío
3. Verificar el dominio remitente
4. Configurar:
   ```
   MAIL_HOST=smtp.sendgrid.net
   MAIL_PORT=587
   MAIL_USERNAME=apikey
   MAIL_PASSWORD=SG.xxxxxxxxxx
   ```

> **Alternativa:** Cualquier servidor SMTP funciona (Gmail, Mailgun, AWS SES). Ajustar `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME` y `MAIL_PASSWORD` según el proveedor.

---

## Notas de seguridad

- El archivo `.env` y `firebase-credentials.json` **nunca deben subirse a git**. Están incluidos en `.gitignore`.
- El `JWT_SECRET` debe tener al menos 32 caracteres aleatorios. Generar con:
  ```bash
  openssl rand -base64 48
  ```
- En producción, usar un gestor de secretos (AWS Secrets Manager, HashiCorp Vault, o variables de entorno del servidor).
- Swagger UI debe deshabilitarse o protegerse con autenticación básica en producción.
- El endpoint `/actuator` está limitado a `health`, `info` y `metrics`. No exponer `env` o `beans`.
