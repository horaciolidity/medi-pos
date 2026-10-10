# Clinic POS - Sistema de Gestión Integral para Clínicas (SaaS Argentina)

Plataforma SaaS multiempresa integral diseñada para clínicas pequeñas, consultorios y centros de atención médica en Argentina. Permite la administración completa de pacientes, historia clínica longitudinal, triage confidencial, turnero avanzado (Plan Pro) con pantalla pública de llamados en tiempo real, inventario de farmacia, aranceles, caja/POS, facturación fiscal (preparada para ARCA/AFIP) y panel de control SaaS para el Superadministrador.

---

## 🚀 Características Principales

1. **Arquitectura SaaS Multiempresa**:
   - Cada clínica trabaja de manera 100% aislada con su propia empresa, sucursales, sectores y personal.
   - Seguridad y aislamiento garantizado en backend y base de datos.

2. **Control de Suscripciones y Modo Solo Lectura**:
   - Estados: `TRIAL`, `ACTIVE`, `PAST_DUE`, `READ_ONLY`, `SUSPENDED`, `CANCELED`.
   - **Modo Solo Lectura**: Ante vencimiento o falta de pago, la clínica puede ingresar y consultar todos sus datos históricos, pero se bloquean de forma estricta las nuevas registraciones, modificaciones, eliminaciones y exportaciones de archivos.

3. **Planes Comerciales Configurables**:
   - **Plan Estándar (ARS $14.900/mes)**: Gestión clínica básica, historia clínica, triage, enfermería, caja, inventario, reportes.
   - **Plan Pro (ARS $24.900/mes)**: Incluye todo lo del Plan Estándar + Turnero avanzado, pantalla pública de llamados en tiempo real, impresión de tickets térmicos, boxes configurables y reglas de prefijos por sucursal.
   - Precios y contenidos gestionables dinámicamente por el **Superadmin**.

4. **Panel de Superadministrador (`SUPER_ADMIN`)**:
   - Panel independiente para el propietario de la plataforma SaaS.
   - Gestión de clínicas clientes, extensión manual de vencimientos, cambios de plan, suspensión/reactivación con auditoría, configuración de precios de planes y métricas de facturación.

5. **Módulos Clínicos & Operativos**:
   - **Pacientes e Historia Clínica Longitudinal**: Antecedentes, diagnósticos, evoluciones, signos vitales, enmiendas auditadas (sin borrado de registros asistenciales).
   - **Triage Confidencial**: Categorización por urgencia/prioridad clínica. Totalmente aislado de pantallas públicas.
   - **Recepción & Turnero Pro**: Pantalla pública de llamados sanitizada (`/display/[branchId]`), tickets térmicos sin datos confidenciales.
   - **Farmacia e Inventario**: Lotes, vencimientos, stock mínimo, movimientos trazables.
   - **Caja & POS**: Apertura y cierre de caja, cobro de coseguros/prestaciones, arqueo y anulaciones auditadas.
   - **Facturación Argentina**: Preparado para ARCA/AFIP (CUIT, condición fiscal IVA, comprobantes Factura A/B/C).
   - **Exportación de Datos**: Generación de reportes Excel (`.xlsx`), TXT y JSON para cuentas activas.

---

## 💻 Requisitos Previos e Instalación

### Requisitos
- Node.js v18.x o superior
- npm v9.x o superior

### Configuración de Base de Datos con Supabase (PostgreSQL)
1. Crea un proyecto en [Supabase](https://supabase.com/).
2. En la configuración de tu proyecto Supabase (**Settings > Database**), copia la URI de conexión del **Connection Pooler** (puerto 6543) y la URI de **Direct Connection** (puerto 5432).
3. Configura tu archivo `.env`:
   ```env
   DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
   DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
   JWT_SECRET="tu-clave-secreta-jwt"
   ```

### Instalación Local
```bash
# 1. Instalar dependencias
npm install

# 2. Generar cliente Prisma y aplicar el esquema a la BD Supabase
npm run db:push

# 3. Cargar datos de prueba (Seed con Superadmin y clínicas demo)
npm run seed

# 4. Iniciar servidor de desarrollo
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`.

---

## 🔑 Credenciales de Prueba por Defecto

Después de ejecutar `npm run seed`:

- **Superadministrador General del SaaS**:
  - **Email**: `superadmin@clinicpos.ar`
  - **Contraseña**: `SuperAdmin2026!`
  - **Acceso**: `http://localhost:3000/superadmin`

- **Clínica Demo Activa (Plan Pro - Vigente)**:
  - **Email**: `admin@centro-salud-norte.com.ar`
  - **Contraseña**: `Clinica2026!`
  - **Acceso**: `http://localhost:3000/login`

- **Clínica Demo Vencida (Plan Estándar - Solo Lectura)**:
  - **Email**: `admin@consultorios-sur.com.ar`
  - **Contraseña**: `Clinica2026!`
  - **Acceso**: `http://localhost:3000/login`

---

## 🧪 Ejecución de Pruebas Automáticas

```bash
# Ejecutar suite de pruebas unitarias e integración
npm test
```

---

## 🛠 Variables de Entorno (`.env`)

Consulte el archivo `.env.example` para la configuración completa de secretos, JWT, base de datos e integraciones de ARCA/AFIP y Pasarelas de Pago.
# medi-pos
