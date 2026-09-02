CREATE TABLE public.audit_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  record_id uuid NOT NULL REFERENCES public.land_records(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  title text NOT NULL,
  detail text,
  actor text NOT NULL DEFAULT 'System',
  before_value text,
  after_value text,
  confidence numeric,
  risk_score numeric,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX audit_events_record_id_created_at_idx ON public.audit_events (record_id, created_at);

GRANT SELECT, INSERT ON public.audit_events TO anon, authenticated;
GRANT ALL ON public.audit_events TO service_role;

ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Demo portal can read audit events" ON public.audit_events FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Demo portal can add audit events" ON public.audit_events FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Backfill pipeline history for existing seeded records
INSERT INTO public.audit_events (record_id, event_type, title, detail, actor, after_value, confidence, risk_score, created_at)
SELECT r.id, 'upload', 'Document received',
       COALESCE('Source document "' || r.document || '" accepted for processing.', 'Land document accepted for processing from the sample register.'),
       'System', r.document, NULL, NULL, r.created_at
FROM public.land_records r;

INSERT INTO public.audit_events (record_id, event_type, title, detail, actor, after_value, confidence, risk_score, created_at)
SELECT r.id, 'ocr', 'OCR completed',
       'Optical character recognition transcribed ' || COALESCE(length(r.ocr_text), 0) || ' characters from the document.',
       'System', COALESCE(round(r.confidence)::text, '0') || '% overall confidence at capture', r.confidence, NULL, r.created_at + interval '4 seconds'
FROM public.land_records r;

INSERT INTO public.audit_events (record_id, event_type, title, detail, actor, after_value, confidence, risk_score, created_at)
SELECT r.id, 'extraction', 'Field extraction completed',
       'Rule-based extraction read owner "' || COALESCE(r.owner, 'not found') || '", survey number "' || COALESCE(r.survey_no, 'not found') ||
       '", area ' || COALESCE(r.area::text, 'not found') || ' ha, village "' || COALESCE(r.village, 'not found') || '".',
       'System', COALESCE(r.owner, 'Owner not found') || ' · ' || COALESCE(r.survey_no, 'Survey no. not found'), r.confidence, NULL, r.created_at + interval '8 seconds'
FROM public.land_records r;

INSERT INTO public.audit_events (record_id, event_type, title, detail, actor, after_value, confidence, risk_score, created_at)
SELECT r.id, 'validation', 'Validation completed',
       CASE WHEN jsonb_array_length(r.flags) = 0
            THEN 'All mandatory fields present and no conflicts found against the existing register.'
            ELSE jsonb_array_length(r.flags) || ' issue(s) detected: ' || (
              SELECT string_agg(f #>> '{}', ' | ') FROM jsonb_array_elements(r.flags) AS f
            )
       END,
       'System', jsonb_array_length(r.flags) || ' issue(s)', r.confidence, r.risk_score, r.created_at + interval '12 seconds'
FROM public.land_records r;

INSERT INTO public.audit_events (record_id, event_type, title, detail, actor, after_value, confidence, risk_score, created_at)
SELECT r.id, 'score', 'Confidence and risk scored',
       'Overall confidence computed at ' || round(r.confidence) || '% and weighted anomaly risk at ' || round(r.risk_score) || '/100. Processing status set to ' || r.status || '.',
       'System', round(r.confidence) || '% confidence · risk ' || round(r.risk_score), r.confidence, r.risk_score, r.created_at + interval '15 seconds'
FROM public.land_records r;

INSERT INTO public.audit_events (record_id, event_type, title, detail, actor, before_value, after_value, confidence, risk_score, created_at)
SELECT r.id, 'status', 'Routed for verification',
       'AI recommendation: ' || COALESCE(r.ai_recommendation, 'None') || '. Verification status set to ' || r.verification_status || '.',
       'System', 'Pending', r.verification_status, r.confidence, r.risk_score, r.created_at + interval '18 seconds'
FROM public.land_records r;

INSERT INTO public.audit_events (record_id, event_type, title, detail, actor, before_value, after_value, confidence, risk_score, created_at)
SELECT d.record_id, 'officer', 'Officer decision: ' || d.decision,
       COALESCE(d.notes, 'No additional notes were recorded by the verifying officer.'),
       d.officer_name, 'Review Required',
       CASE d.decision WHEN 'Approve' THEN 'Approved' WHEN 'Reject' THEN 'Rejected' ELSE 'Review Required' END,
       r.confidence, r.risk_score, d.created_at
FROM public.officer_decisions d
JOIN public.land_records r ON r.id = d.record_id;