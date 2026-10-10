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

    const tariffs = await prisma.serviceTariff.findMany({
      where: { companyId: session.companyId },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ success: true, tariffs });
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener aranceles' }, { status: 500 });
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

    const { code, name, description, price, copayAmount } = await req.json();

    if (!code || !name || typeof price !== 'number') {
      return NextResponse.json({ error: 'Código, nombre y precio válidos son requeridos' }, { status: 400 });
    }

    const existing = await prisma.serviceTariff.findUnique({
      where: {
        companyId_code: {
          companyId: session.companyId,
          code: code.trim(),
        },
      },
    });

    if (existing) {
      return NextResponse.json({ error: 'Ya existe un arancel registrado con ese código' }, { status: 400 });
    }

    const tariff = await prisma.serviceTariff.create({
      data: {
        companyId: session.companyId,
        code: code.trim(),
        name: name.trim(),
        description,
        price,
        copayAmount: copayAmount || 0,
      },
    });

    await logAuditAction({
      companyId: session.companyId,
      userId: session.userId,
      userEmail: session.email,
      action: 'CREATE_TARIFF',
      module: 'POS',
      details: `Alta de arancel: ${tariff.name} (Precio ARS $${tariff.price}, Coseguro ARS $${tariff.copayAmount})`,
    });

    return NextResponse.json({ success: true, tariff });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error al guardar arancel' }, { status: 500 });
  }
}
