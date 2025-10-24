"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import SingleOrder from "./single-order";
import { toast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

// Add custom CSS classes instead of inline styles to avoid TypeScript errors
// We'll use these class names in our JSX

// --- VMR64 Protocol & WebSerial helpers (from app/reader/page.tsx) ---
const FREQUENCY_TABLE: Record<string, number> = { "00": 865.0, "01": 865.5, "02": 866.0, "03": 866.5, "04": 867.0, "05": 867.5, "06": 868.0, "07": 902.0, "08": 902.5, "09": 903.0, "0A": 903.5, "0B": 904.0, "0C": 904.5, "0D": 905.0, "0E": 905.5, "0F": 906.0, "10": 906.5, "11": 907.0, "12": 907.5, "13": 908.0, "14": 908.5, "15": 909.0, "16": 909.5, "17": 910.0, "18": 910.5, "19": 911.0, "1A": 911.5, "1B": 912.0, "1C": 912.5, "1D": 913.0, "1E": 913.5, "1F": 914.0, "20": 914.5, "21": 915.0, "22": 915.5, "23": 916.0, "24": 916.5, "25": 917.0, "26": 917.5, "27": 918.0, "28": 918.5, "29": 919.0, "2A": 919.5, "2B": 920.0, "2C": 920.5, "2D": 921.0, "2E": 921.5, "2F": 922.0, "30": 922.5, "31": 923.0, "32": 923.5, "33": 924.0, "34": 924.5, "35": 925.0, "36": 925.5, "37": 926.0, "38": 926.5, "39": 927.0, "3A": 927.5, "3B": 928.0 };
const RSSI_DBM: Record<string, number> = { "6E": -19, "6D": -20, "6C": -21, "6B": -22, "6A": -23, "69": -24, "68": -25, "67": -26, "66": -27, "65": -28, "64": -29, "63": -30, "62": -31, "61": -32, "60": -33, "5F": -34, "5E": -35, "5D": -36, "5C": -37, "5B": -38, "5A": -39, "59": -41, "58": -42, "57": -43, "56": -44, "55": -45, "54": -46, "53": -47, "52": -48, "51": -49, "50": -50, "4F": -51, "4E": -52, "4D": -53, "4C": -54, "4B": -55, "4A": -56, "49": -57, "48": -58, "47": -59, "46": -60, "45": -61, "44": -62, "43": -63, "42": -64, "41": -65, "40": -66, "3F": -67, "3E": -68, "3D": -69, "3C": -70, "3B": -71, "3A": -72, "39": -73, "38": -74, "37": -75, "36": -76, "35": -77, "34": -78, "33": -79, "32": -80, "31": -81, "30": -82, "2F": -83, "2E": -84, "2D": -85, "2C": -86, "2B": -87, "2A": -88, "29": -89, "28": -90, "27": -91, "26": -92, "25": -93, "24": -94, "23": -95, "22": -96, "21": -97, "20": -98, "1F": -99 };

const VMR64 = {
  packetType: 0xa0,
  commands: { FAST_SWITCH_ANT_INVENTORY: 0x8a, INV_OFF: 0x88 },
  addresses: { FAST_SWITCH_ANT_INVENTORY: 0xff, INV_OFF: 0xff },
  inventorySettings: { interval: 0x01, repeat: 0x01, stayTime: 0x01 },
  antennas: { 1: { enabled: true, power: 30 }, 2: { enabled: true, power: 30 }, 3: { enabled: true, power: 30 }, 4: { enabled: true, power: 30 } },
  getEnabledAntennas(): number[] {
    return Object.entries(this.antennas as Record<string, { enabled: boolean; power: number }>).filter(([_, a]) => a.enabled).map(([id]) => parseInt(id));
  },
  generateFastSwitchData(): number[] {
    const enabled = this.getEnabledAntennas();
    const data: number[] = [];
    for (let i = 0; i < 4; i++) {
      const antennaId = enabled[i % enabled.length];
      data.push(antennaId - 1);
      data.push(this.inventorySettings.stayTime);
    }
    data.push(this.inventorySettings.interval);
    data.push(this.inventorySettings.repeat);
    return data;
  },
  get inventoryData(): number[] { return this.generateFastSwitchData(); },
  parseInventory(data: number[]): { epc: string; antenna: number; rssi: number; frequency: number } | null {
    if (!data || data.length < 4) return null;
    if (data.length >= 5 && data[3] === this.commands.FAST_SWITCH_ANT_INVENTORY) {
      const freqAnt = data[4];
      const antenna = (freqAnt & 0x03) + 1;
      const chIdx = freqAnt >> 2;
      const pcLow = data[5];
      const epcWords = (pcLow >> 3) & 0x1f;
      const epcLen = epcWords * 2;
      const epcStart = 7;
      let epcEnd = epcStart + epcLen;
      if (epcEnd > data.length - 2) epcEnd = data.length - 2;
      const epc = data.slice(epcStart, epcEnd).map((b: number) => b.toString(16).padStart(2, "0")).join("").toUpperCase();
      if (epc) {
        const rssiByte = data[data.length - 2];
        const rssi = RSSI_DBM[rssiByte.toString(16).toUpperCase().padStart(2, "0")] || -100;
        const frequency = FREQUENCY_TABLE[chIdx.toString(16).toUpperCase().padStart(2, "0")] || 865.0;
        if (rssi > -99) return { epc, antenna, rssi, frequency };
      }
    }
    return null;
  },
};

function makePacket(cmd: number, data: number[] = []): number[] {
  const dataLen = data.length + 3;
  const message: number[] = [VMR64.packetType, dataLen, VMR64.addresses.FAST_SWITCH_ANT_INVENTORY, cmd, ...data];
  let sum = 0;
  for (let i = 0; i < message.length; i++) sum += message[i];
  const checksum = (~sum + 1) & 0xff;
  message.push(checksum);
  return message;
}

// --- Mock product database ---
const mockProducts = [
  {
    epcPrefix: "E200001A",
    itemCode: "UQ-TSHIRT-001",
    itemName: "UNIQLO Supima Cotton T-Shirt",
    standardSellingRate: 249000,
    image: "https://image.uniqlo.com/UQ/ST3/AsianCommon/imagesgoods/455070/item/goods_09_455070.jpg",
  },
  {
    epcPrefix: "E200001B",
    itemCode: "UQ-JEANS-002",
    itemName: "UNIQLO Ultra Stretch Jeans",
    standardSellingRate: 599000,
    image: "https://image.uniqlo.com/UQ/ST3/AsianCommon/imagesgoods/455070/item/goods_69_455070.jpg",
  },
  {
    epcPrefix: "E200001C",
    itemCode: "UQ-HOODIE-003",
    itemName: "UNIQLO Dry Sweat Hoodie",
    standardSellingRate: 499000,
    image: "https://image.uniqlo.com/UQ/ST3/AsianCommon/imagesgoods/455070/item/goods_32_455070.jpg",
  },
  // Add more products as needed
];
const unknownProductImg = "https://via.placeholder.com/80x80?text=No+Image";

// --- Cart/Order Types ---
interface CartItem {
  itemCode: string;
  itemName: string;
  standardSellingRate: number;
  epcs: string[];
  image: string;
}

function generateRandomId() { return Date.now().toString(36) + "-" + Math.random().toString(36).substring(2, 8); }

// --- Main Component ---
export default function UniqloRFIDCheckoutScanner() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [taxPercentage, setTaxPercentage] = useState(0);
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [showWelcomeScreen, setShowWelcomeScreen] = useState(true);
  const [animationComplete, setAnimationComplete] = useState(false);
  const [isActivelyShopping, setIsActivelyShopping] = useState(false);
  const epcTimestamps = useRef<Map<string, number>>(new Map());
  const portRef = useRef<any>(null);
  const readerRef = useRef<any>(null);
  const writerRef = useRef<any>(null);
  const readBufferRef = useRef<number[]>([]);
  const inventoryLoopRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // --- WebSerial Auto Connect & Inventory Loop ---
  useEffect(() => {
    let cancelled = false;
    async function autoConnectAndStart() {
      if (!navigator.serial) {
        toast({ title: "WebSerial not supported", description: "Please use a compatible browser." });
        return;
      }
      const ports = await navigator.serial.getPorts();
      const port = ports[0];
      if (!port) return; // Don't auto-prompt
      await connectToPort(port);
    }
    autoConnectAndStart();
    return () => {
      cancelled = true;
      if (inventoryLoopRef.current) clearInterval(inventoryLoopRef.current);
      if (readerRef.current) readerRef.current.cancel();
      if (writerRef.current) writerRef.current.releaseLock();
      if (portRef.current) {
        try {
          portRef.current.close();
        } catch (e) {
          console.error("Error closing port:", e);
        }
      }
      setIsConnected(false);
    };
    // eslint-disable-next-line
  }, []);

  // --- EPC Buffer Processing ---
  function processBuffer(data: number[]) {
    let buffer = [...(readBufferRef.current || []), ...data];
    while (buffer.length > 0) {
      const startIndex = buffer.indexOf(0xa0);
      if (startIndex === -1) { buffer = []; break; }
      if (startIndex > 0) buffer = buffer.slice(startIndex);
      if (buffer.length < 2) break;
      const length = buffer[1];
      const frameLen = length + 2;
      if (buffer.length < frameLen) break;
      const frame = buffer.slice(0, frameLen);
      buffer = buffer.slice(frameLen);
      const tag = VMR64.parseInventory(frame);
      if (tag && tag.epc) handleEpcScan(tag.epc);
    }
    readBufferRef.current = buffer;
  }

  // --- EPC Scan Handler (add to cart) ---
  function handleEpcScan(epc: string) {
    // Only add to cart when actively shopping (not on welcome screen, payment screen, or thank you screen)
    

    // Find product by EPC prefix
    const product = mockProducts.find(p => epc.startsWith(p.epcPrefix));
    const now = Date.now();
    epcTimestamps.current.set(epc, now);
    
    let newItemAdded = false;
    
    setCartItems(prev => {
      // If product not found, add as unknown
      const itemCode = product ? product.itemCode : epc.slice(0, 8);
      const itemName = product ? product.itemName : "Unknown Product";
      const standardSellingRate = product ? product.standardSellingRate : 99000;
      const image = product ? product.image : unknownProductImg;
      const existingIndex = prev.findIndex(item => item.itemCode === itemCode);
      
      if (existingIndex >= 0) {
        const updated = [...prev];
        newItemAdded = true;
        if (newItemAdded) {
          playAudio("/beep.mp3");
        }
        if (!updated[existingIndex].epcs.includes(epc)) {
          updated[existingIndex] = {
            ...updated[existingIndex],
            epcs: [...updated[existingIndex].epcs, epc],
          };
        }
        return updated;
      } else {
        newItemAdded = true;
        if (newItemAdded) {
          playAudio("/beep.mp3");
        }
        return [
          ...prev,
          {
            itemCode,
            itemName,
            standardSellingRate,
            epcs: [epc],
            image,
          },
        ];
      }
    });
    console.log("newItemAdded", newItemAdded);
    // Play beep sound when a new item is added
   
  }

  // --- Remove item from cart (not used in UI) ---
  function handleRemoveItem(epc: string) {
    // This function is kept for potential future use but is not exposed in the UI
    // as per requirement to prevent customers from removing items
    setCartItems(prev => prev.filter(item => item.epcs[0] !== epc));
    toast({ title: "Item Removed", description: "The item has been removed from the cart" });
  }

  // --- Order Totals ---
  const subtotal = cartItems.reduce((acc, item) => acc + item.standardSellingRate, 0);
  const discount = (subtotal * discountPercentage) / 100;
  const tax = ((subtotal - discount) * taxPercentage) / 100;
  const totalDue = subtotal - discount + tax;

  // --- Add a function to handle manual device selection
  async function handleChooseDevice() {
    if (!navigator.serial) {
      toast({ title: "WebSerial not supported", description: "Please use a compatible browser." });
      return;
    }
    try {
      const port = await navigator.serial.requestPort();
      if (!port) return;
      await connectToPort(port);

    } catch {
      return;
    }
  }

  // --- Refactor connection logic into a reusable function
  async function connectToPort(port: any) {
    try {
      setIsConnecting(true);
      portRef.current = port;
      await port.open({ baudRate: 115200, dataBits: 8, stopBits: 1, parity: "none", flowControl: "none" });
      if (!port.readable || !port.writable) {
        toast({ title: "Connection Error", description: "Device is not readable or writable." });
        setIsConnecting(false);
        return;
      }
      const portReader = port.readable.getReader();
      const portWriter = port.writable.getWriter();
      readerRef.current = portReader;
      writerRef.current = portWriter;
      
      // Start inventory loop
      const sendInventory = () => {
        if (!writerRef.current) return;
        const pkt = makePacket(VMR64.commands.FAST_SWITCH_ANT_INVENTORY, VMR64.inventoryData);
        writerRef.current.write(new Uint8Array(pkt));
      };
      inventoryLoopRef.current = setInterval(sendInventory, 100);
      
      // Start reading
      const readLoop = async () => {
        try {
          while (port && port.readable) {
            const { value, done } = await portReader.read();
            if (done) {
              setIsConnected(false);
              break;
            }
            if (value) processBuffer(Array.from(value));
          }
        } catch (error) {
          console.error("Read error:", error);
          setIsConnected(false);
        }
      };
      readLoop();
      setIsConnected(true);
      toast({ title: "Connected", description: "RFID reader connected successfully." });
    } catch (error) {
      console.error("Connection error:", error);
      toast({ title: "Connection Failed", description: "Could not connect to RFID reader." });
      setIsConnected(false);
    } finally {
      setIsConnecting(false);
    }
  }

  // --- Rescan all items ---
  function handleRescanAll() {
    setCartItems([]);
    toast({ title: "Cart Cleared", description: "All items have been removed. Please scan items again." });
  }

  // --- Payment State Management ---
  const [showPaymentPage, setShowPaymentPage] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'qr' | 'cash' | null>(null);
  const [showThankYou, setShowThankYou] = useState(false);
  
  // --- Audio Playback Function with check for already played ---
  const [audioPlayed, setAudioPlayed] = useState<Record<string, boolean>>({});
  
  const playAudio = (src: string) => {
    // Check if this specific audio has already been played
    if (audioPlayed[src]) {
      console.log(`Audio ${src} already played, skipping`);
      return;
    }
    
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    
    audioRef.current = new Audio(src);
    audioRef.current.play().catch(error => {
      console.error("Audio playback failed:", error);
    });
    
    // Mark this audio as played
    setAudioPlayed(prev => ({
      ...prev,
      [src]: true
    }));
  };
  
  // Reset played audio when starting a new order
  const resetAudioPlayed = () => {
    setAudioPlayed({});
  };
  
  // --- Handle Start Scanning ---
  function handleStartScanning() {
    // Animate out the welcome screen with a nice transition
    const welcomeScreen = document.querySelector('.h-screen.w-full.overflow-hidden');
    if (welcomeScreen) {
      // Add a class for animation if needed
      setTimeout(() => {
        setShowWelcomeScreen(false);
        setIsActivelyShopping(true); // Start actively shopping
        playAudio("/place-item.mp3");
      }, 300); // Short delay for transition
    } else {
      setShowWelcomeScreen(false);
      setIsActivelyShopping(true); // Start actively shopping
      playAudio("/place-item.mp3");
    }
  }
  
  // --- Handle screen click to play welcome audio ---
  function handleScreenClick() {
    if (showWelcomeScreen) {
      playAudio("/welcome.mp3");
    }
  }

  // --- Handle Next Button Click ---
  function handleNextClick() {
    if (cartItems.length > 0) {
      setIsActivelyShopping(false); // Stop actively shopping when going to payment
      setShowPaymentPage(true);
      playAudio("/scan-qr.mp3");
    }
  }

  // --- Handle Payment Selection ---
  function handlePaymentSelection(method: 'qr' | 'cash') {
    setPaymentMethod(method);
    if (method === 'cash') {
      // For cash payment, go directly to thank you page
      setShowThankYou(true);
    }
  }

  // --- Handle Payment Completion ---
  function handlePaymentComplete() {
    setShowThankYou(true);
    playAudio("/thank-you.mp3");
  }

  // --- Handle New Order ---
  function handleNewOrder() {
    setCartItems([]);
    setShowPaymentPage(false);
    setPaymentMethod(null);
    setShowThankYou(false);
    setShowWelcomeScreen(true);
    setAnimationComplete(false);
    setIsActivelyShopping(false); // Reset shopping state
    resetAudioPlayed(); // Reset audio played state
    playAudio("/welcome.mp3");
  }

  // --- Generate QR Code URL ---
  const qrCodeUrl = `https://vietqr.co/api/generate/acb/23003737/ONG%20THANH%20BINH/${totalDue}/CHUYEN%20TIEN%20AN?isMask=0&logo=1&style=2&bg=61`;

  // Audio will only play after user interaction, not automatically on load

  // --- UI ---
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {showWelcomeScreen ? (
              <div className="h-screen w-full overflow-hidden relative" onClick={handleScreenClick}>
                <motion.div 
                  className="h-full w-full flex flex-col items-center justify-center relative"
                  initial={{ backgroundColor: "#FFF6EE" }}
                  animate={{ 
                    backgroundColor: ["#FFF6EE", "#FFE4C4", "#FFF6EE"],
                  }}
                  transition={{ 
                    duration: 20, 
                    repeat: Infinity,
                    repeatType: "mirror"
                  }}
                >
                  {/* Floating ambient orbs */}
                  {Array.from({ length: 50 }).map((_, i) => {
                    const size = Math.random() * 4 + 2;
                    return (
                      <motion.div
                        key={`orb-${i}`}
                        className="absolute rounded-full bg-orange-300"
                        style={{
                          width: `${size}px`,
                          height: `${size}px`,
                          top: `${Math.random() * 100}%`,
                          left: `${Math.random() * 100}%`,
                          opacity: 0.15 + Math.random() * 0.25
                        }}
                        animate={{
                          y: ["0%", "8%", "0%"]
                        }}
                        transition={{ duration: 6 + Math.random() * 4, repeat: Infinity }}
                      />
                    );
                  })}

                  {/* Light blobs like sunshine ripples */}
                  {/* <motion.div 
                    className="absolute w-[800px] h-[800px] rounded-full bg-orange-200 opacity-30 blur-3xl"
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={{ duration: 20, repeat: Infinity }}
                  />
                  <motion.div 
                    className="absolute w-[600px] h-[600px] rounded-full bg-orange-100 opacity-25 blur-2xl"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 18, repeat: Infinity }}
                  />
                  <motion.div 
                    className="absolute w-[1000px] h-[1000px] rounded-full bg-orange-50 opacity-20 blur-2xl"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 25, repeat: Infinity }}
                  /> */}

                  {/* Center ripples */}
                  {/* {Array.from({ length: 3 }).map((_, i) => (
                    <motion.div
                      key={`ripple-${i}`}
                      className="absolute rounded-full border border-orange-300"
                      style={{
                        left: '50%',
                        top: '50%',
                        translateX: '-50%',
                        translateY: '-50%',
                        width: '20px',
                        height: '20px',
                        opacity: 0.3
                      }}
                      initial={{ scale: 0 }}
                      animate={{ 
                        scale: [0, 15],
                        opacity: [0.3, 0]
                      }}
                      transition={{ 
                        duration: 6 + i * 2,
                        repeat: Infinity,
                        delay: i * 1.5,
                        ease: "easeOut"
                      }}
                    />
                  ))} */}

                  {/* Radiating light particles */}
                  {Array.from({ length: 20 }).map((_, i) => {
                    const size = Math.random() * 3 + 1;
                    const startX = Math.random() * window.innerWidth;
                    const startY = Math.random() * window.innerHeight;
                    const angle = Math.random() * 360;
                    const distance = 200 + Math.random() * 200;
                    const endX = startX + Math.cos(angle * Math.PI / 180) * distance;
                    const endY = startY + Math.sin(angle * Math.PI / 180) * distance;
                    return (
                      <motion.div
                        key={`particle-${i}`}
                        className="absolute bg-orange-400 rounded-full"
                        style={{
                          width: `${size}px`,
                          height: `${size}px`,
                          boxShadow: `0 0 ${size * 2}px ${size}px rgba(255,140,0,0.3)`,
                        }}
                        initial={{ x: startX, y: startY, opacity: 0 }}
                        animate={{ x: [startX, endX], y: [startY, endY], opacity: [0, 0.8, 0] }}
                        transition={{ duration: 6 + Math.random() * 4, repeat: Infinity, ease: "easeInOut" }}
                      />
                    );
                  })}

                  {/* Glowing orbs floating up */}
                  {Array.from({ length: 8 }).map((_, i) => {
                    const left = Math.random() * 100;
                    const delay = i * 1.2;
                    return (
                      <motion.div
                        key={`float-${i}`}
                        className="absolute rounded-full bg-gradient-to-br from-orange-200 to-orange-400 shadow-md"
                        style={{
                          width: "24px",
                          height: "24px",
                          left: `${left}%`,
                          bottom: "-40px"
                        }}
                        initial={{ y: 0, opacity: 0.3 }}
                        animate={{ y: -window.innerHeight, opacity: [0.3, 0.8, 0] }}
                        transition={{ duration: 10, delay, repeat: Infinity, ease: "easeInOut" }}
                      />
                    );
                  })}

                  {/* Main Content */}
                  <div className="z-10 text-center">
                    <AnimatePresence>
                      <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, delay: 0.5 }}
                        onAnimationComplete={() => setAnimationComplete(true)}
                      >
                        <motion.div className="flex flex-col items-center">
                          {/* <motion.div 
                            className="flex items-center justify-center mb-4"
                            animate={{ scale: [1, 1.05, 1] }}
                            transition={{ duration: 3, repeat: Infinity, repeatType: "mirror" }}
                          >
                            <motion.div 
                              className="w-12 h-12 mr-4 rounded-full bg-gradient-to-r from-orange-300 to-orange-600"
                              animate={{ 
                                boxShadow: [
                                  "0 0 5px rgba(255,140,0,0.5)",
                                  "0 0 20px rgba(255,140,0,0.8)",
                                  "0 0 5px rgba(255,140,0,0.5)"
                                ]
                              }}
                              transition={{ duration: 2, repeat: Infinity, repeatType: "mirror" }}
                            />
                            <motion.div 
                              className="w-8 h-8 rounded-full bg-gradient-to-r from-orange-400 to-orange-700"
                              animate={{ 
                                boxShadow: [
                                  "0 0 5px rgba(255,140,0,0.5)",
                                  "0 0 15px rgba(255,140,0,0.8)",
                                  "0 0 5px rgba(255,140,0,0.5)"
                                ]
                              }}
                              transition={{ duration: 1.5, repeat: Infinity, repeatType: "mirror", delay: 0.5 }}
                            />
                          </motion.div> */}
                          <motion.h1 
                            className="text-6xl font-bold text-[#8B3A00] mb-8"
                            animate={{ scale: [1, 1.05, 1] }}
                            transition={{ duration: 3, repeat: Infinity, repeatType: "mirror" }}
                          >
                            <span className="text-orange-500">Nextwaves</span> RFID <br/>Self-Checkout
                          </motion.h1>
                        </motion.div>
                      </motion.div>
                    </AnimatePresence>

                    {animationComplete && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                      >
                        <motion.button 
                          onClick={handleStartScanning} 
                          className="bg-gradient-to-r from-white to-orange-100 text-[#D35400] text-3xl font-bold py-6 px-16 rounded-xl shadow-lg transition relative overflow-hidden"
                          whileHover={{ scale: 1.05, boxShadow: "0 10px 25px rgba(0,0,0,0.2)" }}
                          whileTap={{ scale: 0.98 }}
                          animate={{
                            boxShadow: [
                              "0 5px 15px rgba(211,84,0,0.3)",
                              "0 15px 25px rgba(211,84,0,0.5)",
                              "0 5px 15px rgba(211,84,0,0.3)"
                            ]
                          }}
                          transition={{
                            boxShadow: {
                              duration: 2,
                              repeat: Infinity,
                              repeatType: "mirror"
                            }
                          }}
                        >
                          <motion.span 
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-orange-300 to-transparent"
                            style={{ width: '200%' }}
                            animate={{ x: ["-100%", "100%"] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                          />
                          <span className="relative z-10">Start Shopping</span>
                        </motion.button>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              </div>

        ) : !showPaymentPage && !showThankYou ? (
        // --- Scanning Page ---
        <>
          {/* Header: NEXTWAVES logo and Scan Item */}
          <div className="flex items-center justify-between px-12 py-6 border-b border-gray-200 bg-white shadow-sm">
            <div className="flex items-center gap-6">
              <span className="text-3xl font-bold text-black tracking-tight">Self checkout</span>
              
              {/* Connection Status Indicator */}
              <div className="flex items-center ml-4">
                <div className={`w-3 h-3 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm font-medium">{isConnected ? 'Reader Connected' : 'Reader Disconnected'}</span><br/>
                </div>
                <div className="flex items-center ml-4">

                <div className={`w-3 h-3 rounded-full mr-2 ${isActivelyShopping ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm font-medium">{isActivelyShopping ? 'Shopping' : 'Not Reading'}</span>

              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {!isConnected && (
                <button
                  onClick={handleChooseDevice}
                  disabled={isConnecting}
                  className={`bg-orange-500 hover:bg-[#004d99] text-white text-xl font-bold px-6 py-3 rounded-lg shadow transition ${isConnecting ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {isConnecting ? 'Connecting...' : 'Connect Reader'}
                </button>
              )}
              <button
                onClick={handleRescanAll}
                className="bg-orange-500 hover:bg-[#004d99] text-white text-xl font-bold px-6 py-3 rounded-lg shadow transition"
              >
                Rescan All
              </button>
            </div>
          </div>

          <div className="flex-1 flex flex-col items-center justify-start px-8 py-8 overflow-y-auto">
            <div className="w-full max-w-4xl bg-white rounded-xl shadow-md overflow-hidden">
              {/* Cart Items */}
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">Scanned Items</h2>
                  <div className="text-xl font-medium">{cartItems.length} items</div>
                </div>
                
                {cartItems.length > 0 ? (
                  <div className="space-y-6">
                    {cartItems.map((item) => (
                      <div key={item.epcs[0]} className="flex items-center justify-between border-b border-gray-200 pb-6">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">{item.itemName}</h3>
                          <p className="text-gray-600 font-mono">{item.itemCode}</p>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-2xl font-bold text-gray-900">{item.standardSellingRate.toLocaleString("vi-VN")} ₫</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-24 text-center">
                    <p className="text-3xl text-gray-400 font-bold">Please place items in the checkout area</p>
                    <p className="text-gray-500 mt-2">Items will appear here when scanned</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Bar: Order Summary & Checkout */}
          <div className="sticky bottom-0 left-0 w-full bg-white border-t border-gray-200 shadow-lg z-50 flex justify-center items-center px-8 py-6">
            <div className="w-full max-w-4xl flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <span className="text-2xl text-black font-bold">Total</span>
                <span className="text-5xl font-extrabold text-orange-500 tracking-tight">{totalDue.toLocaleString("vi-VN")} ₫</span>
              </div>
              <button
                onClick={handleNextClick}
                className={`ml-8 px-16 py-6 text-3xl font-bold rounded-xl shadow transition ${cartItems.length ? 'bg-orange-500 text-white hover:bg-[#004d99]' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                style={{ minWidth: 240 }}
                disabled={cartItems.length === 0}
              >
                NEXT
              </button>
            </div>
          </div>
        </>
      ) : showPaymentPage && !showThankYou ? (
        // --- Payment Page ---
        <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gray-50">
          <div className="w-full max-w-4xl bg-white rounded-xl shadow-lg overflow-hidden p-8">
            <h1 className="text-4xl font-bold text-center mb-8">Select Payment Method</h1>
            
            {!paymentMethod ? (
              <div className="flex flex-col space-y-6">
                <button 
                  onClick={() => handlePaymentSelection('qr')} 
                  className="bg-orange-500 hover:bg-[#004d99] text-white text-2xl font-bold py-8 px-6 rounded-xl shadow transition flex items-center justify-center"
                >
                  Pay by QR Code
                </button>
                <button 
                  onClick={() => handlePaymentSelection('cash')} 
                  className="bg-orange-500 hover:bg-[#004d99] text-white text-2xl font-bold py-8 px-6 rounded-xl shadow transition flex items-center justify-center"
                >
                  Pay by Cash
                </button>
              </div>
            ) : paymentMethod === 'qr' ? (
              <div className="flex flex-col items-center">
                <div className="mb-6 text-center">
                  <h2 className="text-3xl font-bold mb-2">Scan to Pay</h2>
                  <p className="text-xl font-medium text-orange-500">{totalDue.toLocaleString("vi-VN")} ₫</p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-md mb-8">
                  <img src={qrCodeUrl} alt="QR Code for payment" className="w-80 h-80" />
                </div>
                <button 
                  onClick={handlePaymentComplete} 
                  className="bg-orange-500 hover:bg-[#004d99] text-white text-2xl font-bold py-4 px-12 rounded-xl shadow transition"
                >
                  Done
                </button>
              </div>
            ) : null}
            
            <div className="mt-8 text-center">
              <button 
                onClick={() => {
                  setShowPaymentPage(false);
                  setPaymentMethod(null);
                  setIsActivelyShopping(true); // Resume active shopping when going back to cart
                }} 
                className="text-orange-500 font-medium text-xl hover:underline"
              >
                Back to Cart
              </button>
            </div>
          </div>
        </div>
      ) : (
        // --- Thank You Page ---
        <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gray-50">
          <div className="w-full max-w-4xl bg-white rounded-xl shadow-lg overflow-hidden p-8 text-center">
            {/* <h1 className="text-5xl font-bold text-orange-500 mb-8">Thank You!</h1>
            <div className="mb-8">
              <img 
                src="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcDdtY2JxZnBxbXQzaWJvNGVlcWRvYnRlcWRqcnRnMWZlcWRzeCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l4q8cJzGdR9J8w3hS/giphy.gif" 
                alt="Thank you" 
                className="w-96 h-auto mx-auto rounded-lg"
              />
            </div> */}
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="mb-8 flex justify-center items-center"
              >
                <motion.h1
                  initial={{ scale: 0.9 }}
                  animate={{ scale: [1, 1.05, 1], rotate: [0, 1, -1, 0] }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatType: "loop",
                    ease: "easeInOut",
                  }}
                  className="text-5xl font-extrabold text-orange-500 drop-shadow-lg text-center"
                >
                  Thank You 💖
                </motion.h1>
              </motion.div>
            </AnimatePresence>
            <p className="text-2xl mb-8">Your payment has been processed successfully!</p>
            <button 
              onClick={handleNewOrder} 
              className="bg-orange-500 hover:bg-[#004d99] text-white text-2xl font-bold py-4 px-12 rounded-xl shadow transition"
            >
              New Order
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
