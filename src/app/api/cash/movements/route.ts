import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { checkCompanySubscription } from '@/lib/subscription';
import { logAuditAction } from '@/lib/audit';
import { CashShiftStatus, PaymentMethod } from '@/types/enums';

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

    const body = await req.json();
    const { action, type, amount, paymentMethod, concept, movementId, voidReason } = body;

    // Anulación auditada de movimiento
    if (action === 'VOID') {
      if (!movementId || !voidReason) {
        return NextResponse.json({ error: 'ID de movimiento y motivo de anulación requeridos' }, { status: 400 });
      }

      const movement = await prisma.cashMovement.findFirst({
        where: { id: movementId, companyId: session.companyId },
      });

      if (!movement) {
        return NextResponse.json({ error: 'Movimiento no encontrado' }, { status: 404 });
      }

      const voided = await prisma.cashMovement.update({
        where: { id: movementId },
        data: {
          isVoided: true,
          voidReason,
        },
      });

      await logAuditAction({
        companyId: session.companyId,
        userId: session.userId,
        userEmail: session.email,
        action: 'VOID_CASH_MOVEMENT',
        module: 'CAJA',
        details: `Anulación de movimiento de caja #${movementId} por ARS $${movement.amount}. Motivo: ${voidReason}`,
      });

      return NextResponse.json({ success: true, movement: voided });
    }

    // Registrar nuevo movimiento en caja abierta
    const openShift = await prisma.cashShift.findFirst({
      where: { companyId: session.companyId, status: CashShiftStatus.OPEN },
    });

    if (!openShift) {
      return NextResponse.json(
        { error: 'Debe abrir un turno de caja antes de registrar cobros o movimientos' },
        { status: 400 }
      );
    }

    if (!amount || amount <= 0 || !concept) {
      return NextResponse.json({ error: 'Importe y concepto válidos son requeridos' }, { status: 400 });
    }

    const movement = await prisma.cashMovement.create({
      data: {
        cashShiftId: openShift.id,
        companyId: session.companyId,
        operatorId: session.userId,
        type: type || 'INCOME',
        amount: Number(amount),
        paymentMethod: paymentMethod || PaymentMethod.CASH,
        concept,
      },
    });

    await logAuditAction({
      companyId: session.companyId,
      userId: session.userId,
      userEmail: session.email,
      action: 'CREATE_CASH_MOVEMENT',
      module: 'CAJA',
      details: `Cobro/Movimiento de caja: ARS $${amount} (${paymentMethod}) - Concepto: ${concept}`,
    });

    return NextResponse.json({ success: true, movement });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error al procesar movimiento de caja' }, { status: 500 });
  }
}
