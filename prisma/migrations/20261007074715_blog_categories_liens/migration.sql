-- CreateTable
CREATE TABLE "_ArticleToExperience" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_ArticleToExperience_A_fkey" FOREIGN KEY ("A") REFERENCES "Article" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_ArticleToExperience_B_fkey" FOREIGN KEY ("B") REFERENCES "Experience" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Article" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "slug" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "extrait" TEXT NOT NULL,
    "contenu" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "imageAlt" TEXT NOT NULL,
    "categorie" TEXT NOT NULL DEFAULT 'guides',
    "episodeId" INTEGER,
    "datePublication" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publie" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Article_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "Episode" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Article" ("contenu", "datePublication", "extrait", "id", "image", "imageAlt", "publie", "slug", "titre") SELECT "contenu", "datePublication", "extrait", "id", "image", "imageAlt", "publie", "slug", "titre" FROM "Article";
DROP TABLE "Article";
ALTER TABLE "new_Article" RENAME TO "Article";
CREATE UNIQUE INDEX "Article_slug_key" ON "Article"("slug");
CREATE INDEX "Article_publie_categorie_datePublication_idx" ON "Article"("publie", "categorie", "datePublication");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "_ArticleToExperience_AB_unique" ON "_ArticleToExperience"("A", "B");

-- CreateIndex
CREATE INDEX "_ArticleToExperience_B_index" ON "_ArticleToExperience"("B");
