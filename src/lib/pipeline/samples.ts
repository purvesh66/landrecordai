/**
 * MODULE: Demo sample documents.
 *
 * These are realistic 7/12-extract transcriptions used to demonstrate the
 * portal without sourcing scans externally. They are injected at the OCR
 * boundary: the OCR stage is replaced by a fixed transcription + legibility
 * score, and every later stage (extraction -> validation -> scoring -> audit
 * -> officer verification) runs exactly as it does for a real upload.
 *
 * Shared by the client (sample cards) and the server function, so the ids and
 * text can never drift apart.
 */

export type SampleScenario =
  | "clean"
  | "owner"
  | "area"
  | "duplicate"
  | "missing"
  | "lowocr"
  | "units"
  | "fuzzy"
  | "hindi"
  | "marathi";

export type SampleDocument = {
  id: SampleScenario;
  /** Filename recorded on the created record — always marked as a demo sample. */
  filename: string;
  /** Legibility score fed into the confidence model in place of a real OCR score. */
  ocrConfidence: number;
  text: string;
};

export const SAMPLE_DOCUMENTS: SampleDocument[] = [
  {
    id: "clean",
    filename: "DEMO_SAMPLE_clean_7-12_extract.txt",
    ocrConfidence: 96,
    text: `VILLAGE FORM VII-XII (7/12 EXTRACT)
Office of the Talathi, Saza Wagholi
Owner Name: Nilesh Bhagwat Wagh
Survey No: 826/3
Area: 1.48 hectares
Village: Wagholi
Taluka: Haveli
District: Pune
Land Type: Agricultural
Mutation No: MUT-826-3-2025
Registration No: REG/PUN/2025/8263
Crop: Sugarcane | Irrigation: Well
No encumbrance recorded.`,
  },
  {
    id: "owner",
    filename: "DEMO_SAMPLE_owner_conflict.txt",
    ocrConfidence: 92,
    text: `VILLAGE FORM VII-XII (7/12 EXTRACT)
Owner Name: Sunita More
Survey No: 118/2
Area: 1.35 hectares
Village: Wagholi
Taluka: Haveli
District: Pune
Land Type: Agricultural
Mutation No: MUT-118-2-2026
Registration No: REG/PUN/2026/1182
Note: transfer claimed on the basis of a 2019 sale deed.`,
  },
  {
    id: "area",
    filename: "DEMO_SAMPLE_area_conflict.txt",
    ocrConfidence: 93,
    text: `VILLAGE FORM VII-XII (7/12 EXTRACT)
Owner Name: Jyoti Rane
Survey No: 610/4
Area: 3.40 hectares
Village: Kesnand
Taluka: Haveli
District: Pune
Land Type: Agricultural
Mutation No: MUT-610-4-2026
Registration No: REG/PUN/2026/6104`,
  },
  {
    id: "duplicate",
    filename: "DEMO_SAMPLE_duplicate_entry.txt",
    ocrConfidence: 95,
    text: `VILLAGE FORM VII-XII (7/12 EXTRACT)
Owner Name: Jyoti Rane
Survey No: 610/4
Area: 2.75 hectares
Village: Kesnand
Taluka: Haveli
District: Pune
Land Type: Agricultural
Mutation No: MUT-610-4-2024
Registration No: REG/PUN/2024/6104`,
  },
  {
    id: "missing",
    filename: "DEMO_SAMPLE_missing_fields.txt",
    ocrConfidence: 74,
    text: `VILLAGE FORM VII-XII (7/12 EXTRACT)
Owner Name: Balasaheb Jagtap
Survey No: 233/9
Area: [torn — not legible]
Village: [torn — not legible]
Taluka: Haveli
District: Pune
Land Type: Agricultural
Registration No: REG/PUN/2025/2339`,
  },
  {
    id: "lowocr",
    filename: "DEMO_SAMPLE_poor_scan.txt",
    ocrConfidence: 41,
    text: `VlLLAGE F0RM Vll-Xll (7/l2 EXTRAOT)
0wner Narne: Kishor Barnble
Survey N0: 4O7/2
Area: O.92 hectores
Vlllage: Wagholi
Taluka: Havell
Dlstrict: Pune
Land Type: Agricultura1
Mutatlon No: MUT-4O7-2-2O25
Reglstration No: REG/PUN/2O25/4O72`,
  },
  {
    id: "units",
    filename: "DEMO_SAMPLE_area_in_acres.txt",
    ocrConfidence: 90,
    text: `VILLAGE FORM VII-XII (7/12 EXTRACT)
Owner Name: Sheetal Kulkarni
Survey No: 89/4
Area: 7.91 acre
Area: 3.20 hectares (converted by the Talathi office)
Village: Lohegaon
Taluka: Haveli
District: Pune
Land Type: Agricultural
Mutation No: MUT-89-4-2026
Registration No: REG/PUN/2026/0894`,
  },
  {
    id: "fuzzy",
    filename: "DEMO_SAMPLE_fuzzy_owner_name.txt",
    ocrConfidence: 88,
    text: `VILLAGE FORM VII-XII (7/12 EXTRACT)
Khatedar: R. Patil
Khasra No: 340/2
Area: 1.60 hectares
Village: Wagholi
Taluka: Haveli
District: Pune
Land Type: Agricultural
Mutation No: MUT-340-2-2026
Registration No: REG/PUN/2026/3402`,
  },
  {
    id: "hindi",
    filename: "DEMO_SAMPLE_hindi_extract.txt",
    ocrConfidence: 87,
    text: `ग्राम नमूना सात-बारह (7/12 उतारा)
मालक: अनिल रामचंद्र शिंदे
Owner Name: Anil Ramchandra Shinde
सर्वे क्रमांक / Survey No: 512/8
क्षेत्र / Area: 2.05 hectares
गाव / Village: Kharadi
तालुका / Taluka: Haveli
जिला / District: Pune
भूमि प्रकार / Land Type: Agricultural
फेरफार / Mutation No: MUT-512-8-2026
पंजीकरण / Registration No: REG/PUN/2026/5128`,
  },
  {
    id: "marathi",
    filename: "DEMO_SAMPLE_marathi_extract.txt",
    ocrConfidence: 85,
    text: `गाव नमुना सात-बारा (7/12 उतारा)
मालक: सुरेखा दत्तात्रय गायकवाड
Owner Name: Surekha Dattatray Gaikwad
सर्व्हे क्रमांक / Survey No: 145/11
क्षेत्र / Area: 0.74 hectares
गाव / Village: Lohegaon
तालुका / Taluka: Haveli
जिल्हा / District: Pune
जमिनीचा प्रकार / Land Type: Agricultural
फेरफार / Mutation No: MUT-145-11-2026
नोंदणी / Registration No: REG/PUN/2026/14511`,
  },
];

export function findSample(id: string): SampleDocument | undefined {
  return SAMPLE_DOCUMENTS.find((sample) => sample.id === id);
}
