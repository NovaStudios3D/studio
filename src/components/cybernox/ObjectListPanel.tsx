
"use client";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Menu, Box, Circle, Square, Pyramid, Cylinder as CylinderIcon, Type } from "lucide-react";
import React from "react";
import type { SceneObject } from "@/app/page";

interface ObjectListPanelProps {
  objects: SceneObject[];
  selectedObjectId: string | null;
  onSelectObject: (id: string) => void;
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
    default:
      return <Box className="w-4 h-4 mr-2 text-muted-foreground" />;
  }
};

const ObjectListPanel: React.FC<ObjectListPanelProps> = ({ objects, selectedObjectId, onSelectObject }) => {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-3 border-b border-border">
        <h2 className="text-lg font-semibold font-headline">Objects:</h2>
        <Button variant="ghost" size="icon" aria-label="Scene options menu">
          <Menu className="w-5 h-5" />
        </Button>
      </div>
      <ScrollArea className="flex-1">
        {objects.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground text-center">No objects in scene.</p>
        ) : (
          <ul className="p-2 space-y-1">
            {objects.map((obj) => (
              <li key={obj.id}>
                <Button
                  variant={selectedObjectId === obj.id ? "secondary" : "ghost"}
                  className={`w-full justify-start h-auto py-2 px-3 ${selectedObjectId === obj.id ? 'font-semibold' : ''}`}
                  onClick={() => onSelectObject(obj.id)}
                  aria-current={selectedObjectId === obj.id ? "page" : undefined}
                >
                  {getIconForType(obj.type)}
                  <span className="truncate">{obj.name}</span>
                  {obj.type === '3DText' && obj.text && (
                     <span className="ml-2 text-xs text-muted-foreground truncate italic">"{obj.text}"</span>
                  )}
                </Button>
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
