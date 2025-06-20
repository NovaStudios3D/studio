
"use client";

import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import type { SceneObject, ActiveTool } from '@/app/page'; // Import types

interface ThreeSceneProps {
  sceneObjects: SceneObject[];
  selectedObjectId: string | null;
  setSelectedObjectId: (id: string | null) => void;
  activeTool: ActiveTool;
}

const ThreeScene: React.FC<ThreeSceneProps> = ({ 
  sceneObjects, 
  selectedObjectId, 
  setSelectedObjectId, 
  activeTool 
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isClient, setIsClient] = useState(false);
  
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const transformControlsRef = useRef<TransformControls | null>(null);
  const dynamicGroupRef = useRef<THREE.Group | null>(null);
  const raycasterRef = useRef<THREE.Raycaster | null>(null);
  const pointerRef = useRef<THREE.Vector2 | null>(null);


  useEffect(() => {
    setIsClient(true);
  }, []);

  // Initialize scene, camera, renderer, controls
  useEffect(() => {
    if (!isClient || !mountRef.current) return;

    const currentMount = mountRef.current;

    sceneRef.current = new THREE.Scene();
    sceneRef.current.background = new THREE.Color(getComputedStyle(document.documentElement).getPropertyValue('--background').trim() || '#f0f0f0');


    cameraRef.current = new THREE.PerspectiveCamera(75, currentMount.clientWidth / currentMount.clientHeight, 0.1, 2000); // Increased far plane for larger grid
    cameraRef.current.position.set(5, 5, 5);

    rendererRef.current = new THREE.WebGLRenderer({ antialias: true });
    rendererRef.current.setSize(currentMount.clientWidth, currentMount.clientHeight);
    rendererRef.current.setPixelRatio(window.devicePixelRatio);
    rendererRef.current.shadowMap.enabled = true;
    currentMount.appendChild(rendererRef.current.domElement);

    controlsRef.current = new OrbitControls(cameraRef.current, rendererRef.current.domElement);
    controlsRef.current.enableDamping = true;
    controlsRef.current.dampingFactor = 0.05;
    
    transformControlsRef.current = new TransformControls(cameraRef.current, rendererRef.current.domElement);
    sceneRef.current.add(transformControlsRef.current);
    transformControlsRef.current.addEventListener('dragging-changed', (event) => {
        if (controlsRef.current) controlsRef.current.enabled = !event.value;
    });
    
    raycasterRef.current = new THREE.Raycaster();
    pointerRef.current = new THREE.Vector2();

    const gridHelper = new THREE.GridHelper(200, 40, 0xaaaaaa, 0xcccccc); // Larger grid
    sceneRef.current.add(gridHelper);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    sceneRef.current.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2); // Slightly stronger directional light
    directionalLight.position.set(8, 15, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048; // Higher shadow map resolution
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50; // Adjust shadow camera frustum
    directionalLight.shadow.camera.left = -25;
    directionalLight.shadow.camera.right = 25;
    directionalLight.shadow.camera.top = 25;
    directionalLight.shadow.camera.bottom = -25;
    sceneRef.current.add(directionalLight);
    
    // Ground plane for receiving shadows (can be mostly transparent or match grid)
    const groundPlaneGeometry = new THREE.PlaneGeometry(200, 200);
    const groundPlaneMaterial = new THREE.ShadowMaterial({ opacity: 0.3 });
    const groundPlane = new THREE.Mesh(groundPlaneGeometry, groundPlaneMaterial);
    groundPlane.rotation.x = -Math.PI / 2;
    groundPlane.position.y = -0.01; // Slightly below grid to avoid z-fighting
    groundPlane.receiveShadow = true;
    sceneRef.current.add(groundPlane);

    dynamicGroupRef.current = new THREE.Group();
    sceneRef.current.add(dynamicGroupRef.current);


    const animate = () => {
      requestAnimationFrame(animate);
      controlsRef.current?.update();
      rendererRef.current?.render(sceneRef.current!, cameraRef.current!);
    };
    animate();

    const handleResize = () => {
      if (currentMount && cameraRef.current && rendererRef.current) {
        const newWidth = currentMount.clientWidth;
        const newHeight = currentMount.clientHeight;
        cameraRef.current.aspect = newWidth / newHeight;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(newWidth, newHeight);
        if (sceneRef.current) {
          sceneRef.current.background = new THREE.Color(getComputedStyle(document.documentElement).getPropertyValue('--background').trim() || '#f0f0f0');
        }
      }
    };
    window.addEventListener('resize', handleResize);
    
    // MutationObserver to watch for CSS variable changes (theme changes)
    const observer = new MutationObserver(() => {
        if (sceneRef.current) {
           sceneRef.current.background = new THREE.Color(getComputedStyle(document.documentElement).getPropertyValue('--background').trim() || '#f0f0f0');
        }
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['style', 'class'] });


    const onPointerDown = ( event: PointerEvent ) => {
        if (!mountRef.current || !raycasterRef.current || !pointerRef.current || !cameraRef.current || !dynamicGroupRef.current || transformControlsRef.current?.dragging) return;
        
        const rect = mountRef.current.getBoundingClientRect();
        pointerRef.current.x = ( (event.clientX - rect.left) / currentMount.clientWidth ) * 2 - 1;
        pointerRef.current.y = - ( (event.clientY - rect.top) / currentMount.clientHeight ) * 2 + 1;

        raycasterRef.current.setFromCamera( pointerRef.current, cameraRef.current );
        const intersects = raycasterRef.current.intersectObjects( dynamicGroupRef.current.children, true );

        if ( intersects.length > 0 ) {
            let intersectedObject = intersects[0].object;
            while(intersectedObject.parent && !intersectedObject.userData.id) {
                if (intersectedObject.parent === dynamicGroupRef.current) break;
                intersectedObject = intersectedObject.parent;
            }
            if (intersectedObject.userData.id) {
                 setSelectedObjectId(intersectedObject.userData.id);
            } else {
                setSelectedObjectId(null);
            }
        } else {
            setSelectedObjectId(null);
        }
    }
    currentMount.addEventListener( 'pointerdown', onPointerDown );


    return () => {
      window.removeEventListener('resize', handleResize);
      observer.disconnect();
      currentMount.removeEventListener('pointerdown', onPointerDown);
      if (rendererRef.current?.domElement && currentMount.contains(rendererRef.current.domElement)) {
         currentMount.removeChild(rendererRef.current.domElement);
      }
      transformControlsRef.current?.dispose();
      controlsRef.current?.dispose();
      rendererRef.current?.dispose();
      dynamicGroupRef.current?.children.forEach(child => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach(m => m.dispose());
          } else if (child.material) { // Check if material exists
            child.material.dispose();
          }
        }
      });
      dynamicGroupRef.current?.clear();
      sceneRef.current?.clear();
    };
  }, [isClient, setSelectedObjectId]);

  // Update dynamic objects based on sceneObjects prop
  useEffect(() => {
    if (!isClient || !dynamicGroupRef.current || !sceneRef.current) return;

    // Sync logic: More efficient than full clear and rebuild
    const existingObjectIds = new Set(dynamicGroupRef.current.children.map(child => child.userData.id));
    const newObjectIds = new Set(sceneObjects.map(objData => objData.id));

    // Remove objects no longer in sceneObjects
    dynamicGroupRef.current.children.forEach(child => {
        if (child.userData.id && !newObjectIds.has(child.userData.id)) {
            if (child instanceof THREE.Mesh) {
                child.geometry.dispose();
                if (Array.isArray(child.material)) {
                    child.material.forEach(m => m.dispose());
                } else if (child.material) {
                    child.material.dispose();
                }
            }
            dynamicGroupRef.current?.remove(child);
        }
    });
    
    // Add or update objects
    sceneObjects.forEach(objData => {
      const existingObject = dynamicGroupRef.current?.children.find(child => child.userData.id === objData.id) as THREE.Mesh | undefined;

      if (existingObject) {
        // Update existing object
        existingObject.position.set(...objData.position);
        existingObject.rotation.set(...objData.rotation);
        existingObject.scale.set(...objData.scale);
        if (existingObject.material instanceof THREE.MeshStandardMaterial) {
            existingObject.material.color.set(objData.color);
        }
      } else {
        // Add new object
        let geometry: THREE.BufferGeometry;
        const material = new THREE.MeshStandardMaterial({ color: objData.color, metalness: 0.3, roughness: 0.6 });

        switch (objData.type) {
          case 'Sphere':
            geometry = new THREE.SphereGeometry(0.5, 32, 16);
            break;
          case 'Plane':
            geometry = new THREE.PlaneGeometry(1, 1); // Will be scaled by objData.scale
            break;
          case 'Pyramid':
            geometry = new THREE.ConeGeometry(0.5, 1, 4); 
            break;
          case 'Cylinder':
            geometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 32);
            break;
          case 'Cube':
          default:
            geometry = new THREE.BoxGeometry(1, 1, 1);
            break;
        }
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(...objData.position);
        mesh.rotation.set(...objData.rotation);
        mesh.scale.set(...objData.scale);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.userData = { id: objData.id };
        dynamicGroupRef.current?.add(mesh);
      }
    });
  }, [isClient, sceneObjects]);


  // Handle TransformControls attachment and mode
  useEffect(() => {
    if (!isClient || !transformControlsRef.current || !dynamicGroupRef.current || !sceneRef.current || !cameraRef.current) return;

    const tc = transformControlsRef.current;
    const currentObject = tc.object;

    if (selectedObjectId) {
      const objectToTransform = dynamicGroupRef.current.children.find(
        (child) => child.userData.id === selectedObjectId
      ) as THREE.Object3D | undefined;

      if (objectToTransform) {
        if (currentObject !== objectToTransform) {
          tc.attach(objectToTransform);
        }
        
        let modeChanged = false;
        if (activeTool === 'Move' && tc.mode !== 'translate') { tc.setMode('translate'); modeChanged = true; }
        else if (activeTool === 'Rotate' && tc.mode !== 'rotate') { tc.setMode('rotate'); modeChanged = true; }
        else if (activeTool === 'Scale' && tc.mode !== 'scale') { tc.setMode('scale'); modeChanged = true; }

        tc.visible = !!activeTool; // Visible if any tool is active
        tc.enabled = !!activeTool; // Enabled if any tool is active

        if (!activeTool && currentObject) { // If no tool is active, detach
            tc.detach();
        }

      } else { // Selected object not found in scene (e.g., just deleted)
        if (currentObject) tc.detach();
        tc.visible = false;
        tc.enabled = false;
      }
    } else { // No object selected
      if (currentObject) tc.detach();
      tc.visible = false;
      tc.enabled = false;
    }
  }, [isClient, selectedObjectId, activeTool]);


  if (!isClient) {
    return <div ref={mountRef} className="w-full h-full bg-muted flex items-center justify-center"><p>Loading 3D View...</p></div>;
  }
  
  return <div ref={mountRef} className="w-full h-full" aria-label="3D Modeling Viewport" />;
};

export default ThreeScene;

