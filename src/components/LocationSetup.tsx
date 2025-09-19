"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Save, MapPin, Settings, Eye, EyeOff, CheckCircle, XCircle, Loader2 } from "lucide-react";
import {
  Location,
  LocationsData,
  saveLocationData,
  loadLocationsData,
  createEmptyLocation,
  deleteLocationData,
} from "@/lib/storage";
import { maskApiKey } from "@/lib/crypto";
import { toast } from "sonner";
import { validateAllIntegrations, validateIntegrationConnection, ConnectionStatus } from "@/lib/integrations";

interface LocationSetupProps {
  onClose: () => void;
}

const POS_SYSTEMS = ["Square", "Toast"];
const TASK_TRAINING = ["Jolt"];
const SCHEDULING = ["7Shifts"];
const FINANCIAL_MANAGEMENT = ["Restaurant365"];

export default function LocationSetup({ onClose }: LocationSetupProps) {
  const [locationsData, setLocationsData] = useState<LocationsData>({
    locations: [],
  });
  const [showApiKeys, setShowApiKeys] = useState<{ [key: string]: boolean }>(
    {}
  );
  const [newLocationName, setNewLocationName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const data = await loadLocationsData();
        setLocationsData(data);
        
        // Validate connections for all locations after loading
        if (data.locations.length > 0) {
          validateAllConnections(data);
        }
      } catch (error) {
        toast.error("Failed to load locations");
        console.error("Failed to load locations:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Validate connections for all locations
  const validateAllConnections = async (data: LocationsData) => {
    const updatedLocations = await Promise.all(
      data.locations.map(async (location) => {
        const statuses = await validateAllIntegrations(location.integrations);
        return {
          ...location,
          integrations: {
            posSystem: { ...location.integrations.posSystem, status: statuses.posSystem },
            taskTraining: { ...location.integrations.taskTraining, status: statuses.taskTraining },
            scheduling: { ...location.integrations.scheduling, status: statuses.scheduling },
            financialManagement: { ...location.integrations.financialManagement, status: statuses.financialManagement }
          }
        };
      })
    );

    setLocationsData({ locations: updatedLocations });
  };

  // Validate connection for a single integration
  const validateSingleConnection = async (
    locationId: string,
    integrationType: keyof Location["integrations"],
    providerType: string,
    apiKey: string
  ) => {
    const status = await validateIntegrationConnection(integrationType, providerType, apiKey);
    
    setLocationsData(prev => ({
      locations: prev.locations.map(loc =>
        loc.id === locationId
          ? {
              ...loc,
              integrations: {
                ...loc.integrations,
                [integrationType]: {
                  ...loc.integrations[integrationType],
                  status
                }
              }
            }
          : loc
      )
    }));

    return status;
  };

  const handleAddLocation = () => {
    if (!newLocationName.trim()) return;

    const newLocation = createEmptyLocation(newLocationName.trim());
    const updatedData = {
      locations: [...locationsData.locations, newLocation],
    };

    setLocationsData(updatedData);
    setNewLocationName("");
  };

  const handleRemoveLocation = async (locationId: string) => {
    try {
      const result = await deleteLocationData(locationId);
      if (result.success) {
        const updatedData = {
          locations: locationsData.locations.filter(
            (loc) => loc.id !== locationId
          ),
        };
        setLocationsData(updatedData);
        toast.success("Location deleted successfully");
      } else {
        toast.error(result.error || "Failed to delete location");
      }
    } catch (error) {
      toast.error("Failed to delete location");
      console.error("Delete location error:", error);
    }
  };

  const handleLocationNameChange = (locationId: string, name: string) => {
    const updatedData = {
      locations: locationsData.locations.map((loc) =>
        loc.id === locationId ? { ...loc, name } : loc
      ),
    };
    setLocationsData(updatedData);
  };

  const handleIntegrationChange = async (
    locationId: string,
    integrationType: keyof Location["integrations"],
    field: "type" | "apiKey",
    value: string
  ) => {
    const updatedData = {
      locations: locationsData.locations.map((loc) =>
        loc.id === locationId
          ? {
              ...loc,
              integrations: {
                ...loc.integrations,
                [integrationType]: {
                  ...loc.integrations[integrationType],
                  [field]: value,
                  status: field === 'apiKey' ? 'Checking...' as const : loc.integrations[integrationType].status,
                },
              },
            }
          : loc
      ),
    };
    setLocationsData(updatedData);

    // If API key changed, validate the connection
    if (field === 'apiKey' && value.trim()) {
      const location = updatedData.locations.find(loc => loc.id === locationId);
      if (location) {
        const integration = location.integrations[integrationType];
        await validateSingleConnection(locationId, integrationType, integration.type, value);
      }
    }
  };

  const handleSaveLocation = async (locationId: string) => {
    const location = locationsData.locations.find(
      (loc) => loc.id === locationId
    );
    if (!location) {
      toast.error("Location not found");
      return;
    }

    try {
      const result = await saveLocationData(location);
      if (result.success) {
        toast.success(`Location "${location.name}" saved successfully!`);
      } else {
        toast.error(result.error || "Failed to save location");
      }
    } catch (error) {
      toast.error("Failed to save location");
      console.error("Save location error:", error);
    }
  };

  const toggleApiKeyVisibility = (key: string) => {
    setShowApiKeys((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const getApiKeyDisplay = (apiKey: string, keyId: string) => {
    if (!apiKey) return "";
    return showApiKeys[keyId] ? apiKey : maskApiKey(apiKey);
  };

  const renderConnectionStatus = (status: ConnectionStatus) => {
    switch (status) {
      case 'Connected':
        return (
          <div className="flex items-center text-green-600 text-sm mt-1">
            <CheckCircle className="h-3 w-3 mr-1" />
            Connected ✅
          </div>
        );
      case 'Disconnected':
        return (
          <div className="flex items-center text-red-600 text-sm mt-1">
            <XCircle className="h-3 w-3 mr-1" />
            Disconnected ❌
          </div>
        );
      case 'Checking...':
      default:
        return (
          <div className="flex items-center text-gray-500 text-sm mt-1">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Checking...
          </div>
        );
    }
  };

  return (
    <motion.div
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 300, opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="w-96 bg-background border-l border-border p-6 overflow-y-auto h-full"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Settings className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Location Setup</h2>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Add New Location */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-sm flex items-center">
            <Plus className="h-4 w-4 mr-2" />
            Add New Location
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="location-name">Location Name</Label>
            <Input
              id="location-name"
              placeholder="e.g., Downtown Outlet"
              value={newLocationName}
              onChange={(e) => setNewLocationName(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleAddLocation()}
            />
          </div>
          <Button
            onClick={handleAddLocation}
            className="w-full"
            disabled={!newLocationName.trim()}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Location
          </Button>
        </CardContent>
      </Card>

      {/* Existing Locations */}
      <div className="space-y-6">
        {locationsData.locations.map((location) => (
          <Card key={location.id} className="relative">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  <Input
                    value={location.name}
                    onChange={(e) =>
                      handleLocationNameChange(location.id, e.target.value)
                    }
                    className="font-medium border-none p-0 h-auto focus-visible:ring-0"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveLocation(location.id)}
                  className="h-6 w-6 text-destructive hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* POS System */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">POS System</Label>
                <Select
                  value={location.integrations.posSystem.type}
                  onValueChange={(value: string) =>
                    handleIntegrationChange(
                      location.id,
                      "posSystem",
                      "type",
                      value
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {POS_SYSTEMS.map((system) => (
                      <SelectItem key={system} value={system}>
                        {system}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="relative">
                  <Input
                    type={
                      showApiKeys[`${location.id}-pos`] ? "text" : "password"
                    }
                    placeholder="API Key"
                    value={getApiKeyDisplay(
                      location.integrations.posSystem.apiKey,
                      `${location.id}-pos`
                    )}
                    onChange={(e) =>
                      handleIntegrationChange(
                        location.id,
                        "posSystem",
                        "apiKey",
                        e.target.value
                      )
                    }
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => toggleApiKeyVisibility(`${location.id}-pos`)}
                  >
                    {showApiKeys[`${location.id}-pos`] ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {renderConnectionStatus(location.integrations.posSystem.status)}
              </div>

              {/* Task & Training */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Task & Training</Label>
                <Select
                  value={location.integrations.taskTraining.type}
                  onValueChange={(value: string) =>
                    handleIntegrationChange(
                      location.id,
                      "taskTraining",
                      "type",
                      value
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TASK_TRAINING.map((system) => (
                      <SelectItem key={system} value={system}>
                        {system}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="relative">
                  <Input
                    type={
                      showApiKeys[`${location.id}-task`] ? "text" : "password"
                    }
                    placeholder="API Key"
                    value={getApiKeyDisplay(
                      location.integrations.taskTraining.apiKey,
                      `${location.id}-task`
                    )}
                    onChange={(e) =>
                      handleIntegrationChange(
                        location.id,
                        "taskTraining",
                        "apiKey",
                        e.target.value
                      )
                    }
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() =>
                      toggleApiKeyVisibility(`${location.id}-task`)
                    }
                  >
                    {showApiKeys[`${location.id}-task`] ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {renderConnectionStatus(location.integrations.taskTraining.status)}
              </div>

              {/* Scheduling */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Scheduling</Label>
                <Select
                  value={location.integrations.scheduling.type}
                  onValueChange={(value: string) =>
                    handleIntegrationChange(
                      location.id,
                      "scheduling",
                      "type",
                      value
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SCHEDULING.map((system) => (
                      <SelectItem key={system} value={system}>
                        {system}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="relative">
                  <Input
                    type={
                      showApiKeys[`${location.id}-schedule`]
                        ? "text"
                        : "password"
                    }
                    placeholder="API Key"
                    value={getApiKeyDisplay(
                      location.integrations.scheduling.apiKey,
                      `${location.id}-schedule`
                    )}
                    onChange={(e) =>
                      handleIntegrationChange(
                        location.id,
                        "scheduling",
                        "apiKey",
                        e.target.value
                      )
                    }
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() =>
                      toggleApiKeyVisibility(`${location.id}-schedule`)
                    }
                  >
                    {showApiKeys[`${location.id}-schedule`] ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {renderConnectionStatus(location.integrations.scheduling.status)}
              </div>

              {/* Financial Management */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Financial Management
                </Label>
                <Select
                  value={location.integrations.financialManagement.type}
                  onValueChange={(value: string) =>
                    handleIntegrationChange(
                      location.id,
                      "financialManagement",
                      "type",
                      value
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FINANCIAL_MANAGEMENT.map((system) => (
                      <SelectItem key={system} value={system}>
                        {system}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="relative">
                  <Input
                    type={
                      showApiKeys[`${location.id}-financial`]
                        ? "text"
                        : "password"
                    }
                    placeholder="API Key"
                    value={getApiKeyDisplay(
                      location.integrations.financialManagement.apiKey,
                      `${location.id}-financial`
                    )}
                    onChange={(e) =>
                      handleIntegrationChange(
                        location.id,
                        "financialManagement",
                        "apiKey",
                        e.target.value
                      )
                    }
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() =>
                      toggleApiKeyVisibility(`${location.id}-financial`)
                    }
                  >
                    {showApiKeys[`${location.id}-financial`] ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {renderConnectionStatus(location.integrations.financialManagement.status)}
              </div>

              <Separator />

              {/* Save Button */}
              <Button
                onClick={() => handleSaveLocation(location.id)}
                className="w-full"
                variant="default"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Location
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {locationsData.locations.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No locations configured yet.</p>
          <p className="text-sm">Add your first location to get started.</p>
        </div>
      )}
    </motion.div>
  );
}
