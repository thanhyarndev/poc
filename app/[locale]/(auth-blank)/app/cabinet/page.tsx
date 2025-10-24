"use client";
import * as React from "react";
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X, Trash2 } from "lucide-react";
import CabinetDetails from "@/components/page/cabinet-detail";
import { useTranslations } from "next-intl";
import { createCabinet, getCabinets, deleteCabinet } from "@/hooks/api";
import { FaceFrownIcon } from '@heroicons/react/24/outline';
import { toast } from "@/hooks/use-toast";



interface CabinetInfo {
  _id: string;
  name: string;
  status: string;
  expect: number;
  epcList: string[];
}


export default function CabinetDashboard() {
  const [cabinets, setCabinets] = useState<CabinetInfo[]>([]);
  const [activeModal, setActiveModal] = useState<CabinetInfo | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [cabinetToDelete, setCabinetToDelete] = useState<CabinetInfo | null>(null);
  const [newCabinetName, setNewCabinetName] = useState("");
  const [newEpcTag, setNewEpcTag] = useState("");
  const [epcTags, setEpcTags] = useState<string[]>([]);
  const t = useTranslations();

  const fetchCabinets = async () => {
    try {
      const initialCabinets = await getCabinets();
      console.log("Fetched cabinets:", initialCabinets);
      setCabinets(initialCabinets.map((cabinet: CabinetInfo) => ({...cabinet, status: "active"})));
    } catch (error) {
      console.error("Error fetching cabinets:", error);
      toast({
        title: "Error",
        description: "Failed to fetch cabinets",
        variant: "destructive",
      });
    }
  };

  const openModal = (cabinet: CabinetInfo) => {
    if (cabinet.status === "active") {
      setActiveModal(cabinet);
    }
  };

  React.useEffect(() => {
    fetchCabinets();
  }, []);

  const closeModal = () => setActiveModal(null);

  const handleCreateCabinet = async () => {
    // Here you would normally make an API call to create the cabinet
    // For now, we'll just add it to the local state

    const newCabinet = {
      name: newCabinetName.trim(),
      epcList: [...epcTags]
    }

    try {
      console.log("payload: ", newCabinet)
      const api = await createCabinet(newCabinet)
      if (api.statusCode === 200) {
        toast({
          title: "Created successfully",
          description: "New cabinet created successfully",
        });
        
        // Refetch cabinets to update the list
        await fetchCabinets();
      }
      setShowCreateModal(false);
      setNewCabinetName("");
      setEpcTags([]);
            
    } catch (error) {
      toast({
        title: "Failed",
        description: "Something went wrong!"
      })
    }
  };

  const addEpcTag = () => {
    if (newEpcTag.trim() && !epcTags.includes(newEpcTag.trim())) {
      setEpcTags([...epcTags, newEpcTag.trim()]);
      setNewEpcTag("");
    }
  };

  const removeEpcTag = (tagToRemove: string) => {
    setEpcTags(epcTags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addEpcTag();
    }
  };

  const handleDeleteCabinet = async () => {
    if (!cabinetToDelete) return;
    
    try {
      const api = await deleteCabinet(cabinetToDelete._id);
      if (api.statusCode === 200) {
        toast({
          title: "Deleted successfully",
          description: "Cabinet has been deleted",
        });
        
        // Refetch cabinets to update the list
        await fetchCabinets();
      }
      setShowDeleteModal(false);
      setCabinetToDelete(null);
    } catch (error) {
      console.error("Error deleting cabinet:", error);
      toast({
        title: "Failed",
        description: "Failed to delete cabinet",
        variant: "destructive",
      });
    }
  };

  const confirmDelete = (cabinet: CabinetInfo) => {
    setCabinetToDelete(cabinet);
    setShowDeleteModal(true);
  };

  return (
    <div className="min-h-[83vh] bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">RFID Cabinets</h1>
              <p className="mt-2 text-gray-600">Monitor and manage your RFID cabinets in real-time</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm text-gray-600">System Active</span>
              </div>
            </div>
          </div>
        </div>

        {/* {cabinets.length === 0 && (
          <div className="mt-20 flex flex-col items-center text-gray-500">
            <FaceFrownIcon className="w-10 text-gray-400" />
            <p className="text-sm">No cabinets detected</p>
            <p className="text-xs mt-1">Start connecting to detect products</p>
          </div>
        )} */}

        {true && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Create New Cabinet Card */}


          {cabinets.map((cabinet) => (
            <Card
              key={cabinet._id}
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                cabinet.status === "active"
                  ? "border-2 border-green-500 hover:border-green-600"
                  : "border-2 border-gray-300 opacity-60 hover:opacity-80"
              }`}
              onClick={() => openModal(cabinet)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-semibold text-gray-900">
                    {cabinet.name}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      cabinet.status === "active" ? "bg-green-500 animate-pulse" : "bg-gray-400"
                    }`} />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className={`text-sm font-medium ${
                    cabinet.status === "active" ? "text-green-600" : "text-gray-500"
                  }`}>
                    {cabinet.status === "active" ? "Connected" : "Disconnected"}
                  </p>
                  {cabinet.status === "active" && (
                    <>
                      <div className="flex justify-between text-sm text-gray-600">
                        {/* <span>Last Seen:</span> */}
                        {/* <span>{new Date(cabinet.lastSeen || 0).toLocaleTimeString()}</span> */}
                      </div>
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Imported Tags:</span>
                        <span className="font-medium">{cabinet.epcList.length || 0}</span>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex items-center justify-start ">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    confirmDelete(cabinet);
                  }}
                  className=" text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </CardFooter>
            </Card>
          ))}
           <Card
            className="cursor-pointer transition-all duration-200 border-2 border-dashed border-gray-300 hover:border-green-500 flex flex-col items-center justify-center h-[200px]"
            onClick={() => setShowCreateModal(true)}
          >
            <div className="flex flex-col items-center justify-center p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-3">
                <Plus className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">Create New Cabinet</h3>
              <p className="text-sm text-gray-500 mt-1">Add a new RFID cabinet to your system</p>
            </div>
          </Card>
        </div>
        )}

        <Dialog open={!!activeModal} onOpenChange={closeModal}>
          <DialogContent className="max-w-7xl w-full p-6">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-gray-900">
                {activeModal?.name} — Cabinet Details
              </DialogTitle>
            </DialogHeader>

            {activeModal?.status === "active" && (
              <div className="mt-4">
                <CabinetDetails cabinetId={activeModal._id} />
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Create Cabinet Modal */}
        <Dialog open={showCreateModal} onOpenChange={(open) => {
          setShowCreateModal(open);
          if (!open) {
            setEpcTags([]);
            setNewEpcTag("");
            setNewCabinetName("");
          }
        }}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create New Cabinet</DialogTitle>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="name" className="text-right text-sm font-medium">
                  Cabinet Name
                </label>
                <Input
                  id="name"
                  value={newCabinetName}
                  onChange={(e) => setNewCabinetName(e.target.value)}
                  className="col-span-3"
                  placeholder="Enter cabinet name"
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="epc-tag" className="text-right text-sm font-medium">
                  EPC Tags
                </label>
                <div className="col-span-3 space-y-3">
                  <div className="flex gap-2">
                    <Input
                      id="epc-tag"
                      value={newEpcTag}
                      onChange={(e) => setNewEpcTag(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Enter EPC tag"
                      className="flex-1"
                    />
                    <Button 
                      type="button" 
                      onClick={addEpcTag}
                      disabled={!newEpcTag.trim() || epcTags.includes(newEpcTag.trim())}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {epcTags.length > 0 && (
                    <div className="border rounded-md p-2 max-h-[200px] overflow-y-auto">
                      <p className="text-xs text-gray-500 mb-2">Added EPC Tags ({epcTags.length})</p>
                      <div className="flex flex-wrap gap-2">
                        {epcTags.map((tag, index) => (
                          <div 
                            key={index} 
                            className="bg-gray-100 text-gray-800 text-xs rounded-md px-2 py-1 flex items-center gap-1"
                          >
                            <span>{tag}</span>
                            <button 
                              type="button" 
                              onClick={() => removeEpcTag(tag)}
                              className="text-gray-500 hover:text-red-500"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setShowCreateModal(false);
                setEpcTags([]);
                setNewEpcTag("");
                setNewCabinetName("");
              }}>
                Cancel
              </Button>
              <Button onClick={handleCreateCabinet} disabled={!newCabinetName.trim()}>
                Create Cabinet
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Cabinet Confirmation Modal */}
        <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Delete Cabinet</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-sm text-gray-600">
                Are you sure you want to delete the cabinet &quot;{cabinetToDelete?.name}&quot;? This action cannot be undone.
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setShowDeleteModal(false);
                setCabinetToDelete(null);
              }}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDeleteCabinet}
              >
                Delete Cabinet
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
