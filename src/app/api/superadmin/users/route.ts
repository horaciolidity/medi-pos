import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logAuditAction } from '@/lib/audit';
import { Role } from '@/types/enums';

// GET: Superadmin lista todos los usuarios del sistema o filtra por empresa
export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || session.role !== Role.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Acceso denegado. Se requieren permisos de Superadmin.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get('companyId');
    const search = searchParams.get('search')?.toLowerCase() || '';

    const users = await prisma.user.findMany({
      where: {
        ...(companyId ? { companyId } : {}),
        ...(search
          ? {
              OR: [
                { email: { contains: search } },
                { firstName: { contains: search } },
                { lastName: { contains: search } },
              ],
            }
          : {}),
        role: { not: Role.SUPER_ADMIN }, // No listar otros superadmins por seguridad
      },
      include: {
        company: { select: { id: true, name: true, cuit: true } },
        branch: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    const formatted = users.map((u) => ({
      id: u.id,
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName,
      role: u.role,
      specialty: u.specialty,
      isActive: u.isActive,
      lastLoginAt: u.lastLoginAt,
      createdAt: u.createdAt,
      company: u.company,
      branch: u.branch,
    }));

    return NextResponse.json({ success: true, users: formatted });
  } catch (error) {
    console.error('Error en /api/superadmin/users GET:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// PATCH: Superadmin activa / desactiva usuario
export async function PATCH(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || session.role !== Role.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Acceso denegado.' }, { status: 403 });
    }

    const { userId, isActive, reason } = await req.json();

    if (!userId || typeof isActive !== 'boolean') {
      return NextResponse.json({ error: 'userId y isActive son requeridos' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { company: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    if (user.role === Role.SUPER_ADMIN) {
      return NextResponse.json({ error: 'No se puede modificar otro Superadmin' }, { status: 403 });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { isActive },
    });

    await logAuditAction({
      companyId: user.companyId,
      userId: session.userId,
      userEmail: session.email,
      action: isActive ? 'ACTIVATE_USER' : 'DEACTIVATE_USER',
      module: 'SUPERADMIN',
      details: `Usuario ${user.email} (${user.firstName} ${user.lastName}) ${isActive ? 'activado' : 'desactivado'}. Clínica: ${user.company?.name || 'N/A'}. Motivo: ${reason || 'Sin motivo especificado'}`,
    });

    return NextResponse.json({
      success: true,
      message: `Usuario ${isActive ? 'activado' : 'desactivado'} exitosamente`,
      user: { id: updated.id, email: updated.email, isActive: updated.isActive },
    });
  } catch (error: any) {
    console.error('Error en /api/superadmin/users PATCH:', error);
    return NextResponse.json({ error: error.message || 'Error al actualizar usuario' }, { status: 500 });
  }
}
