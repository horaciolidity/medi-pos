import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logAuditAction } from '@/lib/audit';

// GET /api/appointments — lista citas, filtrando por doctorId, date, status
export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || !session.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const doctorId   = searchParams.get('doctorId');
    const dateStr    = searchParams.get('date'); // YYYY-MM-DD
    const status     = searchParams.get('status');
    const onlineOnly = searchParams.get('onlineOnly') === 'true';

    let dateFilter: any = {};
    if (dateStr) {
      const start = new Date(`${dateStr}T00:00:00.000Z`);
      const end   = new Date(`${dateStr}T23:59:59.999Z`);
      dateFilter = { date: { gte: start, lte: end } };
    }

    const appointments = await (prisma as any).appointment.findMany({
      where: {
        companyId: session.companyId,
        ...(doctorId   ? { doctorId }              : {}),
        ...(status     ? { status }                : {}),
        ...(onlineOnly ? { isOnlineBooking: true } : {}),
        ...dateFilter,
      },
      include: {
        patient:   { select: { id: true, firstName: true, lastName: true, documentNumber: true, phone: true } },
        doctor:    { select: { id: true, firstName: true, lastName: true, specialty: true, shiftHours: true, matricula: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { date: 'asc' },
      take: 200,
    });

    return NextResponse.json({ success: true, appointments });
  } catch (error: any) {
    console.error('GET /api/appointments:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/appointments — crear nueva reserva
export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || !session.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const {
      patientId, doctorId,
      date, durationMins, specialty, reason, notes,
      guestName, guestPhone, guestEmail,
    } = body;

    if (!date) {
      return NextResponse.json({ error: 'La fecha y hora son obligatorias' }, { status: 400 });
    }
    if (!patientId && !guestName) {
      return NextResponse.json({ error: 'Debe indicar un paciente registrado o ingresar nombre del invitado' }, { status: 400 });
    }

    const appointment = await (prisma as any).appointment.create({
      data: {
        companyId:    session.companyId,
        patientId:    patientId || null,
        doctorId:     doctorId || null,
        date:         new Date(date),
        durationMins: durationMins || 20,
        specialty:    specialty || null,
        reason:       reason || null,
        notes:        notes || null,
        guestName:    guestName || null,
        guestPhone:   guestPhone || null,
        guestEmail:   guestEmail || null,
        createdById:  session.userId,
        status:       'PENDING',
      },
      include: {
        patient: { select: { firstName: true, lastName: true } },
        doctor:  { select: { firstName: true, lastName: true } },
      },
    });

    const patientLabel = appointment.patient
      ? `${appointment.patient.firstName} ${appointment.patient.lastName}`
      : guestName || 'Invitado';
    const doctorLabel = appointment.doctor
      ? `Dr. ${appointment.doctor.firstName} ${appointment.doctor.lastName}`
      : 'Sin médico asignado';

    await logAuditAction({
      companyId: session.companyId,
      userId:    session.userId,
      userEmail: session.email,
      action:    'CREATE_APPOINTMENT',
      module:    'RESERVAS',
      details:   `Nueva reserva: ${patientLabel} con ${doctorLabel} el ${new Date(date).toLocaleString('es-AR')}`,
    });

    return NextResponse.json({ success: true, appointment });
  } catch (error: any) {
    console.error('POST /api/appointments:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/appointments — actualizar estado o datos de una cita
export async function PATCH(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || !session.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { id, status, notes, doctorId, date, durationMins, reason } = body;

    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });

    const existing = await (prisma as any).appointment.findFirst({
      where: { id, companyId: session.companyId },
    });
    if (!existing) return NextResponse.json({ error: 'Cita no encontrada' }, { status: 404 });

    const updated = await (prisma as any).appointment.update({
      where: { id },
      data: {
        ...(status       !== undefined && { status }),
        ...(notes        !== undefined && { notes }),
        ...(doctorId     !== undefined && { doctorId }),
        ...(date         !== undefined && { date: new Date(date) }),
        ...(durationMins !== undefined && { durationMins }),
        ...(reason       !== undefined && { reason }),
      },
      include: {
        patient: { select: { firstName: true, lastName: true } },
        doctor:  { select: { firstName: true, lastName: true } },
      },
    });

    await logAuditAction({
      companyId: session.companyId,
      userId:    session.userId,
      userEmail: session.email,
      action:    'UPDATE_APPOINTMENT',
      module:    'RESERVAS',
      details:   `Cita actualizada: estado=${status || existing.status}`,
    });

    return NextResponse.json({ success: true, appointment: updated });
  } catch (error: any) {
    console.error('PATCH /api/appointments:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/appointments — eliminar reserva
export async function DELETE(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || !session.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });

    const existing = await (prisma as any).appointment.findFirst({
      where: { id, companyId: session.companyId },
    });
    if (!existing) return NextResponse.json({ error: 'Cita no encontrada' }, { status: 404 });

    await (prisma as any).appointment.delete({
      where: { id },
    });

    await logAuditAction({
      companyId: session.companyId,
      userId:    session.userId,
      userEmail: session.email,
      action:    'DELETE_APPOINTMENT',
      module:    'RESERVAS',
      details:   `Cita eliminada (ID: ${id})`,
    });

    return NextResponse.json({ success: true, message: 'Cita eliminada correctamente' });
  } catch (error: any) {
    console.error('DELETE /api/appointments:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
