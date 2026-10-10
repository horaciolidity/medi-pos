import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { logAuditAction } from '@/lib/audit';
import { Role, PlanCode, SubscriptionStatus } from '@/types/enums';

export async function POST(req: NextRequest) {
  try {
    const { companyName, cuit, razonSocial, email, password, firstName, lastName, phone, planCode } = await req.json();

    if (!companyName || !cuit || !email || !password || !firstName || !lastName) {
      return NextResponse.json({ error: 'Faltan campos obligatorios para el registro' }, { status: 400 });
    }

    const cleanCuit = cuit.trim();
    const cleanEmail = email.trim().toLowerCase();

    // Verificar si CUIT o Email ya existen
    const existingCompany = await prisma.company.findUnique({ where: { cuit: cleanCuit } });
    if (existingCompany) {
      return NextResponse.json({ error: 'Ya existe una clínica registrada con ese CUIT' }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (existingUser) {
      return NextResponse.json({ error: 'El correo electrónico ya se encuentra registrado' }, { status: 400 });
    }

    // Buscar Plan seleccionado (Estándar o Pro)
    const targetPlanCode = planCode === PlanCode.PRO ? PlanCode.PRO : PlanCode.STANDARD;
    const plan = await prisma.plan.findUnique({ where: { code: targetPlanCode } });

    if (!plan) {
      return NextResponse.json({ error: 'Plan seleccionado inválido' }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);

    // Crear Empresa, Sucursal Principal, Usuario Admin y Suscripción de 30 días
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const result = await prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: {
          name: companyName,
          razonSocial: razonSocial || companyName,
          cuit: cleanCuit,
          email: cleanEmail,
          phone,
        },
      });

      const branch = await tx.branch.create({
        data: {
          companyId: company.id,
          name: 'Sede Central',
          code: 'SUC-01',
        },
      });

      const user = await tx.user.create({
        data: {
          companyId: company.id,
          branchId: branch.id,
          email: cleanEmail,
          passwordHash,
          firstName,
          lastName,
          role: Role.ADMIN,
        },
      });

      const subscription = await tx.subscription.create({
        data: {
          companyId: company.id,
          planId: plan.id,
          status: SubscriptionStatus.ACTIVE,
          startedAt: new Date(),
          expiresAt,
          monthlyPriceAtSignup: plan.monthlyPrice,
          notes: `Alta inicial de clínica con ${plan.name}`,
        },
      });

      return { company, branch, user, subscription };
    });

    await logAuditAction({
      companyId: result.company.id,
      userId: result.user.id,
      userEmail: cleanEmail,
      action: 'REGISTER_CLINIC',
      module: 'AUTH',
      details: `Registro de nueva clínica: ${companyName} (${cleanCuit}) con plan ${plan.name}`,
    });

    return NextResponse.json({
      success: true,
      message: 'Clínica registrada exitosamente. Ya puede iniciar sesión.',
      companyId: result.company.id,
    });
  } catch (error: any) {
    console.error('Error en /api/auth/register-clinic:', error);
    return NextResponse.json({ error: error.message || 'Error al registrar la clínica' }, { status: 500 });
  }
}
