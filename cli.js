import { generateReport } from "./src/main.js";

try {
  const output = await generateReport();
  console.log(JSON.stringify(output, null, 2));
} catch (err) {
  console.error("Fatal error:", err?.message || err);
  process.exit(1);
}
