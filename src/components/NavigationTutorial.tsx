'use client';

import { useState, useEffect } from 'react';
import {
  HelpCircle,
  X,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Stethoscope,
  HeartPulse,
  Clock,
  CalendarDays,
  Users,
  ShoppingCart,
  Sliders,
  CheckCircle2,
  Phone,
  MessageCircle,
  Shield,
  RotateCcw
} from 'lucide-react';

interface TutorialProps {
  userRole?: string;
  userName?: string;
}

export default function NavigationTutorial({ userRole = 'ADMIN', userName = '' }: TutorialProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(0);

  const role = userRole.toUpperCase();

  // Lista de pasos del tutorial adaptados a la plataforma
  const steps = [
    {
      title: `¡Bienvenido a Clinic POS${userName ? `, ${userName}` : ''}!`,
      badge: `Tu Rol: ${role}`,
      icon: Sparkles,
      iconColor: 'text-sky-400 bg-sky-500/10 border-sky-500/30',
      description:
        'Clinic POS es el sistema integral de gestión clínica y POS. Cada miembro del equipo cuenta con acceso independiente y verá únicamente los módulos autorizados para su área.',
      details: [
        '🔐 Inicio de sesión seguro individual para médicos, enfermeros, recepción y administración.',
        '🏢 El panel lateral se adapta automáticamente a tu especialidad y funciones diarias.',
        '📱 Los pacientes cuentan con un enlace público para reservar turnos online con notificación a WhatsApp.',
      ],
    },
    {
      title: 'Pacientes & Historia Clínica (EHR)',
      badge: 'Atención Médica & Procedimientos',
      icon: Stethoscope,
      iconColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
      description:
        'En la sección "Pacientes & H.C." se concentra toda la información clínica y de filiación del paciente:',
      details: [
        '📋 Registro y edición rápida de pacientes con DNI, teléfono y cobertura médica.',
        '🩺 Los Médicos registran consultas, diagnósticos, indicaciones y tratamientos en la Historia Clínica longitudinal.',
        '💉 Enfermería registra signos vitales (presión, saturación, pulso) y procedimientos aplicados sin duplicidad.',
      ],
    },
    {
      title: 'Turnos, Reservas & WhatsApp',
      badge: 'Agenda & Sala de Espera',
      icon: CalendarDays,
      iconColor: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
      description:
        'Gestioná la agenda médica y permití que los pacientes reserven de forma autónoma:',
      details: [
        '📅 Turnos Programados: Agenda organizada por fecha y por médico con estados en tiempo real.',
        '🌐 Portal Online (/turnos-online): Enlace público para que los pacientes saquen turno desde su celular.',
        '💬 Notificación automática por WhatsApp con los datos del turno, coseguro a abonar y dirección.',
      ],
    },
    {
      title: 'Caja POS & Facturación',
      badge: 'Cobros y Comprobantes',
      icon: ShoppingCart,
      iconColor: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
      description:
        'Cobro de consultas, insumos de farmacia, copagos y coseguros:',
      details: [
        '💵 Caja rápida con control de turnos de caja, arqueos y cobro de coseguros.',
        '🧾 Impresión térmica en formatos estándar de 80mm y 58mm para tickets de atención.',
        '📑 Módulo de facturación electrónica compatible con normativas fiscales.',
      ],
    },
    {
      title: 'Ajustes del Sistema & Personal',
      badge: 'Configuración Administrativa',
      icon: Sliders,
      iconColor: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
      description:
        'Configurá tu clínica y los accesos de tu equipo desde "Ajustes":',
      details: [
        '👥 Personal & Accesos: Creá médicos, enfermeros y secretarios asignándoles usuario y contraseña.',
        '⚙️ Servicios Online: Definí qué especialidades llevan coseguro y sus importes.',
        '🎫 Formato de Ticket: Personalizá el encabezado, pie y tamaño de impresión de tus tickets.',
      ],
    },
  ];

  // Auto-lanzar si es la primera vez que visita la plataforma
  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem('clinicpos_tutorial_completed_v1');
    if (!hasSeenTutorial) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem('clinicpos_tutorial_completed_v1', 'true');
    setIsOpen(false);
  };

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      handleClose();
    }
  };

  const handlePrev = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleReopen = () => {
    setStep(0);
    setIsOpen(true);
  };

  const currentStep = steps[step];
  const StepIcon = currentStep.icon;

  return (
    <>
      {/* Mini Botón Flotante para repetir o ver el Tutorial en cualquier momento */}
      <button
        onClick={handleReopen}
        className="fixed bottom-4 right-4 z-40 bg-slate-900/90 hover:bg-slate-800 text-sky-400 border border-slate-700 hover:border-sky-500/50 px-3.5 py-2 rounded-2xl text-xs font-bold shadow-2xl backdrop-blur-md flex items-center gap-2 transition-all hover:scale-105 group"
        title="Ver Tutorial de Navegación"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
        </span>
        <HelpCircle className="w-4 h-4 text-sky-400 group-hover:rotate-12 transition-transform" />
        <span className="text-white font-semibold">Tutorial de Navegación</span>
      </button>

      {/* Modal Interactivo del Tutorial */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700/80 w-full max-w-lg rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl text-white relative animate-in zoom-in-95 duration-200">
            {/* Header del Modal */}
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-2xl border ${currentStep.iconColor}`}>
                  <StepIcon className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-sky-400 font-bold block">
                    {currentStep.badge}
                  </span>
                  <h3 className="text-lg font-black text-white">{currentStep.title}</h3>
                </div>
              </div>

              <button
                onClick={handleClose}
                className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition-colors"
                title="Cerrar tutorial"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Contenido del paso actual */}
            <div className="space-y-4">
              <p className="text-xs text-slate-300 leading-relaxed font-medium">
                {currentStep.description}
              </p>

              <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 space-y-2.5">
                {currentStep.details.map((detail, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-300">
                    <span className="text-sm shrink-0 leading-none mt-0.5">🔹</span>
                    <span>{detail}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Barra de progreso e indicadores de pasos */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <div className="flex items-center gap-1.5">
                {steps.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setStep(i)}
                    className={`h-2 rounded-full transition-all ${
                      i === step
                        ? 'w-6 bg-sky-400'
                        : i < step
                        ? 'w-2 bg-sky-700'
                        : 'w-2 bg-slate-800'
                    }`}
                    title={`Paso ${i + 1}`}
                  />
                ))}
                <span className="text-[10px] text-slate-500 font-mono ml-2">
                  {step + 1} / {steps.length}
                </span>
              </div>

              {/* Botones de navegación */}
              <div className="flex items-center gap-2">
                {step > 0 && (
                  <button
                    type="button"
                    onClick={handlePrev}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 transition-colors flex items-center gap-1"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Atrás</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleNext}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-slate-950 bg-sky-400 hover:bg-sky-300 transition-all flex items-center gap-1 shadow-lg shadow-sky-500/20"
                >
                  <span>{step === steps.length - 1 ? '¡Entendido, Comenzar!' : 'Siguiente'}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
