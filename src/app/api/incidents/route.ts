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

    const incidents = await prisma.incident.findMany({
      where: { companyId: session.companyId },
      include: {
        author: { select: { firstName: true, lastName: true, email: true } },
        assigned: { select: { firstName: true, lastName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, incidents });
  } catch (error) {
    return NextResponse.json({ error: 'Error al consultar incidencias' }, { status: 500 });
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

    const { title, description, category, priority, assignedUserId } = await req.json();

    if (!title || !description) {
      return NextResponse.json({ error: 'Título y descripción obligatorios' }, { status: 400 });
    }

    const incident = await prisma.incident.create({
      data: {
        companyId: session.companyId,
        authorId: session.userId,
        title,
        description,
        category: category || 'GENERAL',
        priority: priority || 'MEDIUM',
        assignedUserId: assignedUserId || null,
      },
    });

    await logAuditAction({
      companyId: session.companyId,
      userId: session.userId,
      userEmail: session.email,
      action: 'CREATE_INCIDENT',
      module: 'NOVEDADES',
      details: `Nueva incidencia registrada: "${title}" (Prioridad: ${incident.priority})`,
    });

    return NextResponse.json({ success: true, incident });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error al registrar incidencia' }, { status: 500 });
  }
}
