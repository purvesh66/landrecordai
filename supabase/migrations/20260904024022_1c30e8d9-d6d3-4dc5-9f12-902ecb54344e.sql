WITH ins AS (
  INSERT INTO public.land_records
    (owner, survey_no, area, village, taluka, district, land_type, mutation_no, registration_no,
     latitude, longitude, ocr_text, confidence, risk_score, status, issue, ai_recommendation,
     flags, verification_status, created_at)
  VALUES
  ('Sanjay More','118/2',1.35,'Wagholi','Haveli','Pune','Agricultural','MUT-118-2-2024','REG/PUN/2024/1181',18.5812,73.9822,'VILLAGE FORM VII-XII (7/12 EXTRACT)
Owner Name: Sanjay More
Survey No: 118/2
Area: 1.35 hectares
Village: Wagholi   Taluka: Haveli   District: Pune
Land Type: Agricultural
Mutation No: MUT-118-2-2024
Registration No: REG/PUN/2024/1181',96,8,'Verified',NULL,'Auto-verify eligible — officer confirmation still required','[]'::jsonb,'Approved','2026-06-10 09:12:00+00'),

  ('Kavita Jadhav','119/3',0.95,'Wagholi','Haveli','Pune','Agricultural','MUT-119-3-2024','REG/PUN/2024/1193',18.5798,73.9836,'VILLAGE FORM VII-XII (7/12 EXTRACT)
Owner Name: Kavita Jadhav
Survey No: 119/3
Area: 0.95 hectares
Village: Wagholi   Taluka: Haveli   District: Pune
Land Type: Agricultural
Mutation No: MUT-119-3-2024
Registration No: REG/PUN/2024/1193',94,10,'Verified',NULL,'Auto-verify eligible — officer confirmation still required','[]'::jsonb,'Verified','2026-06-14 10:40:00+00'),

  ('Nitin Gaikwad','205/7',2.40,'Kharadi','Haveli','Pune','Non-Agricultural','MUT-205-7-2024','REG/PUN/2024/2057',18.5518,73.9430,'VILLAGE FORM VII-XII
Owner Name: Nitin Gaikwad
Gat No: 205/7
Area: 2.40 hectares
Village: Kharadi   Taluka: Haveli   District: Pune
Land Type: Non-Agricultural
Mutation No: MUT-205-7-2024
Registration No: REG/PUN/2024/2057',92,12,'Verified',NULL,'Auto-verify eligible — officer confirmation still required','[]'::jsonb,'Approved','2026-06-18 11:05:00+00'),

  ('Shubham Pawar','66/1A',1.10,'Manjri','Haveli','Pune','Agricultural','MUT-66-1A-2024','REG/PUN/2024/0661',18.5142,73.9525,'VILLAGE FORM VII-XII
Khatedar: Shubham Pawar
Khasra No: 66/1A
Area: 1.10 hectares
Village: Manjri   Taluka: Haveli   District: Pune
Land Type: Agricultural
Mutation No: MUT-66-1A-2024
Registration No: REG/PUN/2024/0661',91,15,'Verified',NULL,'Auto-verify eligible — officer confirmation still required','[]'::jsonb,'Verified','2026-06-22 08:55:00+00'),

  ('Rahul Patil','340/2',1.60,'Wagholi','Haveli','Pune','Agricultural','MUT-340-2-2024','REG/PUN/2024/3402',18.5833,73.9791,'VILLAGE FORM VII-XII
Owner Name: Rahul Patil
Survey No: 340/2
Area: 1.60 hectares
Village: Wagholi   Taluka: Haveli   District: Pune
Land Type: Agricultural
Mutation No: MUT-340-2-2024
Registration No: REG/PUN/2024/3402',78,55,'Review Required','Survey number 340/2 is also registered to a similarly spelled owner','Manual verification recommended before any mutation is approved',
   '["Survey number 340/2 is also registered to \"Rahul Paatil\" — owner name similarity is 92%, below the 95% identity threshold."]'::jsonb,'Review Required','2026-06-26 12:20:00+00'),

  ('Rahul Paatil','340/2',1.60,'Wagholi','Haveli','Pune','Agricultural','MUT-340-2-2024','REG/PUN/2024/3402',18.5834,73.9792,'VILLAGE FORM VII-XII
Owner Name: Rahul Paatil
Survey No: 340/2
Area: 1.60 hectares
Village: Wagholi   Taluka: Haveli   District: Pune
Land Type: Agricultural
Mutation No: MUT-340-2-2024
Registration No: REG/PUN/2024/3402',74,62,'High Risk','Possible duplicate entry for survey number 340/2','Manual verification recommended before any mutation is approved',
   '["Possible duplicate: an existing record for survey number 340/2 has the same area and village.","Survey number 340/2 is also registered to \"Rahul Patil\" — owner name similarity is 92%, below the 95% identity threshold."]'::jsonb,'Review Required','2026-06-28 09:35:00+00'),

  ('R. Patil','340/2',1.62,'Wagholi','Haveli','Pune','Agricultural','MUT-340-2-2025','REG/PUN/2025/3402',18.5836,73.9788,'VILLAGE FORM VII-XII
Owner Name: R. Patil
Survey No: 340/2
Area: 1.62 hectares
Village: Wagholi   Taluka: Haveli   District: Pune
Land Type: Agricultural
Mutation No: MUT-340-2-2025
Registration No: REG/PUN/2025/3402',70,70,'High Risk','Third conflicting claim on survey number 340/2','Manual verification recommended before any mutation is approved',
   '["Possible duplicate: two existing records already describe survey number 340/2 in Wagholi.","Survey number 340/2 is also registered to \"Rahul Patil\" — owner name similarity is 71%, below the 95% identity threshold.","Recorded area differs from the existing register entry by 0.02 hectares."]'::jsonb,'Rejected','2026-07-01 14:10:00+00'),

  ('Sheetal Kulkarni','89/4',3.20,'Lohegaon','Haveli','Pune','Agricultural','MUT-89-4-2024','REG/PUN/2024/0894',18.5975,73.9160,'VILLAGE FORM VII-XII
Owner Name: Sheetal Kulkarni
Survey No: 89/4
Area: 3.20 hectares
Village: Lohegaon   Taluka: Haveli   District: Pune
Land Type: Agricultural
Mutation No: MUT-89-4-2024
Registration No: REG/PUN/2024/0894',90,20,'Verified',NULL,'Auto-verify eligible — officer confirmation still required','[]'::jsonb,'Approved','2026-07-05 10:15:00+00'),

  ('Sheetal Kulkarni','89/4',1.29,'Lohegaon','Haveli','Pune','Agricultural','MUT-89-4-2025','REG/PUN/2025/0894',18.5977,73.9163,'VILLAGE FORM VII-XII
Owner Name: Sheetal Kulkarni
Survey No: 89/4
Area: 3.20 acre (1.29 hectares after unit conversion)
Village: Lohegaon   Taluka: Haveli   District: Pune
Land Type: Agricultural
Mutation No: MUT-89-4-2025
Registration No: REG/PUN/2025/0894',82,58,'Review Required','Area differs after unit normalisation','Manual verification recommended before any mutation is approved',
   '["Recorded area differs from the existing register entry by 1.91 hectares — the source document states 3.20 acre, which normalises to 1.29 hectares.","Possible duplicate: survey number 89/4 already exists for the same owner in Lohegaon."]'::jsonb,'Review Required','2026-07-09 13:45:00+00'),

  ('Prakash Chavan','512/3',NULL,'Kesnand','Haveli','Pune','Agricultural','MUT-512-3-2024','REG/PUN/2024/5123',18.6108,74.0245,'VILLAGE FORM VII-XII
Owner Name: Prakash Chavan
Survey No: 512/3
Area: [illegible]
Village: Kesnand   Taluka: Haveli   District: Pune
Land Type: Agricultural
Mutation No: MUT-512-3-2024
Registration No: REG/PUN/2024/5123',68,65,'Review Required','Mandatory field missing: land area','Manual verification recommended before any mutation is approved',
   '["Mandatory field \"Land Area (ha)\" could not be located in the document."]'::jsonb,'Review Required','2026-07-14 09:05:00+00'),

  ('Meena Sawant','77/12',1.05,NULL,'Haveli','Pune','Agricultural','MUT-77-12-2024','REG/PUN/2024/7712',18.5721,73.9954,'VILLAGE FORM VII-XII
Owner Name: Meena Sawant
Survey No: 77/12
Area: 1.05 hectares
Village: [torn]   Taluka: Haveli   District: Pune
Land Type: Agricultural
Mutation No: MUT-77-12-2024
Registration No: REG/PUN/2024/7712',66,68,'Review Required','Mandatory field missing: village','Manual verification recommended before any mutation is approved',
   '["Mandatory field \"Village\" could not be located in the document."]'::jsonb,'Review Required','2026-07-19 15:30:00+00'),

  ('Ganesh Shelke',NULL,2.05,'Wagholi','Haveli','Pune','Agricultural','MUT-2024-8891','REG/PUN/2024/8891',18.5789,73.9843,'VILLAGE FORM VII-XII
Owner Name: Ganesh Shelke
Survey No: [smudged]
Area: 2.05 hectares
Village: Wagholi   Taluka: Haveli   District: Pune
Land Type: Agricultural
Mutation No: MUT-2024-8891
Registration No: REG/PUN/2024/8891',60,72,'High Risk','Mandatory field missing: survey number','Manual verification recommended before any mutation is approved',
   '["Mandatory field \"Survey / Khasra Number\" could not be located in the document."]'::jsonb,'Review Required','2026-07-24 11:50:00+00'),

  ('Asha Nikam','402/1',0.80,'Wagholi','Haveli','Pune','Agricultural','MUT-402-1-2024','REG/PUN/2024/4021',18.5849,73.9877,'VLLAGE F0RM VII-XII (poor scan)
0wner Narne: Asha Nikam
Survey N0: 402/1
Area: 0.80 hectores
Vlllage: Wagholi  Taluka: Havell  Distrlct: Pune
Land Type: Agricultura1
Mutatlon No: MUT-402-1-2024
Registratlon No: REG/PUN/2024/4021',52,66,'Review Required','Low OCR confidence on a poor-quality scan','Manual verification recommended before any mutation is approved',
   '["OCR confidence is only 52% — the scan quality is poor and several characters were reconstructed."]'::jsonb,'Review Required','2026-07-30 16:25:00+00'),

  ('Dattatray Kale','233/5',5.60,'Kharadi','Haveli','Pune','Agricultural','MUT-233-5-2024','REG/PUN/2024/2335',18.5551,73.9482,'VILLAGE FORM VII-XII
Owner Name: Dattatray Kale
Gat No: 233/5
Area: 5.60 hectares
Village: Kharadi   Taluka: Haveli   District: Pune
Land Type: Agricultural
Mutation No: MUT-233-5-2024
Registration No: REG/PUN/2024/2335',93,14,'Verified',NULL,'Auto-verify eligible — officer confirmation still required','[]'::jsonb,'Approved','2026-08-04 09:40:00+00'),

  ('Farida Sheikh','91/2',1.44,'Manjri','Haveli','Pune','Non-Agricultural','MUT-91-2-2024','REG/PUN/2024/0912',18.5165,73.9498,'VILLAGE FORM VII-XII (faint copy)
Owner Name: Farida Sheikh
Khata No: 91/2
Area: 1.44 hectares
Village: Manjri   Taluka: Haveli   District: Pune
Land Type: Non-Agricultural
Mutation No: MUT-91-2-2024
Registration No: REG/PUN/2024/0912',71,76,'High Risk','Possible duplicate submission with a weak scan','Manual verification recommended before any mutation is approved',
   '["Possible duplicate: the same registration number REG/PUN/2024/0912 was submitted earlier this month.","OCR confidence is only 71% — parts of the faint copy were reconstructed."]'::jsonb,'Rejected','2026-08-09 12:00:00+00'),

  ('Suresh Kamble','118/2',1.35,'Wagholi','Haveli','Pune','Agricultural','MUT-118-2-2025','REG/PUN/2025/1182',18.5814,73.9824,'VILLAGE FORM VII-XII
Owner Name: Suresh Kamble
Survey No: 118/2
Area: 1.35 hectares
Village: Wagholi   Taluka: Haveli   District: Pune
Land Type: Agricultural
Mutation No: MUT-118-2-2025
Registration No: REG/PUN/2025/1182',85,60,'High Risk','Possible duplicate parcel with a different owner','Manual verification recommended before any mutation is approved',
   '["Possible duplicate: survey number 118/2 with the same area already exists in Wagholi.","Survey number 118/2 is also registered to \"Sanjay More\" — owner name similarity is 24%, below the 95% identity threshold."]'::jsonb,'Review Required','2026-08-14 10:20:00+00'),

  ('Jyoti Rane','610/4',2.75,'Kesnand','Haveli','Pune','Agricultural','MUT-610-4-2024','REG/PUN/2024/6104',18.6131,74.0198,'VILLAGE FORM VII-XII
Owner Name: Jyoti Rane
Survey No: 610/4
Area: 2.75 hectares
Village: Kesnand   Taluka: Haveli   District: Pune
Land Type: Agricultural
Mutation No: MUT-610-4-2024
Registration No: REG/PUN/2024/6104',97,6,'Verified',NULL,'Auto-verify eligible — officer confirmation still required','[]'::jsonb,'Verified','2026-08-20 08:30:00+00'),

  ('Amol Thorat','145/8',1.90,'Lohegaon','Haveli','Pune','Agricultural','MUT-145-8-2024','REG/PUN/2024/1458',18.5992,73.9204,'VILLAGE FORM VII-XII
Owner Name: Amol Thorat
Survey No: 145/8
Area: 1.90 hectares
Village: Lohegaon   Taluka: Haveli   District: Pune
Land Type: Agricultural
Mutation No: MUT-145-8-2024
Registration No: REG/PUN/2024/1458',89,18,'Verified',NULL,'Auto-verify eligible — officer confirmation still required','[]'::jsonb,'Approved','2026-08-25 14:05:00+00'),

  ('Rekha Gawande','158/3',0.65,'Wagholi','Haveli','Pune','Agricultural','MUT-158-3-2024','REG/PUN/2024/1583',18.5776,73.9861,'VILLAGE FORM VII-XII
Owner Name: Rekha Gawande
Survey No: 158/3
Area: 0.65 hectares
Village: Wagholi   Taluka: Haveli   District: Pune
Land Type: Agricultural
Mutation No: MUT-158-3-2024
Registration No: REG/PUN/2024/1583',88,22,'Verified',NULL,'Auto-verify eligible — officer confirmation still required','[]'::jsonb,'Pending','2026-08-30 11:15:00+00'),

  ('Vishal Sonawane','720/1',3.35,'Manjri','Haveli','Pune','Agricultural','MUT-720-1-2024','REG/PUN/2024/7201',18.5118,73.9541,'VILLAGE FORM VII-XII
Owner Name: Vishal Sonawane
Survey No: 720/1
Area: 3.35 hectares
Village: Manjri   Taluka: Haveli   District: Pune
Land Type: Agricultural
Mutation No: MUT-720-1-2024
Registration No: REG/PUN/2024/7201',76,48,'Review Required','Owner name differs from the earlier mutation entry','Manual verification recommended before any mutation is approved',
   '["Survey number 720/1 is also registered to \"V. R. Sonawane\" in the earlier mutation entry — owner name similarity is 78%, below the 95% identity threshold."]'::jsonb,'Review Required','2026-09-02 09:55:00+00')
  RETURNING id, owner, survey_no, confidence, risk_score, status, verification_status, flags, created_at
)
, events AS (
  INSERT INTO public.audit_events (record_id, event_type, title, detail, actor, before_value, after_value, confidence, risk_score, created_at)
  SELECT i.id, e.event_type, e.title, e.detail, 'System', e.before_value, e.after_value, e.confidence, e.risk_score, i.created_at + e.offset_min
  FROM ins i
  CROSS JOIN LATERAL (VALUES
    ('upload','Document received',
      'Scanned 7/12 extract for survey number ' || COALESCE(i.survey_no,'[not readable]') || ' was validated and stored securely.',
      NULL::text, 'uploads/demo-' || COALESCE(REPLACE(i.survey_no,'/','-'),'unknown') || '.pdf', NULL::numeric, NULL::numeric, interval '0 minute'),
    ('ocr','OCR completed',
      'The document reader transcribed the extract with an estimated legibility of ' || ROUND(i.confidence) || '%.',
      NULL, ROUND(i.confidence) || '% OCR confidence', i.confidence, NULL, interval '1 minute'),
    ('extraction','Field extraction completed',
      'Rule-based extraction read owner "' || COALESCE(i.owner,'not found') || '" and survey number "' || COALESCE(i.survey_no,'not found') || '".',
      NULL, (9 - (SELECT COUNT(*) FROM jsonb_array_elements_text(i.flags) f WHERE f LIKE 'Mandatory field%')) || '/9 mandatory fields found', i.confidence, NULL, interval '2 minute'),
    ('validation','Validation completed',
      CASE WHEN jsonb_array_length(i.flags) = 0
        THEN 'No conflicts were found against the existing register.'
        ELSE jsonb_array_length(i.flags) || ' issue(s) detected: ' || (SELECT string_agg(f, ' | ') FROM jsonb_array_elements_text(i.flags) f) END,
      NULL, jsonb_array_length(i.flags) || ' issue(s)', NULL, i.risk_score, interval '3 minute'),
    ('score','Confidence and risk scored',
      'Overall confidence ' || ROUND(i.confidence) || '% and weighted anomaly risk ' || ROUND(i.risk_score) || '/100 were computed from the OCR, extraction and validation stages.',
      NULL, ROUND(i.confidence) || '% confidence · risk ' || ROUND(i.risk_score), i.confidence, i.risk_score, interval '4 minute'),
    ('status','Routed for verification',
      'Processing status set to ' || i.status || '. The record awaits a human officer decision and is never auto-approved.',
      'Pending', i.verification_status, i.confidence, i.risk_score, interval '5 minute')
  ) AS e(event_type, title, detail, before_value, after_value, confidence, risk_score, offset_min)
  RETURNING 1
)
, decisions AS (
  INSERT INTO public.officer_decisions (record_id, decision, officer_name, notes, created_at)
  SELECT i.id,
    CASE WHEN i.verification_status = 'Rejected' THEN 'Reject'
         WHEN i.verification_status = 'Approved' THEN 'Approve'
         ELSE 'Request Manual Review' END,
    CASE (ABS(HASHTEXT(i.id::text)) % 3)
      WHEN 0 THEN 'Officer Anjali Deshmukh'
      WHEN 1 THEN 'Officer Vivek Kulkarni'
      ELSE 'Officer Priya Shah' END,
    CASE WHEN i.verification_status = 'Rejected' THEN 'Conflicting claim on the same survey number — applicant asked to submit an attested original.'
         WHEN i.verification_status = 'Approved' THEN 'Fields matched the register and the scan was legible. Approved after physical file check.'
         ELSE 'Sent for manual review pending a site visit.' END,
    i.created_at + interval '2 day'
  FROM ins i
  WHERE i.verification_status IN ('Approved','Rejected','Review Required')
    AND (ABS(HASHTEXT(i.id::text)) % 4) <> 0
  RETURNING record_id, decision, officer_name, notes, created_at
)
INSERT INTO public.audit_events (record_id, event_type, title, detail, actor, before_value, after_value, created_at)
SELECT d.record_id, 'officer', 'Officer decision: ' || d.decision, d.notes, d.officer_name, 'Review Required',
  CASE d.decision WHEN 'Approve' THEN 'Approved' WHEN 'Reject' THEN 'Rejected' ELSE 'Review Required' END,
  d.created_at
FROM decisions d;