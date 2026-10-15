import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logAuditAction } from '@/lib/audit';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSessionUser(req);
    if (!session || !session.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const patientId = params.id;
    const body = await req.json();

    // Verificar que pertenece a la empresa
    const existing = await prisma.patient.findFirst({
      where: { id: patientId, companyId: session.companyId },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Paciente no encontrado' }, { status: 404 });
    }

    const {
      firstName, lastName, gender, birthDate,
      phone, email, address,
      emergencyContactName, emergencyContactPhone,
      medicalInsuranceName, affiliateNumber,
      bloodType, notes,
    } = body;

    const updated = await prisma.patient.update({
      where: { id: patientId },
      data: {
        ...(firstName !== undefined && { firstName: firstName.trim() }),
        ...(lastName !== undefined && { lastName: lastName.trim() }),
        ...(gender !== undefined && { gender }),
        ...(birthDate !== undefined && { birthDate }),
        ...(phone !== undefined && { phone }),
        ...(email !== undefined && { email }),
        ...(address !== undefined && { address }),
        ...(emergencyContactName !== undefined && { emergencyContactName }),
        ...(emergencyContactPhone !== undefined && { emergencyContactPhone }),
        ...(medicalInsuranceName !== undefined && { medicalInsuranceName }),
        ...(affiliateNumber !== undefined && { affiliateNumber }),
        ...(bloodType !== undefined && { bloodType }),
        ...(notes !== undefined && { notes }),
      },
    });

    await logAuditAction({
      companyId: session.companyId,
      userId: session.userId,
      userEmail: session.email,
      action: 'UPDATE_PATIENT',
      module: 'PATIENTS',
      details: `Datos actualizados del paciente: ${updated.firstName} ${updated.lastName} (DNI ${updated.documentNumber})`,
    });

    return NextResponse.json({ success: true, patient: updated });
  } catch (error: any) {
    console.error('Error en PATCH /api/patients/[id]:', error);
    return NextResponse.json({ error: error.message || 'Error al actualizar paciente' }, { status: 500 });
  }
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSessionUser(req);
    if (!session || !session.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const patient = await prisma.patient.findFirst({
      where: { id: params.id, companyId: session.companyId },
    });
    if (!patient) return NextResponse.json({ error: 'Paciente no encontrado' }, { status: 404 });
    return NextResponse.json({ success: true, patient });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
