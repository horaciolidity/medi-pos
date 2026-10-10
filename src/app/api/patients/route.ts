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

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('query')?.toLowerCase() || '';

    const patients = await prisma.patient.findMany({
      where: {
        companyId: session.companyId,
        ...(query
          ? {
              OR: [
                { firstName: { contains: query } },
                { lastName: { contains: query } },
                { documentNumber: { contains: query } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return NextResponse.json({ success: true, patients });
  } catch (error) {
    console.error('Error en GET /api/patients:', error);
    return NextResponse.json({ error: 'Error al consultar pacientes' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
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

    const body = await req.json();
    const { documentType, documentNumber, firstName, lastName, gender, birthDate, phone, email, address, emergencyContactName, emergencyContactPhone, medicalInsuranceName, affiliateNumber, bloodType, notes } = body;

    if (!documentNumber || !firstName || !lastName) {
      return NextResponse.json({ error: 'Documento, nombre y apellido son obligatorios' }, { status: 400 });
    }

    // Verificar duplicado por CUIT/Documento dentro de la misma empresa
    const existing = await prisma.patient.findUnique({
      where: {
        companyId_documentNumber: {
          companyId: session.companyId,
          documentNumber: documentNumber.trim(),
        },
      },
    });

    if (existing) {
      return NextResponse.json({ error: 'Ya existe un paciente registrado con este número de documento' }, { status: 400 });
    }

    const patient = await prisma.patient.create({
      data: {
        companyId: session.companyId,
        documentType: documentType || 'DNI',
        documentNumber: documentNumber.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        gender,
        birthDate,
        phone,
        email,
        address,
        emergencyContactName,
        emergencyContactPhone,
        medicalInsuranceName,
        affiliateNumber,
        bloodType,
        notes,
      },
    });

    await logAuditAction({
      companyId: session.companyId,
      userId: session.userId,
      userEmail: session.email,
      action: 'CREATE_PATIENT',
      module: 'PATIENTS',
      details: `Alta de paciente: ${patient.firstName} ${patient.lastName} (DNI ${patient.documentNumber})`,
    });

    return NextResponse.json({ success: true, patient });
  } catch (error: any) {
    console.error('Error en POST /api/patients:', error);
    return NextResponse.json({ error: error.message || 'Error al registrar paciente' }, { status: 500 });
  }
}
