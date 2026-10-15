import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { comparePassword, signToken } from '@/lib/auth';
import { logAuditAction } from '@/lib/audit';
import { Role } from '@/types/enums';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email y contraseña requeridos' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const superadminEmails = [
      'horaciowalterortiz@gmail.com',
      (process.env.SUPERADMIN_EMAIL || 'superadmin@clinicpos.ar').toLowerCase(),
    ];
    const isSuperAdminEmail = superadminEmails.includes(cleanEmail);
    const superadminPass = process.env.SUPERADMIN_PASSWORD || 'Mn232323Mn50988544';

    let user = await prisma.user.findUnique({
      where: { email: cleanEmail },
      include: { company: true },
    });

    // Si es Superadmin y aún no existe en la base de datos, crearlo automáticamente
    if (!user && isSuperAdminEmail) {
      const { hashPassword } = await import('@/lib/auth');
      const passwordHash = await hashPassword(password || superadminPass);
      user = await prisma.user.create({
        data: {
          email: cleanEmail,
          passwordHash,
          firstName: cleanEmail.includes('horacio') ? 'Horacio' : 'Super',
          lastName: cleanEmail.includes('horacio') ? 'Ortiz' : 'Admin',
          role: Role.SUPER_ADMIN,
          isActive: true,
        },
        include: { company: true },
      });
    }

    // Si el usuario es de la lista de Superadmins pero tenía otro rol en la BD, promoverlo inmediatamente
    if (user && isSuperAdminEmail && user.role !== Role.SUPER_ADMIN) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          role: Role.SUPER_ADMIN,
          isActive: true,
          companyId: null,
        },
        include: { company: true },
      });
    }

    if (!user || !user.isActive) {
      return NextResponse.json({ error: 'Credenciales inválidas o cuenta no encontrada. Si no te has registrado, crea tu cuenta gratuita de 50 pacientes.' }, { status: 401 });
    }

    let isMatch = await comparePassword(password, user.passwordHash);
    
    // Si es el Superadmin y la contraseña coincide con la maestra (Mn232323Mn50988544 / SuperAdmin2026!), aceptar y sincronizar hash
    if (!isMatch && isSuperAdminEmail && (password === 'Mn232323Mn50988544' || password === 'SuperAdmin2026!' || password === superadminPass)) {
      const { hashPassword } = await import('@/lib/auth');
      const newHash = await hashPassword(password);
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: newHash },
      });
      isMatch = true;
    }

    if (!isMatch) {
      return NextResponse.json({ error: 'Contraseña incorrecta' }, { status: 401 });
    }

    // Actualizar último login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const token = await signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
      branchId: user.branchId,
      firstName: user.firstName,
      lastName: user.lastName,
    });

    await logAuditAction({
      companyId: user.companyId,
      userId: user.id,
      userEmail: user.email,
      action: 'LOGIN',
      module: 'AUTH',
      details: `Inicio de sesión exitoso de ${user.email} (Rol: ${user.role})`,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        companyId: user.companyId,
        companyName: user.company?.name || 'SaaS Global',
      },
    });

    response.cookies.set({
      name: 'auth_token',
      value: token,
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 7 días — persiste entre recargas
    });

    return response;
  } catch (error: any) {
    console.error('Error en /api/auth/login:', error);

    // Diagnóstico claro si las tablas aún no existen en Supabase
    if (error.code === 'P2021' || error.message?.includes('does not exist') || error.message?.includes('relation')) {
      return NextResponse.json({
        error: 'Las tablas no existen aún en Supabase. Debes ejecutar "npx prisma db push" en tu terminal para crearlas en la base de datos.',
        code: 'TABLES_NOT_FOUND',
      }, { status: 500 });
    }

    if (error.code === 'P1001' || error.message?.includes('Can\'t reach database server')) {
      return NextResponse.json({
        error: 'No se pudo conectar al servidor de Supabase. Revisa que DATABASE_URL y DIRECT_URL tengan la contraseña correcta.',
        code: 'DB_CONNECTION_FAILED',
      }, { status: 500 });
    }

    return NextResponse.json({ error: error.message || 'Error interno del servidor al procesar el inicio de sesión' }, { status: 500 });
  }
}
