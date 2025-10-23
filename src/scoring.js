export function parseBloodPressure(bp) {
  if (bp == null) return { sys: null, dia: null, valid: false };
  if (typeof bp !== "string") bp = String(bp);

  const m = bp.match(/(\d+)\s*\/\s*(\d+)/);
  if (!m) return { sys: null, dia: null, valid: false };

  const sys = Number(m[1]);
  const dia = Number(m[2]);
  if (!Number.isFinite(sys) || !Number.isFinite(dia))
    return { sys: null, dia: null, valid: false };

  return { sys, dia, valid: true };
}

export function scoreBloodPressure(bpStr) {
  const { sys, dia, valid } = parseBloodPressure(bpStr);
  if (!valid) return { score: 0, note: "invalid_bp" };

  if (sys >= 140 || dia >= 90) return { score: 3, note: "stage2" };
  if ((sys >= 130 && sys <= 139) || (dia >= 80 && dia <= 89))
    return { score: 2, note: "stage1" };
  if (sys >= 120 && sys <= 129 && dia < 80)
    return { score: 1, note: "elevated" };
  if (sys < 120 && dia < 80) return { score: 0, note: "normal" };

  return { score: 0, note: "unclassified" };
}

export function coerceNumberLoose(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return NaN;

  const m = value.replace(/[^\d.\-]/g, "").match(/-?\d+(\.\d+)?/);
  if (!m) return NaN;
  return Number(m[0]);
}

export function scoreTemperature(temp) {
  const t = coerceNumberLoose(temp);
  if (!Number.isFinite(t))
    return { score: 0, note: "invalid_temp", value: null };

  if (t <= 99.5) return { score: 0, note: "normal", value: t };
  if (t >= 99.6 && t <= 100.9)
    return { score: 1, note: "low_fever", value: t };
  if (t >= 101.0) return { score: 2, note: "high_fever", value: t };

  return { score: 0, note: "normal", value: t };
}

export function scoreAge(age) {
  const a = coerceNumberLoose(age);
  if (!Number.isFinite(a)) return { score: 0, note: "invalid_age" };
  if (a > 65) return { score: 2, note: "over_65" };
  if (a < 40) return { score: 0, note: "under_40" };
  return { score: 1, note: "between_40_65" };
}

export function computeRisk(patient) {
  const bp = scoreBloodPressure(patient.blood_pressure);
  const temp = scoreTemperature(patient.temperature);
  const age = scoreAge(patient.age);

  const total = bp.score + temp.score + age.score;

  const dataQualityIssues = [];
  if (bp.note === "invalid_bp" || bp.note === "unclassified")
    dataQualityIssues.push("bp");
  if (temp.note === "invalid_temp") dataQualityIssues.push("temperature");
  if (age.note === "invalid_age") dataQualityIssues.push("age");

  return {
    patient_id: patient.patient_id,
    total_risk: total,
    components: { bp, temperature: temp, age },
    hasDataIssues: dataQualityIssues.length > 0,
    issues: dataQualityIssues,
  };
}
