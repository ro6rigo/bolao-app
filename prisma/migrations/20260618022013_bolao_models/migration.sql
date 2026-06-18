-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "username" TEXT,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Game" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "apiFootballFixtureId" INTEGER NOT NULL,
    "homeTeam" TEXT NOT NULL,
    "awayTeam" TEXT NOT NULL,
    "matchDate" DATETIME NOT NULL,
    "betAmount" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "homeScore" INTEGER,
    "awayScore" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Prediction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "homeScore" INTEGER NOT NULL,
    "awayScore" INTEGER NOT NULL,
    "isCorrect" BOOLEAN,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "paymentId" TEXT,
    CONSTRAINT "Prediction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Prediction_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Prediction_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Payment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
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
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Payment" ("amount", "createdAt", "description", "id", "mpPaymentId", "payerDocument", "payerEmail", "payerName", "qrCode", "qrCodeBase64", "status", "statusDetail", "updatedAt") SELECT "amount", "createdAt", "description", "id", "mpPaymentId", "payerDocument", "payerEmail", "payerName", "qrCode", "qrCodeBase64", "status", "statusDetail", "updatedAt" FROM "Payment";
DROP TABLE "Payment";
ALTER TABLE "new_Payment" RENAME TO "Payment";
CREATE UNIQUE INDEX "Payment_mpPaymentId_key" ON "Payment"("mpPaymentId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Game_apiFootballFixtureId_key" ON "Game"("apiFootballFixtureId");

-- CreateIndex
CREATE UNIQUE INDEX "Prediction_paymentId_key" ON "Prediction"("paymentId");

-- CreateIndex
CREATE UNIQUE INDEX "Prediction_userId_gameId_key" ON "Prediction"("userId", "gameId");
