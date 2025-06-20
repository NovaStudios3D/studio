
"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Move, RotateCw, Maximize2, Trash2, Copy, Plus, Box, CircleDot, Pyramid, Cylinder as CylinderIcon, Type, Plane as PlaneIconLucide, Eye, EyeOff } from "lucide-react";
import type { SceneObject, ActiveTool } from "@/app/page";

interface ToolbarLeftProps {
  activeTool: ActiveTool;
  setActiveTool: (tool: ActiveTool) => void;
  onAddShape: (type: SceneObject['type']) => void;
  onDeleteObject: () => void;
  onCopyObject: () => void;
  showShadows: boolean;
  onToggleShadows: () => void;
}

const ToolbarLeft: React.FC<ToolbarLeftProps> = ({
  activeTool,
  setActiveTool,
  onAddShape,
  onDeleteObject,
  onCopyObject,
  showShadows,
  onToggleShadows,
}) => {
  const mainTools = [
    { name: "Move" as ActiveTool, icon: <Move className="w-5 h-5" />, ariaLabel: "Move Tool (M)" },
    { name: "Rotate" as ActiveTool, icon: <RotateCw className="w-5 h-5" />, ariaLabel: "Rotate Tool (R)" },
    { name: "Scale" as ActiveTool, icon: <Maximize2 className="w-5 h-5" />, ariaLabel: "Scale Tool (S)" },
  ];

  const actionTools = [
    { name: "Copy", icon: <Copy className="w-5 h-5" />, ariaLabel: "Copy Object (Ctrl+D)", action: onCopyObject },
    { name: "Delete", icon: <Trash2 className="w-5 h-5" />, ariaLabel: "Delete Object (Delete)", action: onDeleteObject, destructive: true },
  ];

  const shapes: { name: SceneObject['type']; icon: JSX.Element; displayName: string }[] = [
    { name: "Cube", icon: <Box className="w-4 h-4 mr-2" />, displayName: "Cube" },
    { name: "Sphere", icon: <CircleDot className="w-4 h-4 mr-2" />, displayName: "Sphere" },
    { name: "Plane", icon: <PlaneIconLucide className="w-4 h-4 mr-2" />, displayName: "Plane" },
    { name: "Pyramid", icon: <Pyramid className="w-4 h-4 mr-2" />, displayName: "Pyramid" },
    { name: "Cylinder", icon: <CylinderIcon className="w-4 h-4 mr-2" />, displayName: "Cylinder" },
    { name: "3DText", icon: <Type className="w-4 h-4 mr-2" />, displayName: "3D Text" },
  ];

  return (
    <TooltipProvider delayDuration={100}>
      <div className="p-3 bg-card border-r border-border flex flex-col items-center space-y-3 shadow-md">
        {/* Add Shape Dropdown */}
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="default"
                  className="rounded-full w-12 h-12 p-0 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg transition-all duration-150 ease-in-out transform hover:scale-110 focus:scale-110"
                  aria-label="Add new shape"
                >
                  <Plus className="w-6 h-6" />
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Add New Shape</p>
            </TooltipContent>
          </Tooltip>
          <DropdownMenuContent side="right" className="w-56">
            <DropdownMenuLabel>Add Shape</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {shapes.map((shape) => (
              <DropdownMenuItem key={shape.name} className="cursor-pointer" onSelect={() => onAddShape(shape.name)}>
                {shape.icon}
                <span>{shape.displayName}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Main Tools: Move, Rotate, Scale */}
        {mainTools.map((tool) => {
          const isActive = activeTool === tool.name;
          let toolSpecificClass = isActive ? 'ring-2 ring-primary ring-offset-background ring-offset-2' : 'hover:bg-accent/20';
          
          return (
            <Tooltip key={tool.name}>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className={`rounded-full w-12 h-12 shadow-md hover:shadow-lg transition-all duration-150 ease-in-out transform hover:scale-110 focus:scale-110 ${toolSpecificClass}`}
                  onClick={() => setActiveTool(tool.name)}
                  aria-label={tool.ariaLabel}
                  aria-pressed={isActive}
                >
                  {tool.icon}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>{tool.ariaLabel}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
        
        <div className="border-t border-border w-full my-1"></div>


        {/* Action Tools: Copy, Delete */}
        {actionTools.map((tool) => (
          <Tooltip key={tool.name}>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className={`rounded-full w-12 h-12 shadow-md hover:shadow-lg transition-all duration-150 ease-in-out transform hover:scale-110 focus:scale-110 ${tool.destructive ? 'hover:bg-destructive/20 hover:text-destructive' : 'hover:bg-accent/20'}`}
                onClick={tool.action}
                aria-label={tool.ariaLabel}
              >
                {tool.icon}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>{tool.ariaLabel}</p>
            </TooltipContent>
          </Tooltip>
        ))}

        {/* Toggle Shadows */}
        <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="rounded-full w-12 h-12 shadow-md hover:shadow-lg transition-all duration-150 ease-in-out transform hover:scale-110 focus:scale-110 hover:bg-accent/20"
                onClick={onToggleShadows}
                aria-label={showShadows ? "Hide Shadows" : "Show Shadows"}
              >
                {showShadows ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>{showShadows ? "Hide Shadows" : "Show Shadows"}</p>
            </TooltipContent>
          </Tooltip>
      </div>
    </TooltipProvider>
  );
};

export default ToolbarLeft;
