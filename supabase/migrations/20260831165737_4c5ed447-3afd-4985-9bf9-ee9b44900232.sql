CREATE TABLE public.land_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner text,
  survey_no text,
  area numeric,
  village text,
  taluka text,
  district text,
  land_type text,
  mutation_no text,
  registration_no text,
  latitude double precision,
  longitude double precision,
  document text,
  ocr_text text,
  confidence numeric NOT NULL DEFAULT 0,
  risk_score numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'Pending',
  issue text,
  ai_recommendation text,
  flags jsonb NOT NULL DEFAULT '[]'::jsonb,
  verification_status text NOT NULL DEFAULT 'Pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.officer_decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  record_id uuid NOT NULL REFERENCES public.land_records(id) ON DELETE CASCADE,
  decision text NOT NULL,
  officer_name text NOT NULL DEFAULT 'Demo Officer',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_land_records_survey ON public.land_records (survey_no);
CREATE INDEX idx_officer_decisions_record ON public.officer_decisions (record_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.land_records TO anon, authenticated;
GRANT ALL ON public.land_records TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.officer_decisions TO anon, authenticated;
GRANT ALL ON public.officer_decisions TO service_role;

ALTER TABLE public.land_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.officer_decisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Demo portal can read land records" ON public.land_records FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Demo portal can add land records" ON public.land_records FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Demo portal can update land records" ON public.land_records FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Demo portal can delete land records" ON public.land_records FOR DELETE TO anon, authenticated USING (true);

CREATE POLICY "Demo portal can read decisions" ON public.officer_decisions FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Demo portal can add decisions" ON public.officer_decisions FOR INSERT TO anon, authenticated WITH CHECK (true);

INSERT INTO public.land_records
(owner, survey_no, area, village, taluka, district, land_type, mutation_no, registration_no, latitude, longitude, document, ocr_text, confidence, risk_score, status, issue, ai_recommendation, flags, verification_status)
VALUES
('Rahul Patil','123/4A',2.50,'Wagholi','Haveli','Pune','Agricultural','MUT-2021-0455','REG-2021-11234',18.5804,73.9810,'sample/7-12-wagholi-123-4a.pdf','Form 7/12 Extract | Village: Wagholi | Taluka: Haveli | District: Pune | Survey No: 123/4A | Owner: Rahul Patil | Area: 2.50 Ha | Land Type: Agricultural | Mutation No: MUT-2021-0455 | Registration No: REG-2021-11234',96,5,'Verified',NULL,'Approve','[]'::jsonb,'Verified'),
('Rahul Paatil','123/4A',2.10,'Wagholi','Haveli','Pune','Agricultural','MUT-2023-0912','REG-2023-30877',18.5811,73.9822,'sample/7-12-wagholi-123-4a-b.pdf','Form 7/12 Extract | Village: Wagholi | Taluka: Haveli | District: Pune | Survey No: 123/4A | Owner: Rahul Paatil | Area: 2.10 Ha | Land Type: Agricultural | Mutation No: MUT-2023-0912',78,72,'Review Required','Area differs by 0.40 ha from another record with the same survey number','Request Manual Review','["Survey number 123/4A also appears on another record", "Land area differs by 0.40 hectares (2.50 ha vs 2.10 ha)", "Owner name similarity is only 91% (\"Rahul Patil\" vs \"Rahul Paatil\") - potential match, not confirmed", "OCR confidence is 78%"]'::jsonb,'Review Required'),
('Rahul Patil','210/2',1.20,'Kesnand','Haveli','Pune','Agricultural','MUT-2020-0231','REG-2020-09912',18.6041,74.0122,'sample/7-12-kesnand-210-2.pdf','Form 7/12 Extract | Village: Kesnand | Survey No: 210/2 | Owner: Rahul Patil | Area: 1.20 Ha',93,30,'Review Required','Owner name conflict with another record on survey number 210/2','Request Manual Review','["Survey number 210/2 also appears on another record with owner \"Ramesh Patil\"", "Owner name similarity is only 68% - flagged as different persons"]'::jsonb,'Review Required'),
('Ramesh Patil','210/2',1.20,'Kesnand','Haveli','Pune','Agricultural','MUT-2022-0664','REG-2022-21455',18.6049,74.0130,'sample/7-12-kesnand-210-2-b.pdf','Form 7/12 Extract | Village: Kesnand | Survey No: 210/2 | Owner: Ramesh Patil | Area: 1.20 Ha',90,55,'Review Required','Owner mismatch on same survey number','Request Manual Review','["Survey number 210/2 also appears on another record with owner \"Rahul Patil\"", "Owner name similarity is only 68% - flagged as different persons", "Land area is identical (1.20 ha), suggesting a disputed ownership claim"]'::jsonb,'Review Required'),
('Sunil Jadhav','88/1',3.00,'Lohgaon','Haveli','Pune','Non-Agricultural','MUT-2019-0187','REG-2019-07741',18.5945,73.9155,'sample/7-12-lohgaon-88-1.pdf','Form 7/12 Extract | Village: Lohgaon | Survey No: 88/1 | Owner: Sunil Jadhav | Area: 3.00 Ha | Land Type: Non-Agricultural',94,25,'Review Required','Possible duplicate entry','Request Manual Review','["A near-identical record exists (same survey number, same owner, area within 0.05 ha, coordinates within 120 m)"]'::jsonb,'Review Required'),
('Sunil Jadhav','88/1',3.02,'Lohgaon','Haveli','Pune','Non-Agricultural','MUT-2019-0187','REG-2019-07741',18.5947,73.9158,'sample/7-12-lohgaon-88-1-dup.pdf','Form 7/12 Extract | Village: Lohgaon | Survey No: 88/1 | Owner: Sunil Jadhav | Area: 3.02 Ha',88,50,'High Risk','Duplicate of an existing record','Request Manual Review','["Duplicate record detected: same survey number 88/1, same owner \"Sunil Jadhav\", area within 0.02 ha", "Registration number REG-2019-07741 is already used by another record"]'::jsonb,'Review Required'),
('R. Patil','123/4A',2.48,'Wagholi','Haveli','Pune','Agricultural','MUT-2024-1101','REG-2024-41200',18.5798,73.9799,'sample/7-12-wagholi-123-4a-c.pdf','Form 7/12 Extract | Village: Wagholi | Survey No: 123/4A | Owner: R. Patil | Area: 2.48 Ha',81,58,'Review Required','Abbreviated owner name - potential match with existing owner','Request Manual Review','["Owner name \"R. Patil\" is 74% similar to \"Rahul Patil\" - Potential Match, requires human confirmation", "Survey number 123/4A appears on 2 other records", "OCR confidence is 81%"]'::jsonb,'Review Required'),
('Anita Shinde','45/3B',0.85,NULL,'Haveli','Pune','Agricultural',NULL,'REG-2021-15003',18.5702,73.9612,'sample/7-12-45-3b.pdf','Form 7/12 Extract | Survey No: 45/3B | Owner: Anita Shinde | Area: 0.85 Ha',85,40,'Review Required','Mandatory fields missing: Village, Mutation Number','Request Manual Review','["Mandatory field \"Village\" is missing from the document", "Mandatory field \"Mutation Number\" is missing from the document"]'::jsonb,'Review Required'),
('Mahesh Kadam','301/1',4.10,'Kharadi','Haveli','Pune','Residential','MUT-2018-0044','REG-2018-03310',18.5515,73.9470,'sample/7-12-kharadi-301-1.pdf','Form 7/12 Extract | Village: Kharadi | Survey No: 301/1 | Owner: Mahesh Kadam | Area: 4.10 Ha | Land Type: Residential',97,0,'Verified',NULL,'Approve','[]'::jsonb,'Approved'),
('Pooja Deshmukh','77/9',1.75,'Bhavdi','Haveli','Pune','Agricultural','MUT-2022-0810','REG-2022-25120',18.5630,74.0025,'sample/7-12-bhavdi-77-9.jpg','Faded scan. Form 7/12 | Village: Bhavdi | Survey No: 77/9 | Owner: Pooja Deshmukh | Area: 1.75 Ha',62,45,'Review Required','Low OCR confidence - scanned copy is faded','Request Manual Review','["OCR confidence is only 62% - text extraction may be unreliable", "Low-confidence records are automatically routed to human review"]'::jsonb,'Review Required'),
('Vikram Bhosale','155/2',2.20,'Wagholi','Haveli','Pune','Agricultural','MUT-2020-0501','REG-2020-10088',18.5762,73.9885,'sample/7-12-wagholi-155-2.pdf','Form 7/12 Extract | Village: Wagholi | Survey No: 155/2 | Owner: Vikram Bhosale | Area: 2.20 Ha',95,10,'Verified',NULL,'Approve','[]'::jsonb,'Approved'),
('Imran Shaikh','412/6',0.55,'Shikrapur','Shirur','Pune','Commercial','MUT-2023-0333','REG-2023-33001',18.6890,74.1305,'sample/7-12-shikrapur-412-6.pdf','Form 7/12 Extract | Village: Shikrapur | Taluka: Shirur | Survey No: 412/6 | Owner: Imran Shaikh | Area: 0.55 Ha | Land Type: Commercial',71,65,'High Risk','Registration number format could not be verified','Request Manual Review','["OCR confidence is 71%", "Registration number could not be cross-verified against the district register", "Land type changed from Agricultural to Commercial without a matching mutation entry"]'::jsonb,'Rejected');

INSERT INTO public.officer_decisions (record_id, decision, officer_name, notes)
SELECT id, 'Approve', 'Tehsildar A. Kulkarni', 'Document verified against the village register.' FROM public.land_records WHERE survey_no = '301/1';
INSERT INTO public.officer_decisions (record_id, decision, officer_name, notes)
SELECT id, 'Reject', 'Tehsildar A. Kulkarni', 'Land-use conversion not supported by mutation entry.' FROM public.land_records WHERE survey_no = '412/6';