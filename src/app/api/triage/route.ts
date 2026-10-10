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

    const triages = await prisma.triage.findMany({
      where: { companyId: session.companyId },
      include: {
        patient: { select: { firstName: true, lastName: true, documentNumber: true } },
        author: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return NextResponse.json({ success: true, triages });
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener triage' }, { status: 500 });
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

    const { patientId, priorityLevel, chiefComplaint, systolicBP, diastolicBP, heartRate, temperature, oxygenSaturation, notes } = await req.json();

    if (!patientId || !chiefComplaint) {
      return NextResponse.json({ error: 'Paciente y motivo de consulta obligatorios' }, { status: 400 });
    }

    const triage = await prisma.triage.create({
      data: {
        companyId: session.companyId,
        patientId,
        authorId: session.userId,
        priorityLevel: priorityLevel || 'GREEN',
        chiefComplaint,
        systolicBP,
        diastolicBP,
        heartRate,
        temperature,
        oxygenSaturation,
        notes,
      },
      include: {
        patient: { select: { firstName: true, lastName: true, documentNumber: true } },
      },
    });

    await logAuditAction({
      companyId: session.companyId,
      userId: session.userId,
      userEmail: session.email,
      action: 'CREATE_TRIAGE',
      module: 'TRIAGE',
      details: `Registro de Triage (Nivel: ${triage.priorityLevel}) para paciente ${triage.patient.firstName} ${triage.patient.lastName}`,
    });

    return NextResponse.json({ success: true, triage });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error al registrar triage' }, { status: 500 });
  }
}
