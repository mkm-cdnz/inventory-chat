import React, { useState } from 'react';
import {
  HardwareItem,
  ResourceLink,
  HardwareRevisionRecord,
} from '../types/hardware';
import {
  attachResourceToHardware,
  updateHardwareRecordWithConcurrencyCheck,
} from '../services/catalogueService';
import {
  ArrowLeft,
  Cpu,
  Zap,
  Share2,
  Radio,
  FileText,
  ShieldCheck,
  BookOpen,
  Link,
  Plus,
  Edit,
  History,
  CheckCircle2,
  HelpCircle,
  Copy,
  ExternalLink,
  AlertTriangle,
  X,
  Code,
} from 'lucide-react';

interface ItemDetailsViewProps {
  item: HardwareItem;
  onBack: () => void;
  onItemUpdated: (updatedItem: HardwareItem) => void;
}

export const ItemDetailsView: React.FC<ItemDetailsViewProps> = ({
  item,
  onBack,
  onItemUpdated,
}) => {
  // Modal states
  const [showAttachModal, setShowAttachModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);

  // Attach Resource Form
  const [resTitle, setResTitle] = useState('');
  const [resUrl, setResUrl] = useState('');
  const [resType, setResType] = useState<ResourceLink['type']>('software_library');
  const [resDescription, setResDescription] = useState('');
  const [resVersion, setResVersion] = useState('');
  const [isAttaching, setIsAttaching] = useState(false);
  const [attachError, setAttachError] = useState<string | null>(null);

  // Edit Record Form (with Concurrency Checking)
  const [editDisplayName, setEditDisplayName] = useState(item.displayName);
  const [editDescription, setEditDescription] = useState(item.description);
  const [editModel, setEditModel] = useState(item.model);
  const [editRevision, setEditRevision] = useState(item.variantRevision || '');
  const [editNotes, setEditNotes] = useState(item.notes || '');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [concurrencyConflictError, setConcurrencyConflictError] = useState<string | null>(null);

  // Copy JSON
  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(item, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  // Submit Attach Resource
  const handleAttachResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resTitle.trim() || !resUrl.trim()) return;

    setIsAttaching(true);
    setAttachError(null);
    try {
      const newResource: ResourceLink = {
        id: `res-${Date.now().toString(36)}`,
        title: resTitle.trim(),
        url: resUrl.trim(),
        type: resType,
        description: resDescription.trim() || undefined,
        versionOrRevision: resVersion.trim() || undefined,
        addedAt: new Date().toISOString(),
      };

      const updated = await attachResourceToHardware(item.id, newResource, {
        name: 'Matt Millar',
        email: 'matt@mattmillar.co.nz',
        role: 'matt_millar',
      });

      onItemUpdated(updated);
      setShowAttachModal(false);
      setResTitle('');
      setResUrl('');
      setResDescription('');
    } catch (err) {
      console.error(err);
      setAttachError(err instanceof Error ? err.message : 'Failed to attach resource.');
    } finally {
      setIsAttaching(false);
    }
  };

  // Submit Edit with Concurrency Check
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingEdit(true);
    setConcurrencyConflictError(null);

    try {
      const updated = await updateHardwareRecordWithConcurrencyCheck(
        item.id,
        {
          displayName: editDisplayName.trim(),
          description: editDescription.trim(),
          model: editModel.trim(),
          variantRevision: editRevision.trim(),
          notes: editNotes.trim(),
        },
        item.revisionCount, // Optimistic Concurrency expectation
        {
          name: 'Matt Millar',
          email: 'matt@mattmillar.co.nz',
          role: 'matt_millar',
        },
        'Updated hardware core description and model revision metadata'
      );

      onItemUpdated(updated);
      setShowEditModal(false);
    } catch (err) {
      console.error(err);
      setConcurrencyConflictError(
        err instanceof Error ? err.message : 'Concurrency conflict encountered while saving.'
      );
    } finally {
      setIsSavingEdit(false);
    }
  };

  return (
    <div className="max-w-[1080px] mx-auto space-y-6 pb-16">
      {/* Top Bar Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#ecf0f1]">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-[#2c3e50] hover:text-[#3498db] transition cursor-pointer self-start"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Catalogue</span>
        </button>

        <div className="flex items-center flex-wrap gap-2">
          <button
            onClick={() => setShowAttachModal(true)}
            className="px-3 py-1.5 bg-white border border-[#3498db] text-[#3498db] hover:bg-[#3498db] hover:text-white rounded-[6px] text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
          >
            <Link className="w-3.5 h-3.5" />
            <span>Attach Library / Resource Link</span>
          </button>

          <button
            onClick={() => setShowEditModal(true)}
            className="px-3 py-1.5 bg-[#2c3e50] text-white hover:bg-[#34495e] rounded-[6px] text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
          >
            <Edit className="w-3.5 h-3.5" />
            <span>Edit Record</span>
          </button>

          <button
            onClick={() => setShowHistoryModal(true)}
            className="px-3 py-1.5 bg-[#f8f9fa] border border-[#ecf0f1] text-[#34495e] hover:bg-[#ecf0f1] rounded-[6px] text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            title="Inspect audit trail and provenance"
          >
            <History className="w-3.5 h-3.5 text-[#7f8c8d]" />
            <span>Revision History (r{item.revisionCount})</span>
          </button>

          <button
            onClick={handleCopyJson}
            className="px-2.5 py-1.5 bg-[#f8f9fa] border border-[#ecf0f1] text-[#7f8c8d] hover:text-[#333333] rounded-[6px] text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
            title="Copy structured schema JSON for external applications"
          >
            <Code className="w-3.5 h-3.5" />
            <span>{copiedJson ? 'Copied JSON!' : 'Schema JSON'}</span>
          </button>
        </div>
      </div>

      {/* Main Hardware Overview Header Card */}
      <div className="bg-white border border-[#ecf0f1] rounded-[8px] p-6 shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {/* Photos */}
          <div className="space-y-2">
            <div className="aspect-video sm:aspect-square rounded-[8px] border border-[#ecf0f1] bg-[#f8f9fa] overflow-hidden flex items-center justify-center">
              {item.images?.[0]?.url ? (
                <img
                  src={item.images[0].url}
                  alt={item.displayName}
                  className="w-full h-full object-contain"
                />
              ) : (
                <Cpu className="w-12 h-12 text-[#7f8c8d]" />
              )}
            </div>
            {item.images && item.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {item.images.slice(0, 4).map((img, i) => (
                  <img
                    key={i}
                    src={img.url}
                    alt={`Thumb ${i}`}
                    className="aspect-square rounded border border-[#ecf0f1] object-cover cursor-pointer hover:border-[#3498db]"
                  />
                ))}
              </div>
            )}
          </div>

          {/* Details & Identifiers */}
          <div className="md:col-span-2 space-y-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#3498db] bg-[#3498db]/10 px-2 py-0.5 rounded">
                  {item.category}
                </span>
                {item.confirmationStatus === 'confirmed' ? (
                  <span className="text-xs font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-700" /> Confirmed Fact Record
                  </span>
                ) : (
                  <span className="text-xs font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-200 flex items-center gap-1">
                    <HelpCircle className="w-3 h-3 text-amber-700" /> Confirmed Partial Record
                  </span>
                )}
                <span className="text-[11px] font-mono text-[#7f8c8d] ml-auto">
                  ID: {item.id}
                </span>
              </div>

              <h1 className="text-2xl font-bold text-[#2c3e50] tracking-[0.5px]">
                {item.displayName}
              </h1>

              <div className="w-14 h-[3px] bg-[#3498db] rounded-sm my-2" />

              <p className="text-xs text-[#7f8c8d]">
                Manufacturer: <strong className="text-[#2c3e50]">{item.manufacturer}</strong> •
                Model: <strong className="text-[#2c3e50]">{item.model}</strong>
                {item.variantRevision && (
                  <span>
                    {' '}
                    • Revision: <strong className="text-[#2c3e50]">{item.variantRevision}</strong>
                  </span>
                )}
              </p>
            </div>

            <p className="text-xs text-[#34495e] leading-relaxed">
              {item.description || 'No long description provided.'}
            </p>

            {/* Tags & Markings */}
            <div className="space-y-2 pt-2 border-t border-[#ecf0f1] text-xs">
              {item.markings && item.markings.length > 0 && (
                <div className="flex items-start gap-2">
                  <span className="text-[#7f8c8d] font-semibold shrink-0">Physical Markings:</span>
                  <div className="flex flex-wrap gap-1.5 font-mono text-[11px]">
                    {item.markings.map((m, idx) => (
                      <span
                        key={idx}
                        className="bg-[#f8f9fa] border border-[#ecf0f1] px-2 py-0.5 rounded text-[#2c3e50]"
                        title={m.location}
                      >
                        <strong>{m.label}:</strong> {m.text}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {item.tags && item.tags.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-[#7f8c8d] font-semibold shrink-0">Tags:</span>
                  <div className="flex flex-wrap gap-1 text-[11px]">
                    {item.tags.map((t) => (
                      <span
                        key={t}
                        className="bg-[#ecf0f1]/70 text-[#34495e] px-2 py-0.5 rounded font-medium"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Provenance note */}
            <div className="text-[11px] text-[#7f8c8d] pt-2 border-t border-[#ecf0f1] flex items-center justify-between">
              <span>
                Last updated: {new Date(item.updatedAt).toLocaleDateString()} by{' '}
                {item.lastModifiedBy?.name || 'Matt Millar'}
              </span>
              <span>Schema v{item.schemaVersion}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Technical Specifications */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Electrical Specifications */}
        <div className="bg-white border border-[#ecf0f1] rounded-[8px] p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-[#ecf0f1]">
            <Zap className="w-4 h-4 text-[#3498db]" />
            <h3 className="text-xs font-bold text-[#2c3e50] uppercase tracking-wider">
              Electrical Specifications
            </h3>
          </div>

          {item.electrical?.supplyInputs && item.electrical.supplyInputs.length > 0 ? (
            <div className="space-y-2">
              {item.electrical.supplyInputs.map((inp, idx) => (
                <div key={idx} className="p-2.5 bg-[#f8f9fa] rounded-[6px] border border-[#ecf0f1] text-xs">
                  <div className="flex items-center justify-between">
                    <strong className="text-[#2c3e50]">{inp.name}</strong>
                    <span className="font-mono text-[#3498db] font-semibold">
                      {inp.minVoltage !== undefined && inp.maxVoltage !== undefined
                        ? `${inp.minVoltage}V to ${inp.maxVoltage}V`
                        : `${inp.typVoltage ?? '?'}V`}
                    </span>
                  </div>
                  {inp.logicLevelVoltage && (
                    <div className="text-[11px] text-[#7f8c8d] mt-0.5">
                      Logic level: <span className="font-mono text-[#2c3e50]">{inp.logicLevelVoltage}V</span>
                    </div>
                  )}
                  {inp.notes && (
                    <p className="text-[11px] text-[#34495e] mt-1 leading-snug">{inp.notes}</p>
                  )}
                  {inp.evidenceSourceId && (
                    <div className="text-[10px] text-[#7f8c8d] mt-1 font-mono">
                      Evidence: {inp.evidenceSourceId}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#7f8c8d] italic">No electrical supply ranges recorded.</p>
          )}

          {item.electrical?.absoluteMaxRatings && item.electrical.absoluteMaxRatings.length > 0 && (
            <div className="pt-2 border-t border-[#ecf0f1]">
              <span className="text-[11px] font-bold text-[#e74c3c] block mb-1">
                Absolute Maximum Ratings (Failure thresholds):
              </span>
              <ul className="text-xs space-y-1">
                {item.electrical.absoluteMaxRatings.map((max, idx) => (
                  <li key={idx} className="flex items-center justify-between bg-red-50/50 p-1.5 rounded border border-red-100">
                    <span className="text-[#34495e]">{max.parameter}</span>
                    <span className="font-mono font-bold text-[#e74c3c]">{max.value}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Card 2: Wired & Wireless Interfaces */}
        <div className="bg-white border border-[#ecf0f1] rounded-[8px] p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-[#ecf0f1]">
            <Share2 className="w-4 h-4 text-[#3498db]" />
            <h3 className="text-xs font-bold text-[#2c3e50] uppercase tracking-wider">
              Communication Interfaces
            </h3>
          </div>

          <div className="space-y-3">
            <div>
              <span className="text-[11px] font-bold text-[#7f8c8d] uppercase tracking-wider block mb-1">
                Wired Interfaces:
              </span>
              {item.wiredInterfaces && item.wiredInterfaces.length > 0 ? (
                <div className="space-y-1.5">
                  {item.wiredInterfaces.map((w, idx) => (
                    <div
                      key={idx}
                      className="p-2 bg-[#f8f9fa] rounded-[4px] border border-[#ecf0f1] flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[#2c3e50] bg-white px-1.5 py-0.5 rounded border border-[#ecf0f1]">
                          {w.type}
                        </span>
                        <span className="text-[#34495e]">{w.versionOrSpeed}</span>
                      </div>
                      {w.defaultAddresses && w.defaultAddresses.length > 0 && (
                        <span className="font-mono text-[11px] text-[#3498db] bg-[#3498db]/10 px-1.5 py-0.5 rounded font-semibold">
                          Addr: {w.defaultAddresses.join(', ')}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#7f8c8d] italic">No wired interfaces recorded.</p>
              )}
            </div>

            <div>
              <span className="text-[11px] font-bold text-[#7f8c8d] uppercase tracking-wider block mb-1">
                Wireless Protocols:
              </span>
              {item.wireless && item.wireless.length > 0 ? (
                <div className="space-y-1.5">
                  {item.wireless.map((wp, idx) => (
                    <div
                      key={idx}
                      className="p-2 bg-[#f8f9fa] rounded-[4px] border border-[#ecf0f1] flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <Radio className="w-3.5 h-3.5 text-[#3498db]" />
                        <span className="font-bold text-[#2c3e50]">{wp.protocol}</span>
                        <span className="text-[#7f8c8d]">{wp.standardOrVersion}</span>
                      </div>
                      {wp.frequencyBands && (
                        <span className="text-[11px] font-mono text-[#7f8c8d]">
                          {wp.frequencyBands.join(', ')}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#7f8c8d] italic">No wireless radios on this board.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Software Compatibility & Attached Resources */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 3: Software & Framework Compatibility */}
        <div className="bg-white border border-[#ecf0f1] rounded-[8px] p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-[#ecf0f1]">
            <Code className="w-4 h-4 text-[#3498db]" />
            <h3 className="text-xs font-bold text-[#2c3e50] uppercase tracking-wider">
              Software Compatibility & Drivers
            </h3>
          </div>

          {item.softwareAndCompatibility && item.softwareAndCompatibility.length > 0 ? (
            <div className="space-y-2">
              {item.softwareAndCompatibility.map((sc, idx) => (
                <div key={idx} className="p-2.5 bg-[#f8f9fa] rounded-[6px] border border-[#ecf0f1] text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#2c3e50]">{sc.frameworkOrTarget}</span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded capitalize ${
                        sc.status === 'manufacturer_supported'
                          ? 'bg-emerald-100 text-emerald-800'
                          : sc.status === 'community_supported'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {sc.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  {sc.compatibilityConditions && (
                    <p className="text-[11px] text-[#34495e]">{sc.compatibilityConditions}</p>
                  )}

                  {sc.driverOrLibraryUrl && (
                    <a
                      href={sc.driverOrLibraryUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#3498db] text-[11px] flex items-center gap-1 hover:underline truncate"
                    >
                      <span>{sc.driverOrLibraryUrl}</span>
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#7f8c8d] italic">No software framework support recorded.</p>
          )}
        </div>

        {/* Card 4: Linked Resources & Software Libraries */}
        <div className="bg-white border border-[#ecf0f1] rounded-[8px] p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#ecf0f1]">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#3498db]" />
              <h3 className="text-xs font-bold text-[#2c3e50] uppercase tracking-wider">
                Resources & Documentation
              </h3>
            </div>
            <button
              onClick={() => setShowAttachModal(true)}
              className="text-[11px] text-[#3498db] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3 h-3" /> Attach Link
            </button>
          </div>

          {item.resources && item.resources.length > 0 ? (
            <div className="space-y-2">
              {item.resources.map((res) => (
                <div
                  key={res.id}
                  className="p-2.5 bg-[#f8f9fa] rounded-[6px] border border-[#ecf0f1] text-xs flex items-start justify-between gap-2"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-[#2c3e50]">{res.title}</span>
                      <span className="text-[10px] bg-white border border-[#ecf0f1] px-1.5 py-0.2 rounded font-mono text-[#7f8c8d]">
                        {res.type}
                      </span>
                    </div>
                    {res.description && (
                      <p className="text-[11px] text-[#7f8c8d]">{res.description}</p>
                    )}
                    <a
                      href={res.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#3498db] text-[11px] flex items-center gap-1 hover:underline truncate max-w-sm mt-0.5"
                    >
                      <span>{res.url}</span>
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-[#7f8c8d] space-y-2">
              <p>No external software libraries or manuals attached yet.</p>
              <button
                onClick={() => setShowAttachModal(true)}
                className="text-xs text-[#3498db] font-semibold hover:underline"
              >
                + Attach a GitHub repo, driver, or datasheet now
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Attributed Evidence Sources Section */}
      <div className="bg-white border border-[#ecf0f1] rounded-[8px] p-5 shadow-xs space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-[#ecf0f1]">
          <ShieldCheck className="w-4 h-4 text-[#3498db]" />
          <h3 className="text-xs font-bold text-[#2c3e50] uppercase tracking-wider">
            Attributed Evidence Sources ({item.sources?.length || 0})
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {item.sources?.map((src) => (
            <div
              key={src.id}
              className="p-3 bg-[#f8f9fa] rounded-[6px] border border-[#ecf0f1] text-xs space-y-1"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-[#3498db] font-bold">{src.id}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                    src.reliability === 'primary_manufacturer'
                      ? 'bg-emerald-100 text-emerald-800'
                      : src.reliability === 'user_direct'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {src.reliability.replace(/_/g, ' ')}
                </span>
              </div>

              <strong className="text-[#2c3e50] block">{src.title}</strong>
              <div className="text-[11px] text-[#7f8c8d]">
                Publisher: {src.authorOrPublisher || 'Manufacturer'} • Type:{' '}
                {src.sourceType.replace(/_/g, ' ')}
              </div>

              {src.url && (
                <a
                  href={src.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#3498db] text-[11px] flex items-center gap-1 hover:underline truncate mt-1"
                >
                  <span>{src.url}</span>
                  <ExternalLink className="w-3 h-3 shrink-0" />
                </a>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Modal: Attach Resource / Library */}
      {showAttachModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[8px] border border-[#ecf0f1] shadow-xl max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#ecf0f1]">
              <div className="flex items-center gap-2">
                <Link className="w-4 h-4 text-[#3498db]" />
                <h3 className="text-sm font-bold text-[#2c3e50]">
                  Attach Resource or Library Link
                </h3>
              </div>
              <button
                onClick={() => setShowAttachModal(false)}
                className="text-[#7f8c8d] hover:text-[#333333] p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAttachResource} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-[#2c3e50]">Resource Title *</label>
                <input
                  type="text"
                  required
                  value={resTitle}
                  onChange={(e) => setResTitle(e.target.value)}
                  placeholder="e.g. Adafruit_BME280 Driver Library"
                  className="w-full px-2.5 py-1.5 border border-[#ecf0f1] rounded-[4px] mt-1 text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-[#2c3e50]">Resource URL *</label>
                <input
                  type="url"
                  required
                  value={resUrl}
                  onChange={(e) => setResUrl(e.target.value)}
                  placeholder="https://github.com/..."
                  className="w-full px-2.5 py-1.5 border border-[#ecf0f1] rounded-[4px] mt-1 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-[#2c3e50]">Type</label>
                  <select
                    value={resType}
                    onChange={(e) => setResType(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 border border-[#ecf0f1] rounded-[4px] mt-1 text-xs bg-white"
                  >
                    <option value="software_library">Software Library</option>
                    <option value="driver">Driver</option>
                    <option value="github_repo">GitHub Repo</option>
                    <option value="datasheet">Datasheet</option>
                    <option value="manual">Manual</option>
                    <option value="schematic">Schematic</option>
                    <option value="pinout_diagram">Pinout Diagram</option>
                    <option value="personal_project">Personal Project</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-[#2c3e50]">Version / Revision</label>
                  <input
                    type="text"
                    value={resVersion}
                    onChange={(e) => setResVersion(e.target.value)}
                    placeholder="e.g. v2.2.0"
                    className="w-full px-2.5 py-1.5 border border-[#ecf0f1] rounded-[4px] mt-1 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-[#2c3e50]">Description</label>
                <textarea
                  rows={2}
                  value={resDescription}
                  onChange={(e) => setResDescription(e.target.value)}
                  placeholder="Notes on usage or compatible platforms..."
                  className="w-full px-2.5 py-1.5 border border-[#ecf0f1] rounded-[4px] mt-1 text-xs"
                />
              </div>

              {attachError && (
                <div className="p-2 bg-red-50 text-red-700 text-xs rounded border border-red-200">
                  {attachError}
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#ecf0f1]">
                <button
                  type="button"
                  onClick={() => setShowAttachModal(false)}
                  className="px-3 py-1.5 text-xs text-[#7f8c8d] hover:bg-[#f8f9fa] rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAttaching}
                  className="px-4 py-1.5 bg-[#2c3e50] text-white font-semibold rounded-[6px] hover:bg-[#34495e] text-xs cursor-pointer"
                >
                  {isAttaching ? 'Attaching...' : 'Attach Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Record with Concurrency Checking */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[8px] border border-[#ecf0f1] shadow-xl max-w-lg w-full p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#ecf0f1]">
              <div className="flex items-center gap-2">
                <Edit className="w-4 h-4 text-[#3498db]" />
                <h3 className="text-sm font-bold text-[#2c3e50]">
                  Edit Hardware Record (Revision r{item.revisionCount})
                </h3>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-[#7f8c8d] hover:text-[#333333] p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {concurrencyConflictError && (
              <div className="p-3 bg-red-50 text-red-800 rounded-[6px] border border-red-200 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-red-900">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>Conflict Detected</span>
                </div>
                <p>{concurrencyConflictError}</p>
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-[#2c3e50]">Display Name *</label>
                <input
                  type="text"
                  required
                  value={editDisplayName}
                  onChange={(e) => setEditDisplayName(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-[#ecf0f1] rounded-[4px] mt-1 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-[#2c3e50]">Model</label>
                  <input
                    type="text"
                    value={editModel}
                    onChange={(e) => setEditModel(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-[#ecf0f1] rounded-[4px] mt-1 text-xs"
                  />
                </div>

                <div>
                  <label className="font-semibold text-[#2c3e50]">Variant / Revision</label>
                  <input
                    type="text"
                    value={editRevision}
                    onChange={(e) => setEditRevision(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-[#ecf0f1] rounded-[4px] mt-1 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-[#2c3e50]">Technical Description</label>
                <textarea
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-[#ecf0f1] rounded-[4px] mt-1 text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-[#2c3e50]">Bench Notes</label>
                <textarea
                  rows={2}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-[#ecf0f1] rounded-[4px] mt-1 text-xs"
                />
              </div>

              <div className="mm-highlight text-[11px] text-[#34495e]">
                <strong>Optimistic Concurrency:</strong> Saving will increment revision number from{' '}
                {item.revisionCount} to {item.revisionCount + 1} and record an audit log with author provenance.
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#ecf0f1]">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-3 py-1.5 text-xs text-[#7f8c8d] hover:bg-[#f8f9fa] rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="px-4 py-1.5 bg-[#2c3e50] text-white font-semibold rounded-[6px] hover:bg-[#34495e] text-xs cursor-pointer"
                >
                  {isSavingEdit ? 'Saving...' : 'Commit Updates'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Revision History & Audit Trail */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[8px] border border-[#ecf0f1] shadow-xl max-w-lg w-full p-5 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-[#ecf0f1]">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-[#3498db]" />
                <h3 className="text-sm font-bold text-[#2c3e50]">
                  Provenance & Revision History
                </h3>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="text-[#7f8c8d] hover:text-[#333333] p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 overflow-y-auto pr-1 flex-1 text-xs">
              {item.revisions && item.revisions.length > 0 ? (
                item.revisions.map((rev) => (
                  <div
                    key={rev.revisionNumber}
                    className="p-3 bg-[#f8f9fa] rounded-[6px] border border-[#ecf0f1] space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[#3498db] font-bold">
                        Revision #{rev.revisionNumber}
                      </span>
                      <span className="text-[10px] text-[#7f8c8d]">
                        {new Date(rev.timestamp).toLocaleString()}
                      </span>
                    </div>

                    <div className="font-semibold text-[#2c3e50]">
                      {rev.authorName}{' '}
                      <span className="text-[10px] text-[#7f8c8d] font-normal">
                        ({rev.authorRole})
                      </span>
                    </div>

                    <p className="text-[#34495e] text-[11px] leading-relaxed">
                      {rev.actionSummary}
                    </p>

                    {rev.fieldsModified && rev.fieldsModified.length > 0 && (
                      <div className="text-[10px] text-[#7f8c8d] pt-1">
                        Modified fields: <span className="font-mono">{rev.fieldsModified.join(', ')}</span>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-[#7f8c8d]">
                  Initial creation record only.
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-[#ecf0f1] flex justify-end">
              <button
                onClick={() => setShowHistoryModal(false)}
                className="px-3 py-1.5 bg-[#2c3e50] text-white rounded text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
