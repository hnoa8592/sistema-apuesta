# SPEC — Aplicación Web · TECnoa
**Sistema de apuestas grupales de fútbol**
Stack: Angular 20 · Tailwind CSS 4 · TypeScript 5

---

## 1. Visión general

SPA (Single Page Application) Angular que expone las mismas funcionalidades de la app móvil: autenticación OAuth2 Google, exploración de torneos y grupos, creación y gestión de grupos de quinielas, pronósticos de partidos, comodines, ranking y premiación.

La web comparte exactamente la misma API REST del backend (`/api/v1`), mismos DTOs y misma lógica de negocio.

---

## 2. Stack y herramientas

| Componente | Tecnología |
|---|---|
| Framework | Angular 20 (Standalone Components, Signals) |
| Lenguaje | TypeScript 5.x |
| Estilos | Tailwind CSS 4 + CSS custom properties |
| Build | Angular CLI + Vite (esbuild) |
| Router | Angular Router 20 (lazy loading por feature) |
| Estado | Angular Signals + `signal stores` (`@ngrx/signals`) |
| HTTP | `HttpClient` con interceptores funcionales |
| Auth Google | Google Identity Services (`@google/model-viewer` / GSI JS SDK) |
| JWT storage | `localStorage` con wrapper seguro (no `sessionStorage` en web) |
| Formularios | Reactive Forms (`FormBuilder`, `Validators`) |
| Push | Firebase JS SDK v10 (FCM Web Push) |
| Animaciones | Angular Animations + Tailwind `transition` |
| Fechas | `date-fns` |
| Íconos | Heroicons (SVG inline via componente) |
| Imágenes | `NgOptimizedImage` |
| Paginación | Scroll infinito + cursor paginado |
| Testing | Jest + Angular Testing Library + MSW (mock service worker) |
| Linting | ESLint + `@angular-eslint` + Prettier |
| i18n | `@angular/localize` (español, preparado para multi-idioma) |

---

## 3. Arquitectura de capas

```
src/app/
├── core/                          ← Singleton services, guards, interceptors
│   ├── auth/
│   │   ├── auth.service.ts
│   │   ├── auth.guard.ts          ← protege rutas autenticadas
│   │   ├── profile-complete.guard.ts
│   │   └── google-identity.service.ts
│   ├── http/
│   │   ├── auth.interceptor.ts    ← inyecta Bearer token
│   │   └── error.interceptor.ts   ← manejo 401/409/etc.
│   ├── stores/                    ← @ngrx/signals store por dominio
│   │   ├── auth.store.ts
│   │   ├── tournaments.store.ts
│   │   ├── groups.store.ts
│   │   └── notifications.store.ts
│   └── services/
│       └── notification.service.ts ← toast/snackbar global
│
├── shared/                        ← Componentes, pipes y directivas reutilizables
│   ├── components/
│   │   ├── match-row/
│   │   ├── leader-row/
│   │   ├── team-stepper/
│   │   ├── pill/
│   │   ├── avatar/
│   │   ├── countdown/
│   │   ├── stat-card/
│   │   ├── progress-bar/
│   │   ├── skeleton/              ← loading placeholders
│   │   ├── empty-state/
│   │   └── confirm-dialog/
│   ├── pipes/
│   │   ├── relative-time.pipe.ts
│   │   └── currency-bs.pipe.ts
│   └── directives/
│       └── infinite-scroll.directive.ts
│
├── features/
│   ├── auth/                      ← /login
│   ├── explore/                   ← /explorar
│   ├── my-groups/                 ← /mis-grupos
│   ├── group-detail/              ← /grupos/:id
│   ├── predict/                   ← /grupos/:groupId/pronosticar/:matchId
│   ├── wildcards/                 ← /grupos/:groupId/comodines
│   ├── history/                   ← /historial
│   ├── profile/                   ← /perfil
│   └── awards/                    ← /grupos/:groupId/premiacion
│
└── layout/
    ├── shell/                     ← AppShell con sidebar + topbar
    ├── sidebar/
    └── topbar/
```

Cada feature sigue el patrón:
`Component → (Signal Store | Service) → Repository Service → HttpClient`

---

## 4. Configuración del proyecto

### `angular.json` — puntos clave
```json
{
  "build": {
    "builder": "@angular-devkit/build-angular:application",
    "options": {
      "outputMode": "static",
      "prerender": false,
      "ssr": false
    }
  }
}
```

### `tailwind.config.ts`
```typescript
import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{html,ts}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'q-bg':       { DEFAULT: '#f9f9f4', dark: '#1e2030' },
        'q-surface':  { DEFAULT: '#ffffff', dark: '#242638' },
        'q-surface-2':{ DEFAULT: '#f4f4ee', dark: '#2a2d40' },
        'q-fg':       { DEFAULT: '#1a1d2e', dark: '#f7f7f0' },
        'q-fg-2':     { DEFAULT: '#5a5e72', dark: '#b8bcc8' },
        'q-fg-3':     { DEFAULT: '#8e91a0', dark: '#7a7d8c' },
        'q-accent':   { DEFAULT: '#9edb4f', dark: '#b4e866' },
        'q-danger':   { DEFAULT: '#d45a2a', dark: '#d45a2a' },
      },
      fontFamily: {
        display: ['Inter Tight', 'sans-serif'],
        ui:      ['Inter', 'sans-serif'],
        mono:    ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        sm: '8px',
        md: '14px',
        lg: '20px',
        xl: '28px',
      },
    },
  },
} satisfies Config;
```

### Variables de entorno (`environment.ts`)
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api/v1',
  googleClientId: import.meta.env['NG_APP_GOOGLE_CLIENT_ID'],
  firebaseConfig: {
    apiKey: import.meta.env['NG_APP_FIREBASE_API_KEY'],
    projectId: import.meta.env['NG_APP_FIREBASE_PROJECT_ID'],
    messagingSenderId: import.meta.env['NG_APP_FIREBASE_SENDER_ID'],
    appId: import.meta.env['NG_APP_FIREBASE_APP_ID'],
    vapidKey: import.meta.env['NG_APP_FIREBASE_VAPID_KEY'],
  },
};
```

---

## 5. Enrutamiento

```typescript
// app.routes.ts
export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./features/auth/login.component') },

  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'explorar', pathMatch: 'full' },
      {
        path: 'explorar',
        loadComponent: () => import('./features/explore/explore.component'),
      },
      {
        path: 'mis-grupos',
        loadComponent: () => import('./features/my-groups/my-groups.component'),
      },
      {
        path: 'mis-grupos/crear',
        loadComponent: () => import('./features/my-groups/create-group/create-group.component'),
        canActivate: [profileCompleteGuard],
      },
      {
        path: 'grupos/:id',
        loadComponent: () => import('./features/group-detail/group-detail.component'),
        children: [
          { path: '', redirectTo: 'puntajes', pathMatch: 'full' },
          { path: 'puntajes',     loadComponent: () => import('./features/group-detail/leaderboard/leaderboard.component') },
          { path: 'pronosticos',  loadComponent: () => import('./features/group-detail/prediction-list/prediction-list.component') },
          { path: 'participantes',loadComponent: () => import('./features/group-detail/participants/participants.component') },
        ],
      },
      {
        path: 'grupos/:groupId/pronosticar/:matchId',
        loadComponent: () => import('./features/predict/predict.component'),
      },
      {
        path: 'grupos/:groupId/comodines',
        loadComponent: () => import('./features/wildcards/wildcards.component'),
      },
      {
        path: 'grupos/:groupId/premiacion',
        loadComponent: () => import('./features/awards/awards.component'),
      },
      {
        path: 'historial',
        loadComponent: () => import('./features/history/history.component'),
      },
      {
        path: 'perfil',
        loadComponent: () => import('./features/profile/profile.component'),
      },
      {
        path: 'perfil/editar',
        loadComponent: () => import('./features/profile/edit-profile/edit-profile.component'),
      },
    ],
  },

  { path: '**', redirectTo: 'explorar' },
];
```

---

## 6. Autenticación

### Flujo completo
1. Usuario hace clic en **"Continuar con Google"**
2. Se inicializa Google Identity Services (`google.accounts.id.initialize`)
3. Se obtiene el `credential` (Google One Tap o popup)
4. Se llama `POST /api/v1/auth/google` con `{ "idToken": credential }`
5. Backend retorna `{ "accessToken": "JWT", "user": {...} }`
6. JWT se guarda en `localStorage` con la clave `tecnoa_auth_token`
7. `AuthStore` se actualiza con el usuario autenticado
8. Se redirige a `/explorar` (o a la ruta pre-login si existía)

### `AuthInterceptor` (funcional)
```typescript
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('tecnoa_auth_token');
  if (token) {
    req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }
  return next(req);
};
```

### `ErrorInterceptor`
- `401` → limpiar token, redirigir a `/login`
- `409` con código `PREDICTION_DEADLINE_PASSED` → toast rojo + UI locked
- `403` con código `PROFILE_INCOMPLETE` → redirigir a `/perfil/editar`
- Timeout / red → toast "Sin conexión"

### Guards
```typescript
// auth.guard.ts
export const authGuard: CanActivateFn = () => {
  const token = localStorage.getItem('tecnoa_auth_token');
  return token ? true : inject(Router).createUrlTree(['/login']);
};

// profile-complete.guard.ts — verifica contact_email_verified antes de crear grupo
export const profileCompleteGuard: CanActivateFn = () => {
  const auth = inject(AuthStore);
  return auth.user()?.contactEmailVerified
    ? true
    : inject(Router).createUrlTree(['/perfil/editar']);
};
```

---

## 7. Layout general (`ShellComponent`)

La shell se adapta a dos breakpoints principales:

### Desktop (≥ 1024px)
```
┌─────────────────────────────────────────────────────────┐
│  SIDEBAR (240px fijo)    │  CONTENT AREA                │
│  ─────────────────────── │  ─────────────────────────── │
│  Logo TECnoa             │  <router-outlet>              │
│  ─────────────────────── │                               │
│  [Explorar]              │                               │
│  [Mis grupos]            │                               │
│  [Historial]             │                               │
│  [Perfil]                │                               │
│  ─────────────────────── │                               │
│  Avatar + nombre usuario │                               │
│  [Cerrar sesión]         │                               │
└─────────────────────────────────────────────────────────┘
```

### Mobile/Tablet (< 1024px)
```
┌─────────────────────────┐
│  TOPBAR                 │
│  Logo          ☰ menú   │
├─────────────────────────┤
│  <router-outlet>        │
├─────────────────────────┤
│  BOTTOM NAV             │
│  Explorar Grupos Hist Perfil │
└─────────────────────────┘
```

### `SidebarComponent`
- Ítem activo con fondo `q-accent` + texto `q-fg`
- Badge numérico en "Mis grupos" si hay grupos con partidos pendientes
- Avatar del usuario (foto de Google con fallback inicial)
- Botón "Cerrar sesión" al fondo

---

## 8. Sistema de diseño

### Paleta de colores (CSS custom properties + Tailwind)

| Token | Light | Dark |
|---|---|---|
| `q-bg` | `#f9f9f4` | `#1e2030` |
| `q-surface` | `#ffffff` | `#242638` |
| `q-surface-2` | `#f4f4ee` | `#2a2d40` |
| `q-fg` | `#1a1d2e` | `#f7f7f0` |
| `q-fg-2` | `#5a5e72` | `#b8bcc8` |
| `q-fg-3` | `#8e91a0` | `#7a7d8c` |
| `q-accent` | `#9edb4f` — lima | `#b4e866` |
| `q-danger` | `#d45a2a` — rojo | igual |

Dark mode: clase `dark` en `<html>`, persistido en `localStorage`.

### Tipografía (Google Fonts)
```html
<!-- index.html -->
<link href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@700&family=Inter:wght@400;600&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
```

### Componentes compartidos (`shared/components/`)

#### `MatchRowComponent`
```
[Bandera] Equipo Local   [score pred / score real]   Equipo Visitante [Bandera]
          [Pill fase]    [CountdownBadge / Pill estado]
```

#### `LeaderRowComponent`
```
[Pos/Medalla]  [Avatar]  Nombre [Pill TÚ]     ↑2   [47 pts]
               N exactos · N aciertos
```

#### `TeamStepperComponent`
- Botones `−` / `+` circulares, valor `0–9`
- Deshabilitado cuando `locked = true`
- Variante tamaño: `sm` | `md` | `lg`

#### `PillComponent`
```html
<app-pill variant="default|accent|live|success|danger" [label]="texto" />
```

#### `AvatarComponent`
- Imagen de perfil con fallback inicial del nombre
- Tamaños: `xs` (24px) · `sm` (32px) · `md` (40px) · `lg` (56px)

#### `CountdownComponent`
- Recibe `targetDate: Date`
- Formato `HH:mm:ss` fuente mono
- Color danger + parpadeo cuando quedan < 5 minutos
- Emite `(expired)` cuando llega a cero

#### `StatCardComponent`
```html
<app-stat-card label="Tu posición" [value]="3" suffix="°" />
```

#### `SkeletonComponent`
- Placeholder animado para listas y cards mientras carga

#### `EmptyStateComponent`
- Ícono + título + descripción + botón CTA opcional

#### `ConfirmDialogComponent`
- Dialog modal (Angular CDK Overlay)
- Props: `title`, `message`, `confirmLabel`, `cancelLabel`, `variant: danger|default`

---

## 9. Pantallas

### 9.1 Login (`/login`)

**Layout:** dos zonas en pantalla completa, centrado verticalmente en desktop.

**Zona superior (65% de altura):**
- Fondo `q-fg` (oscuro)
- Logo + "TECnoa" (esquina top-left)
- Eyebrow: "Mundial 2026" en `q-accent`
- Headline display: "Quien acierta gana." (Inter Tight 700, 48px)
- 3 `FauxMatchRow` decorativos (ARG–BRA 2–1, FRA–ESP 0–0, ALE–ING 3–2)

**Zona inferior (35%):**
- Fondo `q-bg`
- Botón "Continuar con Google" (ícono SVG Google + texto, ancho 320px máx)
- Texto legal mínimo: "Usamos OAuth2 de Google. No almacenamos contraseñas."

**Estados del botón:**
- `IDLE` — activo
- `LOADING` — spinner inline + deshabilitado
- `ERROR` — toast rojo con mensaje

**Redireccionamiento:** si ya hay JWT válido → redirigir automáticamente a `/explorar`

---

### 9.2 Explorar (`/explorar`)

**Header de página:**
- Título "Explorar"
- Sub: "Torneos abiertos a inscripción"
- Botón campana (notificaciones, con badge si hay pendientes)

**Barra de búsqueda:**
- Input con debounce 300ms, busca por nombre de torneo u organizador
- Shortcut `Ctrl+K` para enfocar

**Chips de filtro (scroll horizontal en mobile, fila en desktop):**
`Todos` · `Selecciones` · `Ligas` · `Privados` · `Próximos`

**Torneo destacado (`FeaturedTournamentCard`):**
```
┌───────────────────────────────────────────┐
│ [Pill llama "Destacado"]                  │ fondo q-fg
│ Mundial 2026                              │
│ WORLD_CUP · Por: Mariana V.               │
│ Inscripción: Bs 50 · Pozo: Bs 1.200 · 24 jugadores │
│                    [CTA: "Inscribirme · Bs 50"] │
└───────────────────────────────────────────┘
```

**Grid de grupos (`TournamentCard`):**
- 1 col en mobile, 2 cols en tablet, 3 cols en desktop
- Ícono trofeo 52px · Nombre + pill "Inscrito"
- Subtítulo: tipo · jugadores · cuota
- Chevron o CTA "Ver"

**Diálogo de unirse a grupo:**
- Se abre al hacer clic en una card
- Campo de código de invitación (si el usuario quiere entrar con código directo)
- Campo de contraseña (si el grupo la requiere)
- Botón "Unirse"

**Paginación:** scroll infinito con `IntersectionObserver`

---

### 9.3 Mis Grupos (`/mis-grupos`)

**Header:**
- Título "Mis torneos"
- Sub: "N activos · próximo cierre en Xh"
- Botón `+` "Crear grupo"

**Segmented control:**
`Activos` · `Próximos` · `Finalizados`

**Mini-stats strip (3 tarjetas `StatCard`):**
- Posición media · Aciertos (X/Y) · Marcadores exactos

**Lista de grupos (`MyGroupCard`):**
```
┌──────────────────────────────────────────┐
│ [Pill tipo] [Pill EN VIVO]               │
│ Mundial de Amigos                        │
│ Fase de Grupos · J2                      │
│ ─────────────────────────────────────── │
│ Tu pos: 3° (↑2)   Tus pts: 47           │
│ [Progress bar torneo]                    │
│ 24 jugadores · Pozo Bs 1.200             │
│      [CTA: "Pronostica · 2h"] →         │
└──────────────────────────────────────────┘
```

**Secciones separadas:**
- "Grupos que creé" con badge "Organizador"
- "Grupos en los que participo"

**Estado vacío:** `EmptyStateComponent` con CTA "Explorar torneos"

---

### 9.4 Crear Grupo (`/mis-grupos/crear`)

**Prerequisito:** `profileCompleteGuard` — si `contact_email_verified = false`, modal informativo que redirige a `/perfil/editar`.

**Stepper de 2 pasos** (indicador de progreso en la parte superior):

**Paso 1 — Info básica:**
- Nombre del grupo (max 50 chars, contador visible)
- Selector de torneo (desplegable con búsqueda, muestra solo `SCHEDULED` / `IN_PROGRESS`)
- Máximo de participantes (input numérico, placeholder "Sin límite")
- Toggle "Grupo abierto": ON = cualquiera con enlace; OFF = requiere aprobación del organizador
- Contraseña (opcional, campo con eye-toggle)
- Botón "Siguiente →"

**Paso 2 — Configuración de juego:**
- Slider "Cierre antes del partido": 5–120 minutos (default 15)
- Switch "Habilitar comodines" (default OFF)
- Monto de inscripción (decimal con símbolo Bs, informativo)
- Botón "← Anterior" / "Crear grupo"

**On success:**
- Toast "¡Grupo creado!"
- Navegar a `/grupos/:id`
- Mostrar modal con código de invitación y botón "Copiar enlace"

---

### 9.5 Detalle del Grupo (`/grupos/:id`)

**Cover header (fondo `q-fg`, padding generoso):**
- Botón back `←`
- Botón configuración (solo organizador) → panel lateral
- Pill tipo de torneo
- Nombre grande del grupo
- Sub: organizador · N jugadores · Pozo Bs X
- Stats row: Tu pos · Tus pts · Aciertos · Exactos

**Tabs con `router-outlet` anidado:**

| Tab | Ruta | Descripción |
|---|---|---|
| Puntajes | `/grupos/:id/puntajes` | Leaderboard |
| Pronósticos | `/grupos/:id/pronosticos` | Lista de partidos |
| Participantes | `/grupos/:id/participantes` | Miembros |

**Card de Comodines (si están habilitados, fija fuera de tabs):**
- "N de 5 elegidos · Cierra en X días"
- Botón "Gestionar comodines" → `/grupos/:groupId/comodines`

**Panel de configuración (Sidebar/Drawer, solo organizador):**
- Editar nombre, contraseña, deadline
- Botón "Generar nuevo código de invitación"
- Botón rojo "Disolver grupo" (solo si torneo SCHEDULED)
- Bloqueado con tooltip explicativo si torneo IN_PROGRESS

---

### 9.5.1 Tab Puntajes — Leaderboard (`/grupos/:id/puntajes`)

- Sub-header: "Tabla general · Actualizado HH:mm"
- Tabla o lista de `LeaderRowComponent`:
  - Medalla (🥇🥈🥉) para top 3, número para el resto
  - Avatar · Nombre · "TÚ" pill
  - N exactos · N aciertos
  - Indicador tendencia (↑ verde / ↓ rojo / — neutro)
  - Puntos (tabulados, Inter Tight 700)
- Fila del usuario actual: fondo `q-accent/10` + borde izquierdo `q-accent`
- Polling automático cada 60s mientras la pestaña está activa

---

### 9.5.2 Tab Pronósticos — Lista (`/grupos/:id/pronosticos`)

**Sección "Pendientes":**
- Ordenados por `scheduledAt` ascendente
- Badge rojo de tiempo restante por partido
- Tap/click → `/grupos/:groupId/pronosticar/:matchId`

**Sección "Enviados":**
- Checkmark verde
- Score pronosticado visible (e.g. `ARG 2 – 1 BRA`)
- Score real si partido `FINISHED`, con puntos obtenidos

**`MatchPredictRow`:**
```
[Pill fase · J3]                      [CountdownBadge / ✓ Enviado / resultado]
[🇦🇷] Argentina  [2] — [1]  Brasil [🇧🇷]
                 Hoy · 18:00
```
Clic en fila → navega a pronóstico individual si editable, o abre modal de solo lectura si locked.

---

### 9.5.3 Tab Participantes (`/grupos/:id/participantes`)

- Sub-header: "N inscritos"
- Botón "Copiar enlace de invitación" (copia al clipboard)
- Lista: Avatar · Nombre · email · "Inscrito el DD/MM" · Pill "Pagó" (informativo)
- Para organizador: botón eliminar participante (si torneo SCHEDULED)

---

### 9.6 Pronóstico Individual (`/grupos/:groupId/pronosticar/:matchId`)

**Header:**
- Botón `←` de vuelta a pronósticos
- Título "Pronóstico"

**Countdown:**
- Eyebrow "Cierra en"
- `CountdownComponent` 42sp mono en rojo
- Sub: "15 min antes del inicio · Hoy HH:mm"

**Match card:**
- Pill: "Mundial · Grupo C · J3"
- Pill acento: "3 pts si exacto" (según fase, valores del enum `MatchStage`)
- Grid 2 columnas con `TeamStepperComponent` por equipo:
  - Bandera (imagen con fallback código 3 letras)
  - Nombre del equipo
  - `BigStepper` (−/+ circular 0–9)
- Score grande centrado `A – B` en fuente display
- Texto descriptivo: "Gana [equipo] por [diferencia]" / "Empate"

**Presets de marcadores (scroll horizontal):**
`1-0` · `2-0` · `2-1` · `1-1` · `0-0` · `0-1` · `1-2` · `3-1` · `3-0`
El preset activo se resalta con fondo `q-fg` y texto `q-bg`.

**Mini reglamento:**
```
★ 1 pt si aciertas el resultado · X pts si aciertas el marcador exacto.
  En penales solo cuenta el score al final del tiempo reglamentario.
```
(Valores dinámicos según el `stage` del partido.)

**Botones:**
- Ghost: "Guardar borrador" → persiste en `localStorage` sin llamar a la API
- Primary: "Enviar pronóstico" → llama `POST /api/v1/groups/:groupId/predictions`

**Estados del componente:**
| Estado | Descripción |
|---|---|
| `EDITABLE` | Stepper activo, botones visibles |
| `SENT` | Muestra score enviado, botón "Modificar" si sigue abierto |
| `LOCKED` | Todo deshabilitado, mensaje "Tiempo expirado" |
| `LOADING` | Overlay spinner, inputs bloqueados |
| `RESULT` | Score real visible, puntos obtenidos, sin edición |

---

### 9.7 Comodines (`/grupos/:groupId/comodines`)

**Header:** "Comodines · [nombre torneo]"

**Descripción:** "5 elecciones que se cierran al iniciar la fase de grupos. Cada acierto suma 5 pts a tu total."

**Card de progreso:**
- "N de 5 elegidos · N / 25 pts potenciales"
- Barra de progreso
- Aviso rojo: "Cierra en X días · DD mmm, HH:mm"

**Lista de 5 `WildcardRowComponent`:**

| Tipo | Label | Input |
|---|---|---|
| `FINALIST_1` | Selección a la final #1 | Selector desplegable de equipos |
| `FINALIST_2` | Selección a la final #2 | Selector desplegable de equipos |
| `BEST_PLAYER` | Mejor jugador | Input texto con autocomplete |
| `BEST_GOALKEEPER` | Mejor portero | Input texto |
| `TOP_SCORER` | Goleador del torneo | Input texto |

Cada fila:
- Ícono (🔒 si bloqueado, ⭐ si editable)
- Label + eyebrow "+5 PTS"
- Valor elegido o "Sin elegir" en rojo
- Chevron (si editable)

**Estado locked:** cuando torneo `IN_PROGRESS`, inputs deshabilitados, tooltip "El torneo ya inició".

**Botón "Confirmar selecciones":** desaparece si ya están bloqueadas. Llama `PUT /api/v1/groups/:groupId/wildcards`.

---

### 9.8 Historial (`/historial`)

**Header:** "Mi historial" · input búsqueda (filtra por equipo o torneo)

**Summary strip (4 stats):**
Jugados · Aciertos · Exactos · Total pts

**Agrupado por torneo + fase (acordeón expandible):**
- Header: "Mundial 2026 — Fase de grupos"

**`PastMatchRowComponent`:**
```
[Pill: ✓ Exacto +3 / ✓ Resultado +1 / ✗ Falló 0]     Grupo A · J3
[🇦🇷] Argentina  [2 – 1]  Brasil [🇧🇷]
                  Tu pronóstico: 2–1
```

**Paginación:** "Ver más" (carga 20 registros adicionales)

**Filtros laterales (panel colapsable en desktop):**
- Por torneo
- Por resultado (Exacto / Acierto / Fallo)
- Por fase

---

### 9.9 Perfil (`/perfil`)

**Card de perfil:**
- Avatar grande (foto de Google, 80px)
- Nombre · email de Google
- Pills: "Google" + "Verificado" (si `contact_email_verified`)

**Grid 2×3 de estadísticas:**
- Torneos jugados
- Torneos ganados
- Pts acumulados
- Pts este mes
- Tasa de acierto (%)
- Marcadores exactos

**Sección Cuenta (lista de items):**

| Ícono | Label | Acción |
|---|---|---|
| 🔔 | Notificaciones | Toggle permisos FCM web push |
| 🌙 | Modo oscuro | Toggle dark/light mode |
| 🏆 | Mi historial | Navegar a `/historial` |
| 👤 | Editar perfil | Navegar a `/perfil/editar` |
| 🚪 | Cerrar sesión | Diálogo confirm → logout |

**Footer:** "TECnoa · v1.0.0"

---

### 9.10 Editar Perfil (`/perfil/editar`)

**Formulario:**
- Teléfono: input con selector de prefijo de país (select simple), validación de formato básico
- Correo de verificación: puede ser diferente al de Google

**Flujo de verificación de correo:**
1. Usuario escribe correo → toca "Enviar enlace"
2. Botón muestra spinner, llama `POST /api/v1/users/me/verify-email`
3. Mensaje inline: "Revisa tu bandeja · El enlace expira en 24 horas."
4. Usuario abre enlace en el mismo o diferente browser → backend marca como verificado
5. Al hacer focus en la pestaña (`visibilitychange`), se refresca el perfil via `GET /api/v1/users/me`
6. Si ya verificado: pill "Verificado ✓" y campo bloqueado

**Botón "Guardar":** llama `PUT /api/v1/users/me`, toast de confirmación.

---

### 9.11 Premiación (`/grupos/:groupId/premiacion`)

Solo accesible cuando el torneo tiene status `FINISHED`.

**Hero (fondo `q-fg`, pantalla completa top):**
- Eyebrow: nombre del torneo en `q-accent`
- Headline: "¡Se acabó! Felicidades [nombre ganador]"
- Sub: "Pozo de Bs X · N jugadores · M partidos pronosticados"

**Podio (3 columnas):**
```
     [Pos 1 — centro, más alto]
[Pos 2]                   [Pos 3]
Avatar · Nombre · pts · % premio
```

**Card "Tu resultado":**
- Tu posición · Premio estimado (Bs X)
- Tus puntos (número grande `q-accent`)
- N exactos · N aciertos · "−X pts del campeón"

**Sección Comodines (si habilitados):**
- Lista 5 filas: tipo · tu elección · resultado oficial · pts obtenidos (verde/gris)

**Tabla completa** (colapsable "Ver ranking completo"):
- Todos los participantes con posición, nombre, puntos y premio

**Botones:**
- Ghost: "Ver historial" → `/historial`
- Accent: "Reclamar premio" → modal con información del organizador (nombre, teléfono, email de contacto)

---

## 10. Stores (`@ngrx/signals`)

### `AuthStore`
```typescript
export const AuthStore = signalStore(
  { providedIn: 'root' },
  withState({
    user: null as User | null,
    token: localStorage.getItem('tecnoa_auth_token'),
    loading: false,
    error: null as string | null,
  }),
  withMethods((store, authService = inject(AuthService)) => ({
    login: rxMethod<string>(/* idToken */),
    logout: () => { /* limpiar token, redirigir */ },
    refreshProfile: rxMethod<void>(),
  })),
  withComputed((store) => ({
    isAuthenticated: computed(() => !!store.token()),
    isProfileComplete: computed(() => store.user()?.contactEmailVerified ?? false),
  }))
);
```

### `TournamentsStore`
- Lista paginada de torneos con filtros
- Caché de 1 hora (timestamp + invalidación manual)

### `GroupsStore`
- Mis grupos (creados + participando)
- Grupo actualmente seleccionado
- Leaderboard con polling 60s

### `NotificationsStore`
- Cola de toasts/snackbars
- Método `push(notification: Toast)` consumido globalmente

---

## 11. Servicios HTTP

Todos los servicios extienden una clase base `BaseApiService` con manejo de errores centralizado.

```typescript
// tournament.service.ts
@Injectable({ providedIn: 'root' })
export class TournamentService {
  getTournaments(params: TournamentFilterParams): Observable<Page<TournamentDto>>
  getTournamentById(id: string): Observable<TournamentDto>
  getTournamentMatches(id: string, filters?: MatchFilters): Observable<MatchDto[]>
}

// group.service.ts
@Injectable({ providedIn: 'root' })
export class GroupService {
  getMyGroups(): Observable<BettingGroupDto[]>
  getGroupById(id: string): Observable<BettingGroupDetailDto>
  createGroup(req: CreateGroupRequest): Observable<BettingGroupDto>
  updateGroup(id: string, req: UpdateGroupRequest): Observable<BettingGroupDto>
  deleteGroup(id: string): Observable<void>
  joinGroup(req: JoinGroupRequest): Observable<void>
  getLeaderboard(groupId: string): Observable<LeaderboardDto>
  getInviteCode(groupId: string): Observable<InviteCodeDto>
}

// prediction.service.ts
@Injectable({ providedIn: 'root' })
export class PredictionService {
  getMyPredictions(groupId: string): Observable<PredictionDto[]>
  submitPrediction(groupId: string, req: PredictionRequest): Observable<PredictionDto>
  getMatchPredictions(groupId: string, matchId: string): Observable<PredictionDto[]>
}

// wildcard.service.ts
@Injectable({ providedIn: 'root' })
export class WildcardService {
  getWildcards(groupId: string): Observable<WildcardDto[]>
  updateWildcards(groupId: string, req: WildcardsRequest): Observable<WildcardDto[]>
}

// user.service.ts
@Injectable({ providedIn: 'root' })
export class UserService {
  getProfile(): Observable<UserDto>
  updateProfile(req: UpdateProfileRequest): Observable<UserDto>
  sendVerificationEmail(): Observable<void>
  getStats(): Observable<UserStatsDto>
  registerFcmToken(token: string): Observable<void>
}
```

---

## 12. Notificaciones Push (FCM Web)

```typescript
// notification.service.ts
@Injectable({ providedIn: 'root' })
export class FcmService {
  async requestPermission(): Promise<boolean>
  async getToken(): Promise<string | null>   // VAPID key
  listenToMessages(): void  // foreground messages → toast
}
```

**Service Worker:** `firebase-messaging-sw.js` registrado en `ngsw-config.json`.

**Al iniciar sesión:** si el browser soporta notificaciones y el usuario las acepta, se registra el token con `POST /api/v1/auth/fcm-token`.

**Al recibir notificación en foreground:** mostrar toast con ícono y acción de navegación.

**Tipos manejados:**

| Tipo | Acción al tocar |
|---|---|
| `PREDICTION_REMINDER` | Navega a `/grupos/:groupId/pronosticar/:matchId` |
| `MATCH_RESULT` | Navega a `/grupos/:groupId/puntajes` |
| `GROUP_INVITE` | Navega a `/grupos/:groupId/participantes` |
| `TOURNAMENT_START` | Navega a `/grupos/:groupId/pronosticos` |

---

## 13. Caché client-side

| Dato | Estrategia | TTL |
|---|---|---|
| Lista de torneos | `TournamentsStore` en memoria | 1 hora |
| Equipos | `localStorage` serializado | 24 horas |
| Mis grupos | `GroupsStore` en memoria | Refrescado en foco de pestaña |
| Leaderboard | Polling cada 60s mientras tab activa | — |
| Borradores de pronósticos | `localStorage` por `groupId_matchId` | Hasta ser enviados o partido locked |
| Perfil de usuario | `AuthStore` en memoria | Refrescado en `visibilitychange` |

---

## 14. Manejo de errores y conectividad

- **Sin conexión:** banner superior "Sin conexión · Mostrando datos guardados" vía `navigator.onLine` + evento `offline`
- **Borradores offline:** pronósticos guardados en `localStorage`, cola de envío al recuperar conexión (`navigator.onLine` + evento `online`)
- **Timeouts:** 15s en `HttpClient` (`timeout(15_000)` de RxJS)
- **Retry:** 2 intentos con backoff para métodos GET
- **Error `401`:** `ErrorInterceptor` → logout + redirect `/login`
- **Error `409` deadline:** toast rojo + estado `LOCKED` en `PredictComponent`
- **Error `403` profile incomplete:** redirect `/perfil/editar` con query param `?reason=profile_incomplete`

---

## 15. Responsividad

| Breakpoint | Diseño |
|---|---|
| `< 640px` (mobile) | Bottom nav, 1 columna, stacks verticales |
| `640–1023px` (tablet) | Bottom nav, 2 columnas en grids |
| `≥ 1024px` (desktop) | Sidebar fijo 240px, 3 columnas en grids, tabla leaderboard horizontal |

Puntos de quiebre definidos en Tailwind (`sm`, `lg`) y usados consistentemente en los templates.

---

## 16. Accesibilidad

- Roles ARIA en componentes interactivos (dialogs, tabs, steppers)
- `aria-live="polite"` en el área de toasts
- Contraste mínimo AA en todos los estados de color
- Navegación por teclado completa (tab, enter, escape en modales)
- `CountdownComponent`: anuncia "tiempo expirado" a lectores de pantalla con `aria-atomic`
- Focus trap en modales y drawers (Angular CDK `FocusTrap`)

---

## 17. Seguridad web

- JWT almacenado en `localStorage` (no cookies para evitar CSRF en SPA pura); se puede migrar a `httpOnly cookie` si se añade un BFF.
- No se loguea el JWT ni datos sensibles en la consola.
- Content Security Policy configurada en el servidor de hosting.
- `HttpOnly` flags sugeridos para producción si se migra a cookie-based auth.
- Certificate pinning no aplica en web; se usa HSTS en el servidor.
- `X-Content-Type-Options`, `X-Frame-Options` configurados en el servidor.
- Inputs de texto sanitizados (Angular lo hace por defecto; no usar `innerHTML` sin `DomSanitizer`).

---

## 18. Testing

### Estrategia

| Capa | Tipo | Herramienta |
|---|---|---|
| Stores / Servicios | Unit tests | Jest + `TestBed` |
| Componentes | Unit tests | Jest + Angular Testing Library |
| Interceptores | Unit tests | `HttpClientTestingModule` |
| Flujos críticos | Integration | Playwright (E2E) |
| API mock | Contract tests | MSW (Mock Service Worker) |

### Casos críticos a cubrir

- `PredictComponent`: envío antes del deadline (éxito) vs. después (estado `LOCKED`)
- `CountdownComponent`: transición a `LOCKED` en cero exacto
- `AuthInterceptor`: inyección de token en headers
- `ErrorInterceptor`: redirección en `401`
- `WildcardsComponent`: bloqueo cuando torneo `IN_PROGRESS`
- `CreateGroupComponent`: guard redirige si perfil incompleto
- `LeaderboardComponent`: polling activo cuando tab visible, detenido cuando oculta

---

## 19. Build y despliegue

### `Dockerfile` (producción)
```dockerfile
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build -- --configuration production

FROM nginx:1.27-alpine
COPY --from=build /app/dist/tecnoa-web/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

### `nginx.conf`
```nginx
server {
  listen 80;
  root /usr/share/nginx/html;
  index index.html;

  # SPA fallback
  location / {
    try_files $uri $uri/ /index.html;
  }

  # Cache de assets
  location ~* \.(js|css|png|svg|woff2)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
  }

  # Security headers
  add_header X-Frame-Options "DENY";
  add_header X-Content-Type-Options "nosniff";
  add_header Referrer-Policy "strict-origin-when-cross-origin";
}
```

### Variables de entorno en build (`.env`)
```
NG_APP_API_URL=https://api.tecnoa.app/api/v1
NG_APP_GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
NG_APP_FIREBASE_API_KEY=...
NG_APP_FIREBASE_PROJECT_ID=tecnoa-prod
NG_APP_FIREBASE_SENDER_ID=...
NG_APP_FIREBASE_APP_ID=...
NG_APP_FIREBASE_VAPID_KEY=...
```

---

## 20. Estructura final de directorios

```
tecnoa-web/
├── src/
│   ├── app/
│   │   ├── core/
│   │   │   ├── auth/
│   │   │   ├── http/
│   │   │   ├── stores/
│   │   │   └── services/
│   │   ├── shared/
│   │   │   ├── components/
│   │   │   ├── pipes/
│   │   │   └── directives/
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   ├── explore/
│   │   │   ├── my-groups/
│   │   │   ├── group-detail/
│   │   │   ├── predict/
│   │   │   ├── wildcards/
│   │   │   ├── history/
│   │   │   ├── profile/
│   │   │   └── awards/
│   │   ├── layout/
│   │   │   ├── shell/
│   │   │   ├── sidebar/
│   │   │   └── topbar/
│   │   ├── app.component.ts
│   │   ├── app.routes.ts
│   │   └── app.config.ts
│   ├── assets/
│   │   └── fonts/
│   ├── environments/
│   │   ├── environment.ts
│   │   └── environment.prod.ts
│   ├── styles.css              ← @tailwind directives + CSS vars globales
│   └── index.html
├── firebase-messaging-sw.js
├── tailwind.config.ts
├── angular.json
├── tsconfig.json
└── Dockerfile
```
