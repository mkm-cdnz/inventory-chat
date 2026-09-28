import {
  IdentifyHardwareRequest,
  IdentifyHardwareResponse,
  HardwareItem,
} from '../types/hardware';

export async function identifyHardwareWithAI(
  request: IdentifyHardwareRequest,
  existingItems: HardwareItem[]
): Promise<IdentifyHardwareResponse> {
  const existingSummary = existingItems.map((i) => ({
    id: i.id,
    name: i.displayName,
    model: i.model,
    manufacturer: i.manufacturer,
  }));

  const response = await fetch('/api/v1/identify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      imagesBase64: request.imagesBase64,
      description: request.description,
      knownIdentifiers: request.knownIdentifiers,
      existingCatalogueSummary: existingSummary,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.details || errorData.error || `Server responded with ${response.status}`);
  }

  return response.json();
}

export async function searchByImageWithAI(
  imageBase64: string,
  existingItems: HardwareItem[]
): Promise<Array<{
  itemId: string;
  displayName: string;
  similarityScore: number;
  confidenceLevel: 'High' | 'Moderate' | 'Low';
  visualMatchingFeatures: string[];
  distinguishingDifferences: string[];
  reasoning: string;
}>> {
  const existingSummary = existingItems.map((item) => ({
    id: item.id,
    displayName: item.displayName,
    model: item.model,
    manufacturer: item.manufacturer,
    category: item.category,
    markings: item.markings?.map((m) => `${m.label}: ${m.text}`).join('; '),
  }));

  const response = await fetch('/api/v1/image-search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      imageBase64,
      existingItems: existingSummary,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.details || errorData.error || `Server responded with ${response.status}`);
  }

  const data = await response.json();
  return data.matches || [];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  modelUsed?: string;
}

export async function sendHardwareChatMessage(params: {
  messages: Array<{ role: 'user' | 'model'; text: string }>;
  hardwareContext?: HardwareItem | null;
  model?: string;
}): Promise<{ reply: string; modelUsed: string }> {
  const response = await fetch('/api/v1/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.details || errorData.error || `Chat error: ${response.status}`);
  }

  return response.json();
}

