-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Avis" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nom" TEXT NOT NULL,
    "citation" TEXT NOT NULL,
    "contexte" TEXT NOT NULL,
    "note" INTEGER,
    "date" DATETIME,
    "demo" BOOLEAN NOT NULL DEFAULT false,
    "visible" BOOLEAN NOT NULL DEFAULT true
);
INSERT INTO "new_Avis" ("citation", "contexte", "id", "nom", "note", "visible") SELECT "citation", "contexte", "id", "nom", "note", "visible" FROM "Avis";
DROP TABLE "Avis";
ALTER TABLE "new_Avis" RENAME TO "Avis";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
