
"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { SceneObject } from '@/app/page';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';

interface PropertiesPanelProps {
  selectedObject: SceneObject | null;
  onUpdateObject: (id: string, newProps: Partial<SceneObject>) => void;
  onLiveUpdate: (id: string, newProps: Partial<SceneObject>) => void;
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

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ selectedObject, onUpdateObject, onLiveUpdate }) => {
  const [internalState, setInternalState] = useState<Partial<SceneObject> | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    if (selectedObject) {
      setInternalState({
        name: selectedObject.name,
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

    const updatedProps = { ...internalState, ...newProps };
    setInternalState(updatedProps);

    onLiveUpdate(selectedObject.id, newProps);
    
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      onUpdateObject(selectedObject.id, updatedProps);
    }, 500);
  }, [selectedObject, onUpdateObject, onLiveUpdate, internalState]);
  
  if (!selectedObject || ['ParticleSystem', 'Skybox', 'Audio', 'Waypoint'].includes(selectedObject.type)) {
    return (
      <div className="p-4 border-t border-border flex-grow">
        <h3 className="text-sm font-medium mb-4">Properties</h3>
        <p className="text-sm text-muted-foreground text-center pt-8">
          {selectedObject ? `${selectedObject.type}s do not have editable properties.` : 'Select an object to see its properties.'}
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 border-t border-border flex-grow">
       <h3 className="text-sm font-medium mb-4">Properties</h3>
       <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Name</Label>
            <span className="text-right truncate w-40">{selectedObject.name}</span>
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs">Color</Label>
            <div className="flex items-center gap-2">
                <div style={{backgroundColor: selectedObject.color}} className="w-4 h-4 rounded-full border"/>
                <span>{selectedObject.color.toUpperCase()}</span>
            </div>
          </div>
          <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" className="w-full mt-2">View Properties</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Editing: {selectedObject.name}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4 text-sm">
                    <div className="flex items-center justify-between">
                    <Label htmlFor="object-name" className="text-xs">Name</Label>
                        <Input
                        id="object-name"
                        value={internalState?.name ?? ''}
                        onChange={(e) => handlePropertyChange({ name: e.target.value })}
                        className="h-8 w-48"
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
                <DialogFooter>
                    <span className="text-xs text-muted-foreground">Changes are saved automatically.</span>
                </DialogFooter>
            </DialogContent>
          </Dialog>
       </div>
    </div>
  );
};

export default PropertiesPanel;
