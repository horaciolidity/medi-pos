import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logAuditAction } from '@/lib/audit';
import {
  buildAppointmentMessage,
  getWhatsAppDirectUrl,
  sendWhatsAppNotification,
  WhatsAppConfig
} from '@/lib/whatsapp';

// GET /api/turnos-online — Información pública para la reserva online del paciente
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get('slug');
    const companyId = searchParams.get('companyId');
    const dateStr = searchParams.get('date'); // YYYY-MM-DD
    const doctorId = searchParams.get('doctorId');

    // Buscar empresa
    let company: any = null;
    if (slug) {
      company = await (prisma as any).company.findUnique({
        where: { slug },
      });
    } else if (companyId) {
      company = await (prisma as any).company.findUnique({
        where: { id: companyId },
      });
    } else {
      // Fallback: primera empresa activa
      company = await (prisma as any).company.findFirst();
    }

    if (!company) {
      return NextResponse.json({ error: 'Clínica o centro médico no encontrado' }, { status: 404 });
    }

    if (company.onlineBookingEnabled === false) {
      return NextResponse.json({
        error: 'Las reservas de turnos online se encuentran momentáneamente deshabilitadas para este centro.',
        companyName: company.name,
      }, { status: 403 });
    }

    // Parsear servicios configurados
    let services = [];
    if (company.onlineServicesJson) {
      try {
        services = JSON.parse(company.onlineServicesJson);
      } catch (e) {
        services = [];
      }
    }

    // Si aún no configuró servicios, proveer servicios predeterminados
    if (!services || services.length === 0) {
      services = [
        {
          id: 'serv-1',
          name: 'Consulta Médica General',
          specialty: 'Clínica Médica',
          requiresCoseguro: false,
          coseguroAmount: 0,
          durationMins: 20,
          description: 'Control de rutina, chequeo clínico y prescripción de recetas',
        },
        {
          id: 'serv-2',
          name: 'Pediatría',
          specialty: 'Pediatría',
          requiresCoseguro: true,
          coseguroAmount: 2500,
          durationMins: 30,
          description: 'Atención integral para bebés, niños y adolescentes',
        },
        {
          id: 'serv-3',
          name: 'Cardiología & ECG',
          specialty: 'Cardiología',
          requiresCoseguro: true,
          coseguroAmount: 4000,
          durationMins: 30,
          description: 'Evaluación cardiológica y apto físico',
        },
      ];
    }

    // Médicos disponibles
    const doctors = await (prisma as any).user.findMany({
      where: {
        companyId: company.id,
        isActive: true,
        OR: [
          { role: 'MEDICO' },
          { area: 'MEDICO' },
        ],
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        specialty: true,
        matricula: true,
        shiftHours: true,
        workDays: true,
      },
      orderBy: { lastName: 'asc' },
    });

    // Si se pasa una fecha, obtener los turnos ya ocupados de ese día para evitar superposiciones
    let occupiedSlots: string[] = [];
    if (dateStr) {
      const start = new Date(`${dateStr}T00:00:00.000Z`);
      const end = new Date(`${dateStr}T23:59:59.999Z`);

      const appointments = await (prisma as any).appointment.findMany({
        where: {
          companyId: company.id,
          date: { gte: start, lte: end },
          status: { notIn: ['CANCELLED'] },
          ...(doctorId ? { doctorId } : {}),
        },
        select: {
          date: true,
          durationMins: true,
          doctorId: true,
        },
      });

      occupiedSlots = appointments.map((a: any) => {
        const d = new Date(a.date);
        const hours = String(d.getUTCHours()).padStart(2, '0');
        const mins = String(d.getUTCMinutes()).padStart(2, '0');
        return `${hours}:${mins}`;
      });
    }

    return NextResponse.json({
      success: true,
      company: {
        id: company.id,
        slug: company.slug || company.id,
        name: company.name,
        logoUrl: company.logoUrl,
        address: company.address,
        phone: company.phone,
        email: company.email,
      },
      services,
      doctors,
      occupiedSlots,
    });
  } catch (error: any) {
    console.error('Error en GET /api/turnos-online:', error);
    return NextResponse.json({ error: error.message || 'Error interno' }, { status: 500 });
  }
}

// POST /api/turnos-online — Registro público de turno por el paciente
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      companyId,
      slug,
      firstName,
      lastName,
      dni,
      phone,
      email,
      medicalInsuranceName,
      affiliateNumber,
      serviceName,
      specialty,
      doctorId,
      date, // ISO string o "YYYY-MM-DDTHH:mm:ss"
      durationMins,
      reason,
      hasCoseguro,
      coseguroAmount,
    } = body;

    if (!firstName || !lastName) {
      return NextResponse.json({ error: 'Nombre y apellido del paciente son obligatorios' }, { status: 400 });
    }
    if (!phone) {
      return NextResponse.json({ error: 'El número de teléfono/WhatsApp es obligatorio para notificar el turno' }, { status: 400 });
    }
    if (!date) {
      return NextResponse.json({ error: 'La fecha y horario del turno son obligatorios' }, { status: 400 });
    }

    // Resolver empresa
    let company: any = null;
    if (companyId) {
      company = await (prisma as any).company.findUnique({ where: { id: companyId } });
    } else if (slug) {
      company = await (prisma as any).company.findUnique({ where: { slug } });
    } else {
      company = await (prisma as any).company.findFirst();
    }

    if (!company) {
      return NextResponse.json({ error: 'Empresa no encontrada' }, { status: 404 });
    }

    const appointmentDate = new Date(date);

    // Verificar si el horario ya está ocupado con ese médico
    if (doctorId) {
      const existing = await (prisma as any).appointment.findFirst({
        where: {
          companyId: company.id,
          doctorId,
          date: appointmentDate,
          status: { notIn: ['CANCELLED'] },
        },
      });
      if (existing) {
        return NextResponse.json({ error: 'Ese horario ya fue reservado recientemente. Por favor elija otro turno.' }, { status: 409 });
      }
    }

    // 1. Buscar o dar de alta al paciente en la base de datos de la clínica para trazabilidad completa
    let patient: any = null;
    if (dni && dni.trim()) {
      const cleanDni = dni.trim().replace(/\D/g, '');
      patient = await (prisma as any).patient.findFirst({
        where: {
          companyId: company.id,
          documentNumber: cleanDni,
        },
      });

      if (!patient) {
        // Crear paciente automáticamente
        patient = await (prisma as any).patient.create({
          data: {
            companyId: company.id,
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            documentType: 'DNI',
            documentNumber: cleanDni,
            phone: phone.trim(),
            email: email ? email.trim() : null,
            medicalInsuranceName: medicalInsuranceName ? medicalInsuranceName.trim() : null,
            affiliateNumber: affiliateNumber ? affiliateNumber.trim() : null,
            notes: 'Paciente dado de alta automáticamente vía Reserva Online de Turnos.',
          },
        });
      }
    }

    // 2. Crear la Cita / Turno
    const appointment = await (prisma as any).appointment.create({
      data: {
        companyId: company.id,
        patientId: patient ? patient.id : null,
        doctorId: doctorId || null,
        date: appointmentDate,
        durationMins: durationMins ? Number(durationMins) : 20,
        serviceName: serviceName ? serviceName.trim() : null,
        specialty: specialty || serviceName || 'Clínica General',
        reason: reason ? reason.trim() : `Reserva online: ${serviceName || 'Consulta'}`,
        status: 'CONFIRMED',
        hasCoseguro: Boolean(hasCoseguro),
        coseguroAmount: coseguroAmount ? Number(coseguroAmount) : 0,
        isOnlineBooking: true,
        guestName: `${firstName.trim()} ${lastName.trim()}`,
        guestPhone: phone.trim(),
        guestEmail: email ? email.trim() : null,
        guestDni: dni ? dni.trim() : null,
        guestInsurance: medicalInsuranceName ? medicalInsuranceName.trim() : null,
      },
      include: {
        doctor: { select: { firstName: true, lastName: true, specialty: true } },
      },
    });

    // 3. Preparar Notificación por WhatsApp
    let whatsappConfig: WhatsAppConfig = {};
    if (company.whatsappConfigJson) {
      try {
        whatsappConfig = JSON.parse(company.whatsappConfigJson);
      } catch (e) {}
    }

    const dateFormatted = appointmentDate.toLocaleDateString('es-AR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const timeFormatted = appointmentDate.toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const doctorName = appointment.doctor
      ? `${appointment.doctor.firstName} ${appointment.doctor.lastName}`
      : null;

    const whatsappMessage = buildAppointmentMessage(
      {
        clinicName: company.name,
        clinicAddress: company.address,
        clinicPhone: company.phone,
        patientName: `${firstName.trim()} ${lastName.trim()}`,
        patientPhone: phone.trim(),
        serviceName: serviceName || 'Atención Médica',
        doctorName,
        dateStr: dateFormatted,
        timeStr: timeFormatted,
        hasCoseguro: Boolean(hasCoseguro),
        coseguroAmount: coseguroAmount ? Number(coseguroAmount) : 0,
      },
      whatsappConfig.customTemplate
    );

    const directWhatsAppUrl = getWhatsAppDirectUrl(phone.trim(), whatsappMessage);

    // Si tiene webhook / api activa, intentar enviar en background
    if (whatsappConfig.autoSendEnabled) {
      sendWhatsAppNotification(phone.trim(), whatsappMessage, whatsappConfig).catch(console.error);
    }

    // Auditoría
    await logAuditAction({
      companyId: company.id,
      userEmail: email || phone,
      action: 'ONLINE_BOOKING',
      module: 'RESERVAS',
      details: `Turno reservado online por paciente ${firstName} ${lastName} (${phone}) para ${serviceName || 'Consulta'} el ${dateFormatted} a las ${timeFormatted}`,
    });

    return NextResponse.json({
      success: true,
      message: '¡Tu turno ha sido reservado con éxito!',
      appointment: {
        id: appointment.id,
        date: appointment.date,
        doctor: appointment.doctor,
        serviceName: appointment.serviceName,
        hasCoseguro: appointment.hasCoseguro,
        coseguroAmount: appointment.coseguroAmount,
      },
      whatsappUrl: directWhatsAppUrl,
      whatsappMessage,
    });
  } catch (error: any) {
    console.error('Error en POST /api/turnos-online:', error);
    return NextResponse.json({ error: error.message || 'Error al procesar reserva de turno' }, { status: 500 });
  }
}
