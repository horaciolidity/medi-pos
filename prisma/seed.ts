import { PrismaClient } from '@prisma/client';
import { Role, PlanCode, SubscriptionStatus, TriagePriority, TurnoStatus } from '../src/types/enums';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de la base de datos de Clinic POS...');

  // 1. Crear Planes Comerciales Oficiales
  const planStandard = await prisma.plan.upsert({
    where: { code: PlanCode.STANDARD },
    update: {
      monthlyPrice: 14900,
      isProTurneroEnabled: false,
    },
    create: {
      code: PlanCode.STANDARD,
      name: 'Plan Estándar',
      description: 'Gestión clínica completa para consultorios y clínicas pequeñas (Pacientes, Historia Clínica, Enfermería, Triage, Caja, Inventario, Reportes).',
      monthlyPrice: 14900,
      isProTurneroEnabled: false,
      featuresJson: JSON.stringify([
        'Pacientes e Historia Clínica Longitudinal',
        'Triage Confidencial y Enfermería',
        'Prestaciones, Aranceles y Coseguros',
        'Caja y Arqueo POS',
        'Farmacia e Inventario con Lotes',
        'Facturación Fiscal en Preparación ARCA/AFIP',
        'Exportación de Datos (Excel, TXT, JSON)',
        'Auditoría Global'
      ]),
    },
  });

  const planPro = await prisma.plan.upsert({
    where: { code: PlanCode.PRO },
    update: {
      monthlyPrice: 24900,
      isProTurneroEnabled: true,
    },
    create: {
      code: PlanCode.PRO,
      name: 'Plan Pro',
      description: 'Todo lo incluido en el Plan Estándar + Turnero Avanzado, Llamados en Pantalla Pública en Tiempo Real, Tickets Térmicos y Boxes Configurables.',
      monthlyPrice: 24900,
      isProTurneroEnabled: true,
      featuresJson: JSON.stringify([
        'Todas las características del Plan Estándar',
        'Turnero Avanzado con Colas y Prefijos',
        'Impresión de Tickets Térmicos',
        'Pantalla Pública de Llamados en Tiempo Real',
        'Llamado desde Boxes por Consultorio',
        'Configuración de Sectores y Boxes Avanzados'
      ]),
    },
  });

  console.log('✅ Planes creados:', { planStandard: planStandard.name, planPro: planPro.name });

  // 2. Crear Superadministrador Global
  const superadminPassword = await bcrypt.hash('SuperAdmin2026!', 10);
  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@clinicpos.ar' },
    update: {},
    create: {
      email: 'superadmin@clinicpos.ar',
      passwordHash: superadminPassword,
      firstName: 'Super',
      lastName: 'Admin',
      role: Role.SUPER_ADMIN,
    },
  });

  console.log('✅ Superadmin global listo:', superAdmin.email);

  // 3. Crear Clínica Demo ACTIVA (Plan Pro)
  const companyActive = await prisma.company.upsert({
    where: { cuit: '30-71123456-7' },
    update: {},
    create: {
      name: 'Centro de Salud Norte',
      razonSocial: 'Centro de Salud Norte S.A.',
      cuit: '30-71123456-7',
      fiscalCondition: 'Responsable Inscripto',
      address: 'Av. Libertador 1450, Buenos Aires',
      phone: '011-4555-1234',
      email: 'contacto@centro-salud-norte.com.ar',
    },
  });

  // Suscripción Activa
  const expiresActive = new Date();
  expiresActive.setDate(expiresActive.getDate() + 30); // Vence en 30 días

  await prisma.subscription.create({
    data: {
      companyId: companyActive.id,
      planId: planPro.id,
      status: SubscriptionStatus.ACTIVE,
      startedAt: new Date(),
      expiresAt: expiresActive,
      monthlyPriceAtSignup: planPro.monthlyPrice,
      notes: 'Suscripción inicial activa Plan Pro demo',
    },
  });

  // Sucursal, Sectores y Boxes para Clínica Activa
  const branchActive = await prisma.branch.create({
    data: {
      companyId: companyActive.id,
      name: 'Sede Central Palermo',
      code: 'PAL-01',
      address: 'Av. Santa Fe 3200, CABA',
    },
  });

  const sectorGuardia = await prisma.sector.create({
    data: {
      branchId: branchActive.id,
      name: 'Guardia Médica',
      code: 'GUA',
    },
  });

  const box1 = await prisma.box.create({
    data: {
      branchId: branchActive.id,
      name: 'Consultorio 101',
      code: 'BOX-1',
    },
  });

  const box2 = await prisma.box.create({
    data: {
      branchId: branchActive.id,
      name: 'Consultorio 102',
      code: 'BOX-2',
    },
  });

  // Usuarios Clínica Activa
  const defaultPassword = await bcrypt.hash('Clinica2026!', 10);

  const adminActive = await prisma.user.create({
    data: {
      companyId: companyActive.id,
      branchId: branchActive.id,
      email: 'admin@centro-salud-norte.com.ar',
      passwordHash: defaultPassword,
      firstName: 'Guillermo',
      lastName: 'Alvarez',
      role: Role.ADMIN,
    },
  });

  const doctorActive = await prisma.user.create({
    data: {
      companyId: companyActive.id,
      branchId: branchActive.id,
      email: 'medico@centro-salud-norte.com.ar',
      passwordHash: defaultPassword,
      firstName: 'Dra. Laura',
      lastName: 'Martínez',
      role: Role.MEDICO,
      specialty: 'Medicina General / Clínica',
    },
  });

  const recepcionActive = await prisma.user.create({
    data: {
      companyId: companyActive.id,
      branchId: branchActive.id,
      email: 'recepcion@centro-salud-norte.com.ar',
      passwordHash: defaultPassword,
      firstName: 'Sofía',
      lastName: 'Ríos',
      role: Role.RECEPCION,
    },
  });

  // Pacientes Demo
  const patient1 = await prisma.patient.create({
    data: {
      companyId: companyActive.id,
      documentNumber: '35123456',
      documentType: 'DNI',
      firstName: 'Juan Pablo',
      lastName: 'Pérez',
      gender: 'M',
      birthDate: '1990-05-14',
      phone: '011-15-4433-2211',
      email: 'juan.perez@example.com',
      address: 'Calle Falsa 123, CABA',
      medicalInsuranceName: 'OSDE',
      affiliateNumber: '2-35123456-01',
    },
  });

  const patient2 = await prisma.patient.create({
    data: {
      companyId: companyActive.id,
      documentNumber: '28999888',
      documentType: 'DNI',
      firstName: 'María Elena',
      lastName: 'González',
      gender: 'F',
      birthDate: '1982-11-20',
      phone: '011-15-9988-7766',
      email: 'maria.gonzalez@example.com',
      medicalInsuranceName: 'Swiss Medical',
      affiliateNumber: '10928374',
    },
  });

  // Historia Clínica Demo
  await prisma.eHRRecord.create({
    data: {
      companyId: companyActive.id,
      patientId: patient1.id,
      authorId: doctorActive.id,
      reasonForVisit: 'Cuadro febril y tos seca de 48hs de evolución.',
      symptoms: 'Fiebre de 38.5°C, cefalea moderada, astenia.',
      diagnosis: 'Infección respiratoria aguda de vías superiores (J06.9)',
      vitalSignsJson: JSON.stringify({ PA: '120/80', FC: 78, Temp: 38.2, SatO2: 98 }),
      treatmentPlan: 'Reposo deportivo, hidratación abundante, paracetamol 1g cada 8hs por 3 días.',
      prescribedMedication: 'Paracetamol 1000mg comprimidos.',
    },
  });

  // Turnos en Cola Demo
  await prisma.queueTurno.create({
    data: {
      companyId: companyActive.id,
      branchId: branchActive.id,
      sectorId: sectorGuardia.id,
      boxId: box1.id,
      patientId: patient1.id,
      ticketNumber: 'G001',
      prefix: 'G',
      number: 1,
      status: TurnoStatus.CALLED,
      calledAt: new Date(),
    },
  });

  await prisma.queueTurno.create({
    data: {
      companyId: companyActive.id,
      branchId: branchActive.id,
      sectorId: sectorGuardia.id,
      patientId: patient2.id,
      ticketNumber: 'G002',
      prefix: 'G',
      number: 2,
      status: TurnoStatus.WAITING,
    },
  });

  // Productos de Farmacia
  const product1 = await prisma.product.create({
    data: {
      companyId: companyActive.id,
      internalCode: 'MED-001',
      name: 'Paracetamol 500mg Comp x20',
      category: 'Medicamentos',
      unit: 'Caja',
      currentStock: 45,
      minStockAlert: 10,
    },
  });

  await prisma.productBatch.create({
    data: {
      productId: product1.id,
      companyId: companyActive.id,
      batchNumber: 'LOT-2026-A',
      expirationDate: '2027-12-31',
      quantity: 45,
    },
  });

  // Prestaciones y Aranceles
  await prisma.serviceTariff.create({
    data: {
      companyId: companyActive.id,
      code: 'CONS-GEN',
      name: 'Consulta Médica General en Consultorio',
      description: 'Atención médica clínica ambulatoria',
      price: 15000,
      copayAmount: 3500,
    },
  });

  console.log('✅ Clínica activa demo creada:', companyActive.name);

  // 4. Crear Clínica Demo VENCIDA (Plan Estándar - READ_ONLY)
  const companyExpired = await prisma.company.upsert({
    where: { cuit: '30-89987654-3' },
    update: {},
    create: {
      name: 'Consultorios Médicos Sur',
      razonSocial: 'Consultorios Sur SRL',
      cuit: '30-89987654-3',
      fiscalCondition: 'Monotributo',
      address: 'Calle 12 Nro 450, La Plata',
      phone: '0221-422-9900',
      email: 'admin@consultorios-sur.com.ar',
    },
  });

  // Suscripción Vencida (hace 5 días) -> READ_ONLY
  const expiresExpired = new Date();
  expiresExpired.setDate(expiresExpired.getDate() - 5);

  await prisma.subscription.create({
    data: {
      companyId: companyExpired.id,
      planId: planStandard.id,
      status: SubscriptionStatus.READ_ONLY,
      startedAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000),
      expiresAt: expiresExpired,
      monthlyPriceAtSignup: planStandard.monthlyPrice,
      notes: 'Suscripción vencida sin pago confirmado - Modo Solo Lectura activado',
    },
  });

  const branchExpired = await prisma.branch.create({
    data: {
      companyId: companyExpired.id,
      name: 'Sede La Plata',
      code: 'LP-01',
    },
  });

  const adminExpired = await prisma.user.create({
    data: {
      companyId: companyExpired.id,
      branchId: branchExpired.id,
      email: 'admin@consultorios-sur.com.ar',
      passwordHash: defaultPassword,
      firstName: 'Carlos',
      lastName: 'Rodríguez',
      role: Role.ADMIN,
    },
  });

  await prisma.patient.create({
    data: {
      companyId: companyExpired.id,
      documentNumber: '19876543',
      documentType: 'DNI',
      firstName: 'Roberto',
      lastName: 'Fernández',
      gender: 'M',
      birthDate: '1970-02-15',
      phone: '0221-15-5544-3322',
      medicalInsuranceName: 'IOMA',
    },
  });

  console.log('✅ Clínica vencida demo creada (Solo Lectura):', companyExpired.name);
  console.log('🎉 Seed finalizado con éxito.');
}

main()
  .catch((e) => {
    console.error('❌ Error en el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
