"use client";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Move, Rotate3d, Scaling } from "lucide-react";
import React from "react";

const ToolbarLeft: React.FC = () => {
  const [activeTool, setActiveTool] = React.useState<string | null>(null);

  const tools = [
    { name: "Move", icon: <Move className="w-5 h-5" />, ariaLabel: "Move Tool (M)" },
    { name: "Rotate", icon: <Rotate3d className="w-5 h-5" />, ariaLabel: "Rotate Tool (R)" },
    { name: "Scale", icon: <Scaling className="w-5 h-5" />, ariaLabel: "Scale Tool (S)" },
  ];

  return (
    <TooltipProvider delayDuration={100}>
      <div className="p-3 bg-card border-r border-border flex flex-col items-center space-y-3 shadow-md">
        {tools.map((tool) => (
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
      </div>
    </TooltipProvider>
  );
};

export default ToolbarLeft;
