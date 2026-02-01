import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text, OrbitControls, Float, Line } from '@react-three/drei';
import * as THREE from 'three';
import { MindMapNode } from '@/types';

interface NodePosition {
  node: MindMapNode;
  position: [number, number, number];
  level: number;
  index: number;
  parentPosition?: [number, number, number];
}

// Calculate 3D positions for all nodes
const calculatePositions = (
  node: MindMapNode,
  level: number = 0,
  index: number = 0,
  parentPosition?: [number, number, number],
  angleOffset: number = 0,
  totalSiblings: number = 1
): NodePosition[] => {
  const positions: NodePosition[] = [];
  
  let position: [number, number, number];
  
  if (level === 0) {
    position = [0, 0, 0];
  } else {
    const radius = level * 4;
    const angleSpread = Math.PI * 1.5;
    const startAngle = -angleSpread / 2;
    const angleStep = totalSiblings > 1 ? angleSpread / (totalSiblings - 1) : 0;
    const angle = startAngle + angleStep * index + angleOffset;
    
    const x = Math.sin(angle) * radius;
    const z = Math.cos(angle) * radius;
    const y = level * 1.5 - 2;
    
    position = [x, y, z];
  }
  
  positions.push({ node, position, level, index, parentPosition });
  
  if (node.children && node.children.length > 0) {
    node.children.forEach((child, i) => {
      const childPositions = calculatePositions(
        child,
        level + 1,
        i,
        position,
        angleOffset + (i - (node.children!.length - 1) / 2) * 0.3,
        node.children!.length
      );
      positions.push(...childPositions);
    });
  }
  
  return positions;
};

// Individual 3D node
const Node3D: React.FC<{
  nodeData: NodePosition;
  colors: string[];
}> = ({ nodeData, colors }) => {
  const groupRef = useRef<THREE.Group>(null);
  const { node, position, level, index } = nodeData;
  
  const color = level === 0 ? colors[0] : colors[(index % 4) + 1];
  const scale = level === 0 ? 1.3 : 1 - level * 0.1;
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5 + index) * 0.05;
    }
  });
  
  return (
    <Float
      speed={2}
      rotationIntensity={0.1}
      floatIntensity={0.3}
      position={position}
    >
      <group ref={groupRef} scale={scale}>
        {/* Node sphere */}
        <mesh>
          <sphereGeometry args={[0.6, 32, 32]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={0.2}
            roughness={0.3}
            metalness={0.1}
          />
        </mesh>
        
        {/* Glow effect */}
        <mesh>
          <sphereGeometry args={[0.7, 32, 32]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.15}
          />
        </mesh>
        
        {/* Label */}
        <Text
          position={[0, 1.0, 0]}
          fontSize={0.35}
          color="white"
          anchorX="center"
          anchorY="middle"
          maxWidth={3}
          textAlign="center"
          outlineWidth={0.03}
          outlineColor="#000000"
        >
          {node.label}
        </Text>
      </group>
    </Float>
  );
};

// Connection lines between nodes
const ConnectionLine: React.FC<{
  start: [number, number, number];
  end: [number, number, number];
}> = ({ start, end }) => {
  const points = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(...start),
      new THREE.Vector3(
        (start[0] + end[0]) / 2,
        (start[1] + end[1]) / 2 + 0.5,
        (start[2] + end[2]) / 2
      ),
      new THREE.Vector3(...end),
    ]);
    return curve.getPoints(20);
  }, [start, end]);
  
  return (
    <Line
      points={points}
      color="#8b5cf6"
      lineWidth={2}
      transparent
      opacity={0.6}
    />
  );
};

// Main 3D scene
const Scene: React.FC<{ mindMap: MindMapNode }> = ({ mindMap }) => {
  const positions = useMemo(() => calculatePositions(mindMap), [mindMap]);
  
  const colors = ['#8b5cf6', '#06b6d4', '#22c55e', '#f59e0b', '#ec4899'];
  
  return (
    <>
      {/* Ambient light */}
      <ambientLight intensity={0.4} />
      
      {/* Main lights */}
      <pointLight position={[10, 10, 10]} intensity={1} color="#ffffff" />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#8b5cf6" />
      <pointLight position={[0, 10, -10]} intensity={0.5} color="#06b6d4" />
      
      {/* Connection lines */}
      {positions
        .filter((p) => p.parentPosition)
        .map((nodePos, i) => (
          <ConnectionLine
            key={`line-${i}`}
            start={nodePos.parentPosition!}
            end={nodePos.position}
          />
        ))}
      
      {/* Nodes */}
      {positions.map((nodePos, i) => (
        <Node3D key={nodePos.node.id} nodeData={nodePos} colors={colors} />
      ))}
      
      {/* Orbit controls */}
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        autoRotate={true}
        autoRotateSpeed={0.5}
        minDistance={5}
        maxDistance={30}
      />
    </>
  );
};

// Main component
const MindMap3D: React.FC<{ mindMap: MindMapNode }> = ({ mindMap }) => {
  return (
    <div className="w-full h-[500px] rounded-xl overflow-hidden bg-gradient-to-b from-slate-900 to-slate-800">
      <Canvas
        camera={{ position: [0, 5, 15], fov: 50 }}
        gl={{ antialias: true }}
      >
        <fog attach="fog" args={['#1e293b', 10, 40]} />
        <Scene mindMap={mindMap} />
      </Canvas>
      
      {/* Instructions overlay */}
      <div className="absolute bottom-4 left-4 text-xs text-white/60 bg-black/30 px-3 py-2 rounded-lg backdrop-blur-sm">
        <span>🖱️ Drag to rotate • Scroll to zoom • Right-click to pan</span>
      </div>
    </div>
  );
};

export default MindMap3D;
