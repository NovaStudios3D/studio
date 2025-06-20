
"use client";

import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import type { SceneObject, ActiveTool } from '@/app/page';

interface ThreeSceneProps {
  sceneObjects: SceneObject[];
  setSceneObjects: React.Dispatch<React.SetStateAction<SceneObject[]>>;
  selectedObjectId: string | null;
  setSelectedObjectId: (id: string | null) => void;
  activeTool: ActiveTool;
  activeSceneCameraId: string | null;
}

const ThreeScene: React.FC<ThreeSceneProps> = ({ 
  sceneObjects, 
  setSceneObjects,
  selectedObjectId, 
  setSelectedObjectId, 
  activeTool,
  activeSceneCameraId
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isClient, setIsClient] = useState(false);
  
  const sceneRef = useRef<THREE.Scene | null>(null);
  const editorCameraRef = useRef<THREE.PerspectiveCamera | null>(null); // Renamed for clarity
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const editorControlsRef = useRef<OrbitControls | null>(null); // Renamed for clarity
  const transformControlsRef = useRef<TransformControls | null>(null);
  
  // Store for dynamically created THREE.js objects (meshes, groups for cameras, etc.)
  const threeObjectsRef = useRef<Map<string, THREE.Object3D>>(new Map());
  // Store for CameraHelpers, separate because they are added directly to scene
  const cameraHelpersRef = useRef<Map<string, THREE.CameraHelper>>(new Map());


  const raycasterRef = useRef<THREE.Raycaster | null>(null);
  const pointerRef = useRef<THREE.Vector2 | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const updateSceneObjectFromTransform = useCallback((transformedObject: THREE.Object3D) => {
    if (!transformedObject.userData.id) return;

    const objectId = transformedObject.userData.id;
    setSceneObjects(prevObjects =>
      prevObjects.map(obj => {
        if (obj.id === objectId) {
          const newPosition = transformedObject.position.toArray() as [number, number, number];
          const newRotation = [transformedObject.rotation.x, transformedObject.rotation.y, transformedObject.rotation.z] as [number, number, number];
          const newScale = transformedObject.scale.toArray() as [number, number, number];
          return { ...obj, position: newPosition, rotation: newRotation, scale: newScale };
        }
        return obj;
      })
    );
  }, [setSceneObjects]);

  // Initialize scene, camera, renderer, controls
  useEffect(() => {
    if (!isClient || !mountRef.current) return;
    const currentMount = mountRef.current;

    sceneRef.current = new THREE.Scene();
    sceneRef.current.background = new THREE.Color(getComputedStyle(document.documentElement).getPropertyValue('--background').trim() || '#f0f0f0');

    editorCameraRef.current = new THREE.PerspectiveCamera(75, currentMount.clientWidth / currentMount.clientHeight, 0.1, 2000);
    editorCameraRef.current.position.set(5, 5, 5);

    rendererRef.current = new THREE.WebGLRenderer({ antialias: true });
    rendererRef.current.setSize(currentMount.clientWidth, currentMount.clientHeight);
    rendererRef.current.setPixelRatio(window.devicePixelRatio);
    rendererRef.current.shadowMap.enabled = true;
    currentMount.appendChild(rendererRef.current.domElement);

    editorControlsRef.current = new OrbitControls(editorCameraRef.current, rendererRef.current.domElement);
    editorControlsRef.current.enableDamping = true;
    editorControlsRef.current.dampingFactor = 0.05;
    
    transformControlsRef.current = new TransformControls(editorCameraRef.current, rendererRef.current.domElement);
    sceneRef.current.add(transformControlsRef.current);
    transformControlsRef.current.addEventListener('dragging-changed', (event) => {
        if (editorControlsRef.current) editorControlsRef.current.enabled = !event.value;
    });
    transformControlsRef.current.addEventListener('objectChange', () => {
        if (transformControlsRef.current?.object) {
            updateSceneObjectFromTransform(transformControlsRef.current.object);
        }
    });
    
    raycasterRef.current = new THREE.Raycaster();
    pointerRef.current = new THREE.Vector2();

    const gridHelper = new THREE.GridHelper(200, 40, 0xaaaaaa, 0xcccccc);
    sceneRef.current.add(gridHelper);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    sceneRef.current.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
    directionalLight.position.set(8, 15, 10);
    directionalLight.castShadow = true;
    // ... (shadow properties as before)
    sceneRef.current.add(directionalLight);
    
    const groundPlane = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.ShadowMaterial({ opacity: 0.3 }));
    groundPlane.rotation.x = -Math.PI / 2;
    groundPlane.position.y = -0.01;
    groundPlane.receiveShadow = true;
    sceneRef.current.add(groundPlane);

    const animate = () => {
      requestAnimationFrame(animate);
      editorControlsRef.current?.update();
      
      let cameraToRender = editorCameraRef.current;
      if (activeSceneCameraId && threeObjectsRef.current.has(activeSceneCameraId)) {
          const cameraObjectGroup = threeObjectsRef.current.get(activeSceneCameraId);
          const sceneCam = cameraObjectGroup?.children.find(child => child instanceof THREE.PerspectiveCamera) as THREE.PerspectiveCamera | undefined;
          if (sceneCam) {
              cameraToRender = sceneCam;
          }
      }
      
      if (sceneRef.current && cameraToRender) {
          // Update all camera helpers
          cameraHelpersRef.current.forEach(helper => helper.update());
          rendererRef.current?.render(sceneRef.current, cameraToRender);
      }
    };
    animate();

    const handleResize = () => { /* ... */ };
    window.addEventListener('resize', handleResize);
    const observer = new MutationObserver(() => { /* ... */ });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['style', 'class'] });

    const onPointerDown = ( event: PointerEvent ) => {
        if (!mountRef.current || !raycasterRef.current || !pointerRef.current || !editorCameraRef.current || transformControlsRef.current?.dragging) return;
        
        const rect = mountRef.current.getBoundingClientRect();
        pointerRef.current.x = ( (event.clientX - rect.left) / currentMount.clientWidth ) * 2 - 1;
        pointerRef.current.y = - ( (event.clientY - rect.top) / currentMount.clientHeight ) * 2 + 1;

        const cameraForRaycasting = activeSceneCameraId && threeObjectsRef.current.has(activeSceneCameraId)
          ? threeObjectsRef.current.get(activeSceneCameraId)?.children.find(c => c instanceof THREE.PerspectiveCamera) as THREE.PerspectiveCamera || editorCameraRef.current
          : editorCameraRef.current;

        raycasterRef.current.setFromCamera( pointerRef.current, cameraForRaycasting );
        
        const allSelectableObjects: THREE.Object3D[] = [];
        threeObjectsRef.current.forEach(obj => {
            // For cameras, we select the visual proxy mesh, not the helper directly for raycasting
            if (obj.userData.type === 'Camera') {
                const visualProxy = obj.children.find(child => child.name === 'cameraVisualProxy');
                if (visualProxy) allSelectableObjects.push(visualProxy);
            } else {
                allSelectableObjects.push(obj);
            }
        });

        const intersects = raycasterRef.current.intersectObjects( allSelectableObjects, true );

        if ( intersects.length > 0 ) {
            let intersectedObject = intersects[0].object;
            // Traverse up to find the object with userData.id (the group or mesh itself)
            while(intersectedObject.parent && !intersectedObject.userData.id) {
                if (intersectedObject.parent === sceneRef.current) break; // Stop if we reach the scene root
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
      transformControlsRef.current?.removeEventListener('objectChange', updateSceneObjectFromTransform);
      transformControlsRef.current?.dispose();
      editorControlsRef.current?.dispose();
      
      threeObjectsRef.current.forEach((obj, id) => {
        sceneRef.current?.remove(obj);
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
          else if (obj.material) obj.material.dispose();
        } else if (obj instanceof THREE.Group) { // For camera groups
            obj.children.forEach(child => {
                if (child instanceof THREE.Mesh) {
                    child.geometry.dispose();
                    if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
                    else if (child.material) child.material.dispose();
                } else if (child instanceof THREE.CameraHelper) {
                    child.dispose();
                } else if (child instanceof THREE.PerspectiveCamera) {
                    // Cameras don't have geometry/material to dispose in the same way
                }
            });
        }
        const helper = cameraHelpersRef.current.get(id);
        if (helper) {
            sceneRef.current?.remove(helper);
            helper.dispose();
        }
      });
      threeObjectsRef.current.clear();
      cameraHelpersRef.current.clear();

      if (rendererRef.current?.domElement && currentMount.contains(rendererRef.current.domElement)) {
         currentMount.removeChild(rendererRef.current.domElement);
      }
      rendererRef.current?.dispose();
      sceneRef.current?.clear();
    };
  }, [isClient, setSelectedObjectId, updateSceneObjectFromTransform, activeSceneCameraId]);


  // Update THREE.js objects based on sceneObjects prop
  useEffect(() => {
    if (!isClient || !sceneRef.current) return;

    const currentObjectIds = new Set(sceneObjects.map(objData => objData.id));

    // Remove objects no longer in sceneObjects
    threeObjectsRef.current.forEach((obj, id) => {
        if (!currentObjectIds.has(id)) {
            sceneRef.current?.remove(obj);
            if (obj instanceof THREE.Mesh) {
                obj.geometry.dispose();
                if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
                else if (obj.material) obj.material.dispose();
            } else if (obj instanceof THREE.Group) { // Camera groups
                 obj.children.forEach(child => {
                    if (child instanceof THREE.Mesh) { // Visual proxy
                        child.geometry.dispose();
                        if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
                        else if (child.material) child.material.dispose();
                    }
                 });
            }
            threeObjectsRef.current.delete(id);

            const helper = cameraHelpersRef.current.get(id);
            if (helper) {
                sceneRef.current?.remove(helper);
                helper.dispose();
                cameraHelpersRef.current.delete(id);
            }
        }
    });
    
    // Add or update objects
    sceneObjects.forEach(objData => {
      let existingThreeObject = threeObjectsRef.current.get(objData.id);

      if (existingThreeObject) { // Update existing object
        existingThreeObject.position.set(...objData.position);
        existingThreeObject.rotation.set(objData.rotation[0], objData.rotation[1], objData.rotation[2]);
        existingThreeObject.scale.set(...objData.scale);

        if (objData.type === 'Camera') {
            const cam = existingThreeObject.children.find(c => c instanceof THREE.PerspectiveCamera) as THREE.PerspectiveCamera;
            if (cam && objData.fov) cam.fov = objData.fov;
            cam?.updateProjectionMatrix();
            const helper = cameraHelpersRef.current.get(objData.id);
            helper?.update();
        } else if (existingThreeObject instanceof THREE.Mesh && existingThreeObject.material instanceof THREE.MeshStandardMaterial) {
            existingThreeObject.material.color.set(objData.color);
        }
      } else { // Add new object
        let newThreeObject: THREE.Object3D;
        if (objData.type === 'Camera') {
            const cameraGroup = new THREE.Group();
            cameraGroup.userData = { id: objData.id, type: 'Camera' };

            const newCamera = new THREE.PerspectiveCamera(objData.fov || 75, 16/9, 0.1, 1000); // Aspect will be updated by renderer later if used
            cameraGroup.add(newCamera);

            // Add a small visual proxy for selection and gizmo attachment
            const proxyGeometry = new THREE.BoxGeometry(0.2, 0.2, 0.3);
            const proxyMaterial = new THREE.MeshBasicMaterial({ color: 0x555555, wireframe: true });
            const proxyMesh = new THREE.Mesh(proxyGeometry, proxyMaterial);
            proxyMesh.name = "cameraVisualProxy"; // For raycasting
            // proxyMesh.userData = { id: objData.id }; // Let group handle ID
            cameraGroup.add(proxyMesh);
            
            newThreeObject = cameraGroup;
            newThreeObject.position.set(...objData.position);
            newThreeObject.rotation.set(objData.rotation[0],objData.rotation[1],objData.rotation[2]);
            newThreeObject.scale.set(...objData.scale);
            
            threeObjectsRef.current.set(objData.id, newThreeObject);
            sceneRef.current?.add(newThreeObject);

            const cameraHelper = new THREE.CameraHelper(newCamera);
            sceneRef.current?.add(cameraHelper);
            cameraHelpersRef.current.set(objData.id, cameraHelper);

        } else {
            let geometry: THREE.BufferGeometry;
            const material = new THREE.MeshStandardMaterial({ color: objData.color, metalness: 0.3, roughness: 0.6 });
            switch (objData.type) {
              case 'Sphere': geometry = new THREE.SphereGeometry(0.5, 32, 16); break;
              case 'Plane': geometry = new THREE.PlaneGeometry(1, 1); break;
              case 'Pyramid': geometry = new THREE.ConeGeometry(0.5, 1, 4); break;
              case 'Cylinder': geometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 32); break;
              case 'Cube': default: geometry = new THREE.BoxGeometry(1, 1, 1); break;
            }
            const mesh = new THREE.Mesh(geometry, material);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            mesh.userData = { id: objData.id, type: objData.type };
            newThreeObject = mesh;

            newThreeObject.position.set(...objData.position);
            newThreeObject.rotation.set(objData.rotation[0],objData.rotation[1],objData.rotation[2]);
            newThreeObject.scale.set(...objData.scale);

            threeObjectsRef.current.set(objData.id, newThreeObject);
            sceneRef.current?.add(newThreeObject);
        }
      }
    });
  }, [isClient, sceneObjects, sceneRef]);


  // Handle TransformControls attachment and mode, and editor controls state
  useEffect(() => {
    if (!isClient || !transformControlsRef.current || !threeObjectsRef.current.size === undefined || !sceneRef.current || !editorCameraRef.current || !editorControlsRef.current) return;

    const tc = transformControlsRef.current;
    const orbitControls = editorControlsRef.current;

    if (activeSceneCameraId) { // If viewing from a scene camera
        orbitControls.enabled = false; // Disable editor orbit controls
        // If the active scene camera is also the selected object, detach/hide transform controls
        if (selectedObjectId === activeSceneCameraId) {
            if (tc.object) tc.detach();
            tc.visible = false;
            tc.enabled = false;
            return; // Early exit
        }
    } else {
        orbitControls.enabled = !tc.dragging; // Standard behavior
    }
    
    // If an object is selected for transformation (and not the active view camera)
    if (selectedObjectId && selectedObjectId !== activeSceneCameraId) {
      const objectToTransform = threeObjectsRef.current.get(selectedObjectId);

      if (objectToTransform) {
        if (tc.object !== objectToTransform) {
          tc.attach(objectToTransform);
        }
        
        if (activeTool === 'Move' && tc.mode !== 'translate') { tc.setMode('translate'); }
        else if (activeTool === 'Rotate' && tc.mode !== 'rotate') { tc.setMode('rotate'); }
        else if (activeTool === 'Scale' && tc.mode !== 'scale') { tc.setMode('scale'); }

        tc.visible = !!activeTool;
        tc.enabled = !!activeTool;

        if (!activeTool && tc.object) { tc.detach(); }

      } else { // Selected object not found in scene (e.g., just deleted)
        if (tc.object) tc.detach();
        tc.visible = false;
        tc.enabled = false;
      }
    } else { // No object selected, or selected object is the active view camera
      if (tc.object) tc.detach();
      tc.visible = false;
      tc.enabled = false;
    }
  }, [isClient, selectedObjectId, activeTool, activeSceneCameraId, sceneObjects]); // sceneObjects re-triggers to re-evaluate if objectToTransform exists


  if (!isClient) {
    return <div ref={mountRef} className="w-full h-full bg-muted flex items-center justify-center"><p>Loading 3D View...</p></div>;
  }
  
  return <div ref={mountRef} className="w-full h-full" aria-label="3D Modeling Viewport" />;
};

export default ThreeScene;
