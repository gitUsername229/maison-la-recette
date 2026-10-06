ALTER TABLE "Reservation" ADD COLUMN "checkoutKey" TEXT;
ALTER TABLE "Reservation" ADD COLUMN "checkoutPayload" TEXT;
CREATE UNIQUE INDEX "Reservation_checkoutKey_key" ON "Reservation"("checkoutKey");
