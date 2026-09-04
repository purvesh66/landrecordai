/**
 * Centralised i18n for the Land Record AI portal.
 *
 * - One dictionary per language (English / Hindi / Marathi).
 * - `t(key, vars)` interpolates {name} placeholders and falls back to English,
 *   then to the raw key, so a missing translation never blanks the UI.
 * - The selection is persisted in localStorage and applied to <html lang>.
 *
 * Only interface text, headings, status labels and generated explanations are
 * localised. Raw OCR text and extracted source values are never translated.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { enExtra, hiExtra, mrExtra } from "./i18n-extra";

export type Lang = "en" | "hi" | "mr";

export const LANGUAGES: { code: Lang; label: string; short: string }[] = [
  { code: "en", label: "English", short: "EN" },
  { code: "hi", label: "हिंदी", short: "हि" },
  { code: "mr", label: "मराठी", short: "मरा" },
];

const STORAGE_KEY = "lrai.lang";

const en = {
  "nav.dashboard": "Dashboard",
  "nav.upload": "Upload Document",
  "nav.records": "Land Records",
  "nav.validation": "Validation",
  "nav.analytics": "Validation Intelligence",
  "nav.compare": "Compare Records",
  "nav.gis": "GIS Map",
  "nav.verification": "Verification",

  "shell.brand": "Land Record AI",
  "shell.tagline": "Intelligent Land Record Digitization & Validation",
  "shell.badgeDemo": "Prototype · Demo Data",
  "shell.badgeOfficer": "Officer: Demo Officer",
  "shell.advisory":
    "All AI outputs are advisory. Flagged records are never auto-approved — a revenue officer makes the final decision.",
  "shell.toggleNav": "Toggle navigation",
  "shell.language": "Language",

  "common.loading": "Loading…",
  "common.all": "All",
  "common.owner": "Owner",
  "common.surveyNo": "Survey No.",
  "common.village": "Village",
  "common.taluka": "Taluka",
  "common.district": "District",
  "common.location": "Location",
  "common.area": "Area (ha)",
  "common.confidence": "Confidence",
  "common.risk": "Risk",
  "common.status": "Status",
  "common.officer": "Officer",
  "common.timestamp": "Timestamp",
  "common.recordId": "Record ID",
  "common.viewAll": "View all",
  "common.open": "Open",
  "common.compare": "Compare",
  "common.reset": "Reset filters",
  "common.notAvailable": "Not available",
  "common.unknownOwner": "Unknown owner",
  "common.none": "—",

  "status.Verified": "Verified",
  "status.Approved": "Approved",
  "status.Review Required": "Review Required",
  "status.Rejected": "Rejected",
  "status.Pending": "Pending",
  "status.High Risk": "High Risk",

  "risk.LOW RISK": "LOW RISK",
  "risk.MEDIUM RISK": "MEDIUM RISK",
  "risk.HIGH RISK": "HIGH RISK",
  "conf.High Confidence": "High Confidence",
  "conf.Medium Confidence": "Medium Confidence",
  "conf.Low Confidence": "Low Confidence",

  "anomaly.missing": "Missing Information",
  "anomaly.owner": "Owner Mismatch",
  "anomaly.area": "Area Mismatch",
  "anomaly.duplicate": "Possible Duplicate",
  "anomaly.ocr": "Low OCR Confidence",

  "dash.title": "Dashboard",
  "dash.subtitle":
    "Intelligent Land Record Digitization & Validation System — demo dataset (Wagholi / Haveli, Pune)",
  "dash.quickUpload": "Quick Upload",
  "dash.gisMap": "GIS Map",
  "dash.total": "Total Land Records",
  "dash.verified": "Successfully Verified",
  "dash.review": "Requiring Review",
  "dash.anomalies": "Detected Anomalies",
  "dash.approved": "Officer Approved",
  "dash.chartVerified": "Verified vs Review Required",
  "dash.chartRisk": "Risk Score Distribution",
  "dash.chartStatus": "Records by Processing Status",
  "dash.chartAnomaly": "Anomaly Types Detected",
  "dash.recent": "Recent Records",
  "dash.alerts": "Recent Alerts",
  "dash.noAlerts": "No open anomalies.",
  "dash.loadingRecords": "Loading records…",

  "val.title": "Validation & Anomaly Detection",
  "val.subtitle":
    "Deterministic rule-based checks — missing mandatory fields, owner mismatch, area mismatch, duplicates and low OCR confidence. No result here is machine-learned.",
  "val.running": "Running validation…",
  "val.noAnomalies": "No anomalies detected in the register.",
  "val.openAnalytics": "Open Validation Intelligence",
  "val.aiRecommendation": "AI recommendation",
  "val.openFull": "Open full record →",
  "val.whyFlagged": "Why this record was flagged ({count})",
  "val.clean":
    "No anomalies were detected. All mandatory fields were present, the survey number is unique in the register and the text extraction was clear.",

  "an.title": "Validation Intelligence",
  "an.subtitle":
    "Validation outcomes and rule-based mismatch categories over time for Pune district and Wagholi village. These are deterministic rule outcomes, not machine-learned predictions.",
  "an.demoNote":
    "Demo geography: records use simulated Wagholi / Haveli, Pune coordinates and sample officer decisions.",
  "an.filters": "Filters",
  "an.scope": "Location scope",
  "an.scopeAll": "All relevant records",
  "an.scopePune": "Pune district",
  "an.scopeWagholi": "Wagholi village",
  "an.officer": "Officer",
  "an.allOfficers": "All officers",
  "an.unassigned": "Unassigned (System)",
  "an.confBand": "Confidence band",
  "an.confHigh": "High (90–100)",
  "an.confMedium": "Medium (70–89)",
  "an.confLow": "Low (< 70)",
  "an.anomalyType": "Anomaly type",
  "an.statusFilter": "Verification status",
  "an.dateRange": "Date range",
  "an.from": "From",
  "an.to": "To",
  "an.granularity": "Time granularity",
  "an.daily": "Daily",
  "an.weekly": "Weekly",
  "an.monthly": "Monthly",
  "an.filteredNote": "All KPIs, charts and the table below reflect the {count} record(s) matching the current filters.",
  "an.kpiTotal": "Total Processed",
  "an.kpiVerified": "Verified / Approved",
  "an.kpiReview": "Review Required",
  "an.kpiRejected": "Rejected",
  "an.kpiAnomalyRate": "Anomaly Rate",
  "an.kpiAvgConf": "Average Confidence",
  "an.kpiAvgRisk": "Average Risk",
  "an.kpiMismatch": "Mismatch Count",
  "an.chartTime": "Validation outcomes over time",
  "an.chartMismatch": "Mismatch categories",
  "an.chartMismatchHint": "Click a category to filter the whole view by it.",
  "an.chartConf": "Confidence band distribution",
  "an.chartRisk": "Risk distribution",
  "an.chartOfficer": "Officer outcome breakdown",
  "an.reviewed": "Reviewed",
  "an.approved": "Approved",
  "an.rejected": "Rejected",
  "an.pending": "Pending",
  "an.anomalies": "Anomalies",
  "an.records": "Records",
  "an.tableTitle": "Filtered validation outcomes",
  "an.anomalyCategory": "Anomaly category / issue",
  "an.emptyTitle": "No records match these filters",
  "an.emptyBody": "Widen the date range or clear a filter to see validation outcomes again.",
  "an.clean": "No anomaly",

  "rec.title": "Land Records Register",
  "rec.subtitle": "Search and filter every digitized record. Click a row to open the full record.",
  "rec.search": "Search owner, survey number, village or district…",
  "rec.empty": "No records match your search.",
  "rec.count": "{count} record(s)",

  "up.title": "Upload Land Document",
  "up.subtitle":
    "PDF or image documents are validated, transcribed, extracted, cross-checked and scored before an officer reviews them.",
  "up.single": "Single Document",
  "up.bulk": "Bulk Upload",

  "ver.title": "Human-in-the-Loop Verification",
  "ver.subtitle":
    "Flagged records are never auto-approved — every status change is an explicit officer decision.",
  "ver.queue": "Pending Queue ({count})",
  "ver.empty": "The verification queue is empty.",
  "ver.log": "Officer Decision Log",

  "det.export": "Export Verification Report (PDF)",
  "det.exportShort": "Export PDF",
  "det.preparing": "Preparing PDF…",
  "det.exported": "Report downloaded: {name}",
  "det.exportFailed": "The verification report could not be generated. Please try again.",
  "det.timeline": "Audit Timeline",
  "det.timelineSubtitle": "Every processing stage and human action recorded for this record.",
  "det.timelineEmpty": "No audit events have been recorded for this record yet.",
  "det.before": "Before",
  "det.after": "After",

  "audit.upload": "Document intake",
  "audit.ocr": "OCR",
  "audit.extraction": "Extraction",
  "audit.validation": "Validation",
  "audit.score": "Scoring",
  "audit.status": "Status change",
  "audit.officer": "Officer action",

  "pdf.reportTitle": "Verification Report",
  "pdf.metadata": "Report Metadata",
  "pdf.fields": "Extracted Land Record Fields",
  "pdf.scores": "Confidence, Risk and AI Recommendation",
  "pdf.officer": "Officer Verification",
  "pdf.flags": "Explainable Validation & Anomaly Breakdown",
  "pdf.related": "Comparison References (records sharing this survey number)",
  "pdf.timeline": "Audit Timeline",
  "pdf.language": "Report language",
  "pdf.footer":
    "Land Record AI — prototype verification report. Sample/demo data; not a legal land title document.",
  "pdf.page": "Page {page} of {total}",

  ...enExtra,
};

export type TranslationKey = keyof typeof en;

const hi: Partial<Record<TranslationKey, string>> = {
  "nav.dashboard": "डैशबोर्ड",
  "nav.upload": "दस्तावेज़ अपलोड",
  "nav.records": "भूमि अभिलेख",
  "nav.validation": "सत्यापन जाँच",
  "nav.analytics": "सत्यापन विश्लेषण",
  "nav.compare": "अभिलेख तुलना",
  "nav.gis": "जीआईएस मानचित्र",
  "nav.verification": "अधिकारी सत्यापन",

  "shell.brand": "लैंड रिकॉर्ड एआई",
  "shell.tagline": "बुद्धिमान भूमि अभिलेख डिजिटलीकरण एवं सत्यापन",
  "shell.badgeDemo": "प्रोटोटाइप · डेमो डेटा",
  "shell.badgeOfficer": "अधिकारी: डेमो अधिकारी",
  "shell.advisory":
    "सभी एआई परिणाम केवल सलाहकारी हैं। चिह्नित अभिलेख स्वतः स्वीकृत नहीं होते — अंतिम निर्णय राजस्व अधिकारी लेता है।",
  "shell.toggleNav": "नेविगेशन दिखाएँ/छिपाएँ",
  "shell.language": "भाषा",

  "common.loading": "लोड हो रहा है…",
  "common.all": "सभी",
  "common.owner": "स्वामी",
  "common.surveyNo": "सर्वे क्रमांक",
  "common.village": "गाँव",
  "common.taluka": "तालुका",
  "common.district": "ज़िला",
  "common.location": "स्थान",
  "common.area": "क्षेत्रफल (हे.)",
  "common.confidence": "विश्वसनीयता",
  "common.risk": "जोखिम",
  "common.status": "स्थिति",
  "common.officer": "अधिकारी",
  "common.timestamp": "समय",
  "common.recordId": "अभिलेख आईडी",
  "common.viewAll": "सभी देखें",
  "common.open": "खोलें",
  "common.compare": "तुलना करें",
  "common.reset": "फ़िल्टर रीसेट करें",
  "common.notAvailable": "उपलब्ध नहीं",
  "common.unknownOwner": "अज्ञात स्वामी",

  "status.Verified": "सत्यापित",
  "status.Approved": "स्वीकृत",
  "status.Review Required": "समीक्षा आवश्यक",
  "status.Rejected": "अस्वीकृत",
  "status.Pending": "लंबित",
  "status.High Risk": "उच्च जोखिम",

  "risk.LOW RISK": "कम जोखिम",
  "risk.MEDIUM RISK": "मध्यम जोखिम",
  "risk.HIGH RISK": "उच्च जोखिम",
  "conf.High Confidence": "उच्च विश्वसनीयता",
  "conf.Medium Confidence": "मध्यम विश्वसनीयता",
  "conf.Low Confidence": "कम विश्वसनीयता",

  "anomaly.missing": "अनुपलब्ध जानकारी",
  "anomaly.owner": "स्वामी नाम असंगति",
  "anomaly.area": "क्षेत्रफल असंगति",
  "anomaly.duplicate": "संभावित दोहराव",
  "anomaly.ocr": "कम ओसीआर विश्वसनीयता",

  "dash.title": "डैशबोर्ड",
  "dash.subtitle":
    "बुद्धिमान भूमि अभिलेख डिजिटलीकरण एवं सत्यापन प्रणाली — डेमो डेटा (वाघोली / हवेली, पुणे)",
  "dash.quickUpload": "त्वरित अपलोड",
  "dash.gisMap": "जीआईएस मानचित्र",
  "dash.total": "कुल भूमि अभिलेख",
  "dash.verified": "सफलतापूर्वक सत्यापित",
  "dash.review": "समीक्षा आवश्यक",
  "dash.anomalies": "पहचानी गई विसंगतियाँ",
  "dash.approved": "अधिकारी द्वारा स्वीकृत",
  "dash.chartVerified": "सत्यापित बनाम समीक्षा आवश्यक",
  "dash.chartRisk": "जोखिम स्कोर वितरण",
  "dash.chartStatus": "प्रक्रिया स्थिति अनुसार अभिलेख",
  "dash.chartAnomaly": "पहचानी गई विसंगति श्रेणियाँ",
  "dash.recent": "हाल के अभिलेख",
  "dash.alerts": "हाल की चेतावनियाँ",
  "dash.noAlerts": "कोई खुली विसंगति नहीं।",
  "dash.loadingRecords": "अभिलेख लोड हो रहे हैं…",

  "val.title": "सत्यापन एवं विसंगति पहचान",
  "val.subtitle":
    "नियम-आधारित निश्चित जाँच — अनुपलब्ध अनिवार्य फ़ील्ड, स्वामी असंगति, क्षेत्रफल असंगति, दोहराव और कम ओसीआर विश्वसनीयता। यहाँ कोई परिणाम मशीन-लर्न्ड नहीं है।",
  "val.running": "सत्यापन चल रहा है…",
  "val.noAnomalies": "रजिस्टर में कोई विसंगति नहीं मिली।",
  "val.openAnalytics": "सत्यापन विश्लेषण खोलें",
  "val.aiRecommendation": "एआई अनुशंसा",
  "val.openFull": "पूरा अभिलेख खोलें →",
  "val.whyFlagged": "यह अभिलेख क्यों चिह्नित हुआ ({count})",
  "val.clean":
    "कोई विसंगति नहीं मिली। सभी अनिवार्य फ़ील्ड उपलब्ध थे, सर्वे क्रमांक रजिस्टर में अद्वितीय है और पाठ निष्कर्षण स्पष्ट रहा।",

  "an.title": "सत्यापन विश्लेषण",
  "an.subtitle":
    "पुणे ज़िला और वाघोली गाँव के लिए समयानुसार सत्यापन परिणाम और नियम-आधारित असंगति श्रेणियाँ। ये निश्चित नियम परिणाम हैं, मशीन-लर्न्ड पूर्वानुमान नहीं।",
  "an.demoNote":
    "डेमो भूगोल: अभिलेखों में वाघोली / हवेली, पुणे के अनुरूपित निर्देशांक और नमूना अधिकारी निर्णय उपयोग किए गए हैं।",
  "an.filters": "फ़िल्टर",
  "an.scope": "स्थान क्षेत्र",
  "an.scopeAll": "सभी संबंधित अभिलेख",
  "an.scopePune": "पुणे ज़िला",
  "an.scopeWagholi": "वाघोली गाँव",
  "an.officer": "अधिकारी",
  "an.allOfficers": "सभी अधिकारी",
  "an.unassigned": "अनिर्दिष्ट (सिस्टम)",
  "an.confBand": "विश्वसनीयता श्रेणी",
  "an.confHigh": "उच्च (90–100)",
  "an.confMedium": "मध्यम (70–89)",
  "an.confLow": "कम (< 70)",
  "an.anomalyType": "विसंगति प्रकार",
  "an.statusFilter": "सत्यापन स्थिति",
  "an.dateRange": "दिनांक सीमा",
  "an.from": "से",
  "an.to": "तक",
  "an.granularity": "समय अंतराल",
  "an.daily": "दैनिक",
  "an.weekly": "साप्ताहिक",
  "an.monthly": "मासिक",
  "an.filteredNote": "नीचे दिए सभी केपीआई, चार्ट और तालिका वर्तमान फ़िल्टर से मेल खाते {count} अभिलेख दर्शाते हैं।",
  "an.kpiTotal": "कुल संसाधित",
  "an.kpiVerified": "सत्यापित / स्वीकृत",
  "an.kpiReview": "समीक्षा आवश्यक",
  "an.kpiRejected": "अस्वीकृत",
  "an.kpiAnomalyRate": "विसंगति दर",
  "an.kpiAvgConf": "औसत विश्वसनीयता",
  "an.kpiAvgRisk": "औसत जोखिम",
  "an.kpiMismatch": "कुल असंगतियाँ",
  "an.chartTime": "समयानुसार सत्यापन परिणाम",
  "an.chartMismatch": "असंगति श्रेणियाँ",
  "an.chartMismatchHint": "किसी श्रेणी पर क्लिक कर पूरे दृश्य को उसी अनुसार फ़िल्टर करें।",
  "an.chartConf": "विश्वसनीयता श्रेणी वितरण",
  "an.chartRisk": "जोखिम वितरण",
  "an.chartOfficer": "अधिकारीवार परिणाम",
  "an.reviewed": "समीक्षित",
  "an.approved": "स्वीकृत",
  "an.rejected": "अस्वीकृत",
  "an.pending": "लंबित",
  "an.anomalies": "विसंगतियाँ",
  "an.records": "अभिलेख",
  "an.tableTitle": "फ़िल्टर किए गए सत्यापन परिणाम",
  "an.anomalyCategory": "विसंगति श्रेणी / समस्या",
  "an.emptyTitle": "इन फ़िल्टरों से कोई अभिलेख मेल नहीं खाता",
  "an.emptyBody": "दिनांक सीमा बढ़ाएँ या कोई फ़िल्टर हटाकर पुनः परिणाम देखें।",
  "an.clean": "कोई विसंगति नहीं",

  "rec.title": "भूमि अभिलेख रजिस्टर",
  "rec.subtitle": "हर डिजिटल अभिलेख खोजें और फ़िल्टर करें। पूरा अभिलेख खोलने के लिए पंक्ति पर क्लिक करें।",
  "rec.search": "स्वामी, सर्वे क्रमांक, गाँव या ज़िला खोजें…",
  "rec.empty": "आपकी खोज से कोई अभिलेख मेल नहीं खाता।",
  "rec.count": "{count} अभिलेख",

  "up.title": "भूमि दस्तावेज़ अपलोड",
  "up.subtitle":
    "पीडीएफ या छवि दस्तावेज़ों की जाँच, पाठ निष्कर्षण, क्रॉस-चेक और स्कोरिंग के बाद अधिकारी समीक्षा करता है।",
  "up.single": "एकल दस्तावेज़",
  "up.bulk": "बल्क अपलोड",

  "ver.title": "मानव-सहित सत्यापन",
  "ver.subtitle":
    "चिह्नित अभिलेख स्वतः स्वीकृत नहीं होते — हर स्थिति परिवर्तन अधिकारी का स्पष्ट निर्णय है।",
  "ver.queue": "लंबित सूची ({count})",
  "ver.empty": "सत्यापन सूची खाली है।",
  "ver.log": "अधिकारी निर्णय अभिलेख",

  "det.export": "सत्यापन रिपोर्ट डाउनलोड करें (पीडीएफ)",
  "det.exportShort": "पीडीएफ निर्यात",
  "det.preparing": "पीडीएफ तैयार हो रही है…",
  "det.exported": "रिपोर्ट डाउनलोड हुई: {name}",
  "det.exportFailed": "सत्यापन रिपोर्ट नहीं बन सकी। कृपया पुनः प्रयास करें।",
  "det.timeline": "ऑडिट टाइमलाइन",
  "det.timelineSubtitle": "इस अभिलेख की हर प्रक्रिया अवस्था और मानवीय कार्रवाई।",
  "det.timelineEmpty": "इस अभिलेख के लिए अभी कोई ऑडिट घटना दर्ज नहीं है।",
  "det.before": "पहले",
  "det.after": "बाद",

  "audit.upload": "दस्तावेज़ प्राप्ति",
  "audit.ocr": "ओसीआर",
  "audit.extraction": "फ़ील्ड निष्कर्षण",
  "audit.validation": "सत्यापन",
  "audit.score": "स्कोरिंग",
  "audit.status": "स्थिति परिवर्तन",
  "audit.officer": "अधिकारी कार्रवाई",

  "pdf.reportTitle": "सत्यापन रिपोर्ट",
  "pdf.metadata": "रिपोर्ट विवरण",
  "pdf.fields": "निष्कर्षित भूमि अभिलेख फ़ील्ड",
  "pdf.scores": "विश्वसनीयता, जोखिम एवं एआई अनुशंसा",
  "pdf.officer": "अधिकारी सत्यापन",
  "pdf.flags": "व्याख्यात्मक सत्यापन एवं विसंगति विवरण",
  "pdf.related": "तुलना संदर्भ (समान सर्वे क्रमांक वाले अभिलेख)",
  "pdf.timeline": "ऑडिट टाइमलाइन",
  "pdf.language": "रिपोर्ट भाषा",
  "pdf.footer":
    "लैंड रिकॉर्ड एआई — प्रोटोटाइप सत्यापन रिपोर्ट। नमूना/डेमो डेटा; यह वैध भूमि स्वामित्व दस्तावेज़ नहीं है।",
  "pdf.page": "पृष्ठ {page} / {total}",

  ...hiExtra,
};

const mr: Partial<Record<TranslationKey, string>> = {
  "nav.dashboard": "डॅशबोर्ड",
  "nav.upload": "कागदपत्र अपलोड",
  "nav.records": "भूमी अभिलेख",
  "nav.validation": "पडताळणी तपासणी",
  "nav.analytics": "पडताळणी विश्लेषण",
  "nav.compare": "अभिलेख तुलना",
  "nav.gis": "जीआयएस नकाशा",
  "nav.verification": "अधिकारी पडताळणी",

  "shell.brand": "लँड रेकॉर्ड एआय",
  "shell.tagline": "बुद्धिमान भूमी अभिलेख डिजिटायझेशन व पडताळणी",
  "shell.badgeDemo": "प्रोटोटाइप · डेमो डेटा",
  "shell.badgeOfficer": "अधिकारी: डेमो अधिकारी",
  "shell.advisory":
    "सर्व एआय निष्कर्ष केवळ सल्लागार आहेत. चिन्हांकित अभिलेख आपोआप मंजूर होत नाहीत — अंतिम निर्णय महसूल अधिकारी घेतो.",
  "shell.toggleNav": "नेव्हिगेशन दाखवा/लपवा",
  "shell.language": "भाषा",

  "common.loading": "लोड होत आहे…",
  "common.all": "सर्व",
  "common.owner": "मालक",
  "common.surveyNo": "सर्व्हे क्रमांक",
  "common.village": "गाव",
  "common.taluka": "तालुका",
  "common.district": "जिल्हा",
  "common.location": "ठिकाण",
  "common.area": "क्षेत्र (हे.)",
  "common.confidence": "विश्वासार्हता",
  "common.risk": "धोका",
  "common.status": "स्थिती",
  "common.officer": "अधिकारी",
  "common.timestamp": "वेळ",
  "common.recordId": "अभिलेख आयडी",
  "common.viewAll": "सर्व पहा",
  "common.open": "उघडा",
  "common.compare": "तुलना करा",
  "common.reset": "फिल्टर रीसेट करा",
  "common.notAvailable": "उपलब्ध नाही",
  "common.unknownOwner": "अज्ञात मालक",

  "status.Verified": "पडताळलेले",
  "status.Approved": "मंजूर",
  "status.Review Required": "पुनरावलोकन आवश्यक",
  "status.Rejected": "नामंजूर",
  "status.Pending": "प्रलंबित",
  "status.High Risk": "उच्च धोका",

  "risk.LOW RISK": "कमी धोका",
  "risk.MEDIUM RISK": "मध्यम धोका",
  "risk.HIGH RISK": "उच्च धोका",
  "conf.High Confidence": "उच्च विश्वासार्हता",
  "conf.Medium Confidence": "मध्यम विश्वासार्हता",
  "conf.Low Confidence": "कमी विश्वासार्हता",

  "anomaly.missing": "अपूर्ण माहिती",
  "anomaly.owner": "मालक नाव तफावत",
  "anomaly.area": "क्षेत्र तफावत",
  "anomaly.duplicate": "संभाव्य दुबार नोंद",
  "anomaly.ocr": "कमी ओसीआर विश्वासार्हता",

  "dash.title": "डॅशबोर्ड",
  "dash.subtitle":
    "बुद्धिमान भूमी अभिलेख डिजिटायझेशन व पडताळणी प्रणाली — डेमो डेटा (वाघोली / हवेली, पुणे)",
  "dash.quickUpload": "जलद अपलोड",
  "dash.gisMap": "जीआयएस नकाशा",
  "dash.total": "एकूण भूमी अभिलेख",
  "dash.verified": "यशस्वीरीत्या पडताळलेले",
  "dash.review": "पुनरावलोकन आवश्यक",
  "dash.anomalies": "आढळलेल्या तफावती",
  "dash.approved": "अधिकारी मंजूर",
  "dash.chartVerified": "पडताळलेले वि. पुनरावलोकन आवश्यक",
  "dash.chartRisk": "धोका गुण वितरण",
  "dash.chartStatus": "प्रक्रिया स्थितीनुसार अभिलेख",
  "dash.chartAnomaly": "आढळलेले तफावत प्रकार",
  "dash.recent": "अलीकडील अभिलेख",
  "dash.alerts": "अलीकडील सूचना",
  "dash.noAlerts": "कोणतीही खुली तफावत नाही.",
  "dash.loadingRecords": "अभिलेख लोड होत आहेत…",

  "val.title": "पडताळणी व तफावत शोध",
  "val.subtitle":
    "नियमाधारित निश्चित तपासण्या — अपूर्ण अनिवार्य माहिती, मालक तफावत, क्षेत्र तफावत, दुबार नोंद व कमी ओसीआर विश्वासार्हता. येथील कोणताही निष्कर्ष मशीन-लर्न केलेला नाही.",
  "val.running": "पडताळणी सुरू आहे…",
  "val.noAnomalies": "रजिस्टरमध्ये कोणतीही तफावत आढळली नाही.",
  "val.openAnalytics": "पडताळणी विश्लेषण उघडा",
  "val.aiRecommendation": "एआय शिफारस",
  "val.openFull": "संपूर्ण अभिलेख उघडा →",
  "val.whyFlagged": "हा अभिलेख का चिन्हांकित झाला ({count})",
  "val.clean":
    "कोणतीही तफावत आढळली नाही. सर्व अनिवार्य माहिती उपलब्ध होती, सर्व्हे क्रमांक रजिस्टरमध्ये एकमेव आहे आणि मजकूर वाचन स्पष्ट होते.",

  "an.title": "पडताळणी विश्लेषण",
  "an.subtitle":
    "पुणे जिल्हा व वाघोली गावासाठी कालानुरूप पडताळणी निष्कर्ष आणि नियमाधारित तफावत श्रेणी. हे निश्चित नियम निष्कर्ष आहेत, मशीन-लर्न अंदाज नाहीत.",
  "an.demoNote":
    "डेमो भूगोल: अभिलेखांमध्ये वाघोली / हवेली, पुणे येथील सिम्युलेटेड निर्देशांक व नमुना अधिकारी निर्णय वापरले आहेत.",
  "an.filters": "फिल्टर",
  "an.scope": "ठिकाण व्याप्ती",
  "an.scopeAll": "सर्व संबंधित अभिलेख",
  "an.scopePune": "पुणे जिल्हा",
  "an.scopeWagholi": "वाघोली गाव",
  "an.officer": "अधिकारी",
  "an.allOfficers": "सर्व अधिकारी",
  "an.unassigned": "नियुक्त नाही (सिस्टम)",
  "an.confBand": "विश्वासार्हता श्रेणी",
  "an.confHigh": "उच्च (90–100)",
  "an.confMedium": "मध्यम (70–89)",
  "an.confLow": "कमी (< 70)",
  "an.anomalyType": "तफावत प्रकार",
  "an.statusFilter": "पडताळणी स्थिती",
  "an.dateRange": "दिनांक कालावधी",
  "an.from": "पासून",
  "an.to": "पर्यंत",
  "an.granularity": "कालावधी गट",
  "an.daily": "दैनंदिन",
  "an.weekly": "साप्ताहिक",
  "an.monthly": "मासिक",
  "an.filteredNote": "खालील सर्व केपीआय, आलेख व सारणी सध्याच्या फिल्टरशी जुळणारे {count} अभिलेख दर्शवतात.",
  "an.kpiTotal": "एकूण प्रक्रिया",
  "an.kpiVerified": "पडताळलेले / मंजूर",
  "an.kpiReview": "पुनरावलोकन आवश्यक",
  "an.kpiRejected": "नामंजूर",
  "an.kpiAnomalyRate": "तफावत प्रमाण",
  "an.kpiAvgConf": "सरासरी विश्वासार्हता",
  "an.kpiAvgRisk": "सरासरी धोका",
  "an.kpiMismatch": "एकूण तफावती",
  "an.chartTime": "कालानुरूप पडताळणी निष्कर्ष",
  "an.chartMismatch": "तफावत श्रेणी",
  "an.chartMismatchHint": "संपूर्ण दृश्य फिल्टर करण्यासाठी श्रेणीवर क्लिक करा.",
  "an.chartConf": "विश्वासार्हता श्रेणी वितरण",
  "an.chartRisk": "धोका वितरण",
  "an.chartOfficer": "अधिकारीनिहाय निष्कर्ष",
  "an.reviewed": "पुनरावलोकन",
  "an.approved": "मंजूर",
  "an.rejected": "नामंजूर",
  "an.pending": "प्रलंबित",
  "an.anomalies": "तफावती",
  "an.records": "अभिलेख",
  "an.tableTitle": "फिल्टर केलेले पडताळणी निष्कर्ष",
  "an.anomalyCategory": "तफावत श्रेणी / समस्या",
  "an.emptyTitle": "या फिल्टरशी कोणताही अभिलेख जुळत नाही",
  "an.emptyBody": "दिनांक कालावधी वाढवा किंवा एखादा फिल्टर काढा.",
  "an.clean": "तफावत नाही",

  "rec.title": "भूमी अभिलेख रजिस्टर",
  "rec.subtitle": "प्रत्येक डिजिटल अभिलेख शोधा व फिल्टर करा. संपूर्ण अभिलेख उघडण्यासाठी ओळीवर क्लिक करा.",
  "rec.search": "मालक, सर्व्हे क्रमांक, गाव किंवा जिल्हा शोधा…",
  "rec.empty": "तुमच्या शोधाशी कोणताही अभिलेख जुळत नाही.",
  "rec.count": "{count} अभिलेख",

  "up.title": "भूमी कागदपत्र अपलोड",
  "up.subtitle":
    "पीडीएफ किंवा प्रतिमा कागदपत्रांची तपासणी, मजकूर वाचन, पडताळणी व गुणांकन झाल्यावर अधिकारी पुनरावलोकन करतो.",
  "up.single": "एकल कागदपत्र",
  "up.bulk": "बल्क अपलोड",

  "ver.title": "मानव-सहभागी पडताळणी",
  "ver.subtitle":
    "चिन्हांकित अभिलेख आपोआप मंजूर होत नाहीत — प्रत्येक स्थिती बदल अधिकाऱ्याचा स्पष्ट निर्णय असतो.",
  "ver.queue": "प्रलंबित रांग ({count})",
  "ver.empty": "पडताळणी रांग रिकामी आहे.",
  "ver.log": "अधिकारी निर्णय नोंद",

  "det.export": "पडताळणी अहवाल डाउनलोड करा (पीडीएफ)",
  "det.exportShort": "पीडीएफ निर्यात",
  "det.preparing": "पीडीएफ तयार होत आहे…",
  "det.exported": "अहवाल डाउनलोड झाला: {name}",
  "det.exportFailed": "पडताळणी अहवाल तयार होऊ शकला नाही. कृपया पुन्हा प्रयत्न करा.",
  "det.timeline": "ऑडिट टाइमलाइन",
  "det.timelineSubtitle": "या अभिलेखाची प्रत्येक प्रक्रिया अवस्था व मानवी कृती.",
  "det.timelineEmpty": "या अभिलेखासाठी अद्याप कोणतीही ऑडिट नोंद नाही.",
  "det.before": "आधी",
  "det.after": "नंतर",

  "audit.upload": "कागदपत्र स्वीकृती",
  "audit.ocr": "ओसीआर",
  "audit.extraction": "माहिती निष्कर्षण",
  "audit.validation": "पडताळणी",
  "audit.score": "गुणांकन",
  "audit.status": "स्थिती बदल",
  "audit.officer": "अधिकारी कृती",

  "pdf.reportTitle": "पडताळणी अहवाल",
  "pdf.metadata": "अहवाल तपशील",
  "pdf.fields": "निष्कर्षित भूमी अभिलेख माहिती",
  "pdf.scores": "विश्वासार्हता, धोका व एआय शिफारस",
  "pdf.officer": "अधिकारी पडताळणी",
  "pdf.flags": "स्पष्टीकरणात्मक पडताळणी व तफावत तपशील",
  "pdf.related": "तुलना संदर्भ (समान सर्व्हे क्रमांकाचे अभिलेख)",
  "pdf.timeline": "ऑडिट टाइमलाइन",
  "pdf.language": "अहवाल भाषा",
  "pdf.footer":
    "लँड रेकॉर्ड एआय — प्रोटोटाइप पडताळणी अहवाल. नमुना/डेमो डेटा; हे कायदेशीर भूमी मालकी कागदपत्र नाही.",
  "pdf.page": "पृष्ठ {page} / {total}",

  ...mrExtra,
};

const DICTS: Record<Lang, Partial<Record<TranslationKey, string>>> = { en, hi, mr };

export type Translate = (key: TranslationKey, vars?: Record<string, string | number>) => string;

/** Pure translator — usable outside React (e.g. the PDF generator). */
export function translator(lang: Lang): Translate {
  return (key, vars) => {
    const raw = DICTS[lang]?.[key] ?? en[key] ?? String(key);
    if (!vars) return raw;
    return raw.replace(/\{(\w+)\}/g, (match, name: string) =>
      name in vars ? String(vars[name]) : match,
    );
  };
}

type Ctx = { lang: Lang; setLang: (lang: Lang) => void; t: Translate };

const I18nContext = createContext<Ctx>({ lang: "en", setLang: () => {}, t: translator("en") });

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY) as Lang | null;
    if (stored && stored in DICTS) setLangState(stored);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* storage unavailable — session-only selection still works */
    }
  }, []);

  const value = useMemo<Ctx>(() => ({ lang, setLang, t: translator(lang) }), [lang, setLang]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): Ctx {
  return useContext(I18nContext);
}

/** Localises a verification/processing status string coming from the database. */
export function localizeStatus(t: Translate, status: string | null | undefined): string {
  if (!status) return t("common.none");
  return t(`status.${status}` as TranslationKey);
}

/**
 * Structured anomaly categories. Flags are stored as English explanation
 * sentences, so the category is derived from the sentence and localised;
 * the sentence itself falls back to English for legacy/unstructured text.
 */
export type AnomalyCategory = "missing" | "owner" | "area" | "duplicate" | "ocr";

export const ANOMALY_CATEGORIES: AnomalyCategory[] = [
  "missing",
  "owner",
  "area",
  "duplicate",
  "ocr",
];

const CATEGORY_TESTS: { category: AnomalyCategory; test: RegExp }[] = [
  { category: "duplicate", test: /duplicate/i },
  { category: "missing", test: /mandatory field/i },
  { category: "owner", test: /owner name similarity|also registered to/i },
  { category: "area", test: /area differs/i },
  { category: "ocr", test: /ocr confidence/i },
];

export function categorizeFlag(flag: string): AnomalyCategory | null {
  return CATEGORY_TESTS.find(({ test }) => test.test(flag))?.category ?? null;
}

export function categoriesOf(flags: string[]): AnomalyCategory[] {
  const found = new Set<AnomalyCategory>();
  for (const flag of flags) {
    const category = categorizeFlag(flag);
    if (category) found.add(category);
  }
  return [...found];
}

export function categoryLabel(t: Translate, category: AnomalyCategory): string {
  return t(`anomaly.${category}` as TranslationKey);
}
