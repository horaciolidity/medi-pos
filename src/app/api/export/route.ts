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

    // Regla de suscripción: Bloquear exportación si está en modo Solo Lectura
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
    let filename = `reporte_${moduleName}_${new Date().toISOString().split('T')[0]}`;

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
        FechaAlta: p.createdAt.toLocaleString('es-AR'),
      }));
    } else if (moduleName === 'atenciones_medicas') {
      const ehrList = await prisma.eHRRecord.findMany({
        where: { companyId: session.companyId },
        include: {
          patient: true,
          author: true,
        },
        orderBy: { createdAt: 'desc' },
      });
      data = ehrList.map((e) => ({
        FechaHora: e.createdAt.toLocaleString('es-AR'),
        Paciente: `${e.patient.lastName}, ${e.patient.firstName}`,
        DNI_Paciente: e.patient.documentNumber,
        Cobertura: e.patient.medicalInsuranceName || 'Particular',
        Profesional_Medico: `${e.author.lastName}, ${e.author.firstName}`,
        Matricula_Profesional: e.author.matricula || 'S/D',
        Especialidad: e.author.specialty || 'Clínica General',
        Turno_Horario: e.author.shiftHours || 'S/D',
        MotivoConsulta: e.reasonForVisit,
        Diagnostico: e.diagnosis,
        Tratamiento: e.treatmentPlan || '',
        MedicacionPrescripta: e.prescribedMedication || '',
        Observaciones: e.observations || '',
      }));
    } else if (moduleName === 'enfermeria') {
      const nursing = await prisma.nursingRecord.findMany({
        where: { companyId: session.companyId },
        include: {
          patient: true,
          author: true,
        },
        orderBy: { createdAt: 'desc' },
      });
      data = nursing.map((n) => {
        let signosTxt = '';
        if (n.vitalSignsJson) {
          try {
            const v = JSON.parse(n.vitalSignsJson);
            signosTxt = `PA: ${v.bloodPressure || 'N/A'} | FC: ${v.heartRate || 'N/A'} | Temp: ${v.temperature || 'N/A'}°C | SatO2: ${v.oxygenSaturation || 'N/A'}%`;
          } catch {}
        }
        return {
          FechaHora: n.createdAt.toLocaleString('es-AR'),
          Paciente: `${n.patient.lastName}, ${n.patient.firstName}`,
          DNI_Paciente: n.patient.documentNumber,
          Enfermero_Actuante: `${n.author.lastName}, ${n.author.firstName}`,
          Matricula_Enfermero: n.author.matricula || 'S/D',
          Turno_Horario: n.author.shiftHours || 'S/D',
          SignosVitales: signosTxt,
          Procedimientos: n.proceduresDone || '',
          MedicacionAdministrada: n.medicationAdministered || '',
          NotasClinicas: n.notes || '',
        };
      });
    } else if (moduleName === 'farmacia' || moduleName === 'movimientos_farmacia') {
      const movements = await prisma.stockMovement.findMany({
        where: { companyId: session.companyId },
        include: {
          product: true,
          author: true,
        },
        orderBy: { createdAt: 'desc' },
      });
      data = movements.map((m) => ({
        FechaHora: m.createdAt.toLocaleString('es-AR'),
        CodigoProducto: m.product.internalCode,
        Producto: m.product.name,
        Categoria: m.product.category,
        TipoMovimiento: m.type,
        Cantidad: m.quantity,
        StockResultante: m.product.currentStock,
        Motivo: m.reason,
        Responsable_Farmacia: `${m.author.lastName}, ${m.author.firstName}`,
        Matricula_Responsable: m.author.matricula || 'S/D',
        Turno_Horario: m.author.shiftHours || 'S/D',
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
        FechaHora: t.createdAt.toLocaleString('es-AR'),
      }));
    } else if (moduleName === 'caja') {
      const shifts = await prisma.cashShift.findMany({
        where: { companyId: session.companyId },
        include: { operator: true, cashMovements: true },
        orderBy: { openedAt: 'desc' },
      });
      data = shifts.map((s) => ({
        Operador: `${s.operator.firstName} ${s.operator.lastName}`,
        Matricula_DNI: s.operator.matricula || s.operator.dni || 'S/D',
        Turno_Horario: s.operator.shiftHours || 'S/D',
        Estado: s.status,
        FondoInicial: s.initialFund,
        EsperadoCierre: s.expectedFinalFund,
        ContadoCierre: s.actualFinalFund || 0,
        Diferencia: s.differenceAmount || 0,
        Apertura: s.openedAt.toLocaleString('es-AR'),
        Cierre: s.closedAt ? s.closedAt.toLocaleString('es-AR') : 'En curso',
      }));
    } else if (moduleName === 'personal') {
      const staffList = await prisma.user.findMany({
        where: { companyId: session.companyId },
        orderBy: { lastName: 'asc' },
      });
      data = staffList.map((u) => ({
        Apellido: u.lastName,
        Nombre: u.firstName,
        DNI: u.dni || '',
        Area: u.area || u.role,
        Rol: u.role,
        Matricula: u.matricula || '',
        Especialidad: u.specialty || '',
        Turno_Horario: u.shiftHours || '',
        DiasLaborales: u.workDays || '',
        Telefono: u.phone || '',
        Email: u.email,
        Estado: u.isActive ? 'Activo' : 'Inactivo',
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
      module: 'EXPORT',
      details: `Descarga de reporte institucional de "${moduleName}" en formato .${format} con detalle de profesionales y horarios (${data.length} registros)`,
    });

    if (format === 'json') {
      return new NextResponse(JSON.stringify(data, null, 2), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${filename}.json"`,
        },
      });
    }

    if (format === 'csv' || format === 'txt') {
      if (data.length === 0) {
        return new NextResponse('', {
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Content-Disposition': `attachment; filename="${filename}.${format}"`,
          },
        });
      }
      const headers = Object.keys(data[0]);
      const csvRows = [headers.join(';')];
      for (const row of data) {
        const values = headers.map((header) => {
          const val = row[header] !== undefined && row[header] !== null ? String(row[header]) : '';
          return `"${val.replace(/"/g, '""')}"`;
        });
        csvRows.push(values.join(';'));
      }
      return new NextResponse('\uFEFF' + csvRows.join('\r\n'), {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}.${format}"`,
        },
      });
    }

    // Formato Excel (.xlsx) por defecto
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, moduleName.substring(0, 30));
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}.xlsx"`,
      },
    });
  } catch (error) {
    console.error('Error en /api/export:', error);
    return NextResponse.json({ error: 'Error al exportar datos de la clínica' }, { status: 500 });
  }
}
