import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { checkCompanySubscription } from '@/lib/subscription';
import { logAuditAction } from '@/lib/audit';
import { TurnoStatus } from '@/types/enums';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || !session.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get('branchId') || session.branchId;

    const turnos = await prisma.queueTurno.findMany({
      where: {
        companyId: session.companyId,
        ...(branchId ? { branchId } : {}),
      },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true, documentNumber: true } },
        box: { select: { id: true, name: true, code: true } },
        sector: { select: { id: true, name: true, code: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const boxes = await prisma.box.findMany({
      where: { branch: { companyId: session.companyId } },
    });

    return NextResponse.json({ success: true, turnos, boxes });
  } catch (error) {
    return NextResponse.json({ error: 'Error al consultar turnos' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || !session.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const subInfo = await checkCompanySubscription(session.companyId);
    if (!subInfo.canWrite) {
      return NextResponse.json(
        { error: subInfo.message || 'Operación bloqueada: Suscripción vencida (Modo Solo Lectura).' },
        { status: 403 }
      );
    }

    const { branchId, sectorId, patientId, prefix = 'A' } = await req.json();

    const targetBranchId = branchId || session.branchId;
    if (!targetBranchId) {
      return NextResponse.json({ error: 'Sucursal requerida' }, { status: 400 });
    }

    // Obtener número consecutivo para hoy y prefijo
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const count = await prisma.queueTurno.count({
      where: {
        companyId: session.companyId,
        branchId: targetBranchId,
        prefix,
        createdAt: { gte: startOfDay },
      },
    });

    const nextNumber = count + 1;
    const ticketNumber = `${prefix}${String(nextNumber).padStart(3, '0')}`;

    const turno = await prisma.queueTurno.create({
      data: {
        companyId: session.companyId,
        branchId: targetBranchId,
        sectorId: sectorId || null,
        patientId: patientId || null,
        prefix,
        number: nextNumber,
        ticketNumber,
        status: TurnoStatus.WAITING,
      },
      include: {
        patient: { select: { firstName: true, lastName: true } },
        sector: { select: { name: true } },
      },
    });

    await logAuditAction({
      companyId: session.companyId,
      userId: session.userId,
      userEmail: session.email,
      action: 'GENERATE_TURNO_TICKET',
      module: 'RECEPCION',
      details: `Ticket generado: ${ticketNumber}`,
    });

    return NextResponse.json({
      success: true,
      turno,
      ticketPrintData: {
        ticketNumber,
        date: new Date().toLocaleString(),
        sector: turno.sector?.name || 'Recepción',
        instructions: 'Por favor espere a ser llamado en pantalla.',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error al generar ticket de turno' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || !session.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const subInfo = await checkCompanySubscription(session.companyId);
    if (!subInfo.canWrite) {
      return NextResponse.json(
        { error: subInfo.message || 'Operación bloqueada: Suscripción vencida (Modo Solo Lectura).' },
        { status: 403 }
      );
    }

    const { turnoId, boxId, status } = await req.json();

    if (!turnoId || !status) {
      return NextResponse.json({ error: 'ID de turno y nuevo estado requeridos' }, { status: 400 });
    }

    // Verificar si para llamar a box se requiere Plan Pro
    if (status === TurnoStatus.CALLED && !subInfo.isProTurneroEnabled) {
      return NextResponse.json(
        {
          error:
            'El llamado a boxes y pantalla en tiempo real es una función exclusiva del Plan Pro. Actualice su plan para habilitar el turnero avanzado.',
        },
        { status: 403 }
      );
    }

    const turno = await prisma.queueTurno.findFirst({
      where: { id: turnoId, companyId: session.companyId },
    });

    if (!turno) {
      return NextResponse.json({ error: 'Turno no encontrado' }, { status: 404 });
    }

    const updatedTurno = await prisma.queueTurno.update({
      where: { id: turnoId },
      data: {
        status,
        boxId: boxId || turno.boxId,
        calledAt: status === TurnoStatus.CALLED ? new Date() : turno.calledAt,
        completedAt: status === TurnoStatus.COMPLETED ? new Date() : turno.completedAt,
      },
      include: {
        box: true,
        patient: { select: { firstName: true, lastName: true } },
      },
    });

    return NextResponse.json({ success: true, turno: updatedTurno });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error al actualizar estado del turno' }, { status: 500 });
  }
}
