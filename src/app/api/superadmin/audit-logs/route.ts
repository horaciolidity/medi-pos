import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Role } from '@/types/enums';

// GET: Superadmin puede consultar log de auditoría global o de una empresa
export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || session.role !== Role.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Acceso denegado. Se requieren permisos de Superadmin.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get('companyId');
    const module = searchParams.get('module');
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 500);

    const logs = await prisma.auditLog.findMany({
      where: {
        ...(companyId ? { companyId } : {}),
        ...(module ? { module: { contains: module } } : {}),
      },
      include: {
        company: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return NextResponse.json({ success: true, logs });
  } catch (error) {
    console.error('Error en /api/superadmin/audit-logs GET:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
