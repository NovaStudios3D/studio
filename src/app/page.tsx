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
  text?: string; // Optional text property for 3DText
  visible?: boolean;
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
  ]);
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>("initial-cube-1");
  const [activeTool, setActiveTool] = useState<ActiveTool>('Move');


  const addSceneObject = useCallback((type: SceneObject['type']) => {
    const newObjectId = `object-${Date.now()}`;
    let newObjectName = type === '3DText' ? '3D Text' : type;
    let counter = 1;
    const baseNameForCount = type === '3DText' ? '3D Text' : type;
    while (sceneObjects.some(obj => obj.name === `${baseNameForCount} ${counter}`)) {
      counter++;
    }
    newObjectName = `${baseNameForCount} ${counter}`;

    let textContent: string | undefined = undefined;
    let objectColor = `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`;

    if (type === '3DText') {
      const userText = window.prompt("Enter text for the 3D object:", "Hello");
      if (userText === null || userText.trim() === "") {
        toast({ title: "Text Input Cancelled", description: "No text provided, 3D Text object not added.", variant: "destructive" });
        return;
      }
      textContent = userText;
      objectColor = '#FFFFFF';
    }

    const newObject: SceneObject = {
      id: newObjectId,
      name: newObjectName,
      type: type,
      position: [Math.random() * 4 - 2, 0.5 + Math.random() * 1, Math.random() * 4 - 2],
      rotation: [0, 0, 0],
      scale: type === 'Plane' ? [2,2,1] : [1, 1, 1],
      color: objectColor,
      text: textContent,
      visible: true,
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
      let baseName = originalObject.type === '3DText' ? '3D Text' : originalObject.type;
      
      const nameWithoutCopySuffix = originalObject.name.replace(/ \(\text{Copy} \d+\)$/, "");
      const nameWithoutNumberSuffix = nameWithoutCopySuffix.replace(/ \d+$/, "");
      if (sceneObjects.some(obj => obj.name.startsWith(nameWithoutNumberSuffix))) {
          baseName = nameWithoutNumberSuffix;
      }

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

  const toggleObjectVisibility = useCallback((objectId: string) => {
    setSceneObjects(prevObjects =>
      prevObjects.map(obj =>
        obj.id === objectId ? { ...obj, visible: !(obj.visible ?? true) } : obj
      )
    );
  }, []);

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
            onToggleVisibility={toggleObjectVisibility}
          />
        </div>
      </aside>
    </div>
  );
}
