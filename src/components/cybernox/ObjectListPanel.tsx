"use client";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Menu, Box } from "lucide-react";
import React from "react";

interface SceneObject {
  id: string;
  name: string;
  type: string; // e.g., 'Cube', 'Sphere'
}

const ObjectListPanel: React.FC = () => {
  // Placeholder for actual scene objects
  const [objects, setObjects] = React.useState<SceneObject[]>([
    { id: "1", name: "Cube 1", type: "Cube" },
    { id: "2", name: "Light Source", type: "Light" },
    { id: "3", name: "Camera", type: "Camera" },
  ]);
  const [selectedObjectId, setSelectedObjectId] = React.useState<string | null>("1");

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-3 border-b border-border">
        <h2 className="text-lg font-semibold font-headline">Objects:</h2>
        <Button variant="ghost" size="icon" aria-label="Scene options menu">
          <Menu className="w-5 h-5" />
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <ul className="p-2 space-y-1">
          {objects.map((obj) => (
            <li key={obj.id}>
              <Button
                variant={selectedObjectId === obj.id ? "secondary" : "ghost"}
                className={`w-full justify-start h-auto py-2 px-3 ${selectedObjectId === obj.id ? 'font-semibold' : ''}`}
                onClick={() => setSelectedObjectId(obj.id)}
                aria-current={selectedObjectId === obj.id ? "page" : undefined}
              >
                <Box className="w-4 h-4 mr-2 text-muted-foreground" /> {/* Generic icon */}
                <span className="truncate">{obj.name}</span>
              </Button>
            </li>
          ))}
        </ul>
      </ScrollArea>
      <div className="p-3 border-t border-border text-xs text-muted-foreground">
        {objects.length} objects in scene.
      </div>
    </div>
  );
};

export default ObjectListPanel;
