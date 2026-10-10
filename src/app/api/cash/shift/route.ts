import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { checkCompanySubscription } from '@/lib/subscription';
import { logAuditAction } from '@/lib/audit';
import { CashShiftStatus } from '@/types/enums';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || !session.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const currentShift = await prisma.cashShift.findFirst({
      where: {
        companyId: session.companyId,
        status: CashShiftStatus.OPEN,
      },
      include: {
        operator: { select: { firstName: true, lastName: true, email: true } },
        cashMovements: {
          orderBy: { createdAt: 'desc' },
          include: { operator: { select: { firstName: true, lastName: true } } },
        },
      },
      orderBy: { openedAt: 'desc' },
    });

    const historicalShifts = await prisma.cashShift.findMany({
      where: {
        companyId: session.companyId,
        status: CashShiftStatus.CLOSED,
      },
      include: {
        operator: { select: { firstName: true, lastName: true } },
      },
      orderBy: { closedAt: 'desc' },
      take: 10,
    });

    return NextResponse.json({ success: true, currentShift, historicalShifts });
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener turno de caja' }, { status: 500 });
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

    const { action, initialFund, actualFinalFund, closingNotes } = await req.json();

    const branchId = session.branchId || (await prisma.branch.findFirst({ where: { companyId: session.companyId } }))?.id;
    if (!branchId) {
      return NextResponse.json({ error: 'Sucursal requerida para operar la caja' }, { status: 400 });
    }

    if (action === 'OPEN') {
      // Verificar si ya existe una caja abierta
      const existingOpen = await prisma.cashShift.findFirst({
        where: { companyId: session.companyId, status: CashShiftStatus.OPEN },
      });

      if (existingOpen) {
        return NextResponse.json({ error: 'Ya existe una caja abierta en esta clínica' }, { status: 400 });
      }

      const fund = Number(initialFund) || 0;
      const shift = await prisma.cashShift.create({
        data: {
          companyId: session.companyId,
          branchId,
          operatorId: session.userId,
          initialFund: fund,
          expectedFinalFund: fund,
          status: CashShiftStatus.OPEN,
        },
      });

      await logAuditAction({
        companyId: session.companyId,
        userId: session.userId,
        userEmail: session.email,
        action: 'OPEN_CASH_SHIFT',
        module: 'CAJA',
        details: `Apertura de caja con fondo inicial de ARS $${fund}`,
      });

      return NextResponse.json({ success: true, shift });
    } else if (action === 'CLOSE') {
      const openShift = await prisma.cashShift.findFirst({
        where: { companyId: session.companyId, status: CashShiftStatus.OPEN },
        include: { cashMovements: true },
      });

      if (!openShift) {
        return NextResponse.json({ error: 'No hay ninguna caja abierta para cerrar' }, { status: 400 });
      }

      let totalIncome = 0;
      let totalExpense = 0;

      openShift.cashMovements.forEach((m) => {
        if (!m.isVoided) {
          if (m.type === 'INCOME') totalIncome += m.amount;
          else if (m.type === 'EXPENSE' || m.type === 'REFUND') totalExpense += m.amount;
        }
      });

      const expectedFinal = openShift.initialFund + totalIncome - totalExpense;
      const countedFinal = Number(actualFinalFund) || 0;
      const diff = countedFinal - expectedFinal;

      const closedShift = await prisma.cashShift.update({
        where: { id: openShift.id },
        data: {
          status: CashShiftStatus.CLOSED,
          closedAt: new Date(),
          expectedFinalFund: expectedFinal,
          actualFinalFund: countedFinal,
          differenceAmount: diff,
          closingNotes,
        },
      });

      await logAuditAction({
        companyId: session.companyId,
        userId: session.userId,
        userEmail: session.email,
        action: 'CLOSE_CASH_SHIFT',
        module: 'CAJA',
        details: `Cierre de caja. Esperado: ARS $${expectedFinal}, Contado: ARS $${countedFinal}, Diferencia: ARS $${diff}`,
      });

      return NextResponse.json({ success: true, shift: closedShift, summary: { expectedFinal, countedFinal, diff } });
    }

    return NextResponse.json({ error: 'Acción de caja no reconocida' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error al procesar turno de caja' }, { status: 500 });
  }
}
