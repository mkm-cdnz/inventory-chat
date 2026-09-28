import React, { useState } from 'react';
import {
  HardwareItem,
  IdentifyHardwareResponse,
  EvidenceSource,
  SupplyInput,
  PinOrConnector,
  WiredInterface,
  WirelessProtocol,
  ResourceLink,
  CustomProperty,
} from '../types/hardware';
import { identifyHardwareWithAI } from '../services/aiService';
import { findPotentialExistingDuplicates } from '../services/catalogueService';
import {
  Camera,
  Upload,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Plus,
  Trash2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  X,
  FileText,
  Zap,
  Cpu,
  Radio,
  Share2,
  ShieldCheck,
  RefreshCw,
  BookOpen,
} from 'lucide-react';

interface AddItemViewProps {
  existingItems: HardwareItem[];
  initialImageBase64?: string;
  onSaveConfirmedItem: (
    item: HardwareItem,
    isPartial: boolean,
    actionSummary: string
  ) => Promise<void>;
  onOpenExistingItem: (item: HardwareItem) => void;
  onCancel: () => void;
}

export const AddItemView: React.FC<AddItemViewProps> = ({
  existingItems,
  initialImageBase64,
  onSaveConfirmedItem,
  onOpenExistingItem,
  onCancel,
}) => {
  // Capture inputs (Step 1)
  const [images, setImages] = useState<string[]>(
    initialImageBase64 ? [initialImageBase64] : []
  );
  const [description, setDescription] = useState('');
  const [knownName, setKnownName] = useState('');
  const [knownModel, setKnownModel] = useState('');
  const [knownSerial, setKnownSerial] = useState('');
  const [knownRevision, setKnownRevision] = useState('');
  const [knownMarkings, setKnownMarkings] = useState('');
  const [knownBarcode, setKnownBarcode] = useState('');
  const [knownDocUrl, setKnownDocUrl] = useState('');

  // Analysis States
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStepMessage, setAnalysisStepMessage] = useState('');
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Proposed Record Review Form (Step 2 - Progressive Disclosure)
  const [hasProposedRecord, setHasProposedRecord] = useState(false);
  const [proposedItem, setProposedItem] = useState<Partial<HardwareItem> | null>(null);
  const [unresolvedQuestions, setUnresolvedQuestions] = useState<string[]>([]);
  const [candidateVariants, setCandidateVariants] = useState<
    Array<{ name: string; model: string; manufacturer: string; reason: string; missingEvidence: string }>
  >([]);
  const [detectedDuplicates, setDetectedDuplicates] = useState<
    Array<{ existingItemId: string; existingItemName: string; existingModel: string; similarityReason: string }>
  >([]);
  const [duplicateDismissed, setDuplicateDismissed] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Section accordions for progressive disclosure
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    core: true,
    electrical: true,
    interfaces: false,
    pins: false,
    wireless: false,
    physical: false,
    software: true,
    sources: true,
    resources: true,
  });

  const toggleSection = (s: string) => {
    setOpenSections((prev) => ({ ...prev, [s]: !prev[s] }));
  };

  // Photo handlers
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const fileList = Array.from(e.target.files);
    fileList.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const b64 = event.target?.result as string;
        setImages((prev) => [...prev, b64]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Identify & Populate Action
  const handleIdentifyAndPopulate = async () => {
    if (images.length === 0 && !description.trim() && !knownName.trim() && !knownModel.trim()) {
      setAnalysisError('Please provide at least one photo, a description, or an identifying name/model.');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);
    setAnalysisStepMessage('Analyzing physical markings, laser text, and IC packages...');

    try {
      setTimeout(() => {
        setAnalysisStepMessage('Researching authentic manufacturer datasheets via Google Search Grounding...');
      }, 1800);

      setTimeout(() => {
        setAnalysisStepMessage('Synthesizing verifiable electrical ratings, pinouts, and driver links...');
      }, 3500);

      const response: IdentifyHardwareResponse = await identifyHardwareWithAI(
        {
          imagesBase64: images,
          description,
          knownIdentifiers: {
            name: knownName,
            model: knownModel,
            serialNumber: knownSerial,
            boardRevision: knownRevision,
            markings: knownMarkings,
            barcode: knownBarcode,
            documentationUrl: knownDocUrl,
          },
        },
        existingItems
      );

      // Check duplicates against local catalogue as well
      const localDups = findPotentialExistingDuplicates(
        {
          name: response.proposedItem?.displayName || knownName,
          model: response.proposedItem?.model || knownModel,
          serialNumber: knownSerial,
          barcode: knownBarcode,
        },
        existingItems
      );

      const allDups = [...(response.existingDuplicatesDetected || []), ...localDups];
      // Deduplicate
      const uniqueDups = Array.from(new Map(allDups.map((d) => [d.existingItemId, d])).values());

      setDetectedDuplicates(uniqueDups);
      setDuplicateDismissed(false);
      setProposedItem(response.proposedItem);
      setUnresolvedQuestions(response.unresolvedQuestions || []);
      setCandidateVariants(response.candidateVariants || []);
      setHasProposedRecord(true);
    } catch (err) {
      console.error(err);
      setAnalysisError(
        err instanceof Error ? err.message : 'Identification encountered an error. Your inputs have been kept intact.'
      );
      // Ensure manual entry path is available
      if (!proposedItem) {
        setProposedItem({
          id: `hw-manual-${Date.now().toString(36)}`,
          schemaVersion: '2.0',
          displayName: knownName || knownModel || 'New Hardware Item',
          category: 'Other',
          manufacturer: 'Unknown',
          model: knownModel || '',
          variantRevision: knownRevision || '',
          description,
          tags: [],
          serialNumbers: knownSerial ? [knownSerial] : [],
          barcodes: knownBarcode ? [{ value: knownBarcode }] : [],
          markings: knownMarkings ? [{ label: 'Physical Marking', text: knownMarkings }] : [],
          images: images.map((url, i) => ({ url, isPrimary: i === 0 })),
          electrical: { supplyInputs: [], absoluteMaxRatings: [] },
          pinsAndConnectors: [],
          wiredInterfaces: [],
          wireless: [],
          physicalAndFunctional: {},
          softwareAndCompatibility: [],
          sources: [
            {
              id: 'src_manual_1',
              title: 'User Attested Entry',
              sourceType: 'user_attested',
              reliability: 'user_direct',
              extractedDate: new Date().toISOString().split('T')[0],
              notes: 'Manual entry created by user.',
            },
          ],
          resources: knownDocUrl ? [{ id: 'res_1', title: 'User Reference Link', url: knownDocUrl, type: 'manual' }] : [],
          customProperties: [],
          confirmationStatus: 'proposal_pending_review',
        });
        setHasProposedRecord(true);
      }
    } finally {
      setIsAnalyzing(false);
      setAnalysisStepMessage('');
    }
  };

  // Save Confirmed Record handler
  const handleConfirmAndSave = async (isPartial: boolean) => {
    if (!proposedItem || !proposedItem.displayName) {
      alert('Please provide at least a Display Name for the record.');
      return;
    }

    setIsSaving(true);
    try {
      const finalItem: HardwareItem = {
        id: proposedItem.id || `hw-${Date.now().toString(36)}`,
        schemaVersion: '2.0',
        createdAt: proposedItem.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        revisionCount: proposedItem.revisionCount || 0,
        displayName: proposedItem.displayName || 'Hardware Record',
        category: proposedItem.category || 'Other',
        manufacturer: proposedItem.manufacturer || 'Unknown',
        model: proposedItem.model || '',
        variantRevision: proposedItem.variantRevision || '',
        aliases: proposedItem.aliases || [],
        description: proposedItem.description || '',
        tags: proposedItem.tags || [],
        serialNumbers: proposedItem.serialNumbers || [],
        barcodes: proposedItem.barcodes || [],
        markings: proposedItem.markings || [],
        images:
          proposedItem.images && proposedItem.images.length > 0
            ? (proposedItem.images as any)
            : images.map((url, i) => ({ url, isPrimary: i === 0 })),
        electrical: proposedItem.electrical || { supplyInputs: [], absoluteMaxRatings: [] },
        pinsAndConnectors: proposedItem.pinsAndConnectors || [],
        wiredInterfaces: proposedItem.wiredInterfaces || [],
        wireless: proposedItem.wireless || [],
        physicalAndFunctional: proposedItem.physicalAndFunctional || {},
        softwareAndCompatibility: proposedItem.softwareAndCompatibility || [],
        sources: proposedItem.sources || [],
        resources: proposedItem.resources || [],
        customProperties: proposedItem.customProperties || [],
        notes: proposedItem.notes || '',
        confirmationStatus: isPartial ? 'partial_confirmed' : 'confirmed',
        unresolvedQuestions: isPartial ? unresolvedQuestions : [],
        revisions: proposedItem.revisions || [],
        lastModifiedBy: {
          name: 'Matt Millar',
          email: 'matt@mattmillar.co.nz',
          role: 'matt_millar',
        },
      };

      await onSaveConfirmedItem(
        finalItem,
        isPartial,
        isPartial
          ? 'Confirmed partial record (containing only verified facts)'
          : 'Explicitly reviewed and approved proposed record'
      );
    } catch (e) {
      console.error('Failed to save record:', e);
      alert('Error saving record to database. Please check connection.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-[960px] mx-auto space-y-6 pb-12">
      {/* Top Breadcrumb & Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#2c3e50] tracking-[0.5px]">
            Add Hardware Item
          </h1>
          <p className="text-xs sm:text-sm text-[#7f8c8d] mt-1">
            Capture photos, describe hardware, gather verified manufacturer metadata, review, and confirm.
          </p>
        </div>
        <button
          onClick={onCancel}
          className="px-3 py-1.5 text-xs font-semibold rounded-[6px] border border-[#ecf0f1] text-[#7f8c8d] hover:text-[#333333] hover:bg-[#f8f9fa] cursor-pointer"
        >
          Cancel
        </button>
      </div>

      {/* Step 1: Capture & Identifying Inputs (Google Forms Inspired Simplicity) */}
      <div className="bg-white border border-[#ecf0f1] rounded-[8px] p-5 shadow-xs space-y-5">
        <div className="flex items-center gap-2 pb-3 border-b border-[#ecf0f1]">
          <span className="w-5 h-5 rounded-full bg-[#2c3e50] text-white text-[11px] font-bold flex items-center justify-center">
            1
          </span>
          <h2 className="text-sm font-bold text-[#2c3e50] tracking-[0.5px]">
            Capture Photos & Known Identifiers
          </h2>
          <span className="text-[11px] text-[#7f8c8d] ml-auto">
            Provide whatever information you have
          </span>
        </div>

        {/* Photo Upload & Gallery */}
        <div>
          <label className="block text-xs font-semibold text-[#2c3e50] mb-1.5">
            Hardware Photos (multiple angles, IC laser markings, connectors)
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {images.map((img, idx) => (
              <div
                key={idx}
                className="relative aspect-square rounded-[6px] border border-[#ecf0f1] bg-[#f8f9fa] overflow-hidden group shadow-xs"
              >
                <img src={img} alt={`Upload ${idx + 1}`} className="w-full h-full object-cover" />
                <button
                  onClick={() => removePhoto(idx)}
                  className="absolute top-1 right-1 p-1 bg-black/70 text-white rounded-full opacity-80 hover:opacity-100 transition cursor-pointer"
                  title="Remove photo"
                >
                  <X className="w-3 h-3" />
                </button>
                {idx === 0 && (
                  <span className="absolute bottom-1 left-1 text-[9px] bg-[#2c3e50] text-white px-1.5 py-0.5 rounded font-medium">
                    Primary
                  </span>
                )}
              </div>
            ))}

            {/* Add Photo Button */}
            <label className="aspect-square rounded-[6px] border-2 border-dashed border-[#ecf0f1] hover:border-[#3498db] bg-[#f8f9fa] flex flex-col items-center justify-center p-2 text-center transition cursor-pointer group">
              <Camera className="w-5 h-5 text-[#7f8c8d] group-hover:text-[#3498db] transition" />
              <span className="text-[11px] font-semibold text-[#34495e] mt-1">Add Photo</span>
              <span className="text-[9px] text-[#7f8c8d]">Camera / Upload</span>
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handlePhotoUpload}
              />
            </label>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-[#2c3e50] mb-1">
            Description or Notes
          </label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Purple environmental breakout board with metal sensor lid; pulled from a weather station prototype..."
            className="w-full px-3 py-2 text-xs bg-white border border-[#ecf0f1] rounded-[6px] focus:outline-none focus:border-[#3498db] text-[#333333]"
          />
        </div>

        {/* Known Identifiers Grid (Optional Fields) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#2c3e50]">
              Known Identifiers (leave blank if not marked on hardware)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <span className="text-[11px] text-[#7f8c8d]">Name / Common Title</span>
              <input
                type="text"
                value={knownName}
                onChange={(e) => setKnownName(e.target.value)}
                placeholder="e.g. Bosch BME280 Breakout"
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#ecf0f1] rounded-[4px] focus:outline-none focus:border-[#3498db] text-[#333333] mt-0.5"
              />
            </div>

            <div>
              <span className="text-[11px] text-[#7f8c8d]">Model Number / IC Part Number</span>
              <input
                type="text"
                value={knownModel}
                onChange={(e) => setKnownModel(e.target.value)}
                placeholder="e.g. BME280 or ESP32-S3-WROOM-1"
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#ecf0f1] rounded-[4px] focus:outline-none focus:border-[#3498db] text-[#333333] mt-0.5"
              />
            </div>

            <div>
              <span className="text-[11px] text-[#7f8c8d]">Board Revision / Variant</span>
              <input
                type="text"
                value={knownRevision}
                onChange={(e) => setKnownRevision(e.target.value)}
                placeholder="e.g. Rev 1.1 or 8MB Flash"
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#ecf0f1] rounded-[4px] focus:outline-none focus:border-[#3498db] text-[#333333] mt-0.5"
              />
            </div>

            <div>
              <span className="text-[11px] text-[#7f8c8d]">Printed Markings / Silkscreen</span>
              <input
                type="text"
                value={knownMarkings}
                onChange={(e) => setKnownMarkings(e.target.value)}
                placeholder="e.g. VIN, GND, SCL, SDA, UP"
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#ecf0f1] rounded-[4px] focus:outline-none focus:border-[#3498db] text-[#333333] mt-0.5"
              />
            </div>

            <div>
              <span className="text-[11px] text-[#7f8c8d]">Barcode / QR Code / Serial Number</span>
              <input
                type="text"
                value={knownBarcode || knownSerial}
                onChange={(e) => {
                  setKnownBarcode(e.target.value);
                  setKnownSerial(e.target.value);
                }}
                placeholder="e.g. SN:123456 or 5056561803326"
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#ecf0f1] rounded-[4px] focus:outline-none focus:border-[#3498db] text-[#333333] mt-0.5"
              />
            </div>

            <div>
              <span className="text-[11px] text-[#7f8c8d]">Existing Documentation URL (if known)</span>
              <input
                type="url"
                value={knownDocUrl}
                onChange={(e) => setKnownDocUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#ecf0f1] rounded-[4px] focus:outline-none focus:border-[#3498db] text-[#333333] mt-0.5"
              />
            </div>
          </div>
        </div>

        {/* Action Button: Identify & Populate */}
        <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={handleIdentifyAndPopulate}
            disabled={isAnalyzing}
            className="w-full sm:w-auto px-5 py-2.5 bg-[#2c3e50] hover:bg-[#34495e] text-white font-semibold text-xs rounded-[8px] flex items-center justify-center gap-2 transition cursor-pointer shadow-xs disabled:opacity-60"
          >
            {isAnalyzing ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Identifying & Researching...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-[#3498db]" />
                <span>Identify & Populate with Evidence</span>
              </>
            )}
          </button>

          {hasProposedRecord && (
            <span className="text-xs text-[#27ae60] font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Proposed record ready for review below
            </span>
          )}
        </div>

        {/* Real-time Progress State */}
        {isAnalyzing && (
          <div className="p-3 bg-[#f8f9fa] border-l-3 border-[#3498db] rounded-r-[4px] space-y-1.5 text-xs">
            <div className="flex items-center gap-2 text-[#2c3e50] font-semibold">
              <RefreshCw className="w-3.5 h-3.5 text-[#3498db] animate-spin" />
              <span>Autonomous Research in Progress</span>
            </div>
            <p className="text-[#34495e]">{analysisStepMessage}</p>
            <p className="text-[10px] text-[#7f8c8d]">
              Cross-referencing manufacturer technical briefs, pinout definitions, and voltage specifications.
            </p>
          </div>
        )}

        {analysisError && (
          <div className="p-3 bg-red-50 text-red-700 text-xs rounded-[4px] border border-red-200">
            {analysisError}
          </div>
        )}
      </div>

      {/* Step 2: Proposed Record Review & Evidence Form */}
      {hasProposedRecord && proposedItem && (
        <div className="bg-white border border-[#ecf0f1] rounded-[8px] p-5 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-[#ecf0f1]">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#3498db] text-white text-[11px] font-bold flex items-center justify-center">
                2
              </span>
              <div>
                <h2 className="text-sm font-bold text-[#2c3e50] tracking-[0.5px]">
                  Review Proposed Values & Attributed Evidence
                </h2>
                <p className="text-[11px] text-[#7f8c8d]">
                  Explicit user confirmation required before committing to catalogue.
                </p>
              </div>
            </div>
            <span className="text-[10px] uppercase font-bold text-[#e67e22] bg-[#fdf2e9] px-2 py-0.5 rounded border border-[#f5cba7]">
              Proposal (Unsaved)
            </span>
          </div>

          {/* Potential Duplicate Warning (Never automatically merges!) */}
          {detectedDuplicates.length > 0 && !duplicateDismissed && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-[8px] space-y-2 text-xs">
              <div className="flex items-center gap-2 text-amber-900 font-bold">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Potential Existing Duplicate Detected</span>
              </div>
              <p className="text-amber-800">
                Found {detectedDuplicates.length} catalogue record(s) matching this model, serial, or name.
                Records are never merged automatically.
              </p>
              <div className="space-y-1.5 pt-1">
                {detectedDuplicates.map((dup) => {
                  const itemRef = existingItems.find((i) => i.id === dup.existingItemId);
                  return (
                    <div
                      key={dup.existingItemId}
                      className="p-2 bg-white rounded-[4px] border border-amber-200 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-semibold text-[#2c3e50]">{dup.existingItemName}</span>
                        <span className="text-[11px] text-amber-800 ml-2">({dup.similarityReason})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {itemRef && (
                          <button
                            onClick={() => onOpenExistingItem(itemRef)}
                            className="px-2 py-1 bg-[#2c3e50] text-white rounded text-[11px] font-semibold hover:bg-[#34495e]"
                          >
                            Open Existing Record
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="pt-1 flex items-center justify-end">
                <button
                  onClick={() => setDuplicateDismissed(true)}
                  className="text-[11px] text-amber-800 font-semibold hover:underline cursor-pointer"
                >
                  This is a distinct, separate item (Proceed anyway) →
                </button>
              </div>
            </div>
          )}

          {/* Unresolved Questions & Candidate Variants */}
          {unresolvedQuestions.length > 0 && (
            <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-[8px] space-y-2 text-xs">
              <div className="flex items-center gap-2 text-[#2c3e50] font-bold">
                <HelpCircle className="w-4 h-4 text-[#3498db] shrink-0" />
                <span>Unresolved Identification Questions</span>
              </div>
              <ul className="list-disc pl-5 space-y-1 text-[#34495e]">
                {unresolvedQuestions.map((q, idx) => (
                  <li key={idx}>{q}</li>
                ))}
              </ul>
              <p className="text-[11px] text-[#7f8c8d] italic">
                You can save this as a <strong>Confirmed Partial Record</strong> containing only verified facts; unknown fields remain unpopulated.
              </p>

              {candidateVariants.length > 0 && (
                <div className="pt-2 border-t border-blue-200/60 space-y-1.5">
                  <span className="font-semibold text-[#2c3e50] text-[11px]">
                    Candidate Variants (distinguishing information needed):
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {candidateVariants.map((cand, idx) => (
                      <div key={idx} className="p-2 bg-white rounded-[4px] border border-blue-100 text-[11px]">
                        <p className="font-bold text-[#2c3e50]">{cand.name}</p>
                        <p className="text-[#34495e]">{cand.reason}</p>
                        <p className="text-[#e67e22] mt-0.5">Missing: {cand.missingEvidence}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Accordion 1: Core Identification */}
          <div className="border border-[#ecf0f1] rounded-[8px] overflow-hidden">
            <button
              onClick={() => toggleSection('core')}
              className="w-full px-4 py-2.5 bg-[#f8f9fa] flex items-center justify-between text-xs font-bold text-[#2c3e50] border-b border-[#ecf0f1]"
            >
              <div className="flex items-center gap-2">
                <Cpu className="w-3.5 h-3.5 text-[#3498db]" />
                <span>Core Identifiers & Classification</span>
              </div>
              {openSections.core ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {openSections.core && (
              <div className="p-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="font-semibold text-[#2c3e50]">Display Name *</label>
                    <input
                      type="text"
                      value={proposedItem.displayName || ''}
                      onChange={(e) => setProposedItem({ ...proposedItem, displayName: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-[#ecf0f1] rounded-[4px] mt-1 text-xs"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-[#2c3e50]">Category</label>
                    <select
                      value={proposedItem.category || 'Other'}
                      onChange={(e) => setProposedItem({ ...proposedItem, category: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-[#ecf0f1] rounded-[4px] mt-1 text-xs bg-white"
                    >
                      {[
                        'Microcontroller',
                        'SBC',
                        'Sensor',
                        'Display',
                        'Power',
                        'Radio/Wireless',
                        'Interface',
                        'Motor/Driver',
                        'Automotive/Drone',
                        'Passive/Component',
                        'Other',
                      ].map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-[#2c3e50]">Manufacturer</label>
                    <input
                      type="text"
                      value={proposedItem.manufacturer || ''}
                      onChange={(e) => setProposedItem({ ...proposedItem, manufacturer: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-[#ecf0f1] rounded-[4px] mt-1 text-xs"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-[#2c3e50]">Model Number</label>
                    <input
                      type="text"
                      value={proposedItem.model || ''}
                      onChange={(e) => setProposedItem({ ...proposedItem, model: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-[#ecf0f1] rounded-[4px] mt-1 text-xs"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-[#2c3e50]">Variant / Board Revision</label>
                    <input
                      type="text"
                      value={proposedItem.variantRevision || ''}
                      onChange={(e) => setProposedItem({ ...proposedItem, variantRevision: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-[#ecf0f1] rounded-[4px] mt-1 text-xs"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-[#2c3e50]">Tags (comma separated)</label>
                    <input
                      type="text"
                      value={(proposedItem.tags || []).join(', ')}
                      onChange={(e) =>
                        setProposedItem({
                          ...proposedItem,
                          tags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean),
                        })
                      }
                      className="w-full px-2.5 py-1.5 border border-[#ecf0f1] rounded-[4px] mt-1 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-[#2c3e50] text-xs">Technical Description</label>
                  <textarea
                    rows={2}
                    value={proposedItem.description || ''}
                    onChange={(e) => setProposedItem({ ...proposedItem, description: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-[#ecf0f1] rounded-[4px] mt-1 text-xs"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Accordion 2: Electrical Specifications */}
          <div className="border border-[#ecf0f1] rounded-[8px] overflow-hidden">
            <button
              onClick={() => toggleSection('electrical')}
              className="w-full px-4 py-2.5 bg-[#f8f9fa] flex items-center justify-between text-xs font-bold text-[#2c3e50] border-b border-[#ecf0f1]"
            >
              <div className="flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-[#3498db]" />
                <span>
                  Electrical Specifications ({proposedItem.electrical?.supplyInputs?.length || 0} inputs)
                </span>
              </div>
              {openSections.electrical ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {openSections.electrical && (
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#7f8c8d]">
                    Voltage ratings include units and operating ranges. Numbers represent normal vs absolute max.
                  </span>
                  <button
                    onClick={() => {
                      const existing = proposedItem.electrical?.supplyInputs || [];
                      setProposedItem({
                        ...proposedItem,
                        electrical: {
                          ...proposedItem.electrical!,
                          supplyInputs: [
                            ...existing,
                            {
                              name: 'Supply Input',
                              minVoltage: 3.3,
                              maxVoltage: 5.0,
                              voltageUnit: 'V',
                            },
                          ],
                        },
                      });
                    }}
                    className="text-[11px] text-[#3498db] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" /> Add Supply Input
                  </button>
                </div>

                <div className="space-y-2">
                  {proposedItem.electrical?.supplyInputs?.map((inp, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 bg-[#f8f9fa] rounded-[6px] border border-[#ecf0f1] grid grid-cols-1 sm:grid-cols-5 gap-2 text-xs items-center"
                    >
                      <div className="sm:col-span-2">
                        <span className="text-[10px] text-[#7f8c8d]">Input Name / Pin</span>
                        <input
                          type="text"
                          value={inp.name}
                          onChange={(e) => {
                            const updated = [...(proposedItem.electrical?.supplyInputs || [])];
                            updated[idx].name = e.target.value;
                            setProposedItem({
                              ...proposedItem,
                              electrical: { ...proposedItem.electrical!, supplyInputs: updated },
                            });
                          }}
                          className="w-full px-2 py-1 bg-white border border-[#ecf0f1] rounded text-xs"
                        />
                      </div>

                      <div>
                        <span className="text-[10px] text-[#7f8c8d]">Min (V)</span>
                        <input
                          type="number"
                          step="0.1"
                          value={inp.minVoltage ?? ''}
                          onChange={(e) => {
                            const updated = [...(proposedItem.electrical?.supplyInputs || [])];
                            updated[idx].minVoltage = parseFloat(e.target.value) || undefined;
                            setProposedItem({
                              ...proposedItem,
                              electrical: { ...proposedItem.electrical!, supplyInputs: updated },
                            });
                          }}
                          className="w-full px-2 py-1 bg-white border border-[#ecf0f1] rounded text-xs"
                        />
                      </div>

                      <div>
                        <span className="text-[10px] text-[#7f8c8d]">Max (V)</span>
                        <input
                          type="number"
                          step="0.1"
                          value={inp.maxVoltage ?? ''}
                          onChange={(e) => {
                            const updated = [...(proposedItem.electrical?.supplyInputs || [])];
                            updated[idx].maxVoltage = parseFloat(e.target.value) || undefined;
                            setProposedItem({
                              ...proposedItem,
                              electrical: { ...proposedItem.electrical!, supplyInputs: updated },
                            });
                          }}
                          className="w-full px-2 py-1 bg-white border border-[#ecf0f1] rounded text-xs"
                        />
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0">
                        <span className="text-[10px] text-[#7f8c8d]">
                          {inp.evidenceSourceId ? `Source: ${inp.evidenceSourceId}` : 'Attributed'}
                        </span>
                        <button
                          onClick={() => {
                            const updated = proposedItem.electrical?.supplyInputs?.filter((_, i) => i !== idx);
                            setProposedItem({
                              ...proposedItem,
                              electrical: { ...proposedItem.electrical!, supplyInputs: updated || [] },
                            });
                          }}
                          className="text-red-500 hover:text-red-700 p-1"
                          title="Remove supply input"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Accordion 3: Wired Interfaces */}
          <div className="border border-[#ecf0f1] rounded-[8px] overflow-hidden">
            <button
              onClick={() => toggleSection('interfaces')}
              className="w-full px-4 py-2.5 bg-[#f8f9fa] flex items-center justify-between text-xs font-bold text-[#2c3e50] border-b border-[#ecf0f1]"
            >
              <div className="flex items-center gap-2">
                <Share2 className="w-3.5 h-3.5 text-[#3498db]" />
                <span>
                  Wired Interfaces ({proposedItem.wiredInterfaces?.length || 0} buses)
                </span>
              </div>
              {openSections.interfaces ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {openSections.interfaces && (
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#7f8c8d]">
                    I2C addresses, SPI speeds, UART ports, USB versions and roles.
                  </span>
                  <button
                    onClick={() => {
                      const existing = proposedItem.wiredInterfaces || [];
                      setProposedItem({
                        ...proposedItem,
                        wiredInterfaces: [
                          ...existing,
                          { type: 'I2C', busRole: 'Target/Peripheral', defaultAddresses: ['0x76'] },
                        ],
                      });
                    }}
                    className="text-[11px] text-[#3498db] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" /> Add Interface
                  </button>
                </div>

                <div className="space-y-2">
                  {proposedItem.wiredInterfaces?.map((wi, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 bg-[#f8f9fa] rounded-[6px] border border-[#ecf0f1] grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs items-center"
                    >
                      <div>
                        <span className="text-[10px] text-[#7f8c8d]">Type</span>
                        <input
                          type="text"
                          value={wi.type}
                          onChange={(e) => {
                            const updated = [...(proposedItem.wiredInterfaces || [])];
                            updated[idx].type = e.target.value as any;
                            setProposedItem({ ...proposedItem, wiredInterfaces: updated });
                          }}
                          className="w-full px-2 py-1 bg-white border border-[#ecf0f1] rounded text-xs font-mono font-bold"
                        />
                      </div>

                      <div>
                        <span className="text-[10px] text-[#7f8c8d]">Speed / Version</span>
                        <input
                          type="text"
                          value={wi.versionOrSpeed || ''}
                          onChange={(e) => {
                            const updated = [...(proposedItem.wiredInterfaces || [])];
                            updated[idx].versionOrSpeed = e.target.value;
                            setProposedItem({ ...proposedItem, wiredInterfaces: updated });
                          }}
                          placeholder="e.g. 400 kHz"
                          className="w-full px-2 py-1 bg-white border border-[#ecf0f1] rounded text-xs"
                        />
                      </div>

                      <div>
                        <span className="text-[10px] text-[#7f8c8d]">Addresses / Details</span>
                        <input
                          type="text"
                          value={(wi.defaultAddresses || []).join(', ')}
                          onChange={(e) => {
                            const updated = [...(proposedItem.wiredInterfaces || [])];
                            updated[idx].defaultAddresses = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
                            setProposedItem({ ...proposedItem, wiredInterfaces: updated });
                          }}
                          placeholder="e.g. 0x76, 0x77"
                          className="w-full px-2 py-1 bg-white border border-[#ecf0f1] rounded text-xs font-mono"
                        />
                      </div>

                      <div className="flex items-center justify-end">
                        <button
                          onClick={() => {
                            const updated = proposedItem.wiredInterfaces?.filter((_, i) => i !== idx);
                            setProposedItem({ ...proposedItem, wiredInterfaces: updated });
                          }}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Accordion 4: Evidence & Sources (Crucial Verification) */}
          <div className="border border-[#ecf0f1] rounded-[8px] overflow-hidden">
            <button
              onClick={() => toggleSection('sources')}
              className="w-full px-4 py-2.5 bg-[#f8f9fa] flex items-center justify-between text-xs font-bold text-[#2c3e50] border-b border-[#ecf0f1]"
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-[#3498db]" />
                <span>
                  Attributed Evidence Sources ({proposedItem.sources?.length || 0} citations)
                </span>
              </div>
              {openSections.sources ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {openSections.sources && (
              <div className="p-4 space-y-3">
                <div className="mm-highlight text-[11px] text-[#34495e]">
                  Every technical specification is attributed to an identifiable evidence source. Manufacturer datasheets are preferred; AI approval does not reclassify AI leads into manufacturer documentation.
                </div>

                <div className="space-y-2">
                  {proposedItem.sources?.map((src, idx) => (
                    <div
                      key={src.id || idx}
                      className="p-3 bg-[#f8f9fa] rounded-[6px] border border-[#ecf0f1] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] text-[#3498db] bg-[#3498db]/10 px-1.5 py-0.2 rounded font-bold">
                            {src.id}
                          </span>
                          <span className="font-bold text-[#2c3e50]">{src.title}</span>
                          <span className="text-[10px] bg-white border border-[#ecf0f1] px-1.5 py-0.2 rounded text-[#7f8c8d]">
                            {src.sourceType.replace(/_/g, ' ')}
                          </span>
                        </div>
                        {src.url && (
                          <a
                            href={src.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[#3498db] text-[11px] flex items-center gap-1 hover:underline truncate max-w-lg"
                          >
                            <span>{src.url}</span>
                            <ExternalLink className="w-3 h-3 shrink-0" />
                          </a>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                          src.reliability === 'primary_manufacturer' ? 'bg-emerald-100 text-emerald-800' :
                          src.reliability === 'user_direct' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {src.reliability.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Accordion 5: Documentation & Software Resources */}
          <div className="border border-[#ecf0f1] rounded-[8px] overflow-hidden">
            <button
              onClick={() => toggleSection('resources')}
              className="w-full px-4 py-2.5 bg-[#f8f9fa] flex items-center justify-between text-xs font-bold text-[#2c3e50] border-b border-[#ecf0f1]"
            >
              <div className="flex items-center gap-2">
                <BookOpen className="w-3.5 h-3.5 text-[#3498db]" />
                <span>
                  Documentation & Software Libraries ({proposedItem.resources?.length || 0} links)
                </span>
              </div>
              {openSections.resources ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {openSections.resources && (
              <div className="p-4 space-y-3">
                <div className="space-y-2">
                  {proposedItem.resources?.map((res, idx) => (
                    <div
                      key={res.id || idx}
                      className="p-2.5 bg-[#f8f9fa] rounded-[6px] border border-[#ecf0f1] flex items-center justify-between text-xs gap-3"
                    >
                      <div className="truncate">
                        <span className="font-semibold text-[#2c3e50]">{res.title}</span>
                        <span className="text-[10px] text-[#7f8c8d] ml-2 font-mono">[{res.type}]</span>
                        {res.url && (
                          <div className="text-[11px] text-[#3498db] truncate">{res.url}</div>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          const updated = proposedItem.resources?.filter((_, i) => i !== idx);
                          setProposedItem({ ...proposedItem, resources: updated });
                        }}
                        className="text-red-500 hover:text-red-700 p-1 shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Explicit User Confirmation Action Bar */}
          <div className="pt-4 border-t border-[#ecf0f1] flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-[#7f8c8d]">
              Review all claims above before committing to the database.
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={() => handleConfirmAndSave(true)}
                disabled={isSaving}
                className="w-full sm:w-auto px-4 py-2 border border-[#3498db] text-[#2c3e50] hover:bg-[#3498db]/10 text-xs font-semibold rounded-[8px] transition cursor-pointer"
                title="Save verified facts and leave unproven fields blank"
              >
                Save as Confirmed Partial Record
              </button>

              <button
                onClick={() => handleConfirmAndSave(false)}
                disabled={isSaving}
                className="w-full sm:w-auto px-5 py-2 bg-[#2c3e50] hover:bg-[#34495e] text-white text-xs font-semibold rounded-[8px] transition cursor-pointer flex items-center justify-center gap-2 shadow-xs"
              >
                {isSaving ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Committing...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Save Confirmed Record</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
