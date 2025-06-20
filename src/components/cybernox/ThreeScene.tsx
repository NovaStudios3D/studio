
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
  const editorCameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const editorControlsRef = useRef<OrbitControls | null>(null);
  const transformControlsRef = useRef<TransformControls | null>(null);
  
  const threeObjectsRef = useRef<Map<string, THREE.Object3D>>(new Map());
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
    editorCameraRef.current.lookAt(0,0,0);


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
        if (editorControlsRef.current && editorCameraRef.current === (rendererRef.current as any)?.camera ) { // Check if editor camera is active
            editorControlsRef.current.enabled = !event.value;
        }
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
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    sceneRef.current.add(directionalLight);
    
    const groundPlane = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.ShadowMaterial({ opacity: 0.3 }));
    groundPlane.rotation.x = -Math.PI / 2;
    groundPlane.position.y = -0.01;
    groundPlane.receiveShadow = true;
    sceneRef.current.add(groundPlane);

    const animate = () => {
      requestAnimationFrame(animate);
      
      let cameraToRender: THREE.PerspectiveCamera | null = null;

      if (activeSceneCameraId && threeObjectsRef.current.has(activeSceneCameraId)) {
          const cameraObjectGroup = threeObjectsRef.current.get(activeSceneCameraId);
          const sceneCam = cameraObjectGroup?.children.find(child => child instanceof THREE.PerspectiveCamera) as THREE.PerspectiveCamera | undefined;
          if (sceneCam) {
              cameraToRender = sceneCam;
          }
      }
      
      if (!cameraToRender && editorCameraRef.current) {
          cameraToRender = editorCameraRef.current;
      }

      if (!cameraToRender) {
          return; 
      }
      
      // Update orbit controls only if the editor camera is the one being used for rendering
      if (cameraToRender === editorCameraRef.current && editorControlsRef.current) {
        editorControlsRef.current.update();
      }
      
      if (sceneRef.current && rendererRef.current) {
          cameraHelpersRef.current.forEach(helper => helper.update());
          // Detach transform controls from the camera if we're looking through it.
          // The main useEffect for controls will handle re-attaching if needed.
          if (transformControlsRef.current && transformControlsRef.current.object === cameraToRender?.parent) {
            // transformControlsRef.current.detach(); // This might be too aggressive
          }
          rendererRef.current.render(sceneRef.current, cameraToRender);
      }
    };
    animate();

    const handleResize = () => {
      if (rendererRef.current && editorCameraRef.current && currentMount) {
        const width = currentMount.clientWidth;
        const height = currentMount.clientHeight;
        
        rendererRef.current.setSize(width, height);
        
        editorCameraRef.current.aspect = width / height;
        editorCameraRef.current.updateProjectionMatrix();

        threeObjectsRef.current.forEach(obj => {
          if (obj.userData.type === 'Camera') {
            const sceneCam = obj.children.find(child => child instanceof THREE.PerspectiveCamera) as THREE.PerspectiveCamera | undefined;
            if (sceneCam) {
              sceneCam.aspect = width / height;
              sceneCam.updateProjectionMatrix();
            }
          }
        });
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize(); // Initial call

    const observer = new MutationObserver(() => { 
      if(sceneRef.current) {
        sceneRef.current.background = new THREE.Color(getComputedStyle(document.documentElement).getPropertyValue('--background').trim() || '#f0f0f0');
      }
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['style', 'class'] });

    const onPointerDown = ( event: PointerEvent ) => {
        if (!mountRef.current || !raycasterRef.current || !pointerRef.current || transformControlsRef.current?.dragging) return;
        
        const rect = mountRef.current.getBoundingClientRect();
        pointerRef.current.x = ( (event.clientX - rect.left) / currentMount.clientWidth ) * 2 - 1;
        pointerRef.current.y = - ( (event.clientY - rect.top) / currentMount.clientHeight ) * 2 + 1;

        let cameraForRaycasting: THREE.PerspectiveCamera | null = editorCameraRef.current;
        if (activeSceneCameraId && threeObjectsRef.current.has(activeSceneCameraId)) {
            const cameraObjectGroup = threeObjectsRef.current.get(activeSceneCameraId);
            const sceneCam = cameraObjectGroup?.children.find(c => c instanceof THREE.PerspectiveCamera) as THREE.PerspectiveCamera | undefined;
            if (sceneCam) cameraForRaycasting = sceneCam;
        }
        if (!cameraForRaycasting) return;


        raycasterRef.current.setFromCamera( pointerRef.current, cameraForRaycasting );
        
        const allSelectableObjects: THREE.Object3D[] = [];
        threeObjectsRef.current.forEach(obj => {
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
            while(intersectedObject.parent && !intersectedObject.userData.id) {
                if (intersectedObject.parent === sceneRef.current) break;
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
      // transformControlsRef.current?.removeEventListener('objectChange', updateSceneObjectFromTransform); // already handled by direct call
      transformControlsRef.current?.dispose();
      editorControlsRef.current?.dispose();
      
      threeObjectsRef.current.forEach((obj, id) => {
        sceneRef.current?.remove(obj);
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
          else if (obj.material) obj.material.dispose();
        } else if (obj instanceof THREE.Group) { 
            obj.children.forEach(child => {
                if (child instanceof THREE.Mesh) {
                    child.geometry.dispose();
                    if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
                    else if (child.material) child.material.dispose();
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isClient, setSelectedObjectId, updateSceneObjectFromTransform]); // activeSceneCameraId removed as animate loop handles it


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
            } else if (obj instanceof THREE.Group) {
                 obj.children.forEach(child => {
                    if (child instanceof THREE.Mesh) { 
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
    
    sceneObjects.forEach(objData => {
      let existingThreeObject = threeObjectsRef.current.get(objData.id);

      if (existingThreeObject) { 
        existingThreeObject.position.set(...objData.position);
        existingThreeObject.rotation.set(objData.rotation[0], objData.rotation[1], objData.rotation[2]);
        existingThreeObject.scale.set(...objData.scale);

        if (objData.type === 'Camera') {
            const cam = existingThreeObject.children.find(c => c instanceof THREE.PerspectiveCamera) as THREE.PerspectiveCamera;
            if (cam && objData.fov && cam.fov !== objData.fov) {
              cam.fov = objData.fov;
              cam.updateProjectionMatrix();
            }
            const helper = cameraHelpersRef.current.get(objData.id);
            helper?.update();
        } else if (existingThreeObject instanceof THREE.Mesh && existingThreeObject.material instanceof THREE.MeshStandardMaterial) {
            existingThreeObject.material.color.set(objData.color);
        }
      } else { 
        let newThreeObject: THREE.Object3D;
        if (objData.type === 'Camera') {
            const cameraGroup = new THREE.Group();
            cameraGroup.userData = { id: objData.id, type: 'Camera' };

            const newCamera = new THREE.PerspectiveCamera(objData.fov || 50, (mountRef.current?.clientWidth || 16) / (mountRef.current?.clientHeight || 9) , 0.1, 1000);
            cameraGroup.add(newCamera);
            
            const proxyGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.15); // Made smaller
            const proxyMaterial = new THREE.MeshBasicMaterial({ color: 0xcccccc, wireframe: false, transparent: true, opacity: 0.5 });
            const proxyMesh = new THREE.Mesh(proxyGeometry, proxyMaterial);
            proxyMesh.name = "cameraVisualProxy";
            cameraGroup.add(proxyMesh);
            
            newThreeObject = cameraGroup;
            newThreeObject.position.set(...objData.position);
            newThreeObject.rotation.set(objData.rotation[0],objData.rotation[1],objData.rotation[2]);
            newThreeObject.scale.set(...objData.scale); // Scale for group might affect helper too
            
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
  }, [isClient, sceneObjects, sceneRef, mountRef]);


  // Handle TransformControls attachment and mode, and editor controls state
  useEffect(() => {
    if (!isClient || !transformControlsRef.current || !editorControlsRef.current || !sceneRef.current || !editorCameraRef.current) return;

    const tc = transformControlsRef.current;
    const orbitControls = editorControlsRef.current;

    let isViewingFromSceneCam = false;
    if (activeSceneCameraId) {
        const sceneCamObject = threeObjectsRef.current.get(activeSceneCameraId);
        if (sceneCamObject?.children.find(c => c instanceof THREE.PerspectiveCamera)) {
            isViewingFromSceneCam = true;
        }
    }
    
    // Update TransformControls camera based on current view
    const currentRenderingCamera = isViewingFromSceneCam
      ? threeObjectsRef.current.get(activeSceneCameraId!)?.children.find(c => c instanceof THREE.PerspectiveCamera) as THREE.PerspectiveCamera
      : editorCameraRef.current;

    if (tc.camera !== currentRenderingCamera && currentRenderingCamera) {
        tc.camera = currentRenderingCamera;
    }


    if (isViewingFromSceneCam) {
        orbitControls.enabled = false;
    } else {
        orbitControls.enabled = !tc.dragging;
    }
    
    const selectedObject3D = selectedObjectId ? threeObjectsRef.current.get(selectedObjectId) : null;

    if (selectedObject3D && activeTool && selectedObjectId !== activeSceneCameraId) {
        if (tc.object !== selectedObject3D) {
            tc.attach(selectedObject3D);
        }
        
        if (activeTool === 'Move' && tc.mode !== 'translate') { tc.setMode('translate'); }
        else if (activeTool === 'Rotate' && tc.mode !== 'rotate') { tc.setMode('rotate'); }
        else if (activeTool === 'Scale' && tc.mode !== 'scale') { tc.setMode('scale'); }

        tc.visible = true;
        tc.enabled = true;
    } else {
        if (tc.object) tc.detach();
        tc.visible = false;
        tc.enabled = false;
    }
  }, [isClient, selectedObjectId, activeTool, activeSceneCameraId, sceneObjects]);


  if (!isClient) {
    return <div ref={mountRef} className="w-full h-full bg-muted flex items-center justify-center"><p>Loading 3D View...</p></div>;
  }
  
  return <div ref={mountRef} className="w-full h-full" aria-label="3D Modeling Viewport" />;
};

export default ThreeScene;

    