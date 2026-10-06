-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Experience" (
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
    "reservableEnLigne" BOOLEAN NOT NULL DEFAULT true,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Experience" ("accroche", "actif", "capaciteMax", "createdAt", "description", "dureeMin", "id", "image", "imageAlt", "lieu", "prixCents", "prixEntrepriseCents", "slug", "titre", "type") SELECT "accroche", "actif", "capaciteMax", "createdAt", "description", "dureeMin", "id", "image", "imageAlt", "lieu", "prixCents", "prixEntrepriseCents", "slug", "titre", "type" FROM "Experience";
DROP TABLE "Experience";
ALTER TABLE "new_Experience" RENAME TO "Experience";
CREATE UNIQUE INDEX "Experience_slug_key" ON "Experience"("slug");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
