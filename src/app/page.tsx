
"use client";

import React, { useState, useCallback } from 'react';
import ThreeScene from "@/components/cybernox/ThreeScene";
import ToolbarLeft from "@/components/cybernox/ToolbarLeft";
import ObjectListPanel from "@/components/cybernox/ObjectListPanel";
import { useToast } from "@/hooks/use-toast";

export interface SceneObject {
  id: string;
  name: string;
  type: 'Cube' | 'Sphere' | 'Plane' | 'Pyramid' | 'Cylinder' | '3DText';
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  color: string;
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
      color: "#4285F4" // Primary blue
    },
    { 
      id: "initial-sphere-1", 
      name: "Red Sphere", 
      type: "Sphere", 
      position: [2, 0.75, 1], 
      rotation: [0,0,0], 
      scale: [1.5, 1.5, 1.5], 
      color: "#DB4437" // Red
    },
    { 
      id: "initial-plane-1", 
      name: "Green Plane", 
      type: "Plane", 
      position: [0, 0.01, -2], // Slightly above the grid
      rotation: [-Math.PI / 2, 0, 0], // Lay it flat
      scale: [3, 2, 1], 
      color: "#0F9D58" // Green
    },
     { 
      id: "initial-cylinder-1", 
      name: "Yellow Cylinder", 
      type: "Cylinder", 
      position: [0, 0.5, 2], 
      rotation: [0,0,0], 
      scale: [0.5, 1, 0.5], 
      color: "#F4B400" // Yellow
    },
  ]);
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>("initial-cube-1");
  const [activeTool, setActiveTool] = useState<ActiveTool>('Move'); // Default to Move tool

  const addSceneObject = useCallback((type: SceneObject['type']) => {
    const newObjectId = `object-${Date.now()}`;
    let newObjectName = type;
    let counter = 1;
    // Ensure unique name
    while (sceneObjects.some(obj => obj.name === `${newObjectName} ${counter}`)) {
      counter++;
    }
    newObjectName = `${newObjectName} ${counter}`;

    const newObject: SceneObject = {
      id: newObjectId,
      name: newObjectName,
      type: type,
      position: [Math.random() * 4 - 2, 0.5 + Math.random() * 1, Math.random() * 4 - 2], // Random position for variety
      rotation: [0, 0, 0],
      scale: type === 'Plane' ? [2,2,1] : [1, 1, 1], // Planes might be better a bit larger
      color: `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}` // Random color
    };
    setSceneObjects(prevObjects => [...prevObjects, newObject]);
    setSelectedObjectId(newObjectId);
    // toast({ // Toast on add can be noisy, consider removing or making it optional
    //   title: "Object Added",
    //   description: `${newObject.name} (${newObject.type}) added to the scene.`,
    // });
  }, [sceneObjects]); // Removed toast dependency as it's not used directly in addSceneObject

  const deleteSelectedObject = useCallback(() => {
    if (!selectedObjectId) {
      toast({ title: "No object selected", description: "Please select an object to delete.", variant: "destructive" });
      return;
    }
    const objectToDelete = sceneObjects.find(obj => obj.id === selectedObjectId);
    setSceneObjects(prevObjects => prevObjects.filter(obj => obj.id !== selectedObjectId));
    if (objectToDelete) { // Check if objectToDelete is found before accessing its name
        toast({ title: "Object Deleted", description: `${objectToDelete.name} deleted.`, variant: "destructive" });
    }
    setSelectedObjectId(null);
  }, [selectedObjectId, sceneObjects, toast]);

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

      // Ensure unique name for the copy
      // eslint-disable-next-line no-loop-func
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
        ], // Offset the copy slightly
      };
      setSceneObjects(prevObjects => [...prevObjects, newObject]);
      setSelectedObjectId(newObjectId);
      toast({
        title: "Object Copied",
        description: `${newObject.name} created as a copy of ${originalObject.name}.`,
      });
    }
  }, [selectedObjectId, sceneObjects, toast]);

  return (
    <div className="flex h-screen w-screen overflow-hidden antialiased font-body bg-background">
      <ToolbarLeft
        activeTool={activeTool}
        setActiveTool={setActiveTool}
        onAddShape={addSceneObject}
        onDeleteObject={deleteSelectedObject}
        onCopyObject={copySelectedObject}
      />
      <main className="flex-1 relative overflow-hidden">
        <ThreeScene
          sceneObjects={sceneObjects}
          selectedObjectId={selectedObjectId}
          setSelectedObjectId={setSelectedObjectId}
          activeTool={activeTool}
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
