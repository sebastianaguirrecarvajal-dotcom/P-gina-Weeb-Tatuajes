import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Imágenes de demostración (Unsplash). Sustituibles desde el panel.
const IMG = {
  hero: "https://images.unsplash.com/photo-1562259929-b4e1fd3aef09?w=1600&q=70",
  avatar: "https://images.unsplash.com/photo-1598371839696-5c5bb00bdc28?w=600&q=70",
  bn1: "https://images.unsplash.com/photo-1611501275019-9b5cda994e8d?w=900&q=70",
  bn2: "https://images.unsplash.com/photo-1565058379802-bbe93b2f703a?w=900&q=70",
  bn3: "https://images.unsplash.com/photo-1607646924642-4a6c404e6e4c?w=900&q=70",
  color1: "https://images.unsplash.com/photo-1598371839696-5c5bb00bdc28?w=900&q=70",
  color2: "https://images.unsplash.com/photo-1542856391-010fb87dcfed?w=900&q=70",
  color3: "https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=900&q=70",
};

async function main() {
  const email = (process.env.ADMIN_EMAIL || "tatuador@estudio.demo").toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "estudio123";
  const passwordHash = await bcrypt.hash(password, 10);

  console.log("→ Limpiando datos previos...");
  await prisma.$transaction([
    prisma.favorite.deleteMany(),
    prisma.notification.deleteMany(),
    prisma.testimonial.deleteMany(),
    prisma.post.deleteMany(),
    prisma.work.deleteMany(),
    prisma.category.deleteMany(),
    prisma.booking.deleteMany(),
    prisma.timeBlock.deleteMany(),
    prisma.clientSession.deleteMany(),
    prisma.client.deleteMany(),
    prisma.workingHours.deleteMany(),
    prisma.studio.deleteMany(),
  ]);

  console.log("→ Creando estudio y tatuador...");
  const studio = await prisma.studio.create({
    data: {
      email,
      passwordHash,
      artistName: "Mara Ink",
      studioName: "Estudio Aguja Negra",
      tagline: "Tinta con intención. Cada pieza, una historia en la piel.",
      bio: "Tatuadora especializada en trabajo fino en blanco y negro y en piezas de color vibrante. Más de 8 años dando forma a ideas sobre la piel, con un enfoque en el detalle, la higiene y una experiencia cercana.",
      experience: "+8 años de experiencia · +1.500 piezas realizadas",
      specialties: JSON.stringify(["Fine line", "Blackwork", "Color ilustrativo", "Lettering"]),
      location: "Madrid, España",
      address: "Calle del Arte 12, bajo. 28012 Madrid",
      avatarUrl: IMG.avatar,
      heroImageUrl: IMG.hero,
      whatsappNumber: "34600111222",
      email_public: "hola@agujanegra.demo",
      instagram: "https://instagram.com/agujanegra.demo",
      tiktok: "https://tiktok.com/@agujanegra.demo",
      facebook: "",
      website: "",
      bookingPolicy:
        "Para reservar se requiere confirmar la cita por WhatsApp. La señal no es reembolsable pero se descuenta del total. Avisa con 48h de antelación para reprogramar.",
      slotMinutes: 30,
      timezone: "Europe/Madrid",
    },
  });

  console.log("→ Horario laboral (mar–sáb 10:00–20:00, descanso 14:00–15:30)...");
  // weekday: 0=dom ... 6=sáb. Trabaja martes(2) a sábado(6).
  const work = [2, 3, 4, 5, 6];
  for (const weekday of [0, 1, 2, 3, 4, 5, 6]) {
    const active = work.includes(weekday);
    await prisma.workingHours.create({
      data: {
        studioId: studio.id,
        weekday,
        startMin: 10 * 60,
        endMin: 20 * 60,
        breakStartMin: 14 * 60,
        breakEndMin: 15 * 60 + 30,
        active,
      },
    });
  }

  console.log("→ Categorías del catálogo (Blanco y Negro / Color)...");
  const bn = await prisma.category.create({
    data: { slug: "blanco-y-negro", name: "Blanco y Negro", order: 0 },
  });
  const color = await prisma.category.create({
    data: { slug: "color", name: "Color", order: 1 },
  });

  console.log("→ Trabajos del portafolio...");
  const works = await Promise.all([
    prisma.work.create({
      data: {
        title: "Serpiente fine line",
        description: "Pieza de línea fina en el antebrazo, trabajo a una sesión.",
        imageUrl: IMG.bn1,
        categoryId: bn.id,
        bodyZone: "Antebrazo",
        tags: JSON.stringify(["fine line", "animales"]),
        featured: true,
        order: 0,
      },
    }),
    prisma.work.create({
      data: {
        title: "Mandala geométrico",
        description: "Blackwork con sombreado puntillista.",
        imageUrl: IMG.bn2,
        categoryId: bn.id,
        bodyZone: "Brazo",
        tags: JSON.stringify(["blackwork", "geométrico"]),
        order: 1,
      },
    }),
    prisma.work.create({
      data: {
        title: "Lettering manuscrito",
        description: "Frase personalizada en caligrafía.",
        imageUrl: IMG.bn3,
        categoryId: bn.id,
        bodyZone: "Costado",
        tags: JSON.stringify(["lettering"]),
        order: 2,
      },
    }),
    prisma.work.create({
      data: {
        title: "Flores acuarela",
        description: "Ramo en estilo acuarela con colores vivos.",
        imageUrl: IMG.color1,
        categoryId: color.id,
        bodyZone: "Hombro",
        tags: JSON.stringify(["acuarela", "floral"]),
        featured: true,
        order: 0,
      },
    }),
    prisma.work.create({
      data: {
        title: "Koi tradicional",
        description: "Pez koi en color con fondo de olas.",
        imageUrl: IMG.color2,
        categoryId: color.id,
        bodyZone: "Pantorrilla",
        tags: JSON.stringify(["color", "japonés"]),
        order: 1,
      },
    }),
    prisma.work.create({
      data: {
        title: "Retrato ilustrativo",
        description: "Ilustración a color con línea marcada.",
        imageUrl: IMG.color3,
        categoryId: color.id,
        bodyZone: "Muslo",
        tags: JSON.stringify(["ilustrativo"]),
        order: 2,
      },
    }),
  ]);

  console.log("→ Publicaciones (blog)...");
  await prisma.post.create({
    data: {
      slug: "cuidados-despues-del-tatuaje",
      title: "Cuidados después del tatuaje",
      excerpt: "La cicatrización empieza el mismo día. Esto es lo que debes hacer la primera semana.",
      content:
        "El cuidado posterior es tan importante como la sesión.\n\n1. Mantén el film las primeras horas.\n2. Lava con agua tibia y jabón neutro.\n3. Hidrata con una capa fina 2-3 veces al día.\n4. Evita el sol y la piscina 2-3 semanas.\n\nSi tienes dudas, escríbeme por WhatsApp.",
      status: "PUBLISHED",
      publishedAt: new Date(),
      tags: JSON.stringify(["cuidados", "consejos"]),
    },
  });
  await prisma.post.create({
    data: {
      slug: "nuevo-trabajo-serpiente-fine-line",
      title: "Nuevo trabajo: serpiente fine line",
      excerpt: "Una de mis piezas favoritas del mes, ya en el catálogo.",
      content:
        "Comparto esta serpiente en línea fina realizada en una sola sesión. Puedes ver más detalles en el catálogo.",
      status: "PUBLISHED",
      publishedAt: new Date(),
      workId: works[0].id,
      coverUrl: IMG.bn1,
      tags: JSON.stringify(["novedades", "fine line"]),
    },
  });
  await prisma.post.create({
    data: {
      slug: "borrador-proceso-color",
      title: "Cómo preparo un diseño a color",
      excerpt: "Entre bambalinas del proceso creativo.",
      content: "Borrador en progreso...",
      status: "DRAFT",
      tags: JSON.stringify(["proceso"]),
    },
  });

  console.log("→ Preguntas frecuentes...");
  const faqs = [
    ["¿Cuánto cuesta un tatuaje?", "El precio depende del tamaño, la zona y el detalle. Escríbeme con tu idea y te doy un presupuesto."],
    ["¿Cómo debo prepararme?", "Duerme bien, come antes de la sesión, hidrátate y evita el alcohol las 24h previas."],
    ["¿Cuánto tarda en cicatrizar?", "La capa superficial cierra en 1-2 semanas; la cicatrización completa puede llevar hasta un mes."],
    ["¿Puedo llevar una referencia?", "¡Claro! Las referencias ayudan mucho. Las uso como inspiración para crear un diseño único para ti."],
    ["¿Cuánto dura una sesión?", "Entre 1 y 4 horas según la pieza. Te lo indico al presupuestar."],
    ["¿Qué métodos de pago aceptan?", "Efectivo y transferencia. La señal se abona al reservar."],
  ];
  for (let i = 0; i < faqs.length; i++) {
    await prisma.faq.create({
      data: { question: faqs[i][0], answer: faqs[i][1], order: i, published: true },
    });
  }

  console.log("→ Clientes y reservas de ejemplo...");
  const ana = await prisma.client.create({
    data: { fullName: "Ana López", phone: "34600333444", internalNotes: "Alérgica al látex. Preferir guantes de nitrilo." },
  });
  const carlos = await prisma.client.create({
    data: { fullName: "Carlos Ruiz" },
  });

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(11, 0, 0, 0);
  const tomorrowEnd = new Date(tomorrow);
  tomorrowEnd.setHours(13, 0, 0, 0);

  await prisma.booking.create({
    data: {
      studioId: studio.id,
      clientId: ana.id,
      clientName: ana.fullName,
      clientPhone: ana.phone,
      status: "CONFIRMADA",
      start: tomorrow,
      end: tomorrowEnd,
      style: "BLANCO_Y_NEGRO",
      bodyZone: "Antebrazo",
      sizeApprox: "15 cm",
      idea: "Serpiente fine line enrollada.",
      contactSource: "CATALOGO",
      internalNotes: "Confirmó señal por transferencia.",
    },
  });

  const in3 = new Date();
  in3.setDate(in3.getDate() + 3);
  in3.setHours(16, 0, 0, 0);
  const in3End = new Date(in3);
  in3End.setHours(17, 30, 0, 0);

  await prisma.booking.create({
    data: {
      studioId: studio.id,
      clientId: carlos.id,
      clientName: carlos.fullName,
      status: "SOLICITADA",
      start: in3,
      end: in3End,
      style: "COLOR",
      bodyZone: "Hombro",
      sizeApprox: "20 cm",
      idea: "Flores en acuarela.",
      notes: "Prefiero tardes.",
      contactSource: "RESERVA",
    },
  });

  console.log("→ Testimonios...");
  await prisma.testimonial.create({
    data: {
      clientId: ana.id,
      authorName: "Ana López",
      rating: 5,
      content: "Experiencia impecable, el estudio es súper limpio y el resultado superó mis expectativas.",
      status: "APPROVED",
    },
  });
  await prisma.testimonial.create({
    data: {
      authorName: "Lucía M.",
      rating: 5,
      content: "Entendió mi idea a la primera. Repetiré sin duda.",
      status: "PENDING",
    },
  });

  console.log("\n✅ Seed completado.");
  console.log(`   Acceso tatuador: ${email} / ${password}`);
  console.log("   Panel: /admin/login\n");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
