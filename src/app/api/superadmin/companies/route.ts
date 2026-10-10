import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Role } from '@/types/enums';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || session.role !== Role.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Acceso denegado. Se requieren permisos de Superadmin.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.toLowerCase() || '';

    const companies = await prisma.company.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: search } },
              { cuit: { contains: search } },
              { email: { contains: search } },
            ],
          }
        : undefined,
      include: {
        subscriptions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { plan: true },
        },
        users: {
          select: { id: true, email: true, firstName: true, lastName: true, role: true, lastLoginAt: true },
        },
        _count: {
          select: { patients: true, branches: true, ehrRecords: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const now = new Date();
    const formatted = companies.map((c) => {
      const sub = c.subscriptions[0];
      const expiresAt = sub ? new Date(sub.expiresAt) : null;
      const isExpired = expiresAt ? expiresAt.getTime() < now.getTime() : false;
      
      let effectiveStatus = sub?.status || 'NO_SUB';
      if (isExpired && (effectiveStatus === 'ACTIVE' || effectiveStatus === 'TRIAL')) {
        effectiveStatus = 'READ_ONLY';
      }

      return {
        id: c.id,
        name: c.name,
        razonSocial: c.razonSocial,
        cuit: c.cuit,
        email: c.email,
        phone: c.phone,
        createdAt: c.createdAt,
        userCount: c.users.length,
        adminEmail: c.users.find((u) => u.role === Role.ADMIN)?.email || c.email,
        lastLoginAt: c.users.find((u) => u.lastLoginAt)?.lastLoginAt || null,
        counts: c._count,
        subscription: sub
          ? {
              id: sub.id,
              status: effectiveStatus,
              planCode: sub.plan.code,
              planName: sub.plan.name,
              startedAt: sub.startedAt,
              expiresAt: sub.expiresAt,
              isExpired,
              monthlyPriceAtSignup: sub.monthlyPriceAtSignup,
              notes: sub.notes,
            }
          : null,
      };
    });

    return NextResponse.json({ success: true, companies: formatted });
  } catch (error) {
    console.error('Error en /api/superadmin/companies:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
