/*
  Warnings:

  - You are about to drop the column `userId` on the `DemandeDevis` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Reservation` table. All the data in the column will be lost.
  - You are about to drop the column `telephone` on the `User` table. All the data in the column will be lost.

*/
-- Suppression des comptes clients : les visiteurs réservent et demandent un devis sans compte ;
-- seuls les comptes admin restent. Les réservations et demandes de devis des clients sont conservées :
-- leur nom, leur e-mail et leur téléphone y sont déjà copiés, seul le lien vers le compte disparaît.

-- 1. Connexions, mots de passe et liens de réinitialisation en attente des comptes clients
DELETE FROM "AuthSession" WHERE "userId" IN (SELECT "id" FROM "User" WHERE "role" <> 'admin');
DELETE FROM "AuthAccount" WHERE "userId" IN (SELECT "id" FROM "User" WHERE "role" <> 'admin');
DELETE FROM "AuthVerification" WHERE "identifier" LIKE 'reset-password:%' AND "value" IN (SELECT "id" FROM "User" WHERE "role" <> 'admin');

-- 2. Réservations et devis détachés des comptes clients (userId à null), puis comptes clients supprimés
UPDATE "Reservation" SET "userId" = NULL WHERE "userId" IN (SELECT "id" FROM "User" WHERE "role" <> 'admin');
UPDATE "DemandeDevis" SET "userId" = NULL WHERE "userId" IN (SELECT "id" FROM "User" WHERE "role" <> 'admin');
DELETE FROM "User" WHERE "role" <> 'admin';

-- 3. Colonnes devenues inutiles : Reservation.userId, DemandeDevis.userId et User.telephone
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_DemandeDevis" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "entreprise" TEXT NOT NULL,
    "contactNom" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telephone" TEXT,
    "typeDemande" TEXT NOT NULL,
    "experienceId" INTEGER,
    "nbParticipants" INTEGER,
    "dateSouhaitee" DATETIME,
    "lieuSouhaite" TEXT,
    "message" TEXT NOT NULL,
    "statut" TEXT NOT NULL DEFAULT 'nouvelle',
    "noteInterne" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DemandeDevis_experienceId_fkey" FOREIGN KEY ("experienceId") REFERENCES "Experience" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_DemandeDevis" ("contactNom", "createdAt", "dateSouhaitee", "email", "entreprise", "experienceId", "id", "lieuSouhaite", "message", "nbParticipants", "noteInterne", "statut", "telephone", "typeDemande") SELECT "contactNom", "createdAt", "dateSouhaitee", "email", "entreprise", "experienceId", "id", "lieuSouhaite", "message", "nbParticipants", "noteInterne", "statut", "telephone", "typeDemande" FROM "DemandeDevis";
DROP TABLE "DemandeDevis";
ALTER TABLE "new_DemandeDevis" RENAME TO "DemandeDevis";
CREATE INDEX "DemandeDevis_experienceId_idx" ON "DemandeDevis"("experienceId");
CREATE TABLE "new_Reservation" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "sessionId" INTEGER NOT NULL,
    "nom" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telephone" TEXT,
    "nbPersonnes" INTEGER NOT NULL,
    "montantCents" INTEGER NOT NULL,
    "statut" TEXT NOT NULL DEFAULT 'en_attente',
    "stripeSessionId" TEXT,
    "checkoutKey" TEXT,
    "checkoutPayload" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Reservation_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Reservation" ("checkoutKey", "checkoutPayload", "createdAt", "email", "id", "montantCents", "nbPersonnes", "nom", "sessionId", "statut", "stripeSessionId", "telephone") SELECT "checkoutKey", "checkoutPayload", "createdAt", "email", "id", "montantCents", "nbPersonnes", "nom", "sessionId", "statut", "stripeSessionId", "telephone" FROM "Reservation";
DROP TABLE "Reservation";
ALTER TABLE "new_Reservation" RENAME TO "Reservation";
CREATE UNIQUE INDEX "Reservation_stripeSessionId_key" ON "Reservation"("stripeSessionId");
CREATE UNIQUE INDEX "Reservation_checkoutKey_key" ON "Reservation"("checkoutKey");
CREATE INDEX "Reservation_sessionId_idx" ON "Reservation"("sessionId");
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nom" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "role" TEXT NOT NULL DEFAULT 'client',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("createdAt", "email", "emailVerified", "id", "image", "nom", "role", "updatedAt") SELECT "createdAt", "email", "emailVerified", "id", "image", "nom", "role", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
