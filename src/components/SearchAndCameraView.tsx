import React, { useState } from 'react';
import { HardwareItem } from '../types/hardware';
import { identifyHardwareWithAI } from '../services/aiService';
import { HardwareLookupResult } from './HardwareLookupResult';
import { LiveCameraCapture } from './LiveCameraCapture';
import {
  Camera,
  Search,
  Upload,
  Sparkles,
  Zap,
  Cpu,
  RefreshCw,
  X,
  History,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';

interface SearchAndCameraViewProps {
  onSaveToBench: (item: HardwareItem) => void;
  savedBenchItems: HardwareItem[];
  recentLookups: HardwareItem[];
  onOpenChat: (item: HardwareItem | null, initialPrompt?: string) => void;
}

export const SearchAndCameraView: React.FC<SearchAndCameraViewProps> = ({
  onSaveToBench,
  savedBenchItems,
  recentLookups,
  onOpenChat,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentResult, setCurrentResult] = useState<HardwareItem | null>(null);

  const quickPills = [
    { label: 'ESP32-S3 DevKit', query: 'ESP32-S3-DevKitC-1 pinout, dual USB, 3.3V logic' },
    { label: 'Bosch BME280', query: 'Bosch BME280 breakout pinout, I2C default address, 3.3V operating voltage' },
    { label: 'Raspberry Pi 5 GPIO', query: 'Raspberry Pi 5 40-pin GPIO pinout, PCIe connector, 5V/5A power' },
    { label: 'RP2040 MCU', query: 'Raspberry Pi RP2040 pinout, BOOTSEL pin, ADC pins, 3.3V power' },
    { label: 'CH340G USB Serial', query: 'CH340G USB to UART bridge pinout, V3 pin capacitor, TX/RX logic levels' },
    { label: 'USB-C 16-Pin', query: 'USB Type-C 16-pin receptacle pinout, CC1 CC2 5.1k resistors, VBUS GND' },
  ];

  const handlePerformLookup = async (textToSearch?: string, imageToSearch?: string | null) => {
    const query = textToSearch !== undefined ? textToSearch : searchQuery;
    const img = imageToSearch !== undefined ? imageToSearch : capturedImage;

    if (!query.trim() && !img) {
      setError('Please point your camera at the hardware or type a chip/board name.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await identifyHardwareWithAI(
        {
          description: query.trim(),
          imagesBase64: img ? [img] : [],
          knownIdentifiers: {
            name: query.trim(),
            model: query.trim(),
          },
        },
        savedBenchItems
      );

      if (response.proposedItem) {
        const item = response.proposedItem as HardwareItem;
        setCurrentResult(item);
      } else {
        throw new Error('No hardware information could be retrieved from search.');
      }
    } catch (err: any) {
      console.error('Lookup failed:', err);
      setError(
        err.message || 'Failed to search the internet for this item. Please try rephrasing or capturing a clearer photo.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCameraCapture = (base64: string) => {
    setCapturedImage(base64);
    // Immediately trigger lookup with the captured photo
    handlePerformLookup(searchQuery, base64);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const b64 = event.target?.result as string;
        setCapturedImage(b64);
        handlePerformLookup(searchQuery, b64);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const isSaved = currentResult
    ? savedBenchItems.some((i) => i.id === currentResult.id || i.model === currentResult.model)
    : false;

  return (
    <div className="space-y-6">
      {/* Live Viewfinder Modal */}
      <LiveCameraCapture
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCameraCapture}
      />

      {/* Main Search & Camera Section */}
      <div className="bg-white border border-[#ecf0f1] rounded-[12px] p-5 sm:p-6 shadow-xs space-y-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#2c3e50] tracking-[0.5px]">
            Instant Hardware Specs & Pinout Lookup
          </h1>
          <p className="text-xs sm:text-sm text-[#7f8c8d] mt-1">
            Point your camera or enter text. The system searches the Internet for pinouts, operating voltages, datasheets, ports, and wiring gotchas.
          </p>
        </div>

        {/* Input Bar with Camera & Search Triggers */}
        <div className="flex flex-col sm:flex-row gap-2.5">
          {/* Text Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#7f8c8d] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handlePerformLookup();
              }}
              placeholder="Search any chip, board, sensor or port... (e.g. ESP32-S3 pinout, BME280 wiring, USB-C CC pins)"
              className="w-full pl-10 pr-10 py-3 text-xs sm:text-sm bg-white border border-[#ecf0f1] rounded-[8px] focus:outline-none focus:border-[#3498db] text-[#333333] transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7f8c8d] hover:text-[#333333] p-1"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Action Buttons: Camera & Search */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCameraOpen(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-3 bg-[#34495e] hover:bg-[#2c3e50] text-white text-xs font-semibold rounded-[8px] transition cursor-pointer shadow-xs"
              title="Point camera at board"
            >
              <Camera className="w-4 h-4 text-[#3498db]" />
              <span>Point Camera</span>
            </button>

            <label className="p-3 bg-[#f8f9fa] hover:bg-[#ecf0f1] border border-[#ecf0f1] rounded-[8px] text-[#34495e] transition cursor-pointer flex items-center justify-center" title="Upload image">
              <Upload className="w-4 h-4" />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />
            </label>

            <button
              onClick={() => handlePerformLookup()}
              disabled={loading}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 bg-[#2c3e50] hover:bg-[#34495e] text-white text-xs font-semibold rounded-[8px] transition cursor-pointer shadow-xs disabled:opacity-60"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 text-[#3498db] animate-spin" />
                  <span>Searching...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-[#3498db]" />
                  <span>Search Internet</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Captured Image Preview if any */}
        {capturedImage && (
          <div className="flex items-center gap-3 p-2 bg-[#f8f9fa] border border-[#ecf0f1] rounded-[8px] max-w-sm">
            <img
              src={capturedImage}
              alt="Hardware input"
              className="w-12 h-12 object-cover rounded-[6px] border border-[#ecf0f1]"
            />
            <div className="flex-1 min-w-0">
              <span className="text-xs font-semibold text-[#2c3e50] block truncate">
                Photo captured
              </span>
              <span className="text-[10px] text-[#7f8c8d]">
                Analyzing IC markings and port layouts
              </span>
            </div>
            <button
              onClick={() => setCapturedImage(null)}
              className="p-1 text-[#7f8c8d] hover:text-red-600 rounded"
              title="Clear photo"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Quick Suggestion Pills */}
        <div className="flex items-center flex-wrap gap-1.5 pt-1 text-xs">
          <span className="text-[#7f8c8d] font-medium mr-1 flex items-center gap-1">
            <Zap className="w-3 h-3 text-[#3498db]" /> Try:
          </span>
          {quickPills.map((pill) => (
            <button
              key={pill.label}
              onClick={() => {
                setSearchQuery(pill.query);
                handlePerformLookup(pill.query, null);
              }}
              className="px-2.5 py-1 rounded-[6px] bg-[#f8f9fa] border border-[#ecf0f1] text-[#34495e] hover:border-[#3498db] hover:text-[#3498db] transition cursor-pointer text-[11px]"
            >
              {pill.label}
            </button>
          ))}
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-[8px] text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Loading Progress State */}
      {loading && (
        <div className="bg-white border border-[#ecf0f1] rounded-[10px] p-8 text-center space-y-3 shadow-xs">
          <div className="w-8 h-8 border-3 border-[#3498db] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-bold text-[#2c3e50] tracking-wide">
            Searching the Internet via Google Search Grounding...
          </p>
          <p className="text-xs text-[#7f8c8d] max-w-md mx-auto">
            Extracting official pin assignments, operating supply voltage ranges, default I2C addresses, and manufacturer datasheets.
          </p>
        </div>
      )}

      {/* Lookup Result View */}
      {!loading && currentResult && (
        <HardwareLookupResult
          item={currentResult}
          isSavedOnBench={isSaved}
          onToggleSaveBench={(item) => onSaveToBench(item)}
          onOpenChat={(prompt) => onOpenChat(currentResult, prompt)}
          onNewSearch={() => {
            setSearchQuery('');
            setCapturedImage(null);
            setCurrentResult(null);
          }}
        />
      )}

      {/* Default State: Recent Lookups & Helpful Bench Tips */}
      {!loading && !currentResult && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Recent Bench / Lookups */}
          <div className="bg-white border border-[#ecf0f1] rounded-[10px] p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-[#ecf0f1]">
              <History className="w-4 h-4 text-[#3498db]" />
              <h3 className="text-xs font-bold text-[#2c3e50] uppercase tracking-wider">
                Recent Lookups & Saved Items ({recentLookups.length})
              </h3>
            </div>

            {recentLookups.length > 0 ? (
              <div className="space-y-2">
                {recentLookups.slice(0, 5).map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setCurrentResult(item)}
                    className="p-2.5 rounded-[6px] border border-[#ecf0f1] hover:border-[#3498db] bg-[#f8f9fa] flex items-center justify-between cursor-pointer transition group"
                  >
                    <div>
                      <span className="text-xs font-bold text-[#2c3e50] group-hover:text-[#3498db] transition-colors">
                        {item.displayName}
                      </span>
                      <span className="text-[11px] text-[#7f8c8d] block">
                        {item.manufacturer} • {item.model}
                      </span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-[#7f8c8d] group-hover:text-[#3498db] transition-transform group-hover:translate-x-0.5" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#7f8c8d] py-4 text-center">
                Point your camera or search above to lookup hardware pinouts.
              </p>
            )}
          </div>

          {/* Quick Hardware Tips */}
          <div className="bg-white border border-[#ecf0f1] rounded-[10px] p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-[#ecf0f1]">
              <Cpu className="w-4 h-4 text-[#3498db]" />
              <h3 className="text-xs font-bold text-[#2c3e50] uppercase tracking-wider">
                Workbench Quick Checks
              </h3>
            </div>

            <div className="space-y-2 text-xs text-[#34495e]">
              <div className="p-2.5 bg-[#f8f9fa] rounded-[6px] border border-[#ecf0f1]">
                <strong className="text-[#2c3e50]">Camera Mode:</strong>
                <p className="text-[11px] text-[#7f8c8d] mt-0.5">
                  Ensure good lighting on top silkscreen and IC laser markings. The AI reads part numbers and finds matching datasheets.
                </p>
              </div>

              <div className="p-2.5 bg-[#f8f9fa] rounded-[6px] border border-[#ecf0f1]">
                <strong className="text-[#2c3e50]">3.3V vs 5V Protection:</strong>
                <p className="text-[11px] text-[#7f8c8d] mt-0.5">
                  Always verify whether GPIOs are 5V tolerant. ESP32 and RP2040 GPIOs are NOT 5V tolerant and will fry if hooked to raw 5V logic.
                </p>
              </div>

              <div className="p-2.5 bg-[#f8f9fa] rounded-[6px] border border-[#ecf0f1]">
                <strong className="text-[#2c3e50]">I2C Bus Pull-ups:</strong>
                <p className="text-[11px] text-[#7f8c8d] mt-0.5">
                  Breakout boards typically include 10k pull-ups to 3.3V. If using multiple boards on the same bus, check parallel resistance.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
