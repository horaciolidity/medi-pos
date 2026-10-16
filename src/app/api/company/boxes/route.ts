import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logAuditAction } from '@/lib/audit';

// GET /api/company/boxes — Listar boxes/consultorios de la clínica
export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || !session.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const boxes = await (prisma as any).box.findMany({
      where: { branch: { companyId: session.companyId } },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ success: true, boxes });
  } catch (error: any) {
    console.error('GET /api/company/boxes error:', error);
    return NextResponse.json({ error: error.message || 'Error al obtener boxes' }, { status: 500 });
  }
}

// POST /api/company/boxes — Crear nuevo box/consultorio
export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || !session.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { name, code } = await req.json();
    if (!name || !code) {
      return NextResponse.json({ error: 'Nombre y código del box son obligatorios' }, { status: 400 });
    }

    // Buscar o crear la sucursal principal de la clínica
    let branch = await (prisma as any).branch.findFirst({
      where: { companyId: session.companyId },
    });

    if (!branch) {
      branch = await (prisma as any).branch.create({
        data: {
          companyId: session.companyId,
          name: 'Sede Central',
          code: 'CENTRAL',
        },
      });
    }

    const box = await (prisma as any).box.create({
      data: {
        branchId: branch.id,
        name: name.trim(),
        code: code.trim().toUpperCase(),
        status: 'AVAILABLE',
      },
    });

    await logAuditAction({
      companyId: session.companyId,
      userId: session.userId,
      userEmail: session.email,
      module: 'CONFIGURACION',
      action: 'CREATE_BOX',
      details: `Box creado: ${box.name} (${box.code})`,
    });

    return NextResponse.json({ success: true, box });
  } catch (error: any) {
    console.error('POST /api/company/boxes error:', error);
    return NextResponse.json({ error: error.message || 'Error al crear box' }, { status: 500 });
  }
}

// DELETE /api/company/boxes — Eliminar box
export async function DELETE(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || !session.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: 'ID de box no especificado' }, { status: 400 });
    }

    // Verificar pertenencia a la empresa
    const box = await (prisma as any).box.findUnique({
      where: { id },
      include: { branch: true },
    });

    if (!box || box.branch?.companyId !== session.companyId) {
      return NextResponse.json({ error: 'Box no encontrado o sin permisos' }, { status: 404 });
    }

    await (prisma as any).box.delete({
      where: { id },
    });

    await logAuditAction({
      companyId: session.companyId,
      userId: session.userId,
      userEmail: session.email,
      module: 'CONFIGURACION',
      action: 'DELETE_BOX',
      details: `Box eliminado: ${box.name} (${box.code})`,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('DELETE /api/company/boxes error:', error);
    return NextResponse.json({ error: error.message || 'Error al eliminar box' }, { status: 500 });
  }
}
