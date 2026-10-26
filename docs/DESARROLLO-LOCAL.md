# Desarrollo local — "PAG WEB ALEX"

Guía para trabajar el proyecto en tu propio equipo, hacer cambios y verlos en el
navegador antes de publicarlos. Todo lo que hagas aquí es **local**: no afecta a
producción hasta que hagas `git push`.

> Resumen del ciclo: **editar → ver en localhost → commit → push → Vercel
> despliega solo.**

---

## 0) Requisitos (instalar una vez)

- **Node.js 20+** → https://nodejs.org (instala la versión LTS).
- **Git** → https://git-scm.com
- **Una base de datos PostgreSQL local.** Dos opciones:
  - **A. Docker** (recomendada, 1 comando) → https://www.docker.com/products/docker-desktop
  - **B. PostgreSQL nativo** → Postgres.app (Mac) o el instalador de postgresql.org (Windows).

> Importante: en local usamos una base de datos **propia y separada** de la de
> producción (Supabase). Así puedes probar, romper y reiniciar sin tocar los
> datos reales del estudio.

---

## 1) Clonar el proyecto en el Escritorio, carpeta "PAG WEB ALEX"

**macOS / Linux (Terminal):**
```bash
cd ~/Desktop
git clone -b claude/tattoo-artist-platform-7n0wi5 \
  https://github.com/sebastianaguirrecarvajal-dotcom/P-gina-Weeb-Tatuajes.git "PAG WEB ALEX"
cd "PAG WEB ALEX"
```

**Windows (PowerShell):**
```powershell
cd $HOME\Desktop
git clone -b claude/tattoo-artist-platform-7n0wi5 `
  https://github.com/sebastianaguirrecarvajal-dotcom/P-gina-Weeb-Tatuajes.git "PAG WEB ALEX"
cd "PAG WEB ALEX"
```

---

## 2) Base de datos local

**Opción A — Docker (1 comando):**
```bash
docker run --name pagweb-db -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=estudio -p 5432:5432 -d postgres:16
```
Esto deja PostgreSQL escuchando en `localhost:5432` (usuario `postgres`,
contraseña `postgres`, base `estudio`). Para apagarlo/encenderlo luego:
`docker stop pagweb-db` / `docker start pagweb-db`.

**Opción B — PostgreSQL nativo:** crea una base llamada `estudio`
(`createdb estudio`) y anota usuario/contraseña/puerto.

---

## 3) Variables de entorno (.env)

Copia el ejemplo y ajusta:
```bash
cp .env.example .env
```
Deja el `.env` así para desarrollo local (con Docker de la opción A):
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/estudio?schema=public"
DIRECT_URL="postgresql://postgres:postgres@localhost:5432/estudio?schema=public"
AUTH_SECRET="pon-aqui-cualquier-texto-largo-para-desarrollo"
ADMIN_EMAIL="tatuador@estudio.demo"
ADMIN_PASSWORD="estudio123"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
STORAGE_DRIVER="local"
```
> `STORAGE_DRIVER="local"` guarda las imágenes que subas en `public/uploads`
> (perfecto para desarrollo). No necesitas S3 en local.
> El `.env` nunca se sube a Git.

---

## 4) Instalar, preparar la base de datos y arrancar

```bash
npm install                 # instala dependencias
npm run db:migrate:deploy   # crea las tablas en tu base local
npm run db:seed             # datos de demostración (estudio, admin, catálogo…)
npm run dev                 # arranca en http://localhost:3000
```

Abre **http://localhost:3000**. Panel del tatuador en
**http://localhost:3000/admin/login** con el email/clave del `.env`.

> Atajo: en Mac/Linux puedes ejecutar `bash setup-local.sh` (pasos 3-4
> automatizados).

---

## 5) Hacer cambios y verlos

- Edita archivos (ver "¿Dónde está cada cosa?" abajo). Al guardar, el navegador
  se recarga solo.
- Mucho del contenido real del estudio (nombre, bio, WhatsApp, horarios, trabajos,
  publicaciones, FAQ) se edita **sin tocar código**, desde el panel
  `/admin` → **Configuración / Catálogo / Publicaciones / Preguntas**.
- Cambios de diseño/estructura sí son en código.

## 6) Publicar los cambios

```bash
git add -A
git commit -m "describe tu cambio"
git push
```
Vercel detecta el push a la rama de producción y **despliega automáticamente**.

> Las migraciones de base de datos de producción se aplican solas en el deploy
> (`vercel-build`). Si cambiaste `prisma/schema.prisma`, crea la migración en
> local con `npm run db:migrate` antes de hacer push.

---

## ¿Dónde está cada cosa?

```
src/app/(public)/      Páginas públicas (inicio, perfil, catálogo, blog, faq, contacto, reservar)
src/app/(public)/cliente/   Área del cliente (entrar por nombre)
src/app/admin/(panel)/      Panel del tatuador
src/components/        Componentes reutilizables (Navbar, Footer, tarjetas, botón WhatsApp…)
src/app/globals.css    Estilos base
tailwind.config.ts     Colores, tipografías y tema visual
src/lib/               Lógica (disponibilidad, auth, whatsapp, almacenamiento…)
prisma/schema.prisma   Modelo de datos
prisma/seed.ts         Datos de demostración
```

## Comandos útiles

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo con recarga en caliente |
| `npm run db:studio` | Explorador visual de la base de datos (Prisma Studio) |
| `npm run db:reset` | Reinicia la base local y recarga los datos demo |
| `npm run build` | Compila como en producción (para comprobar que todo va bien) |

## Problemas frecuentes

- **"Can't reach database server"**: la base no está encendida. Docker:
  `docker start pagweb-db`.
- **"No existe un Studio"**: falta el seed → `npm run db:seed`.
- **El puerto 3000 está ocupado**: cierra la otra instancia o usa
  `npm run dev -- -p 3001`.
