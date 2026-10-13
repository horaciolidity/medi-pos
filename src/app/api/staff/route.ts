import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser, hashPassword } from '@/lib/auth';
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
    const area = searchParams.get('area')?.toUpperCase();
    const search = searchParams.get('search')?.toLowerCase();

    const whereClause: any = {
      companyId: session.companyId,
    };

    if (area && area !== 'ALL') {
      whereClause.OR = [
        { area: area },
        { role: area },
      ];
    }

    if (search) {
      whereClause.AND = [
        {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
            { dni: { contains: search, mode: 'insensitive' } },
            { matricula: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { specialty: { contains: search, mode: 'insensitive' } },
          ],
        },
      ];
    }

    const staff = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        dni: true,
        email: true,
        role: true,
        area: true,
        specialty: true,
        matricula: true,
        phone: true,
        shiftHours: true,
        workDays: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
      },
      orderBy: [{ area: 'asc' }, { lastName: 'asc' }],
    });

    return NextResponse.json({ success: true, staff });
  } catch (error: any) {
    console.error('Error en GET /api/staff:', error);
    return NextResponse.json({ error: 'Error al listar personal' }, { status: 500 });
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

    const body = await req.json();
    const {
      firstName,
      lastName,
      dni,
      area,
      role,
      specialty,
      matricula,
      phone,
      shiftHours,
      workDays,
      email,
      password,
    } = body;

    if (!firstName || !lastName) {
      return NextResponse.json({ error: 'Nombre y apellido son obligatorios' }, { status: 400 });
    }

    const cleanArea = (area || 'MEDICO').toUpperCase();
    const cleanRole = (role || cleanArea).toUpperCase();

    // Si no se provee email, generar uno institucional interno
    const rawEmail = email && email.trim() !== ''
      ? email.trim().toLowerCase()
      : `personal.${dni ? dni.replace(/\D/g, '') : Date.now()}@clinicpos.local`;

    // Verificar si ya existe el email
    const existing = await prisma.user.findUnique({
      where: { email: rawEmail },
    });

    if (existing) {
      return NextResponse.json({ error: `Ya existe un usuario con el correo ${rawEmail}` }, { status: 400 });
    }

    const rawPassword = password && password.trim() !== '' ? password.trim() : 'Personal2026!';
    const passwordHash = await hashPassword(rawPassword);

    const newUser = await prisma.user.create({
      data: {
        companyId: session.companyId,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        dni: dni ? dni.trim() : null,
        email: rawEmail,
        passwordHash,
        role: cleanRole,
        area: cleanArea,
        specialty: specialty ? specialty.trim() : null,
        matricula: matricula ? matricula.trim() : null,
        phone: phone ? phone.trim() : null,
        shiftHours: shiftHours || 'Mañana (08:00 - 14:00)',
        workDays: workDays || 'Lunes a Viernes',
        isActive: true,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        dni: true,
        email: true,
        role: true,
        area: true,
        specialty: true,
        matricula: true,
        phone: true,
        shiftHours: true,
        workDays: true,
        isActive: true,
        createdAt: true,
      },
    });

    await logAuditAction({
      companyId: session.companyId,
      userId: session.userId,
      userEmail: session.email,
      action: 'CREATE_STAFF',
      module: 'STAFF',
      details: `Alta de personal (${cleanArea}): ${newUser.firstName} ${newUser.lastName} - Matrícula: ${matricula || 'N/A'} - Turno: ${shiftHours || 'N/A'}`,
    });

    return NextResponse.json({
      success: true,
      message: 'Personal registrado exitosamente',
      staff: newUser,
    });
  } catch (error: any) {
    console.error('Error en POST /api/staff:', error);
    return NextResponse.json({ error: error.message || 'Error al registrar personal' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
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
    const {
      id,
      firstName,
      lastName,
      dni,
      area,
      role,
      specialty,
      matricula,
      phone,
      shiftHours,
      workDays,
      isActive,
      password,
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID de personal requerido' }, { status: 400 });
    }

    const existing = await prisma.user.findFirst({
      where: { id, companyId: session.companyId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Miembro de personal no encontrado' }, { status: 404 });
    }

    let passwordHash = undefined;
    if (password && password.trim() !== '') {
      passwordHash = await hashPassword(password.trim());
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(firstName !== undefined && { firstName: firstName.trim() }),
        ...(lastName !== undefined && { lastName: lastName.trim() }),
        ...(dni !== undefined && { dni: dni ? dni.trim() : null }),
        ...(area !== undefined && { area: area ? area.toUpperCase() : null }),
        ...(role !== undefined && { role: role ? role.toUpperCase() : undefined }),
        ...(specialty !== undefined && { specialty: specialty ? specialty.trim() : null }),
        ...(matricula !== undefined && { matricula: matricula ? matricula.trim() : null }),
        ...(phone !== undefined && { phone: phone ? phone.trim() : null }),
        ...(shiftHours !== undefined && { shiftHours: shiftHours || null }),
        ...(workDays !== undefined && { workDays: workDays || null }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) }),
        ...(passwordHash !== undefined && { passwordHash }),
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        dni: true,
        email: true,
        role: true,
        area: true,
        specialty: true,
        matricula: true,
        phone: true,
        shiftHours: true,
        workDays: true,
        isActive: true,
      },
    });

    await logAuditAction({
      companyId: session.companyId,
      userId: session.userId,
      userEmail: session.email,
      action: 'UPDATE_STAFF',
      module: 'STAFF',
      details: `Modificación de personal: ${updated.firstName} ${updated.lastName} (Área: ${updated.area})`,
    });

    return NextResponse.json({
      success: true,
      message: 'Personal actualizado correctamente',
      staff: updated,
    });
  } catch (error: any) {
    console.error('Error en PATCH /api/staff:', error);
    return NextResponse.json({ error: error.message || 'Error al actualizar personal' }, { status: 500 });
  }
}
