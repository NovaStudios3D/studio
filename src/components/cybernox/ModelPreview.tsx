
'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, AlertTriangle } from 'lucide-react';

interface ModelPreviewProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  modelData: {
    src: string | ArrayBuffer;
    name: string;
    format: string;
  } | null;
  onAddToScene: () => void;
}

const ModelPreview: React.FC<ModelPreviewProps> = ({ isOpen, onOpenChange, modelData, onAddToScene }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cleanupRef = useRef<(() => void) | null>(null);

  const loadModel = useCallback((
    scene: THREE.Scene,
    data: { src: string | ArrayBuffer; format: string }
  ) => {
    
    const onModelError = (err: any) => {
        console.error('Error loading model for preview:', err);
        setError(`Failed to load model. The file might be corrupted or in an unsupported format.`);
        setIsLoading(false);
    };

    const onModelLoad = (loadedModel: THREE.Object3D) => {
        const box = new THREE.Box3().setFromObject(loadedModel);
        
        if (box.isEmpty()) {
            onModelError(new Error("Model appears to be empty or has no visible geometry."));
            return;
        }

        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());

        loadedModel.position.sub(center);

        const maxDim = Math.max(size.x, size.y, size.z);
        if (maxDim > 0 && Number.isFinite(maxDim)) {
            const scale = 5 / maxDim;
            loadedModel.scale.setScalar(scale);
        } else {
            // If model has no size, don't try to scale it.
            loadedModel.scale.setScalar(1);
        }

        scene.add(loadedModel);
        setIsLoading(false);
    };

    try {
      switch (data.format) {
          case 'gltf':
          case 'glb':
              new GLTFLoader().parse(data.src as ArrayBuffer, '', gltf => onModelLoad(gltf.scene), onModelError);
              break;
          case 'obj':
              const objModel = new OBJLoader().parse(data.src as string);
              onModelLoad(objModel);
              break;
          case 'stl':
              const geometry = new STLLoader().parse(data.src as ArrayBuffer);
              const material = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.1, roughness: 0.8 });
              const model = new THREE.Mesh(geometry, material);
              onModelLoad(model);
              break;
          default:
              onModelError(new Error(`Unsupported format: ${data.format}`));
      }
    } catch (e: any) {
        onModelError(e);
    }
  }, []);

  useEffect(() => {
    if (!isOpen || !mountRef.current) {
        if (cleanupRef.current) {
            cleanupRef.current();
            cleanupRef.current = null;
        }
        return;
    }

    const currentMount = mountRef.current;
    
    // Clear previous canvas if it exists
    while (currentMount.firstChild) {
        currentMount.removeChild(currentMount.firstChild);
    }

    setIsLoading(true);
    setError(null);
    
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('hsl(var(--muted))');

    const camera = new THREE.PerspectiveCamera(50, currentMount.clientWidth / currentMount.clientHeight, 0.1, 1000);
    camera.position.set(0, 2.5, 10);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    currentMount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);
    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight1.position.set(10, 10, 10);
    scene.add(dirLight1);
    const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight2.position.set(-10, -10, -5);
    scene.add(dirLight2);

    if (modelData) {
        loadModel(scene, modelData);
    } else {
        setError("No model data provided.");
        setIsLoading(false);
    }
    
    let animationFrameId: number;
    const animate = () => {
        animationFrameId = requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
        if (!currentMount) return;
        const { clientWidth, clientHeight } = currentMount;
        if (clientWidth > 0 && clientHeight > 0) {
          camera.aspect = clientWidth / clientHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(clientWidth, clientHeight);
        }
    };
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(currentMount);

    cleanupRef.current = () => {
        cancelAnimationFrame(animationFrameId);
        resizeObserver.disconnect();
        scene.traverse(object => {
            if (object instanceof THREE.Mesh) {
                object.geometry.dispose();
                const materials = Array.isArray(object.material) ? object.material : [object.material];
                materials.forEach(material => material?.dispose());
            }
        });
        renderer.dispose();
        controls.dispose();
        // Remove the canvas from the DOM on cleanup
        if (currentMount && currentMount.contains(renderer.domElement)) {
            currentMount.removeChild(renderer.domElement);
        }
    };

    return () => {
        if (cleanupRef.current) {
            cleanupRef.current();
            cleanupRef.current = null;
        }
    };
  }, [isOpen, modelData, loadModel]);

  const handleDialogClose = (open: boolean) => {
    if (!open) {
        // Cleanup is now handled by the useEffect return function
    }
    onOpenChange(open);
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
      <DialogContent className="max-w-3xl h-[70vh] flex flex-col p-0 gap-0">
        <div className="p-6 pb-2">
            <DialogHeader>
            <DialogTitle>Model Preview: {modelData?.name}</DialogTitle>
            <DialogDescription>
                Rotate the model with your mouse. Click "Add to Scene" to import it.
            </DialogDescription>
            </DialogHeader>
        </div>
        <div className="flex-grow relative border-y">
          <div ref={mountRef} className="w-full h-full" />
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80">
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
              <p className="mt-4 text-muted-foreground">Loading model...</p>
            </div>
          )}
          {error && (
             <div className="absolute inset-0 flex flex-col items-center justify-center bg-destructive/90 text-destructive-foreground p-4 text-center">
              <AlertTriangle className="w-12 h-12 mb-4" />
              <p className="font-semibold">Error Loading Model</p>
              <p className="text-sm">{error}</p>
            </div>
          )}
        </div>
        <DialogFooter className="p-6 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={onAddToScene} disabled={isLoading || !!error}>Add to Scene</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ModelPreview;
