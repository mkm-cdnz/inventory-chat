import React, { useState } from 'react';
import { HardwareItem } from '../types/hardware';
import {
  Bookmark,
  Cpu,
  Zap,
  Share2,
  Trash2,
  ExternalLink,
  ChevronRight,
  Search,
  CheckCircle2,
  Bot,
} from 'lucide-react';

interface MyBenchViewProps {
  savedItems: HardwareItem[];
  onSelectItem: (item: HardwareItem) => void;
  onRemoveItem: (id: string) => void;
  onGoToSearch: () => void;
  onOpenChat?: (item: HardwareItem) => void;
}

export const MyBenchView: React.FC<MyBenchViewProps> = ({
  savedItems,
  onSelectItem,
  onRemoveItem,
  onGoToSearch,
  onOpenChat,
}) => {
  const [filterQuery, setFilterQuery] = useState('');

  const filtered = savedItems.filter((item) => {
    const q = filterQuery.toLowerCase();
    return (
      !q ||
      item.displayName.toLowerCase().includes(q) ||
      item.model.toLowerCase().includes(q) ||
      item.manufacturer.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      (item.tags || []).some((t) => t.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-[#ecf0f1] rounded-[10px] p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#2c3e50] tracking-[0.5px]">
            My Workbench Saved Items
          </h1>
          <p className="text-xs text-[#7f8c8d] mt-0.5">
            Quick reference for pinouts, power ratings, and datasheets of hardware currently on your desk.
          </p>
        </div>

        <button
          onClick={onGoToSearch}
          className="px-4 py-2 bg-[#2c3e50] hover:bg-[#34495e] text-white text-xs font-semibold rounded-[8px] transition cursor-pointer self-start sm:self-auto"
        >
          + Lookup New Hardware
        </button>
      </div>

      {/* Filter search */}
      {savedItems.length > 0 && (
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-[#7f8c8d] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Filter saved bench items..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-[#ecf0f1] rounded-[8px] focus:outline-none focus:border-[#3498db]"
          />
        </div>
      )}

      {/* Grid of Saved Items */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="bg-white border border-[#ecf0f1] hover:border-[#3498db] rounded-[8px] p-4 flex flex-col justify-between transition group shadow-xs cursor-pointer"
              onClick={() => onSelectItem(item)}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[#3498db] bg-[#3498db]/10 px-1.5 py-0.5 rounded">
                      {item.category}
                    </span>
                    <h3 className="text-sm font-bold text-[#2c3e50] group-hover:text-[#3498db] transition-colors mt-1">
                      {item.displayName}
                    </h3>
                    <p className="text-[11px] text-[#7f8c8d]">
                      {item.manufacturer} • {item.model}
                    </p>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveItem(item.id);
                    }}
                    className="text-[#cbd5e1] hover:text-red-600 p-1 rounded transition"
                    title="Remove from Bench"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Key Spec Badges */}
                <div className="space-y-1 text-xs text-[#34495e] border-t border-[#ecf0f1] pt-2">
                  {item.electrical?.supplyInputs?.[0] && (
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[#7f8c8d] flex items-center gap-1">
                        <Zap className="w-3 h-3 text-[#3498db]" /> Supply:
                      </span>
                      <span className="font-mono text-[#2c3e50]">
                        {item.electrical.supplyInputs[0].minVoltage !== undefined
                          ? `${item.electrical.supplyInputs[0].minVoltage}V–${item.electrical.supplyInputs[0].maxVoltage}V`
                          : `${item.electrical.supplyInputs[0].typVoltage}V`}
                      </span>
                    </div>
                  )}

                  {item.pinsAndConnectors && item.pinsAndConnectors.length > 0 && (
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[#7f8c8d]">Pin Count:</span>
                      <span className="font-mono text-[#2c3e50]">
                        {item.pinsAndConnectors.length} pins mapped
                      </span>
                    </div>
                  )}

                  {item.wiredInterfaces && item.wiredInterfaces.length > 0 && (
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[#7f8c8d]">Buses:</span>
                      <span className="font-mono text-[10px] text-[#3498db]">
                        {item.wiredInterfaces.map((w) => w.type).join(', ')}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 mt-3 border-t border-[#ecf0f1] flex items-center justify-between text-[11px]">
                <span className="text-[#3498db] font-semibold flex items-center gap-1">
                  <span>View Pinout & Specs</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </span>

                {onOpenChat && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenChat(item);
                    }}
                    className="px-2 py-1 rounded-[6px] bg-[#34495e] hover:bg-[#2c3e50] text-white flex items-center gap-1 text-[10px] font-semibold transition shadow-2xs"
                    title="Chat with Gemini about this device"
                  >
                    <Bot className="w-3 h-3 text-[#3498db]" />
                    <span>Ask Gemini</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-[#ecf0f1] rounded-[10px] p-12 text-center space-y-3">
          <Bookmark className="w-8 h-8 text-[#cbd5e1] mx-auto" />
          <h3 className="text-sm font-bold text-[#2c3e50]">No Items on Your Bench</h3>
          <p className="text-xs text-[#7f8c8d] max-w-sm mx-auto">
            When you point your camera or search for hardware, click "Save to My Bench" to keep its pinout and wiring notes easily accessible here.
          </p>
          <div className="pt-2">
            <button
              onClick={onGoToSearch}
              className="px-4 py-2 bg-[#2c3e50] text-white text-xs font-semibold rounded-[8px] hover:bg-[#34495e]"
            >
              Start Hardware Search
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
