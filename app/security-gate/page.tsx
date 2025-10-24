"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// WebSerial API Type Declarations
declare global {
  interface Navigator {
    serial: Serial;
  }
  interface Serial {
    requestPort(): Promise<SerialPort>;
    getPorts(): Promise<SerialPort[]>;
  }
  interface SerialPort {
    open(options: SerialOptions): Promise<void>;
    close(): Promise<void>;
    readable: ReadableStream<Uint8Array> | null;
    writable: WritableStream<Uint8Array> | null;
    getInfo(): SerialPortInfo;
  }
  interface SerialOptions {
    baudRate: number;
  }
  interface SerialPortInfo {
    usbVendorId?: number;
    usbProductId?: number;
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
  lastSeen: Date;
}

interface ReaderProtocol {
  packetType: number;
  commands: Record<string, number>;
  addresses: Record<string, number>;
  antennas: Record<number, { enabled: boolean }>;
  inventorySettings: { interval: number; repeat: number; stayTime: number };
  getEnabledAntennas: () => number[];
  generateFastSwitchData: () => number[];
  parseInventory: (data: number[]) => { epc: string; antenna: number; rssi: number; frequency: number } | null;
  calculateRSSI: (rssiByte: number) => number;
  calculateFrequency: (chIdx: number) => number;
}

interface SensorProtocol {
  packetType: number;
  commands: Record<string, number>;
  buildFrame: (cmd: number, data?: number[]) => number[];
  parseGPIO: (data: number[]) => { sensorA: boolean; sensorB: boolean } | null;
}

// Reader Protocol
const ReaderProtocols: Record<string, ReaderProtocol> = {
  VMR64: {
    packetType: 0xa0,
    commands: {
      INV_ON: 0x8a,
      INV_OFF: 0x88,
      FAST_SWITCH_ANT_INVENTORY: 0x8a,
    },
    addresses: {
      INV_ON: 0xff,
      INV_OFF: 0xff,
      FAST_SWITCH_ANT_INVENTORY: 0xff,
    },
    antennas: {
      1: { enabled: true }, 2: { enabled: true }, 3: { enabled: true }, 4: { enabled: true },
    },
    inventorySettings: { interval: 0x01, repeat: 0x01, stayTime: 0x01 },
    getEnabledAntennas() {
      return Object.entries(this.antennas)
        .filter(([_, antenna]) => antenna.enabled)
        .map(([id]) => parseInt(id));
    },
    generateFastSwitchData() {
      const enabled = this.getEnabledAntennas();
      if (enabled.length === 0) enabled.push(1);
      const data = [];
      for (let i = 0; i < 4; i++) {
        const antennaId = enabled[i % enabled.length];
        data.push(antennaId - 1);
        data.push(this.inventorySettings.stayTime);
      }
      data.push(this.inventorySettings.interval);
      data.push(this.inventorySettings.repeat);
      return data;
    },
    parseInventory(data: number[]) {
      if (data.length < 5 || data[3] !== this.commands.FAST_SWITCH_ANT_INVENTORY) return null;
      const freqAnt = data[4];
      const antenna = (freqAnt & 0x03) + 1;
      const chIdx = freqAnt >> 2;
      const pcLow = data[5];
      const epcWords = (pcLow >> 3) & 0x1f;
      const epcLen = epcWords * 2;
      const epcStart = 7;
      const epcEnd = Math.min(epcStart + epcLen, data.length - 2);
      const epc = data
        .slice(epcStart, epcEnd)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("")
        .toUpperCase();
      if (epc) {
        const rssiByte = data[data.length - 2];
        const rssi = this.calculateRSSI(rssiByte);
        const frequency = this.calculateFrequency(chIdx);
        if (rssi > -99) return { epc, antenna, rssi, frequency };
      }
      return null;
    },
    calculateRSSI(rssiByte: number) {
      const hexKey = rssiByte.toString(16).toUpperCase().padStart(2, "0");
      return RSSI_DBM[hexKey] || -100;
    },
    calculateFrequency(chIdx: number) {
      const hexKey = chIdx.toString(16).toUpperCase().padStart(2, "0");
      return FREQUENCY_TABLE[hexKey] || 865.0;
    },
  },
};

// Sensor Protocol
const SensorProtocols: Record<string, SensorProtocol> = {
  VMR64: {
    packetType: 0xa0,
    commands: {
      READ_GPIO: 0x60,
      WRITE_GPIO: 0x61,
    },
    buildFrame(cmd: number, data: number[] = []) {
      const len = data.length + 3;
      const message = [this.packetType, len, 0xff, cmd, ...data];
      let sum = 0;
      for (const b of message) sum += b;
      message.push((~sum + 1) & 0xff);
      return message;
    },
    parseGPIO(data: number[]) {
      if (data.length < 6 || data[3] !== this.commands.READ_GPIO) return null;
      const rawA = data[4];
      const rawB = data[5];
      return {
        sensorA: rawA !== 0,
        sensorB: rawB === 0,
      };
    },
  },
};

// Message Builder
const MessageBuilder = {
  checksum(buffer: number[], start: number, length: number) {
    let sum = 0;
    for (let i = start; i < start + length; i++) sum += buffer[i];
    return (~sum + 1) & 0xff;
  },
  make(protocol: ReaderProtocol, readId: number, cmd: number, data: number[] = []) {
    const dataLen = data.length + 3;
    const message = [protocol.packetType, dataLen, readId, cmd, ...data];
    const checksum = this.checksum(message, 0, message.length);
    message.push(checksum);
    return message;
  },
};

export default function ReaderPage() {
  // State
  const [port, setPort] = useState<SerialPort | null>(null);
  const [reader, setReader] = useState<ReadableStreamDefaultReader<Uint8Array> | null>(null);
  const [writer, setWriter] = useState<WritableStreamDefaultWriter<Uint8Array> | null>(null);
  const [isInventoryRunning, setIsInventoryRunning] = useState(false);
  const [readBuffer, setReadBuffer] = useState<number[]>([]);
  const [tagDatabase, setTagDatabase] = useState<Map<string, TagData>>(new Map());
  const [readCount, setReadCount] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "disconnected" | "scanning">("disconnected");
  const [communicationLog, setCommunicationLog] = useState<string>("");
  const [sensorA, setSensorA] = useState(false);
  const [sensorB, setSensorB] = useState(false);

  const logRef = useRef<HTMLDivElement>(null);
  const isInventoryRunningRef = useRef(false);
  const writerRef = useRef<WritableStreamDefaultWriter<Uint8Array> | null>(null);
  const readCountRef = useRef(0);
  const lastReadTimeRef = useRef(Date.now());
  const protocol = ReaderProtocols.VMR64;
  const sensorProtocol = SensorProtocols.VMR64;

  // Update refs
  useEffect(() => {
    isInventoryRunningRef.current = isInventoryRunning;
    writerRef.current = writer;
  }, [isInventoryRunning, writer]);

  // Log function
  const log = useCallback((text: string) => {
    const timestamp = new Date().toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
    const millis = new Date().getMilliseconds().toString().padStart(3, "0");
    setCommunicationLog((prev) => `[${timestamp}.${millis}] ${text}\n` + prev.slice(0, 10000));
    setTimeout(() => logRef.current && (logRef.current.scrollTop = logRef.current.scrollHeight), 0);
  }, []);

  // Serial Operations
  const selectSerialPort = async () => {
    if (!navigator.serial) {
      alert("WebSerial not supported");
      return;
    }
    try {
      const selectedPort = await navigator.serial.requestPort();
      setPort(selectedPort);
      log("Port selected");
    } catch (e: any) {
      if (e.name !== "NotFoundError") log(`Port selection failed: ${e.message}`);
    }
  };

  const connectDevice = async () => {
    if (!port) return;
    try {
      await port.open({ baudRate: 115200 });
      const portReader = port.readable?.getReader();
      const portWriter = port.writable?.getWriter();
      if (portReader && portWriter) {
        setReader(portReader);
        setWriter(portWriter);
        startReading(portReader);
        setConnectionStatus("connected");
        log("Serial port connected");
      }
    } catch (e: any) {
      log(`Connection failed: ${e.message}`);
      setPort(null);
    }
  };

  const disconnectDevice = async () => {
    if (isInventoryRunning) await stopInventory();
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
      setConnectionStatus("disconnected");
      log("Serial port disconnected");
    } catch (e: any) {
      log(`Disconnect failed: ${e.message}`);
    }
  };

  const startReading = async (portReader: ReadableStreamDefaultReader<Uint8Array>) => {
    try {
      while (port && port.readable) {
        const { value, done } = await portReader.read();
        if (done) break;
        setReadBuffer((prev) => {
          const newBuffer = [...prev, ...Array.from(value)];
          processBuffer(newBuffer);
          return newBuffer;
        });
      }
    } catch (e: any) {
      if (e.name !== "NetworkError") log(`Read error: ${e.message}`);
    }
  };

  const processBuffer = (buffer: number[]) => {
    let workingBuffer = [...buffer];
    while (workingBuffer.length > 0) {
      const startIndex = workingBuffer.indexOf(0xa0);
      if (startIndex === -1) {
        setReadBuffer([]);
        break;
      }
      if (startIndex > 0) workingBuffer = workingBuffer.slice(startIndex);
      if (workingBuffer.length < 2) break;
      const length = workingBuffer[1];
      const frameLen = length + 2;
      if (workingBuffer.length < frameLen) break;
      const frame = workingBuffer.slice(0, frameLen);
      workingBuffer = workingBuffer.slice(frameLen);
      const hexStr = frame.map((b) => b.toString(16).padStart(2, "0")).join(" ");
      log(`IN  ${hexStr}`);

      // Process RFID inventory
      const tagData = protocol.parseInventory(frame);
      if (tagData) {
        const now = new Date();
        setTagDatabase((prev) => {
          const newDb = new Map(prev);
          if (newDb.has(tagData.epc)) {
            const tag = newDb.get(tagData.epc)!;
            tag.count++;
            tag.lastSeen = now;
            tag.rssi = tagData.rssi;
            tag.antenna = tagData.antenna;
            tag.frequency = tagData.frequency;
          } else {
            newDb.set(tagData.epc, {
              epc: tagData.epc,
              count: 1,
              antenna: tagData.antenna,
              rssi: tagData.rssi,
              frequency: tagData.frequency,
              lastSeen: now,
            });
          }
          return newDb;
        });
        readCountRef.current++;
      }

      // Process sensor data
      const sensorData = sensorProtocol.parseGPIO(frame);
      if (sensorData) {
        setSensorA(sensorData.sensorA);
        setSensorB(sensorData.sensorB);
      }
    }
    setReadBuffer(workingBuffer);
  };

  const sendCommand = async (arr: number[]) => {
    if (!writer) return;
    try {
      const hexStr = arr.map((b) => b.toString(16).padStart(2, "0")).join(" ");
      log(`OUT ${hexStr}`);
      await writer.write(new Uint8Array(arr));
    } catch (e: any) {
      log(`Send failed: ${e.message}`);
    }
  };

  const startInventory = async () => {
    if (isInventoryRunning) return;
    try {
      setIsInventoryRunning(true);
      setConnectionStatus("scanning");
      log("Inventory started");
      inventoryLoop();
    } catch (e: any) {
      log(`Failed to start inventory: ${e.message}`);
      setIsInventoryRunning(false);
      setConnectionStatus("connected");
    }
  };

  const inventoryLoop = async () => {
    const loopInterval = setInterval(async () => {
      if (isInventoryRunningRef.current && writerRef.current) {
        try {
          await sendCommand(
            MessageBuilder.make(
              protocol,
              protocol.addresses.FAST_SWITCH_ANT_INVENTORY,
              protocol.commands.FAST_SWITCH_ANT_INVENTORY,
              protocol.generateFastSwitchData()
            )
          );
        } catch (e: any) {
          log(`Inventory loop error: ${e.message}`);
          clearInterval(loopInterval);
          setIsInventoryRunning(false);
          setConnectionStatus("connected");
        }
      } else {
        clearInterval(loopInterval);
      }
    }, 95);
  };

  const stopInventory = async () => {
    if (!isInventoryRunning) return;
    try {
      setIsInventoryRunning(false);
      await sendCommand(
        MessageBuilder.make(
          protocol,
          protocol.addresses.INV_OFF,
          protocol.commands.INV_OFF
        )
      );
      setConnectionStatus("connected");
      log("Inventory stopped");
    } catch (e: any) {
      log(`Failed to stop inventory: ${e.message}`);
    }
  };

  // Sensor control functions
  const startSensorReading = async () => {
    if (!writer) return;
    try {
      const frame = sensorProtocol.buildFrame(sensorProtocol.commands.READ_GPIO);
      await sendCommand(frame);
    } catch (e: any) {
      log(`Failed to start sensor reading: ${e.message}`);
    }
  };

  const setLed = async (pin: number, on: boolean) => {
    if (!writer) return;
    try {
      const frame = sensorProtocol.buildFrame(sensorProtocol.commands.WRITE_GPIO, [pin, on ? 1 : 0]);
      await sendCommand(frame);
      log(`LED${pin} ${on ? 'ON' : 'OFF'}`);
    } catch (e: any) {
      log(`Failed to set LED: ${e.message}`);
    }
  };

  // Start sensor reading when connected
  useEffect(() => {
    if (writer) {
      const interval = setInterval(startSensorReading, 200);
      return () => clearInterval(interval);
    }
  }, [writer]);

  // Effects
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const timeDiff = (now - lastReadTimeRef.current) / 1000;
      if (timeDiff >= 1) {
        setReadCount(Math.round(readCountRef.current / timeDiff));
        readCountRef.current = 0;
        lastReadTimeRef.current = now;
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleDisconnect = () => {
      setPort(null);
      setReader(null);
      setWriter(null);
      setIsInventoryRunning(false);
      setConnectionStatus("disconnected");
      log("Device disconnected");
    };
    if ("serial" in navigator) {
      navigator.serial.addEventListener("disconnect", handleDisconnect);
      return () => navigator.serial.removeEventListener("disconnect", handleDisconnect);
    }
  }, [log]);

  useEffect(() => {
    return () => {
      if (port) disconnectDevice();
    };
  }, []);

  const isConnected = !!(port && writer);
  const tags = Array.from(tagDatabase.values());

  return (
    <div className="flex h-screen bg-background">
      {/* Left Sidebar - Controls */}
      <div className="w-80 p-4 space-y-4 overflow-y-auto border-r">
        <h1 className="text-xl font-bold">RFID Reader</h1>
        <div className="flex items-center gap-2">
          <div
            className={`w-3 h-3 rounded-full ${connectionStatus === "scanning" ? "animate-pulse" : ""} ${
              connectionStatus === "connected" ? "bg-green-500" : connectionStatus === "scanning" ? "bg-blue-500" : "bg-red-500"
            }`}
          />
          <span className="text-sm">{connectionStatus === "scanning" ? "Scanning..." : connectionStatus === "connected" ? "Connected" : "Disconnected"}</span>
        </div>

        {/* Device Connection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500" : "bg-gray-400"}`} />
              Device Connection
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Port Selection */}
            <div className="space-y-2">
              <Button 
                onClick={selectSerialPort} 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-200"
              >
                🔌 Select Port
              </Button>
            </div>
            
            {/* Connection Actions */}
            <div className="grid grid-cols-2 gap-2">
              <Button 
                onClick={connectDevice} 
                disabled={isConnected || !port} 
                className="bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-200 disabled:text-gray-500 transition-colors duration-200"
              >
                ▶️ Connect
              </Button>
              <Button 
                onClick={disconnectDevice} 
                disabled={!isConnected} 
                className="bg-red-600 hover:bg-red-700 text-white disabled:bg-gray-200 disabled:text-gray-500 transition-colors duration-200"
              >
                ⏹️ Disconnect
              </Button>
            </div>
            
            {/* Device Info */}
            <div className="border rounded-lg bg-gradient-to-r from-gray-50 to-gray-100 p-3 shadow-sm">
              {port ? (
                <div className="text-sm">
                  {(() => {
                    const info = port.getInfo();
                    const vid = info.usbVendorId?.toString(16).padStart(4, "0").toUpperCase();
                    const pid = info.usbProductId?.toString(16).padStart(4, "0").toUpperCase();
                    return (
                      <div className="space-y-1">
                        <div className="font-semibold text-gray-800 flex items-center gap-2">
                          🔧 {vid && pid ? `Device ${vid}:${pid}` : "Serial Port"}
                        </div>
                        <div className="text-gray-600 text-xs">
                          {vid && pid ? `VID: ${vid} • PID: ${pid}` : "Device ready for connection"}
                        </div>
                        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          isConnected 
                            ? "bg-green-100 text-green-700" 
                            : "bg-yellow-100 text-yellow-700"
                        }`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${
                            isConnected ? "bg-green-500" : "bg-yellow-500"
                          }`} />
                          {isConnected ? "Connected" : "Ready"}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div className="text-sm text-gray-500 flex items-center gap-2">
                  ⚠️ No port selected
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Sensor Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Sensor Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <span>Sensor A:</span>
              <span className={`font-medium ${sensorA ? "text-green-600" : "text-red-600"}`}>
                {sensorA ? "ON" : "OFF"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Sensor B:</span>
              <span className={`font-medium ${sensorB ? "text-green-600" : "text-red-600"}`}>
                {sensorB ? "ON" : "OFF"}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* LED Control */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">LED Control</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={() => setLed(3, true)} className="bg-green-600 hover:bg-green-700 text-white">
                Green ON
              </Button>
              <Button onClick={() => setLed(3, false)} className="bg-green-600 hover:bg-green-700 text-white">
                Green OFF
              </Button>
              <Button onClick={() => setLed(4, true)} className="bg-red-600 hover:bg-red-700 text-white">
                Red ON
              </Button>
              <Button onClick={() => setLed(4, false)} className="bg-red-600 hover:bg-red-700 text-white">
                Red OFF
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Inventory Control */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Inventory Control</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              onClick={startInventory}
              disabled={!isConnected || isInventoryRunning}
              className={`w-full ${isInventoryRunning ? "bg-gray-200 text-black" : "bg-blue-600 hover:bg-blue-700 text-white"}`}
            >
              {isInventoryRunning ? "Scanning..." : "Start Inventory"}
            </Button>
            <Button
              onClick={stopInventory}
              disabled={!isConnected || !isInventoryRunning}
              className="w-full bg-red-600 hover:bg-red-700 text-white disabled:bg-gray-200 disabled:text-black"
            >
              Stop Inventory
            </Button>
          </CardContent>
        </Card>

        {/* Communication Log */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Communication Log</CardTitle>
          </CardHeader>
          <CardContent>
            <div ref={logRef} className="bg-gray-100 font-mono text-xs p-3 rounded border h-40 overflow-y-auto">
              {communicationLog || "No communication yet..."}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Panel - Tag Table */}
      <div className="flex-1 flex flex-col h-screen">
        <div className="p-4 bg-white border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Tag Inventory</h2>
            <div className="flex items-center gap-3">
              <span className="bg-blue-600 text-white px-4 py-2 text-sm rounded-lg">{tags.length} Tags</span>
              <span className="bg-gray-100 text-black px-4 py-2 text-sm rounded-lg">{Math.round(readCount)} reads/s</span>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-white">
              <TableRow>
                <TableHead>EPC</TableHead>
                <TableHead>Count</TableHead>
                <TableHead>Antenna</TableHead>
                <TableHead>RSSI</TableHead>
                <TableHead>Frequency</TableHead>
                <TableHead>Last Seen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tags.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                    No tags detected. Start inventory to begin scanning.
                  </TableCell>
                </TableRow>
              ) : (
                tags.map((tag) => (
                  <TableRow key={tag.epc}>
                    <TableCell className="font-mono">{tag.epc}</TableCell>
                    <TableCell>{tag.count}</TableCell>
                    <TableCell>ANT {tag.antenna}</TableCell>
                    <TableCell>{tag.rssi} dBm</TableCell>
                    <TableCell>{tag.frequency.toFixed(1)} MHz</TableCell>
                    <TableCell>{tag.lastSeen.toLocaleTimeString()}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
