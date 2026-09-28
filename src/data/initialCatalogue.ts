import { HardwareItem } from '../types/hardware';

export const INITIAL_CATALOGUE_ITEMS: HardwareItem[] = [
  {
    id: 'hw-bme280-breakout',
    schemaVersion: '2.0',
    createdAt: '2026-08-15T09:30:00Z',
    updatedAt: '2026-09-20T14:22:00Z',
    revisionCount: 2,
    displayName: 'Bosch BME280 Environmental Sensor Breakout',
    category: 'Sensor',
    manufacturer: 'Bosch Sensortec / Generic Adafruit-style Breakout',
    model: 'BME280',
    variantRevision: 'Rev B (3.3V/5V LDO & Level Shifter)',
    aliases: ['BME-280', 'GY-BME280', 'Temp/Humidity/Pressure Breakout'],
    description: 'Precision digital combined sensor for relative humidity, barometric pressure, and ambient temperature with onboard 3.3V regulator and I2C/SPI level shifting.',
    tags: ['environmental', 'weather', 'i2c', 'spi', 'temperature', 'pressure', 'humidity'],
    serialNumbers: [],
    barcodes: [
      { format: 'CODE128', value: 'BME280-BRK-V2' }
    ],
    markings: [
      { label: 'IC Laser Marking', text: 'UP (Bosch BME280 package identifier)', location: 'Center sensor metal lid', evidenceSourceId: 'src_bosch_ds' },
      { label: 'PCB Silkscreen', text: 'VIN 3Vo GND SCK SDO SDI CS', location: 'Bottom header row', evidenceSourceId: 'src_mfg_schematic' }
    ],
    images: [
      {
        url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
        caption: 'Top view of BME280 purple breakout PCB showing sensor metal lid and level-shift transistors',
        isPrimary: true,
        timestamp: '2026-08-15T09:28:00Z'
      }
    ],
    electrical: {
      supplyInputs: [
        {
          name: 'VIN (Breakout header with onboard LDO)',
          minVoltage: 3.0,
          maxVoltage: 5.5,
          typVoltage: 3.3,
          voltageUnit: 'V',
          logicLevelVoltage: 3.3,
          operatingCurrentMa: 0.0036, // 3.6 uA typical at 1 Hz humidity and temperature
          maxCurrentMa: 0.7,
          notes: 'Safe for direct 5V Arduino or 3.3V Raspberry Pi/ESP32 supply via onboard AP2112K regulator.',
          isAbsoluteMax: false,
          evidenceSourceId: 'src_breakout_manual'
        },
        {
          name: 'Bare BME280 IC Supply (VDD / VDDIO)',
          minVoltage: 1.71,
          maxVoltage: 3.6,
          typVoltage: 3.3,
          voltageUnit: 'V',
          logicLevelVoltage: 3.3,
          notes: 'Raw IC pads directly before regulator. Exceeding 3.6V directly on sensor IC destroys silicon.',
          isAbsoluteMax: false,
          evidenceSourceId: 'src_bosch_ds'
        }
      ],
      absoluteMaxRatings: [
        { parameter: 'VDD / VDDIO direct supply', value: '4.25 V max', evidenceSourceId: 'src_bosch_ds' },
        { parameter: 'Voltage on any IC pin', value: '-0.3 V to VDDIO + 0.3 V', evidenceSourceId: 'src_bosch_ds' },
        { parameter: 'Operating Temperature', value: '-40°C to +85°C', evidenceSourceId: 'src_bosch_ds' },
        { parameter: 'Operating Pressure Range', value: '300 to 1100 hPa', evidenceSourceId: 'src_bosch_ds' }
      ],
      summaryNotes: 'Module features dual BSS138 FETs with 10k pull-ups for bidirectional level conversion.'
    },
    pinsAndConnectors: [
      { pinOrConnectorId: 'VIN', physicalType: '2.54mm pitch header', labelPrinted: 'VIN', primaryFunction: 'Power Input (3.0V - 5.5V)', evidenceSourceId: 'src_mfg_schematic' },
      { pinOrConnectorId: '3Vo', physicalType: '2.54mm pitch header', labelPrinted: '3Vo', primaryFunction: 'Regulated 3.3V Output (up to 50mA)', restrictions: 'Do not connect to external supply', evidenceSourceId: 'src_mfg_schematic' },
      { pinOrConnectorId: 'GND', physicalType: '2.54mm pitch header', labelPrinted: 'GND', primaryFunction: 'Common Ground', evidenceSourceId: 'src_mfg_schematic' },
      { pinOrConnectorId: 'SCK', physicalType: '2.54mm pitch header', labelPrinted: 'SCK', primaryFunction: 'I2C SCL / SPI Clock', alternateFunctions: ['SPI SCLK'], evidenceSourceId: 'src_mfg_schematic' },
      { pinOrConnectorId: 'SDO', physicalType: '2.54mm pitch header', labelPrinted: 'SDO', primaryFunction: 'SPI MISO / I2C Address select', restrictions: 'Pull to GND for 0x76, pull to 3.3V for 0x77', evidenceSourceId: 'src_bosch_ds' },
      { pinOrConnectorId: 'SDI', physicalType: '2.54mm pitch header', labelPrinted: 'SDI', primaryFunction: 'I2C SDA / SPI MOSI', alternateFunctions: ['SPI MOSI'], evidenceSourceId: 'src_mfg_schematic' },
      { pinOrConnectorId: 'CS', physicalType: '2.54mm pitch header', labelPrinted: 'CS', primaryFunction: 'SPI Chip Select', restrictions: 'Must be HIGH or left floating for I2C mode', evidenceSourceId: 'src_bosch_ds' }
    ],
    wiredInterfaces: [
      {
        type: 'I2C',
        versionOrSpeed: 'Standard Mode (100 kHz), Fast Mode (400 kHz), Fast Mode Plus (1.0 MHz)',
        busRole: 'Target/Peripheral',
        defaultAddresses: ['0x76', '0x77'],
        connectorOrPins: 'SDI (SDA), SCK (SCL), SDO (ADDR)',
        restrictions: 'Default address is 0x76 when SDO pin is grounded; 0x77 when tied to 3Vo.',
        evidenceSourceId: 'src_bosch_ds'
      },
      {
        type: 'SPI',
        versionOrSpeed: '3-wire and 4-wire SPI up to 10 MHz',
        busRole: 'Target/Peripheral',
        connectorOrPins: 'SCK (Clock), SDI (MOSI), SDO (MISO), CS (Active LOW)',
        restrictions: 'Pull CS LOW before clocking data.',
        evidenceSourceId: 'src_bosch_ds'
      }
    ],
    wireless: [],
    physicalAndFunctional: {
      dimensions: { lengthMm: 19.2, widthMm: 17.8, heightMm: 3.1, weightGrams: 1.8 },
      formFactor: 'Compact Breakout PCB',
      sensors: [
        { type: 'Relative Humidity', range: '0% to 100% RH', accuracy: '±3% RH tolerance' },
        { type: 'Ambient Temperature', range: '-40°C to +85°C', accuracy: '±0.5°C at 25°C, ±1.0°C over full range' },
        { type: 'Barometric Air Pressure', range: '300 to 1100 hPa', accuracy: '±1.0 hPa absolute, ±0.12 hPa relative' }
      ],
      evidenceSourceId: 'src_bosch_ds'
    },
    softwareAndCompatibility: [
      {
        frameworkOrTarget: 'Arduino (Adafruit_BME280 Library)',
        status: 'manufacturer_supported',
        driverOrLibraryUrl: 'https://github.com/adafruit/Adafruit_BME280_Library',
        compatibilityConditions: 'Requires Adafruit_Sensor base library dependency.',
        evidenceSourceId: 'src_lib_adafruit'
      },
      {
        frameworkOrTarget: 'Linux / Raspberry Pi (Kernel IIO driver bmp280)',
        status: 'manufacturer_supported',
        driverOrLibraryUrl: 'https://github.com/torvalds/linux/blob/master/drivers/iio/pressure/bmp280-core.c',
        compatibilityConditions: 'Available natively in Linux kernel drivers/iio/pressure/bmp280.c. Add dtoverlay=i2c-sensor,bme280 in config.txt.',
        evidenceSourceId: 'src_kernel_iio'
      },
      {
        frameworkOrTarget: 'CircuitPython',
        status: 'community_supported',
        driverOrLibraryUrl: 'https://github.com/adafruit/Adafruit_CircuitPython_BME280',
        evidenceSourceId: 'src_lib_adafruit'
      }
    ],
    sources: [
      {
        id: 'src_bosch_ds',
        title: 'Bosch Sensortec BME280 Combined Sensor Datasheet BST-BME280-DS002',
        url: 'https://www.bosch-sensortec.com/media/boschsensortec/downloads/datasheets/bst-bme280-ds002.pdf',
        authorOrPublisher: 'Bosch Sensortec GmbH',
        sourceType: 'manufacturer_datasheet',
        reliability: 'primary_manufacturer',
        extractedDate: '2026-08-15',
        notes: 'Covers silicon limits, register maps, and compensation formulas.'
      },
      {
        id: 'src_mfg_schematic',
        title: 'BME280 Breakout Schematic & Pinout Guide',
        url: 'https://learn.adafruit.com/adafruit-bme280-humidity-barometric-pressure-temperature-sensor-breakout/pinouts',
        authorOrPublisher: 'Adafruit Industries',
        sourceType: 'schematic_or_board_layout',
        reliability: 'verified_third_party',
        extractedDate: '2026-08-15'
      },
      {
        id: 'src_lib_adafruit',
        title: 'Adafruit BME280 Library GitHub Repository',
        url: 'https://github.com/adafruit/Adafruit_BME280_Library',
        authorOrPublisher: 'Adafruit',
        sourceType: 'third_party_documentation',
        reliability: 'verified_third_party',
        extractedDate: '2026-08-15'
      },
      {
        id: 'src_kernel_iio',
        title: 'Linux Kernel Industrial I/O Driver for BMP280/BME280',
        url: 'https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/tree/drivers/iio/pressure/bmp280-core.c',
        authorOrPublisher: 'Linux Foundation',
        sourceType: 'third_party_documentation',
        reliability: 'verified_third_party',
        extractedDate: '2026-09-01'
      }
    ],
    resources: [
      {
        id: 'res-ds-1',
        title: 'BME280 Official Datasheet PDF',
        url: 'https://www.bosch-sensortec.com/media/boschsensortec/downloads/datasheets/bst-bme280-ds002.pdf',
        type: 'datasheet',
        description: 'Complete electrical specifications, I2C/SPI timing, calibration register calculations',
        versionOrRevision: 'Revision 1.25'
      },
      {
        id: 'res-repo-1',
        title: 'Adafruit_BME280 Arduino Driver',
        url: 'https://github.com/adafruit/Adafruit_BME280_Library',
        type: 'software_library',
        description: 'Standard C++ driver with integer and floating point math routines',
        versionOrRevision: 'v2.2.4'
      }
    ],
    customProperties: [
      { id: 'prop-1', key: 'Calibration Register Offset', value: '0x88 to 0xA1 and 0xE1 to 0xF0', notes: 'Factory programmed into NVM' },
      { id: 'prop-2', key: 'Default I2C Address with SDO Low', value: '0x76' }
    ],
    notes: 'Verified working with ESP32-S3 and Raspberry Pi 5. Requires calibration coefficients read at startup.',
    confirmationStatus: 'confirmed',
    revisions: [
      {
        revisionNumber: 1,
        timestamp: '2026-08-15T09:30:00Z',
        authorName: 'Matt Millar',
        authorEmail: 'matt@mattmillar.co.nz',
        authorRole: 'matt_millar',
        actionSummary: 'Initial photo capture and evidence population from Bosch datasheet'
      },
      {
        revisionNumber: 2,
        timestamp: '2026-09-20T14:22:00Z',
        authorName: 'Matt Millar',
        authorEmail: 'matt@mattmillar.co.nz',
        authorRole: 'matt_millar',
        actionSummary: 'Attached Linux IIO driver and verified operating current under 1Hz sampling'
      }
    ],
    lastModifiedBy: {
      name: 'Matt Millar',
      email: 'matt@mattmillar.co.nz',
      role: 'matt_millar'
    }
  },
  {
    id: 'hw-esp32-s3-devkitc-1',
    schemaVersion: '2.0',
    createdAt: '2026-07-10T11:00:00Z',
    updatedAt: '2026-09-15T16:40:00Z',
    revisionCount: 1,
    displayName: 'Espressif ESP32-S3-DevKitC-1-N8R8 Development Board',
    category: 'Microcontroller',
    manufacturer: 'Espressif Systems',
    model: 'ESP32-S3-DevKitC-1',
    variantRevision: 'ESP32-S3-WROOM-1-N8R8 (8MB Flash, 8MB Octal PSRAM)',
    aliases: ['ESP32-S3 DevKit', 'ESP32-S3-WROOM-1 Board'],
    description: 'General-purpose development board based on ESP32-S3 dual-core Xtensa LX7 MCU with vector instructions for AI acceleration, 2.4 GHz Wi-Fi, Bluetooth 5 (LE), dual USB Type-C ports, and addressable RGB LED.',
    tags: ['microcontroller', 'wifi', 'bluetooth', 'ble', 'espressif', 'esp32-s3', 'tinyml', 'usb-otg'],
    serialNumbers: ['SN:ESP32S3-2026-0894'],
    barcodes: [
      { format: 'QR_CODE', value: 'https://espressif.com/en/products/devkits/esp32-s3-devkitc-1', rawText: 'ESP32-S3-DevKitC-1-N8R8' }
    ],
    markings: [
      { label: 'RF Shield Silkscreen', text: 'ESP32-S3-WROOM-1 N8R8 FCC ID: 2AC7Z-ESPS3WROOM1', location: 'Metal RF shielding can', evidenceSourceId: 'src_esp_ds' },
      { label: 'PCB Silkscreen', text: 'ESP32-S3-DevKitC-1 v1.1', location: 'Top center near antenna', evidenceSourceId: 'src_esp_manual' },
      { label: 'USB Port Labels', text: 'USB (Native OTG) / UART (CP2102/CH343)', location: 'Bottom near dual USB-C ports', evidenceSourceId: 'src_esp_manual' }
    ],
    images: [
      {
        url: 'https://images.unsplash.com/photo-1555680202-c86f0e12f086?auto=format&fit=crop&w=800&q=80',
        caption: 'Top view showing dual USB-C ports, reset/boot buttons, and ESP32-S3-WROOM-1 module',
        isPrimary: true,
        timestamp: '2026-07-10T10:55:00Z'
      }
    ],
    electrical: {
      supplyInputs: [
        {
          name: 'USB-C Port (UART or USB)',
          minVoltage: 4.75,
          maxVoltage: 5.25,
          typVoltage: 5.0,
          voltageUnit: 'V',
          logicLevelVoltage: 3.3,
          operatingCurrentMa: 150,
          maxCurrentMa: 500,
          notes: 'Supplies board through onboard SGM2212 3.3V LDO regulator.',
          isAbsoluteMax: false,
          evidenceSourceId: 'src_esp_manual'
        },
        {
          name: '5V Header Pin',
          minVoltage: 4.5,
          maxVoltage: 5.5,
          typVoltage: 5.0,
          voltageUnit: 'V',
          logicLevelVoltage: 3.3,
          notes: 'Connected to USB 5V rail through Schottky barrier diode.',
          isAbsoluteMax: false,
          evidenceSourceId: 'src_esp_schematic'
        },
        {
          name: '3V3 Header Pin (Direct Power)',
          minVoltage: 3.0,
          maxVoltage: 3.6,
          typVoltage: 3.3,
          voltageUnit: 'V',
          logicLevelVoltage: 3.3,
          notes: 'Powering via 3V3 pin bypasses regulator. Power supply must deliver at least 500mA continuous for RF bursts.',
          isAbsoluteMax: false,
          evidenceSourceId: 'src_esp_ds'
        }
      ],
      absoluteMaxRatings: [
        { parameter: 'VDD 3.3V pin maximum', value: '3.6 V max', evidenceSourceId: 'src_esp_ds' },
        { parameter: 'GPIO Pin Input Voltage', value: '-0.3 V to VDD + 0.3 V (NOT 5V tolerant)', evidenceSourceId: 'src_esp_ds' },
        { parameter: 'Operating Ambient Temperature', value: '-40°C to +85°C', evidenceSourceId: 'src_esp_ds' },
        { parameter: 'Maximum Output Current per GPIO', value: '40 mA (20 mA recommended)', evidenceSourceId: 'src_esp_ds' }
      ],
      summaryNotes: 'Warning: GPIO pins are strictly 3.3V and NOT 5V tolerant. Connecting 5V logic directly to GPIOs can cause permanent latch-up.'
    },
    pinsAndConnectors: [
      { pinOrConnectorId: 'USB-1', physicalType: 'USB Type-C receptacle', labelPrinted: 'UART', primaryFunction: 'USB-to-UART Bridge for flashing and serial log', evidenceSourceId: 'src_esp_manual' },
      { pinOrConnectorId: 'USB-2', physicalType: 'USB Type-C receptacle', labelPrinted: 'USB', primaryFunction: 'Native ESP32-S3 USB OTG (Full-Speed 12Mbps)', alternateFunctions: ['JTAG debugging', 'CDC serial'], evidenceSourceId: 'src_esp_manual' },
      { pinOrConnectorId: 'GPIO0', physicalType: '2.54mm Header pin', labelPrinted: '0', primaryFunction: 'Boot mode strapping pin', restrictions: 'Must be floating or pulled HIGH during reset for SPI flash boot; LOW for download boot.', evidenceSourceId: 'src_esp_ds' },
      { pinOrConnectorId: 'GPIO48', physicalType: '2.54mm Header pin', labelPrinted: '48', primaryFunction: 'Onboard WS2812 RGB LED data input', evidenceSourceId: 'src_esp_schematic' }
    ],
    wiredInterfaces: [
      {
        type: 'USB',
        versionOrSpeed: 'USB 2.0 Full-Speed (12 Mbps)',
        busRole: 'Both',
        connectorOrPins: 'Native USB Type-C Port (GPIO19 D-, GPIO20 D+)',
        restrictions: 'Supports USB Host (HID, CDC, MSC) or USB Device.',
        evidenceSourceId: 'src_esp_ds'
      },
      {
        type: 'I2C',
        versionOrSpeed: 'Up to 800 kHz',
        busRole: 'Both',
        restrictions: 'Any free GPIO can be assigned to SDA/SCL via GPIO Matrix.',
        evidenceSourceId: 'src_esp_ds'
      },
      {
        type: 'SPI',
        versionOrSpeed: 'SPI2 (FSPI) and SPI3 (HSPI) up to 80 MHz',
        busRole: 'Both',
        restrictions: 'SPI0/1 are reserved for external flash and octal PSRAM.',
        evidenceSourceId: 'src_esp_ds'
      },
      {
        type: 'UART',
        versionOrSpeed: '3x UART controllers up to 5 Mbps',
        busRole: 'Both',
        connectorOrPins: 'UART0 routed to USB-UART bridge (GPIO43 TXD, GPIO44 RXD)',
        evidenceSourceId: 'src_esp_manual'
      }
    ],
    wireless: [
      {
        protocol: 'Wi-Fi',
        standardOrVersion: 'IEEE 802.11 b/g/n (Wi-Fi 4)',
        frequencyBands: ['2.4 GHz (2412 to 2484 MHz)'],
        rolesOrProfiles: ['Station (STA)', 'SoftAP', 'Wi-Fi Direct'],
        antennaType: 'Onboard PCB inverted-F antenna',
        evidenceSourceId: 'src_esp_ds'
      },
      {
        protocol: 'BLE',
        standardOrVersion: 'Bluetooth 5.0 LE & Bluetooth Mesh',
        frequencyBands: ['2.4 GHz'],
        rolesOrProfiles: ['GATT Server', 'GATT Client', '2 Mbps high-speed PHY', 'Long Range Coded PHY (125 kbps / 500 kbps)'],
        evidenceSourceId: 'src_esp_ds'
      }
    ],
    physicalAndFunctional: {
      dimensions: { lengthMm: 70.0, widthMm: 25.5, heightMm: 12.0, weightGrams: 14.5 },
      formFactor: 'DIP-44 Breadboard-friendly Dev Board',
      processor: {
        socOrMcu: 'ESP32-S3',
        architecture: 'Xtensa 32-bit Dual-Core LX7 with Vector Instructions',
        clockSpeedMhz: 240,
        coreCount: 2
      },
      memory: {
        flash: '8 MB Quad SPI Flash (W25Q64JV)',
        ram: '8 MB Octal SPI PSRAM + 512 KB Internal SRAM + 384 KB ROM',
        eeprom: 'Emulated in Flash (NVS)'
      },
      evidenceSourceId: 'src_esp_ds'
    },
    softwareAndCompatibility: [
      {
        frameworkOrTarget: 'ESP-IDF (Official Espressif IoT Development Framework)',
        status: 'manufacturer_supported',
        driverOrLibraryUrl: 'https://github.com/espressif/esp-idf',
        firmwareRequirement: 'ESP-IDF >= v4.4 (v5.x recommended)',
        evidenceSourceId: 'src_esp_manual'
      },
      {
        frameworkOrTarget: 'Arduino Core for ESP32',
        status: 'manufacturer_supported',
        driverOrLibraryUrl: 'https://github.com/espressif/arduino-esp32',
        firmwareRequirement: 'Arduino ESP32 core >= 2.0.3',
        evidenceSourceId: 'src_esp_manual'
      },
      {
        frameworkOrTarget: 'MicroPython',
        status: 'community_supported',
        driverOrLibraryUrl: 'https://micropython.org/download/ESP32_GENERIC_S3/',
        evidenceSourceId: 'src_esp_manual'
      }
    ],
    sources: [
      {
        id: 'src_esp_ds',
        title: 'ESP32-S3 Series Datasheet v1.5',
        url: 'https://www.espressif.com/sites/default/files/documentation/esp32-s3_datasheet_en.pdf',
        authorOrPublisher: 'Espressif Systems',
        sourceType: 'manufacturer_datasheet',
        reliability: 'primary_manufacturer',
        extractedDate: '2026-07-10'
      },
      {
        id: 'src_esp_manual',
        title: 'ESP32-S3-DevKitC-1 User Guide',
        url: 'https://docs.espressif.com/projects/esp-idf/en/latest/esp32s3/hw-reference/esp32s3/user-guide-devkitc-1.html',
        authorOrPublisher: 'Espressif Systems',
        sourceType: 'manufacturer_manual',
        reliability: 'primary_manufacturer',
        extractedDate: '2026-07-10'
      },
      {
        id: 'src_esp_schematic',
        title: 'ESP32-S3-DevKitC-1 Schematic v1.1',
        url: 'https://dl.espressif.com/dl/schematics/SCH_ESP32-S3-DEVKITC-1_V1.1_20220413.pdf',
        authorOrPublisher: 'Espressif Systems',
        sourceType: 'schematic_or_board_layout',
        reliability: 'primary_manufacturer',
        extractedDate: '2026-07-10'
      }
    ],
    resources: [
      {
        id: 'res-esp-ds',
        title: 'Official ESP32-S3 Datasheet',
        url: 'https://www.espressif.com/sites/default/files/documentation/esp32-s3_datasheet_en.pdf',
        type: 'datasheet',
        description: 'Complete SoC reference with electrical characteristics, pin assignments, and vector instructions',
        versionOrRevision: 'v1.5'
      },
      {
        id: 'res-esp-idf',
        title: 'ESP-IDF GitHub Repository',
        url: 'https://github.com/espressif/esp-idf',
        type: 'github_repo',
        description: 'Official production development framework for ESP32-S3',
        versionOrRevision: 'v5.3'
      }
    ],
    customProperties: [
      { id: 'cp-ai', key: 'AI / Vector Instructions', value: 'Included (Xtensa instruction set architecture for 8-bit and 16-bit integer multiplication)' },
      { id: 'cp-usb', key: 'Dual USB Configuration', value: 'Port 1: Silicon Labs CP2102N UART; Port 2: Native Full-speed USB OTG' }
    ],
    notes: 'Unit tested for FreeRTOS edge vision tasks and BLE beaconing. Boot button can also be read as GPIO0 input in user firmware.',
    confirmationStatus: 'confirmed',
    revisions: [
      {
        revisionNumber: 1,
        timestamp: '2026-07-10T11:00:00Z',
        authorName: 'Matt Millar',
        authorEmail: 'matt@mattmillar.co.nz',
        authorRole: 'matt_millar',
        actionSummary: 'Initial verified cataloguing from Espressif documentation'
      }
    ],
    lastModifiedBy: {
      name: 'Matt Millar',
      email: 'matt@mattmillar.co.nz',
      role: 'matt_millar'
    }
  },
  {
    id: 'hw-rpi5-8gb',
    schemaVersion: '2.0',
    createdAt: '2026-06-01T14:00:00Z',
    updatedAt: '2026-09-12T08:15:00Z',
    revisionCount: 2,
    displayName: 'Raspberry Pi 5 (8 GB RAM)',
    category: 'SBC',
    manufacturer: 'Raspberry Pi Ltd',
    model: 'Raspberry Pi 5',
    variantRevision: 'Rev 1.0 (8GB LPDDR4X)',
    aliases: ['RPi 5 8GB', 'Raspberry Pi 5 Model B'],
    description: 'Flagship single-board computer featuring Broadcom BCM2712 quad-core 64-bit Arm Cortex-A76 processor at 2.4GHz, RP1 custom I/O controller, dual 4Kp60 HDMI display outputs, PCIe 2.0 interface, and power button.',
    tags: ['sbc', 'linux', 'raspberry-pi', 'arm64', 'pcie', 'dual-hdmi', 'gigabit-ethernet'],
    serialNumbers: ['SN:10000000a293b18c'],
    barcodes: [
      { format: 'EAN13', value: '5056561803326' }
    ],
    markings: [
      { label: 'SoC Engraving', text: 'BCM2712D0KFSBG', location: 'Metal heatspreader of primary processor', evidenceSourceId: 'src_rpi_ds' },
      { label: 'Board Silkscreen', text: 'Raspberry Pi 5 © 2023', location: 'Center front PCB', evidenceSourceId: 'src_rpi_ds' },
      { label: 'I/O Controller', text: 'RP1-C0', location: 'Custom southbridge IC', evidenceSourceId: 'src_rpi_ds' }
    ],
    images: [
      {
        url: 'https://images.unsplash.com/photo-1544652478-6653e09f18a2?auto=format&fit=crop&w=800&q=80',
        caption: 'Raspberry Pi 5 board showing BCM2712 SoC, dual micro-HDMI ports, and USB-C power',
        isPrimary: true,
        timestamp: '2026-06-01T13:50:00Z'
      }
    ],
    electrical: {
      supplyInputs: [
        {
          name: 'USB-C Power Input (PD 5V/5A Recommended)',
          minVoltage: 4.8,
          maxVoltage: 5.25,
          typVoltage: 5.1,
          voltageUnit: 'V',
          logicLevelVoltage: 3.3,
          operatingCurrentMa: 800,
          maxCurrentMa: 5000,
          notes: 'Requires 5V/5A USB-PD for full 1.6A downstream USB peripheral current. When powered from standard 5V/3A supply, downstream USB current is capped to 600mA.',
          isAbsoluteMax: false,
          evidenceSourceId: 'src_rpi_ds'
        }
      ],
      absoluteMaxRatings: [
        { parameter: 'Supply Voltage (5V line)', value: '5.5 V absolute max', evidenceSourceId: 'src_rpi_ds' },
        { parameter: 'GPIO Pin Voltage', value: '3.3 V max (NOT 5V tolerant)', evidenceSourceId: 'src_rpi_ds' }
      ],
      summaryNotes: 'Dedicated DA9091 PMIC generates power rails. Onboard RTC battery connector supports rechargeable/non-rechargeable coin cells.'
    },
    pinsAndConnectors: [
      { pinOrConnectorId: '40-Pin Header', physicalType: '2x20 2.54mm male header', labelPrinted: 'GPIO', primaryFunction: 'Standard Raspberry Pi 40-pin GPIO pinout', restrictions: '3.3V logic only. Max current 50mA total across all 3.3V GPIO pins combined.', evidenceSourceId: 'src_rpi_ds' },
      { pinOrConnectorId: 'PCIe FPC', physicalType: '16-pin 0.5mm pitch FPC connector', labelPrinted: 'PCIe', primaryFunction: 'PCIe 2.0 x1 interface for NVMe SSD or peripherals', evidenceSourceId: 'src_rpi_ds' },
      { pinOrConnectorId: 'UART Header', physicalType: '3-pin JST-SH 1.0mm pitch', labelPrinted: 'UART', primaryFunction: 'Always-on hardware debug serial console (115200 baud)', evidenceSourceId: 'src_rpi_ds' }
    ],
    wiredInterfaces: [
      { type: 'HDMI', versionOrSpeed: 'Dual micro-HDMI 2.0 with HDR support up to 4Kp60 simultaneous', busRole: 'Host', evidenceSourceId: 'src_rpi_ds' },
      { type: 'Ethernet', versionOrSpeed: 'Gigabit Ethernet (10/100/1000 Mbps) with PoE+ support via HAT', busRole: 'Both', evidenceSourceId: 'src_rpi_ds' },
      { type: 'USB', versionOrSpeed: '2x USB 3.0 (5 Gbps simultaneous) + 2x USB 2.0', busRole: 'Host', evidenceSourceId: 'src_rpi_ds' },
      { type: 'PCIe', versionOrSpeed: 'PCIe 2.0 x1 (certified), can operate at PCIe 3.0 in non-standard config', busRole: 'Host', evidenceSourceId: 'src_rpi_ds' }
    ],
    wireless: [
      { protocol: 'Wi-Fi', standardOrVersion: 'Dual-band 802.11ac (Wi-Fi 5)', frequencyBands: ['2.4 GHz', '5.0 GHz'], antennaType: 'Custom metal antenna structure', evidenceSourceId: 'src_rpi_ds' },
      { protocol: 'Bluetooth Classic', standardOrVersion: 'Bluetooth 5.0 / BLE', evidenceSourceId: 'src_rpi_ds' }
    ],
    physicalAndFunctional: {
      dimensions: { lengthMm: 85.0, widthMm: 56.0, heightMm: 17.0, weightGrams: 46.0 },
      formFactor: 'Raspberry Pi Standard SBC',
      processor: {
        socOrMcu: 'Broadcom BCM2712',
        architecture: 'Quad-core Arm Cortex-A76 (ARMv8.2-A 64-bit)',
        clockSpeedMhz: 2400,
        coreCount: 4
      },
      memory: {
        ram: '8 GB LPDDR4X-4267 SDRAM'
      },
      evidenceSourceId: 'src_rpi_ds'
    },
    softwareAndCompatibility: [
      {
        frameworkOrTarget: 'Raspberry Pi OS (Debian Bookworm arm64)',
        status: 'manufacturer_supported',
        driverOrLibraryUrl: 'https://www.raspberrypi.com/software/operating-systems/',
        firmwareRequirement: 'Kernel >= 6.1, Wayland/Wayfire default compositor',
        evidenceSourceId: 'src_rpi_ds'
      },
      {
        frameworkOrTarget: 'Ubuntu Server / Desktop 24.04 LTS (arm64)',
        status: 'community_supported',
        driverOrLibraryUrl: 'https://ubuntu.com/download/raspberry-pi',
        evidenceSourceId: 'src_rpi_ds'
      }
    ],
    sources: [
      {
        id: 'src_rpi_ds',
        title: 'Raspberry Pi 5 Product Brief and Technical Documentation',
        url: 'https://datasheets.raspberrypi.com/rpi5/raspberry-pi-5-product-brief.pdf',
        authorOrPublisher: 'Raspberry Pi Ltd',
        sourceType: 'manufacturer_datasheet',
        reliability: 'primary_manufacturer',
        extractedDate: '2026-06-01'
      }
    ],
    resources: [
      {
        id: 'res-rpi-doc',
        title: 'Official Raspberry Pi 5 Documentation Portal',
        url: 'https://www.raspberrypi.com/documentation/computers/raspberry-pi-5.html',
        type: 'manual',
        description: 'Covers boot sequence, GPIO multiplexing, PCIe HAT standards, and fan speed control',
        versionOrRevision: '2026 Edition'
      }
    ],
    customProperties: [
      { id: 'prop-fan', key: 'Active Cooler Header', value: '4-pin JST-SH connector with PWM speed control and tachometer feedback' }
    ],
    notes: 'Configured with official 27W USB-C PD power supply and Raspberry Pi Active Cooler. PCIe NVMe boot confirmed functional.',
    confirmationStatus: 'confirmed',
    revisions: [
      {
        revisionNumber: 1,
        timestamp: '2026-06-01T14:00:00Z',
        authorName: 'Matt Millar',
        authorEmail: 'matt@mattmillar.co.nz',
        authorRole: 'matt_millar',
        actionSummary: 'Initial registration from official Raspberry Pi Ltd product brief'
      },
      {
        revisionNumber: 2,
        timestamp: '2026-09-12T08:15:00Z',
        authorName: 'Matt Millar',
        authorEmail: 'matt@mattmillar.co.nz',
        authorRole: 'matt_millar',
        actionSummary: 'Added power supply current thresholds and PCIe pin notes'
      }
    ],
    lastModifiedBy: {
      name: 'Matt Millar',
      email: 'matt@mattmillar.co.nz',
      role: 'matt_millar'
    }
  },
  {
    id: 'hw-rp2040-mcu',
    schemaVersion: '2.0',
    createdAt: '2026-05-10T10:00:00Z',
    updatedAt: '2026-09-25T11:00:00Z',
    revisionCount: 1,
    displayName: 'Raspberry Pi RP2040 Microcontroller',
    category: 'Microcontroller',
    manufacturer: 'Raspberry Pi Ltd',
    model: 'RP2040',
    variantRevision: 'QFN-56 (Silicon Rev B2)',
    aliases: ['RP2040', 'Pico MCU', 'Dual Cortex-M0+'],
    description: 'Custom dual-core Arm Cortex-M0+ microcontroller running up to 133MHz with 264KB internal SRAM, 30 multi-function GPIOs, dual programmable I/O (PIO) state machines, and UF2 bootloader in ROM.',
    tags: ['rp2040', 'arm-cortex-m0', 'microcontroller', 'pio', 'qfn56', 'usb-device'],
    serialNumbers: [],
    barcodes: [],
    markings: [
      { label: 'Package Laser Marking', text: 'RP2-B2', location: 'Top center QFN56 package' }
    ],
    images: [
      {
        url: 'https://images.unsplash.com/photo-1555680202-c86f0e12f086?auto=format&fit=crop&w=800&q=80',
        caption: 'RP2040 7x7mm QFN-56 chip package',
        isPrimary: true
      }
    ],
    electrical: {
      supplyInputs: [
        {
          name: 'IOVDD (Digital I/O Supply)',
          minVoltage: 1.8,
          maxVoltage: 3.3,
          typVoltage: 3.3,
          voltageUnit: 'V',
          logicLevelVoltage: 3.3,
          notes: 'Sets logic level for GPIO0-GPIO29. Strictly NOT 5V tolerant.'
        },
        {
          name: 'DVDD (Digital Core Supply)',
          minVoltage: 1.05,
          maxVoltage: 1.25,
          typVoltage: 1.1,
          voltageUnit: 'V',
          notes: 'Supplied via onboard internal LDO or external switching regulator.'
        },
        {
          name: 'VREG_IN (Internal Regulator Input)',
          minVoltage: 1.8,
          maxVoltage: 3.63,
          typVoltage: 3.3,
          voltageUnit: 'V'
        }
      ],
      absoluteMaxRatings: [
        { parameter: 'Voltage on any IOVDD-referenced GPIO', value: '-0.5V to IOVDD + 0.5V (NOT 5V tolerant)' },
        { parameter: 'Maximum output current per pin', value: '12 mA (up to 50 mA total across chip)' }
      ],
      summaryNotes: 'Warning: GPIO pins are strictly 3.3V and NOT 5V tolerant. Connecting 5V logic destroys the GPIO input buffers.'
    },
    pinsAndConnectors: [
      { pinOrConnectorId: 'GPIO0', physicalType: 'QFN pad', labelPrinted: 'GP0', gpioNumber: 0, primaryFunction: 'UART0 TX', alternateFunctions: ['SPI0 RX', 'I2C0 SDA', 'PWM0 A', 'PIO0/1'], restrictions: '3.3V max' },
      { pinOrConnectorId: 'GPIO1', physicalType: 'QFN pad', labelPrinted: 'GP1', gpioNumber: 1, primaryFunction: 'UART0 RX', alternateFunctions: ['SPI0 CSn', 'I2C0 SCL', 'PWM0 B', 'PIO0/1'], restrictions: '3.3V max' },
      { pinOrConnectorId: 'GPIO2', physicalType: 'QFN pad', labelPrinted: 'GP2', gpioNumber: 2, primaryFunction: 'SPI0 SCK', alternateFunctions: ['UART0 CTS', 'I2C1 SDA', 'PWM1 A', 'PIO0/1'], restrictions: '3.3V max' },
      { pinOrConnectorId: 'GPIO3', physicalType: 'QFN pad', labelPrinted: 'GP3', gpioNumber: 3, primaryFunction: 'SPI0 TX', alternateFunctions: ['UART0 RTS', 'I2C1 SCL', 'PWM1 B', 'PIO0/1'], restrictions: '3.3V max' },
      { pinOrConnectorId: 'GPIO4', physicalType: 'QFN pad', labelPrinted: 'GP4', gpioNumber: 4, primaryFunction: 'I2C0 SDA', alternateFunctions: ['UART1 TX', 'SPI0 RX', 'PWM2 A', 'PIO0/1'], restrictions: '3.3V max' },
      { pinOrConnectorId: 'GPIO5', physicalType: 'QFN pad', labelPrinted: 'GP5', gpioNumber: 5, primaryFunction: 'I2C0 SCL', alternateFunctions: ['UART1 RX', 'SPI0 CSn', 'PWM2 B', 'PIO0/1'], restrictions: '3.3V max' },
      { pinOrConnectorId: 'QSPI_SS', physicalType: 'QFN pad', labelPrinted: 'BOOTSEL', primaryFunction: 'QSPI Flash Chip Select / Boot Mode', restrictions: 'Pulled LOW at power-up/reset to enter USB mass-storage UF2 bootloader.' },
      { pinOrConnectorId: 'GPIO26_ADC0', physicalType: 'QFN pad', labelPrinted: 'ADC0', gpioNumber: 26, primaryFunction: '12-bit ADC Channel 0', alternateFunctions: ['GPIO26'], restrictions: 'Analog input 0V to 3.3V (referenced to ADC_AVDD)' }
    ],
    wiredInterfaces: [
      { type: 'USB', versionOrSpeed: 'USB 1.1 Full Speed (12 Mbps)', busRole: 'Both', connectorOrPins: 'USB_DP / USB_DM pads with internal 27 ohm termination' },
      { type: 'I2C', versionOrSpeed: '2x I2C controllers up to 1 MHz (Fast-mode Plus)', busRole: 'Both' },
      { type: 'SPI', versionOrSpeed: '2x SPI controllers up to 62.5 MHz', busRole: 'Both' },
      { type: 'UART', versionOrSpeed: '2x PL011 UART controllers', busRole: 'Both' }
    ],
    wireless: [],
    physicalAndFunctional: {
      dimensions: { lengthMm: 7.0, widthMm: 7.0, heightMm: 0.9 },
      formFactor: 'QFN-56 (0.4mm pitch)',
      processor: { socOrMcu: 'RP2040', architecture: 'Dual Arm Cortex-M0+', clockSpeedMhz: 133, coreCount: 2 },
      memory: { ram: '264 KB on-chip SRAM in 6 independent banks', flash: 'External QSPI Flash up to 16MB supported' }
    },
    softwareAndCompatibility: [
      { frameworkOrTarget: 'C/C++ Raspberry Pi Pico SDK', status: 'manufacturer_supported', driverOrLibraryUrl: 'https://github.com/raspberrypi/pico-sdk' },
      { frameworkOrTarget: 'CircuitPython / MicroPython', status: 'community_supported', driverOrLibraryUrl: 'https://circuitpython.org' }
    ],
    sources: [
      { id: 'src_rp2040_ds', title: 'RP2040 Datasheet: An ARM Cortex-M0+ microcontroller', url: 'https://datasheets.raspberrypi.com/rp2040/rp2040-datasheet.pdf', sourceType: 'manufacturer_datasheet', reliability: 'primary_manufacturer', extractedDate: '2026-05-10' }
    ],
    resources: [
      { id: 'res_pico_ds', title: 'RP2040 Official Datasheet PDF', url: 'https://datasheets.raspberrypi.com/rp2040/rp2040-datasheet.pdf', type: 'datasheet', description: 'Complete 640-page hardware architectural manual' }
    ],
    customProperties: [
      { id: 'cp-pio', key: 'Programmable I/O (PIO)', value: '8 state machines total for arbitrary bus emulation (DVI, WS2812, VGA, I2S)' }
    ],
    notes: 'BOOTSEL pin: Hold down while plugging in USB cable to mount as RPI-RP2 mass-storage volume for drag-and-drop UF2 programming.',
    confirmationStatus: 'confirmed',
    revisions: [],
    lastModifiedBy: { name: 'Matt Millar', role: 'matt_millar' }
  }
];
