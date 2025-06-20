
"use client";

import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import type { SceneObject, ActiveTool } from '@/app/page';

interface ThreeSceneProps {
  sceneObjects: SceneObject[];
  setSceneObjects: React.Dispatch<React.SetStateAction<SceneObject[]>>;
  selectedObjectId: string | null;
  setSelectedObjectId: (id: string | null) => void;
  activeTool: ActiveTool;
  showShadows: boolean;
}

const FONT_PATH = 'https://threejs.org/examples/fonts/helvetiker_regular.typeface.json';

const ThreeScene: React.FC<ThreeSceneProps> = ({
  sceneObjects,
  setSceneObjects,
  selectedObjectId,
  setSelectedObjectId,
  activeTool,
  showShadows
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isClient, setIsClient] = useState(false);
  const [font, setFont] = useState<THREE.Font | null>(null);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const orbitControlsRef = useRef<OrbitControls | null>(null);
  const transformControlsRef = useRef<TransformControls | null>(null);
  const directionalLightRef = useRef<THREE.DirectionalLight | null>(null);
  const groundPlaneRef = useRef<THREE.Mesh<THREE.PlaneGeometry, THREE.ShadowMaterial> | null>(null);


  const threeObjectsRef = useRef<Map<string, THREE.Object3D>>(new Map());

  const raycasterRef = useRef<THREE.Raycaster | null>(null);
  const pointerRef = useRef<THREE.Vector2 | null>(null);

  useEffect(() => {
    setIsClient(true);
    const fontLoader = new FontLoader();
    fontLoader.load(FONT_PATH, (loadedFont) => {
      setFont(loadedFont);
    }, undefined, (error) => {
      console.error('FontLoader: Could not load font.', error);
    });
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

  useEffect(() => {
    if (!isClient || !mountRef.current) return;
    const currentMount = mountRef.current;

    sceneRef.current = new THREE.Scene();
    sceneRef.current.background = new THREE.Color(0x101010); // Dark sky color

    cameraRef.current = new THREE.PerspectiveCamera(75, currentMount.clientWidth / currentMount.clientHeight, 0.1, 2000);
    cameraRef.current.position.set(5, 5, 15); 
    cameraRef.current.lookAt(0,0,0);

    rendererRef.current = new THREE.WebGLRenderer({ antialias: true });
    rendererRef.current.setSize(currentMount.clientWidth, currentMount.clientHeight);
    rendererRef.current.setPixelRatio(window.devicePixelRatio);
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

    const gridHelper = new THREE.GridHelper(1000, 100, 0xffffff, 0xffffff); // White grid lines
    gridHelper.material.opacity = 0.2;
    gridHelper.material.transparent = true;
    sceneRef.current.add(gridHelper);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    sceneRef.current.add(ambientLight);

    directionalLightRef.current = new THREE.DirectionalLight(0xffffff, 1.2);
    directionalLightRef.current.position.set(8, 15, 10);
    directionalLightRef.current.shadow.mapSize.width = 1024;
    directionalLightRef.current.shadow.mapSize.height = 1024;
    directionalLightRef.current.shadow.camera.near = 0.5;
    directionalLightRef.current.shadow.camera.far = 50;
    sceneRef.current.add(directionalLightRef.current);

    groundPlaneRef.current = new THREE.Mesh(
      new THREE.PlaneGeometry(1000, 1000),
      new THREE.ShadowMaterial({ color: 0x080808, opacity: 0.3 }) 
    );
    groundPlaneRef.current.rotation.x = -Math.PI / 2;
    groundPlaneRef.current.position.y = -0.01; 
    groundPlaneRef.current.receiveShadow = true;
    sceneRef.current.add(groundPlaneRef.current);

    const animate = () => {
      requestAnimationFrame(animate);
      orbitControlsRef.current?.update();
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
  }, [isClient, updateSceneObjectFromTransform]);

  // Effect for managing shadows
  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.shadowMap.enabled = showShadows;
    }
    if (directionalLightRef.current) {
      directionalLightRef.current.castShadow = showShadows;
    }
    if (groundPlaneRef.current) {
        groundPlaneRef.current.material.opacity = showShadows ? 0.3 : 0;
    }

    threeObjectsRef.current.forEach(obj => {
      if (obj instanceof THREE.Mesh) {
        obj.castShadow = showShadows;
        obj.receiveShadow = showShadows; // Most objects might not need to receive, but doesn't hurt
      }
    });
    // Force re-render if scene exists
    if (sceneRef.current && cameraRef.current && rendererRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
    }
  }, [showShadows]);


  useEffect(() => {
    if (!isClient || !sceneRef.current) return;

    const currentObjectIds = new Set(sceneObjects.map(objData => objData.id));

    threeObjectsRef.current.forEach((obj, id) => {
        if (!currentObjectIds.has(id)) {
            sceneRef.current?.remove(obj);
            if (transformControlsRef.current?.object === obj) {
                transformControlsRef.current.detach();
            }
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
      const is3DText = objData.type === '3DText';
      const material = existingThreeObject instanceof THREE.Mesh && existingThreeObject.material instanceof THREE.MeshStandardMaterial
        ? existingThreeObject.material
        : new THREE.MeshStandardMaterial({ 
            color: objData.color, 
            metalness: is3DText ? 0.0 : 0.3, 
            roughness: is3DText ? 0.1 : 0.6 
          });
      
      material.color.set(objData.color);
      if (is3DText) {
        material.metalness = 0.0;
        material.roughness = 0.1;
      }

      if (existingThreeObject) {
        existingThreeObject.position.set(...objData.position);
        existingThreeObject.rotation.set(objData.rotation[0], objData.rotation[1], objData.rotation[2]);
        existingThreeObject.scale.set(...objData.scale);
        if (existingThreeObject instanceof THREE.Mesh) {
            if(existingThreeObject.material instanceof THREE.MeshStandardMaterial) {
                existingThreeObject.material.color.set(objData.color);
                if (is3DText) {
                    existingThreeObject.material.metalness = 0.0;
                    existingThreeObject.material.roughness = 0.1;
                }
            }
            existingThreeObject.castShadow = showShadows;
            existingThreeObject.receiveShadow = showShadows;
        }

        if (objData.type === '3DText' && objData.text && font) {
            const mesh = existingThreeObject as THREE.Mesh;
            if (mesh.userData.text !== objData.text || !mesh.geometry.parameters || mesh.geometry.parameters.text !== objData.text) {
                 sceneRef.current?.remove(mesh);
                 if (transformControlsRef.current?.object === mesh) transformControlsRef.current.detach();
                 mesh.geometry.dispose();
                 if (Array.isArray(mesh.material)) mesh.material.forEach(m => m.dispose()); else mesh.material.dispose();
                 threeObjectsRef.current.delete(objData.id);
                 existingThreeObject = undefined; 
            }
        }
      }
      
      if (!existingThreeObject) { 
        let geometry: THREE.BufferGeometry | undefined;
        if (objData.type === '3DText') {
          if (font && objData.text) {
            const textGeo = new TextGeometry(objData.text, {
              font: font,
              size: 1.5, 
              height: 0.4, 
              curveSegments: 12,
              bevelEnabled: true,
              bevelThickness: 0.08,
              bevelSize: 0.03,
              bevelOffset: 0,
              bevelSegments: 4
            });
            textGeo.computeBoundingBox();
            if (textGeo.boundingBox) {
                const centerOffset = -0.5 * (textGeo.boundingBox.max.x - textGeo.boundingBox.min.x);
                textGeo.translate(centerOffset, 0, 0); 
            }
            geometry = textGeo;
          } else {
            console.warn("3DText object: font not loaded or no text. Using placeholder.", objData.name);
            geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1); 
          }
        } else {
            switch (objData.type) {
              case 'Sphere': geometry = new THREE.SphereGeometry(0.5, 32, 16); break;
              case 'Plane': geometry = new THREE.PlaneGeometry(1, 1); break;
              case 'Pyramid': geometry = new THREE.ConeGeometry(0.5, 1, 4); break;
              case 'Cylinder': geometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 32); break;
              case 'Cube': default: geometry = new THREE.BoxGeometry(1, 1, 1); break;
            }
        }
        
        if (geometry) {
            const mesh = new THREE.Mesh(geometry, material);
            mesh.castShadow = showShadows;
            mesh.receiveShadow = showShadows;
            mesh.userData = { id: objData.id, type: objData.type };
            if (objData.type === '3DText') {
                mesh.userData.text = objData.text; 
            }

            mesh.position.set(...objData.position);
            mesh.rotation.set(objData.rotation[0],objData.rotation[1],objData.rotation[2]);
            mesh.scale.set(...objData.scale);

            threeObjectsRef.current.set(objData.id, mesh);
            sceneRef.current?.add(mesh);
        }
      }
    });
  }, [isClient, sceneObjects, sceneRef, font, showShadows]); 


  useEffect(() => {
    if (!isClient || !transformControlsRef.current || !orbitControlsRef.current || !cameraRef.current) return;
    const tc = transformControlsRef.current;
    const orbitControls = orbitControlsRef.current;
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
        orbitControls.enabled = !tc.dragging;
    } else {
        if (tc.object) tc.detach();
        tc.visible = false;
        tc.enabled = false;
        orbitControls.enabled = true;
    }
  }, [isClient, selectedObjectId, activeTool, sceneObjects]);


  if (!isClient) {
    return <div ref={mountRef} className="w-full h-full bg-muted flex items-center justify-center"><p>Loading 3D View...</p></div>;
  }
  if (isClient && !font && sceneObjects.some(obj => obj.type === '3DText')) {
     return <div ref={mountRef} className="w-full h-full bg-muted flex items-center justify-center"><p>Loading Font for 3D Text...</p></div>;
  }

  return <div ref={mountRef} className="w-full h-full" aria-label="3D Modeling Viewport" />;
};

export default ThreeScene;
