# QUV-LAB v1.2.0 — LIMITATIONS CONNUES & CONDITIONS D'EXPLOITATION

## 1. Limitations Architecturales Documentées

| Limitation Identifiée | Nature & Impact | Classification | Mesure Opérationnelle Requise |
| :--- | :--- | :--- | :--- |
| **Persistance Locale Navigateur (`localStorage`)** | Le cache local peut être purgé par l'utilisateur ou par les politiques de sécurité du navigateur. | **ACCEPTABLE EN EXPLOITATION CONTRÔLÉE** | Export JSON obligatoire après chaque jalon validé et dépôt sur serveur réseau. |
| **Absence d'Authentification Centralisée** | Pas de gestion de sessions utilisateurs distantes (comptes/mots de passe). | **ACCEPTABLE EN EXPLOITATION CONTRÔLÉE** | Traçabilité assurée par la saisie obligatoire de l'opérateur dans les actions d'audit. |
| **Gestion des Fichiers Images Binaires** | Les fichiers haute résolution ne sont pas intégrés en base64 dans le JSON pour éviter de saturer le quota `localStorage` (5 Mo). | **ACCEPTABLE EN EXPLOITATION CONTRÔLÉE** | Les photos sont stockées sur le serveur du laboratoire et indexées par leur nom dans la photothèque. |
| **Travail Multi-Onglets Simultané** | Deux onglets ouverts sur le même essai peuvent s'écraser mutuellement (*Last-Write-Wins*). | **ACCEPTABLE EN EXPLOITATION CONTRÔLÉE** | Règle d'exploitation : Travailler sur un seul onglet actif par essai. |
| **Navigation Privée** | Les données locales sont détruites à la fermeture de la fenêtre privée. | **ACCEPTABLE EN EXPLOITATION CONTRÔLÉE** | Interdiction formelle d'utiliser QUV-Lab en navigation privée. |
