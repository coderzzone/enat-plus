// Pregnancy calculation utility adhering to Ethiopian maternal healthcare standards & clinical rules

export interface PregnancyCalculation {
  lmpDate: string;
  cycleLength: number;
  clinicianConfirmedEdd?: string | null;
  edd: string;
  isClinicianConfirmed: boolean;
  totalDays: number;
  weeks: number;
  days: number;
  trimester: 1 | 2 | 3;
  progressPercent: number;
  formattedEdd: string;
}

export function calculatePregnancy(
  lmpDateStr: string,
  cycleLength = 28,
  clinicianConfirmedEdd?: string | null
): PregnancyCalculation {
  const lmp = new Date(lmpDateStr);
  const today = new Date();

  // Reset hours to midnight UTC for consistent day calculations
  const lmpUtc = Date.UTC(lmp.getFullYear(), lmp.getMonth(), lmp.getDate());
  const todayUtc = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());

  const daysSinceLmp = Math.max(0, Math.floor((todayUtc - lmpUtc) / (1000 * 60 * 60 * 24)));
  const weeks = Math.min(42, Math.floor(daysSinceLmp / 7));
  const days = daysSinceLmp % 7;

  // Determine Trimester: 1 = weeks 1-13, 2 = 14-27, 3 = 28+
  let trimester: 1 | 2 | 3 = 1;
  if (weeks >= 28) {
    trimester = 3;
  } else if (weeks >= 14) {
    trimester = 2;
  } else {
    trimester = 1;
  }

  // Calculate EDD
  let eddDate: Date;
  const isClinicianConfirmed = Boolean(clinicianConfirmedEdd);

  if (clinicianConfirmedEdd) {
    eddDate = new Date(clinicianConfirmedEdd);
  } else {
    // Naegele's rule adjusted for cycle length: LMP + 280 days + (cycleLength - 28)
    const cycleAdjustment = (cycleLength - 28);
    const eddTime = lmpUtc + (280 + cycleAdjustment) * (1000 * 60 * 60 * 24);
    eddDate = new Date(eddTime);
  }

  const eddIso = eddDate.toISOString().split('T')[0];
  const formattedEdd = eddDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  // Progress through standard 40 weeks (280 days)
  const progressPercent = Math.min(100, Math.max(0, Math.round((daysSinceLmp / 280) * 100)));

  return {
    lmpDate: lmpDateStr,
    cycleLength,
    clinicianConfirmedEdd,
    edd: eddIso,
    isClinicianConfirmed,
    totalDays: daysSinceLmp,
    weeks,
    days,
    trimester,
    progressPercent,
    formattedEdd,
  };
}

export const SAFETY_DISCLAIMER =
  "Enat Plus provides general information and does not replace advice from your healthcare professional. If you feel unwell or have warning signs, contact your clinic or go to the nearest health facility.";

export const CLINICAL_ESTIMATE_NOTE =
  "Estimates may change after a clinical assessment.";
