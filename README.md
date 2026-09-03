# Land Record Guardian

Build "Land Record AI" — an Intelligent Land Record Digitization & Validation System prototype for a Smart India Hackathon demo, styled as a professional blue/white government-enterprise portal.

WORKFLOW: Land Document → OCR → Information Extraction → Validation → Anomaly Detection → Confidence Score → Human Officer Verification → GIS Visualization

STACK: React frontend (no need for a separate framework debate — use Lovable's standard React/Tailwind stack) + Lovable Cloud for the database, file storage, and edge functions (server-side logic). Enable Lovable Cloud.

DATABASE — a `land_records` table with at least: id, owner, survey_no, area, village, taluka, district, land_type, mutation_no, registration_no, latitude, longitude, document (file reference), ocr_text, confidence, risk_score, status, issue, verification_status, created_at. Also store officer decisions (approve/request review/reject) with timestamps. Provide functions/queries for: insert, get by id, get all, search, compare two records, update verification status, and dashboard aggregate stats. Use parameterized queries throughout.

FILE UPLOAD — page supporting PDF, JPG, JPEG, PNG via drag-and-drop or manual select. Validate allowed extensions, file size limits, secure filenames, and reject empty/corrupted files with user-friendly errors (no stack traces). Store files in Lovable Cloud storage.

OCR MODULE (edge function) — use Lovable AI (vision-capable model) to extract raw text from the uploaded image or PDF page(s), simulating a Tesseract-style OCR step. Detect whether the upload is a PDF or image and route accordingly. Return an OCR confidence estimate. Display the OCR text in a dedicated preview panel on the upload result page. Structure this as a clearly separated module so it could later be swapped for PaddleOCR/EasyOCR/multilingual OCR.

INFORMATION EXTRACTION (separate module from OCR) — rule-based/regex extraction of: Owner Name, Survey/Khasra/Khata Number, Land Area, Village, Taluka/Tehsil, District, Land Type, Mutation Number, Registration Number. Keep this cleanly separated so it could later be replaced by an NER/transformer model.

VALIDATION ENGINE (separate module) — detect: missing mandatory fields; owner mismatch between records sharing a survey number; area mismatch (report the numeric difference); duplicate records (same survey number + owner + similar area + location). For each check produce a clear human-readable explanation (not generic "AI detected anomaly" — spell out exactly which fields conflict with which other record and by how much).

FUZZY NAME MATCHING (separate module) — implement fuzzy string similarity for owner names (e.g. "Rahul Patil" vs "Rahul Paatil" vs "R. Patil") using a suitable JS fuzzy-matching approach equivalent to RapidFuzz. Show a similarity percentage and label uncertain matches "Potential Match" for human review — never auto-declare identity.

CONFIDENCE SCORE — combine OCR confidence, field-extraction confidence, and validation confidence into an overall 0-100% score shown with a progress bar and status label: 90-100 High Confidence, 70-89 Medium Confidence, <70 Low Confidence. Low-confidence records are automatically routed to human review.

RISK / ANOMALY SCORE — weighted scoring (e.g. missing field +20, owner mismatch +30, area mismatch +30, duplicate +25, low OCR confidence +20), normalized to 0-100, labeled LOW/MEDIUM/HIGH RISK, with the specific contributing reasons listed.

EXPLAINABLE AI — every flagged record must show a numbered list of concrete reasons it was flagged (e.g. "Survey number matches Record #12", "Owner name similarity is only 68%", "Land area differs by 0.40 hectares", "OCR confidence is 72%").

SIDE-BY-SIDE COMPARISON PAGE — pick two records and show them side by side with a field-by-field AI comparison (✓ MATCH / ⚠ MISMATCH badges), a plain-language discrepancy summary, and officer action buttons: Approve / Request Manual Review / Reject. Visually highlight mismatching fields.

HUMAN-IN-THE-LOOP VERIFICATION — records with detected anomalies get status "Review Required" and must never be auto-approved. Officers can Approve / Request Manual Review / Reject from the record and comparison pages; store the decision. Show AI Recommendation, Officer Decision, and final Verification Status distinctly on each record.

DASHBOARD (main landing page) — sidebar with Dashboard, Upload Document, Land Records, Validation, GIS Map, Verification. Top nav. Cards for: Total Land Records, Successfully Verified Records, Records Requiring Review, Detected Anomalies, Officer Approved Records. A Recent Records table, a Recent Alerts panel, a Quick Upload button, and a GIS Map button. Add charts (Chart.js or equivalent): Verified vs Review Required, Risk distribution, Records by status, Anomaly types. Professional government blue/white theme, responsive, with status badges, progress bars, alerts, and modals where useful — should look like a real land-record intelligence portal, not a basic CRUD app.

LAND RECORDS PAGE — searchable/filterable table: search by Owner Name, Survey Number, Village, District; filter by Verified / Review Required / High Risk / Approved / Rejected.

GIS MAP PAGE — Leaflet.js + OpenStreetMap. Plot land records as markers using sample coordinates around Pune/Wagholi, clearly labeled as demo/sample data. Different marker styling per status: Verified, Under Review, High Risk, Rejected. Clicking a marker shows Owner, Survey Number, Area, Village, Status, Risk Score, and a "View Record" button linking to the record page.

SAMPLE DATA — seed at least 10 realistic land records around Wagholi/Haveli/Pune, intentionally including: a clean verified record, an area-mismatch pair (same survey no, 2.50 ha vs 2.10 ha), an owner-mismatch pair (same survey no, "Rahul Patil" vs "Ramesh Patil"), a duplicate record, a record with a missing field, a low-confidence record, and owner name spelling variants (e.g. "Rahul Patil" / "Rahul Paatil" / "R. Patil") to demonstrate fuzzy matching.

FUTURE AI ARCHITECTURE — structure OCR, extraction, fuzzy matching, validation, and risk scoring as clearly separate, swappable modules with comments/interfaces noting where PaddleOCR/EasyOCR multilingual OCR, NER, transformer-based document understanding, ML-based anomaly detection, and a human feedback loop could plug in later. Do not present any of the current rule-based logic as if it were machine learning.

Make sure every page, route, and button is fully wired up with no placeholder or dead-end functionality — this needs to be demo-ready for a hackathon presentation end to end: dashboard → upload → OCR preview → extraction → validation/anomaly detection → confidence & risk scores → explainable flags → side-by-side comparison → officer approve/reject/review → status update → GIS map → dashboard stats refresh.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/39c70123-62b9-49c8-8843-ad9178779412).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
