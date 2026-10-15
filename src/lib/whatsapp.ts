/**
 * Utilidades de Notificación por WhatsApp para Clinic POS
 */

export interface WhatsAppAppointmentData {
  clinicName: string;
  clinicAddress?: string | null;
  clinicPhone?: string | null;
  patientName: string;
  patientPhone: string;
  serviceName?: string | null;
  doctorName?: string | null;
  dateStr: string; // ej: "16/10/2026"
  timeStr: string; // ej: "10:30 hs"
  hasCoseguro: boolean;
  coseguroAmount?: number | null;
}

export interface WhatsAppConfig {
  phoneNumber?: string;
  apiProvider?: 'DIRECT_LINK' | 'CALLMEBOT' | 'CUSTOM_WEBHOOK';
  apiKey?: string;
  webhookUrl?: string;
  customTemplate?: string;
  autoSendEnabled?: boolean;
}

/**
 * Genera el texto del mensaje formal de confirmación de turno
 */
export function buildAppointmentMessage(data: WhatsAppAppointmentData, customTemplate?: string): string {
  if (customTemplate && customTemplate.trim()) {
    return customTemplate
      .replace('{clinica}', data.clinicName)
      .replace('{paciente}', data.patientName)
      .replace('{fecha}', data.dateStr)
      .replace('{hora}', data.timeStr)
      .replace('{servicio}', data.serviceName || 'Consulta médica')
      .replace('{profesional}', data.doctorName ? `Dr/a. ${data.doctorName}` : 'Profesional asignado')
      .replace('{coseguro}', data.hasCoseguro ? `ARS $${data.coseguroAmount || 0}` : 'Sin coseguro')
      .replace('{direccion}', data.clinicAddress || '');
  }

  const coseguroText = data.hasCoseguro && (data.coseguroAmount || 0) > 0
    ? `💵 *Coseguro / Arancel a abonar en recepción:* ARS $${(data.coseguroAmount || 0).toLocaleString('es-AR')}`
    : `✅ *Coseguro:* Sin cargo adicional / Incluido por cobertura`;

  const addressText = data.clinicAddress
    ? `📍 *Dirección de atención:* ${data.clinicAddress}`
    : '';

  return (
    `🏥 *CONFIRMACIÓN DE TURNO — ${data.clinicName.toUpperCase()}*\n\n` +
    `Hola *${data.patientName}*, tu turno médico ha sido reservado exitosamente:\n\n` +
    `📅 *Fecha:* ${data.dateStr}\n` +
    `⏰ *Horario:* ${data.timeStr}\n` +
    `🩺 *Servicio / Especialidad:* ${data.serviceName || 'Atención Médica'}\n` +
    (data.doctorName ? `👨‍⚕️ *Profesional:* Dr/a. ${data.doctorName}\n` : '') +
    `${coseguroText}\n` +
    (addressText ? `${addressText}\n` : '') +
    `\n⚠️ _Por favor presentarse con 10 minutos de anticipación y traer DNI y carnet de cobertura física o digital._\n` +
    `\n¡Te esperamos en ${data.clinicName}!`
  );
}

/**
 * Genera un enlace universal de WhatsApp para abrir chat con mensaje pre-cargado
 */
export function getWhatsAppDirectUrl(phone: string, message: string): string {
  // Limpiar caracteres no numéricos
  let cleanPhone = phone.replace(/\D/g, '');
  
  // Si es número argentino y empieza con 0 o 15, adaptarlo a formato internacional (549...)
  if (cleanPhone.startsWith('0')) {
    cleanPhone = '549' + cleanPhone.substring(1);
  } else if (!cleanPhone.startsWith('54') && cleanPhone.length === 10) {
    cleanPhone = '549' + cleanPhone;
  }

  const encoded = encodeURIComponent(message);
  return `https://wa.me/${cleanPhone}?text=${encoded}`;
}

/**
 * Envío programático de mensaje por API externa si está configurada (CallMeBot o Webhook)
 */
export async function sendWhatsAppNotification(
  phone: string,
  message: string,
  config: WhatsAppConfig
): Promise<{ success: boolean; error?: string; url?: string }> {
  try {
    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) cleanPhone = '549' + cleanPhone.substring(1);
    else if (!cleanPhone.startsWith('54') && cleanPhone.length === 10) cleanPhone = '549' + cleanPhone;

    const directUrl = getWhatsAppDirectUrl(phone, message);

    if (config.apiProvider === 'CALLMEBOT' && config.apiKey) {
      // CallMeBot Free API
      const url = `https://api.callmebot.com/whatsapp.php?phone=${cleanPhone}&text=${encodeURIComponent(message)}&apikey=${config.apiKey}`;
      const res = await fetch(url, { method: 'GET' });
      if (!res.ok) {
        return { success: false, error: 'Fallo al enviar mediante CallMeBot', url: directUrl };
      }
      return { success: true, url: directUrl };
    }

    if (config.apiProvider === 'CUSTOM_WEBHOOK' && config.webhookUrl) {
      // Webhook a servicio propio o Evolution API / Baileys
      const res = await fetch(config.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone, message }),
      });
      if (!res.ok) {
        return { success: false, error: 'Webhook respondió con error', url: directUrl };
      }
      return { success: true, url: directUrl };
    }

    // Default: Proveer enlace directo
    return { success: true, url: directUrl };
  } catch (err: any) {
    console.error('Error enviando notificación WhatsApp:', err);
    return { success: false, error: err.message, url: getWhatsAppDirectUrl(phone, message) };
  }
}
