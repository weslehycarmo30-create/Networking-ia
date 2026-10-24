import { Canvas, useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type { Mesh } from 'three'
import type { Profile, TerritoryRoom } from '../domain/models'
import ProfilePicker from '../ui/ProfilePicker'

function Marker({ item, active, onSelect }: { item: TerritoryRoom; active: boolean; onSelect: () => void }) {
  const mesh = useRef<Mesh>(null)
  useFrame(({ clock }) => { if (mesh.current) mesh.current.position.y = 0.55 + Math.sin(clock.elapsedTime * 1.5 + item.position[0]) * 0.08 })
  return <group position={item.position}>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}><circleGeometry args={[1.03, 32]} /><meshStandardMaterial color={item.color} transparent opacity={active ? 0.3 : 0.16} /></mesh>
    <mesh ref={mesh} onClick={(event) => { event.stopPropagation(); onSelect() }} onPointerOver={(event) => { event.stopPropagation(); document.body.style.cursor = 'pointer' }} onPointerOut={() => { document.body.style.cursor = 'default' }}>
      <dodecahedronGeometry args={[active ? 0.52 : 0.42, 0]} /><meshStandardMaterial color={item.color} emissive={item.color} emissiveIntensity={0.48} roughness={0.28} metalness={0.55} />
    </mesh>
  </group>
}

function Scene({ rooms, activeId, onSelect, onFailure }: { rooms: TerritoryRoom[]; activeId: string; onSelect: (item: TerritoryRoom) => void; onFailure: () => void }) {
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
    if (monitor.slowWindows >= 2) { monitor.failed = true; onFailure() }
  })
  return <>
    <color attach="background" args={['#111b22']} /><fog attach="fog" args={['#111b22', 13, 25]} />
    <ambientLight intensity={1.3} /><directionalLight position={[4, 8, 3]} intensity={2.2} color="#f7dfbd" /><pointLight position={[-4, 3, -2]} intensity={24} color="#55ddd3" />
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}><circleGeometry args={[7.1, 48]} /><meshStandardMaterial color="#263139" roughness={0.9} /></mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.07, 0]}><ringGeometry args={[1.35, 1.43, 48]} /><meshStandardMaterial color="#bd8f59" emissive="#bd8f59" emissiveIntensity={0.35} /></mesh>
    <mesh position={[0, 0.34, 0]}><cylinderGeometry args={[0.68, 0.85, 0.48, 8]} /><meshStandardMaterial color="#d2c5aa" roughness={0.75} /></mesh>
    <mesh position={[0, 0.72, 0]}><cylinderGeometry args={[0.52, 0.62, 0.28, 8]} /><meshStandardMaterial color="#b88b56" metalness={0.5} roughness={0.35} /></mesh>
    {rooms.map((item) => <Marker key={item.id} item={item} active={item.id === activeId} onSelect={() => onSelect(item)} />)}
  </>
}

export default function City3D(props: { rooms: TerritoryRoom[]; profiles: Profile[]; activeId: string; selectedProfileId?: string; onSelect: (item: TerritoryRoom) => void; onSelectProfile: (profile: Profile) => void; onFailure: () => void }) {
  return <div className="scene-with-profiles"><Canvas camera={{ position: [8, 9, 10], fov: 42 }} dpr={[1, 1.25]} onCreated={({ gl }) => {
    gl.domElement.addEventListener('webglcontextlost', (event) => { event.preventDefault(); props.onFailure() }, { once: true })
  }} gl={{ antialias: false, powerPreference: 'low-power' }}>
    <Scene rooms={props.rooms} activeId={props.activeId} onSelect={props.onSelect} onFailure={props.onFailure} />
  </Canvas><div className="scene-profile-picker"><ProfilePicker profiles={props.profiles} selectedId={props.selectedProfileId} onSelect={props.onSelectProfile} label="Participantes fictícios da praça" /></div></div>
}
