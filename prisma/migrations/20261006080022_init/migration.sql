-- CreateTable
CREATE TABLE "Experience" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "slug" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "accroche" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "dureeMin" INTEGER NOT NULL,
    "prixCents" INTEGER NOT NULL,
    "prixEntrepriseCents" INTEGER,
    "capaciteMax" INTEGER NOT NULL,
    "lieu" TEXT,
    "image" TEXT NOT NULL,
    "imageAlt" TEXT NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ExperienceImage" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "experienceId" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "alt" TEXT NOT NULL,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "ExperienceImage_experienceId_fkey" FOREIGN KEY ("experienceId") REFERENCES "Experience" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Session" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "experienceId" INTEGER NOT NULL,
    "dateDebut" DATETIME NOT NULL,
    "dateFin" DATETIME NOT NULL,
    "lieu" TEXT NOT NULL,
    "placesTotal" INTEGER NOT NULL,
    "placesPrises" INTEGER NOT NULL DEFAULT 0,
    "prixCents" INTEGER,
    "statut" TEXT NOT NULL DEFAULT 'ouverte',
    CONSTRAINT "Session_experienceId_fkey" FOREIGN KEY ("experienceId") REFERENCES "Experience" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Reservation" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "sessionId" INTEGER NOT NULL,
    "nom" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telephone" TEXT,
    "nbPersonnes" INTEGER NOT NULL,
    "montantCents" INTEGER NOT NULL,
    "statut" TEXT NOT NULL DEFAULT 'en_attente',
    "stripeSessionId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Reservation_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DemandeDevis" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "entreprise" TEXT NOT NULL,
    "contactNom" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telephone" TEXT,
    "typeDemande" TEXT NOT NULL,
    "experienceId" INTEGER,
    "nbParticipants" INTEGER,
    "dateSouhaitee" DATETIME,
    "message" TEXT NOT NULL,
    "statut" TEXT NOT NULL DEFAULT 'nouvelle',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DemandeDevis_experienceId_fkey" FOREIGN KEY ("experienceId") REFERENCES "Experience" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Episode" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "numero" INTEGER NOT NULL,
    "titre" TEXT NOT NULL,
    "description" TEXT NOT NULL,
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

-- CreateTable
CREATE TABLE "Reference" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nom" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "logo" TEXT,
    "citation" TEXT,
    "auteur" TEXT,
    "ordre" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "Newsletter" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "Experience_slug_key" ON "Experience"("slug");

-- CreateIndex
CREATE INDEX "ExperienceImage_experienceId_ordre_idx" ON "ExperienceImage"("experienceId", "ordre");

-- CreateIndex
CREATE INDEX "Session_experienceId_dateDebut_idx" ON "Session"("experienceId", "dateDebut");

-- CreateIndex
CREATE UNIQUE INDEX "Reservation_stripeSessionId_key" ON "Reservation"("stripeSessionId");

-- CreateIndex
CREATE INDEX "Reservation_sessionId_idx" ON "Reservation"("sessionId");

-- CreateIndex
CREATE INDEX "DemandeDevis_experienceId_idx" ON "DemandeDevis"("experienceId");

-- CreateIndex
CREATE UNIQUE INDEX "Newsletter_email_key" ON "Newsletter"("email");
