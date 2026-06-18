-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mpPaymentId" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "description" TEXT NOT NULL,
    "payerEmail" TEXT NOT NULL,
    "payerName" TEXT NOT NULL,
    "payerDocument" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "statusDetail" TEXT,
    "qrCode" TEXT NOT NULL,
    "qrCodeBase64" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Payment_mpPaymentId_key" ON "Payment"("mpPaymentId");
