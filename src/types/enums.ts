export enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  RECEPCION = 'RECEPCION',
  MEDICO = 'MEDICO',
  ENFERMERIA = 'ENFERMERIA',
  FARMACIA = 'FARMACIA',
  CAJA = 'CAJA',
  ADMINISTRATIVO = 'ADMINISTRATIVO',
  LIMPIEZA = 'LIMPIEZA',
  AUDITOR = 'AUDITOR',
  CUSTOM = 'CUSTOM',
}

export enum PlanCode {
  STANDARD = 'STANDARD',
  PRO = 'PRO',
}

export enum SubscriptionStatus {
  TRIAL = 'TRIAL',
  ACTIVE = 'ACTIVE',
  PAST_DUE = 'PAST_DUE',
  READ_ONLY = 'READ_ONLY',
  SUSPENDED = 'SUSPENDED',
  CANCELED = 'CANCELED',
}

export enum TriagePriority {
  RED = 'RED',
  ORANGE = 'ORANGE',
  YELLOW = 'YELLOW',
  GREEN = 'GREEN',
  BLUE = 'BLUE',
}

export enum TurnoStatus {
  WAITING = 'WAITING',
  CALLED = 'CALLED',
  IN_ATTENTION = 'IN_ATTENTION',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum StockMovementType {
  ENTRY = 'ENTRY',
  EXIT = 'EXIT',
  ADJUSTMENT = 'ADJUSTMENT',
}

export enum CashShiftStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
}

export enum PaymentMethod {
  CASH = 'CASH',
  DEBIT_CARD = 'DEBIT_CARD',
  CREDIT_CARD = 'CREDIT_CARD',
  TRANSFER = 'TRANSFER',
  MERCADOPAGO = 'MERCADOPAGO',
}

export enum InvoiceType {
  FACTURA_A = 'FACTURA_A',
  FACTURA_B = 'FACTURA_B',
  FACTURA_C = 'FACTURA_C',
  COMPROBANTE_X = 'COMPROBANTE_X',
}

export enum FiscalStatus {
  DRAFT = 'DRAFT',
  AUTHORIZED_SIMULATED = 'AUTHORIZED_SIMULATED',
  AUTHORIZED_ARCA = 'AUTHORIZED_ARCA',
  REJECTED = 'REJECTED',
}

export enum IncidentPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum IncidentStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
}
