
"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { SceneObject } from '@/app/page';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

interface PropertiesPanelProps {
  selectedObject: SceneObject | null;
  onUpdateObject: (id: string, newProps: Partial<SceneObject>, record: boolean) => void;
}

const Vector3Input: React.FC<{ label: string, value: [number, number, number], onChange: (newValue: [number, number, number]) => void }> = ({ label, value, onChange }) => {
  const handleChange = (index: number, val: string) => {
    const numValue = parseFloat(val) || 0;
    const newValue: [number, number, number] = [...value];
    newValue[index] = numValue;
    onChange(newValue);
  };

  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <div className="grid grid-cols-3 gap-2">
        {(['X', 'Y', 'Z'] as const).map((axis, i) => (
          <div key={axis} className="relative">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{axis}</span>
            <Input
              type="number"
              step={label === "Rotation" ? 0.1 : 0.01}
              value={label === "Rotation" ? (value[i] * 180 / Math.PI).toFixed(1) : value[i].toFixed(2)}
              onChange={(e) => handleChange(i, label === "Rotation" ? String(parseFloat(e.target.value) * Math.PI / 180) : e.target.value)}
              className="pl-6 text-right h-8"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ selectedObject, onUpdateObject }) => {
  const [internalState, setInternalState] = useState<Partial<SceneObject> | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    if (selectedObject) {
      setInternalState({
        position: selectedObject.position,
        rotation: selectedObject.rotation,
        scale: selectedObject.scale,
        color: selectedObject.color,
      });
    } else {
      setInternalState(null);
    }
  }, [selectedObject]);

  const handlePropertyChange = useCallback((newProps: Partial<SceneObject>) => {
    if (!selectedObject) return;

    setInternalState(prev => ({ ...prev, ...newProps }));

    // Update THREE scene in real-time without creating history entry
    onUpdateObject(selectedObject.id, newProps, false);
    
    // Debounce the history recording
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      onUpdateObject(selectedObject.id, newProps, true);
    }, 500); // 500ms debounce
  }, [selectedObject, onUpdateObject]);
  
  if (!selectedObject || selectedObject.type === 'ParticleSystem' || selectedObject.type === 'Skybox' || selectedObject.type === 'Audio' || selectedObject.type === 'Waypoint') {
    return (
        <div className="p-4 border-t border-border flex-grow">
          <p className="text-sm text-muted-foreground text-center pt-8">Select an object to see its properties.</p>
        </div>
    );
  }

  return (
    <div className="p-4 border-t border-border flex-grow flex flex-col">
       <h3 className="text-sm font-medium mb-4">Properties</h3>
       <div className="space-y-4 text-sm">
         <div className="flex items-center justify-between">
           <Label htmlFor="object-name" className="text-xs">Name</Label>
            <Input
              id="object-name"
              value={selectedObject.name}
              onChange={(e) => handlePropertyChange({ name: e.target.value })}
              className="h-8 w-40"
            />
         </div>
         <Separator/>
         <Vector3Input label="Position" value={internalState?.position ?? [0,0,0]} onChange={(val) => handlePropertyChange({ position: val })} />
         <Vector3Input label="Rotation" value={internalState?.rotation ?? [0,0,0]} onChange={(val) => handlePropertyChange({ rotation: val })} />
         <Vector3Input label="Scale" value={internalState?.scale ?? [1,1,1]} onChange={(val) => handlePropertyChange({ scale: val })} />
         {selectedObject.type !== 'Image' && selectedObject.type !== 'Video' && selectedObject.type !== 'Model' && (
           <>
            <Separator/>
            <div className="flex items-center justify-between">
              <Label htmlFor="color-picker" className="text-xs">Color</Label>
              <div className="relative h-8 w-10 rounded-md border border-input overflow-hidden">
                <Input
                  id="color-picker"
                  type="color"
                  value={internalState?.color ?? '#ffffff'}
                  onChange={(e) => handlePropertyChange({ color: e.target.value })}
                  className="absolute -top-2 -left-2 w-20 h-20 p-0 border-none cursor-pointer"
                />
              </div>
            </div>
           </>
         )}
       </div>
    </div>
  );
};

export default PropertiesPanel;
