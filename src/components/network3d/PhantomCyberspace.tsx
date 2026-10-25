import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  RotateCcw,
  Maximize2,
  Minimize2,
  Camera,
  Play,
  Pause,
  Layers,
  Sparkles,
  Shield,
  Compass,
  FileCode,
  X,
  ChevronUp,
  ChevronDown,
  Info,
} from 'lucide-react';
import { Asset, TrustZone } from '../../types/cyber';
import { useTheme } from '../../context/ThemeContext';

interface PhantomCyberspaceProps {
  assets: Asset[];
  observedPath?: string[];
  activeStepNodeId?: string;
  isSimulating?: boolean;
  onSelectAsset?: (asset: Asset) => void;
  onUpdateAsset?: (asset: Asset) => void;
}

// 3D coordinate mapping based on trust zones
const getSpatialCoordinates = (asset: Asset): [number, number, number] => {
  // Normalize 2D positions from asset into 3D world space (X, Y=elevation, Z)
  switch (asset.trustZone) {
    case 'dmz':
      return [-18 + (asset.position.x - 100) * 0.05, 1.2, -6 + (asset.position.y - 180) * 0.05];
    case 'corporate_lan':
      return [-4 + (asset.position.x - 500) * 0.05, 1.2, -8 + (asset.position.y - 200) * 0.05];
    case 'finance_enclave':
      return [12 + (asset.position.x - 850) * 0.05, 1.6, -6 + (asset.position.y - 180) * 0.05];
    case 'decoy_sandbox':
      return [-4 + (asset.position.x - 500) * 0.05, 1.0, 10 + (asset.position.y - 450) * 0.05];
    default:
      return [0, 1, 0];
  }
};

export const PhantomCyberspace: React.FC<PhantomCyberspaceProps> = ({
  assets,
  observedPath = [],
  activeStepNodeId,
  isSimulating = false,
  onSelectAsset,
  onUpdateAsset,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [hoveredAsset, setHoveredAsset] = useState<Asset | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [autoRotate, setAutoRotate] = useState(false);
  const [controlsCollapsed, setControlsCollapsed] = useState(false);
  const [showPayloadModal, setShowPayloadModal] = useState(false);

  // Reusable refs for Three.js instance
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const nodeMeshesRef = useRef<Map<string, THREE.Group>>(new Map());
  const conduitsGroupRef = useRef<THREE.Group | null>(null);
  const pulseParticlesRef = useRef<{ mesh: THREE.Mesh; path: THREE.CatmullRomCurve3; progress: number; speed: number }[]>([]);

  // Setup Three.js Scene
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Detect software WebGL guard as per threejs skill
    const isSoftwareGl = (() => {
      try {
        const gl = document.createElement('canvas').getContext('webgl2');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch (e) {
        return false;
      }
    })();

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Palette background based on theme
    const bgColor = isDark ? 0x090e1a : 0xf8fafc;
    scene.background = new THREE.Color(bgColor);
    scene.fog = new THREE.FogExp2(bgColor, 0.018);

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 24, 38);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = isDark ? 1.2 : 1.05;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    container.appendChild(renderer.domElement);

    // 4. Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2.05; // don't go below horizon
    controls.minDistance = 10;
    controls.maxDistance = 80;
    controls.target.set(0, 1.5, 0);
    controlsRef.current = controls;

    // 5. Lighting Rig
    const ambientLight = new THREE.AmbientLight(isDark ? 0x243048 : 0xffffff, isDark ? 1.0 : 1.4);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(isDark ? 0x93c5fd : 0xffffff, isDark ? 1.8 : 1.6);
    dirLight.position.set(20, 30, 20);
    dirLight.castShadow = !isSoftwareGl;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 100;
    dirLight.shadow.camera.left = -30;
    dirLight.shadow.camera.right = 30;
    dirLight.shadow.camera.top = 30;
    dirLight.shadow.camera.bottom = -30;
    dirLight.shadow.bias = -0.0005;
    scene.add(dirLight);

    // Subtle Cyan/Purple accent fill light
    const fillLight = new THREE.PointLight(isDark ? 0x38bdf8 : 0x0284c7, isDark ? 1.2 : 0.6, 50);
    fillLight.position.set(-15, 12, -10);
    scene.add(fillLight);

    // 6. Ground Grid & Zone Platforms
    const gridColor = isDark ? 0x1e293b : 0xe2e8f0;
    const gridCenterColor = isDark ? 0x38bdf8 : 0x0284c7;
    const gridHelper = new THREE.GridHelper(70, 35, gridCenterColor, gridColor);
    gridHelper.position.y = 0;
    scene.add(gridHelper);

    // Zone Plinths
    const zones: { name: string; pos: [number, number, number]; size: [number, number]; color: number }[] = [
      { name: 'DMZ PERIMETER', pos: [-16, 0.05, -5], size: [16, 18], color: isDark ? 0x0284c7 : 0xbae6fd },
      { name: 'CORPORATE LAN', pos: [-2, 0.05, -7], size: [18, 20], color: isDark ? 0x4f46e5 : 0xc7d2fe },
      { name: 'FINANCE ENCLAVE', pos: [14, 0.05, -5], size: [16, 18], color: isDark ? 0xd97706 : 0xfde68a },
      { name: 'DECOY SANDBOX', pos: [-2, 0.05, 11], size: [22, 12], color: isDark ? 0x9333ea : 0xe9d5ff },
    ];

    zones.forEach((z) => {
      // Semi-translucent zone base plinth
      const plinthGeo = new THREE.PlaneGeometry(z.size[0], z.size[1]);
      const plinthMat = new THREE.MeshBasicMaterial({
        color: z.color,
        transparent: true,
        opacity: isDark ? 0.08 : 0.25,
        depthWrite: false,
      });
      const plinth = new THREE.Mesh(plinthGeo, plinthMat);
      plinth.rotation.x = -Math.PI / 2;
      plinth.position.set(z.pos[0], z.pos[1], z.pos[2]);
      scene.add(plinth);

      // Zone Boundary Line
      const edges = new THREE.EdgesGeometry(plinthGeo);
      const lineMat = new THREE.LineBasicMaterial({
        color: z.color,
        transparent: true,
        opacity: isDark ? 0.35 : 0.6,
      });
      const wireframe = new THREE.LineSegments(edges, lineMat);
      wireframe.rotation.x = -Math.PI / 2;
      wireframe.position.set(z.pos[0], z.pos[1] + 0.02, z.pos[2]);
      scene.add(wireframe);
    });

    // 7. Group for conduits/network links
    const conduitsGroup = new THREE.Group();
    scene.add(conduitsGroup);
    conduitsGroupRef.current = conduitsGroup;

    // 8. Animation Loop
    let animationFrameId = 0;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      // Auto rotation if enabled
      if (controlsRef.current && autoRotate) {
        controlsRef.current.autoRotate = true;
        controlsRef.current.autoRotateSpeed = 0.8;
      } else if (controlsRef.current) {
        controlsRef.current.autoRotate = false;
      }

      controls.update();

      // Animate live pulses along conduits
      pulseParticlesRef.current.forEach((particle) => {
        particle.progress += particle.speed * delta;
        if (particle.progress > 1) particle.progress = 0;
        const pt = particle.path.getPoint(particle.progress);
        particle.mesh.position.copy(pt);
      });

      // Animate floating indicators (decoy trip beacons, active node rings)
      nodeMeshesRef.current.forEach((group) => {
        const beacon = group.getObjectByName('beaconRing');
        if (beacon) {
          beacon.rotation.z += delta * 1.5;
        }
        const floatItem = group.getObjectByName('floatItem');
        if (floatItem) {
          floatItem.position.y = 1.6 + Math.sin(clock.getElapsedTime() * 2) * 0.15;
          floatItem.rotation.y += delta * 0.8;
        }
      });

      renderer.render(scene, camera);
    };

    animate();

    // Resize Handler
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [isDark]);

  // Update theme colors on scene when theme changes
  useEffect(() => {
    if (!sceneRef.current || !rendererRef.current) return;
    const bgColor = isDark ? 0x090e1a : 0xf8fafc;
    sceneRef.current.background = new THREE.Color(bgColor);
    if (sceneRef.current.fog) {
      sceneRef.current.fog.color.setHex(bgColor);
    }
    rendererRef.current.toneMappingExposure = isDark ? 1.2 : 1.05;
  }, [isDark]);

  // Populate/Update 3D Asset Meshes
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    // Clear old meshes
    nodeMeshesRef.current.forEach((group) => {
      scene.remove(group);
      group.traverse((obj) => {
        if ((obj as THREE.Mesh).geometry) (obj as THREE.Mesh).geometry.dispose();
      });
    });
    nodeMeshesRef.current.clear();

    // Build procedural 3D composite meshes (3-6 parts each)
    assets.forEach((asset) => {
      const group = new THREE.Group();
      const [x, y, z] = getSpatialCoordinates(asset);
      group.position.set(x, y, z);
      group.userData = { assetId: asset.id, asset };

      const isDecoy = asset.category === 'decoy';
      const isTripped = asset.status === 'tripped';
      const isIsolated = asset.status === 'isolated';
      const isInObservedPath = observedPath.includes(asset.id) || activeStepNodeId === asset.id;

      // Base Materials
      const chassisColor = isDark
        ? isDecoy
          ? 0x2e1065
          : 0x1e293b
        : isDecoy
        ? 0xf3e8ff
        : 0xffffff;

      const accentColor = isDecoy
        ? isTripped
          ? 0xef4444
          : 0xa855f7
        : asset.trustZone === 'finance_enclave'
        ? 0xf59e0b
        : asset.trustZone === 'dmz'
        ? 0x0284c7
        : 0x4f46e5;

      const metalness = isDark ? 0.7 : 0.2;
      const roughness = isDark ? 0.25 : 0.35;

      // Part 1: Ground Base Platform
      const baseGeo = new THREE.CylinderGeometry(1.4, 1.6, 0.2, 16);
      const baseMat = new THREE.MeshStandardMaterial({
        color: chassisColor,
        metalness,
        roughness,
      });
      const baseMesh = new THREE.Mesh(baseGeo, baseMat);
      baseMesh.receiveShadow = true;
      group.add(baseMesh);

      // Part 2: Body Primitive based on asset type
      if (asset.type === 'workstation') {
        // Laptop / Terminal
        const bodyGeo = new THREE.BoxGeometry(1.2, 0.15, 0.9);
        const bodyMat = new THREE.MeshStandardMaterial({ color: chassisColor, metalness, roughness });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 0.2;
        group.add(body);

        // Angled Screen
        const screenGeo = new THREE.BoxGeometry(1.1, 0.8, 0.08);
        const screenMat = new THREE.MeshStandardMaterial({
          color: isDark ? 0x0f172a : 0x334155,
          emissive: accentColor,
          emissiveIntensity: isDark ? 0.5 : 0.2,
        });
        const screen = new THREE.Mesh(screenGeo, screenMat);
        screen.position.set(0, 0.65, -0.35);
        screen.rotation.x = -Math.PI / 8;
        group.add(screen);
      } else if (asset.type === 'database' || asset.type === 'decoy_database') {
        // Database multi-cylinder cluster
        for (let i = 0; i < 3; i++) {
          const cylinderGeo = new THREE.CylinderGeometry(0.8, 0.8, 0.45, 24);
          const cylMat = new THREE.MeshStandardMaterial({
            color: chassisColor,
            metalness: 0.8,
            roughness: 0.2,
            emissive: i === 1 ? accentColor : 0x000000,
            emissiveIntensity: i === 1 ? 0.4 : 0,
          });
          const cyl = new THREE.Mesh(cylinderGeo, cylMat);
          cyl.position.y = 0.35 + i * 0.55;
          cyl.castShadow = true;
          group.add(cyl);
        }
      } else if (isDecoy && asset.decoyDetails?.decoyType === 'canary_document') {
        // Floating holographic document slate
        const docGeo = new THREE.BoxGeometry(0.9, 1.2, 0.05);
        const docMat = new THREE.MeshStandardMaterial({
          color: isDark ? 0xf59e0b : 0xd97706,
          metalness: 0.3,
          roughness: 0.3,
          emissive: 0xf59e0b,
          emissiveIntensity: isDark ? 0.6 : 0.3,
          transparent: true,
          opacity: 0.9,
        });
        const doc = new THREE.Mesh(docGeo, docMat);
        doc.name = 'floatItem';
        doc.position.y = 1.6;
        group.add(doc);
      } else if (isDecoy && asset.decoyDetails?.decoyType === 'cloud_token') {
        // Floating key cipher ring
        const torusGeo = new THREE.TorusGeometry(0.6, 0.12, 16, 32);
        const torusMat = new THREE.MeshStandardMaterial({
          color: 0xa855f7,
          emissive: 0xa855f7,
          emissiveIntensity: isDark ? 0.7 : 0.4,
          metalness: 0.9,
          roughness: 0.1,
        });
        const torus = new THREE.Mesh(torusGeo, torusMat);
        torus.name = 'floatItem';
        torus.position.y = 1.6;
        torus.rotation.x = Math.PI / 4;
        group.add(torus);
      } else {
        // Standard Enterprise Server Rack
        const towerGeo = new THREE.BoxGeometry(1.1, 2.2, 1.1);
        const towerMat = new THREE.MeshStandardMaterial({
          color: chassisColor,
          metalness,
          roughness,
        });
        const tower = new THREE.Mesh(towerGeo, towerMat);
        tower.position.y = 1.2;
        tower.castShadow = true;
        group.add(tower);

        // Blade LED strips
        for (let j = 0; j < 4; j++) {
          const ledGeo = new THREE.BoxGeometry(0.85, 0.08, 0.04);
          const ledMat = new THREE.MeshBasicMaterial({
            color: j === 1 && isTripped ? 0xef4444 : accentColor,
          });
          const led = new THREE.Mesh(ledGeo, ledMat);
          led.position.set(0, 0.6 + j * 0.45, 0.56);
          group.add(led);
        }
      }

      // Beacon / Status Aura Ring
      const ringGeo = new THREE.RingGeometry(1.6, 1.85, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: isTripped ? 0xef4444 : isInObservedPath ? 0x06b6d4 : accentColor,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: isTripped ? 0.9 : isInObservedPath ? 0.7 : 0.4,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.name = 'beaconRing';
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.08;
      group.add(ring);

      // Forcefield for Isolated Nodes
      if (isIsolated) {
        const shieldGeo = new THREE.SphereGeometry(2.0, 16, 16);
        const shieldMat = new THREE.MeshBasicMaterial({
          color: 0xf59e0b,
          transparent: true,
          opacity: 0.25,
          wireframe: true,
        });
        const shield = new THREE.Mesh(shieldGeo, shieldMat);
        shield.position.y = 1.2;
        group.add(shield);
      }

      scene.add(group);
      nodeMeshesRef.current.set(asset.id, group);
    });
  }, [assets, observedPath, activeStepNodeId, isDark]);

  // Connect Conduits & Animated Light Pulses
  useEffect(() => {
    const scene = sceneRef.current;
    const conduitsGroup = conduitsGroupRef.current;
    if (!scene || !conduitsGroup) return;

    // Clear old conduits
    while (conduitsGroup.children.length > 0) {
      const child = conduitsGroup.children[0];
      conduitsGroup.remove(child);
      if ((child as THREE.Mesh).geometry) (child as THREE.Mesh).geometry.dispose();
    }
    pulseParticlesRef.current = [];

    // Define Base Topology Edges
    const connections: [string, string][] = [
      ['SRV-EDGE-GW', 'SRV-WEB-PORTAL'],
      ['SRV-EDGE-GW', 'CANARY-HTTP-PORTAL'],
      ['SRV-WEB-PORTAL', 'WS-ENG-04'],
      ['WS-ENG-04', 'DECOY-AWS-CREDS'],
      ['WS-ENG-04', 'WS-FIN-02'],
      ['WS-ENG-04', 'IDP-AUTH0-PROXY'],
      ['WS-FIN-02', 'DECOY-SMB-SHARE'],
      ['WS-FIN-02', 'SRV-FIN-APP'],
      ['SRV-FIN-APP', 'DB-PROD-POSTGRES'],
      ['SRV-FIN-APP', 'DECOY-PAYROLL-DOC'],
      ['SRV-FIN-APP', 'DB-DECOY-HONEY'],
      ['SRV-EDGE-GW', 'HONEY-SSH-BASTION'],
      ['PHANTOM-CORE-ENGINE', 'SRV-FIN-APP'],
    ];

    connections.forEach(([srcId, tgtId]) => {
      const srcAsset = assets.find((a) => a.id === srcId);
      const tgtAsset = assets.find((a) => a.id === tgtId);
      if (!srcAsset || !tgtAsset) return;

      const p1 = new THREE.Vector3(...getSpatialCoordinates(srcAsset));
      const p2 = new THREE.Vector3(...getSpatialCoordinates(tgtAsset));

      // Raised curved conduit
      const mid = p1.clone().lerp(p2, 0.5);
      mid.y += 2.0;
      const curve = new THREE.CatmullRomCurve3([p1, mid, p2]);

      const isPathActive =
        observedPath.includes(srcId) && observedPath.includes(tgtId);

      const tubeGeo = new THREE.TubeGeometry(curve, 24, isPathActive ? 0.08 : 0.04, 8, false);
      const tubeMat = new THREE.MeshStandardMaterial({
        color: isPathActive ? 0x06b6d4 : isDark ? 0x334155 : 0x94a3b8,
        emissive: isPathActive ? 0x06b6d4 : 0x000000,
        emissiveIntensity: isPathActive ? (isDark ? 0.8 : 0.4) : 0,
        transparent: true,
        opacity: isPathActive ? 0.9 : isDark ? 0.4 : 0.6,
      });
      const tubeMesh = new THREE.Mesh(tubeGeo, tubeMat);
      conduitsGroup.add(tubeMesh);

      // Add animated energy pulse particle if path is active or during simulation
      if (isPathActive || isSimulating) {
        const particleGeo = new THREE.SphereGeometry(isPathActive ? 0.25 : 0.15, 8, 8);
        const particleMat = new THREE.MeshBasicMaterial({
          color: isPathActive ? 0x22d3ee : 0x818cf8,
        });
        const particleMesh = new THREE.Mesh(particleGeo, particleMat);
        conduitsGroup.add(particleMesh);

        pulseParticlesRef.current.push({
          mesh: particleMesh,
          path: curve,
          progress: Math.random(),
          speed: isPathActive ? 0.6 : 0.3,
        });
      }
    });
  }, [assets, observedPath, isSimulating, isDark]);

  // Raycasting for Click & Hover Selection
  useEffect(() => {
    const container = mountRef.current;
    if (!container || !cameraRef.current || !sceneRef.current) return;

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / container.clientWidth) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / container.clientHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, cameraRef.current!);
      const intersects = raycaster.intersectObjects(Array.from(nodeMeshesRef.current.values()), true);

      if (intersects.length > 0) {
        let parentGroup: THREE.Object3D | null = intersects[0].object;
        while (parentGroup && !parentGroup.userData.assetId) {
          parentGroup = parentGroup.parent;
        }
        if (parentGroup && parentGroup.userData.asset) {
          setHoveredAsset(parentGroup.userData.asset);
          setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
          container.style.cursor = 'pointer';
          return;
        }
      }
      setHoveredAsset(null);
      setTooltipPos(null);
      container.style.cursor = 'default';
    };

    const handleClick = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / container.clientWidth) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / container.clientHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, cameraRef.current!);
      const intersects = raycaster.intersectObjects(Array.from(nodeMeshesRef.current.values()), true);

      if (intersects.length > 0) {
        let parentGroup: THREE.Object3D | null = intersects[0].object;
        while (parentGroup && !parentGroup.userData.assetId) {
          parentGroup = parentGroup.parent;
        }
        if (parentGroup && parentGroup.userData.asset) {
          const clicked = parentGroup.userData.asset as Asset;
          setSelectedAsset(clicked);
          if (onSelectAsset) onSelectAsset(clicked);
        }
      }
    };

    container.addEventListener('pointermove', handlePointerMove);
    container.addEventListener('click', handleClick);

    return () => {
      container.removeEventListener('pointermove', handlePointerMove);
      container.removeEventListener('click', handleClick);
    };
  }, [onSelectAsset]);

  // Camera Presets
  const setCameraPreset = (preset: 'isometric' | 'top' | 'finance' | 'sandbox') => {
    if (!cameraRef.current || !controlsRef.current) return;
    const camera = cameraRef.current;
    const controls = controlsRef.current;

    switch (preset) {
      case 'isometric':
        camera.position.set(0, 24, 38);
        controls.target.set(0, 1.5, 0);
        break;
      case 'top':
        camera.position.set(0, 48, 0.1);
        controls.target.set(0, 0, 0);
        break;
      case 'finance':
        camera.position.set(16, 14, 14);
        controls.target.set(12, 1.5, -6);
        break;
      case 'sandbox':
        camera.position.set(-4, 12, 26);
        controls.target.set(-4, 1.0, 10);
        break;
    }
  };

  const handleIsolateToggle = () => {
    if (!selectedAsset) return;
    const newStatus = selectedAsset.status === 'isolated' ? 'online' : 'isolated';
    const updated = { ...selectedAsset, status: newStatus as any };
    setSelectedAsset(updated);
    if (onUpdateAsset) onUpdateAsset(updated);
  };

  return (
    <div
      className={`relative w-full rounded-2xl overflow-hidden border transition-colors ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none h-screen' : 'h-[640px]'
      } ${
        isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200 shadow-sm'
      }`}
    >
      {/* 3D WebGL Canvas Container */}
      <div ref={mountRef} className="w-full h-full relative" />

      {/* Floating Hover Tooltip */}
      {hoveredAsset && tooltipPos && (
        <div
          className="absolute z-30 pointer-events-none p-2 rounded-lg backdrop-blur-md shadow-xl text-xs font-mono transition-transform border"
          style={{
            left: `${tooltipPos.x + 15}px`,
            top: `${tooltipPos.y + 15}px`,
            backgroundColor: isDark ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.95)',
            borderColor: isDark ? '#334155' : '#cbd5e1',
            color: isDark ? '#f1f5f9' : '#0f172a',
          }}
        >
          <div className="font-bold">{hoveredAsset.name}</div>
          <div className="text-[10px] text-slate-500">{hoveredAsset.id} · {hoveredAsset.ipAddress}</div>
          <div className="text-[10px] text-cyan-600 dark:text-cyan-400 capitalize">
            {hoveredAsset.category === 'decoy' ? 'Deception Decoy' : 'Production Asset'} ({hoveredAsset.trustZone.replace('_', ' ')})
          </div>
        </div>
      )}

      {/* Top Left HUD Info */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2 pointer-events-none">
        <div
          className={`px-3 py-1.5 rounded-lg border text-xs font-semibold backdrop-blur-md flex items-center gap-2 ${
            isDark
              ? 'bg-slate-900/80 border-slate-800 text-slate-200'
              : 'bg-white/90 border-slate-200 text-slate-800 shadow-xs'
          }`}
        >
          <Compass className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
          <span>PHANTOM CYBERSPACE (3D)</span>
          <span className="text-[10px] font-mono text-slate-400">· {assets.length} Nodes</span>
        </div>

        {observedPath.length > 0 && (
          <div className="px-2.5 py-1.5 rounded-lg bg-cyan-950/80 border border-cyan-800 text-cyan-300 text-xs font-mono flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>Path Active: {observedPath.length} Hops</span>
          </div>
        )}
      </div>

      {/* Top Right Quick Controls */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        <button
          onClick={() => setAutoRotate(!autoRotate)}
          title="Toggle Cinematic Auto-Rotation"
          className={`p-2 rounded-lg border text-xs font-medium transition-colors ${
            autoRotate
              ? 'bg-indigo-600 text-white border-indigo-500'
              : isDark
              ? 'bg-slate-900/80 hover:bg-slate-800 border-slate-800 text-slate-300'
              : 'bg-white/90 hover:bg-slate-100 border-slate-200 text-slate-700 shadow-xs'
          }`}
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => setIsFullscreen(!isFullscreen)}
          title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen 3D View'}
          className={`p-2 rounded-lg border text-xs font-medium transition-colors ${
            isDark
              ? 'bg-slate-900/80 hover:bg-slate-800 border-slate-800 text-slate-300'
              : 'bg-white/90 hover:bg-slate-100 border-slate-200 text-slate-700 shadow-xs'
          }`}
        >
          {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Collapsible Bottom Control Dock (Zero Viewport Occlusion as per ThreeJS Skill) */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 w-auto max-w-[94vw] flex flex-col items-center">
        {/* Dock Collapse Toggle */}
        <button
          onClick={() => setControlsCollapsed(!controlsCollapsed)}
          className={`px-3 py-1 text-[11px] font-semibold rounded-t-lg border-t border-x transition-colors flex items-center gap-1.5 ${
            isDark
              ? 'bg-slate-900/90 border-slate-800 text-slate-300 hover:text-white'
              : 'bg-white/95 border-slate-200 text-slate-700 hover:text-slate-900 shadow-xs'
          }`}
        >
          {controlsCollapsed ? (
            <>
              <ChevronUp className="w-3 h-3" />
              <span>Show 3D Controls</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-3 h-3" />
              <span>Hide Controls</span>
            </>
          )}
        </button>

        {/* Control Bar Container */}
        {!controlsCollapsed && (
          <div
            className={`p-2 rounded-xl border backdrop-blur-md shadow-lg flex flex-wrap items-center gap-2 text-xs transition-all ${
              isDark
                ? 'bg-slate-900/90 border-slate-800 text-slate-300'
                : 'bg-white/95 border-slate-200 text-slate-700 shadow-md'
            }`}
          >
            <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400 px-1">
              <Camera className="w-3.5 h-3.5" />
              <span>Camera Presets:</span>
            </div>

            <button
              onClick={() => setCameraPreset('isometric')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                isDark ? 'hover:bg-slate-800 text-slate-200' : 'hover:bg-slate-100 text-slate-800'
              }`}
            >
              Isometric
            </button>
            <button
              onClick={() => setCameraPreset('top')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                isDark ? 'hover:bg-slate-800 text-slate-200' : 'hover:bg-slate-100 text-slate-800'
              }`}
            >
              Top-Down
            </button>
            <button
              onClick={() => setCameraPreset('finance')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                isDark ? 'hover:bg-slate-800 text-amber-300' : 'hover:bg-slate-100 text-amber-700'
              }`}
            >
              Finance Enclave
            </button>
            <button
              onClick={() => setCameraPreset('sandbox')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                isDark ? 'hover:bg-slate-800 text-purple-300' : 'hover:bg-slate-100 text-purple-700'
              }`}
            >
              Decoy Sandbox
            </button>
          </div>
        )}
      </div>

      {/* Selected Asset Inspection Drawer */}
      {selectedAsset && (
        <div
          className={`absolute top-0 right-0 w-80 h-full p-5 shadow-2xl backdrop-blur-md overflow-y-auto z-30 transition-transform border-l ${
            isDark ? 'bg-slate-900/95 border-slate-800 text-slate-100' : 'bg-white/95 border-slate-200 text-slate-900'
          }`}
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {selectedAsset.id}
              </span>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase font-semibold ${
                  selectedAsset.status === 'tripped'
                    ? 'bg-red-500/20 text-red-600 dark:text-red-300'
                    : selectedAsset.status === 'isolated'
                    ? 'bg-amber-500/20 text-amber-600 dark:text-amber-300'
                    : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300'
                }`}
              >
                {selectedAsset.status.toUpperCase()}
              </span>
            </div>

            <button
              onClick={() => setSelectedAsset(null)}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <h3 className="text-sm font-bold mb-1">{selectedAsset.name}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
            {selectedAsset.description}
          </p>

          <div className="space-y-2 text-xs font-mono border-t border-b border-slate-200 dark:border-slate-800 py-3 mb-4">
            <div className="flex justify-between">
              <span className="text-slate-400">Trust Zone:</span>
              <span className="uppercase text-slate-700 dark:text-slate-300">{selectedAsset.trustZone.replace('_', ' ')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Simulated IP:</span>
              <span className="text-slate-700 dark:text-slate-300">{selectedAsset.ipAddress}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">OS / Environment:</span>
              <span className="text-slate-700 dark:text-slate-300 truncate max-w-[140px]">{selectedAsset.os}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Open Ports:</span>
              <span className="text-slate-700 dark:text-slate-300">{selectedAsset.openPorts.join(', ') || 'Host Only'}</span>
            </div>
          </div>

          {/* Decoy Details */}
          {selectedAsset.category === 'decoy' && selectedAsset.decoyDetails && (
            <div className="mb-4 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/40 rounded-lg p-3 space-y-2 text-xs">
              <div className="flex items-center gap-1.5 text-purple-700 dark:text-purple-300 font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Deception Specifications</span>
              </div>
              <div className="text-[11px] font-mono text-slate-600 dark:text-slate-400">
                Signature: <span className="text-slate-900 dark:text-slate-200">{selectedAsset.decoyDetails.tripwireSignature}</span>
              </div>
              <div className="text-[11px] font-mono text-slate-600 dark:text-slate-400">
                Adversary Hits: <span className="text-purple-600 dark:text-purple-300 font-bold">{selectedAsset.decoyDetails.interactionCount}</span>
              </div>

              <button
                onClick={() => setShowPayloadModal(true)}
                className="w-full mt-2 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium text-purple-700 dark:text-purple-200 bg-purple-100 hover:bg-purple-200 dark:bg-purple-900/40 dark:hover:bg-purple-900/60 border border-purple-300 dark:border-purple-700/50 rounded transition-colors"
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>View Synthetic Decoy Payload</span>
              </button>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-2 pt-2">
            <button
              onClick={handleIsolateToggle}
              className={`w-full py-2 text-xs font-semibold rounded-lg transition-colors ${
                selectedAsset.status === 'isolated'
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  : 'bg-amber-600 hover:bg-amber-500 text-white'
              }`}
            >
              {selectedAsset.status === 'isolated' ? 'Re-enable Simulated Node' : 'Isolate Node in Simulation'}
            </button>
          </div>
        </div>
      )}

      {/* Synthetic Payload Modal */}
      {showPayloadModal && selectedAsset?.decoyDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl max-w-lg w-full p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-3">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Safe Synthetic Decoy Preview</h4>
              </div>
              <button
                onClick={() => setShowPayloadModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
              This deceptive content is safely generated to divert adversaries with zero production credentials or real-world secrets.
            </p>

            <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 font-mono text-xs text-emerald-400 overflow-x-auto whitespace-pre-wrap max-h-60">
              {selectedAsset.decoyDetails.syntheticPayloadPreview}
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setShowPayloadModal(false)}
                className="px-4 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 rounded transition-colors"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
