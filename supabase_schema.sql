-- ============================================================
-- CLINIC POS SAAS - Schema SQL para Supabase
-- Ejecutar en: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

CREATE TABLE IF NOT EXISTS "Company" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "name" TEXT NOT NULL,
    "logoUrl" TEXT,
    "razonSocial" TEXT,
    "cuit" TEXT,
    "fiscalCondition" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Company_cuit_key" ON "Company"("cuit");

CREATE TABLE IF NOT EXISTS "Branch" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL DEFAULT 'SUC1',
    "address" TEXT,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Branch_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Sector" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "branchId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    CONSTRAINT "Sector_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Box" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "branchId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
    CONSTRAINT "Box_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Plan" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "monthlyPrice" DOUBLE PRECISION NOT NULL,
    "isProTurneroEnabled" BOOLEAN NOT NULL DEFAULT false,
    "featuresJson" TEXT NOT NULL DEFAULT '[]',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Plan_code_key" ON "Plan"("code");

CREATE TABLE IF NOT EXISTS "PlanPricingHistory" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "planId" TEXT NOT NULL,
    "oldPrice" DOUBLE PRECISION NOT NULL,
    "newPrice" DOUBLE PRECISION NOT NULL,
    "changedByEmail" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PlanPricingHistory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Subscription" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "companyId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "monthlyPriceAtSignup" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "SubscriptionLog" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "companyId" TEXT NOT NULL,
    "subscriptionId" TEXT,
    "oldStatus" TEXT NOT NULL,
    "newStatus" TEXT NOT NULL,
    "oldExpiresAt" TIMESTAMP(3) NOT NULL,
    "newExpiresAt" TIMESTAMP(3) NOT NULL,
    "changedBy" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SubscriptionLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "companyId" TEXT,
    "branchId" TEXT,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "dni" TEXT,
    "role" TEXT NOT NULL DEFAULT 'ADMIN',
    "specialty" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");

CREATE TABLE IF NOT EXISTS "Patient" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "companyId" TEXT NOT NULL,
    "documentType" TEXT NOT NULL DEFAULT 'DNI',
    "documentNumber" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "gender" TEXT,
    "birthDate" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "emergencyContactName" TEXT,
    "emergencyContactPhone" TEXT,
    "medicalInsuranceName" TEXT,
    "affiliateNumber" TEXT,
    "bloodType" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Patient_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Patient_companyId_documentNumber_key" ON "Patient"("companyId", "documentNumber");

CREATE TABLE IF NOT EXISTS "EHRRecord" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "companyId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "reasonForVisit" TEXT NOT NULL,
    "symptoms" TEXT,
    "diagnosis" TEXT NOT NULL,
    "vitalSignsJson" TEXT,
    "treatmentPlan" TEXT,
    "prescribedMedication" TEXT,
    "observations" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EHRRecord_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "EHRAmendment" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "ehrRecordId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "amendmentReason" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EHRAmendment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Triage" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "companyId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "branchId" TEXT,
    "authorId" TEXT NOT NULL,
    "priorityLevel" TEXT NOT NULL DEFAULT 'GREEN',
    "chiefComplaint" TEXT NOT NULL,
    "systolicBP" INTEGER,
    "diastolicBP" INTEGER,
    "heartRate" INTEGER,
    "temperature" DOUBLE PRECISION,
    "oxygenSaturation" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Triage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "NursingRecord" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "companyId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "vitalSignsJson" TEXT,
    "proceduresDone" TEXT,
    "medicationAdministered" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "NursingRecord_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "QueueTurno" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "companyId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "sectorId" TEXT,
    "boxId" TEXT,
    "patientId" TEXT,
    "ticketNumber" TEXT NOT NULL,
    "prefix" TEXT NOT NULL DEFAULT 'A',
    "number" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'WAITING',
    "calledAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "QueueTurno_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Product" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "companyId" TEXT NOT NULL,
    "internalCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "currentStock" INTEGER NOT NULL DEFAULT 0,
    "minStockAlert" INTEGER NOT NULL DEFAULT 10,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Product_companyId_internalCode_key" ON "Product"("companyId", "internalCode");

CREATE TABLE IF NOT EXISTS "ProductBatch" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "productId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "batchNumber" TEXT NOT NULL,
    "expirationDate" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProductBatch_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "StockMovement" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "productId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StockMovement_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ServiceTariff" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "companyId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "copayAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ServiceTariff_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "ServiceTariff_companyId_code_key" ON "ServiceTariff"("companyId", "code");

CREATE TABLE IF NOT EXISTS "CashShift" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "companyId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "operatorId" TEXT NOT NULL,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),
    "initialFund" DOUBLE PRECISION NOT NULL,
    "expectedFinalFund" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "actualFinalFund" DOUBLE PRECISION,
    "differenceAmount" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "closingNotes" TEXT,
    CONSTRAINT "CashShift_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "CashMovement" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "cashShiftId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "operatorId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "paymentMethod" TEXT NOT NULL DEFAULT 'CASH',
    "concept" TEXT NOT NULL,
    "isVoided" BOOLEAN NOT NULL DEFAULT false,
    "voidReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CashMovement_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "BillingInvoice" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "companyId" TEXT NOT NULL,
    "patientId" TEXT,
    "cashMovementId" TEXT,
    "invoiceType" TEXT NOT NULL DEFAULT 'FACTURA_B',
    "invoiceNumber" TEXT NOT NULL DEFAULT '0001-00000001',
    "cuitEmisor" TEXT,
    "cuitReceptor" TEXT,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "vatAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fiscalStatus" TEXT NOT NULL DEFAULT 'AUTHORIZED_SIMULATED',
    "caeCode" TEXT,
    "caeExpiration" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BillingInvoice_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Incident" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "companyId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "assignedUserId" TEXT,
    "branchId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'GENERAL',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Incident_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AuditLog" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "companyId" TEXT,
    "userId" TEXT,
    "userEmail" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "ipAddress" TEXT DEFAULT '127.0.0.1',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- FOREIGN KEYS
ALTER TABLE "Branch" ADD CONSTRAINT "Branch_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Sector" ADD CONSTRAINT "Sector_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Box" ADD CONSTRAINT "Box_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PlanPricingHistory" ADD CONSTRAINT "PlanPricingHistory_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON UPDATE CASCADE;
ALTER TABLE "SubscriptionLog" ADD CONSTRAINT "SubscriptionLog_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "User" ADD CONSTRAINT "User_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "User" ADD CONSTRAINT "User_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON UPDATE CASCADE;
ALTER TABLE "Patient" ADD CONSTRAINT "Patient_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EHRRecord" ADD CONSTRAINT "EHRRecord_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EHRRecord" ADD CONSTRAINT "EHRRecord_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EHRRecord" ADD CONSTRAINT "EHRRecord_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON UPDATE CASCADE;
ALTER TABLE "EHRAmendment" ADD CONSTRAINT "EHRAmendment_ehrRecordId_fkey" FOREIGN KEY ("ehrRecordId") REFERENCES "EHRRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EHRAmendment" ADD CONSTRAINT "EHRAmendment_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EHRAmendment" ADD CONSTRAINT "EHRAmendment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON UPDATE CASCADE;
ALTER TABLE "Triage" ADD CONSTRAINT "Triage_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Triage" ADD CONSTRAINT "Triage_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Triage" ADD CONSTRAINT "Triage_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON UPDATE CASCADE;
ALTER TABLE "NursingRecord" ADD CONSTRAINT "NursingRecord_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NursingRecord" ADD CONSTRAINT "NursingRecord_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NursingRecord" ADD CONSTRAINT "NursingRecord_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON UPDATE CASCADE;
ALTER TABLE "QueueTurno" ADD CONSTRAINT "QueueTurno_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "QueueTurno" ADD CONSTRAINT "QueueTurno_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "QueueTurno" ADD CONSTRAINT "QueueTurno_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "Sector"("id") ON UPDATE CASCADE;
ALTER TABLE "QueueTurno" ADD CONSTRAINT "QueueTurno_boxId_fkey" FOREIGN KEY ("boxId") REFERENCES "Box"("id") ON UPDATE CASCADE;
ALTER TABLE "QueueTurno" ADD CONSTRAINT "QueueTurno_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON UPDATE CASCADE;
ALTER TABLE "Product" ADD CONSTRAINT "Product_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductBatch" ADD CONSTRAINT "ProductBatch_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductBatch" ADD CONSTRAINT "ProductBatch_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON UPDATE CASCADE;
ALTER TABLE "ServiceTariff" ADD CONSTRAINT "ServiceTariff_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CashShift" ADD CONSTRAINT "CashShift_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CashShift" ADD CONSTRAINT "CashShift_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CashShift" ADD CONSTRAINT "CashShift_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "User"("id") ON UPDATE CASCADE;
ALTER TABLE "CashMovement" ADD CONSTRAINT "CashMovement_cashShiftId_fkey" FOREIGN KEY ("cashShiftId") REFERENCES "CashShift"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CashMovement" ADD CONSTRAINT "CashMovement_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CashMovement" ADD CONSTRAINT "CashMovement_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "User"("id") ON UPDATE CASCADE;
ALTER TABLE "BillingInvoice" ADD CONSTRAINT "BillingInvoice_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BillingInvoice" ADD CONSTRAINT "BillingInvoice_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON UPDATE CASCADE;
ALTER TABLE "BillingInvoice" ADD CONSTRAINT "BillingInvoice_cashMovementId_fkey" FOREIGN KEY ("cashMovementId") REFERENCES "CashMovement"("id") ON UPDATE CASCADE;
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON UPDATE CASCADE;
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_assignedUserId_fkey" FOREIGN KEY ("assignedUserId") REFERENCES "User"("id") ON UPDATE CASCADE;
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- PLANES INICIALES
INSERT INTO "Plan" ("id", "code", "name", "description", "monthlyPrice", "isProTurneroEnabled", "featuresJson", "isActive", "updatedAt")
VALUES
  (gen_random_uuid()::text, 'STANDARD', 'Plan Estandar', 'Gestion clinica completa para consultorios y clinicas pequenas.', 14900, false, '["Pacientes ilimitados","Historia Clinica","Triage","Enfermeria","Caja POS","Inventario","Reportes Excel"]', true, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'FREE', 'Prueba Gratuita', 'Hasta 50 ingresos de pacientes sin costo ni tarjeta de credito.', 0, false, '["Hasta 50 pacientes","Historia Clinica","Caja POS","Soporte por email"]', true, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'PRO', 'Plan Pro', 'Todo el Plan Estandar mas Turnero Avanzado con pantalla publica.', 24900, true, '["Todo del Estandar","Turnero Avanzado","Pantalla de Llamados","Tickets Termicos","Boxes Configurables"]', true, CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO NOTHING;

-- ============================================================
-- TABLA DE CITAS / RESERVAS ONLINE Y PRESENCIALES
-- ============================================================
CREATE TABLE IF NOT EXISTS "Appointment" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "companyId" TEXT NOT NULL,
    "patientId" TEXT,
    "doctorId" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "durationMins" INTEGER NOT NULL DEFAULT 20,
    "specialty" TEXT,
    "reason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "guestName" TEXT,
    "guestPhone" TEXT,
    "guestEmail" TEXT,
    "guestDni" TEXT,
    "guestInsurance" TEXT,
    "serviceName" TEXT,
    "hasCoseguro" BOOLEAN NOT NULL DEFAULT false,
    "coseguroAmount" DOUBLE PRECISION DEFAULT 0,
    "isOnlineBooking" BOOLEAN NOT NULL DEFAULT false,
    "whatsappSent" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

-- LLAVES FORÁNEAS APPOINTMENT
ALTER TABLE "Appointment" DROP CONSTRAINT IF EXISTS "Appointment_companyId_fkey";
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Appointment" DROP CONSTRAINT IF EXISTS "Appointment_patientId_fkey";
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Appointment" DROP CONSTRAINT IF EXISTS "Appointment_doctorId_fkey";
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Appointment" DROP CONSTRAINT IF EXISTS "Appointment_createdById_fkey";
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- COLUMNAS ADICIONALES EN COMPANY
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "ticketHeader" TEXT;
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "ticketFooter" TEXT;
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "ticketConfigJson" TEXT DEFAULT '{}';
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "slug" TEXT;
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "onlineBookingEnabled" BOOLEAN DEFAULT true;
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "onlineServicesJson" TEXT DEFAULT '[]';
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "whatsappConfigJson" TEXT DEFAULT '{}';

-- COLUMNAS ADICIONALES EN USER
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "matricula" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "specialty" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "shiftHours" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "workDays" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "dni" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "area" TEXT;

