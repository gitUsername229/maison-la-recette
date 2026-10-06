-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Episode" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "guid" TEXT,
    "saison" INTEGER NOT NULL DEFAULT 1,
    "numero" INTEGER NOT NULL,
    "titre" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "resume" TEXT NOT NULL DEFAULT '',
    "type" TEXT NOT NULL DEFAULT 'complet',
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
INSERT INTO "new_Episode" ("appleUrl", "datePublication", "deezerUrl", "description", "dureeMin", "embedUrl", "guid", "id", "image", "invite", "numero", "resume", "saison", "spotifyUrl", "titre", "youtubeUrl") SELECT "appleUrl", "datePublication", "deezerUrl", "description", "dureeMin", "embedUrl", "guid", "id", "image", "invite", "numero", "resume", "saison", "spotifyUrl", "titre", "youtubeUrl" FROM "Episode";
DROP TABLE "Episode";
ALTER TABLE "new_Episode" RENAME TO "Episode";
CREATE UNIQUE INDEX "Episode_guid_key" ON "Episode"("guid");
CREATE INDEX "Episode_type_saison_idx" ON "Episode"("type", "saison");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
