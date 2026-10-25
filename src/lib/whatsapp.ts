// Generación de enlaces a WhatsApp Business con mensaje inicial preconfigurado.
//
// El objetivo es que el tatuador sepa que el contacto llegó desde la web y con
// qué intención, sin que el visitante tenga que escribirlo. El mensaje cambia
// según el punto de origen (home, catálogo, trabajo, publicación, reservas).

export type WhatsAppContext =
  | "home"
  | "contacto"
  | "catalogo"
  | "trabajo"
  | "publicacion"
  | "faq"
  | "reserva";

const MESSAGES: Record<WhatsAppContext, string> = {
  home: "Hola, llegué desde la página web y quiero consultar sobre un tatuaje.",
  contacto: "Hola, llegué desde la página web y quiero ponerme en contacto contigo.",
  catalogo: "Hola, llegué desde tu catálogo y quiero consultar sobre uno de tus trabajos.",
  trabajo:
    "Hola, vi uno de tus trabajos en la página y quiero consultar sobre un tatuaje similar.",
  publicacion:
    "Hola, llegué desde una publicación de tu página y quiero hacerte una consulta.",
  faq: "Hola, tengo una duda que no encontré en las preguntas frecuentes de tu página.",
  reserva: "Hola, quiero consultar sobre una reserva para un tatuaje.",
};

/// Construye el enlace https://wa.me/<numero>?text=<mensaje>.
/// `detail` permite añadir el nombre/título del elemento que se estaba viendo.
export function buildWhatsAppUrl(
  number: string,
  context: WhatsAppContext,
  detail?: string
): string | null {
  const digits = (number || "").replace(/\D/g, "");
  if (!digits) return null;

  let text = MESSAGES[context] ?? MESSAGES.home;
  if (detail && detail.trim()) {
    text += ` (Referencia: ${detail.trim()})`;
  }

  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

/// Mapea un origen de WhatsApp al valor de `contactSource` del modelo Booking.
export function contextToContactSource(context: WhatsAppContext): string {
  switch (context) {
    case "catalogo":
      return "CATALOGO";
    case "trabajo":
      return "TRABAJO";
    case "publicacion":
      return "PUBLICACION";
    case "reserva":
      return "RESERVA";
    default:
      return "WEB";
  }
}
