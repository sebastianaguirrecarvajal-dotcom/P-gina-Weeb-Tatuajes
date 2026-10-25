# Estudio de Tatuaje — Plataforma Web (V1)

Plataforma web profesional para un tatuador: página pública, portafolio,
sistema de reservas con disponibilidad real, agenda privada, gestión de
clientes, blog, preguntas frecuentes, testimonios y captación por **WhatsApp
Business**.

Esta es la **primera versión** (punto de partida), construida para evolucionar.

---

## Stack técnico

- **Next.js 14 (App Router) + TypeScript** — SSR para SEO y rutas de API.
- **Prisma + SQLite** — base de datos cero-configuración en desarrollo
  (sustituible por Postgres/MySQL en producción cambiando `datasource`).
- **Tailwind CSS** — estética oscura tipo estudio (tinta + dorado).
- **jose + bcryptjs** — autenticación segura del tatuador (JWT en cookie
  httpOnly).

## Puesta en marcha

```bash
cp .env.example .env     # ajusta AUTH_SECRET y credenciales de admin
npm install
npm run db:push          # crea el esquema en SQLite
npm run db:seed          # datos de demostración
npm run dev              # http://localhost:3000
```

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
```

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
- **Almacenamiento de imágenes**: hoy local; sustituir `api/upload` por
  S3/R2/Cloudinary sin tocar el resto de la app.
- **Identidad del cliente**: sesión por cookie lista para añadir verificación.
- **Zona horaria**: `Studio.timezone` guardado; el cálculo usa hora local del
  servidor (ver limitaciones).

### 🔭 Futuro (recomendaciones para próximas fases)
- WhatsApp Cloud API para confirmaciones y recordatorios automáticos.
- Señal/pago de reserva online.
- Recordatorios programados (cron) y panel de notificaciones del cliente.
- Multi-tatuador, roles de staff.
- Editor de contenido enriquecido para el blog.

## Limitaciones conocidas (V1)
- La disponibilidad se calcula con la hora local del servidor (no con zona
  horaria explícita por cliente).
- SQLite es ideal para desarrollo; para producción conviene Postgres.
- Las imágenes subidas se guardan en disco local (efímero en algunos hostings).
- Un único tramo horario por día (más un descanso); turnos partidos múltiples
  quedan para una iteración futura.

---

Esta versión es el punto de partida. A partir de aquí se irá mejorando mediante
instrucciones sucesivas: cambiar secciones, añadir o quitar funciones, ajustar
el calendario, el diseño o el flujo de reservas.
