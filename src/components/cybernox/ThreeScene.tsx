
"use client";

import React, { useRef, useEffect, useState, useMemo } from 'react';
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
  const dynamicGroupRef = useRef<THREE.Group | null>(null); // Group for dynamic objects
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
    sceneRef.current.background = new THREE.Color(0xf0f0f0);

    cameraRef.current = new THREE.PerspectiveCamera(75, currentMount.clientWidth / currentMount.clientHeight, 0.1, 1000);
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
    
    // Raycaster for object selection
    raycasterRef.current = new THREE.Raycaster();
    pointerRef.current = new THREE.Vector2();

    const gridHelper = new THREE.GridHelper(100, 100, 0xaaaaaa, 0xcccccc);
    sceneRef.current.add(gridHelper);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    sceneRef.current.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 10, 7.5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    sceneRef.current.add(directionalLight);
    
    const planeGeometry = new THREE.PlaneGeometry(100, 100);
    const planeMaterial = new THREE.ShadowMaterial({ opacity: 0.3 });
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.x = -Math.PI / 2;
    plane.receiveShadow = true;
    sceneRef.current.add(plane);

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
        cameraRef.current.aspect = currentMount.clientWidth / currentMount.clientHeight;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(currentMount.clientWidth, currentMount.clientHeight);
      }
    };
    window.addEventListener('resize', handleResize);
    
    const onPointerDown = ( event: PointerEvent ) => {
        if (!mountRef.current || !raycasterRef.current || !pointerRef.current || !cameraRef.current || !dynamicGroupRef.current) return;
        
        const rect = mountRef.current.getBoundingClientRect();
        pointerRef.current.x = ( (event.clientX - rect.left) / currentMount.clientWidth ) * 2 - 1;
        pointerRef.current.y = - ( (event.clientY - rect.top) / currentMount.clientHeight ) * 2 + 1;

        raycasterRef.current.setFromCamera( pointerRef.current, cameraRef.current );
        const intersects = raycasterRef.current.intersectObjects( dynamicGroupRef.current.children, true );

        if ( intersects.length > 0 ) {
            let intersectedObject = intersects[0].object;
            // Traverse up to find the object with userData.id (the group parent)
            while(intersectedObject.parent && !intersectedObject.userData.id) {
                if (intersectedObject.parent === dynamicGroupRef.current) break; // Stop if we reach the main dynamic group
                intersectedObject = intersectedObject.parent;
            }
            if (intersectedObject.userData.id) {
                 setSelectedObjectId(intersectedObject.userData.id);
            } else {
                setSelectedObjectId(null); // Clicked on background or unselectable part
            }
        } else {
            setSelectedObjectId(null);
        }
    }
    currentMount.addEventListener( 'pointerdown', onPointerDown );


    return () => {
      window.removeEventListener('resize', handleResize);
      currentMount.removeEventListener('pointerdown', onPointerDown);
      if (rendererRef.current?.domElement && currentMount.contains(rendererRef.current.domElement)) {
         currentMount.removeChild(rendererRef.current.domElement);
      }
      transformControlsRef.current?.dispose();
      controlsRef.current?.dispose();
      rendererRef.current?.dispose();
      // Clean up geometries and materials from dynamic group
      dynamicGroupRef.current?.children.forEach(child => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach(m => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
      dynamicGroupRef.current?.clear();
      sceneRef.current?.clear(); // Clears all children including lights, grid etc.
    };
  }, [isClient, setSelectedObjectId]);

  // Update dynamic objects based on sceneObjects prop
  useEffect(() => {
    if (!isClient || !dynamicGroupRef.current || !sceneRef.current) return;

    // Clear existing dynamic objects
    while (dynamicGroupRef.current.children.length > 0) {
      const child = dynamicGroupRef.current.children[0];
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose());
        } else {
          child.material.dispose();
        }
      }
      dynamicGroupRef.current.remove(child);
    }

    // Add new objects
    sceneObjects.forEach(objData => {
      let geometry: THREE.BufferGeometry;
      const material = new THREE.MeshStandardMaterial({ color: objData.color });

      switch (objData.type) {
        case 'Sphere':
          geometry = new THREE.SphereGeometry(0.5, 32, 16);
          break;
        case 'Plane':
          geometry = new THREE.PlaneGeometry(1, 1);
          break;
        case 'Pyramid':
          geometry = new THREE.ConeGeometry(0.5, 1, 4); // A cone with 4 sides is a pyramid
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
      mesh.userData = { id: objData.id }; // Store ID for raycasting
      dynamicGroupRef.current.add(mesh);
    });
  }, [isClient, sceneObjects]);


  // Handle TransformControls attachment and mode
  useEffect(() => {
    if (!isClient || !transformControlsRef.current || !dynamicGroupRef.current) return;

    const tc = transformControlsRef.current;
    if (selectedObjectId) {
      const objectToTransform = dynamicGroupRef.current.children.find(
        (child) => child.userData.id === selectedObjectId
      );
      if (objectToTransform) {
        tc.attach(objectToTransform as THREE.Object3D);
        switch (activeTool) {
          case 'Move':
            tc.setMode('translate');
            tc.visible = true;
            tc.enabled = true;
            break;
          case 'Rotate':
            tc.setMode('rotate');
            tc.visible = true;
            tc.enabled = true;
            break;
          case 'Scale':
            tc.setMode('scale');
            tc.visible = true;
            tc.enabled = true;
            break;
          default:
            tc.detach();
            tc.visible = false;
            tc.enabled = false;
            break;
        }
      } else {
        tc.detach();
        tc.visible = false;
        tc.enabled = false;
      }
    } else {
      tc.detach();
      tc.visible = false;
      tc.enabled = false;
    }
  }, [isClient, selectedObjectId, activeTool]);


  if (!isClient) {
    return <div ref={mountRef} className="w-full h-full bg-gray-200 flex items-center justify-center"><p>Loading 3D View...</p></div>;
  }
  
  return <div ref={mountRef} className="w-full h-full" aria-label="3D Modeling Viewport" />;
};

export default ThreeScene;
