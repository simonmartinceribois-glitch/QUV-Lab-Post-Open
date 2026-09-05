# QUV-LAB v1.2.0 — POLITIQUE DE SAUVEGARDE & RESTAURATION

## 1. Principe de Persistance à 3 Niveaux
```text
localStorage du Navigateur ──► Persistance de travail volatile
Export JSON externe        ──► Sauvegarde de sécurité après chaque jalon
Serveur Réseau Sécurisé    ──► Archivage réglementaire définitif
```

## 2. Structure d'Archivage sur Serveur Laboratoire
```text
/SERVEUR_LABORATOIRE/QUV_ARCHIVES/
    └── 2026/
        └── ESSAI_[REF]/
            ├── 01_JSON/         (Sauvegardes jalons et archive finale)
            ├── 02_RAW_CSV/      (Données brutes de paillasse pour auditabilité)
            ├── 03_REPORT_CSV/   (Matrice des résultats calculés)
            ├── 04_RAPPORT_PDF/  (Rapports normatifs signés)
            ├── 05_PHOTOTHEQUE/  (Fichiers originaux haute résolution)
            └── 06_AUDIT/        (Exports du journal d'audit)
```

## 3. Procédure de Restauration
1. En cas de changement de poste ou de purge du cache, ouvrir QUV-Lab.
2. Cliquer sur **« Importer un Essai »** et charger le dernier fichier `.json` sauvegardé.
3. Le système vérifie l'intégrité de l'essai et reconstitue fidèlement les données, calculs, photographies et audit trail.
