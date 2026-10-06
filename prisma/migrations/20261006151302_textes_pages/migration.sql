-- CreateTable
CREATE TABLE "TextePage" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "page" TEXT NOT NULL,
    "cle" TEXT NOT NULL,
    "texte" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "TextePage_page_cle_key" ON "TextePage"("page", "cle");
