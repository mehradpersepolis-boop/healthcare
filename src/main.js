import { iteratePatients } from "./patients.js";
import { computeRisk } from "./scoring.js";

export async function generateReport() {
  const results = [];
  for await (const p of iteratePatients()) {
    const scored = computeRisk(p);
    results.push({ patient: p, scored });
  }

  // Build alert lists
  const highRisk = [];
  const fever = [];
  const dataIssues = [];

  for (const { patient, scored } of results) {
    if (scored.total_risk >= 4) highRisk.push(patient.patient_id);
    const t = scored.components.temperature.value;
    if (typeof t === "number" && t >= 99.6) fever.push(patient.patient_id);
    if (scored.hasDataIssues) dataIssues.push(patient.patient_id);
  }

  const uniq = (arr) => Array.from(new Set(arr));

  return {
    summary: {
      total_patients: results.length,
    },
    alert_lists: {
      high_risk_patients: uniq(highRisk).sort(),
      fever_patients: uniq(fever).sort(),
      data_quality_issues: uniq(dataIssues).sort(),
    },
    sample_scored: results.slice(0, 5).map(({ patient, scored }) => ({
      patient_id: patient.patient_id,
      age: patient.age,
      bp: patient.blood_pressure,
      temperature: patient.temperature,
      total_risk: scored.total_risk,
      details: scored.components,
      issues: scored.issues,
    })),
  };
}
