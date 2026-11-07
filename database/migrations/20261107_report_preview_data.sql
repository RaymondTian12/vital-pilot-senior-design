-- Adds report_data, a JSON snapshot of everything a report is made of
-- (patient header, narrative, tracked-metric stats, alerts). The PDF-only
-- storage from the previous migration has no structured way to re-render a
-- report's content natively in the mobile app -- only the rendered bytes.
-- Nullable: existing rows (from before this migration) have no stored data
-- and simply can't be previewed in-app; new reports populate it going
-- forward, alongside (not instead of) the stored PDF.

ALTER TABLE ClinicalReports
    ADD COLUMN report_data LONGTEXT NULL AFTER pdf_data;
