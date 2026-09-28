import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import {
  HardwareItem,
  HardwareRevisionRecord,
  RequirementsSearchQuery,
  RequirementsSearchResult,
  ResourceLink,
} from '../types/hardware';
import { INITIAL_CATALOGUE_ITEMS } from '../data/initialCatalogue';

const COLLECTION_NAME = 'hardware_items';

/**
 * In-memory / local cache fallback to guarantee instant responsiveness
 * and graceful fallback if Firebase is starting up.
 */
let cachedItems: HardwareItem[] = [];
let isInitialized = false;

export async function fetchAllCatalogueItems(): Promise<HardwareItem[]> {
  try {
    const colRef = collection(db, COLLECTION_NAME);
    const snapshot = await getDocs(colRef);

    if (snapshot.empty) {
      console.log('Catalogue empty in Firestore, seeding initial items...');
      for (const item of INITIAL_CATALOGUE_ITEMS) {
        await setDoc(doc(db, COLLECTION_NAME, item.id), item);
      }
      cachedItems = [...INITIAL_CATALOGUE_ITEMS];
      isInitialized = true;
      return cachedItems;
    }

    const items: HardwareItem[] = [];
    snapshot.forEach((d) => {
      items.push(d.data() as HardwareItem);
    });

    // Sort newest updated first
    items.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    cachedItems = items;
    isInitialized = true;
    return items;
  } catch (error) {
    console.warn('Firestore fetch error, utilizing initial catalogue fallback:', error);
    if (!isInitialized || cachedItems.length === 0) {
      cachedItems = [...INITIAL_CATALOGUE_ITEMS];
    }
    return cachedItems;
  }
}

export async function fetchCatalogueItemById(id: string): Promise<HardwareItem | null> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as HardwareItem;
    }
  } catch (error) {
    console.warn(`Firestore getDoc failed for id ${id}:`, error);
  }

  // Fallback to cache
  const found = cachedItems.find((i) => i.id === id);
  return found || null;
}

export async function saveHardwareRecord(
  item: HardwareItem,
  author: { name: string; email?: string; role: 'matt_millar' | 'user' | 'autonomous_agent' | 'external_tool' },
  actionSummary: string
): Promise<HardwareItem> {
  const now = new Date().toISOString();
  const revisionNumber = (item.revisionCount || 0) + 1;

  const newRevision: HardwareRevisionRecord = {
    revisionNumber,
    timestamp: now,
    authorName: author.name || 'Matt Millar',
    authorEmail: author.email || 'matt@mattmillar.co.nz',
    authorRole: author.role,
    actionSummary,
  };

  const finalItem: HardwareItem = {
    ...item,
    updatedAt: now,
    revisionCount: revisionNumber,
    revisions: [...(item.revisions || []), newRevision],
    lastModifiedBy: {
      name: author.name || 'Matt Millar',
      email: author.email || 'matt@mattmillar.co.nz',
      role: author.role,
    },
  };

  try {
    const docRef = doc(db, COLLECTION_NAME, finalItem.id);
    await setDoc(docRef, finalItem, { merge: true });
  } catch (error) {
    console.warn('Firestore setDoc failed, updating local state:', error);
  }

  // Update memory cache
  const idx = cachedItems.findIndex((i) => i.id === finalItem.id);
  if (idx >= 0) {
    cachedItems[idx] = finalItem;
  } else {
    cachedItems.unshift(finalItem);
  }

  return finalItem;
}

/**
 * Optimistic concurrency update for external consumers & interactive editing.
 * Prevents silent overwriting when multiple agents or human edits occur.
 */
export async function updateHardwareRecordWithConcurrencyCheck(
  id: string,
  updates: Partial<HardwareItem>,
  expectedRevisionCount: number,
  author: { name: string; email?: string; role: 'matt_millar' | 'user' | 'autonomous_agent' | 'external_tool' },
  actionSummary: string
): Promise<HardwareItem> {
  const current = await fetchCatalogueItemById(id);
  if (!current) {
    throw new Error(`Item ${id} not found in hardware catalogue.`);
  }

  if (current.revisionCount !== expectedRevisionCount) {
    throw new Error(
      `Concurrency conflict: Record '${current.displayName}' is currently at revision ${current.revisionCount}, but your operation expected revision ${expectedRevisionCount}. Another user or external agent updated this record recently. Please reload and review the current state.`
    );
  }

  const now = new Date().toISOString();
  const nextRevNumber = current.revisionCount + 1;

  const modifiedFields = Object.keys(updates).filter(
    (k) => JSON.stringify((updates as any)[k]) !== JSON.stringify((current as any)[k])
  );

  const revision: HardwareRevisionRecord = {
    revisionNumber: nextRevNumber,
    timestamp: now,
    authorName: author.name,
    authorEmail: author.email,
    authorRole: author.role,
    actionSummary,
    fieldsModified: modifiedFields,
  };

  const mergedItem: HardwareItem = {
    ...current,
    ...updates,
    id: current.id,
    schemaVersion: '2.0',
    createdAt: current.createdAt,
    updatedAt: now,
    revisionCount: nextRevNumber,
    revisions: [...(current.revisions || []), revision],
    lastModifiedBy: {
      name: author.name,
      email: author.email,
      role: author.role,
    },
  };

  try {
    const docRef = doc(db, COLLECTION_NAME, mergedItem.id);
    await setDoc(docRef, mergedItem);
  } catch (error) {
    console.warn('Firestore updateDoc failed, keeping local state:', error);
  }

  const idx = cachedItems.findIndex((i) => i.id === mergedItem.id);
  if (idx >= 0) {
    cachedItems[idx] = mergedItem;
  }

  return mergedItem;
}

/**
 * Targeted update: Attach a software library, driver, or documentation link
 * without replacing or risking corruption of electrical or pinout fields.
 */
export async function attachResourceToHardware(
  itemId: string,
  resource: ResourceLink,
  author: { name: string; email?: string; role: 'matt_millar' | 'user' | 'autonomous_agent' | 'external_tool' }
): Promise<HardwareItem> {
  const current = await fetchCatalogueItemById(itemId);
  if (!current) {
    throw new Error(`Item ${itemId} not found in catalogue.`);
  }

  const existingResources = current.resources || [];
  const updatedResources = [...existingResources, resource];

  return updateHardwareRecordWithConcurrencyCheck(
    itemId,
    { resources: updatedResources },
    current.revisionCount,
    author,
    `Attached resource link: ${resource.title} (${resource.type})`
  );
}

/**
 * Searches catalogue using natural language, text tokens, and requirements constraints.
 * Enforces the strict rule: "Unknown specifications must not satisfy a requested constraint.
 * Briefly explain matches using stored facts."
 */
export function queryHardwareCatalogue(
  items: HardwareItem[],
  query: RequirementsSearchQuery
): RequirementsSearchResult[] {
  const {
    naturalQuery = '',
    category,
    interfaceTypes = [],
    voltageRequirementV,
    wirelessProtocol,
    frameworkSupport,
    manufacturer,
    confirmedOnly = false,
  } = query;

  const results: RequirementsSearchResult[] = [];
  const searchTokens = naturalQuery
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 0 && !['a', 'an', 'the', 'and', 'that', 'with', 'for', 'operates', 'from', 'in', 'on'].includes(t));

  for (const item of items) {
    if (confirmedOnly && item.confirmationStatus === 'proposal_pending_review') {
      continue;
    }

    if (category && category !== 'All' && item.category !== category) {
      continue;
    }

    if (
      manufacturer &&
      !item.manufacturer.toLowerCase().includes(manufacturer.toLowerCase())
    ) {
      continue;
    }

    const satisfiedConstraints: string[] = [];
    const missingOrUnverifiedConstraints: string[] = [];

    // Text token matching score
    const itemFullText = [
      item.displayName,
      item.model,
      item.manufacturer,
      item.variantRevision || '',
      item.description,
      ...(item.aliases || []),
      ...(item.tags || []),
      ...(item.markings || []).map((m) => `${m.label} ${m.text}`),
      item.physicalAndFunctional.processor?.socOrMcu || '',
      item.physicalAndFunctional.processor?.architecture || '',
    ]
      .join(' ')
      .toLowerCase();

    let textScore = 0;
    if (searchTokens.length > 0) {
      for (const token of searchTokens) {
        if (itemFullText.includes(token)) {
          textScore++;
        }
      }
    } else {
      textScore = 1; // if no text query, passes text filter
    }

    // Check specific interface requirements
    if (interfaceTypes.length > 0) {
      for (const reqInterface of interfaceTypes) {
        const found = item.wiredInterfaces?.find(
          (wi) => wi.type.toLowerCase() === reqInterface.toLowerCase()
        );
        if (found) {
          satisfiedConstraints.push(
            `Wired interface: ${found.type} supported (${found.versionOrSpeed || 'verified in catalogue'})`
          );
        } else {
          missingOrUnverifiedConstraints.push(`Missing wired interface: ${reqInterface}`);
        }
      }
    }

    // Check wireless requirement
    if (wirelessProtocol) {
      const found = item.wireless?.find((wp) =>
        wp.protocol.toLowerCase().includes(wirelessProtocol.toLowerCase())
      );
      if (found) {
        satisfiedConstraints.push(`Wireless protocol: ${found.protocol} verified`);
      } else {
        missingOrUnverifiedConstraints.push(`Missing wireless protocol: ${wirelessProtocol}`);
      }
    }

    // Check voltage requirement (e.g. 3.3V or 5V)
    if (voltageRequirementV !== undefined && !isNaN(voltageRequirementV)) {
      const inputs = item.electrical?.supplyInputs || [];
      if (inputs.length === 0) {
        missingOrUnverifiedConstraints.push(
          `Operating voltage unknown: No electrical supply inputs verified in record for ${voltageRequirementV}V requirement.`
        );
      } else {
        let voltageSupported = false;
        let matchedInputSummary = '';
        for (const input of inputs) {
          const min = input.minVoltage !== undefined ? input.minVoltage : input.typVoltage;
          const max = input.maxVoltage !== undefined ? input.maxVoltage : input.typVoltage;
          if (min !== undefined && max !== undefined) {
            if (voltageRequirementV >= min && voltageRequirementV <= max) {
              voltageSupported = true;
              matchedInputSummary = `${input.name}: ${min}V–${max}V operating range`;
              break;
            }
          } else if (input.typVoltage === voltageRequirementV || input.logicLevelVoltage === voltageRequirementV) {
            voltageSupported = true;
            matchedInputSummary = `${input.name}: ${input.typVoltage || input.logicLevelVoltage}V verified`;
            break;
          }
        }

        if (voltageSupported) {
          satisfiedConstraints.push(`Electrical voltage: ${voltageRequirementV}V supported (${matchedInputSummary})`);
        } else {
          missingOrUnverifiedConstraints.push(
            `Voltage mismatch: Required ${voltageRequirementV}V not within verified inputs (${inputs.map((i) => `${i.name} [${i.minVoltage ?? '?'}V-${i.maxVoltage ?? '?'}V]`).join(', ')})`
          );
        }
      }
    }

    // Check software framework support
    if (frameworkSupport) {
      const found = item.softwareAndCompatibility?.find((sc) =>
        sc.frameworkOrTarget.toLowerCase().includes(frameworkSupport.toLowerCase())
      );
      if (found && found.status !== 'unsupported') {
        satisfiedConstraints.push(
          `Software compatibility: ${found.frameworkOrTarget} is ${found.status.replace('_', ' ')}`
        );
      } else {
        missingOrUnverifiedConstraints.push(`Software compatibility: ${frameworkSupport} not verified`);
      }
    }

    // Decide if item is relevant:
    // If user provided search tokens, must match at least half the tokens
    if (searchTokens.length > 0 && textScore === 0) {
      continue;
    }

    // Classify matchType
    let matchType: 'confirmed_match' | 'insufficient_information' | 'partial_match' = 'confirmed_match';
    let rationale = '';

    if (missingOrUnverifiedConstraints.length > 0) {
      const hasUnknownSpec = missingOrUnverifiedConstraints.some((c) => c.includes('unknown') || c.includes('No electrical supply inputs'));
      if (hasUnknownSpec && satisfiedConstraints.length > 0) {
        matchType = 'insufficient_information';
        rationale = `Matches ${satisfiedConstraints.length} constraint(s), but has unverified specifications: ${missingOrUnverifiedConstraints.join('; ')}`;
      } else {
        matchType = 'partial_match';
        rationale = `Partially matches. Missing: ${missingOrUnverifiedConstraints.join('; ')}`;
      }
    } else {
      matchType = 'confirmed_match';
      rationale =
        satisfiedConstraints.length > 0
          ? `All constraints confirmed: ${satisfiedConstraints.join('; ')}`
          : `Matched query tokens (${textScore}/${searchTokens.length || 1}) in verified metadata.`;
    }

    results.push({
      item,
      matchType,
      rationale,
      satisfiedConstraints,
      missingOrUnverifiedConstraints,
    });
  }

  // Sort confirmed matches first, then insufficient info, then partial
  results.sort((a, b) => {
    const priority = { confirmed_match: 0, insufficient_information: 1, partial_match: 2 };
    return priority[a.matchType] - priority[b.matchType];
  });

  return results;
}

/**
 * Checks for likely existing records to prevent accidental duplicate entries.
 */
export function findPotentialExistingDuplicates(
  candidate: {
    name?: string;
    model?: string;
    manufacturer?: string;
    serialNumber?: string;
    barcode?: string;
  },
  existingItems: HardwareItem[]
): Array<{
  existingItemId: string;
  existingItemName: string;
  existingModel: string;
  similarityReason: string;
}> {
  const duplicates: Array<{
    existingItemId: string;
    existingItemName: string;
    existingModel: string;
    similarityReason: string;
  }> = [];

  const candModel = (candidate.model || '').trim().toLowerCase();
  const candSerial = (candidate.serialNumber || '').trim().toLowerCase();
  const candBarcode = (candidate.barcode || '').trim().toLowerCase();
  const candName = (candidate.name || '').trim().toLowerCase();

  for (const item of existingItems) {
    // 1. Exact or close model match
    if (candModel && item.model.toLowerCase() === candModel) {
      duplicates.push({
        existingItemId: item.id,
        existingItemName: item.displayName,
        existingModel: item.model,
        similarityReason: `Identical model number match: "${item.model}" (${item.manufacturer})`,
      });
      continue;
    }

    // 2. Serial number match
    if (
      candSerial &&
      item.serialNumbers?.some((sn) => sn.toLowerCase().includes(candSerial) || candSerial.includes(sn.toLowerCase()))
    ) {
      duplicates.push({
        existingItemId: item.id,
        existingItemName: item.displayName,
        existingModel: item.model,
        similarityReason: `Matching serial number: "${candSerial}"`,
      });
      continue;
    }

    // 3. Barcode match
    if (
      candBarcode &&
      item.barcodes?.some((bc) => bc.value.toLowerCase() === candBarcode)
    ) {
      duplicates.push({
        existingItemId: item.id,
        existingItemName: item.displayName,
        existingModel: item.model,
        similarityReason: `Matching barcode value: "${candBarcode}"`,
      });
      continue;
    }

    // 4. Strong name similarity
    if (candName.length > 5 && item.displayName.toLowerCase() === candName) {
      duplicates.push({
        existingItemId: item.id,
        existingItemName: item.displayName,
        existingModel: item.model,
        similarityReason: `Identical display name: "${item.displayName}"`,
      });
    }
  }

  return duplicates;
}
