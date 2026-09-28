/**
 * Matt Millar Hardware Catalogue - Data Models & Types
 * Schema Version: 2.0
 * 
 * Complies with evidence-grounded hardware specifications:
 * - Structured, typed technical metadata
 * - Attribution of claims to specific evidence sources
 * - Clear distinction between manufacturer, third-party, and user-attested data
 * - Support for diverse hardware (computers, sensors, boards, displays, drones, passives)
 * - Revision tracking and concurrency control for external agents
 */

export type SourceType =
  | 'manufacturer_datasheet'
  | 'manufacturer_manual'
  | 'schematic_or_board_layout'
  | 'third_party_documentation'
  | 'user_attested'
  | 'web_grounding_verified';

export type ReliabilityLevel =
  | 'primary_manufacturer'
  | 'verified_third_party'
  | 'user_direct'
  | 'unverified_ai_lead';

export interface EvidenceSource {
  id: string; // e.g. "src_1", "src_mfg_datasheet"
  title: string;
  url?: string;
  authorOrPublisher?: string;
  sourceType: SourceType;
  reliability: ReliabilityLevel;
  extractedDate: string;
  notes?: string;
}

export interface SupplyInput {
  name: string; // e.g. "VCC", "VIN", "USB Type-C", "3.3V Pin", "Barrel Jack"
  minVoltage?: number;
  maxVoltage?: number;
  typVoltage?: number;
  voltageUnit: 'V' | 'mV';
  logicLevelVoltage?: number; // e.g. 3.3 or 5
  operatingCurrentMa?: number;
  maxCurrentMa?: number;
  notes?: string;
  isAbsoluteMax?: boolean;
  evidenceSourceId?: string;
}

export interface AbsoluteMaxRating {
  parameter: string; // e.g. "V_IN max to GND", "Operating Temperature", "ESD rating"
  value: string; // e.g. "6.0 V", "-40°C to +85°C", "2kV HBM"
  evidenceSourceId?: string;
}

export interface ElectricalSpecs {
  supplyInputs: SupplyInput[];
  absoluteMaxRatings: AbsoluteMaxRating[];
  summaryNotes?: string;
}

export interface PinOrConnector {
  pinOrConnectorId: string; // e.g. "Pin 1", "J1-4", "GPIO21", "USB-C", "SMA-1"
  physicalType: string; // e.g. "2.54mm Header pin", "USB Type-C receptacle", "JST-SH 4-pin", "Castellated pad"
  labelPrinted?: string; // e.g. "SDA", "IO21", "D4"
  gpioNumber?: number;
  primaryFunction?: string; // e.g. "I2C SDA", "Power Input", "UART0 TX"
  alternateFunctions?: string[]; // e.g. ["PWM_CH2", "ADC1_CH4", "SPI_MOSI"]
  restrictions?: string; // e.g. "Not 5V tolerant", "Bootstrap pin (must be HIGH at boot)"
  evidenceSourceId?: string;
}

export interface WiredInterface {
  type: 'I2C' | 'SPI' | 'UART' | 'USB' | 'HDMI' | 'CAN' | 'Ethernet' | '1-Wire' | 'SWD' | 'JTAG' | 'PCIe' | 'MIPI-CSI' | 'MIPI-DSI' | 'Audio' | 'Other';
  versionOrSpeed?: string; // e.g. "Standard (100kHz) / Fast (400kHz)", "USB 2.0 High-Speed", "100BASE-TX"
  busRole?: 'Controller/Master' | 'Target/Peripheral' | 'Both' | 'Host' | 'Device';
  defaultAddresses?: string[]; // e.g. ["0x68", "0x77"]
  connectorOrPins?: string; // e.g. "Pins 3 (SDA), 5 (SCL)"
  restrictions?: string;
  evidenceSourceId?: string;
}

export interface WirelessProtocol {
  protocol: 'Wi-Fi' | 'Bluetooth Classic' | 'BLE' | 'LoRa' | 'NFC' | 'Zigbee' | 'Sub-1GHz' | 'GPS/GNSS' | 'Cellular' | 'Other';
  standardOrVersion?: string; // e.g. "802.11 b/g/n (Wi-Fi 4)", "Bluetooth 5.0", "ISO/IEC 14443 Type A"
  frequencyBands?: string[]; // e.g. ["2.4 GHz", "868 MHz", "13.56 MHz"]
  rolesOrProfiles?: string[]; // e.g. ["Station", "SoftAP", "GATT Client", "NFC Tag Type 4"]
  antennaType?: string; // e.g. "Onboard PCB antenna", "U.FL connector", "External SMA"
  evidenceSourceId?: string;
}

export interface PhysicalFunctionalSpecs {
  dimensions?: {
    lengthMm?: number;
    widthMm?: number;
    heightMm?: number;
    weightGrams?: number;
  };
  formFactor?: string; // e.g. "Adafruit Feather", "Arduino Uno R3", "DIP-28", "QFN-32", "Raspberry Pi HAT"
  processor?: {
    socOrMcu?: string; // e.g. "ESP32-S3", "RP2040", "Broadcom BCM2712"
    architecture?: string; // e.g. "Dual Xtensa LX7", "Dual ARM Cortex-M0+", "Quad Cortex-A76"
    clockSpeedMhz?: number;
    coreCount?: number;
  };
  memory?: {
    flash?: string; // e.g. "16 MB", "2 MB SPI Flash"
    ram?: string; // e.g. "8 MB PSRAM + 512 KB SRAM"
    eeprom?: string;
  };
  sensors?: Array<{
    type: string; // e.g. "Barometric pressure", "Temperature", "6-Axis IMU"
    range?: string; // e.g. "300 to 1100 hPa", "-40°C to +85°C"
    accuracy?: string; // e.g. "±1 hPa", "±0.5°C"
  }>;
  display?: {
    type?: string; // e.g. "IPS TFT", "OLED", "E-Paper"
    resolution?: string; // e.g. "320x240", "128x64"
    controllerIc?: string; // e.g. "ST7789V", "SSD1306"
    touchSupport?: boolean;
  };
  camera?: {
    sensor?: string; // e.g. "OV5640", "Sony IMX708"
    resolution?: string; // e.g. "5 MP", "12 MP"
    frameRate?: string;
  };
  evidenceSourceId?: string;
}

export interface SoftwareCompatibility {
  frameworkOrTarget: string; // e.g. "Arduino Core", "ESP-IDF", "CircuitPython", "MicroPython", "Raspberry Pi OS / Linux", "Zephyr"
  status: 'manufacturer_supported' | 'community_supported' | 'user_attested' | 'unsupported' | 'unverified';
  driverOrLibraryUrl?: string;
  firmwareRequirement?: string;
  compatibilityConditions?: string; // e.g. "Requires kernel >= 6.1", "Requires I2C pullups enabled"
  evidenceSourceId?: string;
}

export interface ResourceLink {
  id: string;
  title: string;
  url: string;
  type:
    | 'datasheet'
    | 'manual'
    | 'schematic'
    | 'driver'
    | 'software_library'
    | 'github_repo'
    | 'example_code'
    | 'pinout_diagram'
    | 'personal_project'
    | 'other';
  description?: string;
  versionOrRevision?: string;
  addedBy?: string;
  addedAt?: string;
  evidenceSourceId?: string;
}

export interface CustomProperty {
  id: string;
  key: string;
  value: string;
  unit?: string;
  notes?: string;
  evidenceSourceId?: string;
}

export interface HardwareRevisionRecord {
  revisionNumber: number;
  timestamp: string; // ISO 8601
  authorName: string;
  authorEmail?: string;
  authorRole: 'matt_millar' | 'user' | 'autonomous_agent' | 'external_tool';
  actionSummary: string; // e.g. "Initial identification via photo", "Attached Arduino library"
  fieldsModified?: string[];
  diffSummary?: string;
}

export interface ConflictingClaim {
  field: string;
  claimA: string;
  sourceA: string;
  claimB: string;
  sourceB: string;
  notes?: string;
}

export interface HardwareItem {
  id: string;
  schemaVersion: '2.0';
  createdAt: string;
  updatedAt: string;
  revisionCount: number;

  // Primary identifiers
  displayName: string;
  category: string; // 'Microcontroller' | 'SBC' | 'Sensor' | 'Display' | 'Power' | 'Radio/Wireless' | 'Interface' | 'Motor/Driver' | 'Automotive/Drone' | 'Other'
  manufacturer: string;
  model: string;
  variantRevision?: string;
  aliases: string[];
  description: string;
  tags: string[];

  // Unit specific & physical markings
  serialNumbers?: string[];
  barcodes?: Array<{ format?: string; value: string; rawText?: string }>;
  markings: Array<{ label: string; text: string; location?: string; evidenceSourceId?: string }>;
  images: Array<{
    url: string;
    caption?: string;
    isPrimary?: boolean;
    timestamp?: string;
  }>;

  // Structured technical metadata
  electrical: ElectricalSpecs;
  pinsAndConnectors: PinOrConnector[];
  wiredInterfaces: WiredInterface[];
  wireless: WirelessProtocol[];
  physicalAndFunctional: PhysicalFunctionalSpecs;
  softwareAndCompatibility: SoftwareCompatibility[];

  // Evidence, sources & documentation
  sources: EvidenceSource[];
  resources: ResourceLink[];

  // Extensibility
  customProperties: CustomProperty[];
  notes?: string;

  // Status & verification
  confirmationStatus: 'confirmed' | 'partial_confirmed' | 'proposal_pending_review';
  candidateMatches?: Array<{ name: string; model: string; manufacturer: string; reason: string }>;
  unresolvedQuestions?: string[];
  conflictingClaims?: ConflictingClaim[];

  // Provenance & Audit
  revisions: HardwareRevisionRecord[];
  lastModifiedBy: {
    name: string;
    email?: string;
    role: 'matt_millar' | 'user' | 'autonomous_agent' | 'external_tool';
  };
}

// Identification Request/Response
export interface IdentifyHardwareRequest {
  imagesBase64?: string[]; // array of base64 data URLs
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
}

export interface IdentifyHardwareResponse {
  proposedItem: Partial<HardwareItem>;
  isExactMatchEstablished: boolean;
  unresolvedQuestions: string[];
  candidateVariants: Array<{
    name: string;
    model: string;
    manufacturer: string;
    reason: string;
    missingEvidence: string;
  }>;
  existingDuplicatesDetected: Array<{
    existingItemId: string;
    existingItemName: string;
    existingModel: string;
    similarityReason: string;
  }>;
  evidenceSources: EvidenceSource[];
  rawAnalysisNotes?: string;
}

// Requirements Search Query
export interface RequirementsSearchQuery {
  naturalQuery?: string;
  category?: string;
  interfaceTypes?: string[];
  voltageRequirementV?: number;
  wirelessProtocol?: string;
  frameworkSupport?: string;
  manufacturer?: string;
  confirmedOnly?: boolean;
}

export interface RequirementsSearchResult {
  item: HardwareItem;
  matchType: 'confirmed_match' | 'insufficient_information' | 'partial_match';
  rationale: string;
  satisfiedConstraints: string[];
  missingOrUnverifiedConstraints: string[];
}
