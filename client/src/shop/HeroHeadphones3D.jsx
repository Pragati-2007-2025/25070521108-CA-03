import { Component, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { AdditiveBlending } from 'three';
import Headphones3D from './Headphones3D.jsx';

function hasWebGL() {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
  } catch {
    return false;
  }
}

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

class CanvasBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

const shellMaterial = {
  color: '#0a1020',
  metalness: 0.94,
  roughness: 0.24,
  clearcoat: 1,
  clearcoatRoughness: 0.18,
};

function HeadphonesModel() {
  return (
    <group scale={1.02} position={[0, 0.02, 0]}>
      {/* Outer headband */}
      <mesh>
        <torusGeometry args={[1.02, 0.061, 24, 128, Math.PI]} />
        <meshPhysicalMaterial {...shellMaterial} />
      </mesh>

      {/* Inner headband cushion */}
      <mesh position={[0, 0, -0.052]}>
        <torusGeometry args={[0.945, 0.028, 16, 96, Math.PI]} />
        <meshStandardMaterial color="#04060d" metalness={0.15} roughness={0.85} />
      </mesh>

      {/* Electric band light */}
      <mesh position={[0, 0, 0.062]} rotation={[0, 0, 0.11]}>
        <torusGeometry args={[1.02, 0.008, 8, 120, Math.PI * 0.7]} />
        <meshBasicMaterial color="#0eabfb" toneMapped={false} />
      </mesh>

      {[1, -1].map((side) => (
        <group key={side} position={[side * 1.02, -0.5, 0]}>
          {/* Yoke */}
          <mesh position={[0, 0.26, 0]}>
            <boxGeometry args={[0.062, 0.48, 0.068]} />
            <meshStandardMaterial color="#1a2742" metalness={1} roughness={0.28} />
          </mesh>

          {/* Ear cup shell */}
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.355, 0.4, 0.3, 56]} />
            <meshPhysicalMaterial {...shellMaterial} />
          </mesh>

          {/* Outer face plate */}
          <mesh position={[side * 0.158, 0, 0]} rotation={[0, side * Math.PI / 2, 0]}>
            <circleGeometry args={[0.335, 56]} />
            <meshPhysicalMaterial color="#0c1424" metalness={1} roughness={0.18} clearcoat={1} clearcoatRoughness={0.1} />
          </mesh>

          {/* Halo ring on the face plate */}
          <mesh position={[side * 0.171, 0, 0]} rotation={[0, side * Math.PI / 2, 0]}>
            <torusGeometry args={[0.272, 0.011, 12, 80]} />
            <meshBasicMaterial color={side === 1 ? '#0eabfb' : '#a379d3'} toneMapped={false} />
          </mesh>

          {/* Inner memory-foam cushion */}
          <mesh position={[-side * 0.165, 0, 0]} rotation={[0, side * Math.PI / 2, 0]}>
            <torusGeometry args={[0.29, 0.098, 20, 56]} />
            <meshStandardMaterial color="#03050b" metalness={0.08} roughness={0.92} />
          </mesh>

          {/* Status light */}
          <mesh position={[side * 0.178, -0.215, 0.16]}>
            <sphereGeometry args={[0.019, 16, 16]} />
            <meshBasicMaterial color="#9fe8ff" toneMapped={false} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function OrbitRings({ reduceMotion }) {
  const rings = useRef();

  useFrame((_, delta) => {
    if (!reduceMotion && rings.current) rings.current.rotation.z += delta * 0.055;
  });

  return (
    <group ref={rings} rotation={[0.16, 0, 0]}>
      <mesh rotation={[1.29, 0.22, 0.44]}>
        <torusGeometry args={[1.72, 0.0045, 8, 180]} />
        <meshBasicMaterial color="#195aea" transparent opacity={0.55} toneMapped={false} />
      </mesh>
      <mesh rotation={[1.12, -0.42, -0.72]}>
        <torusGeometry args={[1.98, 0.0038, 8, 180]} />
        <meshBasicMaterial color="#a379d3" transparent opacity={0.45} toneMapped={false} />
      </mesh>
      <mesh rotation={[1.46, 0.62, 0.08]}>
        <torusGeometry args={[2.28, 0.003, 8, 180]} />
        <meshBasicMaterial color="#0eabfb" transparent opacity={0.28} toneMapped={false} />
      </mesh>
    </group>
  );
}

/** Deterministic pseudo-random sequence so the particle cloud is stable across renders. */
function seededRandom(seed) {
  let value = seed;
  return () => {
    value = (value * 1664525 + 1013904223) % 4294967296;
    return value / 4294967296;
  };
}

function Particles({ count = 190, reduceMotion }) {
  const points = useRef();
  const positions = useMemo(() => {
    const random = seededRandom(90210);
    const data = new Float32Array(count * 3);
    for (let index = 0; index < count; index += 1) {
      const radius = 1.4 + random() * 2.4;
      const theta = random() * Math.PI * 2;
      const phi = Math.acos(2 * random() - 1);
      data[index * 3] = radius * Math.sin(phi) * Math.cos(theta);
      data[index * 3 + 1] = radius * Math.cos(phi) * 0.72;
      data[index * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta) - 0.6;
    }
    return data;
  }, [count]);

  useFrame((_, delta) => {
    if (!reduceMotion && points.current) points.current.rotation.y += delta * 0.018;
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.022}
        color="#9fd2ff"
        transparent
        opacity={0.78}
        sizeAttenuation
        depthWrite={false}
        blending={AdditiveBlending}
      />
    </points>
  );
}

function Scene({ reduceMotion }) {
  const model = useRef();

  useFrame((state, delta) => {
    const group = model.current;
    if (!group) return;
    const ease = Math.min(1, delta * 2.8);
    const targetY = -0.32 + state.pointer.x * 0.52;
    const targetX = 0.1 - state.pointer.y * 0.22;
    group.rotation.y += (targetY - group.rotation.y) * ease;
    group.rotation.x += (targetX - group.rotation.x) * ease;
    const floatY = reduceMotion ? 0 : Math.sin(state.clock.elapsedTime * 0.72) * 0.07;
    group.position.y += (floatY - group.position.y) * ease;
  });

  return (
    <>
      <ambientLight intensity={0.4} color="#4d63a8" />
      <directionalLight position={[3.5, 4.5, 5]} intensity={2.6} color="#e6eeff" />
      <directionalLight position={[-4, 2, 3]} intensity={0.9} color="#2a5cff" />
      <pointLight position={[-2.8, -0.4, 2.4]} intensity={26} distance={9} color="#195aea" />
      <pointLight position={[2.4, 1.1, 2.2]} intensity={22} distance={9} color="#a379d3" />
      <spotLight position={[0, 4.2, 2.4]} angle={0.6} penumbra={1} intensity={45} distance={12} color="#0eabfb" />

      <group ref={model} rotation={[0.1, -0.32, 0]}>
        <HeadphonesModel />
      </group>
      <OrbitRings reduceMotion={reduceMotion} />
      <Particles reduceMotion={reduceMotion} />
    </>
  );
}

export default function HeroHeadphones3D() {
  const supported = useMemo(() => hasWebGL(), []);
  const reduceMotion = useMemo(() => prefersReducedMotion(), []);
  const fallback = <Headphones3D />;

  if (!supported) return fallback;

  return (
    <div className="hero-3d">
      <CanvasBoundary fallback={fallback}>
        <Canvas
          dpr={[1, 1.75]}
          camera={{ position: [0, 0, 4.2], fov: 42 }}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
          onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
          aria-hidden="true"
        >
          <Scene reduceMotion={reduceMotion} />
        </Canvas>
      </CanvasBoundary>
      <span className="sr-only">Interactive three-dimensional Sonic Arc headphones. Move your pointer to rotate the object.</span>
    </div>
  );
}
