
"use client";

import React, { useState, useCallback, useEffect } from 'react';
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
      position: [0, 0.01, -2], // Slightly above the grid
      rotation: [-Math.PI / 2, 0, 0], // Rotate to be flat
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
  ]);
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>("initial-cube-1");
  const [activeTool, setActiveTool] = useState<ActiveTool>('Move');


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
      color: `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`
    };

    setSceneObjects(prevObjects => [...prevObjects, newObject]);
    setSelectedObjectId(newObjectId);
    toast({ title: "Object Added", description: `${newObject.name} added to the scene.` });
  }, [sceneObjects, toast]);

  const deleteSelectedObject = useCallback(() => {
    if (!selectedObjectId) {
      toast({ title: "No object selected", description: "Please select an object to delete.", variant: "destructive" });
      return;
    }
    const objectToDelete = sceneObjects.find(obj => obj.id === selectedObjectId);
    setSceneObjects(prevObjects => prevObjects.filter(obj => obj.id !== selectedObjectId));

    if (objectToDelete) {
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
          setSceneObjects={setSceneObjects}
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
