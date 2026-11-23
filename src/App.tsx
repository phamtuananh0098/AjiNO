import React, { useState } from 'react';
import type { Section, Track, WeddingSide } from './types';
import { ToastProvider } from './state/toastContext';
import { PlaylistProvider, usePlaylist } from './state/playlistContext';
import { PlayerProvider } from './state/playerContext';
import { ToastContainer } from './components/common/Toast';
import { Header } from './components/Header';
import { WeddingInfoBar } from './components/WeddingInfoBar';
import { DualSideView } from './components/DualSideView';
import { StudioConsole } from './components/StudioConsole';
import { AddTrackModal } from './components/Modals/AddTrackModal';
import { EditTrackModal } from './components/Modals/EditTrackModal';
import { GoogleDriveModal } from './components/Modals/GoogleDriveModal';
import { SectionModal } from './components/Modals/SectionModal';
import { QRCodeModal } from './components/Modals/QRCodeModal';
import { WeddingConfigModal } from './components/Modals/WeddingConfigModal';
import { PrintCueSheetModal } from './components/Modals/PrintCueSheetModal';

function WeddingStudioApp() {
  const { playlist } = usePlaylist();

  // Modals state
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showDriveModal, setShowDriveModal] = useState(false);

  // Add track modal state
  const [showAddTrackModal, setShowAddTrackModal] = useState(false);
  const [targetAddSectionId, setTargetAddSectionId] = useState<string | undefined>(undefined);
  const [targetAddSide, setTargetAddSide] = useState<WeddingSide>('both');

  // Section modal state
  const [sectionToEdit, setSectionToEdit] = useState<Section | null>(null);
  const [defaultSectionSide, setDefaultSectionSide] = useState<WeddingSide>('both');
  const [showSectionModal, setShowSectionModal] = useState(false);

  // Track edit modal state
  const [trackToEdit, setTrackToEdit] = useState<Track | null>(null);
  const [showEditTrackModal, setShowEditTrackModal] = useState(false);

  const handleOpenAddTrack = (sectionId?: string, defaultSide?: WeddingSide) => {
    setTargetAddSectionId(sectionId);
    setTargetAddSide(defaultSide || 'both');
    setShowAddTrackModal(true);
  };

  const handleOpenAddSection = (defaultSide: WeddingSide = 'both') => {
    setSectionToEdit(null);
    setDefaultSectionSide(defaultSide);
    setShowSectionModal(true);
  };

  const handleOpenEditSection = (section: Section) => {
    setSectionToEdit(section);
    setDefaultSectionSide(section.side || 'both');
    setShowSectionModal(true);
  };

  const handleOpenEditTrack = (track: Track) => {
    setTrackToEdit(track);
    setShowEditTrackModal(true);
  };

  return (
    <div className="app-layout">
      <ToastContainer />

      {/* Top Header */}
      <Header
        onOpenConfig={() => setShowConfigModal(true)}
        onOpenQR={() => setShowQRModal(true)}
        onOpenPrint={() => setShowPrintModal(true)}
        onOpenDrive={() => setShowDriveModal(true)}
      />

      {/* Main Content Area */}
      <main className="main-viewport">
        {/* Personalized Wedding Info & Controls */}
        <WeddingInfoBar
          onOpenConfig={() => setShowConfigModal(true)}
          onOpenAddTrack={handleOpenAddTrack}
        />

        {/* Dual Side View: NHÀ TRAI (Trái) & NHÀ GÁI (Phải) */}
        <DualSideView
          onOpenAddSection={handleOpenAddSection}
          onEditSection={handleOpenEditSection}
          onAddTrack={handleOpenAddTrack}
          onEditTrack={handleOpenEditTrack}
        />
      </main>

      {/* Professional Bottom DJ Player Console */}
      <StudioConsole />

      {/* Modals */}
      <AddTrackModal
        open={showAddTrackModal}
        onClose={() => setShowAddTrackModal(false)}
        defaultSectionId={targetAddSectionId}
        defaultSide={targetAddSide}
        sections={playlist.sections}
      />

      <EditTrackModal
        open={showEditTrackModal}
        onClose={() => setShowEditTrackModal(false)}
        track={trackToEdit}
      />

      <GoogleDriveModal
        open={showDriveModal}
        onClose={() => setShowDriveModal(false)}
      />

      <SectionModal
        open={showSectionModal}
        onClose={() => setShowSectionModal(false)}
        sectionToEdit={sectionToEdit}
        defaultSide={defaultSectionSide}
      />

      <QRCodeModal
        open={showQRModal}
        onClose={() => setShowQRModal(false)}
      />

      <WeddingConfigModal
        open={showConfigModal}
        onClose={() => setShowConfigModal(false)}
      />

      <PrintCueSheetModal
        open={showPrintModal}
        onClose={() => setShowPrintModal(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <PlaylistProvider>
        <PlayerProvider>
          <WeddingStudioApp />
        </PlayerProvider>
      </PlaylistProvider>
    </ToastProvider>
  );
}
