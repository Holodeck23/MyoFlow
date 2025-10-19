-- CreateTable
CREATE TABLE "ExportLog" (
    "id" TEXT NOT NULL,
    "therapist_id" TEXT NOT NULL,
    "configuration_id" TEXT,
    "export_type" "ExportType" NOT NULL,
    "target_system" "ExportTargetSystem" NOT NULL,
    "date_range_start" TIMESTAMP(6) NOT NULL,
    "date_range_end" TIMESTAMP(6) NOT NULL,
    "invoice_count" INTEGER NOT NULL,
    "total_revenue_cents" INTEGER NOT NULL,
    "exported_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "file_size" INTEGER NOT NULL,
    "file_name" TEXT NOT NULL,
    "download_count" INTEGER NOT NULL DEFAULT 0,
    "last_download_at" TIMESTAMP(6),

    CONSTRAINT "ExportLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_export_log_therapist_date" ON "ExportLog"("therapist_id", "exported_at");

-- CreateIndex
CREATE INDEX "idx_export_log_date" ON "ExportLog"("exported_at");

-- AddForeignKey
ALTER TABLE "ExportLog" ADD CONSTRAINT "ExportLog_therapist_id_fkey" FOREIGN KEY ("therapist_id") REFERENCES "Therapist"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ExportLog" ADD CONSTRAINT "ExportLog_configuration_id_fkey" FOREIGN KEY ("configuration_id") REFERENCES "ExportConfiguration"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

