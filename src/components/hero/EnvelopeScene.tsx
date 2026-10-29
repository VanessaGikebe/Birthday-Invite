"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer } from "@react-three/drei";
import gsap from "gsap";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import Twinkles from "./Twinkles";
import { cardTexture, ensureFonts, envelopeTextTexture, fontFamily, laceTexture, linerTexture, loadImage, sealTexture, type CardText } from "./textures";

/* Envelope dimensions in world units */
const W = 3.2;
const H = 2.1;
const CARD_W = W - 0.24;
const CARD_H = H - 0.22;
const FLAP_L = H * 0.58;
/** How far the lace trim sticks out past the envelope on every side. */
const LACE = 0.17;
const HINGE_Z = 0.07;
const FLAP_OPEN = -Math.PI - 0.32;
const FOV = 35;
const CAM_START_Z = 7.4;
const CAM_END_Z = 6.4;
const CARD_END_Z = 1.4;

const BURGUNDY = "#5B1025";
const WINE = "#741B35";
const RICH = "#8B263F";
const SILVER = "#D9D5D6";

const visible = (distance: number, aspect: number) => {
  const h = 2 * distance * Math.tan(THREE.MathUtils.degToRad(FOV / 2));
  return { h, w: h * aspect };
};

/** Scale that fits the closed envelope comfortably on screen. */
const envelopeFit = (aspect: number) => {
  const { w, h } = visible(CAM_START_Z, aspect);
  return Math.min(1, (w * 0.84) / W, (h * 0.56) / H);
};

/** Where the card settles after opening: right column on wide screens, top on tall ones. */
const cardTarget = (aspect: number) => {
  const { w, h } = visible(CAM_END_Z - CARD_END_Z, aspect);
  if (aspect >= 1.1) {
    const s = Math.min(1.25, (w * 0.49) / CARD_W, (h * 0.7) / CARD_H);
    return { x: w * 0.235, y: 0.05, s, ry: -0.2 };
  }
  const s = Math.min((w * 0.92) / CARD_W, (h * 0.33) / CARD_H);
  return { x: 0, y: h / 2 - (CARD_H * s) / 2 - h * 0.1, s, ry: 0 };
};

type Textures = { card: THREE.Texture; front: THREE.Texture; seal: THREE.Texture; liner: THREE.Texture; lace: THREE.Texture };

export type EnvelopeSceneProps = {
  opened: boolean;
  reducedMotion: boolean;
  active: boolean;
  text: CardText;
  eventSource: React.RefObject<HTMLElement | null>;
  onReady: () => void;
  onRevealed: () => void;
  onContextLost: () => void;
  /** Tapping the envelope opens it too. */
  onOpen: () => void;
};

export default function EnvelopeScene(props: EnvelopeSceneProps) {
  const { active, reducedMotion, eventSource, onContextLost } = props;
  const [mobile] = useState(() => typeof window !== "undefined" && window.innerWidth < 760);

  return (
    <Canvas
      dpr={[1, mobile ? 1.5 : 1.75]}
      frameloop={active ? "always" : "never"}
      camera={{ fov: FOV, position: [0, 0, CAM_START_Z], near: 0.1, far: 60 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance", toneMapping: THREE.NeutralToneMapping }}
      eventSource={eventSource as React.RefObject<HTMLElement>}
      eventPrefix="client"
      onCreated={({ gl }) => {
        gl.domElement.addEventListener("webglcontextlost", (e) => {
          e.preventDefault();
          onContextLost();
        });
      }}
      aria-hidden="true"
    >
      <ambientLight intensity={0.55} />
      <directionalLight position={[3, 4, 5]} intensity={1.9} />
      <directionalLight position={[-4, 2, -2]} intensity={1.1} color={SILVER} />
      <pointLight position={[0, -2.2, 2.5]} intensity={5} distance={9} color={RICH} />

      <Envelope {...props} />

      <Twinkles count={mobile ? 45 : 90} scale={[11, 7, 5]} position={[0, 0, -0.5]} size={mobile ? 11 : 13} speed={reducedMotion ? 0 : 1} opacity={0.85} color={SILVER} />
      <ContactShadows position={[0, -1.55, 0]} opacity={0.5} scale={11} blur={2.6} far={4} resolution={256} color="#2a0610" />

      <Environment resolution={128} frames={1}>
        <Lightformer intensity={3} position={[0, 3, 4]} scale={[7, 1.6, 1]} />
        <Lightformer intensity={1.6} position={[-5, 1, 1]} scale={[3, 6, 1]} />
        <Lightformer intensity={1.2} color={SILVER} position={[5, -1, 2]} scale={[3, 4, 1]} />
        <Lightformer intensity={1} color={RICH} position={[0, -4, 1]} scale={[10, 4, 1]} />
      </Environment>
    </Canvas>
  );
}

function Envelope({ opened, reducedMotion, text, onReady, onRevealed, onOpen }: EnvelopeSceneProps) {
  const rig = useRef<THREE.Group>(null!);
  const env = useRef<THREE.Group>(null!);
  const flap = useRef<THREE.Group>(null!);
  const card = useRef<THREE.Group>(null!);
  const cardFloat = useRef<THREE.Group>(null!);
  const motion = useRef({ float: 1, revealed: false, started: false });
  const { size, camera } = useThree();
  const aspect = size.width / size.height;
  const [assets, setAssets] = useState<{ serif: string; sans: string; photo: HTMLImageElement | null } | null>(null);
  const [base, setBase] = useState<Omit<Textures, "card"> | null>(null);
  const [cardTex, setCardTex] = useState<THREE.Texture | null>(null);
  const tex = useMemo<Textures | null>(() => (base && cardTex ? { ...base, card: cardTex } : null), [base, cardTex]);
  // Effects key off "textures exist", not their identity, so redrawing the letter never restarts them.
  const hasTex = tex !== null;

  /* Fonts and the letter photo load once; the envelope textures are drawn from them. */
  useEffect(() => {
    let cancelled = false;
    let made: Omit<Textures, "card"> | null = null;
    const serif = fontFamily("--font-bodoni", "Georgia, serif");
    const sans = fontFamily("--font-manrope", "system-ui, sans-serif");
    Promise.all([ensureFonts(serif, sans), text.photo ? loadImage(text.photo) : Promise.resolve(null)]).then(([, photo]) => {
      if (cancelled) return;
      made = {
        front: envelopeTextTexture(serif, sans),
        seal: sealTexture(serif, String(text.age)),
        lace: laceTexture((W + 2 * LACE) / (H + 2 * LACE), LACE / (W + 2 * LACE)),
        liner: linerTexture(),
      };
      setAssets({ serif, sans, photo });
      setBase(made);
      requestAnimationFrame(() => onReady());
    });
    return () => {
      cancelled = true;
      if (made) Object.values(made).forEach((t) => t.dispose());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* The letter is drawn once the fonts and photo are ready. */
  useEffect(() => {
    if (!assets) return;
    const t = cardTexture(text, assets.serif, assets.sans, assets.photo);
    setCardTex(t);
    return () => t.dispose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assets]);

  const geo = useMemo(() => {
    const pocket = new THREE.Shape();
    pocket.moveTo(-W / 2, -H / 2);
    pocket.lineTo(W / 2, -H / 2);
    pocket.lineTo(W / 2, H / 2 - 0.02);
    pocket.lineTo(0, -0.05);
    pocket.lineTo(-W / 2, H / 2 - 0.02);
    pocket.closePath();

    const flapShape = new THREE.Shape();
    flapShape.moveTo(-W / 2, 0);
    flapShape.lineTo(W / 2, 0);
    flapShape.lineTo(0.12, -FLAP_L + 0.06);
    flapShape.quadraticCurveTo(0, -FLAP_L - 0.02, -0.12, -FLAP_L + 0.06);
    flapShape.closePath();

    return {
      pocket: new THREE.ExtrudeGeometry(pocket, { depth: 0.04, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.006, bevelSegments: 2, curveSegments: 4 }),
      flap: new THREE.ShapeGeometry(flapShape, 8),
    };
  }, []);
  useEffect(() => () => Object.values(geo).forEach((g) => g.dispose()), [geo]);

  const mats = useMemo(() => {
    const paper = (color: string, roughness = 0.38) =>
      new THREE.MeshPhysicalMaterial({ color, roughness, clearcoat: 0.85, clearcoatRoughness: 0.22, sheen: 0.4, sheenColor: new THREE.Color(RICH) });
    return {
      body: paper(BURGUNDY),
      pocket: paper("#661229", 0.42),
      flap: paper(BURGUNDY, 0.34),
      wax: new THREE.MeshPhysicalMaterial({ color: RICH, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.15 }),
      silver: new THREE.MeshStandardMaterial({ color: SILVER, metalness: 1, roughness: 0.22 }),
      cardEdge: new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.7 }),
      cardBack: new THREE.MeshStandardMaterial({ color: "#FAF7F4", roughness: 0.7 }),
    };
  }, []);
  useEffect(() => () => Object.values(mats).forEach((m) => m.dispose()), [mats]);

  const texMats = useMemo(() => {
    if (!tex) return null;
    return {
      liner: new THREE.MeshStandardMaterial({ map: tex.liner, roughness: 0.75, side: THREE.BackSide }),
      lace: new THREE.MeshPhysicalMaterial({
        color: WINE,
        alphaMap: tex.lace,
        alphaTest: 0.5,
        roughness: 0.45,
        sheen: 0.6,
        sheenColor: new THREE.Color(RICH),
        side: THREE.DoubleSide,
      }),
      linerFront: new THREE.MeshStandardMaterial({ map: tex.liner, roughness: 0.75 }),
      cardFront: new THREE.MeshStandardMaterial({ map: tex.card, emissive: "#ffffff", emissiveMap: tex.card, emissiveIntensity: 0.38, roughness: 0.55 }),
      frontText: new THREE.MeshBasicMaterial({ map: tex.front, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }),
      seal: new THREE.MeshPhysicalMaterial({ map: tex.seal, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.15 }),
    };
  }, [tex]);
  useEffect(
    () => () => {
      if (texMats) Object.values(texMats).forEach((m) => m.dispose());
    },
    [texMats],
  );

  /* Fit the closed envelope (and the card resting inside it) to the screen. */
  useEffect(() => {
    if (!env.current || !card.current) return;
    if (!motion.current.started) {
      const f = envelopeFit(aspect);
      env.current.scale.setScalar(f);
      card.current.scale.setScalar(f);
      card.current.position.set(0, 0, 0.03 * f);
    } else if (motion.current.revealed) {
      const t = cardTarget(aspect);
      gsap.to(card.current.position, { x: t.x, y: t.y, duration: 0.6, ease: "power2.out" });
      gsap.to(card.current.scale, { x: t.s, y: t.s, z: t.s, duration: 0.6, ease: "power2.out" });
      gsap.to(card.current.rotation, { y: t.ry, duration: 0.6 });
    }
  }, [aspect, hasTex]);

  /* The opening sequence. */
  useEffect(() => {
    if (!opened || !tex || motion.current.started) return;
    motion.current.started = true;
    document.body.style.cursor = "";
    const f = envelopeFit(aspect);
    const t = cardTarget(aspect);
    const finish = () => {
      motion.current.revealed = true;
      onRevealed();
    };

    if (reducedMotion) {
      flap.current.rotation.x = FLAP_OPEN;
      card.current.position.set(t.x, t.y, CARD_END_Z);
      card.current.scale.setScalar(t.s);
      card.current.rotation.set(0, t.ry, 0);
      env.current.position.set(0, -6, -2);
      camera.position.z = CAM_END_Z;
      motion.current.float = 0;
      finish();
      return;
    }

    const tl = gsap.timeline({ onComplete: finish });
    tl.to(motion.current, { float: 0.2, duration: 0.6, ease: "power2.out" }, 0)
      .to(flap.current.rotation, { x: FLAP_OPEN, duration: 1.2, ease: "power2.inOut" }, 0.1)
      .to(card.current.position, { y: CARD_H * 0.92 * f, duration: 1.15, ease: "power3.out" }, 1.0)
      .to(card.current.position, { x: t.x, y: t.y, z: CARD_END_Z, duration: 1.6, ease: "power3.inOut" }, 2.05)
      .to(card.current.scale, { x: t.s, y: t.s, z: t.s, duration: 1.6, ease: "power3.inOut" }, 2.05)
      .to(card.current.rotation, { y: t.ry, duration: 1.6, ease: "power3.inOut" }, 2.05)
      .to(env.current.position, { y: -5, z: -1.5, duration: 1.5, ease: "power3.in" }, 2.15)
      .to(env.current.rotation, { x: 0.7, z: -0.15, duration: 1.5, ease: "power2.in" }, 2.15)
      .to(camera.position, { z: CAM_END_Z, duration: 3.4, ease: "power2.inOut" }, 0.2)
      .to(motion.current, { float: 1, duration: 1 }, 3.4);

    return () => {
      tl.progress(1).kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, hasTex]);

  useFrame((state, dt) => {
    if (!rig.current) return;
    const t = state.clock.elapsedTime;
    const k = reducedMotion ? 0 : motion.current.float;
    const settled = motion.current.revealed;
    rig.current.position.y = Math.sin(t * 0.8) * 0.07 * k;
    rig.current.rotation.z = Math.sin(t * 0.5) * 0.02 * k;
    const amp = reducedMotion ? 0 : settled ? 0.07 : 0.2;
    rig.current.rotation.y = THREE.MathUtils.damp(rig.current.rotation.y, state.pointer.x * amp, 3, dt);
    rig.current.rotation.x = THREE.MathUtils.damp(rig.current.rotation.x, -state.pointer.y * amp * 0.6, 3, dt);

    // Before opening, the flap "breathes" every few seconds as a little tease.
    if (!motion.current.started && flap.current && !reducedMotion) {
      flap.current.rotation.x = -Math.pow(Math.max(0, Math.sin(t * 1.3)), 12) * 0.14;
    }
    if (settled && cardFloat.current && !reducedMotion) {
      cardFloat.current.position.y = Math.sin(t * 1.1) * 0.035;
      cardFloat.current.rotation.x = Math.sin(t * 0.7) * 0.025;
    }
  });

  return (
    <group ref={rig}>
      <group
        ref={env}
        visible={Boolean(tex)}
        onClick={(e) => {
          e.stopPropagation();
          if (!opened) onOpen();
        }}
        onPointerOver={() => {
          if (!opened) document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          document.body.style.cursor = "";
        }}
      >
        {/* Lace trim peeking out around the edges */}
        {texMats && (
          <mesh position={[0, 0, -0.004]} material={texMats.lace}>
            <planeGeometry args={[W + 2 * LACE, H + 2 * LACE]} />
          </mesh>
        )}
        {/* Back panel — liner on the inside face */}
        <mesh position={[0, 0, 0.0075]} material={texMats ? [mats.body, mats.body, mats.body, mats.body, texMats.linerFront, mats.body] : mats.body}>
          <boxGeometry args={[W, H, 0.015]} />
        </mesh>
        {/* Front pocket */}
        <mesh geometry={geo.pocket} material={mats.pocket} position={[0, 0, 0.016]} />
        {texMats && (
          <mesh position={[0, -0.6, 0.0625]} material={texMats.frontText}>
            <planeGeometry args={[W * 0.62, (W * 0.62 * 300) / 1024]} />
          </mesh>
        )}
        {/* Top fold */}
        <mesh position={[0, H / 2, 0.042]} rotation={[0, 0, Math.PI / 2]} material={mats.flap}>
          <cylinderGeometry args={[0.035, 0.035, W, 16]} />
        </mesh>
        {/* Flap + wax seal */}
        <group ref={flap} position={[0, H / 2, HINGE_Z]}>
          <mesh geometry={geo.flap} material={mats.flap} position={[0, 0, 0.002]} />
          {texMats && <mesh geometry={geo.flap} material={texMats.liner} />}
          <group position={[0, -FLAP_L + 0.3, 0.02]}>
            <mesh rotation={[Math.PI / 2, 0, 0]} material={texMats ? [mats.wax, texMats.seal, mats.wax] : mats.wax}>
              <cylinderGeometry args={[0.25, 0.27, 0.035, 48]} />
            </mesh>
            <mesh position={[0, 0, 0.012]} material={mats.silver}>
              <torusGeometry args={[0.255, 0.012, 12, 64]} />
            </mesh>
          </group>
        </group>
      </group>

      {/* The invitation card */}
      <group ref={card} visible={Boolean(tex)}>
        <group ref={cardFloat}>
          <mesh material={texMats ? [mats.cardEdge, mats.cardEdge, mats.cardEdge, mats.cardEdge, texMats.cardFront, mats.cardBack] : mats.cardEdge}>
            <boxGeometry args={[CARD_W, CARD_H, 0.012]} />
          </mesh>
          {opened && (
            <>
              {/* twinkles around the opened letter */}
              <Twinkles count={34} scale={[CARD_W * 1.2, CARD_H * 1.25, 0.4]} position={[0, 0, 0.12]} size={12} speed={reducedMotion ? 0 : 1.2} color="#FFFFFF" />
            </>
          )}
        </group>
      </group>
    </group>
  );
}
