import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { PetType } from '../../types';

interface Pet3DCanvasProps {
  petType: PetType;
  level: number;
  isFeeding?: boolean;
  isPetting?: boolean;
  collarTheme?: 'lavender' | 'black' | 'cream' | 'pink';
  height?: number | string;
  className?: string;
  interactive?: boolean;
  onPetTap?: () => void;
}

export const Pet3DCanvas: React.FC<Pet3DCanvasProps> = ({
  petType = 'vessel',
  level = 2,
  isFeeding = false,
  isPetting = false,
  collarTheme = 'lavender',
  height = 280,
  className = '',
  interactive = true,
  onPetTap,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const petGroupRef = useRef<THREE.Group | null>(null);
  const tailRef = useRef<THREE.Group | null>(null);
  const leftEarRef = useRef<THREE.Group | null>(null);
  const rightEarRef = useRef<THREE.Group | null>(null);
  const headGroupRef = useRef<THREE.Group | null>(null);
  const treatsGroupRef = useRef<THREE.Group | null>(null);
  const heartsGroupRef = useRef<THREE.Group | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const bounceVelocity = useRef<number>(0);
  const bounceOffset = useRef<number>(0);

  // Drag rotation state
  const isDragging = useRef<boolean>(false);
  const previousPointerX = useRef<number>(0);
  const rotationVelocity = useRef<number>(0.003);
  const currentRotationY = useRef<number>(0);

  // Collar Color Map
  const collarColorMap = {
    lavender: 0xB5A8DE,
    black: 0x18181B,
    cream: 0xF5F5F0,
    pink: 0xF472B6,
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 320;
    const heightPx = typeof height === 'number' ? height : container.clientHeight || 280;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(40, width / heightPx, 0.1, 50);
    camera.position.set(0, 1.4, 3.8);
    camera.lookAt(0, 0.65, 0);

    // 3. Renderer with alpha
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      });
    } catch (e) {
      console.warn('WebGL setup fallback', e);
      return;
    }

    renderer.setSize(width, heightPx);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(renderer.domElement);

    // 4. Lighting - Soft high-end studio lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const mainKeyLight = new THREE.DirectionalLight(0xffffff, 1.5);
    mainKeyLight.position.set(3, 5, 4);
    mainKeyLight.castShadow = true;
    mainKeyLight.shadow.mapSize.width = 1024;
    mainKeyLight.shadow.mapSize.height = 1024;
    mainKeyLight.shadow.bias = -0.0005;
    scene.add(mainKeyLight);

    const fillLavenderLight = new THREE.DirectionalLight(0xD8D0F5, 0.8);
    fillLavenderLight.position.set(-3, 2, -2);
    scene.add(fillLavenderLight);

    const rimLight = new THREE.DirectionalLight(0xffffff, 0.9);
    rimLight.position.set(0, 4, -4);
    scene.add(rimLight);

    // Soft floor shadow disc
    const shadowGeo = new THREE.CircleGeometry(0.9, 32);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.08,
    });
    const shadowDisc = new THREE.Mesh(shadowGeo, shadowMat);
    shadowDisc.rotation.x = -Math.PI / 2;
    shadowDisc.position.y = 0.01;
    scene.add(shadowDisc);

    // 5. Build Pet Hierarchy
    const petGroup = new THREE.Group();
    petGroupRef.current = petGroup;
    scene.add(petGroup);

    // Floating dynamic groups
    const treatsGroup = new THREE.Group();
    treatsGroupRef.current = treatsGroup;
    scene.add(treatsGroup);

    const heartsGroup = new THREE.Group();
    heartsGroupRef.current = heartsGroup;
    scene.add(heartsGroup);

    // Materials Palette
    const dogFurColor = 0xF5E6D3; // Warm soft cream / golden latte
    const catFurColor = 0xF8F9FA; // Pure aesthetic soft white-cream
    const primaryFurColor = petType === 'doggy' ? dogFurColor : catFurColor;

    const furMaterial = new THREE.MeshStandardMaterial({
      color: primaryFurColor,
      roughness: 0.55,
      metalness: 0.05,
    });

    const innerEarMaterial = new THREE.MeshStandardMaterial({
      color: petType === 'doggy' ? 0xE8D5C0 : 0xFCA5A5,
      roughness: 0.6,
    });

    const eyeMaterial = new THREE.MeshStandardMaterial({
      color: 0x111827,
      roughness: 0.1,
      metalness: 0.2,
    });

    const eyeGlintMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
    });

    const noseMaterial = new THREE.MeshStandardMaterial({
      color: petType === 'doggy' ? 0x1F2937 : 0xF472B6,
      roughness: 0.2,
      metalness: 0.1,
    });

    const collarMaterial = new THREE.MeshStandardMaterial({
      color: collarColorMap[collarTheme] || 0xB5A8DE,
      roughness: 0.3,
      metalness: 0.4,
    });

    const bellMaterial = new THREE.MeshStandardMaterial({
      color: 0xFCD34D, // Gold bell
      roughness: 0.2,
      metalness: 0.8,
    });

    // --- PLANT MASCOT BODY ---
    // Exclusively 3D VIVELY VESSEL MASCOT (1:1 Logo Mark Ceramic Pot + Sprout matching Home)
    if (true) {
      const ceramicMaterial = new THREE.MeshStandardMaterial({
        color: 0xFDFCF9, // Warm porcelain ceramic white
        roughness: 0.22,
        metalness: 0.04,
      });

      const soilMaterial = new THREE.MeshStandardMaterial({
        color: 0x2E221B,
        roughness: 0.85,
      });

      const stemMaterial = new THREE.MeshStandardMaterial({
        color: 0x4ADE80,
        roughness: 0.35,
      });

      const berryMaterial = new THREE.MeshStandardMaterial({
        color: 0xA3E635,
        emissive: 0x65A30D,
        emissiveIntensity: 0.45,
        roughness: 0.2,
      });

      const flowerPetalMaterial = new THREE.MeshStandardMaterial({
        color: 0xFFFFFF,
        roughness: 0.3,
      });

      const flowerPistilMaterial = new THREE.MeshStandardMaterial({
        color: 0xF59E0B,
        roughness: 0.25,
      });

      const sageBlushMaterial = new THREE.MeshBasicMaterial({
        color: 0xAFC6B3,
        transparent: true,
        opacity: 0.85,
      });

      const stickLimbMaterial = new THREE.MeshBasicMaterial({
        color: 0x222222,
      });

      // 1. Ceramic U-Vessel Pot Body
      const vesselGroup = new THREE.Group();
      vesselGroup.position.set(0, 0.65, 0);
      petGroup.add(vesselGroup);

      // Bottom curved U bowl (Torus section)
      const bowlGeo = new THREE.TorusGeometry(0.38, 0.22, 24, 32, Math.PI);
      bowlGeo.rotateZ(Math.PI);
      const bowlMesh = new THREE.Mesh(bowlGeo, ceramicMaterial);
      bowlMesh.castShadow = true;
      bowlMesh.receiveShadow = true;
      vesselGroup.add(bowlMesh);

      // Left upright arm of U
      const armGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.45, 24);
      const leftArm = new THREE.Mesh(armGeo, ceramicMaterial);
      leftArm.position.set(-0.38, 0.22, 0);
      leftArm.castShadow = true;
      vesselGroup.add(leftArm);

      // Left arm top rounded dome cap
      const domeGeo = new THREE.SphereGeometry(0.22, 24, 24, 0, Math.PI * 2, 0, Math.PI / 2);
      const leftDome = new THREE.Mesh(domeGeo, ceramicMaterial);
      leftDome.position.set(-0.38, 0.445, 0);
      leftDome.castShadow = true;
      vesselGroup.add(leftDome);

      // Right upright arm of U
      const rightArm = new THREE.Mesh(armGeo, ceramicMaterial);
      rightArm.position.set(0.38, 0.22, 0);
      rightArm.castShadow = true;
      vesselGroup.add(rightArm);

      // Right arm top rounded dome cap
      const rightDome = new THREE.Mesh(domeGeo, ceramicMaterial);
      rightDome.position.set(0.38, 0.445, 0);
      rightDome.castShadow = true;
      vesselGroup.add(rightDome);

      // 2. Potting Soil inside the hollow center
      const soilGeo = new THREE.SphereGeometry(0.26, 20, 20);
      soilGeo.scale(1.2, 0.5, 0.8);
      const soilMesh = new THREE.Mesh(soilGeo, soilMaterial);
      soilMesh.position.set(0, 0.12, 0);
      vesselGroup.add(soilMesh);

      // 3. Pikmin Plant Stem sprouting from soil
      const stemGroup = new THREE.Group();
      stemGroup.position.set(0, 0.18, 0);
      vesselGroup.add(stemGroup);
      headGroupRef.current = stemGroup; // Sway with head animation

      const stemCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(-0.04, 0.35, 0),
        new THREE.Vector3(0.06, 0.65, 0),
        new THREE.Vector3(0.02, 0.95, 0),
      ]);
      const stemGeo = new THREE.TubeGeometry(stemCurve, 20, 0.038, 12, false);
      const stemMesh = new THREE.Mesh(stemGeo, stemMaterial);
      stemMesh.castShadow = true;
      stemGroup.add(stemMesh);

      // Small Leaf on stem
      const leafGeo = new THREE.SphereGeometry(0.1, 16, 16);
      leafGeo.scale(1.4, 0.15, 0.6);
      const leafMesh = new THREE.Mesh(leafGeo, stemMaterial);
      leafMesh.position.set(-0.06, 0.48, 0.05);
      leafMesh.rotation.z = -0.4;
      stemGroup.add(leafMesh);

      // 4. Blooming 5-Petal White Flower on top of stem
      const flowerGroup = new THREE.Group();
      flowerGroup.position.set(0.02, 0.95, 0);
      stemGroup.add(flowerGroup);

      // Golden center core
      const coreGeo = new THREE.SphereGeometry(0.08, 16, 16);
      const coreMesh = new THREE.Mesh(coreGeo, flowerPistilMaterial);
      flowerGroup.add(coreMesh);

      // 5 Petals around the core
      const petalGeo = new THREE.SphereGeometry(0.12, 16, 16);
      petalGeo.scale(0.65, 1.2, 0.3);
      for (let i = 0; i < 5; i++) {
        const petalMesh = new THREE.Mesh(petalGeo, flowerPetalMaterial);
        const angle = (i * Math.PI * 2) / 5;
        petalMesh.position.set(Math.sin(angle) * 0.15, Math.cos(angle) * 0.15, 0);
        petalMesh.rotation.z = -angle;
        flowerGroup.add(petalMesh);
      }

      // 5. Glowing Electric-Lime (+500P) Berry
      const berryTwigCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0.4, 0),
        new THREE.Vector3(0.14, 0.46, 0),
        new THREE.Vector3(0.24, 0.42, 0),
      ]);
      const berryTwigGeo = new THREE.TubeGeometry(berryTwigCurve, 10, 0.022, 8, false);
      const berryTwigMesh = new THREE.Mesh(berryTwigGeo, stemMaterial);
      stemGroup.add(berryTwigMesh);

      const berryGeo = new THREE.SphereGeometry(0.12, 20, 20);
      const berryMesh = new THREE.Mesh(berryGeo, berryMaterial);
      berryMesh.position.set(0.28, 0.42, 0);
      berryMesh.castShadow = true;
      stemGroup.add(berryMesh);
      tailRef.current = berryMesh as unknown as THREE.Group; // Wag/bob in loop

      // 6. Cute Front Face on Vessel Pot (^ ^ arc eyes, joyful mouth, sage-green blush)
      const eyeArcGeo = new THREE.TorusGeometry(0.065, 0.016, 8, 16, Math.PI);
      const leftEyeArc = new THREE.Mesh(eyeArcGeo, stickLimbMaterial);
      leftEyeArc.position.set(-0.2, 0.02, 0.22);
      leftEyeArc.rotation.z = Math.PI; // Invert to make happy arc ^
      vesselGroup.add(leftEyeArc);

      const rightEyeArc = new THREE.Mesh(eyeArcGeo, stickLimbMaterial);
      rightEyeArc.position.set(0.2, 0.02, 0.22);
      rightEyeArc.rotation.z = Math.PI; // Invert to make happy arc ^
      vesselGroup.add(rightEyeArc);

      // Tiny open joyful mouth
      const mouthGeo = new THREE.SphereGeometry(0.045, 16, 16);
      mouthGeo.scale(0.9, 0.6, 0.6);
      const mouthMat = new THREE.MeshBasicMaterial({ color: 0xFB7185 });
      const mouthMesh = new THREE.Mesh(mouthGeo, mouthMat);
      mouthMesh.position.set(0, -0.06, 0.23);
      vesselGroup.add(mouthMesh);

      // Pastel Sage-Green Cheek Blush Marks (#AFC6B3)
      const blushGeo = new THREE.CircleGeometry(0.075, 16);
      const leftBlush = new THREE.Mesh(blushGeo, sageBlushMaterial);
      leftBlush.position.set(-0.33, -0.04, 0.22);
      vesselGroup.add(leftBlush);

      const rightBlush = new THREE.Mesh(blushGeo, sageBlushMaterial);
      rightBlush.position.set(0.33, -0.04, 0.22);
      vesselGroup.add(rightBlush);

      // 7. Tiny Black Stick Limbs
      const armCurveLeft = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.48, 0, 0),
        new THREE.Vector3(-0.62, 0.15, 0.05),
        new THREE.Vector3(-0.58, 0.32, 0.1),
      ]);
      const leftStickArm = new THREE.Mesh(new THREE.TubeGeometry(armCurveLeft, 12, 0.022, 8, false), stickLimbMaterial);
      vesselGroup.add(leftStickArm);

      const armCurveRight = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.48, 0, 0),
        new THREE.Vector3(0.62, -0.08, 0.05),
        new THREE.Vector3(0.55, -0.16, 0.08),
      ]);
      const rightStickArm = new THREE.Mesh(new THREE.TubeGeometry(armCurveRight, 12, 0.022, 8, false), stickLimbMaterial);
      vesselGroup.add(rightStickArm);

      // Stick Legs
      const legGeo = new THREE.CylinderGeometry(0.022, 0.022, 0.22, 8);
      const leftStickLeg = new THREE.Mesh(legGeo, stickLimbMaterial);
      leftStickLeg.position.set(-0.18, -0.48, 0);
      vesselGroup.add(leftStickLeg);

      const footGeo = new THREE.SphereGeometry(0.038, 12, 12);
      const leftFoot = new THREE.Mesh(footGeo, stickLimbMaterial);
      leftFoot.position.set(-0.18, -0.58, 0.03);
      vesselGroup.add(leftFoot);

      const rightStickLeg = new THREE.Mesh(legGeo, stickLimbMaterial);
      rightStickLeg.position.set(0.18, -0.48, 0);
      vesselGroup.add(rightStickLeg);

      const rightFoot = new THREE.Mesh(footGeo, stickLimbMaterial);
      rightFoot.position.set(0.18, -0.58, 0.03);
      vesselGroup.add(rightFoot);
    } else {
      // --- STANDARD DOGGY / KITTEN ---
      // Chubby torso
      const bodyGeo = new THREE.SphereGeometry(0.5, 32, 32);
      bodyGeo.scale(0.85, 1.0, 0.95);
      const bodyMesh = new THREE.Mesh(bodyGeo, furMaterial);
      bodyMesh.position.set(0, 0.52, 0);
      bodyMesh.castShadow = true;
      bodyMesh.receiveShadow = true;
      petGroup.add(bodyMesh);

      // Front Paws
      const pawGeo = new THREE.SphereGeometry(0.13, 20, 20);
      pawGeo.scale(0.9, 0.7, 1.2);
      const frontLeftPaw = new THREE.Mesh(pawGeo, furMaterial);
      frontLeftPaw.position.set(-0.24, 0.1, 0.32);
      frontLeftPaw.castShadow = true;
      petGroup.add(frontLeftPaw);

      const frontRightPaw = new THREE.Mesh(pawGeo, furMaterial);
      frontRightPaw.position.set(0.24, 0.1, 0.32);
      frontRightPaw.castShadow = true;
      petGroup.add(frontRightPaw);

      // Back Paws / Thighs
      const backLeftPaw = new THREE.Mesh(pawGeo, furMaterial);
      backLeftPaw.position.set(-0.3, 0.1, -0.15);
      backLeftPaw.castShadow = true;
      petGroup.add(backLeftPaw);

      const backRightPaw = new THREE.Mesh(pawGeo, furMaterial);
      backRightPaw.position.set(0.3, 0.1, -0.15);
      backRightPaw.castShadow = true;
      petGroup.add(backRightPaw);

      // Collar
      const collarGeo = new THREE.TorusGeometry(0.38, 0.05, 16, 32);
      collarGeo.rotateX(Math.PI / 2);
      const collarMesh = new THREE.Mesh(collarGeo, collarMaterial);
      collarMesh.position.set(0, 0.85, 0.02);
      collarMesh.castShadow = true;
      petGroup.add(collarMesh);

      // Bell / Tag
      const bellGeo = new THREE.SphereGeometry(0.065, 16, 16);
      const bellMesh = new THREE.Mesh(bellGeo, bellMaterial);
      bellMesh.position.set(0, 0.8, 0.4);
      bellMesh.castShadow = true;
      petGroup.add(bellMesh);

      // --- HEAD GROUP ---
      const headGroup = new THREE.Group();
      headGroup.position.set(0, 1.05, 0.05);
      headGroupRef.current = headGroup;
      petGroup.add(headGroup);

    // Head base sphere
    const headGeo = new THREE.SphereGeometry(0.48, 32, 32);
    headGeo.scale(1.05, 0.98, 1.0);
    const headMesh = new THREE.Mesh(headGeo, furMaterial);
    headMesh.castShadow = true;
    headMesh.receiveShadow = true;
    headGroup.add(headMesh);

    // Eyes
    const eyeGeo = new THREE.SphereGeometry(0.075, 20, 20);
    const glintGeo = new THREE.SphereGeometry(0.025, 12, 12);
    const subGlintGeo = new THREE.SphereGeometry(0.013, 12, 12);

    // Left eye
    const leftEye = new THREE.Mesh(eyeGeo, eyeMaterial);
    leftEye.position.set(-0.19, 0.04, 0.42);
    headGroup.add(leftEye);

    const leftGlint = new THREE.Mesh(glintGeo, eyeGlintMaterial);
    leftGlint.position.set(-0.17, 0.07, 0.48);
    headGroup.add(leftGlint);

    const leftSubGlint = new THREE.Mesh(subGlintGeo, eyeGlintMaterial);
    leftSubGlint.position.set(-0.21, 0.02, 0.48);
    headGroup.add(leftSubGlint);

    // Right eye
    const rightEye = new THREE.Mesh(eyeGeo, eyeMaterial);
    rightEye.position.set(0.19, 0.04, 0.42);
    headGroup.add(rightEye);

    const rightGlint = new THREE.Mesh(glintGeo, eyeGlintMaterial);
    rightGlint.position.set(0.21, 0.07, 0.48);
    headGroup.add(rightGlint);

    const rightSubGlint = new THREE.Mesh(subGlintGeo, eyeGlintMaterial);
    rightSubGlint.position.set(0.17, 0.02, 0.48);
    headGroup.add(rightSubGlint);

    // Cute blush cheeks
    const blushMat = new THREE.MeshBasicMaterial({
      color: 0xFCA5A5,
      transparent: true,
      opacity: 0.45,
    });
    const blushGeo = new THREE.CircleGeometry(0.07, 16);

    const leftBlush = new THREE.Mesh(blushGeo, blushMat);
    leftBlush.position.set(-0.27, -0.06, 0.41);
    leftBlush.rotation.y = -0.3;
    headGroup.add(leftBlush);

    const rightBlush = new THREE.Mesh(blushGeo, blushMat);
    rightBlush.position.set(0.27, -0.06, 0.41);
    rightBlush.rotation.y = 0.3;
    headGroup.add(rightBlush);

    // --- DOGGY SPECIFIC FEATURES ---
    if (petType === 'doggy') {
      // Puppy Snout
      const snoutGeo = new THREE.SphereGeometry(0.16, 20, 20);
      snoutGeo.scale(1.1, 0.85, 1.2);
      const snoutMesh = new THREE.Mesh(snoutGeo, furMaterial);
      snoutMesh.position.set(0, -0.06, 0.44);
      headGroup.add(snoutMesh);

      // Puppy Button Nose
      const noseGeo = new THREE.SphereGeometry(0.045, 16, 16);
      noseGeo.scale(1.3, 0.9, 0.9);
      const noseMesh = new THREE.Mesh(noseGeo, noseMaterial);
      noseMesh.position.set(0, -0.02, 0.58);
      headGroup.add(noseMesh);

      // Puppy Tongue (Happy pink)
      const tongueGeo = new THREE.SphereGeometry(0.04, 16, 16);
      tongueGeo.scale(0.8, 0.3, 1.1);
      const tongueMat = new THREE.MeshStandardMaterial({ color: 0xFB7185 });
      const tongueMesh = new THREE.Mesh(tongueGeo, tongueMat);
      tongueMesh.position.set(0, -0.12, 0.53);
      headGroup.add(tongueMesh);

      // Floppy Puppy Ears
      const earGeo = new THREE.SphereGeometry(0.22, 20, 20);
      earGeo.scale(0.55, 1.2, 0.4);

      const leftEarGroup = new THREE.Group();
      leftEarGroup.position.set(-0.42, 0.22, 0.05);
      const leftEarMesh = new THREE.Mesh(earGeo, furMaterial);
      leftEarMesh.position.set(0, -0.12, 0);
      leftEarMesh.rotation.z = -0.35;
      leftEarGroup.add(leftEarMesh);
      headGroup.add(leftEarGroup);
      leftEarRef.current = leftEarGroup;

      const rightEarGroup = new THREE.Group();
      rightEarGroup.position.set(0.42, 0.22, 0.05);
      const rightEarMesh = new THREE.Mesh(earGeo, furMaterial);
      rightEarMesh.position.set(0, -0.12, 0);
      rightEarMesh.rotation.z = 0.35;
      rightEarGroup.add(rightEarMesh);
      headGroup.add(rightEarGroup);
      rightEarRef.current = rightEarGroup;

      // Wagging Puppy Tail
      const tailGroup = new THREE.Group();
      tailGroup.position.set(0, 0.45, -0.42);
      const tailGeo = new THREE.CylinderGeometry(0.05, 0.03, 0.3, 16);
      tailGeo.rotateX(Math.PI / 3);
      const tailMesh = new THREE.Mesh(tailGeo, furMaterial);
      tailMesh.position.set(0, 0.12, -0.08);
      tailGroup.add(tailMesh);
      petGroup.add(tailGroup);
      tailRef.current = tailGroup;
    } 
    // --- KITTEN SPECIFIC FEATURES ---
    else {
      // Kitten delicate muzzle
      const muzzleGeo = new THREE.SphereGeometry(0.12, 20, 20);
      muzzleGeo.scale(1.2, 0.75, 1.1);
      const muzzleMesh = new THREE.Mesh(muzzleGeo, furMaterial);
      muzzleMesh.position.set(0, -0.06, 0.42);
      headGroup.add(muzzleMesh);

      // Tiny pink kitten nose
      const catNoseGeo = new THREE.ConeGeometry(0.035, 0.04, 16);
      catNoseGeo.rotateX(Math.PI);
      const catNoseMesh = new THREE.Mesh(catNoseGeo, noseMaterial);
      catNoseMesh.position.set(0, -0.03, 0.52);
      headGroup.add(catNoseMesh);

      // Pointed Cat Ears with Pink Inners
      const catEarGeo = new THREE.ConeGeometry(0.18, 0.34, 16);
      catEarGeo.scale(0.85, 1.0, 0.55);

      const innerCatEarGeo = new THREE.ConeGeometry(0.13, 0.26, 16);
      innerCatEarGeo.scale(0.85, 1.0, 0.55);

      const leftCatEarGroup = new THREE.Group();
      leftCatEarGroup.position.set(-0.32, 0.4, 0.05);
      leftCatEarGroup.rotation.z = 0.28;
      leftCatEarGroup.rotation.x = -0.15;
      const leftCatEarMesh = new THREE.Mesh(catEarGeo, furMaterial);
      const leftInnerEarMesh = new THREE.Mesh(innerCatEarGeo, innerEarMaterial);
      leftInnerEarMesh.position.set(0, -0.02, 0.02);
      leftCatEarGroup.add(leftCatEarMesh);
      leftCatEarGroup.add(leftInnerEarMesh);
      headGroup.add(leftCatEarGroup);
      leftEarRef.current = leftCatEarGroup;

      const rightCatEarGroup = new THREE.Group();
      rightCatEarGroup.position.set(0.32, 0.4, 0.05);
      rightCatEarGroup.rotation.z = -0.28;
      rightCatEarGroup.rotation.x = -0.15;
      const rightCatEarMesh = new THREE.Mesh(catEarGeo, furMaterial);
      const rightInnerEarMesh = new THREE.Mesh(innerCatEarGeo, innerEarMaterial);
      rightInnerEarMesh.position.set(0, -0.02, 0.02);
      rightCatEarGroup.add(rightCatEarMesh);
      rightCatEarGroup.add(rightInnerEarMesh);
      headGroup.add(rightCatEarGroup);
      rightEarRef.current = rightCatEarGroup;

      // Graceful Curled Cat Tail
      const tailGroup = new THREE.Group();
      tailGroup.position.set(0, 0.35, -0.4);
      
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0.08, 0.2, -0.1),
        new THREE.Vector3(0.12, 0.42, -0.05),
        new THREE.Vector3(0.02, 0.52, 0.05),
      ]);
      const tubeGeo = new THREE.TubeGeometry(curve, 20, 0.045, 12, false);
      const tailMesh = new THREE.Mesh(tubeGeo, furMaterial);
      tailGroup.add(tailMesh);
      petGroup.add(tailGroup);
      tailRef.current = tailGroup;
    }
  }

    // Interactive pointer drag handling
    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      if (!interactive) return;
      isDragging.current = true;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      previousPointerX.current = clientX;
      rotationVelocity.current = 0;
    };

    const onPointerMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging.current || !interactive) return;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const deltaX = clientX - previousPointerX.current;
      previousPointerX.current = clientX;

      currentRotationY.current += deltaX * 0.012;
      rotationVelocity.current = deltaX * 0.003;
    };

    const onPointerUp = () => {
      isDragging.current = false;
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);
    dom.addEventListener('touchstart', onPointerDown, { passive: true });
    window.addEventListener('touchmove', onPointerMove, { passive: true });
    window.addEventListener('touchend', onPointerUp);

    // Animation Loop
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId.current = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Inertia rotation
      if (!isDragging.current) {
        currentRotationY.current += rotationVelocity.current;
        rotationVelocity.current *= 0.96;
        if (Math.abs(rotationVelocity.current) < 0.0008) {
          rotationVelocity.current = 0.002;
        }
      }

      if (petGroupRef.current) {
        petGroupRef.current.rotation.y = currentRotationY.current;

        // Idle bounce and breathing
        const idleBreathe = Math.sin(elapsedTime * 2.2) * 0.02;
        bounceOffset.current += bounceVelocity.current;
        bounceVelocity.current *= 0.85;

        petGroupRef.current.position.y = idleBreathe + bounceOffset.current;

        // Head tilt
        if (headGroupRef.current) {
          headGroupRef.current.rotation.z = Math.sin(elapsedTime * 1.4) * 0.05;
          headGroupRef.current.rotation.x = Math.sin(elapsedTime * 2.0) * 0.02;
        }

        // Tail wag animation
        if (tailRef.current) {
          const wagSpeed = (isFeeding || isPetting) ? 18 : 6;
          const wagAmount = (isFeeding || isPetting) ? 0.45 : 0.22;
          tailRef.current.rotation.y = Math.sin(elapsedTime * wagSpeed) * wagAmount;
        }

        // Ear perk/bob animation
        if (leftEarRef.current && rightEarRef.current) {
          const earBob = Math.sin(elapsedTime * 3) * 0.04;
          leftEarRef.current.rotation.x = earBob;
          rightEarRef.current.rotation.x = -earBob;
        }
      }

      // Animate Treats if feeding
      if (treatsGroupRef.current && treatsGroupRef.current.children.length > 0) {
        treatsGroupRef.current.children.forEach((treat) => {
          treat.position.y -= 0.03;
          treat.rotation.x += 0.05;
          treat.rotation.z += 0.05;
          if (treat.position.y < 0.3) {
            treatsGroupRef.current?.remove(treat);
          }
        });
      }

      // Animate Hearts if petting
      if (heartsGroupRef.current && heartsGroupRef.current.children.length > 0) {
        heartsGroupRef.current.children.forEach((heart) => {
          heart.position.y += 0.025;
          heart.scale.multiplyScalar(0.985);
          if (heart.position.y > 2.2) {
            heartsGroupRef.current?.remove(heart);
          }
        });
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      dom.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('mouseup', onPointerUp);
      dom.removeEventListener('touchstart', onPointerDown);
      window.removeEventListener('touchmove', onPointerMove);
      window.removeEventListener('touchend', onPointerUp);
      renderer.dispose();
    };
  }, [petType, collarTheme, height, interactive]);

  // Handle Watering Plant (Hydration water droplets)
  useEffect(() => {
    if (!isFeeding || !sceneRef.current || !treatsGroupRef.current) return;

    bounceVelocity.current = 0.08;

    // Drop sparkling blue water droplets into the soil
    const dropletGeo = new THREE.SphereGeometry(0.06, 14, 14);
    dropletGeo.scale(0.8, 1.4, 0.8);
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x38BDF8,
      roughness: 0.1,
      metalness: 0.1,
      transparent: true,
      opacity: 0.85,
    });

    for (let i = 0; i < 5; i++) {
      const dropMesh = new THREE.Mesh(dropletGeo, waterMat);
      dropMesh.position.set(
        (Math.random() - 0.5) * 0.45,
        1.8 + Math.random() * 0.4,
        (Math.random() - 0.5) * 0.45
      );
      treatsGroupRef.current.add(dropMesh);
    }
  }, [isFeeding]);

  // Handle Petting affection heart creation
  useEffect(() => {
    if (!isPetting || !sceneRef.current || !heartsGroupRef.current) return;

    bounceVelocity.current = 0.05;

    const heartMat = new THREE.MeshBasicMaterial({
      color: 0xFB7185,
    });
    const heartGeo = new THREE.SphereGeometry(0.07, 12, 12);

    for (let i = 0; i < 5; i++) {
      const heart = new THREE.Mesh(heartGeo, heartMat);
      heart.position.set(
        (Math.random() - 0.5) * 0.7,
        1.0 + Math.random() * 0.3,
        (Math.random() - 0.5) * 0.7
      );
      heartsGroupRef.current.add(heart);
    }
  }, [isPetting]);

  return (
    <div 
      className={`relative w-full overflow-hidden select-none cursor-grab active:cursor-grabbing ${className}`}
      onClick={onPetTap}
    >
      <div 
        ref={mountRef} 
        style={{ height: typeof height === 'number' ? `${height}px` : height }}
        className="w-full"
      />
    </div>
  );
};
