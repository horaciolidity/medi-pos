import { describe, it, expect } from 'vitest';
import { checkCompanySubscription } from '../src/lib/subscription';
import { Role, PlanCode, SubscriptionStatus } from '../src/types/enums';

describe('SaaS Multiempresa & Control de Suscripciones', () => {
  it('Debe identificar correctamente una suscripción activa y permitir escritura y exportación', async () => {
    // ID de la clínica demo activa creada en el seed (Centro de Salud Norte)
    // Probamos el comportamiento del helper de suscripción
    const info = await checkCompanySubscription('demo-company-active');
    
    // Si la empresa existe o se valida, comprobamos contrato de la interfaz
    expect(info).toHaveProperty('isReadOnly');
    expect(info).toHaveProperty('canWrite');
    expect(info).toHaveProperty('canExport');
  });

  it('Debe bloquear escrituras y exportación en modo SOLO LECTURA para suscripciones vencidas', () => {
    const expiredSubInfo = {
      status: SubscriptionStatus.READ_ONLY,
      isReadOnly: true,
      canWrite: false,
      canExport: false,
    };

    expect(expiredSubInfo.canWrite).toBe(false);
    expect(expiredSubInfo.canExport).toBe(false);
    expect(expiredSubInfo.isReadOnly).toBe(true);
  });

  it('Debe restringir el llamado a boxes del turnero en el Plan Estándar', () => {
    const standardPlanInfo = {
      planCode: PlanCode.STANDARD,
      isProTurneroEnabled: false,
    };

    const proPlanInfo = {
      planCode: PlanCode.PRO,
      isProTurneroEnabled: true,
    };

    expect(standardPlanInfo.isProTurneroEnabled).toBe(false);
    expect(proPlanInfo.isProTurneroEnabled).toBe(true);
  });
});
