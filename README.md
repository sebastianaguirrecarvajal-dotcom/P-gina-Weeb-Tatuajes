# Estudio de Tatuaje — Plataforma Web (V1)

Plataforma web profesional para un tatuador: página pública, portafolio,
sistema de reservas con disponibilidad real, agenda privada, gestión de
clientes, blog, preguntas frecuentes, testimonios y captación por **WhatsApp
Business**.

Esta es la **primera versión** (punto de partida), construida para evolucionar.

---

## Stack técnico

- **Next.js 14 (App Router) + TypeScript** — SSR para SEO y rutas de API.
- **Prisma + PostgreSQL** — base de datos relacional lista para producción.
- **Tailwind CSS** — estética oscura tipo estudio (tinta + dorado).
- **jose + bcryptjs** — autenticación segura del tatuador (JWT en cookie
  httpOnly).

## Requisitos

- Node.js 18+
- Una base de datos **PostgreSQL** (local o gestionada: Supabase, Neon, RDS…).

## Puesta en marcha (desarrollo)

```bash
cp .env.example .env     # define DATABASE_URL/DIRECT_URL, AUTH_SECRET y admin
npm install

# Opción A (recomendada): aplicar las migraciones versionadas
npm run db:migrate:deploy   # crea el esquema ejecutando prisma/migrations
npm run db:seed             # datos de demostración

# Opción B: reconstruir desde cero (reset + migraciones + seed)
npm run db:reset

npm run dev              # http://localhost:3000
```

> PostgreSQL local rápido (ejemplo):
> ```bash
> createdb estudio
> # DATABASE_URL="postgresql://<usuario>@localhost:5432/estudio?schema=public"
> ```

**Acceso del tatuador** (del seed): `/admin/login`
- Email: `tatuador@estudio.demo`
- Contraseña: `estudio123`

> Cambia estas credenciales y `AUTH_SECRET` en producción.

## Estructura del proyecto

```
prisma/
  schema.prisma        Modelo de datos (comentado)
  seed.ts              Datos iniciales de demostración
src/
  lib/                 Lógica de dominio (sin UI)
    db.ts              Singleton de Prisma
    auth.ts            Sesión del tatuador (JWT)
    client-session.ts  Sesión del cliente SIN contraseña (cookie)
    availability.ts    Motor de disponibilidad (ÚNICA fuente de verdad)
    whatsapp.ts        Enlaces de WhatsApp con mensaje contextual
    notifications.ts   Arquitectura de notificaciones (preparada)
    studio.ts, favorites.ts, validation.ts, constants.ts, format.ts, json.ts
  components/          UI compartida (pública y admin)
  app/
    (public)/          Sitio público + experiencia de cliente
      page.tsx         Inicio
      perfil, catalogo, catalogo/[id], blog, blog/[slug], faq, contacto
      reservar, reservar/gracias
      cliente          Ingreso por nombre + espacio del cliente
    admin/
      login            Acceso del tatuador
      (panel)/         Panel protegido: resumen, agenda, reservas,
                       clientes, catalogo, blog, faq, testimonios, configuracion
    api/               availability, bookings, favorites, testimonials, upload
  middleware.ts        Protege /admin/* (defensa en profundidad)
prisma/migrations/     Migraciones SQL versionadas de PostgreSQL
```

## Base de datos y migraciones

El proyecto usa **PostgreSQL** mediante Prisma, con **migraciones versionadas**
en `prisma/migrations/` (no dependemos de `db push` en producción).

Flujo recomendado:

| Entorno | Comando | Qué hace |
| --- | --- | --- |
| Desarrollo | `npm run db:migrate` | Crea/aplica una nueva migración (`prisma migrate dev`) tras cambiar `schema.prisma`. |
| Desarrollo | `npm run db:reset` | Recrea la BD, aplica todas las migraciones y ejecuta el seed. |
| Producción | `npm run db:migrate:deploy` | Aplica las migraciones pendientes (`prisma migrate deploy`), sin tocar datos. |

Migraciones incluidas:
1. `init` — todas las entidades y relaciones.
2. `booking_overlap_exclusion` — activa `btree_gist` y añade una **constraint
   `EXCLUDE`** que impide, a nivel de base de datos, dos reservas/citas
   solapadas en el mismo estudio mientras su estado ocupe la agenda (los
   estados `CANCELADA`/`RECHAZADA` quedan excluidos, liberando el hueco).

### Integridad de reservas (concurrencia)

Tres capas garantizan que dos clientes no obtengan el mismo horario:
1. Comprobación de disponibilidad en servidor (`availability.ts`).
2. Re-verificación de solapamiento **dentro de una transacción** antes de
   insertar (`/api/bookings`).
3. **Backstop de PostgreSQL**: la constraint `EXCLUDE` rechaza la inserción
   solapada aunque dos peticiones lleguen en el mismo instante; la app la
   traduce a un `409` limpio (`isOverlapConstraintError`).

## Despliegue (Vercel + PostgreSQL)

El proyecto está preparado para Vercel con una base PostgreSQL gestionada:

1. **Base de datos**: crea una instancia (Supabase, Neon, RDS…).
2. **Variables de entorno** en Vercel: `DATABASE_URL` (idealmente la cadena
   *pooled* / PgBouncer para serverless), `DIRECT_URL` (conexión directa para
   migraciones), `AUTH_SECRET`, `NEXT_PUBLIC_SITE_URL`.
3. **Migraciones**: ejecuta `npm run db:migrate:deploy` en el paso de build o
   como comando posterior (o manualmente con la `DIRECT_URL`). El seed es
   opcional y solo para entornos de demostración.
4. `npm run build` genera el cliente de Prisma (`prisma generate`) y compila
   Next.js. API routes, server actions y la sesión (cookie httpOnly) funcionan
   en el runtime de Node de Vercel sin cambios.

> **Pooling**: en serverless conviene limitar conexiones. Usa la URL *pooled*
> del proveedor en `DATABASE_URL` (p. ej. puerto `6543` + `?pgbouncer=true`) y
> reserva `DIRECT_URL` para las migraciones.

## Decisiones técnicas importantes

1. **Cliente sin contraseña.** El cliente sólo introduce su nombre completo.
   Se abre una sesión con token opaco en cookie httpOnly (`ClientSession`).
   El acceso a reservas/favoritos va **por la sesión, nunca por el nombre**,
   de modo que conocer el nombre de otra persona no expone sus datos.
   Preparado para añadir verificación (p. ej. OTP por WhatsApp) sin rehacer
   el modelo.
2. **Única fuente de verdad para la disponibilidad.** `availability.ts` calcula
   los huecos a partir de horario laboral + descansos + bloqueos + reservas.
   El calendario del cliente y la agenda del tatuador leen de aquí. Al crear
   una reserva se **revalida en el servidor** para impedir dobles reservas.
3. **Reserva = cita.** Una solicitud del cliente y una cita del tatuador son el
   mismo registro `Booking` en distintos estados, lo que mantiene la agenda
   consistente.
4. **Separación de permisos.** Público / Cliente / Tatuador. Las notas internas
   nunca se exponen al cliente; todas las mutaciones del panel pasan por
   `requireArtist()`.
5. **Catálogo con 2 categorías** (Blanco y Negro / Color) mediante tabla
   `Category`, preparada para añadir más sin cambiar la interfaz.
6. **Un solo tatuador** (singleton `Studio`), sin sobreingeniería multi-estudio,
   pero con claves foráneas listas para crecer.

## Estado de funcionalidades

### ✅ Implementado (funciona completamente)
- Sitio público: inicio, perfil, catálogo + detalle, blog + detalle, FAQ, contacto.
- Filtro de catálogo por Blanco y Negro / Color.
- WhatsApp contextual (home, catálogo, trabajo, publicación, FAQ, reserva) con
  mensaje preconfigurado y botón flotante en móvil.
- Experiencia de cliente sin contraseña (ingreso por nombre, espacio personal).
- Reservas con disponibilidad en tiempo real y prevención de dobles reservas.
- Favoritos del cliente.
- Panel del tatuador: resumen, agenda (día/semana/mes), gestión de reservas con
  flujo de estados, clientes + notas internas, CRUD de catálogo, blog, FAQ,
  testimonios con moderación, configuración (perfil, contacto, redes, horarios).
- Bloqueos de agenda y creación/reprogramación manual de citas.
- Autenticación del tatuador (JWT httpOnly) + middleware de protección.
- Subida de imágenes a `/public/uploads` (almacenamiento local).
- SEO: metadatos, Open Graph, `sitemap.xml`, `robots.txt`, datos estructurados
  (FAQ y obras). Diseño responsive / mobile-first y accesible.

### 🧩 Preparado (arquitectura lista, falta conectar un servicio)
- **Notificaciones**: se persisten en BD (canal INAPP, visibles en el panel).
  El envío por email/WhatsApp/SMS se conecta implementando `dispatch()` en
  `lib/notifications.ts` con un proveedor real.
- **Almacenamiento de imágenes**: hoy local en `/public/uploads`. **Esto NO es
  apto para producción en Vercel** (sistema de archivos efímero/de solo
  lectura): las imágenes subidas se perderían. Debe sustituirse por un
  almacenamiento persistente (**Supabase Storage, Cloudinary, S3 o Cloudflare
  R2**) reescribiendo únicamente `src/app/api/upload/route.ts`; el resto de la
  app trabaja con la URL devuelta, así que el catálogo no necesita cambios.
- **Identidad del cliente**: sesión por cookie lista para añadir verificación.
- **Zona horaria**: `Studio.timezone` guardado; el cálculo usa hora local del
  servidor (ver limitaciones).

### 🔭 Futuro (recomendaciones para próximas fases)
- WhatsApp Cloud API para confirmaciones y recordatorios automáticos.
- Señal/pago de reserva online.
- Recordatorios programados (cron) y panel de notificaciones del cliente.
- Multi-tatuador, roles de staff.
- Editor de contenido enriquecido para el blog.

## Limitaciones conocidas
- La disponibilidad se calcula con la hora local del servidor (no con zona
  horaria explícita por cliente).
- Las imágenes subidas se guardan en disco local: **pendiente** migrar a
  almacenamiento persistente antes de desplegar (ver "Preparado").
- Un único tramo horario por día (más un descanso); turnos partidos múltiples
  quedan para una iteración futura.

---

Esta versión es el punto de partida. A partir de aquí se irá mejorando mediante
instrucciones sucesivas: cambiar secciones, añadir o quitar funciones, ajustar
el calendario, el diseño o el flujo de reservas.
