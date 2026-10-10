import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { checkCompanySubscription } from '@/lib/subscription';
import { logAuditAction } from '@/lib/audit';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
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

    const { ehrRecordId, amendmentReason, content } = await req.json();

    if (!ehrRecordId || !amendmentReason || !content) {
      return NextResponse.json({ error: 'ID del registro, motivo de la enmienda y contenido requeridos' }, { status: 400 });
    }

    const record = await prisma.eHRRecord.findFirst({
      where: { id: ehrRecordId, companyId: session.companyId },
    });

    if (!record) {
      return NextResponse.json({ error: 'Registro clínico no encontrado' }, { status: 404 });
    }

    const amendment = await prisma.eHRAmendment.create({
      data: {
        ehrRecordId,
        companyId: session.companyId,
        authorId: session.userId,
        amendmentReason,
        content,
      },
      include: {
        author: { select: { firstName: true, lastName: true, role: true } },
      },
    });

    await logAuditAction({
      companyId: session.companyId,
      userId: session.userId,
      userEmail: session.email,
      action: 'AMEND_EHR_RECORD',
      module: 'EHR',
      details: `Enmienda clínica registrada en evolución ${ehrRecordId}. Motivo: ${amendmentReason}`,
    });

    return NextResponse.json({ success: true, amendment });
  } catch (error: any) {
    console.error('Error en POST /api/patients/[id]/ehr/amend:', error);
    return NextResponse.json({ error: error.message || 'Error al agregar enmienda clínica' }, { status: 500 });
  }
}
