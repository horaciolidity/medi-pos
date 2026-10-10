import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { checkCompanySubscription } from '@/lib/subscription';
import { logAuditAction } from '@/lib/audit';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSessionUser(req);
    if (!session || !session.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const patientId = params.id;

    // Verificar que el paciente pertenezca a la empresa del usuario
    const patient = await prisma.patient.findFirst({
      where: { id: patientId, companyId: session.companyId },
    });

    if (!patient) {
      return NextResponse.json({ error: 'Paciente no encontrado o no pertenece a su clínica' }, { status: 404 });
    }

    const ehrRecords = await prisma.eHRRecord.findMany({
      where: { patientId, companyId: session.companyId },
      include: {
        author: { select: { firstName: true, lastName: true, role: true, specialty: true } },
        amendments: {
          include: { author: { select: { firstName: true, lastName: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, patient, records: ehrRecords });
  } catch (error) {
    console.error('Error en GET /api/patients/[id]/ehr:', error);
    return NextResponse.json({ error: 'Error al obtener historia clínica' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSessionUser(req);
    if (!session || !session.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Regla de suscripción: Bloquear escritura en modo SOLO LECTURA
    const subInfo = await checkCompanySubscription(session.companyId);
    if (!subInfo.canWrite) {
      return NextResponse.json(
        { error: subInfo.message || 'Operación bloqueada: Suscripción vencida (Modo Solo Lectura).' },
        { status: 403 }
      );
    }

    const patientId = params.id;
    const body = await req.json();
    const { reasonForVisit, symptoms, diagnosis, vitalSigns, treatmentPlan, prescribedMedication, observations } = body;

    if (!reasonForVisit || !diagnosis) {
      return NextResponse.json({ error: 'Motivo de consulta y diagnóstico son obligatorios' }, { status: 400 });
    }

    // Verificar pertenencia del paciente
    const patient = await prisma.patient.findFirst({
      where: { id: patientId, companyId: session.companyId },
    });

    if (!patient) {
      return NextResponse.json({ error: 'Paciente no encontrado' }, { status: 404 });
    }

    const record = await prisma.eHRRecord.create({
      data: {
        companyId: session.companyId,
        patientId,
        authorId: session.userId,
        reasonForVisit,
        symptoms,
        diagnosis,
        vitalSignsJson: vitalSigns ? JSON.stringify(vitalSigns) : null,
        treatmentPlan,
        prescribedMedication,
        observations,
      },
      include: {
        author: { select: { firstName: true, lastName: true, specialty: true } },
      },
    });

    await logAuditAction({
      companyId: session.companyId,
      userId: session.userId,
      userEmail: session.email,
      action: 'ADD_EHR_RECORD',
      module: 'EHR',
      details: `Nueva evolución clínica para paciente ${patient.firstName} ${patient.lastName} (Diagnóstico: ${diagnosis})`,
    });

    return NextResponse.json({ success: true, record });
  } catch (error: any) {
    console.error('Error en POST /api/patients/[id]/ehr:', error);
    return NextResponse.json({ error: error.message || 'Error al agregar registro clínico' }, { status: 500 });
  }
}
