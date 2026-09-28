import React, { useState } from 'react';
import {
  HardwareItem,
  ResourceLink,
} from '../types/hardware';
import {
  Zap,
  Cpu,
  Share2,
  Radio,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Bookmark,
  BookmarkCheck,
  Copy,
  Check,
  ExternalLink,
  Search,
  BookOpen,
  ArrowRight,
  ShieldAlert,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Bot,
  Sparkles,
} from 'lucide-react';

interface HardwareLookupResultProps {
  item: HardwareItem;
  isSavedOnBench: boolean;
  onToggleSaveBench: (item: HardwareItem) => void;
  onAttachResource?: (resource: ResourceLink) => void;
  onNewSearch?: () => void;
  onOpenChat?: (initialPrompt?: string) => void;
}

export const HardwareLookupResult: React.FC<HardwareLookupResultProps> = ({
  item,
  isSavedOnBench,
  onToggleSaveBench,
  onNewSearch,
  onOpenChat,
}) => {
  const [pinSearch, setPinSearch] = useState('');
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [copiedPins, setCopiedPins] = useState(false);
  const [activeTab, setActiveTab] = useState<'pinout' | 'electrical' | 'connectivity' | 'datasheets'>('pinout');

  // Filtered pinout table
  const filteredPins = (item.pinsAndConnectors || []).filter((p) => {
    const q = pinSearch.toLowerCase();
    return (
      !q ||
      p.pinOrConnectorId.toLowerCase().includes(q) ||
      (p.labelPrinted && p.labelPrinted.toLowerCase().includes(q)) ||
      (p.primaryFunction && p.primaryFunction.toLowerCase().includes(q)) ||
      (p.gpioNumber !== undefined && String(p.gpioNumber).includes(q)) ||
      (p.alternateFunctions && p.alternateFunctions.some((af) => af.toLowerCase().includes(q)))
    );
  });

  // Copy Pinout Table as Markdown
  const copyPinoutMarkdown = () => {
    const header = '| Pin | Label | GPIO | Primary Function | Alternate Modes | Restrictions |\n|---|---|---|---|---|---|\n';
    const rows = (item.pinsAndConnectors || [])
      .map(
        (p) =>
          `| ${p.pinOrConnectorId} | ${p.labelPrinted || '-'} | ${p.gpioNumber !== undefined ? p.gpioNumber : '-'} | ${p.primaryFunction || '-'} | ${(p.alternateFunctions || []).join(', ') || '-'} | ${p.restrictions || '-'} |`
      )
      .join('\n');
    navigator.clipboard.writeText(header + rows);
    setCopiedPins(true);
    setTimeout(() => setCopiedPins(false), 2000);
  };

  // Copy Full Summary as Markdown
  const copyFullSummary = () => {
    const text = `### ${item.displayName} (${item.manufacturer} ${item.model})
Category: ${item.category}
Supply: ${(item.electrical?.supplyInputs || []).map((i) => `${i.name}: ${i.minVoltage ?? ''}V-${i.maxVoltage ?? ''}V`).join(', ')}
Interfaces: ${(item.wiredInterfaces || []).map((w) => `${w.type} (${(w.defaultAddresses || []).join('/')})`).join(', ')}

${item.description}

Datasheets & Links:
${(item.resources || []).map((r) => `- [${r.title}](${r.url}) (${r.type})`).join('\n')}
`;
    navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  // Collect gotchas/warnings
  const warnings: string[] = [];
  if (item.electrical?.summaryNotes) {
    warnings.push(item.electrical.summaryNotes);
  }
  (item.pinsAndConnectors || []).forEach((p) => {
    if (p.restrictions && (p.restrictions.toLowerCase().includes('not 5v') || p.restrictions.toLowerCase().includes('strap') || p.restrictions.toLowerCase().includes('pull'))) {
      warnings.push(`${p.labelPrinted || p.pinOrConnectorId}: ${p.restrictions}`);
    }
  });
  if (item.notes) {
    warnings.push(item.notes);
  }

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <div className="bg-white border border-[#ecf0f1] rounded-[10px] p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-5">
          <div className="flex items-start gap-4">
            {item.images?.[0]?.url && (
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-[8px] border border-[#ecf0f1] bg-[#f8f9fa] overflow-hidden shrink-0 flex items-center justify-center p-1">
                <img
                  src={item.images[0].url}
                  alt={item.displayName}
                  className="w-full h-full object-contain"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-semibold text-[#3498db] bg-[#3498db]/10 px-2 py-0.5 rounded">
                  {item.category}
                </span>
                {item.variantRevision && (
                  <span className="text-[11px] text-[#2c3e50] bg-[#ecf0f1] font-mono px-2 py-0.5 rounded">
                    {item.variantRevision}
                  </span>
                )}
                <span className="text-[10px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded flex items-center gap-1 font-medium">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Internet Grounded
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-[#2c3e50] tracking-[0.5px]">
                {item.displayName}
              </h2>

              <p className="text-xs text-[#7f8c8d]">
                Manufacturer: <strong className="text-[#2c3e50]">{item.manufacturer}</strong> • Model:{' '}
                <strong className="text-[#2c3e50]">{item.model}</strong>
              </p>

              <p className="text-xs text-[#34495e] leading-relaxed pt-1 max-w-2xl">
                {item.description}
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2 shrink-0 self-start flex-wrap">
            <button
              onClick={() => onOpenChat?.()}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-[8px] bg-[#2c3e50] text-white hover:bg-[#34495e] transition cursor-pointer shadow-xs"
              title="Chat with Gemini about this device"
            >
              <Bot className="w-4 h-4 text-[#3498db]" />
              <span>Chat with Gemini</span>
            </button>

            <button
              onClick={() => onToggleSaveBench(item)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-[8px] border transition cursor-pointer ${
                isSavedOnBench
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-white border-[#3498db] text-[#3498db] hover:bg-[#3498db] hover:text-white'
              }`}
            >
              {isSavedOnBench ? (
                <>
                  <BookmarkCheck className="w-4 h-4" />
                  <span>Saved on Bench</span>
                </>
              ) : (
                <>
                  <Bookmark className="w-4 h-4" />
                  <span>Save to My Bench</span>
                </>
              )}
            </button>

            <button
              onClick={copyFullSummary}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-[8px] bg-[#f8f9fa] border border-[#ecf0f1] text-[#34495e] hover:bg-[#ecf0f1] transition cursor-pointer"
              title="Copy Summary"
            >
              {copiedSummary ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copiedSummary ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Quick Spec Badges Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-[#ecf0f1]">
          {/* Logic Level */}
          <div className="p-2.5 bg-[#f8f9fa] rounded-[6px] border border-[#ecf0f1]">
            <span className="text-[10px] text-[#7f8c8d] uppercase font-bold block">Logic Level</span>
            <span className="text-sm font-bold text-[#2c3e50]">
              {item.electrical?.supplyInputs?.[0]?.logicLevelVoltage
                ? `${item.electrical.supplyInputs[0].logicLevelVoltage}V Logic`
                : '3.3V (standard)'}
            </span>
          </div>

          {/* Supply Input */}
          <div className="p-2.5 bg-[#f8f9fa] rounded-[6px] border border-[#ecf0f1]">
            <span className="text-[10px] text-[#7f8c8d] uppercase font-bold block">Supply Range</span>
            <span className="text-sm font-bold text-[#2c3e50]">
              {item.electrical?.supplyInputs?.[0]?.minVoltage !== undefined
                ? `${item.electrical.supplyInputs[0].minVoltage}V – ${item.electrical.supplyInputs[0].maxVoltage ?? item.electrical.supplyInputs[0].minVoltage}V`
                : '5.0V / 3.3V'}
            </span>
          </div>

          {/* Primary Bus / Interface */}
          <div className="p-2.5 bg-[#f8f9fa] rounded-[6px] border border-[#ecf0f1]">
            <span className="text-[10px] text-[#7f8c8d] uppercase font-bold block">Primary Bus</span>
            <span className="text-sm font-bold text-[#2c3e50] truncate block">
              {item.wiredInterfaces?.[0]?.type || 'GPIO / Serial'}
              {item.wiredInterfaces?.[0]?.defaultAddresses?.[0]
                ? ` (${item.wiredInterfaces[0].defaultAddresses[0]})`
                : ''}
            </span>
          </div>

          {/* Form Factor / IC */}
          <div className="p-2.5 bg-[#f8f9fa] rounded-[6px] border border-[#ecf0f1]">
            <span className="text-[10px] text-[#7f8c8d] uppercase font-bold block">Form Factor</span>
            <span className="text-sm font-bold text-[#2c3e50] truncate block">
              {item.physicalAndFunctional?.formFactor || item.physicalAndFunctional?.processor?.socOrMcu || 'Module'}
            </span>
          </div>
        </div>

        {/* Quick Gemini Assistant Prompts Bar */}
        <div className="mt-4 pt-3 border-t border-[#ecf0f1] flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-[#7f8c8d]">
            <Bot className="w-3.5 h-3.5 text-[#3498db]" />
            <span className="font-semibold text-[#2c3e50]">Ask Gemini:</span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
            <button
              onClick={() => onOpenChat?.(`How do I wire the ${item.displayName} to an ESP32 or Arduino?`)}
              className="px-2.5 py-1 rounded-[6px] bg-[#f8f9fa] border border-[#ecf0f1] hover:border-[#3498db] hover:text-[#3498db] text-[#34495e] transition cursor-pointer"
            >
              Wiring to MCU
            </button>
            <button
              onClick={() => onOpenChat?.(`Are the ${item.displayName} pins 5V tolerant or do I need level shifters?`)}
              className="px-2.5 py-1 rounded-[6px] bg-[#f8f9fa] border border-[#ecf0f1] hover:border-[#3498db] hover:text-[#3498db] text-[#34495e] transition cursor-pointer"
            >
              5V Logic Tolerance
            </button>
            <button
              onClick={() => onOpenChat?.(`Give me a minimal code example to initialize and read ${item.displayName}`)}
              className="px-2.5 py-1 rounded-[6px] bg-[#f8f9fa] border border-[#ecf0f1] hover:border-[#3498db] hover:text-[#3498db] text-[#34495e] transition cursor-pointer"
            >
              Sample Code
            </button>
            <button
              onClick={() => onOpenChat?.()}
              className="px-2.5 py-1 rounded-[6px] bg-[#3498db]/10 text-[#3498db] font-semibold hover:bg-[#3498db] hover:text-white transition cursor-pointer flex items-center gap-1"
            >
              <MessageSquare className="w-3 h-3" />
              <span>Open Chat</span>
            </button>
          </div>
        </div>
      </div>

      {/* Critical Warnings / Gotchas Callout (High Visibility) */}
      {warnings.length > 0 && (
        <div className="bg-amber-50/90 border-l-4 border-amber-500 rounded-r-[8px] p-4 text-xs space-y-1.5 shadow-xs">
          <div className="flex items-center gap-2 text-amber-900 font-bold">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Wiring Gotchas & Safety Restrictions</span>
          </div>
          <ul className="list-disc pl-5 space-y-1 text-amber-900 leading-relaxed">
            {warnings.map((w, idx) => (
              <li key={idx}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[#ecf0f1] pb-1 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('pinout')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-t-[6px] border-b-2 transition cursor-pointer ${
            activeTab === 'pinout'
              ? 'border-[#3498db] text-[#3498db] bg-[#3498db]/5'
              : 'border-transparent text-[#7f8c8d] hover:text-[#333333]'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>Pinout & Connectors ({item.pinsAndConnectors?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('electrical')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-t-[6px] border-b-2 transition cursor-pointer ${
            activeTab === 'electrical'
              ? 'border-[#3498db] text-[#3498db] bg-[#3498db]/5'
              : 'border-transparent text-[#7f8c8d] hover:text-[#333333]'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Electrical & Power</span>
        </button>

        <button
          onClick={() => setActiveTab('connectivity')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-t-[6px] border-b-2 transition cursor-pointer ${
            activeTab === 'connectivity'
              ? 'border-[#3498db] text-[#3498db] bg-[#3498db]/5'
              : 'border-transparent text-[#7f8c8d] hover:text-[#333333]'
          }`}
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>Ports & Connectivity</span>
        </button>

        <button
          onClick={() => setActiveTab('datasheets')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-t-[6px] border-b-2 transition cursor-pointer ${
            activeTab === 'datasheets'
              ? 'border-[#3498db] text-[#3498db] bg-[#3498db]/5'
              : 'border-transparent text-[#7f8c8d] hover:text-[#333333]'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Datasheets & Manuals ({item.resources?.length || 0})</span>
        </button>

        <button
          onClick={() => onOpenChat?.()}
          className="flex items-center gap-1.5 px-3 py-2 rounded-t-[6px] border-b-2 border-transparent text-[#3498db] hover:bg-[#3498db]/10 transition cursor-pointer sm:ml-auto font-semibold"
          title="Open Gemini Chat Assistant with this device context"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Chat with Gemini</span>
        </button>
      </div>

      {/* Tab 1: Pinout & Connectors Table */}
      {activeTab === 'pinout' && (
        <div className="bg-white border border-[#ecf0f1] rounded-[8px] p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-3.5 h-3.5 text-[#7f8c8d] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={pinSearch}
                onChange={(e) => setPinSearch(e.target.value)}
                placeholder="Filter pins (e.g. SDA, TX, GPIO4, 3.3V)..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-[#ecf0f1] rounded-[6px] focus:outline-none focus:border-[#3498db]"
              />
            </div>

            <button
              onClick={copyPinoutMarkdown}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f8f9fa] border border-[#ecf0f1] rounded-[6px] text-xs font-semibold text-[#34495e] hover:bg-[#ecf0f1] self-start sm:self-auto cursor-pointer"
            >
              {copiedPins ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedPins ? 'Copied Pinout' : 'Copy Pinout Table'}</span>
            </button>
          </div>

          {filteredPins.length > 0 ? (
            <div className="overflow-x-auto rounded-[6px] border border-[#ecf0f1]">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-[#f8f9fa] text-[#2c3e50] border-b border-[#ecf0f1]">
                    <th className="py-2.5 px-3 font-semibold">Pin / Header</th>
                    <th className="py-2.5 px-3 font-semibold">Label</th>
                    <th className="py-2.5 px-3 font-semibold">GPIO #</th>
                    <th className="py-2.5 px-3 font-semibold">Primary Function</th>
                    <th className="py-2.5 px-3 font-semibold">Alternate Functions</th>
                    <th className="py-2.5 px-3 font-semibold">Restrictions / Gotchas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ecf0f1]">
                  {filteredPins.map((pin, i) => (
                    <tr key={i} className="hover:bg-[#f8f9fa]/80 transition">
                      <td className="py-2.5 px-3 font-mono font-bold text-[#2c3e50]">
                        {pin.pinOrConnectorId}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-semibold text-[#3498db]">
                        {pin.labelPrinted || '-'}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[#34495e]">
                        {pin.gpioNumber !== undefined ? `GPIO${pin.gpioNumber}` : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-[#333333] font-medium">
                        {pin.primaryFunction || '-'}
                      </td>
                      <td className="py-2.5 px-3 text-[#7f8c8d]">
                        {pin.alternateFunctions && pin.alternateFunctions.length > 0 ? (
                          <div className="flex flex-wrap gap-1 font-mono text-[10px]">
                            {pin.alternateFunctions.map((af) => (
                              <span key={af} className="bg-[#f8f9fa] px-1 py-0.2 rounded border border-[#ecf0f1]">
                                {af}
                              </span>
                            ))}
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-xs">
                        {pin.restrictions ? (
                          <span className={`px-1.5 py-0.5 rounded text-[11px] font-medium ${
                            pin.restrictions.toLowerCase().includes('not 5v') || pin.restrictions.toLowerCase().includes('strap')
                              ? 'bg-amber-100 text-amber-900 border border-amber-200'
                              : 'text-[#34495e]'
                          }`}>
                            {pin.restrictions}
                          </span>
                        ) : (
                          <span className="text-[#cbd5e1]">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-[#7f8c8d]">
              No pins match "{pinSearch}". Try clearing the filter.
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Electrical & Power */}
      {activeTab === 'electrical' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Normal Operating Voltages */}
          <div className="bg-white border border-[#ecf0f1] rounded-[8px] p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-[#ecf0f1]">
              <Zap className="w-4 h-4 text-[#3498db]" />
              <h3 className="text-xs font-bold text-[#2c3e50] uppercase tracking-wider">
                Normal Operating Inputs
              </h3>
            </div>

            <div className="space-y-2">
              {item.electrical?.supplyInputs && item.electrical.supplyInputs.length > 0 ? (
                item.electrical.supplyInputs.map((input, idx) => (
                  <div key={idx} className="p-3 bg-[#f8f9fa] rounded-[6px] border border-[#ecf0f1] text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#2c3e50]">{input.name}</span>
                      <span className="font-mono text-[#3498db] font-bold">
                        {input.minVoltage !== undefined && input.maxVoltage !== undefined
                          ? `${input.minVoltage}V to ${input.maxVoltage}V`
                          : `${input.typVoltage ?? ''}V`}
                      </span>
                    </div>
                    {input.logicLevelVoltage && (
                      <div className="text-[11px] text-[#7f8c8d]">
                        Logic level: <strong>{input.logicLevelVoltage}V</strong>
                      </div>
                    )}
                    {input.notes && <p className="text-[11px] text-[#34495e]">{input.notes}</p>}
                  </div>
                ))
              ) : (
                <p className="text-xs text-[#7f8c8d]">Standard 3.3V operating voltage.</p>
              )}
            </div>
          </div>

          {/* Absolute Max Ratings */}
          <div className="bg-white border border-[#ecf0f1] rounded-[8px] p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-[#ecf0f1]">
              <AlertTriangle className="w-4 h-4 text-[#e74c3c]" />
              <h3 className="text-xs font-bold text-[#e74c3c] uppercase tracking-wider">
                Absolute Maximum Ratings (Damage Limits)
              </h3>
            </div>

            <div className="space-y-2">
              {item.electrical?.absoluteMaxRatings && item.electrical.absoluteMaxRatings.length > 0 ? (
                item.electrical.absoluteMaxRatings.map((rating, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 bg-red-50/60 rounded-[6px] border border-red-100 flex items-center justify-between text-xs"
                  >
                    <span className="text-[#34495e] font-medium">{rating.parameter}</span>
                    <span className="font-mono font-bold text-[#e74c3c]">{rating.value}</span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-[#7f8c8d]">No absolute max limits specified in brief.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Ports & Connectivity */}
      {activeTab === 'connectivity' && (
        <div className="bg-white border border-[#ecf0f1] rounded-[8px] p-5 shadow-xs space-y-5">
          {/* Wired Interfaces */}
          <div>
            <h3 className="text-xs font-bold text-[#2c3e50] uppercase tracking-wider mb-2.5">
              Wired Communication Interfaces
            </h3>
            {item.wiredInterfaces && item.wiredInterfaces.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {item.wiredInterfaces.map((w, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-[#f8f9fa] rounded-[6px] border border-[#ecf0f1] text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-sm text-[#2c3e50]">{w.type}</span>
                      {w.busRole && (
                        <span className="text-[10px] text-[#7f8c8d] bg-white px-1.5 py-0.2 rounded border">
                          {w.busRole}
                        </span>
                      )}
                    </div>
                    {w.defaultAddresses && w.defaultAddresses.length > 0 && (
                      <div className="text-[11px] text-[#3498db] font-mono font-bold">
                        Addresses: {w.defaultAddresses.join(', ')}
                      </div>
                    )}
                    {w.versionOrSpeed && (
                      <p className="text-[11px] text-[#7f8c8d]">{w.versionOrSpeed}</p>
                    )}
                    {w.connectorOrPins && (
                      <p className="text-[11px] text-[#34495e]">{w.connectorOrPins}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#7f8c8d]">No bus interfaces listed.</p>
            )}
          </div>

          {/* Wireless Protocols */}
          {item.wireless && item.wireless.length > 0 && (
            <div className="pt-3 border-t border-[#ecf0f1]">
              <h3 className="text-xs font-bold text-[#2c3e50] uppercase tracking-wider mb-2.5">
                Wireless Radios & Protocols
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {item.wireless.map((wp, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-[#f8f9fa] rounded-[6px] border border-[#ecf0f1] text-xs flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <Radio className="w-4 h-4 text-[#3498db]" />
                      <div>
                        <span className="font-bold text-[#2c3e50]">{wp.protocol}</span>
                        <span className="text-[11px] text-[#7f8c8d] ml-2 font-mono">
                          {wp.standardOrVersion}
                        </span>
                      </div>
                    </div>
                    {wp.frequencyBands && (
                      <span className="text-[11px] font-mono text-[#7f8c8d]">
                        {wp.frequencyBands.join(', ')}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Datasheets & Manuals */}
      {activeTab === 'datasheets' && (
        <div className="bg-white border border-[#ecf0f1] rounded-[8px] p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#ecf0f1]">
            <h3 className="text-xs font-bold text-[#2c3e50] uppercase tracking-wider">
              Verified Datasheets, Schematics & Manuals
            </h3>
            <span className="text-xs text-[#7f8c8d]">Discovered via Google Search Grounding</span>
          </div>

          {item.resources && item.resources.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {item.resources.map((res) => (
                <a
                  key={res.id}
                  href={res.url}
                  target="_blank"
                  rel="noreferrer"
                  className="p-3.5 bg-[#f8f9fa] hover:bg-[#3498db]/5 rounded-[6px] border border-[#ecf0f1] hover:border-[#3498db] transition group flex flex-col justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-[#2c3e50] group-hover:text-[#3498db] transition-colors">
                        {res.title}
                      </span>
                      <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 bg-white border border-[#ecf0f1] rounded text-[#7f8c8d]">
                        {res.type}
                      </span>
                    </div>
                    {res.description && (
                      <p className="text-[11px] text-[#7f8c8d] line-clamp-2">{res.description}</p>
                    )}
                  </div>
                  <div className="pt-2 mt-2 border-t border-[#ecf0f1]/60 flex items-center justify-between text-[11px] text-[#3498db]">
                    <span className="truncate max-w-[240px] text-[#7f8c8d]">{res.url}</span>
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#7f8c8d] py-6 text-center">
              No official documentation URLs discovered.
            </p>
          )}

          {/* Citations & Sources */}
          {item.sources && item.sources.length > 0 && (
            <div className="pt-4 border-t border-[#ecf0f1] space-y-2">
              <h4 className="text-[11px] font-bold text-[#7f8c8d] uppercase tracking-wider">
                Grounding Evidence Sources
              </h4>
              <div className="space-y-1 text-xs">
                {item.sources.map((s) => (
                  <div key={s.id} className="flex items-center justify-between text-[11px] text-[#34495e]">
                    <span>
                      <strong>{s.title}</strong> ({s.authorOrPublisher || 'Manufacturer'})
                    </span>
                    {s.url && (
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#3498db] hover:underline flex items-center gap-1"
                      >
                        <span>source</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
