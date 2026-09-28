import React, { useState } from 'react';
import {
  Terminal,
  ShieldCheck,
  Code,
  Copy,
  Check,
  X,
  ExternalLink,
  Lock,
  Layers,
  Cpu,
} from 'lucide-react';
import configJson from '../../firebase-applet-config.json';

interface ApiIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApiIntegrationModal: React.FC<ApiIntegrationModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'rest' | 'firebase' | 'concurrency'>('rest');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  if (!isOpen) return null;

  const copySnippet = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const curlIdentify = `curl -X POST https://ais-dev-ozmzybjnah674s4wbuxvmt-278577399763.asia-east1.run.app/api/v1/identify \\
  -H "Content-Type: application/json" \\
  -d '{
    "description": "Purple sensor breakout board marked UP with VIN, 3Vo, GND, SCK, SDO, SDI, CS",
    "knownIdentifiers": {
      "markings": "UP, AP2112K LDO",
      "model": "BME280"
    }
  }'`;

  const curlAttachResource = `curl -X POST https://ais-dev-ozmzybjnah674s4wbuxvmt-278577399763.asia-east1.run.app/api/v1/catalogue/hw-bme280-breakout/attach-resource \\
  -H "Authorization: Bearer <FIREBASE_ID_TOKEN>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "ESP-IDF BME280 Driver Component",
    "url": "https://github.com/espressif/idf-extra-components/tree/master/bme280",
    "type": "software_library",
    "versionOrRevision": "v1.0.3",
    "author": {
      "name": "autonomous-agent-build-01",
      "role": "autonomous_agent"
    }
  }'`;

  const tsFirebaseAdmin = `import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin with authorized service account
const db = getFirestore();
const itemRef = db.collection('hardware_items').doc('hw-bme280-breakout');

// Targeted atomic update with provenance preservation
await db.runTransaction(async (transaction) => {
  const doc = await transaction.get(itemRef);
  if (!doc.exists) throw new Error("Item not found");
  
  const current = doc.data();
  const currentRev = current.revisionCount || 0;
  
  // Concurrency check
  const newRevisionRecord = {
    revisionNumber: currentRev + 1,
    timestamp: new Date().toISOString(),
    authorName: 'PlatformIO Agent',
    authorRole: 'autonomous_agent',
    actionSummary: 'Attached verified library platformio/bme280-embedded',
    fieldsModified: ['resources']
  };

  transaction.update(itemRef, {
    resources: [...(current.resources || []), {
      id: \`res-\${Date.now()}\`,
      title: 'PlatformIO Registry Driver',
      url: 'https://registry.platformio.org/libraries/adafruit/Adafruit%20BME280%20Library',
      type: 'software_library'
    }],
    updatedAt: new Date().toISOString(),
    revisionCount: currentRev + 1,
    revisions: [...(current.revisions || []), newRevisionRecord]
  });
});`;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-[8px] border border-[#ecf0f1] shadow-2xl max-w-2xl w-full p-6 space-y-5 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-[#ecf0f1]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#2c3e50] text-white rounded-[6px]">
              <Terminal className="w-5 h-5 text-[#3498db]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#2c3e50] tracking-[0.5px]">
                Programmatic & Autonomous Agent Hub
              </h2>
              <p className="text-xs text-[#7f8c8d]">
                Documented, authenticated methods for external applications and AI agents to query and update catalogue records.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#7f8c8d] hover:text-[#333333] p-1.5 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 border-b border-[#ecf0f1] pb-2 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('rest')}
            className={`px-3 py-1.5 rounded-[6px] transition cursor-pointer ${
              activeTab === 'rest'
                ? 'bg-[#2c3e50] text-white'
                : 'text-[#7f8c8d] hover:text-[#333333]'
            }`}
          >
            REST API Proxy
          </button>
          <button
            onClick={() => setActiveTab('firebase')}
            className={`px-3 py-1.5 rounded-[6px] transition cursor-pointer ${
              activeTab === 'firebase'
                ? 'bg-[#2c3e50] text-white'
                : 'text-[#7f8c8d] hover:text-[#333333]'
            }`}
          >
            Direct Firestore SDK
          </button>
          <button
            onClick={() => setActiveTab('concurrency')}
            className={`px-3 py-1.5 rounded-[6px] transition cursor-pointer ${
              activeTab === 'concurrency'
                ? 'bg-[#2c3e50] text-white'
                : 'text-[#7f8c8d] hover:text-[#333333]'
            }`}
          >
            Concurrency & Provenance
          </button>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto space-y-4 pr-1 text-xs text-[#34495e] flex-1">
          {activeTab === 'rest' && (
            <div className="space-y-4">
              <div className="mm-highlight text-xs space-y-1">
                <p className="font-bold text-[#2c3e50]">Authenticated Writes with Open Reads</p>
                <p>
                  Catalogue search and retrieval is public for connected tooling. Modifying or attaching resources requires Firebase ID Token in the <code>Authorization: Bearer</code> header.
                </p>
              </div>

              {/* Endpoint 1: Identify Hardware */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#2c3e50] flex items-center gap-1.5">
                    <span className="px-1.5 py-0.5 bg-[#2c3e50] text-white rounded font-mono text-[10px]">
                      POST
                    </span>{' '}
                    /api/v1/identify
                  </span>
                  <button
                    onClick={() => copySnippet(curlIdentify, 'identify')}
                    className="text-[#3498db] hover:underline flex items-center gap-1 font-semibold text-[11px]"
                  >
                    {copiedCode === 'identify' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedCode === 'identify' ? 'Copied' : 'Copy cURL'}</span>
                  </button>
                </div>
                <pre className="p-3 bg-[#1e293b] text-[#f1f5f9] rounded-[6px] overflow-x-auto font-mono text-[11px] leading-relaxed">
                  {curlIdentify}
                </pre>
              </div>

              {/* Endpoint 2: Targeted Resource Attachment */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#2c3e50] flex items-center gap-1.5">
                    <span className="px-1.5 py-0.5 bg-[#3498db] text-white rounded font-mono text-[10px]">
                      POST
                    </span>{' '}
                    /api/v1/catalogue/:id/attach-resource
                  </span>
                  <button
                    onClick={() => copySnippet(curlAttachResource, 'attach')}
                    className="text-[#3498db] hover:underline flex items-center gap-1 font-semibold text-[11px]"
                  >
                    {copiedCode === 'attach' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedCode === 'attach' ? 'Copied' : 'Copy cURL'}</span>
                  </button>
                </div>
                <pre className="p-3 bg-[#1e293b] text-[#f1f5f9] rounded-[6px] overflow-x-auto font-mono text-[11px] leading-relaxed">
                  {curlAttachResource}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'firebase' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 bg-[#f8f9fa] border border-[#ecf0f1] rounded-[6px]">
                  <span className="text-[#7f8c8d] text-[10px] block font-semibold">PROJECT ID</span>
                  <span className="font-mono text-[#2c3e50] font-bold">{configJson.projectId}</span>
                </div>
                <div className="p-2.5 bg-[#f8f9fa] border border-[#ecf0f1] rounded-[6px]">
                  <span className="text-[#7f8c8d] text-[10px] block font-semibold">FIRESTORE DATABASE ID</span>
                  <span className="font-mono text-[#2c3e50] font-bold truncate block">
                    {configJson.firestoreDatabaseId}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#2c3e50]">
                    Node.js Firebase Admin SDK Targeted Transaction
                  </span>
                  <button
                    onClick={() => copySnippet(tsFirebaseAdmin, 'admin')}
                    className="text-[#3498db] hover:underline flex items-center gap-1 font-semibold text-[11px]"
                  >
                    {copiedCode === 'admin' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedCode === 'admin' ? 'Copied' : 'Copy TS Code'}</span>
                  </button>
                </div>
                <pre className="p-3 bg-[#1e293b] text-[#f1f5f9] rounded-[6px] overflow-x-auto font-mono text-[11px] leading-relaxed">
                  {tsFirebaseAdmin}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'concurrency' && (
            <div className="space-y-3">
              <h4 className="font-bold text-[#2c3e50]">Concurrency & Provenance Architecture</h4>
              <p className="leading-relaxed">
                To prevent race conditions when multiple autonomous agents (e.g. firmware generators, schematic linters) update catalogue records simultaneously:
              </p>

              <div className="space-y-2">
                <div className="p-3 bg-[#f8f9fa] border-l-3 border-[#3498db] rounded-r-[6px]">
                  <strong className="text-[#2c3e50]">1. Monotonic Revision Counter</strong>
                  <p className="text-[11px] text-[#7f8c8d] mt-0.5">
                    Every hardware record carries an incrementing <code>revisionCount</code>. Write requests specify <code>expectedRevisionCount</code>; if mismatched, a 409 Conflict is returned.
                  </p>
                </div>

                <div className="p-3 bg-[#f8f9fa] border-l-3 border-[#3498db] rounded-r-[6px]">
                  <strong className="text-[#2c3e50]">2. Provenance Audit History</strong>
                  <p className="text-[11px] text-[#7f8c8d] mt-0.5">
                    Every modification appends an immutable entry to the <code>revisions</code> array with <code>timestamp</code>, <code>authorName</code>, <code>authorRole</code>, and <code>actionSummary</code>.
                  </p>
                </div>

                <div className="p-3 bg-[#f8f9fa] border-l-3 border-[#3498db] rounded-r-[6px]">
                  <strong className="text-[#2c3e50]">3. Targeted Attribute Updates</strong>
                  <p className="text-[11px] text-[#7f8c8d] mt-0.5">
                    External updates to resources (e.g. attaching a newly written library) only merge the <code>resources</code> field without overwriting delicate electrical or pin mapping fields.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-[#ecf0f1] flex items-center justify-between text-xs text-[#7f8c8d]">
          <span>Firestore Security Rules Deployed & Enforced</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#2c3e50] text-white rounded-[6px] font-semibold hover:bg-[#34495e]"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
