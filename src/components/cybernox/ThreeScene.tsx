
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
}

const ThreeScene: React.FC<ThreeSceneProps> = ({
  sceneObjects,
  setSceneObjects,
  selectedObjectId,
  setSelectedObjectId,
  activeTool
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isClient, setIsClient] = useState(false);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null); // Single editor camera
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const orbitControlsRef = useRef<OrbitControls | null>(null);
  const transformControlsRef = useRef<TransformControls | null>(null);

  const threeObjectsRef = useRef<Map<string, THREE.Object3D>>(new Map());

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

    cameraRef.current = new THREE.PerspectiveCamera(75, currentMount.clientWidth / currentMount.clientHeight, 0.1, 2000);
    cameraRef.current.position.set(5, 5, 5);
    cameraRef.current.lookAt(0,0,0);


    rendererRef.current = new THREE.WebGLRenderer({ antialias: true });
    rendererRef.current.setSize(currentMount.clientWidth, currentMount.clientHeight);
    rendererRef.current.setPixelRatio(window.devicePixelRatio);
    rendererRef.current.shadowMap.enabled = true;
    currentMount.appendChild(rendererRef.current.domElement);

    orbitControlsRef.current = new OrbitControls(cameraRef.current, rendererRef.current.domElement);
    orbitControlsRef.current.enableDamping = true;
    orbitControlsRef.current.dampingFactor = 0.05;

    transformControlsRef.current = new TransformControls(cameraRef.current, rendererRef.current.domElement);
    sceneRef.current.add(transformControlsRef.current);

    transformControlsRef.current.addEventListener('dragging-changed', (event) => {
        if (orbitControlsRef.current) {
            orbitControlsRef.current.enabled = !event.value;
        }
    });
    transformControlsRef.current.addEventListener('objectChange', () => {
        if (transformControlsRef.current?.object) {
            updateSceneObjectFromTransform(transformControlsRef.current.object);
        }
    });

    raycasterRef.current = new THREE.Raycaster();
    pointerRef.current = new THREE.Vector2();

    // Significantly larger grid
    const gridHelper = new THREE.GridHelper(200, 40, 0xaaaaaa, 0xbbbbbb); // size, divisions, colorCenterLine, colorGrid
    sceneRef.current.add(gridHelper);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    sceneRef.current.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
    directionalLight.position.set(8, 15, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    sceneRef.current.add(directionalLight);

    const groundPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(200, 200), // Match GridHelper size
      new THREE.ShadowMaterial({ opacity: 0.3, color: 0x999999 })
    );
    groundPlane.rotation.x = -Math.PI / 2;
    groundPlane.position.y = -0.01; // Slightly below the grid lines
    groundPlane.receiveShadow = true;
    sceneRef.current.add(groundPlane);


    const animate = () => {
      requestAnimationFrame(animate);
      if (orbitControlsRef.current) {
        orbitControlsRef.current.update();
      }
      if (sceneRef.current && cameraRef.current && rendererRef.current) {
          rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animate();

    const handleResize = () => {
      if (rendererRef.current && cameraRef.current && currentMount) {
        const width = currentMount.clientWidth;
        const height = currentMount.clientHeight;
        rendererRef.current.setSize(width, height);
        cameraRef.current.aspect = width / height;
        cameraRef.current.updateProjectionMatrix();
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();

    const observer = new MutationObserver(() => {
      if(sceneRef.current) {
        sceneRef.current.background = new THREE.Color(getComputedStyle(document.documentElement).getPropertyValue('--background').trim() || '#f0f0f0');
      }
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['style', 'class'] });

    const onPointerDown = ( event: PointerEvent ) => {
        if (!mountRef.current || !raycasterRef.current || !pointerRef.current || !cameraRef.current || transformControlsRef.current?.dragging) return;

        const rect = mountRef.current.getBoundingClientRect();
        pointerRef.current.x = ( (event.clientX - rect.left) / currentMount.clientWidth ) * 2 - 1;
        pointerRef.current.y = - ( (event.clientY - rect.top) / currentMount.clientHeight ) * 2 + 1;

        raycasterRef.current.setFromCamera( pointerRef.current, cameraRef.current );

        const allSelectableObjects = Array.from(threeObjectsRef.current.values());
        const intersects = raycasterRef.current.intersectObjects( allSelectableObjects, true );

        if ( intersects.length > 0 ) {
            let intersectedObject = intersects[0].object;
            while(intersectedObject.parent && !intersectedObject.userData.id) {
                if (intersectedObject.parent === sceneRef.current) break; // Should not happen with current structure
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
      transformControlsRef.current?.dispose();
      orbitControlsRef.current?.dispose();

      threeObjectsRef.current.forEach((obj) => {
        sceneRef.current?.remove(obj);
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
          else if (obj.material) obj.material.dispose();
        }
      });
      threeObjectsRef.current.clear();

      if (rendererRef.current?.domElement && currentMount.contains(rendererRef.current.domElement)) {
         currentMount.removeChild(rendererRef.current.domElement);
      }
      rendererRef.current?.dispose();
      sceneRef.current?.clear();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isClient, setSelectedObjectId, updateSceneObjectFromTransform]);


  // Update THREE.js objects based on sceneObjects prop
  useEffect(() => {
    if (!isClient || !sceneRef.current) return;

    const currentObjectIds = new Set(sceneObjects.map(objData => objData.id));

    threeObjectsRef.current.forEach((obj, id) => {
        if (!currentObjectIds.has(id)) {
            sceneRef.current?.remove(obj);
            if (obj instanceof THREE.Mesh) {
                obj.geometry.dispose();
                if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
                else if (obj.material) obj.material.dispose();
            }
            threeObjectsRef.current.delete(id);
        }
    });

    sceneObjects.forEach(objData => {
      let existingThreeObject = threeObjectsRef.current.get(objData.id);

      if (existingThreeObject) {
        existingThreeObject.position.set(...objData.position);
        existingThreeObject.rotation.set(objData.rotation[0], objData.rotation[1], objData.rotation[2]);
        existingThreeObject.scale.set(...objData.scale);

        if (existingThreeObject instanceof THREE.Mesh && existingThreeObject.material instanceof THREE.MeshStandardMaterial) {
            existingThreeObject.material.color.set(objData.color);
        }
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
        mesh.userData = { id: objData.id, type: objData.type }; // Store original type

        mesh.position.set(...objData.position);
        mesh.rotation.set(objData.rotation[0],objData.rotation[1],objData.rotation[2]);
        mesh.scale.set(...objData.scale);

        threeObjectsRef.current.set(objData.id, mesh);
        sceneRef.current?.add(mesh);
      }
    });
  }, [isClient, sceneObjects, sceneRef]);


  // Handle TransformControls attachment and mode
  useEffect(() => {
    if (!isClient || !transformControlsRef.current || !orbitControlsRef.current || !cameraRef.current) return;

    const tc = transformControlsRef.current;
    const orbitControls = orbitControlsRef.current;

    // Ensure TransformControls always uses the main editor camera
    if (tc.camera !== cameraRef.current) {
      tc.camera = cameraRef.current;
    }
    
    const selectedObject3D = selectedObjectId ? threeObjectsRef.current.get(selectedObjectId) : null;

    if (selectedObject3D && activeTool) {
        if (tc.object !== selectedObject3D) {
            tc.attach(selectedObject3D);
        }
        if (activeTool === 'Move' && tc.mode !== 'translate') { tc.setMode('translate'); }
        else if (activeTool === 'Rotate' && tc.mode !== 'rotate') { tc.setMode('rotate'); }
        else if (activeTool === 'Scale' && tc.mode !== 'scale') { tc.setMode('scale'); }
        tc.visible = true;
        tc.enabled = true;
        orbitControls.enabled = !tc.dragging; // Disable orbit while transforming
    } else {
        if (tc.object) tc.detach();
        tc.visible = false;
        tc.enabled = false;
        orbitControls.enabled = true; // Re-enable orbit controls
    }
  }, [isClient, selectedObjectId, activeTool, sceneObjects]); // sceneObjects to re-evaluate if selected obj changes


  if (!isClient) {
    return <div ref={mountRef} className="w-full h-full bg-muted flex items-center justify-center"><p>Loading 3D View...</p></div>;
  }

  return <div ref={mountRef} className="w-full h-full" aria-label="3D Modeling Viewport" />;
};

export default ThreeScene;
