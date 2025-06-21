
"use client";

import React, { useState, useCallback, useRef } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import ThreeScene from "@/components/cybernox/ThreeScene";
import ToolbarLeft from "@/components/cybernox/ToolbarLeft";
import ObjectListPanel from "@/components/cybernox/ObjectListPanel";
import { useToast } from "@/hooks/use-toast";
import { Button } from '@/components/ui/button';
import { PanelRightOpen } from 'lucide-react';
import type { ThreeSceneRef } from '@/components/cybernox/ThreeScene';
import ModelPreview from '@/components/cybernox/ModelPreview';

export interface SceneObject {
  id: string;
  name: string;
  type: 'Cube' | 'Sphere' | 'Plane' | 'Pyramid' | 'Cylinder' | '3DText' | 'Image' | 'Video' | 'ParticleSystem' | 'Model' | 'Audio';
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  color: string;
  text?: string; 
  visible?: boolean;
  src?: string | ArrayBuffer;
  format?: string;
  particleType?: string;
}

export type ActiveTool = 'Move' | 'Rotate' | 'Scale' | null;

export default function Cybernox3DPage() {
  const { toast } = useToast();
  const threeSceneRef = useRef<ThreeSceneRef>(null);
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
  const [isObjectListVisible, setIsObjectListVisible] = useState(true);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewModelData, setPreviewModelData] = useState<{ src: string | ArrayBuffer; name: string; format: string; } | null>(null);


  const addSceneObject = useCallback((type: SceneObject['type'], options: { src?: string | ArrayBuffer, name?: string, format?: string } = {}) => {
    const newObjectId = `object-${Date.now()}`;
    
    let baseName: string = options.name || type;
    if (type === '3DText' && !options.name) baseName = '3D Text';
    if (type === 'Model' && options.name) {
      baseName = options.name.split('.')[0];
    }
    
    let counter = 1;
    let newObjectName = baseName;
    if (!options.name || type !== 'Model') {
       while (sceneObjects.some(obj => obj.name === newObjectName)) {
         newObjectName = `${baseName} ${counter++}`;
       }
    }


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
    
    if (type === 'Image' || type === 'Video' || type === 'Model' || type === 'Audio') {
      objectColor = '#FFFFFF'
    }

    let newObjectScale: [number, number, number] = [1, 1, 1];
    if (type === 'Plane') {
        newObjectScale = [2, 2, 1];
    } else if (type === 'Image' || type === 'Video') {
        newObjectScale = [5, 5, 1];
    }

    const newObject: SceneObject = {
      id: newObjectId,
      name: newObjectName,
      type: type,
      position: type === 'Model' ? [0, 0, 0] : [Math.random() * 4 - 2, 2.5 + Math.random() * 1, Math.random() * 4 - 2],
      rotation: [0, 0, 0],
      scale: newObjectScale,
      color: objectColor,
      text: textContent,
      src: options.src,
      format: options.format,
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

  const handleAddParticle = useCallback((particleType: string) => {
    const newObjectId = `object-${Date.now()}`;
    
    let counter = 1;
    let baseName = particleType;
    let newObjectName = baseName;
    while (sceneObjects.some(obj => obj.name === `${baseName} ${counter}`)) {
        counter++;
    }
    newObjectName = `${baseName} ${counter}`;

    const newObject: SceneObject = {
      id: newObjectId,
      name: newObjectName,
      type: 'ParticleSystem',
      particleType: particleType,
      position: [0, 1.5, 0], 
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      color: '#FFFFFF',
      visible: true,
    };

    setSceneObjects(prevObjects => [...prevObjects, newObject]);
    toast({ title: "Effect Added", description: `${newObjectName} added to the scene.` });
  }, [sceneObjects, toast]);

  const handleImportMedia = useCallback((accept: 'image/*' | 'video/*') => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (readEvent) => {
        const src = readEvent.target?.result as string;
        const type = accept === 'image/*' ? 'Image' : 'Video';
        
        let counter = 1;
        let baseName = file.name.split('.')[0] || type;
        let newObjectName = baseName;
        while (sceneObjects.some(obj => obj.name === newObjectName)) {
          newObjectName = `${baseName} (${counter})`;
          counter++;
        }
        
        addSceneObject(type, { src, name: newObjectName });
      };
      reader.readAsDataURL(file);
    };
    input.click();
  }, [addSceneObject, sceneObjects]);

  const handleImportAudio = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'audio/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (readEvent) => {
        const src = readEvent.target?.result as string;
        
        let counter = 1;
        let baseName = file.name.split('.')[0] || 'Audio';
        let newObjectName = baseName;
        while (sceneObjects.some(obj => obj.name === newObjectName)) {
          newObjectName = `${baseName} (${counter})`;
          counter++;
        }
        
        addSceneObject('Audio', { src, name: newObjectName });
      };
      reader.readAsDataURL(file);
    };
    input.click();
  }, [addSceneObject, sceneObjects]);
  
  const handleImportModel = useCallback((format: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = `.${format},` + (format === 'gltf' ? '.glb' : '');
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (readEvent) => {
        const content = readEvent.target?.result;
        if (content) {
            setPreviewModelData({ src: content, name: file.name, format });
            setIsPreviewModalOpen(true);
        }
      };
      
      if (format === 'gltf' || format === 'glb' || format === 'stl') {
        reader.readAsArrayBuffer(file);
      } else {
        reader.readAsText(file);
      }
    };
    input.click();
  }, []);
  
  const handleExportScene = useCallback((format: string) => {
    if (threeSceneRef.current) {
        threeSceneRef.current.exportScene(format);
        toast({ title: "Exporting Scene", description: `Your scene is being exported as a .${format} file.` });
    }
  }, []);
  
  const handleAddToSceneFromPreview = useCallback(() => {
    if (previewModelData) {
      addSceneObject('Model', previewModelData);
      setIsPreviewModalOpen(false);
      setPreviewModelData(null);
    }
  }, [previewModelData, addSceneObject]);


  return (
    <TooltipProvider>
      <div className="flex h-screen w-screen overflow-hidden antialiased font-body bg-background">
        <ToolbarLeft
          activeTool={activeTool}
          setActiveTool={setActiveTool}
          onAddShape={addSceneObject}
          onDeleteObject={deleteSelectedObject}
          onCopyObject={copySelectedObject}
          onAddParticle={handleAddParticle}
          onImportImage={() => handleImportMedia('image/*')}
          onImportVideo={() => handleImportMedia('video/*')}
          onImportAudio={handleImportAudio}
          onImportModel={handleImportModel}
          onExportScene={handleExportScene}
        />
        <main className="flex-1 relative overflow-hidden">
          <ThreeScene
            ref={threeSceneRef}
            sceneObjects={sceneObjects}
            setSceneObjects={setSceneObjects}
            selectedObjectId={selectedObjectId}
            setSelectedObjectId={setSelectedObjectId}
            activeTool={activeTool}
          />
          {!isObjectListVisible && (
            <div className="absolute top-4 right-4 z-10">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" onClick={() => setIsObjectListVisible(true)} className="rounded-full w-12 h-12 shadow-md hover:shadow-lg transition-all duration-150 ease-in-out transform hover:scale-110 focus:scale-110">
                    <PanelRightOpen />
                    <span className="sr-only">Open Object Panel</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">
                  <p>Show Objects Panel</p>
                </TooltipContent>
              </Tooltip>
            </div>
          )}
        </main>
        {isObjectListVisible && (
            <aside className="w-72 bg-card border-l border-border flex flex-col shadow-lg">
              <div className="flex-grow min-h-0">
                <ObjectListPanel
                  objects={sceneObjects}
                  selectedObjectId={selectedObjectId}
                  onSelectObject={setSelectedObjectId}
                  onToggleVisibility={toggleObjectVisibility}
                  onTogglePanel={() => setIsObjectListVisible(false)}
                />
              </div>
            </aside>
        )}
      </div>
      <ModelPreview
        isOpen={isPreviewModalOpen}
        onOpenChange={setIsPreviewModalOpen}
        modelData={previewModelData}
        onAddToScene={handleAddToSceneFromPreview}
      />
    </TooltipProvider>
  );
}
