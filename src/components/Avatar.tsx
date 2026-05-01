import { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Float, MeshDistortMaterial, MeshWobbleMaterial, Sparkles } from '@react-three/drei';
import * as THREE from 'three';

function RobotHead() {
  const headRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (headRef.current) {
        // Subtle floating motion
        headRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.2;
        headRef.current.position.y = Math.sin(state.clock.elapsedTime) * 0.1;
    }
  });

  return (
    <group ref={headRef} onPointerOver={() => setHovered(true)} onPointerOut={() => setHovered(false)}>
      {/* Main Head Module */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[1.5, 1.2, 1.2]} />
        <meshPhysicalMaterial 
            color="#1a1a1a" 
            metalness={0.8} 
            roughness={0.2} 
            emissive="#00f2ff" 
            emissiveIntensity={hovered ? 0.3 : 0.1}
        />
      </mesh>

      {/* Eyes / Visor */}
      <mesh position={[0, 0.2, 0.61]}>
        <planeGeometry args={[1.2, 0.3]} />
        <meshStandardMaterial 
            color="#00f2ff" 
            emissive="#00f2ff" 
            emissiveIntensity={5} 
        />
      </mesh>

      {/* Side Sensors */}
      <mesh position={[0.8, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.3, 0.3, 0.2, 32]} />
        <meshStandardMaterial color="#333" metalness={1} />
      </mesh>
      <mesh position={[-0.8, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.3, 0.3, 0.2, 32]} />
        <meshStandardMaterial color="#333" metalness={1} />
      </mesh>

      {/* Antenna */}
      <mesh position={[0, 0.7, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.5, 8]} />
        <meshStandardMaterial color="#555" />
      </mesh>
      <mesh position={[0, 0.95, 0]}>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshStandardMaterial color="#00f2ff" emissive="#00f2ff" emissiveIntensity={2} />
      </mesh>

      {/* Floating particles around head */}
      <Sparkles count={40} scale={2} size={2} speed={0.4} color="#00f2ff" />
    </group>
  );
}

export default function Avatar() {
  return (
    <div className="w-full h-full cursor-grab active:cursor-grabbing">
      <Canvas camera={{ position: [0, 0, 4], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} color="#00f2ff" />
        <spotLight position={[-10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
        
        <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
          <RobotHead />
        </Float>

        <OrbitControls 
            enableZoom={false} 
            enablePan={false}
            minPolarAngle={Math.PI / 2.5}
            maxPolarAngle={Math.PI / 1.5}
        />
      </Canvas>
    </div>
  );
}
