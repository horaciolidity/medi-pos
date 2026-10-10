import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { checkCompanySubscription } from '@/lib/subscription';
import { logAuditAction } from '@/lib/audit';
import { StockMovementType } from '@/types/enums';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || !session.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const products = await prisma.product.findMany({
      where: { companyId: session.companyId },
      include: {
        productBatches: { orderBy: { expirationDate: 'asc' } },
        stockMovements: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: { author: { select: { firstName: true, lastName: true } } },
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ success: true, products });
  } catch (error) {
    return NextResponse.json({ error: 'Error al consultar catálogo de farmacia' }, { status: 500 });
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

    const { internalCode, name, category, unit, initialStock, minStockAlert, batchNumber, expirationDate } = await req.json();

    if (!internalCode || !name) {
      return NextResponse.json({ error: 'Código interno y nombre son obligatorios' }, { status: 400 });
    }

    const existing = await prisma.product.findUnique({
      where: {
        companyId_internalCode: {
          companyId: session.companyId,
          internalCode: internalCode.trim(),
        },
      },
    });

    if (existing) {
      return NextResponse.json({ error: 'Ya existe un producto con ese código interno' }, { status: 400 });
    }

    const initialQty = Number(initialStock) || 0;

    const product = await prisma.$transaction(async (tx) => {
      const p = await tx.product.create({
        data: {
          companyId: session.companyId!,
          internalCode: internalCode.trim(),
          name: name.trim(),
          category: category || 'Medicamento',
          unit: unit || 'Caja',
          currentStock: initialQty,
          minStockAlert: Number(minStockAlert) || 10,
        },
      });

      if (batchNumber && expirationDate && initialQty > 0) {
        await tx.productBatch.create({
          data: {
            productId: p.id,
            companyId: session.companyId!,
            batchNumber: batchNumber.trim(),
            expirationDate,
            quantity: initialQty,
          },
        });
      }

      if (initialQty > 0) {
        await tx.stockMovement.create({
          data: {
            productId: p.id,
            companyId: session.companyId!,
            authorId: session.userId,
            type: StockMovementType.ENTRY,
            quantity: initialQty,
            reason: 'Stock inicial en alta de producto',
          },
        });
      }

      return p;
    });

    await logAuditAction({
      companyId: session.companyId,
      userId: session.userId,
      userEmail: session.email,
      action: 'CREATE_PRODUCT',
      module: 'FARMACIA',
      details: `Alta de producto en inventario: ${product.name} (Código: ${product.internalCode})`,
    });

    return NextResponse.json({ success: true, product });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error al registrar producto' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
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

    const { productId, type, quantity, reason } = await req.json();

    if (!productId || !type || !quantity || !reason) {
      return NextResponse.json({ error: 'Faltan parámetros obligatorios para el movimiento' }, { status: 400 });
    }

    const product = await prisma.product.findFirst({
      where: { id: productId, companyId: session.companyId },
    });

    if (!product) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
    }

    const qty = Number(quantity);
    let stockDelta = 0;
    if (type === StockMovementType.ENTRY) stockDelta = qty;
    else if (type === StockMovementType.EXIT) stockDelta = -qty;
    else if (type === StockMovementType.ADJUSTMENT) stockDelta = qty; // puede ser positivo o negativo

    const newStock = Math.max(0, product.currentStock + stockDelta);

    const [updatedProduct] = await prisma.$transaction([
      prisma.product.update({
        where: { id: productId },
        data: { currentStock: newStock },
      }),
      prisma.stockMovement.create({
        data: {
          productId,
          companyId: session.companyId,
          authorId: session.userId,
          type,
          quantity: qty,
          reason,
        },
      }),
    ]);

    await logAuditAction({
      companyId: session.companyId,
      userId: session.userId,
      userEmail: session.email,
      action: 'STOCK_MOVEMENT',
      module: 'FARMACIA',
      details: `Movimiento de stock (${type}) de ${qty} unidades en ${product.name}. Motivo: ${reason}`,
    });

    return NextResponse.json({ success: true, product: updatedProduct });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error al procesar movimiento de stock' }, { status: 500 });
  }
}
