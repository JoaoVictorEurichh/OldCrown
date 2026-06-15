CREATE TABLE "SlotBloqueado" (
    "id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    "barber" TEXT NOT NULL,
    "motivo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SlotBloqueado_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SlotBloqueado_date_time_barber_key" ON "SlotBloqueado"("date", "time", "barber");