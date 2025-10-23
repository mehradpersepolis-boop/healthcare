import {
  BASE_URL,
  PAGE_LIMIT,
  MAX_PAGES_SAFE_GUARD,
} from "./config.js";
import { fetchWithRetry } from "./http.js";
import { sleep } from "./backoff.js";

export async function* iteratePatients() {
  let page = 1;

  while (page <= MAX_PAGES_SAFE_GUARD) {
    const url = new URL(`${BASE_URL}/patients`);
    url.searchParams.set("page", String(page));
    url.searchParams.set("limit", String(PAGE_LIMIT));

    const json = await fetchWithRetry(url.toString(), { method: "GET" });

    const data = Array.isArray(json?.data) ? json.data : [];
    for (const item of data) {
      yield normalizePatient(item);
    }

    const hasNext =
      json?.pagination?.hasNext ??
      (typeof json?.pagination?.page === "number" &&
        typeof json?.pagination?.totalPages === "number" &&
        json.pagination.page < json.pagination.totalPages);

    if (!hasNext) break;
    page += 1;

    await sleep(150);
  }
}

export function normalizePatient(raw) {
  const patient_id =
    raw?.patient_id ??
    raw?.patientId ??
    raw?.id ??
    raw?.ID ??
    raw?.Id ??
    String(raw?.name || "UNKNOWN").replace(/\s+/g, "_");

  return {
    patient_id,
    name: raw?.name ?? null,
    age: raw?.age ?? raw?.Age ?? null,
    gender: raw?.gender ?? raw?.sex ?? null,
    blood_pressure:
      raw?.blood_pressure ?? raw?.bp ?? raw?.bloodPressure ?? null,
    temperature: raw?.temperature ?? raw?.temp ?? null,
    visit_date: raw?.visit_date ?? raw?.visitDate ?? null,
    diagnosis: raw?.diagnosis ?? null,
    medications: raw?.medications ?? raw?.meds ?? null,
  };
}
