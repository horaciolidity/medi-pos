import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkCompanySubscription } from '@/lib/subscription';
import { TurnoStatus } from '@/types/enums';

export async function GET(req: NextRequest, { params }: { params: { branchId: string } }) {
  try {
    const branchId = params.branchId;

    const branch = await prisma.branch.findUnique({
      where: { id: branchId },
      include: { company: true },
    });

    if (!branch) {
      return NextResponse.json({ error: 'Sucursal no encontrada' }, { status: 404 });
    }

    // Verificar si la empresa posee Plan Pro activo para usar el turnero en pantalla
    const subInfo = await checkCompanySubscription(branch.companyId);
    if (!subInfo.isProTurneroEnabled) {
      return NextResponse.json(
        { error: 'La pantalla pública de llamados requiere una suscripción activa con el Plan Pro.' },
        { status: 403 }
      );
    }

    const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);

    // Obtener turnos LLAMADOS o EN ATENCIÓN (para mostrar en pantalla)
    const activeTurnos = await prisma.queueTurno.findMany({
      where: {
        branchId,
        status: { in: [TurnoStatus.CALLED, TurnoStatus.IN_ATTENTION] },
        createdAt: { gte: fourHoursAgo },
      },
      select: {
        id: true,
        ticketNumber: true,
        status: true,
        calledAt: true,
        box: { select: { name: true, code: true } },
      },
      orderBy: { calledAt: 'desc' },
      take: 6,
    });

    // Turnos en ESPERA (para mostrar próximos en cola)
    const waitingTurnos = await prisma.queueTurno.findMany({
      where: {
        branchId,
        status: TurnoStatus.WAITING,
        createdAt: { gte: fourHoursAgo },
      },
      select: {
        id: true,
        ticketNumber: true,
        prefix: true,
        number: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
      take: 5,
    });

    const waitingCount = waitingTurnos.length;

    // Sanitized output: SOLO NÚMERO DE TICKET Y BOX (NUNCA DATOS PACIENTE NI DIAGNÓSTICO)
    const sanitizedTurnos = activeTurnos.map((t) => ({
      id: t.id,
      ticketNumber: t.ticketNumber,
      boxName: t.box?.name || t.box?.code || 'Consultorio',
      calledAt: t.calledAt,
      status: t.status,
    }));

    // Próximos en cola (sin datos personales)
    const waitingQueue = waitingTurnos.map((t) => ({
      id: t.id,
      ticketNumber: t.ticketNumber,
    }));

    return NextResponse.json({
      success: true,
      clinicName: branch.company.name,
      branchName: branch.name,
      lastCalled: sanitizedTurnos[0] || null,
      recentTurnos: sanitizedTurnos,
      waitingCount,
      waitingQueue,  // próximos en fila
    });
  } catch (error) {
    console.error('Error en /api/turnos/public/[branchId]:', error);
    return NextResponse.json({ error: 'Error al consultar pantalla pública' }, { status: 500 });
  }
}
