
"use client";

import React, { useState, useCallback } from 'react';
import ThreeScene from "@/components/cybernox/ThreeScene";
import ToolbarLeft from "@/components/cybernox/ToolbarLeft";
import ObjectListPanel from "@/components/cybernox/ObjectListPanel";
import { useToast } from "@/hooks/use-toast"; // Added for toast notifications

export interface SceneObject {
  id: string;
  name: string;
  type: 'Cube' | 'Sphere' | 'Plane' | 'Pyramid' | 'Cylinder' | '3DText'; // Added 3DText
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
      id: "initial-cube", 
      name: "Cube 1", 
      type: "Cube", 
      position: [0, 0.5, 0], 
      rotation: [0,0,0], 
      scale: [1,1,1], 
      color: "#4285F4" 
    },
  ]);
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>("initial-cube");
  const [activeTool, setActiveTool] = useState<ActiveTool>(null);

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
      position: [Math.random() * 4 - 2, 0.5, Math.random() * 4 - 2], // Random position for variety
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      color: `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}` // Random color
    };
    setSceneObjects(prevObjects => [...prevObjects, newObject]);
    setSelectedObjectId(newObjectId);
    toast({
      title: "Object Added",
      description: `${newObject.name} (${newObject.type}) added to the scene.`,
    });
  }, [sceneObjects, toast]);

  const deleteSelectedObject = useCallback(() => {
    if (!selectedObjectId) {
      toast({ title: "No object selected", description: "Please select an object to delete.", variant: "destructive" });
      return;
    }
    const objectToDelete = sceneObjects.find(obj => obj.id === selectedObjectId);
    setSceneObjects(prevObjects => prevObjects.filter(obj => obj.id !== selectedObjectId));
    toast({ title: "Object Deleted", description: `${objectToDelete?.name || 'Selected object'} deleted.`, variant: "destructive" });
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
      let newObjectName = originalObject.name.replace(/ \d+$/, ""); // Remove existing number suffix
      let counter = 1;
      // Ensure unique name for the copy
      while (sceneObjects.some(obj => obj.name === `${newObjectName} (Copy ${counter})` || obj.name === `${newObjectName} ${counter}` )) {
         if (sceneObjects.some(obj => obj.name === `${newObjectName} (Copy ${counter})`)) {
            counter++;
         } else if (sceneObjects.some(obj => obj.name === `${newObjectName} ${counter}`)) {
             // Find the highest existing number for the base name
            const existingNumbers = sceneObjects
                .filter(obj => obj.name.startsWith(newObjectName) && !obj.name.includes("(Copy"))
                .map(obj => parseInt(obj.name.substring(newObjectName.length + 1)))
                .filter(num => !isNaN(num));
            counter = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;
            // Now check for copy numbers again
            while (sceneObjects.some(obj => obj.name === `${newObjectName} (Copy ${counter})`)) {
                counter++;
            }
            break; 
         } else {
            break;
         }
      }
      newObjectName = `${newObjectName} (Copy ${counter})`;


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
        {/* ToolbarRight is removed from here */}
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
