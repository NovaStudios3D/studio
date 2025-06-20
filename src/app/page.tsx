
"use client";

import React, { useState, useCallback, useEffect } from 'react';
import ThreeScene from "@/components/cybernox/ThreeScene";
import ToolbarLeft from "@/components/cybernox/ToolbarLeft";
import ObjectListPanel from "@/components/cybernox/ObjectListPanel";
import { useToast } from "@/hooks/use-toast";

export interface SceneObject {
  id: string;
  name: string;
  type: 'Cube' | 'Sphere' | 'Plane' | 'Pyramid' | 'Cylinder' | '3DText' | 'Camera';
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  color: string; // Color might not be relevant for Camera type, but keep for consistency
  // Camera specific properties (optional, could be expanded later)
  fov?: number; 
}

export type ActiveTool = 'Move' | 'Rotate' | 'Scale' | null;

export default function Cybernox3DPage() {
  const { toast } = useToast();
  const [sceneObjects, setSceneObjects] = useState<SceneObject[]>([
    { 
      id: "initial-cube-1", 
      name: "Blue Cube", 
      type: "Cube", 
      position: [-2, 0.5, 0], 
      rotation: [0, Math.PI / 4, 0], 
      scale: [1,1,1], 
      color: "#4285F4"
    },
    { 
      id: "initial-sphere-1", 
      name: "Red Sphere", 
      type: "Sphere", 
      position: [2, 0.75, 1], 
      rotation: [0,0,0], 
      scale: [1.5, 1.5, 1.5], 
      color: "#DB4437" 
    },
    { 
      id: "initial-plane-1", 
      name: "Green Plane", 
      type: "Plane", 
      position: [0, 0.01, -2],
      rotation: [-Math.PI / 2, 0, 0], 
      scale: [3, 2, 1], 
      color: "#0F9D58"
    },
     { 
      id: "initial-cylinder-1", 
      name: "Yellow Cylinder", 
      type: "Cylinder", 
      position: [0, 0.5, 2], 
      rotation: [0,0,0], 
      scale: [0.5, 1, 0.5], 
      color: "#F4B400"
    },
    {
      id: "initial-camera-1",
      name: "Scene Cam 1",
      type: "Camera",
      position: [3, 2, 3],
      rotation: [-Math.PI / 8, Math.PI / 4, 0], // Pointing somewhat towards origin
      scale: [1,1,1], // Scale might not directly affect camera, but good for consistency
      color: "#808080", // Default color for camera gizmo
      fov: 50,
    }
  ]);
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>("initial-cube-1");
  const [activeTool, setActiveTool] = useState<ActiveTool>('Move');
  const [activeSceneCameraId, setActiveSceneCameraId] = useState<string | null>(null);

  const addSceneObject = useCallback((type: SceneObject['type']) => {
    const newObjectId = `object-${Date.now()}`;
    let newObjectName = type;
    let counter = 1;
    while (sceneObjects.some(obj => obj.name === `${newObjectName} ${counter}`)) {
      counter++;
    }
    newObjectName = `${newObjectName} ${counter}`;

    const newObject: SceneObject = {
      id: newObjectId,
      name: newObjectName,
      type: type,
      position: [Math.random() * 4 - 2, 0.5 + Math.random() * 1, Math.random() * 4 - 2],
      rotation: [0, 0, 0],
      scale: type === 'Plane' ? [2,2,1] : [1, 1, 1],
      color: type === 'Camera' ? '#888888' : `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`
    };
    if (type === 'Camera') {
      newObject.fov = 50; // Default FOV for new cameras
      newObject.position = [newObject.position[0], 1.5, newObject.position[2]]; // Cameras usually higher up
    }

    setSceneObjects(prevObjects => [...prevObjects, newObject]);
    setSelectedObjectId(newObjectId);
  }, [sceneObjects]);

  const deleteSelectedObject = useCallback(() => {
    if (!selectedObjectId) {
      toast({ title: "No object selected", description: "Please select an object to delete.", variant: "destructive" });
      return;
    }
    const objectToDelete = sceneObjects.find(obj => obj.id === selectedObjectId);
    setSceneObjects(prevObjects => prevObjects.filter(obj => obj.id !== selectedObjectId));
    
    if (activeSceneCameraId === selectedObjectId) {
      setActiveSceneCameraId(null); // Jump out if active camera is deleted
    }
    
    if (objectToDelete) {
        toast({ title: "Object Deleted", description: `${objectToDelete.name} deleted.`, variant: "destructive" });
    }
    setSelectedObjectId(null);
  }, [selectedObjectId, sceneObjects, toast, activeSceneCameraId]);

  const copySelectedObject = useCallback(() => {
    if (!selectedObjectId) {
      toast({ title: "No object selected", description: "Please select an object to copy.", variant: "destructive" });
      return;
    }
    const originalObject = sceneObjects.find(obj => obj.id === selectedObjectId);
    if (originalObject) {
      const newObjectId = `object-${Date.now()}`;
      let baseName = originalObject.name.replace(/ \(\d+\)$/, "").replace(/ \(Copy \d+\)$/, "").replace(/ \d+$/, "");
      let counter = 1;
      let newObjectName = `${baseName} (Copy ${counter})`;

      while (sceneObjects.some(obj => obj.name === newObjectName)) {
        counter++;
        newObjectName = `${baseName} (Copy ${counter})`;
      }
      
      const newObject: SceneObject = {
        ...originalObject,
        id: newObjectId,
        name: newObjectName,
        position: [
          originalObject.position[0] + 0.5,
          originalObject.position[1],
          originalObject.position[2] + 0.5,
        ],
      };
      setSceneObjects(prevObjects => [...prevObjects, newObject]);
      setSelectedObjectId(newObjectId);
      toast({
        title: "Object Copied",
        description: `${newObject.name} created as a copy of ${originalObject.name}.`,
      });
    }
  }, [selectedObjectId, sceneObjects, toast]);

  const toggleCameraViewMode = useCallback(() => {
    if (activeSceneCameraId) {
      // If currently viewing from a scene camera, jump out
      setActiveSceneCameraId(null);
      toast({ title: "Exited Camera View", description: "Switched back to editor camera."});
    } else if (selectedObjectId) {
      // If an object is selected, try to jump into its view if it's a camera
      const selectedObject = sceneObjects.find(obj => obj.id === selectedObjectId);
      if (selectedObject && selectedObject.type === 'Camera') {
        setActiveSceneCameraId(selectedObjectId);
        toast({ title: "Entered Camera View", description: `Viewing from ${selectedObject.name}.`});
      } else {
        toast({ title: "Cannot Enter View", description: "Selected object is not a camera or no object selected.", variant: "destructive" });
      }
    } else {
       toast({ title: "No Camera Selected", description: "Select a camera object to enter its view.", variant: "destructive" });
    }
  }, [activeSceneCameraId, selectedObjectId, sceneObjects, toast]);
  
  const selectedObjectType = sceneObjects.find(obj => obj.id === selectedObjectId)?.type;

  return (
    <div className="flex h-screen w-screen overflow-hidden antialiased font-body bg-background">
      <ToolbarLeft
        activeTool={activeTool}
        setActiveTool={setActiveTool}
        onAddShape={addSceneObject}
        onDeleteObject={deleteSelectedObject}
        onCopyObject={copySelectedObject}
        onToggleCameraView={toggleCameraViewMode}
        isCameraSelected={selectedObjectType === 'Camera'}
        isViewingFromSceneCamera={!!activeSceneCameraId}
      />
      <main className="flex-1 relative overflow-hidden">
        <ThreeScene
          sceneObjects={sceneObjects}
          setSceneObjects={setSceneObjects} // Pass setter for TransformControls updates
          selectedObjectId={selectedObjectId}
          setSelectedObjectId={setSelectedObjectId}
          activeTool={activeTool}
          activeSceneCameraId={activeSceneCameraId}
        />
      </main>
      <aside className="w-72 bg-card border-l border-border flex flex-col shadow-lg">
        <div className="flex-grow min-h-0">
          <ObjectListPanel
            objects={sceneObjects}
            selectedObjectId={selectedObjectId}
            onSelectObject={setSelectedObjectId}
          />
        </div>
      </aside>
    </div>
  );
}
