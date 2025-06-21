"use client";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Menu, Box, Circle, Square, Pyramid, Cylinder as CylinderIcon, Type, Eye, EyeOff, PanelRightClose, Image as ImageIcon, Video, Sparkles } from "lucide-react";
import React from "react";
import type { SceneObject } from "@/app/page";

interface ObjectListPanelProps {
  objects: SceneObject[];
  selectedObjectId: string | null;
  onSelectObject: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onTogglePanel: () => void;
}

const getIconForType = (type: SceneObject['type']) => {
  switch (type) {
    case "Cube":
      return <Box className="w-4 h-4 mr-2 text-muted-foreground" />;
    case "Sphere":
      return <Circle className="w-4 h-4 mr-2 text-muted-foreground" />;
    case "Plane":
      return <Square className="w-4 h-4 mr-2 text-muted-foreground" />;
    case "Pyramid":
      return <Pyramid className="w-4 h-4 mr-2 text-muted-foreground" />;
    case "Cylinder":
      return <CylinderIcon className="w-4 h-4 mr-2 text-muted-foreground" />;
    case "3DText":
      return <Type className="w-4 h-4 mr-2 text-muted-foreground" />;
    case "Image":
        return <ImageIcon className="w-4 h-4 mr-2 text-muted-foreground" />;
    case "Video":
        return <Video className="w-4 h-4 mr-2 text-muted-foreground" />;
    case "ParticleSystem":
        return <Sparkles className="w-4 h-4 mr-2 text-muted-foreground" />;
    default:
      return <Box className="w-4 h-4 mr-2 text-muted-foreground" />;
  }
};

const ObjectListPanel: React.FC<ObjectListPanelProps> = ({ objects, selectedObjectId, onSelectObject, onToggleVisibility, onTogglePanel }) => {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-3 border-b border-border">
        <h2 className="text-lg font-semibold font-headline">Objects:</h2>
        <div className="flex items-center">
            <Button variant="ghost" size="icon" aria-label="Scene options menu">
              <Menu className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" aria-label="Hide panel" onClick={onTogglePanel}>
              <PanelRightClose className="w-5 h-5" />
            </Button>
        </div>
      </div>
      <ScrollArea className="flex-1">
        {objects.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground text-center">No objects in scene.</p>
        ) : (
          <ul className="p-2 space-y-1">
            {objects.map((obj) => (
              <li key={obj.id}>
                <div className="flex items-center group w-full">
                    <Button
                      variant={selectedObjectId === obj.id ? "secondary" : "ghost"}
                      className={`flex-1 justify-start h-auto py-2 px-3 text-left ${selectedObjectId === obj.id ? 'font-semibold' : ''}`}
                      onClick={() => onSelectObject(obj.id)}
                      aria-current={selectedObjectId === obj.id ? "page" : undefined}
                      disabled={obj.type === 'ParticleSystem'}
                    >
                      {getIconForType(obj.type)}
                      <span className="truncate flex-1">{obj.name}</span>
                      {obj.type === '3DText' && obj.text && (
                         <span className="ml-2 text-xs text-muted-foreground truncate italic">"{obj.text}"</span>
                      )}
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="w-8 h-8 opacity-50 hover:opacity-100 group-hover:opacity-100"
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleVisibility(obj.id);
                        }}
                        aria-label={obj.visible ?? true ? "Hide Object" : "Show Object"}
                    >
                        {(obj.visible ?? true) ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </ScrollArea>
      <div className="p-3 border-t border-border text-xs text-muted-foreground">
        {objects.length} object{objects.length !== 1 ? 's' : ''} in scene.
      </div>
    </div>
  );
};

export default ObjectListPanel;
