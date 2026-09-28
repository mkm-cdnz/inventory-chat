import React, { useState, useMemo } from 'react';
import {
  HardwareItem,
  RequirementsSearchQuery,
  RequirementsSearchResult,
} from '../types/hardware';
import { queryHardwareCatalogue } from '../services/catalogueService';
import { searchByImageWithAI } from '../services/aiService';
import {
  Search,
  Camera,
  Upload,
  Filter,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Cpu,
  Layers,
  Zap,
  ExternalLink,
  ChevronRight,
  Sparkles,
  ArrowRight,
  Info,
  X,
  PlusCircle,
} from 'lucide-react';

interface SearchCatalogueViewProps {
  items: HardwareItem[];
  onSelectItem: (item: HardwareItem) => void;
  onStartNewItemWithImage?: (imageBase64: string) => void;
  onNavigateToAdd: () => void;
}

export const SearchCatalogueView: React.FC<SearchCatalogueViewProps> = ({
  items,
  onSelectItem,
  onStartNewItemWithImage,
  onNavigateToAdd,
}) => {
  const [activeTab, setActiveTab] = useState<'text' | 'image'>('text');

  // Text / Requirements Query States
  const [naturalQuery, setNaturalQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedInterfaces, setSelectedInterfaces] = useState<string[]>([]);
  const [voltageReq, setVoltageReq] = useState<string>('');
  const [confirmedOnly, setConfirmedOnly] = useState<boolean>(false);

  // Image Search States
  const [imageFile, setImageFile] = useState<string | null>(null);
  const [imageSearchLoading, setImageSearchLoading] = useState(false);
  const [imageSearchError, setImageSearchError] = useState<string | null>(null);
  const [imageMatches, setImageMatches] = useState<
    Array<{
      itemId: string;
      displayName: string;
      similarityScore: number;
      confidenceLevel: 'High' | 'Moderate' | 'Low';
      visualMatchingFeatures: string[];
      distinguishingDifferences: string[];
      reasoning: string;
    }>
  >([]);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    items.forEach((i) => {
      if (i.category) set.add(i.category);
    });
    return ['All', ...Array.from(set)];
  }, [items]);

  const interfaceOptions = ['I2C', 'SPI', 'UART', 'USB', 'HDMI', 'Ethernet', 'PCIe'];

  // Parse natural query for common requirement triggers
  const handlePresetQuery = (query: string) => {
    setNaturalQuery(query);
    if (query.includes('3.3 V') || query.includes('3.3V')) {
      setVoltageReq('3.3');
    }
    if (query.includes('I²C') || query.includes('I2C')) {
      if (!selectedInterfaces.includes('I2C')) {
        setSelectedInterfaces((prev) => [...prev, 'I2C']);
      }
    }
    if (query.toLowerCase().includes('sensor')) {
      setSelectedCategory('Sensor');
    }
    if (query.toLowerCase().includes('microcontroller')) {
      setSelectedCategory('Microcontroller');
    }
    if (query.toLowerCase().includes('sbc')) {
      setSelectedCategory('SBC');
    }
  };

  const toggleInterface = (iface: string) => {
    setSelectedInterfaces((prev) =>
      prev.includes(iface) ? prev.filter((i) => i !== iface) : [...prev, iface]
    );
  };

  const clearFilters = () => {
    setNaturalQuery('');
    setSelectedCategory('All');
    setSelectedInterfaces([]);
    setVoltageReq('');
    setConfirmedOnly(false);
  };

  // Perform requirements search
  const searchResults: RequirementsSearchResult[] = useMemo(() => {
    const query: RequirementsSearchQuery = {
      naturalQuery,
      category: selectedCategory === 'All' ? undefined : selectedCategory,
      interfaceTypes: selectedInterfaces.length > 0 ? selectedInterfaces : undefined,
      voltageRequirementV: voltageReq ? parseFloat(voltageReq) : undefined,
      confirmedOnly,
    };
    return queryHardwareCatalogue(items, query);
  }, [items, naturalQuery, selectedCategory, selectedInterfaces, voltageReq, confirmedOnly]);

  // Image Upload Handler
  const handleImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const b64 = e.target?.result as string;
      setImageFile(b64);
      runImageSearch(b64);
    };
    reader.readAsDataURL(file);
  };

  const runImageSearch = async (b64: string) => {
    setImageSearchLoading(true);
    setImageSearchError(null);
    setImageMatches([]);
    try {
      const matches = await searchByImageWithAI(b64, items);
      setImageMatches(matches);
    } catch (err) {
      console.error(err);
      setImageSearchError('Failed to perform image search. You can still inspect candidates or start a new record.');
    } finally {
      setImageSearchLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Header Banner */}
      <div className="bg-white border border-[#ecf0f1] rounded-[8px] p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#2c3e50] tracking-[0.5px]">
              Hardware Catalogue Search
            </h1>
            <p className="text-xs sm:text-sm text-[#7f8c8d] mt-1">
              Search by exact identifiers, natural language constraints, or visual component analysis.
            </p>
          </div>

          {/* Search Mode Switcher */}
          <div className="flex items-center bg-[#f8f9fa] p-1 rounded-[8px] border border-[#ecf0f1] self-start sm:self-auto">
            <button
              onClick={() => setActiveTab('text')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-[6px] transition cursor-pointer ${
                activeTab === 'text'
                  ? 'bg-white text-[#2c3e50] shadow-xs border border-[#ecf0f1]'
                  : 'text-[#7f8c8d] hover:text-[#333333]'
              }`}
            >
              <Search className="w-3.5 h-3.5 text-[#3498db]" />
              <span>Text & Requirements</span>
            </button>
            <button
              onClick={() => setActiveTab('image')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-[6px] transition cursor-pointer ${
                activeTab === 'image'
                  ? 'bg-white text-[#2c3e50] shadow-xs border border-[#ecf0f1]'
                  : 'text-[#7f8c8d] hover:text-[#333333]'
              }`}
            >
              <Camera className="w-3.5 h-3.5 text-[#3498db]" />
              <span>Image Search</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Text & Requirements Mode */}
        {activeTab === 'text' && (
          <div className="mt-5 space-y-4">
            {/* Main Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-[#7f8c8d] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={naturalQuery}
                onChange={(e) => setNaturalQuery(e.target.value)}
                placeholder="Search by name, model, markings, or requirements: e.g. 'a temperature sensor that supports I2C and operates from 3.3 V'..."
                className="w-full pl-10 pr-24 py-2.5 text-sm bg-white border border-[#ecf0f1] rounded-[8px] focus:outline-none focus:border-[#3498db] text-[#333333] transition"
              />
              {naturalQuery && (
                <button
                  onClick={() => setNaturalQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7f8c8d] hover:text-[#333333] p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Quick Test Presets */}
            <div className="flex items-center flex-wrap gap-2 text-xs">
              <span className="text-[#7f8c8d] font-medium flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#3498db]" /> Example queries:
              </span>
              {[
                '3.3 V I2C temperature sensor',
                'ESP32-S3 Wi-Fi and Bluetooth',
                'Raspberry Pi 5 with PCIe',
                'Bosch BME280',
              ].map((preset) => (
                <button
                  key={preset}
                  onClick={() => handlePresetQuery(preset)}
                  className="px-2.5 py-1 rounded-[4px] bg-[#f8f9fa] border border-[#ecf0f1] text-[#34495e] hover:border-[#3498db] hover:text-[#3498db] transition cursor-pointer"
                >
                  "{preset}"
                </button>
              ))}
            </div>

            {/* Structured Filters Bar */}
            <div className="pt-3 border-t border-[#ecf0f1] flex flex-wrap items-center gap-4 text-xs">
              {/* Category Dropdown */}
              <div className="flex items-center gap-2">
                <span className="text-[#7f8c8d] font-semibold">Category:</span>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-white border border-[#ecf0f1] rounded-[4px] px-2.5 py-1 text-xs text-[#333333] focus:outline-none focus:border-[#3498db]"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Interface Checkboxes */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[#7f8c8d] font-semibold">Bus / Interface:</span>
                {interfaceOptions.map((iface) => (
                  <button
                    key={iface}
                    onClick={() => toggleInterface(iface)}
                    className={`px-2 py-0.5 rounded-[4px] border text-xs font-mono transition cursor-pointer ${
                      selectedInterfaces.includes(iface)
                        ? 'bg-[#3498db] text-white border-[#3498db]'
                        : 'bg-white border-[#ecf0f1] text-[#34495e] hover:border-[#cbd5e1]'
                    }`}
                  >
                    {iface}
                  </button>
                ))}
              </div>

              {/* Operating Voltage Input */}
              <div className="flex items-center gap-2">
                <span className="text-[#7f8c8d] font-semibold">Voltage (V):</span>
                <input
                  type="number"
                  step="0.1"
                  value={voltageReq}
                  onChange={(e) => setVoltageReq(e.target.value)}
                  placeholder="e.g. 3.3"
                  className="w-16 px-2 py-1 bg-white border border-[#ecf0f1] rounded-[4px] text-xs text-[#333333] focus:outline-none focus:border-[#3498db]"
                />
              </div>

              {/* Confirmed Only Toggle */}
              <label className="flex items-center gap-1.5 text-xs text-[#34495e] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={confirmedOnly}
                  onChange={(e) => setConfirmedOnly(e.target.checked)}
                  className="rounded text-[#3498db] focus:ring-[#3498db]"
                />
                <span>Confirmed records only</span>
              </label>

              {(naturalQuery || selectedCategory !== 'All' || selectedInterfaces.length > 0 || voltageReq || confirmedOnly) && (
                <button
                  onClick={clearFilters}
                  className="text-xs text-[#e74c3c] hover:underline ml-auto cursor-pointer"
                >
                  Reset filters
                </button>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Image Search Mode */}
        {activeTab === 'image' && (
          <div className="mt-5 space-y-4">
            <div className="mm-highlight text-xs text-[#34495e]">
              <p className="font-semibold text-[#2c3e50]">Visual Component Search</p>
              <p>
                Photograph or upload a hardware photo to find matching catalogue items. We compare board layout, package shapes, markings, and ports. Visual similarity is kept separate from confirmed identity.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Drop / Capture Zone */}
              <div className="border-2 border-dashed border-[#ecf0f1] hover:border-[#3498db] rounded-[8px] p-6 text-center transition flex flex-col items-center justify-center min-h-[180px] bg-[#f8f9fa]">
                {imageFile ? (
                  <div className="space-y-3">
                    <img
                      src={imageFile}
                      alt="Query preview"
                      className="max-h-40 mx-auto rounded-[6px] border border-[#ecf0f1] object-contain shadow-xs"
                    />
                    <div className="flex items-center justify-center gap-2">
                      <label className="text-xs bg-[#2c3e50] text-white px-3 py-1.5 rounded-[4px] hover:bg-[#34495e] cursor-pointer font-medium">
                        Change Photo
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files?.[0]) handleImageUpload(e.target.files[0]);
                          }}
                        />
                      </label>
                      <button
                        onClick={() => runImageSearch(imageFile)}
                        disabled={imageSearchLoading}
                        className="text-xs bg-[#3498db] text-white px-3 py-1.5 rounded-[4px] hover:bg-[#2980b9] font-medium"
                      >
                        {imageSearchLoading ? 'Searching...' : 'Re-analyze Image'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center mx-auto shadow-xs border border-[#ecf0f1]">
                      <Camera className="w-6 h-6 text-[#3498db]" />
                    </div>
                    <p className="text-xs font-semibold text-[#2c3e50]">
                      Take a photo or upload an image
                    </p>
                    <p className="text-[11px] text-[#7f8c8d]">
                      Supports PNG, JPG, WebP from phone camera or computer
                    </p>
                    <div className="pt-2">
                      <label className="text-xs bg-[#2c3e50] text-white px-4 py-2 rounded-[8px] hover:bg-[#34495e] cursor-pointer font-semibold inline-flex items-center gap-1.5 transition">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Select Hardware Photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files?.[0]) handleImageUpload(e.target.files[0]);
                          }}
                        />
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* Match Candidates Container */}
              <div className="border border-[#ecf0f1] rounded-[8px] p-4 bg-white">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold text-[#2c3e50] uppercase tracking-wider">
                    Visual Match Candidates
                  </h3>
                  {imageMatches.length > 0 && (
                    <span className="text-[11px] text-[#3498db] font-semibold">
                      {imageMatches.length} candidate(s) found
                    </span>
                  )}
                </div>

                {imageSearchLoading && (
                  <div className="py-12 text-center space-y-2">
                    <div className="w-6 h-6 border-2 border-[#3498db] border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-xs text-[#7f8c8d]">
                      Analyzing visible silicon markings, IC packages, and connector layouts...
                    </p>
                  </div>
                )}

                {imageSearchError && (
                  <div className="p-3 bg-red-50 text-red-700 text-xs rounded-[4px] border border-red-200">
                    {imageSearchError}
                  </div>
                )}

                {!imageSearchLoading && !imageSearchError && imageMatches.length === 0 && (
                  <div className="py-8 text-center text-xs text-[#7f8c8d] space-y-3">
                    <p>
                      {imageFile
                        ? 'No existing catalogue record matches this photo.'
                        : 'Upload or capture a photo to search candidate matches.'}
                    </p>
                    {imageFile && (
                      <div className="pt-2">
                        <button
                          onClick={() => onStartNewItemWithImage?.(imageFile)}
                          className="px-3.5 py-2 bg-[#3498db] text-white font-semibold rounded-[8px] hover:bg-[#2980b9] inline-flex items-center gap-1.5 transition text-xs"
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                          <span>Start New Entry with this Photo</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {!imageSearchLoading && imageMatches.length > 0 && (
                  <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
                    {imageMatches.map((m) => {
                      const matchedItem = items.find((i) => i.id === m.itemId);
                      return (
                        <div
                          key={m.itemId}
                          className="p-3 rounded-[6px] border border-[#ecf0f1] hover:border-[#3498db] bg-[#f8f9fa] transition"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="text-xs font-bold text-[#2c3e50] hover:text-[#3498db] cursor-pointer" onClick={() => matchedItem && onSelectItem(matchedItem)}>
                                {m.displayName}
                              </span>
                              <div className="flex items-center gap-2 mt-0.5 text-[11px]">
                                <span className={`px-1.5 py-0.5 rounded font-semibold ${
                                  m.confidenceLevel === 'High' ? 'bg-emerald-100 text-emerald-800' :
                                  m.confidenceLevel === 'Moderate' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700'
                                }`}>
                                  {m.similarityScore}% Visual Match ({m.confidenceLevel})
                                </span>
                              </div>
                            </div>
                            {matchedItem && (
                              <button
                                onClick={() => onSelectItem(matchedItem)}
                                className="px-2 py-1 bg-white border border-[#3498db] text-[#3498db] text-xs font-semibold rounded-[4px] hover:bg-[#3498db] hover:text-white transition"
                              >
                                View
                              </button>
                            )}
                          </div>

                          <p className="text-[11px] text-[#34495e] mt-2 leading-relaxed">
                            {m.reasoning}
                          </p>

                          {m.visualMatchingFeatures?.length > 0 && (
                            <div className="mt-2 text-[10px] text-[#7f8c8d]">
                              <strong className="text-[#34495e]">Visual similarities:</strong> {m.visualMatchingFeatures.join(', ')}
                            </div>
                          )}

                          {m.distinguishingDifferences?.length > 0 && (
                            <div className="mt-1 text-[10px] text-[#e67e22]">
                              <strong>Distinguishing check:</strong> {m.distinguishingDifferences.join(', ')}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    <div className="pt-2 text-center">
                      <button
                        onClick={() => onStartNewItemWithImage?.(imageFile!)}
                        className="text-xs text-[#3498db] font-semibold hover:underline"
                      >
                        Not what you have? Start new entry with this photo →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-[#2c3e50] tracking-[0.5px]">
              Catalogue Items
            </h2>
            <span className="text-xs bg-[#ecf0f1] text-[#2c3e50] font-semibold px-2 py-0.5 rounded-full">
              {searchResults.length}
            </span>
          </div>

          <button
            onClick={onNavigateToAdd}
            className="flex items-center gap-1.5 text-xs text-[#3498db] font-semibold hover:underline cursor-pointer"
          >
            <span>+ Add new hardware record</span>
          </button>
        </div>

        {searchResults.length === 0 ? (
          <div className="bg-white border border-[#ecf0f1] rounded-[8px] p-12 text-center space-y-4">
            <Layers className="w-10 h-10 text-[#7f8c8d] mx-auto opacity-50" />
            <div>
              <p className="text-sm font-semibold text-[#2c3e50]">
                No catalogue records matched your query
              </p>
              <p className="text-xs text-[#7f8c8d] mt-1 max-w-md mx-auto">
                No stored hardware satisfies all requested constraints. Missing specifications are not assumed to match.
              </p>
            </div>
            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                onClick={clearFilters}
                className="px-3 py-1.5 text-xs font-semibold rounded-[6px] border border-[#ecf0f1] text-[#34495e] hover:bg-[#f8f9fa]"
              >
                Clear all filters
              </button>
              <button
                onClick={onNavigateToAdd}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-[6px] bg-[#2c3e50] text-white hover:bg-[#34495e]"
              >
                Add this hardware to catalogue
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {searchResults.map(({ item, matchType, rationale, satisfiedConstraints, missingOrUnverifiedConstraints }) => (
              <div
                key={item.id}
                onClick={() => onSelectItem(item)}
                className="bg-white border border-[#ecf0f1] hover:border-[#3498db] rounded-[8px] p-4 flex flex-col justify-between transition group cursor-pointer shadow-xs"
              >
                <div>
                  {/* Thumbnail & Badges */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-16 h-16 rounded-[6px] bg-[#f8f9fa] border border-[#ecf0f1] overflow-hidden shrink-0 flex items-center justify-center">
                      {item.images?.[0]?.url ? (
                        <img
                          src={item.images[0].url}
                          alt={item.displayName}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                      ) : (
                        <Cpu className="w-7 h-7 text-[#7f8c8d]" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-[#3498db] bg-[#3498db]/10 px-1.5 py-0.5 rounded">
                          {item.category}
                        </span>
                        {item.confirmationStatus === 'confirmed' ? (
                          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                            <CheckCircle2 className="w-2.5 h-2.5" /> Confirmed
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 flex items-center gap-1">
                            <HelpCircle className="w-2.5 h-2.5" /> Review / Partial
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm font-bold text-[#2c3e50] group-hover:text-[#3498db] transition-colors truncate mt-1">
                        {item.displayName}
                      </h3>
                      <p className="text-[11px] text-[#7f8c8d] truncate">
                        {item.manufacturer} • {item.model}
                      </p>
                    </div>
                  </div>

                  {/* Requirements Match Rationale Banner */}
                  {(naturalQuery || selectedInterfaces.length > 0 || voltageReq) && (
                    <div
                      className={`mb-3 p-2 rounded-[4px] text-[11px] leading-tight ${
                        matchType === 'confirmed_match'
                          ? 'bg-emerald-50 text-emerald-800 border-l-2 border-emerald-500'
                          : matchType === 'insufficient_information'
                          ? 'bg-amber-50 text-amber-800 border-l-2 border-amber-500'
                          : 'bg-gray-50 text-gray-700 border-l-2 border-gray-400'
                      }`}
                    >
                      <div className="font-semibold flex items-center gap-1">
                        {matchType === 'confirmed_match' ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Confirmed Match
                          </>
                        ) : matchType === 'insufficient_information' ? (
                          <>
                            <AlertCircle className="w-3 h-3 text-amber-600" /> Insufficient Information
                          </>
                        ) : (
                          <>
                            <Info className="w-3 h-3 text-gray-500" /> Partial Match
                          </>
                        )}
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-[10px]">{rationale}</p>
                    </div>
                  )}

                  {/* Key Technical Specs Snapshot */}
                  <div className="space-y-1.5 text-xs text-[#34495e] border-t border-[#ecf0f1] pt-2.5">
                    {/* Voltage */}
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

                    {/* Interfaces */}
                    {item.wiredInterfaces?.length > 0 && (
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-[#7f8c8d]">Interfaces:</span>
                        <div className="flex items-center gap-1 font-mono text-[10px]">
                          {item.wiredInterfaces.slice(0, 3).map((w) => (
                            <span key={w.type} className="bg-[#f8f9fa] px-1 py-0.2 rounded border border-[#ecf0f1]">
                              {w.type}
                            </span>
                          ))}
                          {item.wiredInterfaces.length > 3 && (
                            <span className="text-[#7f8c8d]">+{item.wiredInterfaces.length - 3}</span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Wireless */}
                    {item.wireless?.length > 0 && (
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-[#7f8c8d]">Wireless:</span>
                        <span className="text-[#2c3e50] text-[11px] truncate max-w-[150px]">
                          {item.wireless.map((w) => w.protocol).join(', ')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Footer */}
                <div className="pt-3 mt-3 border-t border-[#ecf0f1] flex items-center justify-between text-[11px] text-[#7f8c8d]">
                  <span className="truncate">
                    {item.sources?.length || 0} source(s) cited
                  </span>
                  <div className="flex items-center gap-1 text-[#3498db] font-semibold group-hover:translate-x-0.5 transition-transform">
                    <span>Inspect</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
