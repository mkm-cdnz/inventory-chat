/**
 * Matt Millar Hardware Pinouts & Specs Finder
 * 
 * Purpose:
 * Point camera or enter text to search the Internet for pinouts,
 * electrical ratings, datasheets, ports, and wiring gotchas.
 */

import React, { useState, useEffect } from 'react';
import { HardwareItem } from './types/hardware';
import {
  fetchAllCatalogueItems,
  saveHardwareRecord,
} from './services/catalogueService';
import { auth, onAuthStateChanged, User } from './config/firebase';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { SearchAndCameraView } from './components/SearchAndCameraView';
import { MyBenchView } from './components/MyBenchView';
import { HardwareLookupResult } from './components/HardwareLookupResult';
import { HardwareChatModal } from './components/HardwareChatModal';
import { CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';

export default function App() {
  const [benchItems, setBenchItems] = useState<HardwareItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState<'search' | 'bench'>('search');
  const [inspectedBenchItem, setInspectedBenchItem] = useState<HardwareItem | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Gemini Chat Assistant state
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [activeChatContext, setActiveChatContext] = useState<HardwareItem | null>(null);
  const [chatInitialPrompt, setChatInitialPrompt] = useState<string | undefined>(undefined);

  // Notification Toast
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: 'success' | 'info';
  } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Load items from Firestore
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const loaded = await fetchAllCatalogueItems();
        setBenchItems(loaded);
      } catch (e) {
        console.error('Failed to load items:', e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Save/Toggle Bench item
  const handleToggleSaveBench = async (item: HardwareItem) => {
    const alreadySaved = benchItems.some((i) => i.id === item.id || i.model === item.model);

    if (alreadySaved) {
      setBenchItems((prev) => prev.filter((i) => i.id !== item.id && i.model !== item.model));
      showToast(`Removed ${item.displayName} from your bench.`, 'info');
      return;
    }

    try {
      const author = {
        name: currentUser?.displayName || 'Matt Millar',
        email: currentUser?.email || 'matt@mattmillar.co.nz',
        role: 'matt_millar' as const,
      };

      const saved = await saveHardwareRecord(
        item,
        author,
        'Saved to workbench via instant internet lookup'
      );

      setBenchItems((prev) => [saved, ...prev.filter((i) => i.id !== saved.id)]);
      showToast(`Saved ${saved.displayName} to your bench!`, 'success');
    } catch (e) {
      console.warn('Error saving to Firestore, caching locally:', e);
      setBenchItems((prev) => [item, ...prev]);
      showToast(`Saved ${item.displayName} to your bench.`, 'success');
    }
  };

  const handleRemoveFromBench = (id: string) => {
    const found = benchItems.find((i) => i.id === id);
    setBenchItems((prev) => prev.filter((i) => i.id !== id));
    if (inspectedBenchItem?.id === id) {
      setInspectedBenchItem(null);
    }
    showToast(`Removed ${found?.displayName || 'item'} from your bench.`, 'info');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#ffffff] text-[#333333]">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#2c3e50] text-white px-4 py-2.5 rounded-[8px] shadow-lg flex items-center gap-2 text-xs font-semibold border-l-4 border-[#3498db] animate-fade-in">
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-[#3498db] shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Global Header */}
      <Header
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setInspectedBenchItem(null);
          setCurrentTab(tab);
        }}
        currentUser={currentUser}
        savedBenchCount={benchItems.length}
        onOpenChat={() => {
          setActiveChatContext(inspectedBenchItem || (benchItems.length > 0 ? benchItems[0] : null));
          setChatInitialPrompt(undefined);
          setIsChatOpen(true);
        }}
        hasActiveHardwareContext={Boolean(inspectedBenchItem || activeChatContext)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-[1120px] w-full mx-auto px-4 sm:px-6 pt-6">
        {loading ? (
          <div className="py-24 text-center space-y-3">
            <div className="w-8 h-8 border-3 border-[#3498db] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-semibold text-[#2c3e50] tracking-wide">
              Loading hardware database...
            </p>
          </div>
        ) : (
          <>
            {/* If inspecting an individual item opened from My Bench */}
            {inspectedBenchItem ? (
              <div className="space-y-4">
                <button
                  onClick={() => setInspectedBenchItem(null)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-[#2c3e50] hover:text-[#3498db] transition cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to My Bench</span>
                </button>

                <HardwareLookupResult
                  item={inspectedBenchItem}
                  isSavedOnBench={benchItems.some((i) => i.id === inspectedBenchItem.id)}
                  onToggleSaveBench={handleToggleSaveBench}
                  onOpenChat={(prompt) => {
                    setActiveChatContext(inspectedBenchItem);
                    setChatInitialPrompt(prompt);
                    setIsChatOpen(true);
                  }}
                />
              </div>
            ) : currentTab === 'search' ? (
              <SearchAndCameraView
                onSaveToBench={handleToggleSaveBench}
                savedBenchItems={benchItems}
                recentLookups={benchItems}
                onOpenChat={(item, prompt) => {
                  setActiveChatContext(item);
                  setChatInitialPrompt(prompt);
                  setIsChatOpen(true);
                }}
              />
            ) : (
              <MyBenchView
                savedItems={benchItems}
                onSelectItem={(item) => setInspectedBenchItem(item)}
                onRemoveItem={handleRemoveFromBench}
                onGoToSearch={() => setCurrentTab('search')}
                onOpenChat={(item) => {
                  setActiveChatContext(item);
                  setChatInitialPrompt(undefined);
                  setIsChatOpen(true);
                }}
              />
            )}
          </>
        )}
      </main>

      {/* Gemini Hardware Chat Modal */}
      <HardwareChatModal
        isOpen={isChatOpen}
        onClose={() => {
          setIsChatOpen(false);
          setChatInitialPrompt(undefined);
        }}
        hardwareContext={activeChatContext}
        initialPrompt={chatInitialPrompt}
      />

      {/* Clean, purposeful footer */}
      <Footer />
    </div>
  );
}
