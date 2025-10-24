"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Serial API type definitions
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

interface SensorProtocol {
  packetType: number;
  commands: Record<string, number>;
  buildFrame: (cmd: number, data?: number[]) => number[];
  parseGPIO: (data: number[]) => { sensorA: boolean; sensorB: boolean } | null;
}

// Sensor protocol for GPIO control
const sensorProtocol: SensorProtocol = {
  packetType: 0xa0,
  commands: {
    READ_GPIO: 0x60,
    WRITE_GPIO: 0x61,
  },
  buildFrame(cmd: number, data: number[] = []) {
    const length = data.length + 1;
    const frame = [this.packetType, length, cmd, ...data];
    const checksum = frame.reduce((sum, byte) => (sum + byte) & 0xff, 0);
    return [...frame, checksum];
  },
  parseGPIO(data: number[]) {
    if (data.length < 6 || data[0] !== 0xa0 || data[2] !== 0x61) return null;
    const gpioStatus = data[3];
    return {
      sensorA: (gpioStatus & 0x01) !== 0,
      sensorB: (gpioStatus & 0x02) !== 0,
    };
  },
};

function checksum(buffer: number[], start: number, length: number) {
  return buffer.slice(start, start + length).reduce((sum, byte) => (sum + byte) & 0xff, 0);
}

function make(cmd: number, data: number[] = []) {
  const length = data.length + 3;
  const buffer = [0xff, length, cmd, ...data];
  const cs = checksum(buffer, 1, buffer.length - 1);
  buffer.push(cs);
  return buffer;
}

export default function SensorControlPage() {
  const [port, setPort] = useState<SerialPort | null>(null);
  const [writer, setWriter] = useState<WritableStreamDefaultWriter<Uint8Array> | null>(null);
  const [sensorA, setSensorA] = useState(false);
  const [sensorB, setSensorB] = useState(false);
  const [communicationLog, setCommunicationLog] = useState("");
  const logRef = useRef<HTMLDivElement>(null);

  const log = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setCommunicationLog((prev) => `${prev}[${timestamp}] ${message}\n`);
    setTimeout(() => {
      if (logRef.current) {
        logRef.current.scrollTop = logRef.current.scrollHeight;
      }
    }, 10);
  };

  const selectSerialPort = async () => {
    try {
      if ("serial" in navigator) {
        const selectedPort = await navigator.serial.requestPort();
        setPort(selectedPort);
        log("Port selected successfully");
      } else {
        log("Serial API not supported");
      }
    } catch (error) {
      log(`Port selection failed: ${error}`);
    }
  };

  const connectDevice = async () => {
    if (!port) return;
    try {
      await port.open({ baudRate: 115200 });
      if (port.writable) {
        const portWriter = port.writable.getWriter();
        setWriter(portWriter);
        log("Device connected successfully");
        if (port.readable) {
          startReading(port.readable.getReader());
        }
        startSensorReading();
      }
    } catch (error) {
      log(`Connection failed: ${error}`);
    }
  };

  const disconnectDevice = async () => {
    try {
      if (writer) {
        await writer.close();
        setWriter(null);
      }
      if (port) {
        await port.close();
        setPort(null);
      }
      log("Device disconnected");
    } catch (error) {
      log(`Disconnection failed: ${error}`);
    }
  };

  const startReading = async (portReader: ReadableStreamDefaultReader<Uint8Array>) => {
    try {
      while (true) {
        const { value, done } = await portReader.read();
        if (done) break;
        if (value) {
          const buffer = Array.from(value);
          processBuffer(buffer);
        }
      }
    } catch (error) {
      log(`Reading error: ${error}`);
    } finally {
      portReader.releaseLock();
    }
  };

  const processBuffer = (buffer: number[]) => {
    log(`RX: ${buffer.map((b) => b.toString(16).padStart(2, "0")).join(" ")}`);
    
    // Process sensor data
    const sensorData = sensorProtocol.parseGPIO(buffer);
    if (sensorData) {
      setSensorA(sensorData.sensorA);
      setSensorB(sensorData.sensorB);
    }
  };

  const sendCommand = async (arr: number[]) => {
    if (!writer) return;
    try {
      const data = new Uint8Array(arr);
      await writer.write(data);
      log(`TX: ${arr.map((b) => b.toString(16).padStart(2, "0")).join(" ")}`);
    } catch (error) {
      log(`Send error: ${error}`);
    }
  };

  const startSensorReading = async () => {
    const readGPIOCommand = sensorProtocol.buildFrame(sensorProtocol.commands.READ_GPIO);
    await sendCommand(readGPIOCommand);
    
    // Set up periodic sensor reading
    const interval = setInterval(async () => {
      if (writer) {
        await sendCommand(readGPIOCommand);
      } else {
        clearInterval(interval);
      }
    }, 1000);
  };

  const setLed = async (pin: number, on: boolean) => {
    if (!writer) return;
    const value = on ? 1 : 0;
    const command = make(0x96, [pin, value]);
    await sendCommand(command);
    log(`LED ${pin} ${on ? "ON" : "OFF"}`);
  };

  // Cleanup on component unmount
  useEffect(() => {
    const handleDisconnect = () => {
      setPort(null);
      setWriter(null);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-800">Sensor & LED Control</h1>
          <p className="text-gray-600">Monitor sensors and control LED lights</p>
          <div className="flex items-center justify-center gap-2">
            <div
              className={`w-3 h-3 rounded-full ${
                isConnected ? "bg-green-500" : "bg-red-500"
              }`}
            />
            <span className="text-sm font-medium">
              {isConnected ? "Connected" : "Disconnected"}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Device Connection */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500" : "bg-gray-400"}`} />
                  Device Connection
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Button 
                    onClick={selectSerialPort} 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-200"
                  >
                    🔌 Select Port
                  </Button>
                </div>
                
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

            {/* Communication Log */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">📡 Communication Log</CardTitle>
              </CardHeader>
              <CardContent>
                <div ref={logRef} className="bg-gray-900 text-green-400 font-mono text-xs p-4 rounded border h-64 overflow-y-auto">
                  {communicationLog || "No communication yet..."}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Sensor Status */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">🔍 Sensor Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className={`p-4 rounded-lg border-2 transition-all duration-300 ${
                    sensorA 
                      ? "bg-green-100 border-green-400 shadow-lg shadow-green-200" 
                      : "bg-gray-100 border-gray-300"
                  }`}>
                    <div className="text-center space-y-2">
                      <div className={`w-12 h-12 rounded-full mx-auto flex items-center justify-center text-2xl ${
                        sensorA ? "bg-green-500 text-white" : "bg-gray-400 text-white"
                      }`}>
                        🔘
                      </div>
                      <div className="font-semibold">Sensor A</div>
                      <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                        sensorA 
                          ? "bg-green-500 text-white" 
                          : "bg-gray-400 text-white"
                      }`}>
                        <div className={`w-2 h-2 rounded-full ${
                          sensorA ? "bg-white" : "bg-gray-200"
                        }`} />
                        {sensorA ? "ON" : "OFF"}
                      </div>
                    </div>
                  </div>

                  <div className={`p-4 rounded-lg border-2 transition-all duration-300 ${
                    sensorB 
                      ? "bg-green-100 border-green-400 shadow-lg shadow-green-200" 
                      : "bg-gray-100 border-gray-300"
                  }`}>
                    <div className="text-center space-y-2">
                      <div className={`w-12 h-12 rounded-full mx-auto flex items-center justify-center text-2xl ${
                        sensorB ? "bg-green-500 text-white" : "bg-gray-400 text-white"
                      }`}>
                        🔘
                      </div>
                      <div className="font-semibold">Sensor B</div>
                      <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                        sensorB 
                          ? "bg-green-500 text-white" 
                          : "bg-gray-400 text-white"
                      }`}>
                        <div className={`w-2 h-2 rounded-full ${
                          sensorB ? "bg-white" : "bg-gray-200"
                        }`} />
                        {sensorB ? "ON" : "OFF"}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* LED Control */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">💡 LED Control</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Green LED */}
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-green-500"></div>
                      <span className="font-semibold text-green-800">Green LED</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      onClick={() => setLed(3, true)} 
                      disabled={!isConnected}
                      className="bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-200 disabled:text-gray-500"
                    >
                      🟢 Turn ON
                    </Button>
                    <Button 
                      onClick={() => setLed(3, false)} 
                      disabled={!isConnected}
                      className="bg-green-800 hover:bg-green-900 text-white disabled:bg-gray-200 disabled:text-gray-500"
                    >
                      ⚫ Turn OFF
                    </Button>
                  </div>
                </div>

                {/* Red LED */}
                <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-red-500"></div>
                      <span className="font-semibold text-red-800">Red LED</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      onClick={() => setLed(4, true)} 
                      disabled={!isConnected}
                      className="bg-red-600 hover:bg-red-700 text-white disabled:bg-gray-200 disabled:text-gray-500"
                    >
                      🔴 Turn ON
                    </Button>
                    <Button 
                      onClick={() => setLed(4, false)} 
                      disabled={!isConnected}
                      className="bg-red-800 hover:bg-red-900 text-white disabled:bg-gray-200 disabled:text-gray-500"
                    >
                      ⚫ Turn OFF
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

// Move this block to the bottom to avoid type conflicts
// declare global {
//   interface Navigator {
//     serial: Serial;
//   }
// }

export {};