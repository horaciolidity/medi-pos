# PLAN DE IMPLEMENTACIÓN - Clinic POS (SaaS de Gestión Integral para Clínicas en Argentina)

## 1. Visión General del Proyecto
Clinic POS es una plataforma SaaS multiempresa de gestión clínica, administrativa, contable y operativa para pequeñas clínicas, consultorios y centros médicos en Argentina. El sistema incluye aislamiento estricto entre empresas, gestión de suscripciones con control de acceso por vencimiento (modo Solo Lectura en backend y frontend), roles y permisos granulares, turnero avanzado (Plan Pro), historia clínica longitudinal, triage confidencial, farmacia e inventario, caja/POS y facturación fiscal preparada para ARCA/AFIP.

---

## 2. Arquitectura Técnica

### Stack Tecnológico
- **Frontend & Backend**: Next.js 14+ (App Router), React, TypeScript.
- **Estilos & UI**: Tailwind CSS, Lucide Icons, diseño moderno responsivo en español.
- **Base de Datos & ORM**: PostgreSQL en **Supabase** (con soporte para Connection Pooling en puerto 6543 y Direct URL en puerto 5432 para migraciones) administrado mediante **Prisma ORM**.
- **Autenticación & Seguridad**: Tokens JWT con Cookies HTTP-only, Hashing Bcrypt, Aislamiento de Tenant a nivel de Middleware y Backend API.
- **Exportación**: Generación de reportes Excel (`.xlsx`), TXT y JSON con validación estricta de suscripción activa.
- **Tiempo Real**: Eventos Server-Sent / Sincronización en vivo para pantalla pública de llamados de turnos (Plan Pro).

---

## 3. Fases de Desarrollo

### FASE 1: Base SaaS, Multiempresa, Suscripciones y Superadmin
- [x] Configuración inicial del proyecto con Next.js, TypeScript, Tailwind CSS y Prisma ORM.
- [x] Definición del esquema relacional completo (`schema.prisma`) con aislamiento `companyId` en todas las entidades.
- [x] Sistema de Autenticación JWT y Hashing de contraseñas con Bcrypt.
- [x] Registro multiempresa de clínica y usuarios por rol (`ADMIN`, `MEDICO`, `RECEPCION`, `ENFERMERIA`, `FARMACIA`, `CAJA`, `ADMINISTRATIVO`, `LIMPIEZA`, `AUDITOR`).
- [x] Control estricto de suscripciones (`TRIAL`, `ACTIVE`, `PAST_DUE`, `READ_ONLY`, `SUSPENDED`, `CANCELED`).
- [x] **Regla de oro backend**: Bloqueo de escritura (POST, PUT, DELETE, PATCH) y descarga/exportación de archivos en clínicas con estado `READ_ONLY` o vencidas.
- [x] Panel privado de Superadmin (`/superadmin`): gestión de clientes, extensión de vencimientos, cambios de plan, ajuste dinámico de precios de planes (Estándar ARS $14.900 / Pro ARS $24.900), auditoría de cambios administrativos y métricas SaaS.
- [x] Módulo de Auditoría global resistente a modificaciones.

### FASE 2: Operación Clínica Básica, Historias Clínicas y Triage
- [x] Registro y gestión de Pacientes (Alta, edición autorizada, prevención de duplicados, datos de contacto, prepaga/obra social).
- [x] Historia Clínica Longitudinal (Evoluciones, diagnósticos, antecedentes, alergias, medicación, signos vitales). Sistema de enmiendas trazables (sin borrado silencioso).
- [x] Triage Confidencial (Escala de prioridad por color/urgencia, signos vitales iniciales, motivo de consulta, resguardo estricto fuera de pantallas públicas).
- [x] Enfermería (Registro de signos vitales, procedimientos realizados y administración de medicamentos).

### FASE 3: Recepción, Turnero y Pantalla Pública de Llamados (Plan Pro)
- [x] Módulo de Recepción y asignación de turnos.
- [x] Generación e impresión de Tickets térmicos (Plan Pro) con datos estrictamente operativos (sin información clínica confidencial).
- [x] Pantalla pública de llamados en tiempo real (`/display/[branchId]`) para Plan Pro (Muestra sólo Código de Turno + Box/Consultorio + alerta sonora).
- [x] Control de permisos de turnero según plan (Estándar vs. Pro).

### FASE 4: Farmacia, Inventario, Prestaciones, POS y Novedades
- [x] Farmacia e Inventario: Catálogo de insumos/medicamentos, control de lotes y fechas de vencimiento, movimientos de stock trazables, alertas de bajo stock.
- [x] Catálogo de Prestaciones y Aranceles: Precios por servicio, reglas de cobertura y coseguros.
- [x] Caja & POS: Apertura de caja (fondo inicial), cobro de prestaciones/coseguros, múltiples medios de pago, arqueo de caja con diferencias, anulación auditada.
- [x] Novedades e Incidencias internas.
- [x] Personal y Sectores (incluye vista restringida para personal de limpieza).

### FASE 5: Exportaciones, Facturación Fiscal ARCA/AFIP y Dashboard
- [x] Exportación de datos en Excel, TXT y JSON para clínicas activas (con bloqueo total en clínicas vencidas/solo lectura).
- [x] Módulo de Facturación Fiscal preparado para ARCA/AFIP (CUIT, Condición IVA, certificados y credenciales en variables de entorno, indicación clara de estado de conexión).
- [x] Tableros y métricas diferenciadas por rol de clínica y métricas globales para Superadmin.
- [x] Suite de Pruebas Unitarias e Integración.

---

## 4. Riesgos Identificados y Mitigaciones
1. **Riesgo**: Salteo de restricciones de lectura/escritura manipulando el frontend.
   - **Mitigación**: Middleware y funciones servidoras (`checkSubscriptionState`, `checkPermission`) que validan `companyId` y estado del plan directamente en la API backend antes de ejecutar cualquier consulta o mutación.
2. **Riesgo**: Exposición involuntaria de datos clínicos de pacientes en la pantalla pública de llamados.
   - **Mitigación**: La pantalla de turnero consume exclusivamente un endpoint sanitizado que retorna únicamente `ticketNumber` y `boxName`.
3. **Riesgo**: Modificación silenciosa de historias clínicas anteriores.
   - **Mitigación**: Los registros clínicos son inmutables; las correcciones se agregan como `EHRAmendment` enlazado con timestamp, usuario y motivo.

---

## 5. Criterios de Aceptación y Pruebas
- [x] Aislamiento tenant multiempresa verificado por tests.
- [x] Superadmin independiente inicializado mediante script seguro de seed.
- [x] Suscripción vencida entra en modo `READ_ONLY`: permite consultar pero bloquea creación, edición, borrado, carga de archivos y exportación.
- [x] Plan Estándar (ARS $14.900) vs Plan Pro (ARS $24.900) con control de funciones del turnero.
- [x] Cobertura de tests automáticos ejecutables localmente (`npm test`).
