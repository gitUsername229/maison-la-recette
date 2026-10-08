-- Contenus fixes (src/contenu/), événements Luma et épisodes Ausha : la base ne garde que les demandes de devis
-- et les inscriptions à la newsletter.

PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

-- Demandes de devis : l'expérience est désignée par son slug (src/contenu/experiences.ts), repris de l'ancienne
-- table des expériences ; le statut et la note interne, propres à l'administration supprimée, disparaissent.
CREATE TABLE "new_DemandeDevis" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "entreprise" TEXT NOT NULL,
    "contactNom" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telephone" TEXT,
    "typeDemande" TEXT NOT NULL,
    "experience" TEXT,
    "nbParticipants" INTEGER,
    "dateSouhaitee" DATETIME,
    "lieuSouhaite" TEXT,
    "message" TEXT NOT NULL,
    "consentementLe" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_DemandeDevis" ("id", "entreprise", "contactNom", "email", "telephone", "typeDemande", "experience", "nbParticipants", "dateSouhaitee", "lieuSouhaite", "message", "consentementLe", "createdAt")
SELECT d."id", d."entreprise", d."contactNom", d."email", d."telephone", d."typeDemande", e."slug", d."nbParticipants", d."dateSouhaitee", d."lieuSouhaite", d."message", d."consentementLe", d."createdAt"
FROM "DemandeDevis" d LEFT JOIN "Experience" e ON e."id" = d."experienceId";
DROP TABLE "DemandeDevis";
ALTER TABLE "new_DemandeDevis" RENAME TO "DemandeDevis";

-- Tables devenues inutiles : contenus (src/contenu/), épisodes (lus chez Ausha), expériences, sessions et
-- réservations (Luma), comptes d'administration (Better Auth).
DROP TABLE "_ArticleToExperience";
DROP TABLE "Article";
DROP TABLE "Reservation";
DROP TABLE "Session";
DROP TABLE "Experience";
DROP TABLE "Episode";
DROP TABLE "Avis";
DROP TABLE "Partenaire";
DROP TABLE "Image";
DROP TABLE "TextePage";
DROP TABLE "AuthSession";
DROP TABLE "AuthAccount";
DROP TABLE "AuthVerification";
DROP TABLE "User";

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
