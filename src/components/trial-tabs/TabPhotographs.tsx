/**
 * QUV-Lab — MODULE PHOTOTHÈQUE & SUIVI VISUEL TEMPOREL (NF EN 927-6)
 *
 * RÈGLE FONDAMENTALE :
 * La Photothèque est un module transversal INDÉPENDANT des familles de mesure (Couleur, Brillance, Persoz, Adhérence, Observations).
 * Une mesure scientifique n'est JAMAIS bloquée par l'absence d'une photo.
 * L'absence de cliché sur un jalon est un choix opératoire et n'est JAMAIS une anomalie.
 *
 * ARCHITECTURE RELATIONNELLE STRICTE :
 * ESSAI → LOT → ÉCHANTILLON → JALON
 * Traçabilité intégrale : ID, Lot, Échantillon, Jalon, Heures cumulées, Date/Heure, Opérateur, Fichier, Légende, Statut (Actif/Archivé).
 *
 * FONCTIONNALITÉS CLÉS :
 * 1. Navigation hiérarchique prioritaire : Essai → Lot → Échantillon → Chronologie
 * 2. Comparateur temporel interactif à N jalons (2, 3, 4, N photographies côte à côte)
 * 3. Garde-fou normatif interdisant ou signalant toute comparaison erronée inter-échantillons
 * 4. Planche d'évolution photographique normalisée pour analyse et rapport
 * 5. Matrice synoptique globale & Galerie multi-critères
 * 6. Remplacement contrôlé avec archivage non-destructif (Gate 2.2)
 */

import React, { useState, useMemo } from 'react';
import { Trial, MediaReference, BatchDefinition, PanelDefinition, ExposureStage } from '../../types/trial';
import { globalTrialStore } from '../../services/trialStore';
import { PhotoModeSwitcher } from '../phototheque/PhotoModeSwitcher';
import { PhotoTimelineView } from '../phototheque/PhotoTimelineView';
import { PhotoCompareView } from '../phototheque/PhotoCompareView';
import { PhotoMatrixView } from '../phototheque/PhotoMatrixView';
import { PhotoGalleryView } from '../phototheque/PhotoGalleryView';
import { PhotoAddModal } from '../phototheque/PhotoAddModal';
import { PhotoLightbox } from '../phototheque/PhotoLightbox';
import type { PhotothequeViewMode } from '../phototheque/photoTypes';
import {
  Camera,
  Upload,
  Filter,
  Grid,
  Columns,
  Layers,
  Clock,
  Trash2,
  Maximize2,
  X,
  Plus,
  Calendar,
  User,
  Info,
  CheckCircle2,
  Tag,
  Compass,
  Eye,
  SlidersHorizontal,
  Download,
  AlertCircle,
  Archive,
  History,
  RefreshCw,
  AlertTriangle,
  ShieldCheck,
  Split,
  ChevronRight,
  Folder,
  Sliders,
  Sparkles,
  FileImage,
  Printer,
  ZoomIn,
  ArrowRight
} from 'lucide-react';

interface Props {
  trial: Trial;
  onTrialUpdated: () => void;
}

export function TabPhotographs({ trial, onTrialUpdated }: Props) {
  // Mode d'affichage principal
  const [viewMode, setViewMode] = useState<PhotothequeViewMode>('SPECIMEN_TIMELINE');

  // Navigation hiérarchique : Lot actif et Éprouvette active
  const firstBatch = trial.batches[0];
  const firstPanel = firstBatch?.panels[0];

  const [activeBatchId, setActiveBatchId] = useState<string>(firstBatch?.id || '');
  const [activePanelId, setActivePanelId] = useState<string>(firstPanel?.id || '');

  // Sélection pour le mode "Comparer les photographies" (IDs des médias sélectionnés)
  const [selectedPhotoIdsForCompare, setSelectedPhotoIdsForCompare] = useState<string[]>([]);

  // Filtres galerie
  const [selectedGalleryBatchId, setSelectedGalleryBatchId] = useState<string>('ALL');
  const [selectedGalleryStageId, setSelectedGalleryStageId] = useState<string>('ALL');
  const [selectedGallerySpecimenRole, setSelectedGallerySpecimenRole] = useState<string>('ALL');
  const [showArchived, setShowArchived] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal Ajout / Remplacement
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPhotoBatchId, setNewPhotoBatchId] = useState<string>(firstBatch?.id || '');
  const [newPhotoPanelId, setNewPhotoPanelId] = useState<string>(firstPanel?.id || '');
  const [newPhotoStageId, setNewPhotoStageId] = useState<string>(trial.stages[0]?.id || '');
  const [newPhotoCaption, setNewPhotoCaption] = useState<string>('');
  const [newPhotoFace, setNewPhotoFace] = useState<string>('Face externe');
  const [newPhotoOperator, setNewPhotoOperator] = useState<string>(trial.metadata.createdBy || 'Simon Martin (Technicien)');
  const [newPhotoDataUrl, setNewPhotoDataUrl] = useState<string>('');
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Lightbox
  const [lightboxMedia, setLightboxMedia] = useState<MediaReference | null>(null);

  // Mappings
  const panelMap = useMemo(() => {
    const map = new Map<string, { panel: PanelDefinition; batch: BatchDefinition }>();
    trial.batches.forEach((batch) => {
      batch.panels.forEach((panel) => {
        map.set(panel.id, { panel, batch });
      });
    });
    return map;
  }, [trial.batches]);

  const stageMap = useMemo(() => {
    const map = new Map<string, ExposureStage>();
    trial.stages.forEach((st) => {
      map.set(st.id, st);
    });
    return map;
  }, [trial.stages]);

  // Échantillon actif pour la navigation
  const activeBatch = useMemo(() => {
    return trial.batches.find((b) => b.id === activeBatchId) || trial.batches[0];
  }, [trial.batches, activeBatchId]);

  const activePanel = useMemo(() => {
    if (!activeBatch) return null;
    return activeBatch.panels.find((p) => p.id === activePanelId) || activeBatch.panels[0] || null;
  }, [activeBatch, activePanelId]);

  // Synchroniser si l'échantillon change
  const handleSelectSpecimen = (batchId: string, panelId: string) => {
    setActiveBatchId(batchId);
    setActivePanelId(panelId);
    // Auto-sélectionner les photos de cet échantillon pour la comparaison
    const photosOfThisPanel = trial.mediaReferences
      .filter((m) => m.type === 'PHOTO' && m.panelId === panelId && m.status !== 'ARCHIVED')
      .map((m) => m.id);
    setSelectedPhotoIdsForCompare(photosOfThisPanel);
  };

  // Détection d'un cliché actif existant dans le modal
  const existingActivePhotoInModal = useMemo(() => {
    if (!newPhotoPanelId || !newPhotoStageId) return null;
    return (
      trial.mediaReferences.find(
        (m) =>
          m.type === 'PHOTO' &&
          m.panelId === newPhotoPanelId &&
          m.stageId === newPhotoStageId &&
          m.status !== 'ARCHIVED'
      ) || null
    );
  }, [trial.mediaReferences, newPhotoPanelId, newPhotoStageId]);

  // Photographies actives de l'échantillon actuellement sélectionné
  const activePanelPhotos = useMemo(() => {
    if (!activePanel) return [];
    return trial.mediaReferences
      .filter((m) => m.type === 'PHOTO' && m.panelId === activePanel.id)
      .sort((a, b) => {
        const stA = a.stageId ? stageMap.get(a.stageId)?.cycleIndex ?? 0 : 0;
        const stB = b.stageId ? stageMap.get(b.stageId)?.cycleIndex ?? 0 : 0;
        return stA - stB;
      });
  }, [trial.mediaReferences, activePanel, stageMap]);

  // Photographies sélectionnées pour la comparaison temporelle
  const comparedPhotos = useMemo(() => {
    const list = trial.mediaReferences.filter((m) => selectedPhotoIdsForCompare.includes(m.id) && m.type === 'PHOTO');
    // Trier dans l'ordre chronologique strict (cycleIndex croissant)
    return list.sort((a, b) => {
      const stA = a.stageId ? stageMap.get(a.stageId)?.cycleIndex ?? 0 : 0;
      const stB = b.stageId ? stageMap.get(b.stageId)?.cycleIndex ?? 0 : 0;
      return stA - stB;
    });
  }, [trial.mediaReferences, selectedPhotoIdsForCompare, stageMap]);

  // Garde-fou : Vérification si toutes les photos comparées appartiennent au MÊME échantillon
  const compareIntegrityCheck = useMemo(() => {
    if (comparedPhotos.length <= 1) return { isSamePanel: true, panelIds: [] };
    const panelIds = Array.from(new Set(comparedPhotos.map((p) => p.panelId).filter(Boolean)));
    return {
      isSamePanel: panelIds.length <= 1,
      panelIds
    };
  }, [comparedPhotos]);

  // Liste filtrée des photos pour le mode GALERIE
  const filteredGalleryPhotos = useMemo(() => {
    return trial.mediaReferences.filter((media) => {
      if (media.type !== 'PHOTO') return false;

      if (!showArchived && media.status === 'ARCHIVED') return false;

      if (selectedGalleryBatchId !== 'ALL') {
        const info = media.panelId ? panelMap.get(media.panelId) : null;
        if (!info || info.batch.id !== selectedGalleryBatchId) return false;
      }

      if (selectedGalleryStageId !== 'ALL' && media.stageId !== selectedGalleryStageId) {
        return false;
      }

      if (selectedGallerySpecimenRole !== 'ALL' && media.panelId) {
        const info = panelMap.get(media.panelId);
        if (!info) return false;
        if (selectedGallerySpecimenRole === 'WITNESS' && info.panel.label !== 'T') return false;
        if (selectedGallerySpecimenRole === 'EXPOSED' && info.panel.label === 'T') return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const captionMatch = media.caption?.toLowerCase().includes(q);
        const filenameMatch = media.filename?.toLowerCase().includes(q);
        const operatorMatch = media.capturedBy?.toLowerCase().includes(q);
        if (!captionMatch && !filenameMatch && !operatorMatch) return false;
      }

      return true;
    });
  }, [
    trial.mediaReferences,
    selectedGalleryBatchId,
    selectedGalleryStageId,
    selectedGallerySpecimenRole,
    showArchived,
    searchQuery,
    panelMap
  ]);

  // Gestion du fichier image
  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Veuillez sélectionner un fichier image valide (JPG, PNG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setNewPhotoDataUrl(result);
      setUploadError(null);
    };
    reader.onerror = () => {
      setUploadError('Erreur lors de la lecture du fichier image.');
    };
    reader.readAsDataURL(file);
  };

  const handleOpenAddModalForStage = (batchId: string, panelId: string, stageId: string) => {
    setNewPhotoBatchId(batchId);
    setNewPhotoPanelId(panelId);
    setNewPhotoStageId(stageId);
    setNewPhotoCaption('');
    setNewPhotoDataUrl('');
    setUploadError(null);
    setShowAddModal(true);
  };

  const handleSavePhoto = () => {
    if (!newPhotoPanelId || !newPhotoStageId) {
      setUploadError('Veuillez sélectionner une éprouvette et un jalon.');
      return;
    }

    const info = panelMap.get(newPhotoPanelId);
    const stage = stageMap.get(newPhotoStageId);
    const label = info ? `${info.batch.reference}-${info.panel.label}` : 'Echantillon';
    const stageName = stage ? stage.name : 'Jalon';
    const filename = `PHOTO_${label.replace(/\s+/g, '_')}_${stage ? stage.cycleIndex : 0}_${Date.now()}.jpg`;

    // Générer une image par défaut haute fidélité si l'utilisateur n'a pas chargé d'image physique
    const defaultDataUrl =
      newPhotoDataUrl ||
      `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><defs><linearGradient id="bgnew" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23d97706"/><stop offset="100%" stop-color="%2378350f"/></linearGradient><pattern id="woodpat" width="40" height="10" patternUnits="userSpaceOnUse"><path d="M 0 5 Q 20 0 40 5" stroke="%23ffffff" stroke-width="0.5" stroke-opacity="0.15" fill="none"/></pattern></defs><rect width="600" height="400" fill="url(%23bgnew)"/><rect width="600" height="400" fill="url(%23woodpat)"/><rect x="20" y="20" width="560" height="360" rx="14" fill="none" stroke="%23ffffff" stroke-width="1.5" stroke-opacity="0.35"/><rect x="35" y="35" width="220" height="32" rx="8" fill="%230f172a" fill-opacity="0.85"/><text x="45" y="56" font-family="monospace" font-size="13" font-weight="bold" fill="%2338bdf8">${label}</text><rect x="420" y="35" width="145" height="32" rx="8" fill="%231e293b" fill-opacity="0.85"/><text x="492" y="56" font-family="monospace" font-size="13" font-weight="bold" fill="%23fbbf24" text-anchor="middle">${stage?.name || 'Jalon'}</text><rect x="35" y="295" width="530" height="70" rx="10" fill="%23020617" fill-opacity="0.8"/><text x="50" y="322" font-family="sans-serif" font-size="13" font-weight="bold" fill="%23f8fafc">${newPhotoCaption.trim() || `Cliché documentaire ${label} (${newPhotoFace})`}</text><text x="50" y="346" font-family="monospace" font-size="11" fill="%2394a3b8">NF EN 927-6 • ${newPhotoOperator} • ${new Date().toLocaleDateString('fr-FR')}</text></svg>`;

    try {
      globalTrialStore.attachPhoto({
        trialId: trial.id,
        panelId: newPhotoPanelId,
        stageId: newPhotoStageId,
        filename,
        caption: newPhotoCaption.trim() || `Cliché documentaire ${label} — ${stageName} (${newPhotoFace})`,
        operatorId: newPhotoOperator.trim() || 'Simon Martin (Technicien)',
        storageKey: defaultDataUrl
      });

      setShowAddModal(false);
      setNewPhotoCaption('');
      setNewPhotoDataUrl('');
      setUploadError(null);
      onTrialUpdated();
    } catch (err: any) {
      setUploadError(err.message || "Erreur lors de l'enregistrement de la photo");
    }
  };

  const handleDeletePhoto = (mediaId: string) => {
    // 1. Rechercher si le mediaId est actuellement référencé dans acquisitions[*].mediaIds
    const referencingAcquisitions = Object.values(trial.acquisitions || {}).filter(
      (acq) => Array.isArray(acq.mediaIds) && acq.mediaIds.includes(mediaId)
    );

    // 2. Déterminer le message de confirmation selon la présence de références
    const confirmMessage =
      referencingAcquisitions.length > 0
        ? "Cette photographie est associée à une observation enregistrée. La supprimer n'affectera pas les données de mesure, mais supprimera la preuve photographique associée. Confirmer la suppression ?"
        : 'Confirmez-vous la suppression de cette photographie ?';

    if (!window.confirm(confirmMessage)) return;

    // Traçabilité de suppression dans l'audit trail
    // Note d'architecture : opérateur passé via createdBy à défaut d'une session utilisateur connectée
    globalTrialStore.deletePhoto(trial.id, mediaId, trial.metadata.createdBy || 'OPERATOR');
    if (lightboxMedia?.id === mediaId) {
      setLightboxMedia(null);
    }
    setSelectedPhotoIdsForCompare((prev) => prev.filter((id) => id !== mediaId));
    onTrialUpdated();
  };

  const toggleComparePhoto = (photoId: string) => {
    setSelectedPhotoIdsForCompare((prev) =>
      prev.includes(photoId) ? prev.filter((id) => id !== photoId) : [...prev, photoId]
    );
  };

  const handleLaunchCompareForSpecimen = (panelId: string) => {
    const photos = trial.mediaReferences
      .filter((m) => m.type === 'PHOTO' && m.panelId === panelId && m.status !== 'ARCHIVED')
      .map((m) => m.id);
    setSelectedPhotoIdsForCompare(photos);
    setViewMode('TEMPORAL_COMPARE');
  };

  // Liste des éprouvettes du lot sélectionné dans le modal
  const modalBatchPanels = useMemo(() => {
    const b = trial.batches.find((batch) => batch.id === newPhotoBatchId);
    return b ? b.panels : [];
  }, [trial.batches, newPhotoBatchId]);

  return (
    <div className="space-y-6">
      <PhotoModeSwitcher
        viewMode={viewMode}
        onSelectMode={setViewMode}
        compareCount={comparedPhotos.length}
        activeSpecimen={
          activeBatch && activePanel ? { batchId: activeBatch.id, panelId: activePanel.id } : null
        }
        firstStageId={trial.stages[0]?.id || ''}
        onOpenAddModalForStage={handleOpenAddModalForStage}
        onOpenBlankModal={() => setShowAddModal(true)}
      />

      {/* 2. VUE PRINCIPALE 1 : NAVIGATION PRIORITAIRE (voir phototheque/PhotoTimelineView) */}
      {viewMode === 'SPECIMEN_TIMELINE' && (
        <PhotoTimelineView
          trial={trial}
          activeBatch={activeBatch}
          activePanel={activePanel}
          activeBatchId={activeBatchId}
          activePanelId={activePanelId}
          activePanelPhotos={activePanelPhotos}
          selectedPhotoIdsForCompare={selectedPhotoIdsForCompare}
          onSelectSpecimen={handleSelectSpecimen}
          onLaunchCompareForSpecimen={handleLaunchCompareForSpecimen}
          onToggleComparePhoto={toggleComparePhoto}
          onOpenAddModalForStage={handleOpenAddModalForStage}
          onDeletePhoto={handleDeletePhoto}
          onPreviewPhoto={setLightboxMedia}
        />
      )}

      {/* 3. VUE COMPARATEUR (voir phototheque/PhotoCompareView) */}
      {viewMode === 'TEMPORAL_COMPARE' && (
        <PhotoCompareView
          trial={trial}
          activeBatchId={activeBatchId}
          activePanelId={activePanelId}
          activePanel={activePanel}
          activePanelPhotos={activePanelPhotos}
          comparedPhotos={comparedPhotos}
          compareIntegrityCheck={compareIntegrityCheck}
          selectedPhotoIdsForCompare={selectedPhotoIdsForCompare}
          stageMap={stageMap}
          panelMap={panelMap}
          onSelectSpecimen={handleSelectSpecimen}
          onSetCompareIds={setSelectedPhotoIdsForCompare}
          onToggleComparePhoto={toggleComparePhoto}
          onPreviewPhoto={setLightboxMedia}
        />
      )}

      {/* 4. VUE MATRICE (voir phototheque/PhotoMatrixView) */}
      {viewMode === 'MATRIX' && (
        <PhotoMatrixView
          trial={trial}
          onSelectSpecimen={handleSelectSpecimen}
          onGoTimeline={() => setViewMode('SPECIMEN_TIMELINE')}
          onPreviewPhoto={setLightboxMedia}
          onOpenAddModalForStage={handleOpenAddModalForStage}
        />
      )}

      {/* 5. VUE GALERIE (voir phototheque/PhotoGalleryView) */}
      {viewMode === 'GALLERY' && (
        <PhotoGalleryView
          trial={trial}
          showArchived={showArchived}
          onShowArchivedChange={setShowArchived}
          selectedGalleryBatchId={selectedGalleryBatchId}
          onBatchFilterChange={setSelectedGalleryBatchId}
          selectedGalleryStageId={selectedGalleryStageId}
          onStageFilterChange={setSelectedGalleryStageId}
          selectedGallerySpecimenRole={selectedGallerySpecimenRole}
          onRoleFilterChange={setSelectedGallerySpecimenRole}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          filteredGalleryPhotos={filteredGalleryPhotos}
          panelMap={panelMap}
          stageMap={stageMap}
          onPreviewPhoto={setLightboxMedia}
          onDeletePhoto={handleDeletePhoto}
        />
      )}

      {/* 6. MODAL AJOUT / REMPLACEMENT (voir phototheque/PhotoAddModal) */}
      {showAddModal && (
        <PhotoAddModal
          trial={trial}
          existingActivePhotoInModal={existingActivePhotoInModal}
          uploadError={uploadError}
          newPhotoBatchId={newPhotoBatchId}
          onBatchIdChange={setNewPhotoBatchId}
          newPhotoPanelId={newPhotoPanelId}
          onPanelIdChange={setNewPhotoPanelId}
          newPhotoStageId={newPhotoStageId}
          onStageIdChange={setNewPhotoStageId}
          newPhotoFace={newPhotoFace}
          onFaceChange={setNewPhotoFace}
          newPhotoCaption={newPhotoCaption}
          onCaptionChange={setNewPhotoCaption}
          newPhotoOperator={newPhotoOperator}
          onOperatorChange={setNewPhotoOperator}
          newPhotoDataUrl={newPhotoDataUrl}
          modalBatchPanels={modalBatchPanels}
          onFileSelected={handleFileSelected}
          onSavePhoto={handleSavePhoto}
          onCloseModal={() => setShowAddModal(false)}
        />
      )}

      {/* 7. LIGHTBOX (voir phototheque/PhotoLightbox) */}
      {lightboxMedia && (
        <PhotoLightbox
          media={lightboxMedia}
          panelMap={panelMap}
          stageMap={stageMap}
          onClose={() => setLightboxMedia(null)}
          onDeletePhoto={handleDeletePhoto}
        />
      )}
    </div>
  );
}

