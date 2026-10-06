/*
  Warnings:

  - `ExperienceImage` est remplacée par `Image` : ses lignes y sont copiées
    (page = /experiences/<slug>) avant la suppression.
  - `Reference` (vide, inutilisée) est remplacée par `Avis` et `Partenaire`.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Reference";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "Article" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "slug" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "extrait" TEXT NOT NULL,
    "contenu" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "imageAlt" TEXT NOT NULL,
    "datePublication" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publie" BOOLEAN NOT NULL DEFAULT false
);

-- CreateTable
CREATE TABLE "Avis" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nom" TEXT NOT NULL,
    "citation" TEXT NOT NULL,
    "contexte" TEXT NOT NULL,
    "note" INTEGER,
    "visible" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "Partenaire" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nom" TEXT NOT NULL,
    "metier" TEXT NOT NULL,
    "photo" TEXT NOT NULL,
    "photoAlt" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "visible" BOOLEAN NOT NULL DEFAULT false
);

-- CreateTable
CREATE TABLE "Image" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "url" TEXT NOT NULL,
    "alt" TEXT NOT NULL,
    "page" TEXT NOT NULL,
    "ordre" INTEGER NOT NULL DEFAULT 0
);

-- Copie des photos des expériences dans la galerie générique
INSERT INTO "Image" ("url", "alt", "page", "ordre")
SELECT ei."url", ei."alt", '/experiences/' || e."slug", ei."ordre"
FROM "ExperienceImage" ei
JOIN "Experience" e ON e."id" = ei."experienceId";

-- DropIndex
DROP INDEX "ExperienceImage_experienceId_ordre_idx";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "ExperienceImage";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nom" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "telephone" TEXT,
    "role" TEXT NOT NULL DEFAULT 'client',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AuthSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "token" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AuthSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuthAccount" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" DATETIME,
    "refreshTokenExpiresAt" DATETIME,
    "scope" TEXT,
    "password" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AuthAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuthVerification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,
    CONSTRAINT "DemandeDevis_experienceId_fkey" FOREIGN KEY ("experienceId") REFERENCES "Experience" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "DemandeDevis_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_DemandeDevis" ("contactNom", "createdAt", "dateSouhaitee", "email", "entreprise", "experienceId", "id", "message", "nbParticipants", "statut", "telephone", "typeDemande") SELECT "contactNom", "createdAt", "dateSouhaitee", "email", "entreprise", "experienceId", "id", "message", "nbParticipants", "statut", "telephone", "typeDemande" FROM "DemandeDevis";
DROP TABLE "DemandeDevis";
ALTER TABLE "new_DemandeDevis" RENAME TO "DemandeDevis";
CREATE INDEX "DemandeDevis_experienceId_idx" ON "DemandeDevis"("experienceId");
CREATE INDEX "DemandeDevis_userId_idx" ON "DemandeDevis"("userId");
CREATE TABLE "new_Episode" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "guid" TEXT,
    "saison" INTEGER NOT NULL DEFAULT 1,
    "numero" INTEGER NOT NULL,
    "titre" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "resume" TEXT NOT NULL DEFAULT '',
    "invite" TEXT,
    "datePublication" DATETIME NOT NULL,
    "dureeMin" INTEGER NOT NULL,
    "image" TEXT NOT NULL,
    "embedUrl" TEXT NOT NULL,
    "spotifyUrl" TEXT,
    "deezerUrl" TEXT,
    "appleUrl" TEXT,
    "youtubeUrl" TEXT
);
INSERT INTO "new_Episode" ("appleUrl", "datePublication", "deezerUrl", "description", "dureeMin", "embedUrl", "id", "image", "invite", "numero", "spotifyUrl", "titre", "youtubeUrl") SELECT "appleUrl", "datePublication", "deezerUrl", "description", "dureeMin", "embedUrl", "id", "image", "invite", "numero", "spotifyUrl", "titre", "youtubeUrl" FROM "Episode";
DROP TABLE "Episode";
ALTER TABLE "new_Episode" RENAME TO "Episode";
CREATE UNIQUE INDEX "Episode_guid_key" ON "Episode"("guid");
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
    "userId" TEXT,
    CONSTRAINT "Reservation_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Reservation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Reservation" ("checkoutKey", "checkoutPayload", "createdAt", "email", "id", "montantCents", "nbPersonnes", "nom", "sessionId", "statut", "stripeSessionId", "telephone") SELECT "checkoutKey", "checkoutPayload", "createdAt", "email", "id", "montantCents", "nbPersonnes", "nom", "sessionId", "statut", "stripeSessionId", "telephone" FROM "Reservation";
DROP TABLE "Reservation";
ALTER TABLE "new_Reservation" RENAME TO "Reservation";
CREATE UNIQUE INDEX "Reservation_stripeSessionId_key" ON "Reservation"("stripeSessionId");
CREATE UNIQUE INDEX "Reservation_checkoutKey_key" ON "Reservation"("checkoutKey");
CREATE INDEX "Reservation_sessionId_idx" ON "Reservation"("sessionId");
CREATE INDEX "Reservation_userId_idx" ON "Reservation"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Article_slug_key" ON "Article"("slug");

-- CreateIndex
CREATE INDEX "Image_page_ordre_idx" ON "Image"("page", "ordre");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "AuthSession_token_key" ON "AuthSession"("token");

-- CreateIndex
CREATE INDEX "AuthSession_userId_idx" ON "AuthSession"("userId");

-- CreateIndex
CREATE INDEX "AuthAccount_userId_idx" ON "AuthAccount"("userId");

-- CreateIndex
CREATE INDEX "AuthVerification_identifier_idx" ON "AuthVerification"("identifier");
