# QUV-LAB v1.2.0 — MATRICE D'EXIGENCES ET DE TRACEABILITÉ

| Réf. Exigence | Description de l'Exigence | Fichier Implémentation | Fichier de Test | Preuve d'Exécution | Statut |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **REQ-MOD-01** | Modèle relationnel strict Trial $\rightarrow$ Batch $\rightarrow$ Panel $\rightarrow$ Stage $\rightarrow$ Acq | `src/types/trial.ts` & `src/services/trialStore.ts` | `src/scientific/tests/gate31_integrity.test.ts` | G31-MOD-01 PASS | **CONFIRMÉ PAR TEST & CODE** |
| **REQ-MET-01** | Couleur CIE 1976 $\Delta E^*_{ab}$ sur 4 points de mesure | `src/scientific/colorEngine.ts` | `src/scientific/tests/gate33_scientific_metrology.test.ts` | G33-COL-01..06 PASS | **CONFIRMÉ PAR TEST & CODE** |
| **REQ-MET-02** | Brillance 60° GU (S1/S2) et taux de rétention $R = (G_C / G_{T0}) \times 100$ | `src/scientific/glossEngine.ts` | `src/scientific/tests/gate33_scientific_metrology.test.ts` | G33-GLO-01..03 PASS | **CONFIRMÉ PAR TEST & CODE** |
| **REQ-MET-03** | Dureté Persoz en 3 répétitions, calcul $s$ et $CV\%$ | `src/scientific/persozEngine.ts` | `src/scientific/tests/gate33_scientific_metrology.test.ts` | G33-PER-01..02 PASS | **CONFIRMÉ PAR TEST & CODE** |
| **REQ-MET-04** | Observations qualitatives ISO 4628 (0 à 5) | `src/scientific/observationsEngine.ts` | `src/scientific/tests/gate33_scientific_metrology.test.ts` | G33-OBS-01 PASS | **CONFIRMÉ PAR TEST & CODE** |
| **REQ-WIT-01** | Ségrégation métrologique absolue du témoin $T$ des cinétiques exposées | `src/scientific/panelUtils.ts` & `src/scientific/aggregations.ts` | `src/scientific/tests/gate33_scientific_metrology.test.ts` | G33-WIT-01 PASS | **CONFIRMÉ PAR TEST & CODE** |
| **REQ-SCH-01** | Calendrier normatif 13 jalons, échéance finale 2016 h (et non 2000 h) | `src/scientific/protocolEngine.ts` | `src/scientific/tests/gate34_normative_reporting.test.ts` | G34-SCH-01 PASS | **CONFIRMÉ PAR TEST & CODE** |
| **REQ-REP-01** | Rapport scientifique conforme en 19 sections + 6 annexes techniques | `src/services/reportGenerator.ts` | `src/scientific/tests/gate34_normative_reporting.test.ts` | G34-REP-01 PASS | **CONFIRMÉ PAR TEST & CODE** |
| **REQ-EXP-01** | Double export CSV (`RAW` et `REPORT`) étanches et explicites | `src/services/reportGenerator.ts` | `src/scientific/tests/gate34_normative_reporting.test.ts` | G34-WIT-01 & G34-EXP-01 PASS | **CONFIRMÉ PAR TEST & CODE** |
| **REQ-BCK-01** | Sauvegarde et restauration JSON 100 % réversible sans perte relationnelle | `src/services/trialStore.ts` | `src/scientific/tests/gate50_operational_qualification.test.ts` | G50-BCK-01 & G50-RES-01 PASS | **CONFIRMÉ PAR TEST & CODE** |
| **REQ-RES-01** | Rejet immédiat de tout JSON corrompu ou acquisition orpheline | `src/services/trialStore.ts` | `src/scientific/tests/gate50_operational_qualification.test.ts` | G50-COR-01 & G50-COR-02 PASS | **CONFIRMÉ PAR TEST & CODE** |
| **REQ-PHO-01** | Photothèque : unicité active, archivage non destructif (`replacementMediaId`) | `src/services/trialStore.ts` | `src/scientific/tests/gate50_operational_qualification.test.ts` | G50-PHO-01 PASS | **CONFIRMÉ PAR TEST & CODE** |
| **REQ-AUD-01** | Journal d'audit append-only avec timestamps ISO et opérateurs | `src/scientific/auditEngine.ts` | `src/scientific/tests/gate50_operational_qualification.test.ts` | G50-AUD-01 PASS | **CONFIRMÉ PAR TEST & CODE** |
