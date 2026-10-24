import { Canvas, useFrame } from '@react-three/fiber'
import { Html, OrbitControls } from '@react-three/drei'
import { useRef } from 'react'
import type { Mesh } from 'three'
import { territories, type Territory } from '../data/territories'

function Marker({ item, active, onSelect }: { item: Territory; active: boolean; onSelect: () => void }) {
  const mesh = useRef<Mesh>(null)
  useFrame(({ clock }) => { if (mesh.current) mesh.current.position.y = 0.55 + Math.sin(clock.elapsedTime * 1.5 + item.position[0]) * 0.08 })
  return <group position={item.position}>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}><circleGeometry args={[1.03, 40]} /><meshStandardMaterial color={item.color} transparent opacity={active ? 0.3 : 0.16} /></mesh>
    <mesh ref={mesh} onClick={(event) => { event.stopPropagation(); onSelect() }} onPointerOver={(event) => { event.stopPropagation(); document.body.style.cursor = 'pointer' }} onPointerOut={() => { document.body.style.cursor = 'default' }}>
      <dodecahedronGeometry args={[active ? 0.52 : 0.42, 0]} /><meshStandardMaterial color={item.color} emissive={item.color} emissiveIntensity={0.48} roughness={0.28} metalness={0.55} />
      <Html distanceFactor={10} position={[0, 0.85, 0]} center><button className={`map-label ${active ? 'active' : ''}`} onClick={(event) => { event.stopPropagation(); onSelect() }}>{item.name}<small>{item.domain}</small></button></Html>
    </mesh>
  </group>
}

function Scene({ activeId, onSelect, onFailure }: { activeId: string; onSelect: (item: Territory) => void; onFailure: () => void }) {
  const performanceWindow = useRef({ elapsed: 0, frames: 0, slowWindows: 0, failed: false })
  useFrame((_, delta) => {
    const monitor = performanceWindow.current
    if (monitor.failed) return
    monitor.elapsed += delta
    monitor.frames += 1
    if (monitor.elapsed < 1.5) return
    const fps = monitor.frames / monitor.elapsed
    monitor.slowWindows = fps < 20 ? monitor.slowWindows + 1 : 0
    monitor.elapsed = 0
    monitor.frames = 0
    if (monitor.slowWindows >= 2) {
      monitor.failed = true
      onFailure()
    }
  })
  return <>
    <color attach="background" args={['#111b22']} />
    <fog attach="fog" args={['#111b22', 13, 25]} />
    <ambientLight intensity={1.3} /><directionalLight position={[4, 8, 3]} intensity={2.2} color="#f7dfbd" /><pointLight position={[-4, 3, -2]} intensity={24} color="#55ddd3" />
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}><circleGeometry args={[7.1, 64]} /><meshStandardMaterial color="#263139" roughness={0.9} /></mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.07, 0]}><ringGeometry args={[1.35, 1.43, 64]} /><meshStandardMaterial color="#bd8f59" emissive="#bd8f59" emissiveIntensity={0.35} /></mesh>
    <mesh position={[0, 0.34, 0]}><cylinderGeometry args={[0.68, 0.85, 0.48, 8]} /><meshStandardMaterial color="#d2c5aa" roughness={0.75} /></mesh>
    <mesh position={[0, 0.72, 0]}><cylinderGeometry args={[0.52, 0.62, 0.28, 8]} /><meshStandardMaterial color="#b88b56" metalness={0.5} roughness={0.35} /></mesh>
    {territories.map((item) => <Marker key={item.id} item={item} active={item.id === activeId} onSelect={() => onSelect(item)} />)}
    <OrbitControls enablePan={false} minDistance={8} maxDistance={16} maxPolarAngle={Math.PI / 2.08} />
  </>
}

export default function City3D(props: { activeId: string; onSelect: (item: Territory) => void; onFailure: () => void }) {
  return <Canvas camera={{ position: [8, 9, 10], fov: 42 }} dpr={[1, 1.5]} onCreated={({ gl }) => {
    gl.domElement.addEventListener('webglcontextlost', (event) => { event.preventDefault(); props.onFailure() }, { once: true })
  }} gl={{ antialias: true, powerPreference: 'low-power' }}>
    <Scene activeId={props.activeId} onSelect={props.onSelect} onFailure={props.onFailure} />
  </Canvas>
}
