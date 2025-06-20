
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
import { Move, Rotate3d, Scaling, Trash2, Copy, Plus, Box, CircleDot, Square, Triangle, Type, DatabaseIcon } from "lucide-react";
import type { SceneObject, ActiveTool } from "@/app/page";

interface ToolbarLeftProps {
  activeTool: ActiveTool;
  setActiveTool: (tool: ActiveTool) => void;
  onAddShape: (type: SceneObject['type']) => void;
  onDeleteObject: () => void;
  onCopyObject: () => void;
}

const ToolbarLeft: React.FC<ToolbarLeftProps> = ({
  activeTool,
  setActiveTool,
  onAddShape,
  onDeleteObject,
  onCopyObject,
}) => {
  const mainTools = [
    { name: "Move" as ActiveTool, icon: <Move className="w-5 h-5" />, ariaLabel: "Move Tool (M)" },
    { name: "Rotate" as ActiveTool, icon: <Rotate3d className="w-5 h-5" />, ariaLabel: "Rotate Tool (R)" },
    { name: "Scale" as ActiveTool, icon: <Scaling className="w-5 h-5" />, ariaLabel: "Scale Tool (S)" },
  ];

  const actionTools = [
    { name: "Copy", icon: <Copy className="w-5 h-5" />, ariaLabel: "Copy Object (Ctrl+D)", action: onCopyObject },
    { name: "Delete", icon: <Trash2 className="w-5 h-5" />, ariaLabel: "Delete Object (Delete)", action: onDeleteObject, destructive: true },
  ];

  const shapes: { name: SceneObject['type']; icon: JSX.Element }[] = [
    { name: "Cube", icon: <Box className="w-4 h-4 mr-2" /> },
    { name: "Sphere", icon: <CircleDot className="w-4 h-4 mr-2" /> },
    { name: "Plane", icon: <Square className="w-4 h-4 mr-2" /> },
    { name: "Pyramid", icon: <Triangle className="w-4 h-4 mr-2" /> },
    { name: "Cylinder", icon: <DatabaseIcon className="w-4 h-4 mr-2" /> },
    // { name: "3DText", icon: <Type className="w-4 h-4 mr-2" /> },
  ];

  return (
    <TooltipProvider delayDuration={100}>
      <div className="p-3 bg-card border-r border-border flex flex-col items-center space-y-3 shadow-md">
        {/* Add Shape Dropdown */}
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button variant="default" className="rounded-full w-12 h-12 p-0 bg-accent hover:bg-accent/90 text-accent-foreground transition-all duration-150 ease-in-out transform hover:scale-110 focus:scale-110" aria-label="Add new shape">
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
                <span>{shape.name}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Main Tools: Move, Rotate, Scale */}
        {mainTools.map((tool) => (
          <Tooltip key={tool.name}>
            <TooltipTrigger asChild>
              <Button
                variant={activeTool === tool.name ? "default" : "outline"}
                size="icon"
                className={`rounded-full w-12 h-12 transition-all duration-150 ease-in-out transform hover:scale-110 focus:scale-110 ${activeTool === tool.name ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2' : 'hover:bg-accent/20'}`}
                onClick={() => setActiveTool(tool.name)}
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

        {/* Action Tools: Copy, Delete */}
        {actionTools.map((tool) => (
          <Tooltip key={tool.name}>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className={`rounded-full w-12 h-12 transition-all duration-150 ease-in-out transform hover:scale-110 focus:scale-110 ${tool.destructive ? 'hover:bg-destructive/20 hover:text-destructive' : 'hover:bg-accent/20'}`}
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
      </div>
    </TooltipProvider>
  );
};

export default ToolbarLeft;
