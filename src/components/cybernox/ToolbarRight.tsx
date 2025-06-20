"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Trash2, Copy, Plus, Box, CircleDot, Square, Triangle, Type, DatabaseIcon } from "lucide-react"; // Using CircleDot as placeholder for Sphere, DatabaseIcon for Cylinder

const ToolbarRight: React.FC = () => {
  const shapes = [
    { name: "Cube", icon: <Box className="w-4 h-4 mr-2" /> },
    { name: "Sphere", icon: <CircleDot className="w-4 h-4 mr-2" /> }, // Placeholder for Sphere
    { name: "Plane", icon: <Square className="w-4 h-4 mr-2" /> },
    { name: "Pyramid", icon: <Triangle className="w-4 h-4 mr-2" /> }, // Placeholder for Pyramid
    { name: "Cylinder", icon: <DatabaseIcon className="w-4 h-4 mr-2" /> }, // Placeholder for Cylinder
    { name: "3D Text", icon: <Type className="w-4 h-4 mr-2" /> },
  ];

  return (
    <TooltipProvider delayDuration={100}>
      <div className="flex flex-col items-center space-y-3">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="icon" className="rounded-full w-12 h-12 hover:bg-destructive/20 hover:text-destructive transition-all duration-150 ease-in-out transform hover:scale-110 focus:scale-110" aria-label="Delete Object (Delete)">
              <Trash2 className="w-5 h-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>Delete Object (Delete)</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="icon" className="rounded-full w-12 h-12 hover:bg-accent/20 transition-all duration-150 ease-in-out transform hover:scale-110 focus:scale-110" aria-label="Copy Object (Ctrl+C)">
              <Copy className="w-5 h-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>Copy Object (Ctrl+D)</p>
          </TooltipContent>
        </Tooltip>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="default" className="rounded-full w-12 h-12 p-0 bg-accent hover:bg-accent/90 text-accent-foreground transition-all duration-150 ease-in-out transform hover:scale-110 focus:scale-110" aria-label="Add new shape">
              <Plus className="w-6 h-6" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="left" className="w-56">
            <DropdownMenuLabel>Add Shape</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {shapes.map((shape) => (
              <DropdownMenuItem key={shape.name} className="cursor-pointer">
                {shape.icon}
                <span>{shape.name}</span>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer">
              <Plus className="w-4 h-4 mr-2" />
              <span>More...</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </TooltipProvider>
  );
};

export default ToolbarRight;
