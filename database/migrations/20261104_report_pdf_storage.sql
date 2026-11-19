-- Generated reports were never actually saved anywhere retrievable: each
-- ClinicalReports row recorded that a report was generated, but file_url
-- was just the placeholder string "generated-on-demand" and the PDF bytes
-- themselves were discarded after the response was sent. This made a real
-- "report history" feature impossible -- there was nothing to re-download.
--
-- Adds pdf_data to actually store the PDF. Nullable: existing rows (from
-- before this migration) have no stored bytes and simply can't be
-- re-downloaded; new reports populate it going forward.

ALTER TABLE ClinicalReports
    ADD COLUMN pdf_data LONGBLOB NULL AFTER file_size_kb;
