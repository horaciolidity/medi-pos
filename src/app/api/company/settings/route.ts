import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logAuditAction } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || !session.companyId) {
      return NextResponse.json({ error: 'No autorizado o sin empresa asignada' }, { status: 401 });
    }

    const company = await prisma.company.findUnique({
      where: { id: session.companyId },
      select: {
        id: true,
        name: true,
        razonSocial: true,
        cuit: true,
        fiscalCondition: true,
        address: true,
        phone: true,
        email: true,
        logoUrl: true,
        ticketHeader: true,
        ticketFooter: true,
        ticketConfigJson: true,
        slug: true,
        onlineBookingEnabled: true,
        onlineServicesJson: true,
        whatsappConfigJson: true,
        createdAt: true,
      },
    });

    if (!company) {
      return NextResponse.json({ error: 'Empresa no encontrada' }, { status: 404 });
    }

    return NextResponse.json({ success: true, company });
  } catch (error: any) {
    console.error('Error en GET /api/company/settings:', error);
    return NextResponse.json({ error: 'Error al obtener ajustes de empresa' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || !session.companyId) {
      return NextResponse.json({ error: 'No autorizado o sin empresa asignada' }, { status: 401 });
    }

    const body = await req.json();
    const {
      name,
      razonSocial,
      cuit,
      fiscalCondition,
      address,
      phone,
      email,
      logoUrl,
      ticketHeader,
      ticketFooter,
      ticketConfigJson,
      slug,
      onlineBookingEnabled,
      onlineServicesJson,
      whatsappConfigJson,
    } = body;

    const updatedCompany = await prisma.company.update({
      where: { id: session.companyId },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(razonSocial !== undefined && { razonSocial: razonSocial ? razonSocial.trim() : null }),
        ...(cuit !== undefined && { cuit: cuit ? cuit.trim() : null }),
        ...(fiscalCondition !== undefined && { fiscalCondition: fiscalCondition || null }),
        ...(address !== undefined && { address: address ? address.trim() : null }),
        ...(phone !== undefined && { phone: phone ? phone.trim() : null }),
        ...(email !== undefined && { email: email ? email.trim() : null }),
        ...(logoUrl !== undefined && { logoUrl: logoUrl ? logoUrl.trim() : null }),
        ...(ticketHeader !== undefined && { ticketHeader: ticketHeader || null }),
        ...(ticketFooter !== undefined && { ticketFooter: ticketFooter || null }),
        ...(ticketConfigJson !== undefined && {
          ticketConfigJson: typeof ticketConfigJson === 'string' ? ticketConfigJson : JSON.stringify(ticketConfigJson),
        }),
        ...(slug !== undefined && { slug: slug ? slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-') : null }),
        ...(onlineBookingEnabled !== undefined && { onlineBookingEnabled: Boolean(onlineBookingEnabled) }),
        ...(onlineServicesJson !== undefined && {
          onlineServicesJson: typeof onlineServicesJson === 'string' ? onlineServicesJson : JSON.stringify(onlineServicesJson),
        }),
        ...(whatsappConfigJson !== undefined && {
          whatsappConfigJson: typeof whatsappConfigJson === 'string' ? whatsappConfigJson : JSON.stringify(whatsappConfigJson),
        }),
      },
    });

    await logAuditAction({
      companyId: session.companyId,
      userId: session.userId,
      userEmail: session.email,
      action: 'UPDATE_COMPANY_SETTINGS',
      module: 'SETTINGS',
      details: `Actualización de datos de clínica y formato de ticket por ${session.email}`,
    });

    return NextResponse.json({
      success: true,
      message: 'Ajustes de empresa y formato de ticket guardados exitosamente',
      company: updatedCompany,
    });
  } catch (error: any) {
    console.error('Error en PATCH /api/company/settings:', error);
    return NextResponse.json({ error: error.message || 'Error al guardar ajustes' }, { status: 500 });
  }
}
