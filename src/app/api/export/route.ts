import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { checkCompanySubscription } from '@/lib/subscription';
import { logAuditAction } from '@/lib/audit';
import * as XLSX from 'xlsx';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || !session.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // REGLA DE ORO DE EXPORTACIÓN:
    // Si la suscripción de la clínica está VENCIDA o en MODO SOLO LECTURA, SE BLOQUEA TOTALMENTE LA DESCARGA/EXPORTACIÓN.
    const subInfo = await checkCompanySubscription(session.companyId);
    if (!subInfo.canExport) {
      return NextResponse.json(
        {
          error:
            'Exportación Bloqueada: La suscripción de su clínica está vencida o suspendida. Las funciones de descarga y exportación de archivos están deshabilitadas en modo Solo Lectura. Regularice su pago para habilitar exportaciones.',
          isReadOnly: true,
        },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const moduleName = searchParams.get('module') || 'pacientes';
    const format = (searchParams.get('format') || 'xlsx').toLowerCase();

    let data: any[] = [];
    let filename = `export_${moduleName}_${new Date().toISOString().split('T')[0]}`;

    if (moduleName === 'pacientes') {
      const patients = await prisma.patient.findMany({
        where: { companyId: session.companyId },
        orderBy: { createdAt: 'desc' },
      });
      data = patients.map((p) => ({
        Documento: `${p.documentType} ${p.documentNumber}`,
        Nombre: p.firstName,
        Apellido: p.lastName,
        FechaNacimiento: p.birthDate || '',
        Telefono: p.phone || '',
        Email: p.email || '',
        ObraSocial: p.medicalInsuranceName || '',
        NroAfiliado: p.affiliateNumber || '',
        FechaAlta: p.createdAt.toISOString().split('T')[0],
      }));
    } else if (moduleName === 'turnos') {
      const turnos = await prisma.queueTurno.findMany({
        where: { companyId: session.companyId },
        include: { patient: true, box: true },
        orderBy: { createdAt: 'desc' },
      });
      data = turnos.map((t) => ({
        Ticket: t.ticketNumber,
        Estado: t.status,
        Paciente: t.patient ? `${t.patient.firstName} ${t.patient.lastName}` : 'Anónimo',
        Box: t.box?.name || 'Recepción',
        FechaHora: t.createdAt.toISOString(),
      }));
    } else if (moduleName === 'farmacia') {
      const products = await prisma.product.findMany({
        where: { companyId: session.companyId },
        orderBy: { name: 'asc' },
      });
      data = products.map((p) => ({
        CodigoInterno: p.internalCode,
        Producto: p.name,
        Categoria: p.category,
        Unidad: p.unit,
        StockActual: p.currentStock,
        StockMinimoAlerta: p.minStockAlert,
      }));
    } else if (moduleName === 'caja') {
      const shifts = await prisma.cashShift.findMany({
        where: { companyId: session.companyId },
        include: { operator: true, cashMovements: true },
        orderBy: { openedAt: 'desc' },
      });
      data = shifts.map((s) => ({
        Operador: `${s.operator.firstName} ${s.operator.lastName}`,
        Estado: s.status,
        FondoInicial: s.initialFund,
        EsperadoCierre: s.expectedFinalFund,
        ContadoCierre: s.actualFinalFund || 0,
        Diferencia: s.differenceAmount || 0,
        Apertura: s.openedAt.toISOString(),
        Cierre: s.closedAt?.toISOString() || '',
      }));
    } else {
      return NextResponse.json({ error: 'Módulo de exportación desconocido' }, { status: 400 });
    }

    // Registrar en auditoría la acción de exportación
    await logAuditAction({
      companyId: session.companyId,
      userId: session.userId,
      userEmail: session.email,
      action: 'EXPORT_DATA',
      module: moduleName.toUpperCase(),
      details: `Exportación de ${data.length} registros en formato .${format} para el módulo ${moduleName}`,
    });

    if (format === 'json') {
      return new NextResponse(JSON.stringify(data, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${filename}.json"`,
        },
      });
    } else if (format === 'txt') {
      const textLines = data.map((item) => JSON.stringify(item)).join('\n');
      return new NextResponse(textLines, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}.txt"`,
        },
      });
    } else {
      // Formato por defecto Excel (.xlsx)
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, moduleName);

      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

      return new NextResponse(excelBuffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${filename}.xlsx"`,
        },
      });
    }
  } catch (error: any) {
    console.error('Error en GET /api/export:', error);
    return NextResponse.json({ error: error.message || 'Error al exportar datos' }, { status: 500 });
  }
}
