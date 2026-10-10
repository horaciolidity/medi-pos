import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { checkCompanySubscription } from '@/lib/subscription';
import { logAuditAction } from '@/lib/audit';
import { FiscalStatus } from '@/types/enums';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || !session.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const company = await prisma.company.findUnique({
      where: { id: session.companyId },
    });

    const invoices = await prisma.billingInvoice.findMany({
      where: { companyId: session.companyId },
      include: {
        patient: { select: { firstName: true, lastName: true, documentNumber: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    // Estado de configuración fiscal ARCA/AFIP
    const arcaConfigured = Boolean(process.env.ARCA_CUIT && process.env.ARCA_CERT_PATH);

    return NextResponse.json({
      success: true,
      fiscalData: {
        cuit: company?.cuit || 'Sin CUIT',
        razonSocial: company?.razonSocial || company?.name,
        fiscalCondition: company?.fiscalCondition || 'Responsable Inscripto',
        arcaIntegrationStatus: arcaConfigured ? 'SIMULATED_TESTING' : 'PENDING_CREDENTIALS',
        arcaEnvironment: process.env.ARCA_ENVIRONMENT || 'testing',
      },
      invoices,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Error al consultar facturación' }, { status: 500 });
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

    const { patientId, invoiceType = 'FACTURA_B', totalAmount, cuitReceptor } = await req.json();

    if (!totalAmount || totalAmount <= 0) {
      return NextResponse.json({ error: 'Importe de comprobante requerido' }, { status: 400 });
    }

    const company = await prisma.company.findUnique({ where: { id: session.companyId } });

    const count = await prisma.billingInvoice.count({ where: { companyId: session.companyId } });
    const invoiceNumber = `0001-${String(count + 1).padStart(8, '0')}`;

    // Simulación fiscal segura
    const caeCode = `7642${Math.floor(100000000000 + Math.random() * 900000000000)}`;
    const expDate = new Date();
    expDate.setDate(expDate.getDate() + 10);
    const caeExpiration = expDate.toISOString().split('T')[0];

    const invoice = await prisma.billingInvoice.create({
      data: {
        companyId: session.companyId,
        patientId: patientId || null,
        invoiceType,
        invoiceNumber,
        cuitEmisor: company?.cuit || '30-00000000-0',
        cuitReceptor: cuitReceptor || null,
        totalAmount: Number(totalAmount),
        vatAmount: Number((totalAmount * 0.21).toFixed(2)),
        fiscalStatus: FiscalStatus.AUTHORIZED_SIMULATED,
        caeCode,
        caeExpiration,
      },
    });

    await logAuditAction({
      companyId: session.companyId,
      userId: session.userId,
      userEmail: session.email,
      action: 'EMIT_INVOICE',
      module: 'FACTURACION',
      details: `Emisión de comprobante ${invoice.invoiceType} ${invoice.invoiceNumber} por ARS $${invoice.totalAmount} (CAE: ${caeCode})`,
    });

    return NextResponse.json({ success: true, invoice });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error al emitir comprobante' }, { status: 500 });
  }
}
