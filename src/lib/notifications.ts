import { prisma } from "./db";

// Arquitectura de notificaciones (PREPARADA).
//
// En V1 las notificaciones se PERSISTEN (canal INAPP) y se muestran en el panel
// del tatuador. El envío real por email/WhatsApp/SMS se conecta más adelante
// implementando `dispatch()` con un proveedor; el resto del código ya crea los
// eventos correctos, así que integrarlo no requiere tocar la lógica de negocio.

export type NotificationType =
  | "NEW_BOOKING"
  | "BOOKING_ACCEPTED"
  | "BOOKING_REJECTED"
  | "BOOKING_CANCELLED"
  | "BOOKING_RESCHEDULED"
  | "REMINDER"
  | "NEW_POST"
  | "NEWS";

export async function createNotification(input: {
  type: NotificationType;
  audience: "ARTIST" | "CLIENT";
  title: string;
  body?: string;
  channel?: "INAPP" | "EMAIL" | "WHATSAPP" | "SMS";
  refType?: string;
  refId?: string;
}) {
  const notif = await prisma.notification.create({
    data: {
      type: input.type,
      audience: input.audience,
      title: input.title,
      body: input.body ?? "",
      channel: input.channel ?? "INAPP",
      refType: input.refType,
      refId: input.refId,
      status: "PENDING",
    },
  });

  // Punto de extensión: aquí se llamaría a un proveedor real (Resend, Twilio,
  // WhatsApp Cloud API...). De momento marcamos como "SENT" el canal INAPP.
  await dispatch(notif.id).catch(() => {});

  return notif;
}

async function dispatch(notificationId: string) {
  const notif = await prisma.notification.findUnique({ where: { id: notificationId } });
  if (!notif) return;
  if (notif.channel === "INAPP") {
    await prisma.notification.update({
      where: { id: notif.id },
      data: { status: "SENT" },
    });
  }
  // TODO (FUTURO): integrar proveedores externos para EMAIL/WHATSAPP/SMS.
}
