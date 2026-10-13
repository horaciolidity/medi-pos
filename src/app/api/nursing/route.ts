import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { checkCompanySubscription } from '@/lib/subscription';
import { logAuditAction } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || !session.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const records = await prisma.nursingRecord.findMany({
      where: { companyId: session.companyId },
      include: {
        patient: { select: { firstName: true, lastName: true, documentNumber: true } },
        author: { select: { firstName: true, lastName: true, matricula: true, role: true, area: true, shiftHours: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return NextResponse.json({ success: true, records });
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener registros de enfermería' }, { status: 500 });
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

    const { patientId, vitalSigns, proceduresDone, medicationAdministered, notes, authorId } = await req.json();

    if (!patientId) {
      return NextResponse.json({ error: 'ID del paciente requerido' }, { status: 400 });
    }

    const assignedAuthorId = authorId || session.userId;

    const record = await prisma.nursingRecord.create({
      data: {
        companyId: session.companyId,
        patientId,
        authorId: assignedAuthorId,
        vitalSignsJson: vitalSigns ? JSON.stringify(vitalSigns) : null,
        proceduresDone,
        medicationAdministered,
        notes,
      },
      include: {
        patient: { select: { firstName: true, lastName: true, documentNumber: true } },
        author: { select: { firstName: true, lastName: true, matricula: true, role: true, area: true, shiftHours: true } },
      },
    });

    await logAuditAction({
      companyId: session.companyId,
      userId: session.userId,
      userEmail: session.email,
      action: 'CREATE_NURSING_RECORD',
      module: 'NURSING',
      details: `Registro de enfermería para paciente ${record.patient.firstName} ${record.patient.lastName}`,
    });

    return NextResponse.json({ success: true, record });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error al registrar enfermería' }, { status: 500 });
  }
}
