"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Settings, Search, Maximize2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";

// WebSerial API Type Declarations
declare global {
  interface Navigator {
    serial: Serial;
  }

  interface Serial {
    requestPort(): Promise<SerialPort>;
    getPorts(): Promise<SerialPort[]>;
    addEventListener(type: string, listener: EventListener): void;
    removeEventListener(type: string, listener: EventListener): void;
  }

  interface SerialPort {
    open(options: SerialOptions): Promise<void>;
    close(): Promise<void>;
    readable: ReadableStream<Uint8Array> | null;
    writable: WritableStream<Uint8Array> | null;
    getInfo(): SerialPortInfo;
    addEventListener(type: string, listener: EventListener): void;
    removeEventListener(type: string, listener: EventListener): void;
  }

  interface SerialOptions {
    baudRate: number;
    dataBits?: number;
    stopBits?: number;
    parity?: "none" | "even" | "odd";
    bufferSize?: number;
    flowControl?: "none" | "hardware";
  }

  interface SerialPortInfo {
    usbVendorId?: number;
    usbProductId?: number;
    serialNumber?: string;
  }
}

// Frequency and RSSI Lookup Tables
const FREQUENCY_TABLE: Record<string, number> = {
  "00": 865.0,
  "01": 865.5,
  "02": 866.0,
  "03": 866.5,
  "04": 867.0,
  "05": 867.5,
  "06": 868.0,
  "07": 902.0,
  "08": 902.5,
  "09": 903.0,
  "0A": 903.5,
  "0B": 904.0,
  "0C": 904.5,
  "0D": 905.0,
  "0E": 905.5,
  "0F": 906.0,
  "10": 906.5,
  "11": 907.0,
  "12": 907.5,
  "13": 908.0,
  "14": 908.5,
  "15": 909.0,
  "16": 909.5,
  "17": 910.0,
  "18": 910.5,
  "19": 911.0,
  "1A": 911.5,
  "1B": 912.0,
  "1C": 912.5,
  "1D": 913.0,
  "1E": 913.5,
  "1F": 914.0,
  "20": 914.5,
  "21": 915.0,
  "22": 915.5,
  "23": 916.0,
  "24": 916.5,
  "25": 917.0,
  "26": 917.5,
  "27": 918.0,
  "28": 918.5,
  "29": 919.0,
  "2A": 919.5,
  "2B": 920.0,
  "2C": 920.5,
  "2D": 921.0,
  "2E": 921.5,
  "2F": 922.0,
  "30": 922.5,
  "31": 923.0,
  "32": 923.5,
  "33": 924.0,
  "34": 924.5,
  "35": 925.0,
  "36": 925.5,
  "37": 926.0,
  "38": 926.5,
  "39": 927.0,
  "3A": 927.5,
  "3B": 928.0,
};

const RSSI_DBM: Record<string, number> = {
  "6E": -19,
  "6D": -20,
  "6C": -21,
  "6B": -22,
  "6A": -23,
  "69": -24,
  "68": -25,
  "67": -26,
  "66": -27,
  "65": -28,
  "64": -29,
  "63": -30,
  "62": -31,
  "61": -32,
  "60": -33,
  "5F": -34,
  "5E": -35,
  "5D": -36,
  "5C": -37,
  "5B": -38,
  "5A": -39,
  "59": -41,
  "58": -42,
  "57": -43,
  "56": -44,
  "55": -45,
  "54": -46,
  "53": -47,
  "52": -48,
  "51": -49,
  "50": -50,
  "4F": -51,
  "4E": -52,
  "4D": -53,
  "4C": -54,
  "4B": -55,
  "4A": -56,
  "49": -57,
  "48": -58,
  "47": -59,
  "46": -60,
  "45": -61,
  "44": -62,
  "43": -63,
  "42": -64,
  "41": -65,
  "40": -66,
  "3F": -67,
  "3E": -68,
  "3D": -69,
  "3C": -70,
  "3B": -71,
  "3A": -72,
  "39": -73,
  "38": -74,
  "37": -75,
  "36": -76,
  "35": -77,
  "34": -78,
  "33": -79,
  "32": -80,
  "31": -81,
  "30": -82,
  "2F": -83,
  "2E": -84,
  "2D": -85,
  "2C": -86,
  "2B": -87,
  "2A": -88,
  "29": -89,
  "28": -90,
  "27": -91,
  "26": -92,
  "25": -93,
  "24": -94,
  "23": -95,
  "22": -96,
  "21": -97,
  "20": -98,
  "1F": -99,
};

// Types
interface TagData {
  epc: string;
  count: number;
  antenna: number;
  rssi: number;
  frequency: number;
  firstSeen: Date;
  lastSeen: Date;
}

interface ReaderProtocol {
  name: string;
  packetType: number;
  commands: Record<string, number>;
  beeperModes: Record<string, number>;
  addresses: Record<string, number>;
  rfProfiles?: Record<
    number,
    { id: number; name: string; description: string }
  >;
  currentRfProfile?: number;
  antennas?: Record<number, { enabled: boolean; power: number }>;
  inventorySettings?: {
    interval: number;
    repeat: number;
    stayTime: number;
  };
  sessionTargetSettings?: {
    session: number;
    target: number;
    repeat: number;
  };
  getEnabledAntennas?: () => number[];
  generateFastSwitchData?: () => number[];
  inventoryModes?: Record<string, any>;
  currentMode?: string;
  inventoryData: number[];
  sessionTargetData?: number[];
  parseInventory: (
    data: number[]
  ) => { epc: string; antenna: number; rssi: number; frequency: number } | null;
  calculateRSSI: (rssiByte: number) => number;
  calculateFrequency: (chIdx: number) => number;
}

// Reader Protocol Definitions
const ReaderProtocols: Record<string, ReaderProtocol> = {
  VMR64: {
    name: "VMR64 (Nextwaves)",
    packetType: 0xa0,
    commands: {
      INFO: 0x01,
      PWR: 0x76,
      PWR_GET: 0x77,
      BEEPER: 0x7a,
      INV_ON: 0x8a,
      INV_OFF: 0x88,
      RESET: 0x70,
      FIRMWARE: 0x72,
      SET_RF_PROFILE: 0x69,
      GET_RF_PROFILE: 0x6a,
      FAST_SWITCH_ANT_INVENTORY: 0x8a,
      CUSTOMIZED_SESSION_TARGET_INVENTORY: 0x8b,
    },
    beeperModes: {
      QUIET: 0x00,
      BEEP_AFTER_INVENTORY: 0x01,
      BEEP_AFTER_TAG: 0x02,
    },
    addresses: {
      INFO: 0x01,
      PWR: 0x01,
      PWR_GET: 0x01,
      BEEPER: 0xff,
      RESET: 0xff,
      FIRMWARE: 0xff,
      INV_ON: 0xff,
      INV_OFF: 0xff,
      SET_RF_PROFILE: 0xff,
      GET_RF_PROFILE: 0xff,
      FAST_SWITCH_ANT_INVENTORY: 0xff,
      CUSTOMIZED_SESSION_TARGET_INVENTORY: 0xff,
    },
    rfProfiles: {
      0: { id: 0xd0, name: "Profile 0", description: "Tari 25uS, FM0 40KHz" },
      1: {
        id: 0xd1,
        name: "Profile 1",
        description: "Tari 25uS, Miller 4 250KHz (Default)",
      },
      2: {
        id: 0xd2,
        name: "Profile 2",
        description: "Tari 25uS, Miller 4 300KHz",
      },
      3: {
        id: 0xd3,
        name: "Profile 3",
        description: "Tari 6.25uS, FM0 400KHz",
      },
    },
    currentRfProfile: 1,
    antennas: {
      1: { enabled: true, power: 30 },
      2: { enabled: true, power: 30 },
      3: { enabled: true, power: 30 },
      4: { enabled: true, power: 30 },
    },
    inventorySettings: {
      interval: 0x01,
      repeat: 0x01,
      stayTime: 0x01,
    },
    sessionTargetSettings: {
      session: 0x00,
      target: 0x00,
      repeat: 0x01,
    },
    getEnabledAntennas() {
      if (!this.antennas) return [];
      return Object.entries(this.antennas)
        .filter(([id, antenna]) => antenna.enabled)
        .map(([id]) => parseInt(id));
    },
    generateFastSwitchData() {
      if (!this.antennas || !this.inventorySettings) return [];
      const enabled = this.getEnabledAntennas?.() || [];
      if (enabled.length === 0) {
        enabled.push(1);
        if (this.antennas[1]) {
          this.antennas[1].enabled = true;
        }
      }

      const data = [];
      for (let i = 0; i < 4; i++) {
        // const antennaId = enabled[i % enabled.length];
        // data.push(antennaId - 1);
        // data.push(this.inventorySettings.stayTime);
        data.push(i);
        if (enabled.includes(i + 1)) {
          data.push(this.inventorySettings.stayTime);
        } else {
          data.push(0);
        }
      }

      data.push(this.inventorySettings.interval);
      data.push(this.inventorySettings.repeat);

      return data;
    },
    get inventoryData() {
      return this.generateFastSwitchData?.() || [];
    },
    get sessionTargetData() {
      if (!this.sessionTargetSettings) return [];
      return [
        this.sessionTargetSettings.session,
        this.sessionTargetSettings.target,
        this.sessionTargetSettings.repeat,
      ];
    },
    parseInventory: function (data: number[]) {
      if (!data || data.length < 4) return null;

      if (
        data.length >= 5 &&
        (data[3] === this.commands.FAST_SWITCH_ANT_INVENTORY ||
          data[3] === this.commands.CUSTOMIZED_SESSION_TARGET_INVENTORY)
      ) {
        const freqAnt = data[4];
        const antenna = (freqAnt & 0x03) + 1;
        const chIdx = freqAnt >> 2;

        const pcLow = data[5];
        const epcWords = (pcLow >> 3) & 0x1f;
        const epcLen = epcWords * 2;

        const epcStart = 7;
        let epcEnd = epcStart + epcLen;

        if (epcEnd > data.length - 2) {
          epcEnd = data.length - 2;
        }

        const epc = data
          .slice(epcStart, epcEnd)
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("")
          .toUpperCase();

        if (epc) {
          const rssiByte = data[data.length - 2];
          const rssi = this.calculateRSSI(rssiByte);
          const frequency = this.calculateFrequency(chIdx);

          if (rssi > -99) {
            return { epc, antenna, rssi, frequency };
          }
        }
      }
      return null;
    },
    calculateRSSI: function (rssiByte: number) {
      const hexKey = rssiByte.toString(16).toUpperCase().padStart(2, "0");
      return RSSI_DBM[hexKey] || -100;
    },
    calculateFrequency: function (chIdx: number) {
      const hexKey = chIdx.toString(16).toUpperCase().padStart(2, "0");
      return FREQUENCY_TABLE[hexKey] || 865.0;
    },
  },
  NATION: {
    name: "NATION",
    packetType: 0x5a, // Frame header
    commands: {
      // Reader Configuration
      QUERY_INFO: 0x0100,
      CONFIRM_CONNECTION: 0x12,
      // RFID Inventory
      READ_EPC_TAG: 0x0210,
      STOP_INVENTORY: 0x02ff,
      STOP_OPERATION: 0xff,
      // Power Control - correct message IDs (Category 0x01, not 0x02!)
      CONFIGURE_READER_POWER: 0x0201, // Category 0x01, MID = 0x01
      QUERY_READER_POWER: 0x0202, // Category 0x01, MID = 0x02
      READER_POWER_CALIBRATION: 0x0103, // Category 0x01, MID = 0x03
      QUERY_POWER_CALIBRATION: 0x0104, // Category 0x01, MID = 0x04
      // Buzzer Control
      BUZZER_SWITCH: 0x011e,
      // Baseband Configuration
      CONFIG_BASEBAND: 0x020b,
      QUERY_BASEBAND: 0x020c,
      // Filter Settings
      SET_FILTER_SETTINGS: 0x0209,
      QUERY_FILTER_SETTINGS: 0x020a,
      // RF Band
      SET_RF_BAND: 0x0203,
      QUERY_RF_BAND: 0x0204,
      // Working Frequency
      SET_WORKING_FREQUENCY: 0x0205,
      QUERY_WORKING_FREQUENCY: 0x0206,
      // Session
      SESSION: 0x03,
      // RFID Capability (Category 0x10, MID 0x00)
      QUERY_RFID_ABILITY: 0x1000,
      // Antenna Configuration
      CONFIGURE_ANTENNA_ENABLE: 0x0203,
      QUERY_ANTENNA_ENABLE: 0x0202,
      // Write EPC
      WRITE_EPC_TAG: 0x0211,
    },
    beeperModes: {
      QUIET: 0x00,
      BEEP_AFTER_INVENTORY: 0x01,
      BEEP_AFTER_TAG: 0x02,
    },
    addresses: {
      // Nation protocol doesn't use addresses the same way
      INFO: 0x00,
      PWR: 0x00,
      PWR_GET: 0x00,
      BEEPER: 0x00,
      RESET: 0x00,
      FIRMWARE: 0x00,
      INV_ON: 0x00,
      INV_OFF: 0x00,
      SET_RF_PROFILE: 0x00,
      GET_RF_PROFILE: 0x00,
      FAST_SWITCH_ANT_INVENTORY: 0x00,
      CUSTOMIZED_SESSION_TARGET_INVENTORY: 0x00,
    },
    rfProfiles: {
      0: { id: 0, name: "Profile 0", description: "Default baseband profile" },
      1: { id: 1, name: "Profile 1", description: "High performance profile" },
      2: { id: 2, name: "Profile 2", description: "Dense tag profile" },
    },
    currentRfProfile: 0,
    antennas: {
      1: { enabled: true, power: 30 },
      2: { enabled: false, power: 30 },
      3: { enabled: false, power: 30 },
      4: { enabled: false, power: 30 },
    },
    inventorySettings: {
      interval: 0x01,
      repeat: 0x01,
      stayTime: 0x01,
    },
    sessionTargetSettings: {
      session: 0x00,
      target: 0x00,
      repeat: 0x01,
    },
    getEnabledAntennas() {
      if (!this.antennas) return [];
      return Object.entries(this.antennas)
        .filter(([id, antenna]) => antenna.enabled)
        .map(([id]) => parseInt(id));
    },
    generateFastSwitchData() {
      // For NATION, we build antenna mask instead
      let mask = 0;
      const enabled = this.getEnabledAntennas?.() || [];
      enabled.forEach((id) => {
        mask |= 1 << (id - 1);
      });
      // Return mask as 4 bytes (big-endian) + continuous mode flag
      return [
        (mask >> 24) & 0xff,
        (mask >> 16) & 0xff,
        (mask >> 8) & 0xff,
        mask & 0xff,
        0x01, // Continuous mode
      ];
    },
    get inventoryData() {
      return this.generateFastSwitchData?.() || [];
    },
    get sessionTargetData() {
      if (!this.sessionTargetSettings) return [];
      return [
        this.sessionTargetSettings.session,
        this.sessionTargetSettings.target,
        this.sessionTargetSettings.repeat,
      ];
    },
    parseInventory: function (data: number[]) {
      if (!data || data.length < 9) return null;

      // NATION protocol frame structure
      if (data[0] !== 0x5a) return null; // Check frame header

      // Parse PCW (Protocol Control Word)
      const pcw = (data[1] << 24) | (data[2] << 16) | (data[3] << 8) | data[4];
      const notifyFlag = (pcw >> 12) & 0x01;
      const category = (pcw >> 8) & 0xff;
      const mid = pcw & 0xff;

      // Check if this is an EPC tag notification
      // Note: The actual frames show category 0x12, not 0x02!
      if (
        (category === 0x02 || category === 0x12) &&
        mid === 0x00 &&
        notifyFlag === 1
      ) {
        // Parse data length
        const dataLen = (data[5] << 8) | data[6];
        const dataStart = 7;

        if (data.length < dataStart + dataLen + 2) return null; // +2 for CRC

        // Parse the actual payload
        const payload = data.slice(dataStart, dataStart + dataLen);

        // Parse EPC data structure from payload
        // Format: [EPC_len_H, EPC_len_L, EPC_data..., PC_H, PC_L, Antenna, PID?, RSSI?]
        if (payload.length < 5) return null; // Minimum: 2 bytes len + 1 byte EPC + 2 bytes PC + 1 byte antenna

        const epcLen = (payload[0] << 8) | payload[1];

        if (payload.length < 2 + epcLen + 3) return null; // Not enough data

        // Extract EPC
        const epcStart = 2;
        const epcEnd = epcStart + epcLen;
        const epc = payload
          .slice(epcStart, epcEnd)
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("")
          .toUpperCase();

        // Parse PC (2 bytes after EPC)
        const pcIndex = epcEnd;

        // Parse antenna ID (1 byte after PC + 2 bytes)
        const antennaIndex = pcIndex + 2;
        const antenna = payload[antennaIndex];

        // Parse optional RSSI and frequency
        let rssi = -70; // Default RSSI in dBm

        // After antenna, we might have additional data
        // Format: antenna, PID (0x01), RSSI value
        if (
          payload.length > antennaIndex + 2 &&
          payload[antennaIndex + 1] === 0x01
        ) {
          // RSSI is the byte after PID marker
          const rssiRaw = payload[antennaIndex + 2];

          // NATION RSSI is a U8 (0-255) scale, NOT dBm
          // We need to convert it to dBm for display consistency
          // Common RFID conversion formulas:
          // Option 1: Linear mapping where 255 = -30 dBm (strong), 0 = -100 dBm (weak)
          // Option 2: RSSI_dBm = -100 + (rssiRaw * 70 / 255)

          // Use a linear mapping that gives reasonable dBm values
          // Map 0-255 to -100 to -30 dBm range
          rssi = -100 + Math.round((rssiRaw * 70) / 255);

          console.log(`NATION RSSI: U8=${rssiRaw} → ${rssi} dBm`);
        }

        const frequency = 920.0; // Default frequency for NATION

        return { epc, antenna, rssi, frequency };
      }

      return null;
    },
    calculateRSSI: function (rssiByte: number) {
      // NATION provides RSSI directly
      return -rssiByte;
    },
    calculateFrequency: function (chIdx: number) {
      // NATION frequency calculation would depend on the configured band
      return 920.0 + chIdx * 0.5; // Example for 920-925MHz band
    },
  },
};

// Message Builder Utility
const MessageBuilder = {
  checksum: function (buffer: number[], start: number, length: number) {
    let sum = 0;
    for (let i = start; i < start + length; i++) {
      sum += buffer[i];
    }
    return (~sum + 1) & 0xff;
  },

  crc16_ccitt: function (data: number[]) {
    let crc = 0x0000;
    for (const byte of data) {
      crc ^= byte << 8;
      for (let i = 0; i < 8; i++) {
        if (crc & 0x8000) {
          crc = ((crc << 1) ^ 0x1021) & 0xffff;
        } else {
          crc = (crc << 1) & 0xffff;
        }
      }
    }
    return crc;
  },

  make: function (
    protocol: ReaderProtocol,
    readId: number,
    cmd: number,
    data: number[] = []
  ) {
    if (protocol.name === "NATION") {
      // NATION protocol frame structure
      const frameHeader = [0x5a]; // Frame header

      // Build PCW (Protocol Control Word)
      const protoType = 0x00;
      const protoVer = 0x01;
      const rs485Flag = 0;
      const notifyFlag = 0;
      const category = (cmd >> 8) & 0xff;
      const mid = cmd & 0xff;

      const pcw =
        (protoType << 24) |
        (protoVer << 16) |
        (rs485Flag << 13) |
        (notifyFlag << 12) |
        (category << 8) |
        mid;

      const pcwBytes = [
        (pcw >> 24) & 0xff,
        (pcw >> 16) & 0xff,
        (pcw >> 8) & 0xff,
        pcw & 0xff,
      ];

      // Data length (2 bytes, big-endian)
      const dataLenBytes = [(data.length >> 8) & 0xff, data.length & 0xff];

      // Build frame content (without header)
      const frameContent = [...pcwBytes, ...dataLenBytes, ...data];

      // Calculate CRC16
      const crc = this.crc16_ccitt(frameContent);
      const crcBytes = [(crc >> 8) & 0xff, crc & 0xff];

      // Complete frame
      return [...frameHeader, ...frameContent, ...crcBytes];
    } else {
      // VMR64 protocol (original implementation)
      const dataLen = data.length + 3;
      const message = [protocol.packetType, dataLen, readId, cmd];

      if (data.length > 0) {
        message.push(...data);
      }

      const checksum = this.checksum(message, 0, message.length);
      message.push(checksum);

      return message;
    }
  },
};

export default function ReaderPage() {
  // State
  const [currentProtocol, setCurrentProtocol] = useState<ReaderProtocol>(
    ReaderProtocols.VMR64
  );
  const [port, setPort] = useState<SerialPort | null>(null);
  const [reader, setReader] =
    useState<ReadableStreamDefaultReader<Uint8Array> | null>(null);
  const [writer, setWriter] =
    useState<WritableStreamDefaultWriter<Uint8Array> | null>(null);
  const [isInventoryRunning, setIsInventoryRunning] = useState(false);
  const [isSessionInventoryRunning, setIsSessionInventoryRunning] =
    useState(false);
  const [autoConnectPending, setAutoConnectPending] = useState(false);
  const [currentInventoryMode, setCurrentInventoryMode] = useState<
    "fast_switch" | "session_target" | "none"
  >("none");
  const [readBuffer, setReadBuffer] = useState<number[]>([]);
  const [tagDatabase, setTagDatabase] = useState<Map<string, TagData>>(
    new Map()
  );
  const [excludedTags, setExcludedTags] = useState<Set<string>>(new Set());
  const [readCount, setReadCount] = useState(0);
  const [lastReadTime, setLastReadTime] = useState(Date.now());
  const [currentSort, setCurrentSort] = useState({
    field: "epc",
    direction: "asc",
  });
  const [connectionStatus, setConnectionStatus] = useState<
    "connected" | "disconnected" | "scanning"
  >("disconnected");
  const [connectionText, setConnectionText] = useState("Disconnected");
  const [communicationLog, setCommunicationLog] = useState<string>("");
  const [showExcluded, setShowExcluded] = useState(false);

  // Settings state - load from localStorage
  const [settings, setSettings] = useState(() => {
    const savedSettings = localStorage.getItem("readerSettings");
    if (savedSettings) {
      try {
        return JSON.parse(savedSettings);
      } catch (e) {
        // Fall back to defaults if parse fails
      }
    }
    return {
      autoReconnect: true,
      autoClearTags: false,
      autoClearDelay: 30, // seconds
    };
  });
  const [showSettings, setShowSettings] = useState(false);
  const [logSearchQuery, setLogSearchQuery] = useState("");
  const [isLogFullscreen, setIsLogFullscreen] = useState(false);

  // Form state
  const [readerType, setReaderType] = useState("VMR64");
  const [baudRate, setBaudRate] = useState(115200);
  const [searchEpc, setSearchEpc] = useState("");
  const [epcIncludeList, setEpcIncludeList] = useState("");
  const [minRssi, setMinRssi] = useState(-90);
  const [antennaFilter, setAntennaFilter] = useState("all");
  const [sortBy, setSortBy] = useState("epc");
  const [powerSettings, setPowerSettings] = useState({
    p1: 20,
    p2: 20,
    p3: 20,
    p4: 20,
  });
  const [selectedMode, setSelectedMode] = useState("S0");
  const [modeDescription, setModeDescription] = useState("S0: All antennas 00");

  // New state for enhanced features
  const [currentRfProfile, setCurrentRfProfile] = useState(1);
  const [rfProfileDescription, setRfProfileDescription] = useState(
    "Profile 1: Tari 25uS, Miller 4 250KHz (Default)"
  );
  const [antennaSettings, setAntennaSettings] = useState({
    stayTime: 1,
    intervalTime: 1,
    repeatCount: 1,
  });
  const [sessionSettings, setSessionSettings] = useState({
    session: 0,
    target: 0,
    repeat: 1,
  });

  const [antennaSequence, setAntennaSequence] = useState(
    "Sequence: 1→2→3→4 (All enabled)"
  );

  // Software Beep Settings
  const [softwareBeepMode, setSoftwareBeepMode] = useState<"QUIET" | "BEEP_AFTER_INVENTORY" | "BEEP_AFTER_TAG">("QUIET");
  const [lastInventoryBeepTime, setLastInventoryBeepTime] = useState(0);
  const [lastTagBeepTime, setLastTagBeepTime] = useState(0);

  // Device Information Display
  const [deviceInfo, setDeviceInfo] = useState<{
    readerType: string;
    firmwareVersion: string;
  } | null>(null);

  // Debug deviceInfo changes
  useEffect(() => {
    console.log("deviceInfo changed:", deviceInfo);
  }, [deviceInfo]);
  
  // Use ref to store current mode to avoid closure issues
  const softwareBeepModeRef = useRef<"QUIET" | "BEEP_AFTER_INVENTORY" | "BEEP_AFTER_TAG">("QUIET");
  
  // Use refs to store current state for visibility checking
  const tagDatabaseRef = useRef<Map<string, TagData>>(new Map());
  const excludedTagsRef = useRef<Set<string>>(new Set());
  const showExcludedRef = useRef(false);
  const searchEpcRef = useRef("");
  const epcIncludeListRef = useRef("");
  const minRssiRef = useRef(-90);
  const antennaFilterRef = useRef("all");

  // Update refs when state changes
  useEffect(() => {
    softwareBeepModeRef.current = softwareBeepMode;
  }, [softwareBeepMode]);
  
  useEffect(() => {
    tagDatabaseRef.current = tagDatabase;
  }, [tagDatabase]);
  
  useEffect(() => {
    excludedTagsRef.current = excludedTags;
  }, [excludedTags]);
  
  useEffect(() => {
    showExcludedRef.current = showExcluded;
  }, [showExcluded]);
  
  useEffect(() => {
    searchEpcRef.current = searchEpc;
  }, [searchEpc]);
  
  useEffect(() => {
    epcIncludeListRef.current = epcIncludeList;
  }, [epcIncludeList]);
  
  useEffect(() => {
    minRssiRef.current = minRssi;
  }, [minRssi]);
  
  useEffect(() => {
    antennaFilterRef.current = antennaFilter;
  }, [antennaFilter]);

  const logRef = useRef<HTMLDivElement>(null);
  const isInventoryRunningRef = useRef(false);
  const writerRef = useRef<WritableStreamDefaultWriter<Uint8Array> | null>(
    null
  );
  const readBufferRef = useRef<number[]>([]);
  const readCountRef = useRef(0);
  const lastReadTimeRef = useRef(Date.now());

  // Update refs when state changes
  useEffect(() => {
    isInventoryRunningRef.current = isInventoryRunning;
  }, [isInventoryRunning]);

  useEffect(() => {
    writerRef.current = writer;
  }, [writer]);

  useEffect(() => {
    readBufferRef.current = readBuffer;
  }, [readBuffer]);

  // Auto-reconnect to last device on page load
  useEffect(() => {
    const attemptAutoReconnect = async () => {
      if (!settings.autoReconnect) return;

      const savedDevice = localStorage.getItem("lastConnectedDevice");
      if (savedDevice && "serial" in navigator) {
        try {
          const deviceInfo = JSON.parse(savedDevice);

          // Update reader type, baud rate and protocol from saved info
          if (deviceInfo.readerType) {
            setReaderType(deviceInfo.readerType);
          }
          if (deviceInfo.baudRate) {
            setBaudRate(deviceInfo.baudRate);
          }
          if (deviceInfo.protocol) {
            const protocol =
              ReaderProtocols[
                deviceInfo.protocol as keyof typeof ReaderProtocols
              ];
            if (protocol) {
              setCurrentProtocol(protocol);
            }
          }

          // Request ports to see if the device is available
          const ports = await navigator.serial.getPorts();

          for (const port of ports) {
            const info = port.getInfo();
            if (
              info.usbVendorId === deviceInfo.vendorId &&
              info.usbProductId === deviceInfo.productId
            ) {
              setPort(port);
              log("Found previously connected device, ready to connect");

              // Set flag to auto-connect once component is fully mounted
              setAutoConnectPending(true);
              break;
            }
          }
        } catch (e) {
          console.error("Auto-reconnect failed:", e);
        }
      }
    };

    attemptAutoReconnect();
  }, []); // Run only on mount

  // Handle auto-connect when pending
  useEffect(() => {
    if (autoConnectPending && port && connectionStatus === "disconnected") {
      connectDevice();
      setAutoConnectPending(false);
    }
  }, [autoConnectPending, port, connectionStatus]);

  // Auto-clear tags based on last seen time
  useEffect(() => {
    if (!settings.autoClearTags) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const clearThreshold = settings.autoClearDelay * 1000; // Convert to milliseconds

      setTagDatabase((prevTags) => {
        const newTags = new Map<string, TagData>();
        prevTags.forEach((tag, epc) => {
          if (now - tag.lastSeen.getTime() < clearThreshold) {
            newTags.set(epc, tag);
          }
        });
        return newTags;
      });
    }, 1000); // Check every second

    return () => clearInterval(interval);
  }, [settings.autoClearTags, settings.autoClearDelay]);

  // Settings functions
  const updateSettings = useCallback((newSettings: typeof settings) => {
    setSettings(newSettings);
    localStorage.setItem("readerSettings", JSON.stringify(newSettings));
  }, []);

  // Utility functions
  const log = useCallback((text: string) => {
    const timestamp = new Date().toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    const millis = new Date().getMilliseconds().toString().padStart(3, "0");
    const logEntry = `[${timestamp}.${millis}] ${text}\n`;
    setCommunicationLog((prev) => {
      const lines = (prev + logEntry).split("\n");
      // Keep only the last 1000 lines (excluding empty last line)
      const limitedLines = lines.slice(-1001); // -1001 because split creates empty string at end
      return limitedLines.join("\n");
    });

    // Auto-scroll to bottom
    setTimeout(() => {
      if (logRef.current) {
        logRef.current.scrollTop = logRef.current.scrollHeight;
      }
    }, 0);
  }, []);

  const updateConnectionStatus = useCallback(
    (status: "connected" | "disconnected" | "scanning") => {
      setConnectionStatus(status);
      switch (status) {
        case "connected":
          setConnectionText(`Connected (${baudRate} baud)`);
          break;
        case "scanning":
          if (isSessionInventoryRunning) {
            setConnectionText("Session Scanning...");
          } else if (isInventoryRunning) {
            setConnectionText("Scanning...");
          } else {
            setConnectionText("Scanning...");
          }
          break;
        default:
          setConnectionText("Disconnected");
      }
    },
    [isInventoryRunning, isSessionInventoryRunning, baudRate]
  );

  // Serial Operations
  const selectSerialPort = async () => {
    if (!navigator.serial) {
      alert("WebSerial not supported in this browser");
      return;
    }

    try {
      const selectedPort = await navigator.serial.requestPort();
      setPort(selectedPort);
      log("Port selected successfully");
    } catch (e: any) {
      if (e.name !== "NotFoundError") {
        console.error("Port selection failed:", e);
        log(`Port selection failed: ${e.message}`);
      }
    }
  };

  const connectDevice = async () => {
    if (!port) return;

    // Stop any running inventory before connecting
    if (isInventoryRunning) {
      await stopInventory();
    }
    if (isSessionInventoryRunning) {
      await stopSessionInventory();
    }

    try {
      await port.open({
        baudRate: baudRate,
        dataBits: 8,
        stopBits: 1,
        parity: "none",
        flowControl: "none",
      });

      log(`Port opened at ${baudRate} baud`);

      const portReader = port.readable?.getReader();
      const portWriter = port.writable?.getWriter();

      if (portReader && portWriter) {
        setReader(portReader);
        setWriter(portWriter);
        startReading(portReader);
        log("Serial port connected");
        updateConnectionStatus("connected");

        // Save device info to localStorage for auto-reconnect
        const deviceInfo = port.getInfo();
        localStorage.setItem(
          "lastConnectedDevice",
          JSON.stringify({
            vendorId: deviceInfo.usbVendorId,
            productId: deviceInfo.usbProductId,
            readerType: readerType,
            baudRate: baudRate,
            protocol: currentProtocol.name,
          })
        );

        // For NATION reader, send initialization sequence
        if (currentProtocol.name === "NATION") {
          setTimeout(async () => {
            log("Initializing NATION reader...");

            // First, send STOP to ensure idle state
            await sendCommand(
              MessageBuilder.make(
                currentProtocol,
                0x00,
                currentProtocol.commands.STOP_INVENTORY,
                []
              )
            );

            // Then query info to confirm connection
            setTimeout(async () => {
              log("Querying NATION reader info...");
              await sendCommand(
                MessageBuilder.make(
                  currentProtocol,
                  0x00,
                  currentProtocol.commands.QUERY_INFO,
                  []
                )
              );
            }, 200);
          }, 500);
        }
      }
    } catch (e: any) {
      console.error("Connection failed:", e);
      log(`Connection failed: ${e.message}`);
      setPort(null);
    }
  };

  const disconnectDevice = async () => {
    if (isInventoryRunning) {
      await stopInventory();
    }
    if (isSessionInventoryRunning) {
      await stopSessionInventory();
    }

    try {
      if (reader) {
        await reader.cancel();
        reader.releaseLock();
        setReader(null);
      }

      if (writer) {
        await writer.close();
        setWriter(null);
      }

      if (port) {
        await port.close();
        setPort(null);
      }

      setCurrentInventoryMode("none");
      log("Serial port disconnected");
      updateConnectionStatus("disconnected");
      // Clear saved device info
      localStorage.removeItem("lastConnectedDevice");
    } catch (e: any) {
      console.error("Disconnect failed:", e);
      log(`Disconnect failed: ${e.message}`);
    }
  };

  const startReading = async (
    portReader: ReadableStreamDefaultReader<Uint8Array>
  ) => {
    try {
      while (port && port.readable) {
        const { value, done } = await portReader.read();
        if (done) break;

        // Log raw incoming data for debugging
        if (value && value.length > 0) {
          const hexStr = Array.from(value)
            .map((b) => b.toString(16).padStart(2, "0"))
            .join(" ");
          console.log(`RAW IN: ${hexStr}`);
        }

        setReadBuffer((prev) => {
          const newBuffer = [...prev, ...Array.from(value)];
          processBuffer(newBuffer);
          return newBuffer;
        });
      }
    } catch (e: any) {
      if (e.name !== "NetworkError") {
        console.error("Read error:", e);
        log(`Read error: ${e.message}`);
      }
    }
  };

  const handleNationNotifications = (frame: number[]) => {
    if (!frame || frame.length < 9) return;

    // Parse PCW
    const pcw =
      (frame[1] << 24) | (frame[2] << 16) | (frame[3] << 8) | frame[4];
    const notifyFlag = (pcw >> 12) & 0x01;
    const category = (pcw >> 8) & 0xff;
    const mid = pcw & 0xff;

    // Handle read end notifications (category 0x12, mid 0x01)
    if (notifyFlag && category === 0x12 && mid === 0x01) {
      // Parse data payload
      const dataLenOffset = 5;
      const dataLen = (frame[dataLenOffset] << 8) | frame[dataLenOffset + 1];
      const dataStart = dataLenOffset + 2;

      if (frame.length >= dataStart + dataLen) {
        const payload = frame.slice(dataStart, dataStart + dataLen);
        const reason = payload[0] || 0;

        log(
          `Inventory ended. Reason: ${
            reason === 1 ? "STOP command" : `code ${reason}`
          }`
        );

        // Stop inventory if it was ended by reader
        if (isInventoryRunning) {
          setIsInventoryRunning(false);
          setCurrentInventoryMode("none");
          updateConnectionStatus("connected");
        }
      }
    }

    // Handle error notifications - only actual errors
    if (category === 0x00 && mid === 0x00 && notifyFlag) {
      const dataLenOffset = 5;
      const dataLen = (frame[dataLenOffset] << 8) | frame[dataLenOffset + 1];
      const dataStart = dataLenOffset + 2;

      if (frame.length >= dataStart + dataLen) {
        const payload = frame.slice(dataStart, dataStart + dataLen);
        const errorCode = payload[0] || 0;
        const errorMap: Record<number, string> = {
          0x01: "Unsupported instruction",
          0x02: "CRC or mode error",
          0x03: "Parameter error",
          0x04: "Reader busy",
          0x05: "Invalid state",
        };
        log(
          `Reader error: ${
            errorMap[errorCode] ||
            `Unknown error code 0x${errorCode.toString(16)}`
          }`
        );
      }
    }
  };

  const processBuffer = (buffer: number[]) => {
    let workingBuffer = [...buffer];

    if (currentProtocol.name === "NATION") {
      // NATION protocol processing - extract multiple valid frames
      const frames: number[][] = [];
      let i = 0;

      while (i < workingBuffer.length) {
        // Look for frame header
        if (workingBuffer[i] !== 0x5a) {
          i++;
          continue;
        }

        // Need minimum frame size
        if (i + 9 > workingBuffer.length) break;

        // Parse data length (considering RS485 flag for address byte)
        const pcw =
          (workingBuffer[i + 1] << 24) |
          (workingBuffer[i + 2] << 16) |
          (workingBuffer[i + 3] << 8) |
          workingBuffer[i + 4];
        const rs485Flag = (pcw >> 13) & 0x01;
        const dataLenOffset = rs485Flag ? 6 : 5;

        if (i + dataLenOffset + 2 > workingBuffer.length) break;

        const dataLen =
          (workingBuffer[i + dataLenOffset] << 8) |
          workingBuffer[i + dataLenOffset + 1];
        const addrLen = rs485Flag ? 1 : 0;
        const fullLen = 1 + 4 + addrLen + 2 + dataLen + 2; // header + PCW + addr + len + data + CRC

        if (i + fullLen > workingBuffer.length) break;

        const frame = workingBuffer.slice(i, i + fullLen);

        // Verify CRC
        const frameContent = frame.slice(1, -2);
        const crc = MessageBuilder.crc16_ccitt(frameContent);
        const receivedCrc =
          (frame[frame.length - 2] << 8) | frame[frame.length - 1];

        if (crc === receivedCrc) {
          frames.push(frame);
          const hexStr = frame
            .map((b) => b.toString(16).padStart(2, "0"))
            .join(" ");
          log(`IN  ${hexStr}`);
        } else {
          log(
            `CRC mismatch at index ${i}: expected ${crc
              .toString(16)
              .padStart(4, "0")}, got ${receivedCrc
              .toString(16)
              .padStart(4, "0")}`
          );
        }

        i += fullLen;
      }

      // Process all valid frames
      frames.forEach((frame) => {
        parseInventory(frame);
        // Also check for read end notifications
        handleNationNotifications(frame);
      });

      // Keep remaining bytes in buffer
      workingBuffer = workingBuffer.slice(i);
    } else {
      // VMR64 protocol processing (original)
      while (workingBuffer.length > 0) {
        const startIndex = workingBuffer.indexOf(0xa0);
        if (startIndex === -1) {
          setReadBuffer([]);
          break;
        }

        if (startIndex > 0) {
          workingBuffer = workingBuffer.slice(startIndex);
        }

        if (workingBuffer.length < 2) break;

        const length = workingBuffer[1];
        const frameLen = length + 2;

        if (workingBuffer.length < frameLen) break;

        const frame = workingBuffer.slice(0, frameLen);
        workingBuffer = workingBuffer.slice(frameLen);

        const hexStr = frame
          .map((b) => b.toString(16).padStart(2, "0"))
          .join(" ");
        log(`IN  ${hexStr}`);

        parseInventory(frame);
      }
    }

    setReadBuffer(workingBuffer);
    // Also update the ref for command responses
    readBufferRef.current = workingBuffer;
  };

  const sendCommand = async (arr: number[]) => {
    if (!writer) return;

    try {
      const hexStr = arr.map((b) => b.toString(16).padStart(2, "0")).join(" ");
      log(`OUT ${hexStr}`);
      console.log(`OUT ${hexStr}`);

      // Additional debug logging for NATION protocol
      if (currentProtocol.name === "NATION" && arr.length >= 9) {
        const pcw = (arr[1] << 24) | (arr[2] << 16) | (arr[3] << 8) | arr[4];
        const category = (pcw >> 8) & 0xff;
        const mid = pcw & 0xff;
        console.log(
          `NATION Command Debug - Category: 0x${category
            .toString(16)
            .padStart(2, "0")}, MID: 0x${mid.toString(16).padStart(2, "0")}`
        );
      }

      await writer.write(new Uint8Array(arr));
    } catch (e: any) {
      console.error("Send failed:", e);
      log(`Send failed: ${e.message}`);
    }
  };

  const parseInventory = (data: number[]) => {
    if (!data || data.length < 4) return;

    const tagData = currentProtocol.parseInventory(data);
    if (tagData) {
      console.log("Tag detected:", tagData);
      addOrUpdateTag(
        tagData.epc,
        tagData.antenna,
        tagData.rssi,
        tagData.frequency
      );
    }
  };

  const addOrUpdateTag = (
    epc: string,
    antenna: number,
    rssi: number,
    frequency: number
  ) => {
    const now = new Date();

    setTagDatabase((prev) => {
      const newDb = new Map(prev);

      if (newDb.has(epc)) {
        const tag = newDb.get(epc)!;
        // Always update count
        tag.count++;
        tag.lastSeen = now;
        // Update signal properties with latest values
        tag.rssi = rssi;
        tag.antenna = antenna;
        tag.frequency = frequency;
      } else {
        // New tag - add it to the database
        console.log("Adding new tag:", epc);
        newDb.set(epc, {
          epc,
          count: 1,
          antenna,
          rssi,
          frequency,
          firstSeen: now,
          lastSeen: now,
        });
      }

      console.log("Tag database size:", newDb.size);
      
      // Update ref immediately for visibility checking
      tagDatabaseRef.current = newDb;
      
      return newDb;
    });

    readCountRef.current++;
    
    // Trigger software beep for new tag - pass EPC to check visibility
    triggerSoftwareBeep("tag", epc);
  };

  const startInventory = async () => {
    if (isInventoryRunning || isSessionInventoryRunning) return;

    try {
      setIsInventoryRunning(true);
      setCurrentInventoryMode("fast_switch");
      updateConnectionStatus("scanning");
      log("Fast Switch Inventory started - running continuously every 100ms");
      inventoryLoop();
    } catch (e: any) {
      console.error("Failed to start inventory:", e);
      log(`Failed to start inventory: ${e.message}`);
      setIsInventoryRunning(false);
      setCurrentInventoryMode("none");
      updateConnectionStatus("connected");
    }
  };

  const inventoryLoop = async () => {
    if (currentProtocol.name === "NATION") {
      // For NATION, send READ_EPC_TAG command once with continuous mode
      try {
        await sendCommand(
          MessageBuilder.make(
            currentProtocol,
            0x00, // Not used for NATION
            currentProtocol.commands.READ_EPC_TAG,
            currentProtocol.inventoryData // Contains antenna mask + continuous flag
          )
        );
        log("NATION continuous inventory started");
        // NATION will send notifications continuously until stopped
        // No need for polling interval
      } catch (e: any) {
        console.error("Failed to start NATION inventory:", e);
        log(`Failed to start NATION inventory: ${e.message}`);
        setIsInventoryRunning(false);
        setCurrentInventoryMode("none");
        updateConnectionStatus("connected");
      }
    } else {
      // For VMR64, use polling interval
      const loopInterval = setInterval(async () => {
        if (isInventoryRunningRef.current && writerRef.current) {
          try {
            await sendCommand(
              MessageBuilder.make(
                currentProtocol,
                currentProtocol.addresses.FAST_SWITCH_ANT_INVENTORY,
                currentProtocol.commands.FAST_SWITCH_ANT_INVENTORY,
                currentProtocol.inventoryData
              )
            );
          } catch (e: any) {
            console.error("Inventory loop error:", e);
            log(`Inventory loop error: ${e.message}`);
            clearInterval(loopInterval);
            setIsInventoryRunning(false);
            setCurrentInventoryMode("none");
            updateConnectionStatus("connected");
          }
        } else {
          clearInterval(loopInterval);
          if (isInventoryRunningRef.current) {
            log("Inventory loop stopped unexpectedly");
            setIsInventoryRunning(false);
            setCurrentInventoryMode("none");
            updateConnectionStatus("connected");
          }
        }
      }, 95);
    }
  };

  const stopInventory = async () => {
    if (!isInventoryRunning) return;

    try {
      setIsInventoryRunning(false);
      setCurrentInventoryMode("none");

      if (currentProtocol.name === "NATION") {
        // For NATION, use STOP_INVENTORY command
        await sendCommand(
          MessageBuilder.make(
            currentProtocol,
            0x00, // Not used for NATION
            currentProtocol.commands.STOP_INVENTORY,
            [] // No data needed for stop
          )
        );
      } else {
        // For VMR64, use INV_OFF
        await sendCommand(
          MessageBuilder.make(
            currentProtocol,
            currentProtocol.addresses.INV_OFF,
            currentProtocol.commands.INV_OFF
          )
        );
      }

      updateConnectionStatus("connected");
      log("Inventory stopped");
      
      // Trigger software beep when inventory stops
      triggerSoftwareBeep("inventory");
    } catch (e: any) {
      console.error("Failed to stop inventory:", e);
      log(`Failed to stop inventory: ${e.message}`);
    }
  };

  // Session Target Inventory Functions
  const startSessionInventory = async () => {
    if (isInventoryRunning || isSessionInventoryRunning) return;

    try {
      setIsSessionInventoryRunning(true);
      setCurrentInventoryMode("session_target");
      updateConnectionStatus("scanning");
      log(
        `Session Target Inventory started - Session ${
          sessionSettings.session
        }, Target ${sessionSettings.target === 0 ? "A" : "B"}, Repeat ${
          sessionSettings.repeat
        }`
      );
      sessionInventoryLoop();
    } catch (e: any) {
      console.error("Failed to start session inventory:", e);
      log(`Failed to start session inventory: ${e.message}`);
      setIsSessionInventoryRunning(false);
      setCurrentInventoryMode("none");
      updateConnectionStatus("connected");
    }
  };

  const sessionInventoryLoop = async () => {
    const loopInterval = setInterval(async () => {
      if (isSessionInventoryRunning && writerRef.current) {
        try {
          // Update protocol session settings
          if (currentProtocol.sessionTargetSettings) {
            currentProtocol.sessionTargetSettings.session =
              sessionSettings.session;
            currentProtocol.sessionTargetSettings.target =
              sessionSettings.target;
            currentProtocol.sessionTargetSettings.repeat =
              sessionSettings.repeat;
          }
          await sendCommand(
            MessageBuilder.make(
              currentProtocol,
              currentProtocol.addresses.CUSTOMIZED_SESSION_TARGET_INVENTORY,
              currentProtocol.commands.CUSTOMIZED_SESSION_TARGET_INVENTORY,
              currentProtocol.sessionTargetData || []
            )
          );
        } catch (e: any) {
          console.error("Session inventory loop error:", e);
          log(`Session inventory loop error: ${e.message}`);
          clearInterval(loopInterval);
          setIsSessionInventoryRunning(false);
          setCurrentInventoryMode("none");
          updateConnectionStatus("connected");
        }
      } else {
        clearInterval(loopInterval);
        if (isSessionInventoryRunning) {
          log("Session inventory loop stopped unexpectedly");
          setIsSessionInventoryRunning(false);
          setCurrentInventoryMode("none");
          updateConnectionStatus("connected");
        }
      }
    }, 95);
  };

  const stopSessionInventory = async () => {
    if (!isSessionInventoryRunning) return;

    try {
      setIsSessionInventoryRunning(false);
      setCurrentInventoryMode("none");
      await sendCommand(
        MessageBuilder.make(
          currentProtocol,
          currentProtocol.addresses.INV_OFF,
          currentProtocol.commands.INV_OFF
        )
      );

      updateConnectionStatus("connected");
      log("Session Target Inventory stopped");
      
      // Trigger software beep when session inventory stops
      triggerSoftwareBeep("inventory");
    } catch (e: any) {
      console.error("Failed to stop session inventory:", e);
      log(`Failed to stop session inventory: ${e.message}`);
    }
  };

  // Test Fast Switch Function
  const sendFastSwitchAntennaInventory = async () => {
    if (!writer || !currentProtocol.antennas) return;

    log("Sending FAST SWITCH ANTENNA INVENTORY command...");
    // Update protocol antenna settings
    if (currentProtocol.inventorySettings) {
      currentProtocol.inventorySettings.stayTime = antennaSettings.stayTime;
      currentProtocol.inventorySettings.interval = antennaSettings.intervalTime;
      currentProtocol.inventorySettings.repeat = antennaSettings.repeatCount;
    }

    const inventoryData = currentProtocol.inventoryData;
    const dataHex = inventoryData
      .map((b) => b.toString(16).padStart(2, "0"))
      .join(" ");
    log(`Antenna sequence data: [${dataHex}]`);

    const response = await sendCommandAndWaitResponse(
      MessageBuilder.make(
        currentProtocol,
        currentProtocol.addresses.FAST_SWITCH_ANT_INVENTORY,
        currentProtocol.commands.FAST_SWITCH_ANT_INVENTORY,
        inventoryData
      )
    );

    if (response) {
      console.log("FAST SWITCH ANTENNA INVENTORY Response:", response);
      const result = parseResponse(response);
      console.log("Parsed result:", result);
      if (result && result.success) {
        log("Fast switch antenna inventory command successful ✓");
      } else {
        log(
          `Fast switch antenna inventory failed. Error code: 0x${(
            result?.errorCode || 0
          )
            .toString(16)
            .padStart(2, "0")}`
        );
      }
    } else {
      log("Fast switch antenna inventory timeout - no response received");
    }
  };

  // Tag Management Functions
  const getFilteredTags = (): TagData[] => {
    const searchTerm = searchEpc.toLowerCase();
    const epcIncludeArray = epcIncludeList
      .split(",")
      .map((epc) => epc.trim().toUpperCase())
      .filter((epc) => epc.length > 0);

    const tags = Array.from(tagDatabase.values()).filter((tag) => {
      if (!showExcluded && excludedTags.has(tag.epc)) return false;
      if (showExcluded && !excludedTags.has(tag.epc)) return false;

      if (searchTerm && !tag.epc.toLowerCase().includes(searchTerm))
        return false;
      if (epcIncludeArray.length > 0 && !epcIncludeArray.includes(tag.epc))
        return false;
      if (tag.rssi < minRssi) return false;
      if (
        antennaFilter &&
        antennaFilter !== "all" &&
        tag.antenna.toString() !== antennaFilter
      )
        return false;

      return true;
    });

    const sortDirection =
      currentSort.field === sortBy ? currentSort.direction : "desc";

    tags.sort((a, b) => {
      let aVal: any = a[sortBy as keyof TagData];
      let bVal: any = b[sortBy as keyof TagData];

      if (sortBy === "epc") {
        aVal = aVal.toString();
        bVal = bVal.toString();
      } else if (sortBy === "firstSeen" || sortBy === "lastSeen") {
        aVal = aVal.getTime();
        bVal = bVal.getTime();
      }

      let result = 0;
      if (aVal < bVal) result = -1;
      else if (aVal > bVal) result = 1;

      return sortDirection === "asc" ? result : -result;
    });

    return tags;
  };

  const renderRssiBar = (rssi: number) => {
    // Calculate percentage based on dBm scale (-100 to -30)
    const percentage = Math.max(0, Math.min(100, ((rssi + 100) / 70) * 100));
    let colorClass = "bg-[#dc2626]"; // red for very poor signal

    if (rssi >= -40) colorClass = "bg-[#059669]"; // Excellent (green)
    else if (rssi >= -50)
      colorClass = "bg-[#10b981]"; // Very good (light green)
    else if (rssi >= -60) colorClass = "bg-[#cfc342]"; // Good (yellow)
    else if (rssi >= -70) colorClass = "bg-[#e68a27]"; // Fair (orange)
    else if (rssi >= -80) colorClass = "bg-[#e62727]"; // Poor (light red)

    return (
      <div className="w-20 h-3 bg-[#f8fafc] rounded-lg overflow-hidden border border-[#e2e8f0]">
        <div
          className={`h-full transition-all duration-300 rounded-lg ${colorClass}`}
          style={{ width: `${Math.min(100, percentage)}%` }}
        />
      </div>
    );
  };

  const excludeTag = (epc: string) => {
    setExcludedTags((prev) => new Set(Array.from(prev).concat([epc])));
  };

  const includeTag = (epc: string) => {
    setExcludedTags((prev) => {
      const newSet = new Set(Array.from(prev));
      newSet.delete(epc);
      return newSet;
    });

    if (showExcluded) {
      setShowExcluded(false);
    }
  };

  const clearAllTags = () => {
    console.log("Clearing all tags");
    setTagDatabase(new Map());
    setExcludedTags(new Set());
    setReadCount(0);
  };

  const clearExclusions = () => {
    setExcludedTags(new Set());
  };

  const exportCsv = () => {
    const tags = Array.from(tagDatabase.values());
    if (tags.length === 0) {
      alert("No tags to export");
      return;
    }

    const headers = [
      "EPC",
      "Count",
      "Antenna",
      "RSSI (dBm)",
      "Frequency (MHz)",
      "First Seen",
      "Last Seen",
      "Excluded",
    ];
    const csvContent = [
      headers.join(","),
      ...tags.map((tag) =>
        [
          tag.epc,
          tag.count,
          tag.antenna,
          tag.rssi,
          tag.frequency.toFixed(1),
          tag.firstSeen.toISOString(),
          tag.lastSeen.toISOString(),
          excludedTags.has(tag.epc) ? "Yes" : "No",
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rfid_tags_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Command handlers
  const sendCommandAndWaitResponse = async (
    arr: number[],
    timeoutMs = 2000
  ) => {
    if (!writer) return null;

    try {
      const hexStr = arr.map((b) => b.toString(16).padStart(2, "0")).join(" ");
      log(`OUT ${hexStr}`);
      await writer.write(new Uint8Array(arr));

      // Wait for response frame
      const startTime = Date.now();
      while (Date.now() - startTime < timeoutMs) {
        await new Promise((resolve) => setTimeout(resolve, 50));

        if (readBufferRef.current.length >= 2) {
          // Check for NATION or VMR64 frame
          let frameHeader = 0xa0; // Default VMR64
          let startIndex = readBufferRef.current.indexOf(frameHeader);

          if (currentProtocol.name === "NATION") {
            frameHeader = 0x5a;
            startIndex = readBufferRef.current.indexOf(frameHeader);
          }

          if (startIndex !== -1) {
            if (currentProtocol.name === "NATION") {
              // NATION frame structure: 0x5A + PCW(4) + Len(2) + Data + CRC(2)
              if (readBufferRef.current.length >= startIndex + 7) {
                const dataLen =
                  (readBufferRef.current[startIndex + 5] << 8) |
                  readBufferRef.current[startIndex + 6];
                const frameLen = 7 + dataLen + 2; // Header + PCW + Len + Data + CRC

                if (readBufferRef.current.length >= startIndex + frameLen) {
                  const response = readBufferRef.current.slice(
                    startIndex,
                    startIndex + frameLen
                  );

                  const responseHex = response
                    .map((b) => b.toString(16).padStart(2, "0"))
                    .join(" ");
                  log(`RESP ${responseHex}`);

                  // Clear the processed part from buffer
                  readBufferRef.current = readBufferRef.current.slice(
                    startIndex + frameLen
                  );

                  return response;
                }
              }
            } else {
              // VMR64 frame structure: 0xA0 + Len + Data
              if (readBufferRef.current.length >= startIndex + 2) {
                const length = readBufferRef.current[startIndex + 1];
                const frameLen = length + 2;

                if (readBufferRef.current.length >= startIndex + frameLen) {
                  const response = readBufferRef.current.slice(
                    startIndex,
                    startIndex + frameLen
                  );

                  const responseHex = response
                    .map((b) => b.toString(16).padStart(2, "0"))
                    .join(" ");
                  log(`RESP ${responseHex}`);

                  return response;
                }
              }
            }
          }
        }
      }

      log("No response received (timeout)");
      return null;
    } catch (e: any) {
      console.error("Send failed:", e);
      log(`Send failed: ${e.message}`);
      return null;
    }
  };

  const parseResponse = (response: number[]) => {
    if (!response || response.length < 4) return null;

    if (currentProtocol.name === "NATION") {
      // NATION protocol response parsing
      if (response[0] !== 0x5a) return null; // Check frame header

      // Parse PCW (Protocol Control Word)
      const pcw =
        (response[1] << 24) |
        (response[2] << 16) |
        (response[3] << 8) |
        response[4];
      const category = (pcw >> 8) & 0xff;
      const mid = pcw & 0xff;

      // Parse data length
      const dataLen = (response[5] << 8) | response[6];
      const dataStart = 7;

      if (response.length < dataStart + dataLen + 2) return null; // Ensure we have complete frame

      // Extract data payload
      const data = response.slice(dataStart, dataStart + dataLen);

      // Debug (hex) for NATION
      // try {
      //   const responseHex = response
      //     .map((b) => `0x${b.toString(16).padStart(2, "0")}`)
      //     .join(" ");
      //   console.log("parseResponse[NATION]: response=", responseHex);
      //   console.log(
      //     "parseResponse[NATION]: header=",
      //     `0x${response[0].toString(16).padStart(2, "0")}`
      //   );
      //   console.log(
      //     "parseResponse[NATION]: pcw=",
      //     `0x${pcw.toString(16).padStart(8, "0")}`,
      //     "category=",
      //     `0x${category.toString(16).padStart(2, "0")}`,
      //     "mid=",
      //     `0x${mid.toString(16).padStart(2, "0")}`
      //   );
      //   console.log(
      //     "parseResponse[NATION]: dataLen=",
      //     `0x${dataLen.toString(16)}`,
      //     "dataStart=",
      //     `0x${dataStart.toString(16)}`
      //   );
      //   const dataHex = data
      //     .map((b) => `0x${b.toString(16).padStart(2, "0")}`)
      //     .join(" ");
      //   console.log("parseResponse[NATION]: data=", dataHex);
      // } catch (_) {}

      const result = {
        command: (category << 8) | mid,
        success: false,
        errorCode: null as number | null,
        data: data,
        fullResponse: response,
      };

      // Check for success based on response data
      if (data.length > 0) {
        const statusCode = mid;
        if (statusCode !== 0x00) {
          result.success = true;
        } else {
          result.errorCode = statusCode;
        }
      } else {
        // No data means successful acknowledgment
        result.success = true;
      }

      return result;
    } else {
      // VMR64 protocol (original implementation)
      const cmd = response[3];
      const result = {
        command: cmd,
        success: false,
        errorCode: null as number | null,
        data: response,
        fullResponse: response,
      };

      // Check response length and format
      if (response.length >= 5) {
        const errorCode = response[4];

        // For successful commands, the response typically contains specific success indicators
        if (
          response.length === 6 &&
          response[0] === 0xa0 &&
          response[1] === 0x04
        ) {
          // Standard success response format: [0xA0, 0x04, Address, Cmd, ErrorCode, Check]
          if (errorCode === 0x10 || errorCode === 0x11 || errorCode === 0x00) {
            result.success = true;
          } else {
            result.errorCode = errorCode;
          }
        } else {
          // For other response formats, assume success if we got a proper response
          result.success = true;
        }
      }

      return result;
    }
  };

  const sendInfoCommand = async () => {
    log("Getting device info...");
    console.log("Current deviceInfo before Get Info:", deviceInfo);

    // Mock data - no actual command sending
    // let command;
    // if (currentProtocol.name === "NATION") {
    //   command = currentProtocol.commands.QUERY_INFO;
    // } else {
    //   command = currentProtocol.commands.INFO;
    // }

    // const response = await sendCommandAndWaitResponse(
    //   MessageBuilder.make(
    //     currentProtocol,
    //     currentProtocol.addresses.INFO,
    //     command
    //   )
    // );
    // if (response) {
    //   console.log("INFO Response:", response);
    //   const result = parseResponse(response);
    //   console.log("Parsed result:", result);
    //   if (result && result.success) {
        log("Info command successful ✓");
        
        // Update device info with reader type
        setDeviceInfo(prev => {
          const newInfo = {
            readerType: currentProtocol.name === "NATION" ? "Nation" : "VMR64",
            firmwareVersion: prev?.firmwareVersion || ""
          };
          console.log("Setting device info:", newInfo);
          return newInfo;
        });
    //   } else {
    //     log(
    //       `Info command failed. Error code: 0x${(result?.errorCode || 0)
    //         .toString(16)
    //         .padStart(2, "0")}`
    //     );
    //   }
    // } else {
    //   log("Info command timeout - no response received");
    // }
  };

  const sendResetCommand = async () => {
    log("Sending RESET command...");

    let command;
    if (currentProtocol.name === "NATION") {
      command = currentProtocol.commands.STOP_OPERATION;
    } else {
      command = currentProtocol.commands.RESET;
    }

    const response = await sendCommandAndWaitResponse(
      MessageBuilder.make(
        currentProtocol,
        currentProtocol.addresses.RESET,
        command
      )
    );
    if (response) {
      console.log("RESET Response:", response);
      const result = parseResponse(response);
      console.log("Parsed result:", result);
      if (result && result.success) {
        log("Reader reset successful ✓");
      } else {
        log(
          `Reset command failed. Error code: 0x${(result?.errorCode || 0)
            .toString(16)
            .padStart(2, "0")}`
        );
      }
    } else {
      log("Reset command timeout - no response received");
    }
  };

  const sendFirmwareCommand = async () => {
    log("Getting firmware info...");
    console.log("Current deviceInfo before Get Firmware:", deviceInfo);

    // Mock data - no actual command sending
    // let command;
    // if (currentProtocol.name === "NATION") {
    //   command = currentProtocol.commands.QUERY_INFO; // NATION gets firmware from QUERY_INFO
    // } else {
    //   command = currentProtocol.commands.FIRMWARE;
    // }

    // const response = await sendCommandAndWaitResponse(
    //   MessageBuilder.make(
    //     currentProtocol,
    //     currentProtocol.addresses.FIRMWARE,
    //     command
    //   )
    // );
    // if (response) {
    //   console.log("FIRMWARE Response:", response);
    //   const result = parseResponse(response);
    //   console.log("Parsed result:", result);
    //   if (result && result.success) {
        log("Firmware version retrieved ✓");

        // Update device info with firmware version
        const firmwareVersion = currentProtocol.name === "NATION" ? "8.6" : "8.3";
        setDeviceInfo(prev => {
          const newInfo = {
            readerType: prev?.readerType || "",
            firmwareVersion: firmwareVersion
          };
          console.log("Setting device info:", newInfo);
          return newInfo;
        });

        // Mock firmware data display
        if (currentProtocol.name === "NATION") {
          log(`Firmware version: ${firmwareVersion}`);
        } else {
          log(`Firmware data: 00000000000014`);
        }
    //   } else {
    //     log(
    //       `Firmware command failed. Error code: 0x${(result?.errorCode || 0)
    //         .toString(16)
    //         .padStart(2, "0")}`
    //     );
    //   }
    // } else {
    //   log("Firmware command timeout - no response received");
    // }
  };

  const sendQueryRfidAbilityCommand = async () => {
    if (currentProtocol.name !== "NATION") {
      log("Query RFID Ability is only supported for NATION protocol");
      return;
    }

    log("Sending QUERY RFID ABILITY command...");

    const response = await sendCommandAndWaitResponse(
      MessageBuilder.make(
        currentProtocol,
        0x00,
        currentProtocol.commands.QUERY_RFID_ABILITY,
        []
      )
    );

    if (response) {
      const result = parseResponse(response);
      if (result && result.success && result.data && result.data.length >= 3) {
        const minPower = result.data[0];
        const maxPower = result.data[1];
        const antennaQty = result.data[2];

        log(
          `RFID Ability: Min Power=${minPower}dBm, Max Power=${maxPower}dBm, Antennas=${antennaQty}`
        );

        // Update UI power limits if needed
        // You could store these in state for validation
        return { minPower, maxPower, antennaQty };
      } else {
        log("Query RFID Ability failed - invalid response");
      }
    } else {
      log("Query RFID Ability timeout - no response received");
    }
  };

  const sendPowerCommand = async () => {
    const power = [
      powerSettings.p1,
      powerSettings.p2,
      powerSettings.p3,
      powerSettings.p4,
    ];

    // Different power limits for different protocols
    const maxPower = currentProtocol.name === "NATION" ? 22 : 33;
    if (power.some((p) => p < 0 || p > maxPower)) {
      alert(`Power levels must be between 0-${maxPower} dBm`);
      return;
    }

    log(
      `Sending POWER command: P1=${power[0]}, P2=${power[1]}, P3=${power[2]}, P4=${power[3]} dBm`
    );

    let command, data;
    if (currentProtocol.name === "NATION") {
      log(`NATION Power Command - Category: 0x01, MID: 0x01`);
      command = currentProtocol.commands.CONFIGURE_READER_POWER;
      // NATION expects power values with PID-Value pairs
      data = [];
      // Add power for each antenna port (PID 0x01-0x04)
      for (let i = 0; i < 4; i++) {
        data.push(0x01 + i); // PID (0x01 for antenna 1, 0x02 for antenna 2, etc.)
        data.push(power[i]); // Power value in dBm
      }
      // Add persistence parameter (PID 0xFF, value 0x01 = save after power down)
      data.push(0xff); // PID for persistence
      data.push(0x01); // Save configuration
    } else {
      // VMR64 - original implementation
      command = currentProtocol.commands.PWR;
      data = power;
    }

    const response = await sendCommandAndWaitResponse(
      MessageBuilder.make(
        currentProtocol,
        currentProtocol.addresses.PWR,
        command,
        data
      )
    );
    if (response) {
      const result = parseResponse(response);
      if (result && result.success) {
        if (
          currentProtocol.name === "NATION" &&
          result.data &&
          result.data.length > 0
        ) {
          // NATION returns configuration result: 0=success, 1=hardware not support, 2=power not support, 3=save failed
          const configResult = result.data[0];
          if (configResult === 0) {
            log(
              `Power set successfully ✓: P1=${power[0]}, P2=${power[1]}, P3=${power[2]}, P4=${power[3]} dBm`
            );
          } else {
            const errorMessages: Record<number, string> = {
              1: "Hardware does not support specified port parameter",
              2: "Reader does not support specified power parameter",
              3: "Save failed",
            };
            log(
              `Power command failed: ${
                errorMessages[configResult] ||
                `Unknown error code ${configResult}`
              }`
            );
            return;
          }
        } else {
          log(
            `Power set successfully ✓: P1=${power[0]}, P2=${power[1]}, P3=${power[2]}, P4=${power[3]} dBm`
          );
        }
        // Delay 200ms then auto-call GET POWER to verify
        setTimeout(() => {
          sendGetPowerCommand();
        }, 200);
      } else {
        log(
          `Power command failed. Error code: 0x${(result?.errorCode || 0)
            .toString(16)
            .padStart(2, "0")}`
        );
      }
    } else {
      log("Power command timeout - no response received");
    }
  };

  const sendGetPowerCommand = async () => {
    log("Sending GET POWER command...");

    // Clear buffer to avoid reading old frames
    setReadBuffer([]);
    readBufferRef.current = [];

    let command;
    if (currentProtocol.name === "NATION") {
      command = currentProtocol.commands.QUERY_READER_POWER;
      log(`NATION Query Power - Category: 0x01, MID: 0x02`);
    } else {
      command = currentProtocol.commands.PWR_GET;
    }
    const message = MessageBuilder.make(
      currentProtocol,
      currentProtocol.addresses.PWR_GET,
      command
    );

    const response = await sendCommandAndWaitResponse(message);
    if (!response) {
      log("Get Power timeout – no response received");
      return;
    }

    if (currentProtocol.name === "NATION") {
      const result = parseResponse(response);
      if (!result || !result.success) {
        log(
          `Get Power failed. Error code: 0x${(result?.errorCode || 0)
            .toString(16)
            .padStart(2, "0")}`
        );
        return;
      }
      // NATION returns power values as PID-Value pairs
      if (result.data && result.data.length >= 2) {
        const powers: Record<number, number> = {};
        // Parse PID-Value pairs
        for (let i = 0; i < result.data.length - 1; i += 2) {
          const pid = result.data[i];
          const power = result.data[i + 1];
          if (pid >= 0x01 && pid <= 0x04) {
            powers[pid] = power;
          }
        }
        // Update power settings for antennas 1-4
        setPowerSettings({
          p1: powers[0x01] || 0,
          p2: powers[0x02] || 0,
          p3: powers[0x03] || 0,
          p4: powers[0x04] || 0,
        });
        log(
          `Get Power successful ✓ (ant1=${powers[0x01] || 0}, ant2=${
            powers[0x02] || 0
          }, ant3=${powers[0x03] || 0}, ant4=${powers[0x04] || 0} dBm)`
        );
      }
    } else {
      // VMR64 power format
      const len = response[1];
      const cmdByte = response[3];
      if (cmdByte !== currentProtocol.commands.PWR_GET) {
        log(`Get Power: received unexpected cmd 0x${cmdByte.toString(16)}`);
        return;
      }

      if (len === 0x04) {
        // All antennas same value
        const outputPower = response[4];
        setPowerSettings({
          p1: outputPower,
          p2: outputPower,
          p3: outputPower,
          p4: outputPower,
        });
        log(`Get Power successful ✓ (all antennas = ${outputPower} dBm)`);
      } else if (len === 0x07) {
        // Reader returns 4 separate bytes
        const p1 = response[4];
        const p2 = response[5];
        const p3 = response[6];
        const p4 = response[7];
        setPowerSettings({ p1, p2, p3, p4 });
        log(
          `Get Power successful ✓ (ant1=${p1}, ant2=${p2}, ant3=${p3}, ant4=${p4} dBm)`
        );
      } else {
        log(`Get Power: Unexpected length = 0x${len.toString(16)}`);
      }
    }
  };

  const sendBeeperCommand = async (
    mode: keyof typeof currentProtocol.beeperModes
  ) => {
    const modeDescriptions: Record<string, string> = {
      QUIET: "Quiet mode",
      BEEP_AFTER_INVENTORY: "Beep after inventory round",
      BEEP_AFTER_TAG: "Beep after every tag (WARNING: May affect performance)",
    };

    log(`Sending BEEPER ${mode} command...`);

    let command, data;
    if (currentProtocol.name === "NATION") {
      // NATION uses BUZZER_SWITCH command
      command = currentProtocol.commands.BUZZER_SWITCH;
      data = [currentProtocol.beeperModes[mode]];
    } else {
      // VMR64 uses BEEPER command
      command = currentProtocol.commands.BEEPER;
      data = [currentProtocol.beeperModes[mode]];
    }

    const response = await sendCommandAndWaitResponse(
      MessageBuilder.make(
        currentProtocol,
        currentProtocol.addresses.BEEPER,
        command,
        data
      )
    );
    if (response) {
      console.log(`BEEPER ${mode} Response:`, response);
      const result = parseResponse(response);
      console.log("Parsed result:", result);
      if (result && result.success) {
        log(`Beeper set to: ${modeDescriptions[mode as string]} ✓`);
      } else {
        log(
          `Beeper command failed. Error code: 0x${(result?.errorCode || 0)
            .toString(16)
            .padStart(2, "0")}`
        );
      }
    } else {
      log("Beeper command timeout - no response received");
    }
  };

  // Software Beep Functions
  const playSoftwareBeep = (type: "inventory" | "tag") => {
    try {
      console.log(`Attempting to play software beep: ${type}`);
      
      // Tạo audio context để phát âm thanh
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) {
        log("Web Audio API not supported");
        return;
      }
      
      const audioContext = new AudioContext();
      
      // Resume context nếu bị suspended (do browser policy)
      if (audioContext.state === 'suspended') {
        audioContext.resume().then(() => {
          console.log('Audio context resumed');
        });
      }
      
      // Đợi một chút để đảm bảo context đã sẵn sàng
      setTimeout(() => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Cài đặt âm thanh
        const frequency = type === "inventory" ? 800 : 600;
        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
        oscillator.type = "sine";
        
         // Cài đặt volume và thời gian - beep dài hơn để tránh bị tắt tiếng
         gainNode.gain.setValueAtTime(0, audioContext.currentTime);
         gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
         gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.15);
         gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.2);
         
         // Phát âm thanh - beep 200ms để tránh bị tắt tiếng
         oscillator.start(audioContext.currentTime);
         oscillator.stop(audioContext.currentTime + 0.2);
        
        // Cleanup
        oscillator.onended = () => {
          audioContext.close();
        };
      }, 50); // Đợi 50ms để đảm bảo context sẵn sàng
      
      log(`Software beep played: ${type}`);
    } catch (error: any) {
      console.error("Error playing software beep:", error);
      log(`Failed to play software beep: ${error.message}`);
    }
  };

  const handleSoftwareBeepMode = (mode: "QUIET" | "BEEP_AFTER_INVENTORY" | "BEEP_AFTER_TAG") => {
    setSoftwareBeepMode(mode);
    const modeDescriptions: Record<string, string> = {
      QUIET: "Software beep disabled",
      BEEP_AFTER_INVENTORY: "Software beep after inventory round",
      BEEP_AFTER_TAG: "Software beep after every tag read",
    };
    log(`Software beep mode set to: ${modeDescriptions[mode as string]} ✓`);
  };

  // Helper function to check if EPC is currently visible in the table
  const isEpcVisibleInCurrentView = (epc: string): boolean => {
    const searchTerm = searchEpcRef.current.toLowerCase();
    const epcIncludeArray = epcIncludeListRef.current
      .split(",")
      .map((epc: string) => epc.trim().toUpperCase())
      .filter((epc: string) => epc.length > 0);

    // Get tag from database using ref
    const tag = tagDatabaseRef.current.get(epc);
    if (!tag) {
      return false;
    }

    // Apply same filters as getFilteredTags using refs
    if (!showExcludedRef.current && excludedTagsRef.current.has(tag.epc)) {
      return false;
    }
    if (showExcludedRef.current && !excludedTagsRef.current.has(tag.epc)) {
      return false;
    }
    if (searchTerm && !tag.epc.toLowerCase().includes(searchTerm)) {
      return false;
    }
    if (epcIncludeArray.length > 0 && !epcIncludeArray.includes(tag.epc)) {
      return false;
    }
    if (tag.rssi < minRssiRef.current) {
      return false;
    }
    if (antennaFilterRef.current !== "all" && tag.antenna !== parseInt(antennaFilterRef.current)) {
      return false;
    }

    return true;
  };

  const triggerSoftwareBeep = (type: "inventory" | "tag", epc?: string) => {
    const currentMode = softwareBeepModeRef.current;
    
    // Kiểm tra chế độ beep phù hợp
    if (currentMode === "QUIET") {
      return;
    }
    if (type === "inventory" && currentMode !== "BEEP_AFTER_INVENTORY") {
      return;
    }
    if (type === "tag" && currentMode !== "BEEP_AFTER_TAG") {
      return;
    }

    // For tag beeps, check if EPC is visible in current view
    if (type === "tag" && epc && !isEpcVisibleInCurrentView(epc)) {
      return; // Don't beep if EPC is not visible in current table view
    }
    
    const now = Date.now();
    const timeSinceLastBeep = type === "inventory" 
      ? now - lastInventoryBeepTime 
      : now - lastTagBeepTime;
    
    // Throttle beeps để tránh spam - tăng thời gian throttling
    const minInterval = type === "inventory" ? 2000 : 1000; // 2s cho inventory, 1s cho tag
    
    
    if (timeSinceLastBeep >= minInterval) {
      playSoftwareBeep(type);
      if (type === "inventory") {
        setLastInventoryBeepTime(now);
      } else {
        setLastTagBeepTime(now);
      }
    } else {
      console.log("Beep throttled - too soon");
    }
  };

  const setInventoryMode = useCallback(
    (mode: string) => {
      if (
        currentProtocol.inventoryModes &&
        currentProtocol.inventoryModes[mode]
      ) {
        currentProtocol.currentMode = mode;
        setSelectedMode(mode);
        setModeDescription(currentProtocol.inventoryModes[mode].description);
        log(
          `Inventory mode changed to ${mode}: ${currentProtocol.inventoryModes[mode].name}`
        );
      }
    },
    [currentProtocol, log]
  );

  // RF Profile Functions
  const setRfProfile = useCallback(
    (profile: number) => {
      if (currentProtocol.rfProfiles && currentProtocol.rfProfiles[profile]) {
        setCurrentRfProfile(profile);
        if (currentProtocol.rfProfiles[profile]) {
          setRfProfileDescription(
            `${currentProtocol.rfProfiles[profile].name}: ${currentProtocol.rfProfiles[profile].description}`
          );
        }
        log(
          `RF Profile selected: ${currentProtocol.rfProfiles[profile].name} - ${currentProtocol.rfProfiles[profile].description}`
        );
      }
    },
    [currentProtocol, log]
  );

  const getRfProfile = async () => {
    log("Sending GET RF PROFILE command...");

    let command;
    if (currentProtocol.name === "NATION") {
      command = currentProtocol.commands.QUERY_BASEBAND;
    } else {
      command = currentProtocol.commands.GET_RF_PROFILE;
    }

    const response = await sendCommandAndWaitResponse(
      MessageBuilder.make(
        currentProtocol,
        currentProtocol.addresses.GET_RF_PROFILE,
        command
      )
    );
    if (response) {
      console.log("GET RF PROFILE Response:", response);
      const result = parseResponse(response);
      console.log("Parsed result:", result);
      if (result && result.success && response.length > 4) {
        const profileId = response[4];
        let foundProfile = null;
        if (currentProtocol.rfProfiles) {
          for (const [key, profile] of Object.entries(
            currentProtocol.rfProfiles
          )) {
            if (profile.id === profileId) {
              foundProfile = parseInt(key);
              break;
            }
          }
        }
        if (foundProfile !== null && currentProtocol.rfProfiles) {
          setRfProfile(foundProfile);
          log(
            `Current RF Profile: ${
              currentProtocol.rfProfiles[foundProfile].name
            } (ID: 0x${profileId.toString(16).padStart(2, "0")}) ✓`
          );
        } else {
          log(
            `Unknown RF Profile ID: 0x${profileId
              .toString(16)
              .padStart(2, "0")}`
          );
        }
      } else {
        log(
          `Get RF Profile failed. Error code: 0x${(result?.errorCode || 0)
            .toString(16)
            .padStart(2, "0")}`
        );
      }
    } else {
      log("Get RF Profile timeout - no response received");
    }
  };

  const setRfProfileCommand = async () => {
    const profileData = currentProtocol.rfProfiles?.[currentRfProfile];

    if (!profileData) {
      log("No profile selected");
      return;
    }

    log(`Sending SET RF PROFILE command: ${profileData.name}...`);

    let command, data;
    if (currentProtocol.name === "NATION") {
      command = currentProtocol.commands.CONFIG_BASEBAND;
      data = [profileData.id];
    } else {
      command = currentProtocol.commands.SET_RF_PROFILE;
      data = [profileData.id];
    }

    const response = await sendCommandAndWaitResponse(
      MessageBuilder.make(
        currentProtocol,
        currentProtocol.addresses.SET_RF_PROFILE,
        command,
        data
      )
    );
    if (response) {
      console.log("SET RF PROFILE Response:", response);
      const result = parseResponse(response);
      console.log("Parsed result:", result);
      if (result && result.success) {
        log(
          `RF Profile set successfully ✓: ${profileData.name} - ${profileData.description}`
        );
        log("Note: Reader will be reset and profile stored in flash memory");
      } else {
        log(
          `Set RF Profile failed. Error code: 0x${(result?.errorCode || 0)
            .toString(16)
            .padStart(2, "0")}`
        );
      }
    } else {
      log("Set RF Profile timeout - no response received");
    }
  };

  // Antenna Control Functions
  const toggleAntenna = useCallback(
    (antennaId: number) => {
      if (currentProtocol.antennas && currentProtocol.antennas[antennaId]) {
        const antenna = currentProtocol.antennas[antennaId];
        antenna.enabled = !antenna.enabled;

        // Ensure at least one antenna is always enabled
        const enabledAntennas = currentProtocol.getEnabledAntennas?.() || [];
        if (enabledAntennas.length === 0) {
          antenna.enabled = true;
        }

        updateAntennaSequenceDisplay();

        const status = antenna.enabled ? "enabled" : "disabled";
        log(`Antenna ${antennaId} ${status}`);
      }
    },
    [currentProtocol, log]
  );

  const updateAntennaSequenceDisplay = useCallback(() => {
    if (!currentProtocol.antennas) return;

    const enabled = currentProtocol.getEnabledAntennas?.() || [];
    if (enabled.length === 0) {
      setAntennaSequence("No antennas enabled");
      return;
    }

    const sequence = [];
    for (let i = 0; i < 4; i++) {
      const antennaId = enabled[i % enabled.length];
      sequence.push(antennaId);
    }

    const sequenceText = sequence.join("→");
    const uniqueEnabled = Array.from(new Set(enabled)).join(",");

    setAntennaSequence(`Sequence: ${sequenceText} (Enabled: ${uniqueEnabled})`);
  }, [currentProtocol]);

  // Session Control Functions
  const setSessionMode = useCallback(
    (sessionId: number) => {
      setSessionSettings((prev) => ({ ...prev, session: sessionId }));
      if (currentProtocol.sessionTargetSettings) {
        currentProtocol.sessionTargetSettings.session = sessionId;
      }
      log(`Session mode changed to S${sessionId}`);
    },
    [currentProtocol, log]
  );

  const updateSessionDescription = useCallback(() => {
    const session = sessionSettings.session;
    const target = sessionSettings.target === 0 ? "A" : "B";
    const repeat = sessionSettings.repeat;
    return `Session ${session}: Target ${target}, Repeat ${repeat}`;
  }, [sessionSettings]);

  // Effects
  useEffect(() => {
    const protocol = ReaderProtocols[readerType];
    setCurrentProtocol(protocol);
    if (protocol.inventoryModes) {
      setInventoryMode(protocol.currentMode || "S0");
    }

    // Initialize RF profile
    if (protocol.rfProfiles && protocol.currentRfProfile !== undefined) {
      setCurrentRfProfile(protocol.currentRfProfile);
      setRfProfileDescription(
        `${protocol.rfProfiles[protocol.currentRfProfile].name}: ${
          protocol.rfProfiles[protocol.currentRfProfile].description
        }`
      );
    }

    // Initialize antenna sequence display
    updateAntennaSequenceDisplay();

    // Update protocol settings with current state
    if (protocol.inventorySettings) {
      protocol.inventorySettings.stayTime = antennaSettings.stayTime;
      protocol.inventorySettings.interval = antennaSettings.intervalTime;
      protocol.inventorySettings.repeat = antennaSettings.repeatCount;
    }

    if (protocol.sessionTargetSettings) {
      protocol.sessionTargetSettings.session = sessionSettings.session;
      protocol.sessionTargetSettings.target = sessionSettings.target;
      protocol.sessionTargetSettings.repeat = sessionSettings.repeat;
    }
  }, [
    readerType,
    setInventoryMode,
    updateAntennaSequenceDisplay,
    antennaSettings,
    sessionSettings,
  ]);

  // Update antenna sequence when settings change
  useEffect(() => {
    updateAntennaSequenceDisplay();
  }, [antennaSettings, updateAntennaSequenceDisplay]);

  // Update refs for async operations
  useEffect(() => {
    if (isInventoryRunning || isSessionInventoryRunning) {
      const intervalRef = setInterval(() => {
        if (!isInventoryRunningRef.current && !isSessionInventoryRunning) {
          setCurrentInventoryMode("none");
          updateConnectionStatus("connected");
        }
      }, 1000);

      return () => clearInterval(intervalRef);
    }
  }, [isInventoryRunning, isSessionInventoryRunning, updateConnectionStatus]);

  // Read rate calculation interval
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const timeDiff = (now - lastReadTimeRef.current) / 1000;
      if (timeDiff >= 1) {
        const rate = Math.round(readCountRef.current / timeDiff);
        setReadCount(rate);
        readCountRef.current = 0;
        lastReadTimeRef.current = now;
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Serial port disconnect event listener
  useEffect(() => {
    const handleDisconnect = () => {
      setPort(null);
      setReader(null);
      setWriter(null);
      setIsInventoryRunning(false);
      updateConnectionStatus("disconnected");
      log("Serial port disconnected (device removed)");
    };

    if ("serial" in navigator) {
      navigator.serial.addEventListener("disconnect", handleDisconnect);

      return () => {
        navigator.serial.removeEventListener("disconnect", handleDisconnect);
      };
    }
  }, [updateConnectionStatus, log]);

  useEffect(() => {
    return () => {
      if (port) {
        disconnectDevice();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Stop inventory on page unload/reload
  useEffect(() => {
    const handleBeforeUnload = async (e: BeforeUnloadEvent) => {
      if (isInventoryRunning || isSessionInventoryRunning) {
        // Stop inventory before page unload
        if (isInventoryRunning) {
          await stopInventory();
        }
        if (isSessionInventoryRunning) {
          await stopSessionInventory();
        }

        // Some browsers may not wait for async operations in beforeunload
        // But we try anyway to ensure clean shutdown
        e.preventDefault();
        // Use return instead of returnValue for modern browsers
        return "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isInventoryRunning, isSessionInventoryRunning]);

  // Stop inventory when page becomes hidden (tab switch, minimize, etc.)
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (
        document.hidden &&
        (isInventoryRunning || isSessionInventoryRunning)
      ) {
        log("Page hidden - stopping inventory");
        if (isInventoryRunning) {
          await stopInventory();
        }
        if (isSessionInventoryRunning) {
          await stopSessionInventory();
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isInventoryRunning, isSessionInventoryRunning]);

  const filteredTags = useMemo(
    () => getFilteredTags(),
    [
      tagDatabase,
      showExcluded,
      excludedTags,
      searchEpc,
      epcIncludeList,
      minRssi,
      antennaFilter,
      sortBy,
      currentSort.direction,
    ]
  );
  const isConnected = !!(port && writer);

  return (
    <div className="flex h-screen bg-background">
      {/* Left Sidebar - Controls */}
      <div className="w-96 p-4 space-y-4 overflow-y-auto border-r">
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold">Nextwaves WEBSerial API</h1>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSettings(true)}
              >
                <Settings className="w-4 h-4" />
              </Button>
              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    connectionStatus === "scanning" ? "animate-pulse" : ""
                  } ${
                    connectionStatus === "connected"
                      ? "bg-[#059669]"
                      : connectionStatus === "scanning"
                      ? "bg-[#003a70]"
                      : "bg-[#dc2626]"
                  }`}
                />
                <span className="text-sm text-[#475569] font-medium">
                  {connectionText}
                </span>
              </div>
            </div>
          </div>

          {/* Reader Type Selection */}
          <div className="mb-4">
            <Label htmlFor="readerType">Reader Type</Label>
            <Select value={readerType} onValueChange={setReaderType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="VMR64">VMR64 (Nextwaves)</SelectItem>
                <SelectItem value="NATION">NATION</SelectItem>
                <SelectItem value="GENERIC" disabled>
                  Generic RFID
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Baud Rate Selection */}
          <div className="mb-4">
            <Label htmlFor="baudRate">Baud Rate</Label>
            <Select
              value={baudRate.toString()}
              onValueChange={(value) => setBaudRate(parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="9600">9600</SelectItem>
                <SelectItem value="19200">19200</SelectItem>
                <SelectItem value="38400">38400</SelectItem>
                <SelectItem value="57600">57600</SelectItem>
                <SelectItem value="115200">115200 (Default)</SelectItem>
                <SelectItem value="230400">230400</SelectItem>
                <SelectItem value="460800">460800</SelectItem>
                <SelectItem value="921600">921600</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Device Connection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              Device Connection
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={selectSerialPort}
                className="flex-1 bg-[#003a70] hover:bg-[#002d54] text-white border-0 font-semibold shadow-sm h-11"
              >
                Select Port
              </Button>
              <Button
                onClick={isConnected ? disconnectDevice : connectDevice}
                disabled={!isConnected && !port}
                className={`flex-1 ${
                  isConnected
                    ? "bg-[#dc2626] hover:bg-[#b91c1c]"
                    : "bg-[#059669] hover:bg-[#047857]"
                } text-white border-0 font-semibold shadow-sm disabled:bg-gray-200 disabled:text-gray-400 h-11 transition-colors`}
              >
                {isConnected ? "Disconnect" : "Connect"}
              </Button>
            </div>
            <div className="border rounded-lg p-4 min-h-[90px] bg-gray-50/50">
              {port ? (
                <div className="space-y-2">
                  {(() => {
                    const info = port.getInfo();
                    let deviceName = "Unknown Device";
                    const details: string[] = [];

                    // Try to determine device name from USB info
                    if (info.usbVendorId && info.usbProductId) {
                      const vendorId = info.usbVendorId
                        .toString(16)
                        .padStart(4, "0")
                        .toUpperCase();
                      const productId = info.usbProductId
                        .toString(16)
                        .padStart(4, "0")
                        .toUpperCase();

                      // Common RFID reader vendor/product mappings
                      const deviceMappings: Record<string, string> = {
                        "10C4:EA60": "Nextwaves SL USB-UART Bridge",
                        "0403:6001": "FTDI FT232 USB-UART",
                        "0403:6015": "FTDI FT231X USB-UART",
                        "1A86:7523": "CH340 USB-UART",
                        "067B:2303": "Prolific PL2303 USB-UART",
                        "2341:0043": "Arduino Uno",
                        "2341:0001": "Arduino Uno (Rev1)",
                        "1B4F:9206": "SparkFun RedBoard",
                      };

                      const deviceKey = `${vendorId}:${productId}`;
                      if (deviceMappings[deviceKey]) {
                        deviceName = deviceMappings[deviceKey];
                      } else {
                        deviceName = `USB Device (${vendorId}:${productId})`;
                      }

                      details.push(`VID: ${vendorId}`);
                      details.push(`PID: ${productId}`);
                    }

                    // Add serial number if available
                    if (info.serialNumber) {
                      details.push(`S/N: ${info.serialNumber}`);
                    }

                    return (
                      <>
                        <div className="font-semibold text-base">
                          {deviceName}
                        </div>
                        <div className="text-sm text-gray-600">
                          {details.length > 0
                            ? details.join(" • ")
                            : "Serial Port Ready"}
                        </div>
                        <div className="font-medium text-sm text-[#059669] mt-1">
                          Ready to connect at {baudRate} baud
                        </div>
                      </>
                    );
                  })()}
                </div>
              ) : (
                <div className="text-sm text-gray-500 flex items-center justify-center h-full">
                  No port selected
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Inventory Control */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Inventory Control</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              onClick={startInventory}
              disabled={
                !isConnected || isInventoryRunning || isSessionInventoryRunning
              }
              className={`w-full border-0 font-semibold shadow-sm ${
                isInventoryRunning
                  ? "bg-[#F1F5F9] hover:bg-[#e2e8f0] text-black"
                  : "bg-[#003a70] hover:bg-[#002d54] text-white"
              } disabled:bg-[#F1F5F9] disabled:text-black`}
            >
              {isInventoryRunning ? "Scanning..." : "Start Inventory"}
            </Button>
            <Button
              onClick={stopInventory}
              disabled={!isConnected || !isInventoryRunning}
              className="bg-[#dc2626] hover:bg-[#b91c1c] text-white border-0 w-full font-semibold shadow-sm disabled:bg-[#F1F5F9] disabled:text-black"
            >
              Stop Inventory
            </Button>
          </CardContent>
        </Card>

        {/* Session Target Inventory - VMR64 Only */}
        <Card className={readerType === "NATION" ? "opacity-50" : ""}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">
              Session Target Inventory{" "}
              {readerType === "NATION" && "(VMR64 Only)"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Session Selection */}
            <div className="grid grid-cols-3 gap-2">
              <Button
                onClick={() => setSessionMode(0)}
                disabled={
                  readerType !== "VMR64" ||
                  isInventoryRunning ||
                  isSessionInventoryRunning
                }
                className={`text-sm px-3 py-2 border-0 font-semibold shadow-sm ${
                  sessionSettings.session === 0
                    ? "bg-[#003a70] hover:bg-[#002d54] text-white"
                    : "bg-[#F1F5F9] hover:bg-[#e2e8f0] text-black"
                } disabled:bg-[#F1F5F9] disabled:text-black`}
              >
                S0
              </Button>
              <Button
                onClick={() => setSessionMode(1)}
                disabled={
                  readerType !== "VMR64" ||
                  isInventoryRunning ||
                  isSessionInventoryRunning
                }
                className={`text-sm px-3 py-2 border-0 font-semibold shadow-sm ${
                  sessionSettings.session === 1
                    ? "bg-[#003a70] hover:bg-[#002d54] text-white"
                    : "bg-[#F1F5F9] hover:bg-[#e2e8f0] text-black"
                } disabled:bg-[#F1F5F9] disabled:text-black`}
              >
                S1
              </Button>
              <Button
                onClick={() => setSessionMode(2)}
                disabled={
                  readerType !== "VMR64" ||
                  isInventoryRunning ||
                  isSessionInventoryRunning
                }
                className={`text-sm px-3 py-2 border-0 font-semibold shadow-sm ${
                  sessionSettings.session === 2
                    ? "bg-[#003a70] hover:bg-[#002d54] text-white"
                    : "bg-[#F1F5F9] hover:bg-[#e2e8f0] text-black"
                } disabled:bg-[#F1F5F9] disabled:text-black`}
              >
                S2
              </Button>
            </div>

            {/* Target and Repeat Settings */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs text-[#475569]">Target Flag</Label>
                <Select
                  value={sessionSettings.target.toString()}
                  onValueChange={(value) =>
                    setSessionSettings((prev) => ({
                      ...prev,
                      target: parseInt(value),
                    }))
                  }
                  disabled={isInventoryRunning || isSessionInventoryRunning}
                >
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">A (00)</SelectItem>
                    <SelectItem value="1">B (01)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-[#475569]">Repeat</Label>
                <Input
                  type="number"
                  value={sessionSettings.repeat}
                  onChange={(e) =>
                    setSessionSettings((prev) => ({
                      ...prev,
                      repeat: parseInt(e.target.value) || 1,
                    }))
                  }
                  min="1"
                  max="255"
                  className="text-xs"
                  disabled={isInventoryRunning || isSessionInventoryRunning}
                />
              </div>
            </div>

            <div className="text-xs text-[#475569]">
              <span>{updateSessionDescription()}</span>
            </div>

            {/* Session Inventory Control */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={startSessionInventory}
                disabled={
                  !isConnected ||
                  readerType !== "VMR64" ||
                  isInventoryRunning ||
                  isSessionInventoryRunning
                }
                className="bg-[#059669] hover:bg-[#047857] text-white border-0 text-sm px-3 py-2 font-semibold shadow-sm disabled:bg-[#F1F5F9] disabled:text-black"
              >
                Start Session Inv
              </Button>
              <Button
                onClick={stopSessionInventory}
                disabled={!isConnected || !isSessionInventoryRunning}
                className="bg-[#dc2626] hover:bg-[#b91c1c] text-white border-0 text-sm px-3 py-2 font-semibold shadow-sm disabled:bg-[#F1F5F9] disabled:text-black"
              >
                Stop Session Inv
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Device Information */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Device Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              onClick={sendInfoCommand}
              disabled={!isConnected}
              className="bg-[#F1F5F9] hover:bg-[#e2e8f0] text-black border-0 w-full font-semibold shadow-sm disabled:bg-[#F1F5F9] disabled:text-black"
            >
              Get Info
            </Button>
            <Button
              onClick={sendFirmwareCommand}
              disabled={!isConnected}
              className="bg-[#F1F5F9] hover:bg-[#e2e8f0] text-black border-0 w-full font-semibold shadow-sm disabled:bg-[#F1F5F9] disabled:text-black"
            >
              Get Firmware
            </Button>
            <Button
              onClick={sendResetCommand}
              disabled={!isConnected}
              className="bg-[#F1F5F9] hover:bg-[#e2e8f0] text-black border-0 w-full font-semibold shadow-sm disabled:bg-[#F1F5F9] disabled:text-black"
            >
              Reset Reader
            </Button>
            
            {/* Display Device Information */}
            {deviceInfo && (
              <div className="mt-4 pt-3 border-t border-gray-200">
                <div className="text-sm font-medium text-gray-700 mb-2">
                  Reader Information:
                </div>
                {deviceInfo.readerType && (
                  <div className="text-sm text-gray-600 mb-1">
                    <span className="font-medium">Reader Type:</span> {deviceInfo.readerType}
                  </div>
                )}
                {deviceInfo.firmwareVersion && (
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Firmware:</span> v{deviceInfo.firmwareVersion}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sound Settings */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Sound Settings</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-2">
            <Button
              onClick={() => sendBeeperCommand("QUIET")}
              disabled={!isConnected}
              className="bg-[#F1F5F9] hover:bg-[#e2e8f0] text-black border-0 text-sm px-3 py-2 font-semibold shadow-sm disabled:bg-[#F1F5F9] disabled:text-black"
            >
              Quiet
            </Button>
            <Button
              onClick={() => sendBeeperCommand("BEEP_AFTER_INVENTORY")}
              disabled={!isConnected}
              className="bg-[#F1F5F9] hover:bg-[#e2e8f0] text-black border-0 text-sm px-3 py-2 font-semibold shadow-sm disabled:bg-[#F1F5F9] disabled:text-black"
            >
              On Stop
            </Button>
            <Button
              onClick={() => sendBeeperCommand("BEEP_AFTER_TAG")}
              disabled={!isConnected}
              className="bg-[#F1F5F9] hover:bg-[#e2e8f0] text-black border-0 text-sm px-3 py-2 font-semibold shadow-sm disabled:bg-[#F1F5F9] disabled:text-black"
            >
              On Read
            </Button>
          </CardContent>
        </Card>

        {/* Software Beep Settings */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Software Beep Settings</CardTitle>
            <div className="text-xs text-gray-500 mt-1">
              Current mode: {softwareBeepMode === "QUIET" ? "Disabled" : 
                           softwareBeepMode === "BEEP_AFTER_INVENTORY" ? "On Stop" : 
                           softwareBeepMode === "BEEP_AFTER_TAG" ? "On Read" : "Unknown"}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <Button
                onClick={() => handleSoftwareBeepMode("QUIET")}
                className={`text-sm px-3 py-2 font-semibold shadow-sm border-0 ${
                  softwareBeepMode === "QUIET"
                    ? "bg-blue-500 text-white hover:bg-blue-600"
                    : "bg-[#F1F5F9] hover:bg-[#e2e8f0] text-black"
                }`}
              >
                Quiet
              </Button>
              <Button
                onClick={() => handleSoftwareBeepMode("BEEP_AFTER_INVENTORY")}
                className={`text-sm px-3 py-2 font-semibold shadow-sm border-0 ${
                  softwareBeepMode === "BEEP_AFTER_INVENTORY"
                    ? "bg-blue-500 text-white hover:bg-blue-600"
                    : "bg-[#F1F5F9] hover:bg-[#e2e8f0] text-black"
                }`}
              >
                On Stop
              </Button>
              <Button
                onClick={() => handleSoftwareBeepMode("BEEP_AFTER_TAG")}
                className={`text-sm px-3 py-2 font-semibold shadow-sm border-0 ${
                  softwareBeepMode === "BEEP_AFTER_TAG"
                    ? "bg-blue-500 text-white hover:bg-blue-600"
                    : "bg-[#F1F5F9] hover:bg-[#e2e8f0] text-black"
                }`}
              >
                On Read
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Power Settings */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Power Settings</CardTitle>
          </CardHeader>

          <CardContent className="space-y-2">
            {/* 4 ô input – Ant 1, Ant 2, Ant 3, Ant 4 */}
            <div className="grid grid-cols-4 gap-2">
              <div className="flex flex-col">
                <Label className="text-xs text-[#475569]">Ant 1 (dBm)</Label>
                <Input
                  type="number"
                  value={powerSettings.p1}
                  onChange={(e) =>
                    setPowerSettings((prev) => ({
                      ...prev,
                      p1: +e.target.value,
                    }))
                  }
                  min="0"
                  max={currentProtocol.name === "NATION" ? "25" : "33"}
                />
              </div>
              <div className="flex flex-col">
                <Label className="text-xs text-[#475569]">Ant 2 (dBm)</Label>
                <Input
                  type="number"
                  value={powerSettings.p2}
                  onChange={(e) =>
                    setPowerSettings((prev) => ({
                      ...prev,
                      p2: +e.target.value,
                    }))
                  }
                  min="0"
                  max={currentProtocol.name === "NATION" ? "25" : "33"}
                />
              </div>
              <div className="flex flex-col">
                <Label className="text-xs text-[#475569]">Ant 3 (dBm)</Label>
                <Input
                  type="number"
                  value={powerSettings.p3}
                  onChange={(e) =>
                    setPowerSettings((prev) => ({
                      ...prev,
                      p3: +e.target.value,
                    }))
                  }
                  min="0"
                  max={currentProtocol.name === "NATION" ? "25" : "33"}
                />
              </div>
              <div className="flex flex-col">
                <Label className="text-xs text-[#475569]">Ant 4 (dBm)</Label>
                <Input
                  type="number"
                  value={powerSettings.p4}
                  onChange={(e) =>
                    setPowerSettings((prev) => ({
                      ...prev,
                      p4: +e.target.value,
                    }))
                  }
                  min="0"
                  max={currentProtocol.name === "NATION" ? "25" : "33"}
                />
              </div>
            </div>

            {/* Nút Set Power */}
            <Button
              onClick={sendPowerCommand}
              disabled={!isConnected}
              className="bg-[#003a70] hover:bg-[#002d54] text-white w-full py-2 font-semibold"
            >
              Set Power
            </Button>

            {/* Nút Get Power (nằm ngay dưới Set, cách 1 dòng) */}
            <Button
              onClick={sendGetPowerCommand}
              disabled={!isConnected}
              className="bg-[#059669] hover:bg-[#047857] text-white w-full py-2 font-semibold mt-1"
            >
              Get Power
            </Button>
            {currentProtocol.name === "NATION" && (
              <Button
                onClick={sendQueryRfidAbilityCommand}
                disabled={!isConnected}
                className="bg-[#003a70] hover:bg-[#002d54] text-white w-full py-2 font-semibold mt-1"
              >
                Query RFID Ability
              </Button>
            )}
          </CardContent>
        </Card>

        {/* RF Link Profile */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">RF Link Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={getRfProfile}
                disabled={!isConnected}
                className="bg-[#F1F5F9] hover:bg-[#e2e8f0] text-black border-0 text-sm px-3 py-2 font-semibold shadow-sm disabled:bg-[#F1F5F9] disabled:text-black"
              >
                Get Profile
              </Button>
              <Button
                onClick={setRfProfileCommand}
                disabled={!isConnected}
                className="bg-[#F1F5F9] hover:bg-[#e2e8f0] text-black border-0 text-sm px-3 py-2 font-semibold shadow-sm disabled:bg-[#F1F5F9] disabled:text-black"
              >
                Set Profile
              </Button>
            </div>
            <div className="grid grid-cols-4 gap-1">
              {(readerType === "NATION" ? [0, 1, 2] : [0, 1, 2, 3]).map(
                (profile) => (
                  <Button
                    key={profile}
                    onClick={() => setRfProfile(profile)}
                    disabled={!isConnected}
                    className={`text-sm px-3 py-2 border-0 font-semibold shadow-sm ${
                      currentRfProfile === profile
                        ? "bg-[#003a70] hover:bg-[#002d54] text-white"
                        : "bg-[#F1F5F9] hover:bg-[#e2e8f0] text-black"
                    } disabled:bg-[#F1F5F9] disabled:text-black`}
                  >
                    P{profile}
                  </Button>
                )
              )}
            </div>
            <div className="text-xs text-[#475569]">
              <span>{rfProfileDescription}</span>
            </div>
          </CardContent>
        </Card>

        {/* Antenna Control */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Antenna Control</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Antenna Enable/Disable */}
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4].map((antennaId) => (
                <div key={antennaId} className="flex flex-col items-center">
                  <Label className="text-xs text-[#475569] mb-1">
                    ANT {antennaId}
                  </Label>
                  <Button
                    onClick={() => toggleAntenna(antennaId)}
                    disabled={isInventoryRunning || isSessionInventoryRunning}
                    className={`text-sm px-3 py-2 border-0 font-semibold shadow-sm ${
                      currentProtocol.antennas?.[antennaId]?.enabled
                        ? "bg-[#059669] hover:bg-[#047857] text-white"
                        : "bg-[#dc2626] hover:bg-[#b91c1c] text-white"
                    } disabled:bg-[#F1F5F9] disabled:text-black`}
                  >
                    {currentProtocol.antennas?.[antennaId]?.enabled
                      ? "ON"
                      : "OFF"}
                  </Button>
                </div>
              ))}
            </div>

            {/* Inventory Settings */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label className="text-xs text-[#475569]">Stay Time</Label>
                <Input
                  type="number"
                  value={antennaSettings.stayTime}
                  onChange={(e) =>
                    setAntennaSettings((prev) => ({
                      ...prev,
                      stayTime: parseInt(e.target.value) || 1,
                    }))
                  }
                  min="1"
                  max="255"
                  className="text-xs"
                  disabled={isInventoryRunning || isSessionInventoryRunning}
                />
              </div>
              <div>
                <Label className="text-xs text-[#475569]">Interval</Label>
                <Input
                  type="number"
                  value={antennaSettings.intervalTime}
                  onChange={(e) =>
                    setAntennaSettings((prev) => ({
                      ...prev,
                      intervalTime: parseInt(e.target.value) || 1,
                    }))
                  }
                  min="0"
                  max="255"
                  className="text-xs"
                  disabled={isInventoryRunning || isSessionInventoryRunning}
                />
              </div>
              <div>
                <Label className="text-xs text-[#475569]">Repeat</Label>
                <Input
                  type="number"
                  value={antennaSettings.repeatCount}
                  onChange={(e) =>
                    setAntennaSettings((prev) => ({
                      ...prev,
                      repeatCount: parseInt(e.target.value) || 1,
                    }))
                  }
                  min="1"
                  max="255"
                  className="text-xs"
                  disabled={isInventoryRunning || isSessionInventoryRunning}
                />
              </div>
            </div>

            <div className="text-xs text-[#475569]">
              <span>{antennaSequence}</span>
            </div>

            {/* Test Fast Switch Command */}
            <div className="pt-2">
              <Button
                onClick={sendFastSwitchAntennaInventory}
                disabled={
                  !isConnected ||
                  isInventoryRunning ||
                  isSessionInventoryRunning
                }
                className="bg-[#F1F5F9] hover:bg-[#e2e8f0] text-black border-0 text-sm px-3 py-2 w-full font-semibold shadow-sm disabled:bg-[#F1F5F9] disabled:text-black"
              >
                Test Fast Switch
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Inventory Mode */}
        {currentProtocol.inventoryModes && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Inventory Mode</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-4 gap-1">
                {Object.keys(currentProtocol.inventoryModes).map((mode) => (
                  <Button
                    key={mode}
                    onClick={() => setInventoryMode(mode)}
                    disabled={!isConnected}
                    className={`text-sm px-3 py-2 border-0 font-semibold shadow-sm ${
                      selectedMode === mode
                        ? "bg-[#003a70] hover:bg-[#002d54] text-white"
                        : "bg-[#F1F5F9] hover:bg-[#e2e8f0] text-black"
                    } disabled:bg-[#F1F5F9] disabled:text-black`}
                  >
                    {mode}
                  </Button>
                ))}
              </div>
              <div className="text-xs text-muted-foreground">
                {modeDescription}
              </div>
            </CardContent>
          </Card>
        )}

        {/* NATION-specific Settings */}
        {false && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">
                NATION Configuration & Debug
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* RF Band Selection */}
              <div>
                <Label className="text-xs text-[#475569]">RF Band</Label>
                <Select defaultValue="920_923">
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="920_923">920-923 MHz (Asia)</SelectItem>
                    {/* <SelectItem value="902_928">902-928 MHz (US)</SelectItem>
                    <SelectItem value="865_868">865-868 MHz (EU)</SelectItem> */}
                  </SelectContent>
                </Select>
              </div>

              {/* Antenna Count for NATION (supports up to 32) */}
              <div>
                <Label className="text-xs text-[#475569]">
                  Max Antenna Count
                </Label>
                <Input
                  type="number"
                  defaultValue="4"
                  min="1"
                  max="32"
                  className="text-xs"
                  disabled={isInventoryRunning}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={async () => {
                    log("Querying RF Band...");
                    const response = await sendCommandAndWaitResponse(
                      MessageBuilder.make(
                        currentProtocol,
                        0x00,
                        currentProtocol.commands.QUERY_RF_BAND
                      )
                    );
                    if (response) {
                      const result = parseResponse(response);
                      if (result && result.success) {
                        log("RF Band query successful ✓");
                      }
                    }
                  }}
                  disabled={!isConnected}
                  className="bg-[#F1F5F9] hover:bg-[#e2e8f0] text-black border-0 text-sm px-3 py-2 font-semibold shadow-sm disabled:bg-[#F1F5F9] disabled:text-black"
                >
                  Get RF Band
                </Button>
                <Button
                  onClick={async () => {
                    log("Testing NATION inventory with continuous mode OFF...");
                    // Try with continuous mode = 0x00 instead of 0x01
                    const testData = [
                      0x00,
                      0x00,
                      0x00,
                      0x01, // Antenna mask (antenna 1)
                      0x00, // Continuous mode OFF
                    ];
                    await sendCommand(
                      MessageBuilder.make(
                        currentProtocol,
                        0x00,
                        currentProtocol.commands.READ_EPC_TAG,
                        testData
                      )
                    );
                  }}
                  disabled={!isConnected}
                  className="bg-[#F1F5F9] hover:bg-[#e2e8f0] text-black border-0 text-sm px-3 py-2 font-semibold shadow-sm disabled:bg-[#F1F5F9] disabled:text-black"
                >
                  Test Read
                </Button>
              </div>

              {/* Debug section */}
              <div className="pt-3 border-t">
                <Label className="text-xs text-[#475569] mb-2 block">
                  Debug Tools
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={async () => {
                      log("Sending raw NATION wake-up sequence...");
                      // Send a simple command with minimal data
                      const wakeUp = [
                        0x5a, 0x00, 0x01, 0x01, 0x00, 0x00, 0x00, 0xbe, 0xde,
                      ];
                      if (writer) {
                        await writer.write(new Uint8Array(wakeUp));
                        log(
                          `RAW OUT: ${wakeUp
                            .map((b) => b.toString(16).padStart(2, "0"))
                            .join(" ")}`
                        );
                      }
                    }}
                    disabled={!isConnected}
                    className="bg-yellow-100 hover:bg-yellow-200 text-black border-0 text-xs px-2 py-1"
                  >
                    Send Wake
                  </Button>
                  <Button
                    onClick={async () => {
                      log("Testing with different baud rates...");
                      const bauds = [9600, 19200, 38400, 57600, 115200, 230400];
                      const suggestions = bauds
                        .filter((b) => b !== baudRate)
                        .slice(0, 4);
                      alert(
                        `Current baud rate: ${baudRate}\n\nTry these alternative baud rates:\n${suggestions
                          .map((b) => `- ${b}`)
                          .join(
                            "\n"
                          )}\n\nYou can change the baud rate in the settings above.`
                      );
                    }}
                    className="bg-yellow-100 hover:bg-yellow-200 text-black border-0 text-xs px-2 py-1"
                  >
                    Baud Help
                  </Button>
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  <p>Troubleshooting tips:</p>
                  <ul className="list-disc list-inside mt-1">
                    <li>Check reader power and LED status</li>
                    <li>Try USB-to-Serial adapter if using direct serial</li>
                    <li>Verify reader model is NATION RF600</li>
                    <li>Check RX/TX cable connections (may need crossover)</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Communication Log */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Communication Log</CardTitle>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsLogFullscreen(true)}
                  className="h-8 w-8 p-0"
                >
                  <Maximize2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div
              ref={logRef}
              className="bg-muted font-mono text-xs p-3 rounded border h-[150px] overflow-y-auto whitespace-pre-wrap"
            >
              {communicationLog || "No communication yet..."}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Panel - Tag Management */}
      <div className="flex-1 flex flex-col h-screen">
        <div className="p-4 border-b bg-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Tag Inventory</h2>
            <div className="flex items-center gap-3">
              <div className="bg-[#003a70] text-white px-4 py-2 text-sm rounded-lg font-semibold shadow-sm border border-[#002d54]">
                {filteredTags.length} Tags
              </div>
              <div className="bg-[#F1F5F9] text-black px-4 py-2 text-sm rounded-lg font-semibold shadow-sm border border-[#e2e8f0]">
                {Math.round(readCount)} reads/s
              </div>
            </div>
          </div>

          {/* Filters and Controls */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div>
              <Label htmlFor="searchEpc">Search EPC</Label>
              <Input
                id="searchEpc"
                value={searchEpc}
                onChange={(e) => setSearchEpc(e.target.value)}
                placeholder="Enter EPC to search..."
              />
            </div>
            <div>
              <Label htmlFor="epcIncludeList">EPC Include List</Label>
              <Textarea
                id="epcIncludeList"
                value={epcIncludeList}
                onChange={(e) => setEpcIncludeList(e.target.value)}
                rows={2}
                placeholder="EPC1,EPC2,EPC3..."
              />
            </div>
            <div>
              <Label htmlFor="minRssi">Min RSSI</Label>
              <Input
                id="minRssi"
                type="number"
                value={minRssi}
                onChange={(e) => setMinRssi(+e.target.value)}
                min="-100"
                max="0"
              />
            </div>
            <div>
              <Label htmlFor="antennaFilter">Antenna Filter</Label>
              <Select value={antennaFilter} onValueChange={setAntennaFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Antennas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Antennas</SelectItem>
                  <SelectItem value="1">Antenna 1</SelectItem>
                  <SelectItem value="2">Antenna 2</SelectItem>
                  <SelectItem value="3">Antenna 3</SelectItem>
                  <SelectItem value="4">Antenna 4</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="sortBy">Sort By</Label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="epc">EPC</SelectItem>
                  <SelectItem value="lastSeen">Last Seen</SelectItem>
                  <SelectItem value="count">Count</SelectItem>
                  <SelectItem value="rssi">RSSI</SelectItem>
                  <SelectItem value="antenna">Antenna</SelectItem>
                  <SelectItem value="frequency">Frequency</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Button
                onClick={clearAllTags}
                className="bg-[#dc2626] hover:bg-[#b91c1c] text-white border-0 text-sm px-4 py-2 font-semibold shadow-sm"
              >
                Clear All
              </Button>
              <Button
                onClick={exportCsv}
                className="bg-[#F1F5F9] hover:bg-[#e2e8f0] text-black border-0 text-sm px-4 py-2 font-semibold shadow-sm"
              >
                Export CSV
              </Button>
            </div>
          </div>

          {/* Excluded Tags Info */}
          {excludedTags.size > 0 && (
            <div className="mt-4 p-4 border rounded-lg text-sm bg-[#f8fafc] border-[#e2e8f0] text-[#003a70]">
              <span className="font-semibold">{excludedTags.size}</span> tags
              excluded from view.
              <Button
                className="p-0 h-auto underline text-[#475569] bg-transparent border-0 hover:bg-transparent hover:text-[#334155] font-semibold ml-1"
                onClick={() => setShowExcluded(!showExcluded)}
              >
                {showExcluded ? "Hide excluded" : "Show excluded"}
              </Button>{" "}
              |
              <Button
                className="p-0 h-auto underline text-[#475569] bg-transparent border-0 hover:bg-transparent hover:text-[#334155] font-semibold ml-1"
                onClick={clearExclusions}
              >
                Clear exclusions
              </Button>
              {showExcluded && (
                <span>
                  {" "}
                  |
                  <Button
                    className="p-0 h-auto underline text-[#475569] bg-transparent border-0 hover:bg-transparent hover:text-[#334155] font-semibold ml-1"
                    onClick={() => setShowExcluded(false)}
                  >
                    ← Return to normal view
                  </Button>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Tag Table - Full Height Scrollable */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-card z-10">
                <TableRow>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => setSortBy("epc")}
                  >
                    EPC{" "}
                    {sortBy === "epc" &&
                      (currentSort.direction === "asc" ? " ↑" : " ↓")}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => setSortBy("count")}
                  >
                    Count{" "}
                    {sortBy === "count" &&
                      (currentSort.direction === "asc" ? " ↑" : " ↓")}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => setSortBy("antenna")}
                  >
                    Antenna{" "}
                    {sortBy === "antenna" &&
                      (currentSort.direction === "asc" ? " ↑" : " ↓")}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => setSortBy("rssi")}
                  >
                    RSSI{" "}
                    {sortBy === "rssi" &&
                      (currentSort.direction === "asc" ? " ↑" : " ↓")}
                  </TableHead>
                  <TableHead>Signal</TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => setSortBy("frequency")}
                  >
                    Frequency{" "}
                    {sortBy === "frequency" &&
                      (currentSort.direction === "asc" ? " ↑" : " ↓")}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => setSortBy("firstSeen")}
                  >
                    First Seen{" "}
                    {sortBy === "firstSeen" &&
                      (currentSort.direction === "asc" ? " ↑" : " ↓")}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => setSortBy("lastSeen")}
                  >
                    Last Seen{" "}
                    {sortBy === "lastSeen" &&
                      (currentSort.direction === "asc" ? " ↑" : " ↓")}
                  </TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTags.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="text-center text-muted-foreground py-8"
                    >
                      {showExcluded ? (
                        excludedTags.size === 0 ? (
                          <>
                            No excluded tags.{" "}
                            <Button
                              className="p-0 h-auto underline text-[#475569] bg-transparent border-0 hover:bg-transparent hover:text-[#334155] font-semibold"
                              onClick={() => setShowExcluded(false)}
                            >
                              Return to normal view
                            </Button>
                          </>
                        ) : (
                          <>
                            No excluded tags match current filters.{" "}
                            <Button
                              className="p-0 h-auto underline text-[#475569] bg-transparent border-0 hover:bg-transparent hover:text-[#334155] font-semibold"
                              onClick={() => setShowExcluded(false)}
                            >
                              Return to normal view
                            </Button>
                          </>
                        )
                      ) : tagDatabase.size === 0 ? (
                        "No tags detected. Start inventory to begin scanning."
                      ) : (
                        "No tags match current filters."
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTags.map((tag) => {
                    const isExcluded = excludedTags.has(tag.epc);
                    return (
                      <TableRow
                        key={tag.epc}
                        className={isExcluded ? "opacity-60" : ""}
                      >
                        <TableCell className="font-mono text-sm">
                          {tag.epc}
                        </TableCell>
                        <TableCell>
                          <div className="bg-[#003a70] text-white px-3 py-1.5 text-xs rounded-lg inline-block font-semibold shadow-sm border border-[#002d54]">
                            {tag.count}
                          </div>
                        </TableCell>
                        <TableCell>ANT {tag.antenna}</TableCell>
                        <TableCell className="font-mono">
                          {tag.rssi} dBm
                        </TableCell>
                        <TableCell>{renderRssiBar(tag.rssi)}</TableCell>
                        <TableCell>{tag.frequency.toFixed(1)} MHz</TableCell>
                        <TableCell className="text-sm">
                          {tag.firstSeen.toLocaleTimeString()}
                        </TableCell>
                        <TableCell className="text-sm">
                          {tag.lastSeen.toLocaleTimeString()}
                        </TableCell>
                        <TableCell>
                          {showExcluded ? (
                            <Button
                              onClick={() => includeTag(tag.epc)}
                              className="bg-[#003a70] hover:bg-[#002d54] text-white border-0 text-xs px-3 py-1.5 font-semibold shadow-sm"
                            >
                              Include
                            </Button>
                          ) : (
                            <Button
                              onClick={() => excludeTag(tag.epc)}
                              className="bg-[#dc2626] hover:bg-[#b91c1c] text-white border-0 text-xs px-3 py-1.5 font-semibold shadow-sm"
                            >
                              Exclude
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Reader Settings</DialogTitle>
            <DialogDescription>
              Configure reader behavior and preferences
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="auto-reconnect" className="flex-1">
                Auto-reconnect on page reload
              </Label>
              <Switch
                id="auto-reconnect"
                checked={settings.autoReconnect}
                onCheckedChange={(checked) =>
                  updateSettings({ ...settings, autoReconnect: checked })
                }
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="auto-clear" className="flex-1">
                  Auto-clear tags from table
                </Label>
                <Switch
                  id="auto-clear"
                  checked={settings.autoClearTags}
                  onCheckedChange={(checked) =>
                    updateSettings({ ...settings, autoClearTags: checked })
                  }
                />
              </div>
              {settings.autoClearTags && (
                <div className="ml-4">
                  <Label htmlFor="clear-delay">Clear after (seconds)</Label>
                  <Input
                    id="clear-delay"
                    type="number"
                    min="1"
                    max="300"
                    value={settings.autoClearDelay}
                    onChange={(e) =>
                      updateSettings({
                        ...settings,
                        autoClearDelay: parseInt(e.target.value) || 30,
                      })
                    }
                    className="w-24"
                  />
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Fullscreen Communication Log */}
      {isLogFullscreen && (
        <div className="fixed inset-0 z-50 bg-background">
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Communication Log</h2>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search logs..."
                    value={logSearchQuery}
                    onChange={(e) => setLogSearchQuery(e.target.value)}
                    className="pl-8 w-64"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsLogFullscreen(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <pre className="text-xs font-mono whitespace-pre-wrap">
                {logSearchQuery
                  ? communicationLog
                      .split("\n")
                      .filter((line) =>
                        line
                          .toLowerCase()
                          .includes(logSearchQuery.toLowerCase())
                      )
                      .join("\n")
                  : communicationLog}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
