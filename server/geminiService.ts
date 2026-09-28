import { GoogleGenAI } from '@google/genai';
import {
  HardwareItem,
  IdentifyHardwareResponse,
  EvidenceSource,
} from '../src/types/hardware';

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn('GEMINI_API_KEY environment variable is not defined.');
}

const ai = new GoogleGenAI({
  apiKey: apiKey || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

export async function identifyHardwareWithEvidence(params: {
  imagesBase64?: string[];
  description?: string;
  knownIdentifiers?: {
    name?: string;
    model?: string;
    serialNumber?: string;
    boardRevision?: string;
    markings?: string;
    barcode?: string;
    documentationUrl?: string;
  };
  existingCatalogueSummary?: Array<{
    id: string;
    name: string;
    model: string;
    manufacturer: string;
  }>;
}): Promise<IdentifyHardwareResponse> {
  const { imagesBase64 = [], description = '', knownIdentifiers = {}, existingCatalogueSummary = [] } = params;

  const promptText = `
You are an expert electronics engineer and rapid hardware documentation research engine.
Search the internet using Google Search to locate verified pinouts, electrical characteristics, official datasheets, connectivity/ports, and wiring gotchas for this hardware item.

INPUT QUERY / DETAILS:
- Text Query / Description: "${description || knownIdentifiers.name || knownIdentifiers.model || ''}"
- Known Markings / Model: "${knownIdentifiers.markings || ''} ${knownIdentifiers.model || ''}"
- Board Revision: "${knownIdentifiers.boardRevision || ''}"
- Documentation Reference: "${knownIdentifiers.documentationUrl || ''}"

SPECIFIC INFORMATION TO FIND & POPULATE FROM THE INTERNET:
1. Exact Hardware Identification:
   - Clear Display Name, Manufacturer, Model number, Variant/Revision, Category.
   - Distinguish bare chip/IC from assembled module or breakout board (e.g., bare IC 3.6V vs 5V breakout board with LDO).

2. Pinout & Connectors (CRITICAL):
   - For every major pin or header: physical pin identifier, printed silkscreen label, GPIO number (if MCU/SBC), primary function, alternate functions (e.g. PWM, ADC, SPI_MOSI, I2C_SDA), and electrical restrictions (e.g. "Not 5V tolerant", "Pull-up required", "Strapping pin - do not pull LOW at boot").

3. Electrical & Power Specifications (CRITICAL):
   - Normal operating supply voltages: min, max, typical with units (e.g. 3.0V to 3.6V, or 5V USB).
   - Logic level voltage (e.g. 3.3V or 5V).
   - Normal operating current and maximum current draw (mA).
   - Absolute maximum ratings (e.g. V_in max, max current per GPIO).

4. Ports & Connectivity (CRITICAL):
   - Wired: I2C (verified default 7-bit hex addresses like 0x76, 0x77), SPI (max MHz, clock polarity/phase), UART (default baud rates, RX/TX pins), USB (Type-C / micro, USB 2.0/3.0, Host/Device role), HDMI, Ethernet, etc.
   - Wireless: Wi-Fi standards, Bluetooth/BLE profiles, LoRa, NFC frequencies.

5. Official Datasheets & Manuals (CRITICAL):
   - Real, authentic URLs for manufacturer datasheets, reference manuals, pinout diagrams, schematic PDFs, and official GitHub repos or drivers.

6. Practical Gotchas & Wiring Warnings:
   - High-importance warnings (e.g. "Pin 12 must be LOW during flash", "Requires external level shifter for 5V Arduino", "Onboard antenna must not be covered with metal shielding").

Output must be a valid JSON object matching this structure:
{
  "proposedItem": {
    "displayName": string,
    "category": string ("Microcontroller" | "SBC" | "Sensor" | "Display" | "Power" | "Radio/Wireless" | "Interface" | "Motor/Driver" | "Automotive/Drone" | "Passive/Component" | "Other"),
    "manufacturer": string,
    "model": string,
    "variantRevision": string,
    "aliases": string[],
    "description": string,
    "tags": string[],
    "serialNumbers": string[],
    "barcodes": [{ "format": string, "value": string }],
    "markings": [{ "label": string, "text": string, "location": string }],
    "electrical": {
      "supplyInputs": [{
        "name": string,
        "minVoltage": number,
        "maxVoltage": number,
        "typVoltage": number,
        "voltageUnit": "V",
        "logicLevelVoltage": number,
        "operatingCurrentMa": number,
        "maxCurrentMa": number,
        "notes": string,
        "evidenceSourceId": string
      }],
      "absoluteMaxRatings": [{ "parameter": string, "value": string, "evidenceSourceId": string }],
      "summaryNotes": string
    },
    "pinsAndConnectors": [{
      "pinOrConnectorId": string,
      "physicalType": string,
      "labelPrinted": string,
      "gpioNumber": number,
      "primaryFunction": string,
      "alternateFunctions": string[],
      "restrictions": string,
      "evidenceSourceId": string
    }],
    "wiredInterfaces": [{
      "type": string,
      "versionOrSpeed": string,
      "busRole": string,
      "defaultAddresses": string[],
      "connectorOrPins": string,
      "restrictions": string,
      "evidenceSourceId": string
    }],
    "wireless": [{
      "protocol": string,
      "standardOrVersion": string,
      "frequencyBands": string[],
      "rolesOrProfiles": string[],
      "antennaType": string,
      "evidenceSourceId": string
    }],
    "physicalAndFunctional": {
      "dimensions": { "lengthMm": number, "widthMm": number, "heightMm": number },
      "formFactor": string,
      "processor": { "socOrMcu": string, "architecture": string, "clockSpeedMhz": number, "coreCount": number },
      "memory": { "flash": string, "ram": string },
      "sensors": [{ "type": string, "range": string, "accuracy": string }]
    },
    "softwareAndCompatibility": [{
      "frameworkOrTarget": string,
      "status": "manufacturer_supported" | "community_supported" | "user_attested" | "unverified",
      "driverOrLibraryUrl": string,
      "compatibilityConditions": string,
      "evidenceSourceId": string
    }],
    "sources": [{
      "id": string,
      "title": string,
      "url": string,
      "authorOrPublisher": string,
      "sourceType": "manufacturer_datasheet" | "manufacturer_manual" | "schematic_or_board_layout" | "third_party_documentation" | "web_grounding_verified",
      "reliability": "primary_manufacturer" | "verified_third_party" | "user_direct",
      "extractedDate": string,
      "notes": string
    }],
    "resources": [{
      "id": string,
      "title": string,
      "url": string,
      "type": "datasheet" | "manual" | "schematic" | "driver" | "software_library" | "github_repo" | "pinout_diagram",
      "description": string,
      "versionOrRevision": string
    }],
    "customProperties": [{ "id": string, "key": string, "value": string }],
    "notes": string
  },
  "isExactMatchEstablished": boolean,
  "unresolvedQuestions": string[],
  "candidateVariants": [{
    "name": string,
    "model": string,
    "manufacturer": string,
    "reason": string,
    "missingEvidence": string
  }],
  "existingDuplicatesDetected": []
}

Respond ONLY with valid JSON. Do not wrap in markdown or conversational commentary.
`;

  const contents: any[] = [];

  // Add any uploaded images (up to 3) as inlineData
  for (const imgBase64 of imagesBase64.slice(0, 3)) {
    let cleanData = imgBase64;
    let mimeType = 'image/jpeg';

    if (imgBase64.includes(';base64,')) {
      const parts = imgBase64.split(';base64,');
      mimeType = parts[0].replace('data:', '') || 'image/jpeg';
      cleanData = parts[1];
    }

    contents.push({
      inlineData: {
        mimeType,
        data: cleanData,
      },
    });
  }

  contents.push({ text: promptText });

  try {
    const candidateModels = ['gemini-3.8-flash', 'gemini-3.5-flash', 'gemini-3.1-flash-lite'];
    let lastError: any = null;
    let response: any = null;

    for (const model of candidateModels) {
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          response = await ai.models.generateContent({
            model,
            contents,
            config: {
              tools: [{ googleSearch: {} }],
            },
          });
          if (response?.text) break;
        } catch (err: any) {
          lastError = err;
          const isRetryable =
            err?.message?.includes('503') ||
            err?.message?.includes('429') ||
            err?.message?.includes('high demand') ||
            err?.status === 'UNAVAILABLE';
          if (isRetryable && attempt === 0) {
            await new Promise((r) => setTimeout(r, 1200));
            continue;
          }
          break; // move to next model candidate
        }
      }
      if (response?.text) break;
    }

    if (!response?.text) {
      throw lastError || new Error('No response from Gemini models');
    }

    const responseText = response.text || '';
    let parsed: IdentifyHardwareResponse;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      const jsonStringToParse = jsonMatch ? jsonMatch[0] : responseText;
      parsed = JSON.parse(jsonStringToParse);
    } catch (parseErr) {
      console.warn('Initial JSON parse failed, trying cleaned:', parseErr);
      const cleaned = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
      parsed = JSON.parse(cleaned);
    }

    // Attach discovered web links from Google Search grounding metadata if available
    try {
      const candidate = response.candidates?.[0];
      const grounding = candidate?.groundingMetadata;
      if (grounding?.groundingChunks && parsed?.proposedItem) {
        const itemResources = parsed.proposedItem.resources ?? [];
        parsed.proposedItem.resources = itemResources;
        const itemSources = parsed.proposedItem.sources ?? [];
        parsed.proposedItem.sources = itemSources;

        grounding.groundingChunks.forEach((chunk: any, idx: number) => {
          if (chunk.web?.uri) {
            const uri = chunk.web.uri;
            const title = chunk.web.title || `Web Datasheet / Reference [${new URL(uri).hostname}]`;
            
            // Check if already in resources
            if (!itemResources.some((r) => r.url === uri)) {
              itemResources.push({
                id: `res-grounding-${idx + 1}`,
                title,
                url: uri,
                type: 'datasheet',
                description: 'Verified web documentation located via Google Search grounding',
              });
            }

            // Check if already in sources
            if (!itemSources.some((s) => s.url === uri)) {
              itemSources.push({
                id: `src-grounding-${idx + 1}`,
                title,
                url: uri,
                authorOrPublisher: new URL(uri).hostname,
                sourceType: 'web_grounding_verified',
                reliability: 'verified_third_party',
                extractedDate: new Date().toISOString().split('T')[0],
                notes: 'Located via live Google Search during hardware lookup',
              });
            }
          }
        });
      }
    } catch (gErr) {
      console.warn('Failed to parse grounding chunks:', gErr);
    }

    // Normalize and generate IDs if needed
    if (parsed.proposedItem) {
      if (!parsed.proposedItem.id) {
        const slug = (parsed.proposedItem.model || parsed.proposedItem.displayName || 'item')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .slice(0, 24);
        parsed.proposedItem.id = `hw-${slug}-${Date.now().toString(36)}`;
      }
      parsed.proposedItem.schemaVersion = '2.0';
      parsed.proposedItem.confirmationStatus = 'proposal_pending_review';
      parsed.proposedItem.createdAt = new Date().toISOString();
      parsed.proposedItem.updatedAt = new Date().toISOString();
      parsed.proposedItem.revisionCount = 0;
      parsed.proposedItem.revisions = [];
      parsed.proposedItem.images = imagesBase64.map((url, i) => ({
        url,
        caption: `Captured photo ${i + 1}`,
        isPrimary: i === 0,
        timestamp: new Date().toISOString(),
      }));
    }

    return parsed;
  } catch (error) {
    console.error('Gemini identification failed:', error);
    // Return gracefully so user input is never lost
    return {
      proposedItem: {
        id: `hw-manual-${Date.now().toString(36)}`,
        schemaVersion: '2.0',
        displayName: knownIdentifiers.name || knownIdentifiers.model || 'Unidentified Hardware Record',
        category: 'Other',
        manufacturer: 'Unknown',
        model: knownIdentifiers.model || '',
        variantRevision: knownIdentifiers.boardRevision || '',
        aliases: [],
        description: description || '',
        tags: [],
        serialNumbers: knownIdentifiers.serialNumber ? [knownIdentifiers.serialNumber] : [],
        barcodes: knownIdentifiers.barcode ? [{ value: knownIdentifiers.barcode }] : [],
        markings: knownIdentifiers.markings ? [{ label: 'User Notes', text: knownIdentifiers.markings }] : [],
        images: imagesBase64.map((url, i) => ({
          url,
          caption: `Photo ${i + 1}`,
          isPrimary: i === 0,
          timestamp: new Date().toISOString(),
        })),
        electrical: { supplyInputs: [], absoluteMaxRatings: [] },
        pinsAndConnectors: [],
        wiredInterfaces: [],
        wireless: [],
        physicalAndFunctional: {},
        softwareAndCompatibility: [],
        sources: [
          {
            id: 'src_user_entry',
            title: 'User Attested Entry',
            sourceType: 'user_attested',
            reliability: 'user_direct',
            extractedDate: new Date().toISOString().split('T')[0],
            notes: 'Created manually or following identification fallback.',
          },
        ],
        resources: knownIdentifiers.documentationUrl
          ? [
              {
                id: 'res-user-1',
                title: 'User Provided Documentation',
                url: knownIdentifiers.documentationUrl,
                type: 'manual',
              },
            ]
          : [],
        customProperties: [],
        confirmationStatus: 'proposal_pending_review',
        revisions: [],
      },
      isExactMatchEstablished: false,
      unresolvedQuestions: [
        'Automatic research could not reach official documentation for this specific revision.',
        'Please verify visible package numbers or printed silkscreen markings manually.',
      ],
      candidateVariants: [],
      existingDuplicatesDetected: [],
      evidenceSources: [],
      rawAnalysisNotes: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function imageSearchCatalogue(params: {
  imageBase64: string;
  existingItems: Array<{
    id: string;
    displayName: string;
    model: string;
    manufacturer: string;
    category: string;
    markings?: string;
  }>;
}): Promise<Array<{
  itemId: string;
  displayName: string;
  similarityScore: number; // 0 - 100
  confidenceLevel: 'High' | 'Moderate' | 'Low';
  visualMatchingFeatures: string[];
  distinguishingDifferences: string[];
  reasoning: string;
}>> {
  const { imageBase64, existingItems } = params;

  if (existingItems.length === 0) {
    return [];
  }

  let cleanData = imageBase64;
  let mimeType = 'image/jpeg';
  if (imageBase64.includes(';base64,')) {
    const parts = imageBase64.split(';base64,');
    mimeType = parts[0].replace('data:', '') || 'image/jpeg';
    cleanData = parts[1];
  }

  const prompt = `
You are analyzing a photo of a hardware component, board, module, or device.
Your job is to compare this photo against the user's saved hardware catalogue items and determine if it visually matches any existing record.

Known Catalogue Records:
${JSON.stringify(
  existingItems.map((item) => ({
    id: item.id,
    name: item.displayName,
    model: item.model,
    manufacturer: item.manufacturer,
    category: item.category,
    markings: item.markings,
  })),
  null,
  2
)}

Examine the image carefully for:
- PCB layout, form factor, color, silkscreen font
- IC package shapes, laser markings, pin counts
- Connectors (USB-C, micro-USB, pin headers, barrel jacks, antenna connectors)
- Distinctive components (crystals, inductors, buttons, LEDs)

Return a JSON array of candidate matches (maximum 5), sorted from highest similarity to lowest:
[
  {
    "itemId": string,
    "displayName": string,
    "similarityScore": number (0 to 100),
    "confidenceLevel": "High" | "Moderate" | "Low",
    "visualMatchingFeatures": string[],
    "distinguishingDifferences": string[],
    "reasoning": string
  }
]

If there are no matches or the photo shows completely different hardware, return an empty array [].
Respond ONLY with valid JSON.
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        {
          inlineData: {
            mimeType,
            data: cleanData,
          },
        },
        { text: prompt },
      ],
    });

    const responseText = response.text || '';
    const cleaned = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
    const result = JSON.parse(cleaned);
    return Array.isArray(result) ? result : [];
  } catch (error) {
    console.error('Image search failed:', error);
    return [];
  }
}

export async function chatWithHardwareGemini(params: {
  messages: Array<{ role: 'user' | 'model'; text: string }>;
  hardwareContext?: HardwareItem | null;
  model?: string;
}): Promise<{ reply: string; modelUsed: string }> {
  const { messages, hardwareContext, model = 'gemini-3.5-flash' } = params;

  let contextSummary = 'No specific component selected; answer general electronics, microcontroller, circuit design, and pinout questions.';

  if (hardwareContext) {
    const item = hardwareContext;
    contextSummary = `
CURRENT DEVICE UNDER TEST / COMPONENT CONTEXT:
- Name: ${item.displayName}
- Manufacturer: ${item.manufacturer || 'Unknown'} | Model: ${item.model || 'Unknown'}
- Category: ${item.category || 'Hardware'} | Variant/Revision: ${item.variantRevision || 'Standard'}
- Description: ${item.description || 'N/A'}
- Supply Rails: ${(item.electrical?.supplyInputs || []).map((s) => `${s.name}: ${s.minVoltage ?? ''}V to ${s.maxVoltage ?? ''}V (typ: ${s.typVoltage ?? ''}V, logic: ${s.logicLevelVoltage ?? ''}V, max ${s.maxCurrentMa ?? 'N/A'}mA). ${s.notes || ''}`).join('; ') || 'Standard logic'}
- Absolute Max Limits: ${(item.electrical?.absoluteMaxRatings || []).map((a) => `${a.parameter}: ${a.value}`).join('; ') || 'Follow datasheet ratings'}
- Pinout & Connectors (${item.pinsAndConnectors?.length || 0} pins mapped):
${(item.pinsAndConnectors || []).map((p) => `  * [Pin ${p.pinOrConnectorId} | Label: ${p.labelPrinted || 'N/A'} | GPIO${p.gpioNumber ?? 'N/A'}]: ${p.primaryFunction || ''} (Alternates: ${(p.alternateFunctions || []).join(', ') || 'None'}) (Restrictions: ${p.restrictions || 'None'})`).join('\n')}
- Wired Interfaces: ${(item.wiredInterfaces || []).map((w) => `${w.type}: ${w.versionOrSpeed || ''}, Addresses: ${(w.defaultAddresses || []).join('/')}, Pins: ${w.connectorOrPins || ''}`).join('; ') || 'N/A'}
- Wireless Capabilities: ${(item.wireless || []).map((wl) => `${wl.protocol} (${wl.standardOrVersion || ''})`).join('; ') || 'N/A'}
- Documentation & Datasheets: ${(item.resources || []).map((r) => `${r.title} (${r.type}): ${r.url}`).join('; ') || 'N/A'}
- Critical Warnings / Gotchas: ${item.notes || ''} ${item.electrical?.summaryNotes || ''}
`;
  }

  const systemInstruction = `You are the Gemini Hardware Engineering Assistant for Matt Millar's workbench.
You are an expert electrical engineer, embedded systems developer, and circuit designer.

${contextSummary}

YOUR MISSION & GUIDELINES:
1. Provide accurate, practical, and safety-conscious circuit design, pinout, wiring, power, firmware, and debugging advice.
2. Ground your answers directly in the structured component specifications provided above, combining them with your deep knowledge of electronics, microcontrollers (ESP32, RP2040, STM32, Arduino, Raspberry Pi, etc.), sensors, power electronics, and bus protocols (I2C, SPI, UART, CAN, USB).
3. Safety First: Always verify and warn about voltage thresholds (e.g. 3.3V vs 5V logic compatibility, level shifting requirements), boot strapping pins that cannot be held low during reset, pull-up resistor needs on open-drain buses, and maximum pin current limits.
4. When providing wiring connections or code (Arduino C++, CircuitPython, MicroPython, ESP-IDF, Rust, Linux), make it complete, well-commented, and specify exact pin numbers and labels.
5. Format your answers cleanly with Markdown, using code blocks with syntax highlighting, bullet points, and concise tables where helpful.`;

  const contents = messages.map((m) => ({
    role: m.role === 'model' ? 'model' : 'user',
    parts: [{ text: m.text }],
  }));

  const selectedModel = model || 'gemini-3.5-flash';
  const modelsToTry = [selectedModel, 'gemini-3.5-flash', 'gemini-3.8-flash'];
  const uniqueModels = Array.from(new Set(modelsToTry));

  let reply = '';
  let modelUsed = selectedModel;
  let lastErr: any = null;

  for (const m of uniqueModels) {
    try {
      const response = await ai.models.generateContent({
        model: m,
        contents,
        config: {
          systemInstruction,
          tools: [{ googleSearch: {} }],
        },
      });

      if (response?.text) {
        reply = response.text;
        modelUsed = m;
        break;
      }
    } catch (err: any) {
      console.warn(`Model ${m} with search failed, trying fallback:`, err?.message);
      lastErr = err;
      try {
        const responseWithoutTools = await ai.models.generateContent({
          model: m,
          contents,
          config: {
            systemInstruction,
          },
        });
        if (responseWithoutTools?.text) {
          reply = responseWithoutTools.text;
          modelUsed = m;
          break;
        }
      } catch (innerErr) {
        console.warn(`Model ${m} without tools also failed:`, innerErr);
      }
    }
  }

  if (!reply) {
    throw lastErr || new Error('Failed to generate response from Gemini models');
  }

  return { reply, modelUsed };
}

