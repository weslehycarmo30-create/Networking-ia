import { Canvas, useFrame } from '@react-three/fiber'
import { useLayoutEffect, useMemo, useRef } from 'react'
import { CylinderGeometry, InstancedMesh, MeshStandardMaterial, Object3D } from 'three'
import type { Profile, TerritoryRoom } from '../domain/models'
import ProfilePicker from '../ui/ProfilePicker'

function PillarRing({ count, radius, height, y, color }: { count: number; radius: number; height: number; y: number; color: string }) {
  const columns = useRef<InstancedMesh>(null)
  const geometry = useMemo(() => new CylinderGeometry(0.105, 0.135, height, 8), [height])
  const material = useMemo(() => new MeshStandardMaterial({ color, roughness: 0.62, metalness: 0.16 }), [color])

  useLayoutEffect(() => {
    if (!columns.current) return
    const transform = new Object3D()
    for (let index = 0; index < count; index += 1) {
      const angle = (index / count) * Math.PI * 2
      transform.position.set(Math.cos(angle) * radius, y, Math.sin(angle) * radius)
      transform.rotation.y = -angle
      transform.updateMatrix()
      columns.current.setMatrixAt(index, transform.matrix)
    }
    columns.current.instanceMatrix.needsUpdate = true
  }, [count, radius, y])

  return <instancedMesh ref={columns} args={[geometry, material, count]} />
}

function ZeusSanctuary() {
  return <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.045, 0]}><circleGeometry args={[1.48, 32]} /><meshStandardMaterial color="#303b3e" roughness={0.8} /></mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}><ringGeometry args={[1.16, 1.42, 32]} /><meshStandardMaterial color="#bd8f59" metalness={0.52} roughness={0.34} /></mesh>
    <mesh position={[0, 0.16, 0]}><cylinderGeometry args={[0.94, 1.04, 0.22, 12]} /><meshStandardMaterial color="#a8a18f" roughness={0.72} /></mesh>
    <mesh position={[0, 0.31, 0]}><cylinderGeometry args={[0.83, 0.9, 0.12, 12]} /><meshStandardMaterial color="#d0c6b0" roughness={0.58} /></mesh>
    <PillarRing count={8} radius={0.69} height={0.84} y={0.78} color="#d2c8b2" />
    <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 1.22, 0]}><torusGeometry args={[0.7, 0.07, 6, 16]} /><meshStandardMaterial color="#b88b56" metalness={0.62} roughness={0.32} /></mesh>
    <mesh position={[0, 1.28, 0]}><cylinderGeometry args={[0.78, 0.78, 0.13, 10]} /><meshStandardMaterial color="#c6bda9" roughness={0.6} /></mesh>
    <mesh position={[0, 1.5, 0]} rotation={[0, Math.PI / 4, 0]}><coneGeometry args={[0.67, 0.34, 4]} /><meshStandardMaterial color="#706958" roughness={0.68} /></mesh>
    <mesh position={[0, 1.89, 0]}><cylinderGeometry args={[0.08, 0.16, 0.48, 6]} /><meshStandardMaterial color="#bd8f59" metalness={0.58} roughness={0.3} /></mesh>
    <mesh position={[0, 2.2, 0]}><octahedronGeometry args={[0.19, 0]} /><meshStandardMaterial color="#75d9d0" emissive="#2d938c" emissiveIntensity={0.9} metalness={0.22} roughness={0.25} /></mesh>
    <mesh position={[0, 2.48, 0]}><coneGeometry args={[0.055, 0.42, 6]} /><meshStandardMaterial color="#75d9d0" emissive="#31978f" emissiveIntensity={0.7} /></mesh>
  </group>
}

function TerritoryLandmark({ room, active, onSelect }: { room: TerritoryRoom; active: boolean; onSelect: () => void }) {
  const pointerEvents = {
    onClick: (event: { stopPropagation: () => void }) => { event.stopPropagation(); onSelect() },
    onPointerOver: () => { document.body.style.cursor = 'pointer' },
    onPointerOut: () => { document.body.style.cursor = 'default' },
  }

  return <group position={room.position} {...pointerEvents}>
    <mesh position={[0, 0.04, 0]}><cylinderGeometry args={[1.02, 1.08, 0.16, 20]} /><meshStandardMaterial color="#364145" roughness={0.83} /></mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.13, 0]}><ringGeometry args={[0.78, 0.98, 24]} /><meshStandardMaterial color={room.color} emissive={room.color} emissiveIntensity={active ? 0.38 : 0.14} roughness={0.44} metalness={0.22} /></mesh>
    {room.id === 'athena' && <>
      <mesh position={[0, 0.28, 0]}><boxGeometry args={[1.08, 0.22, 0.8]} /><meshStandardMaterial color="#c4bda9" roughness={0.66} /></mesh>
      <PillarRing count={4} radius={0.38} height={0.58} y={0.66} color="#d8cfba" />
      <mesh position={[0, 0.98, 0]}><boxGeometry args={[1.18, 0.13, 0.88]} /><meshStandardMaterial color="#a9a18c" roughness={0.62} /></mesh>
      <mesh position={[0, 1.2, 0]} rotation={[0, Math.PI / 4, 0]}><coneGeometry args={[0.54, 0.34, 4]} /><meshStandardMaterial color="#bd8f59" metalness={0.42} roughness={0.42} /></mesh>
      <mesh position={[0, 0.96, 0.49]}><octahedronGeometry args={[0.14, 0]} /><meshStandardMaterial color="#75d9d0" emissive="#4a9f96" emissiveIntensity={0.48} /></mesh>
    </>}
    {room.id === 'hephaestus' && <>
      <mesh position={[0, 0.42, 0]}><boxGeometry args={[0.96, 0.58, 0.75]} /><meshStandardMaterial color="#433d36" roughness={0.86} metalness={0.12} /></mesh>
      <mesh position={[0, 0.42, 0.39]}><boxGeometry args={[0.46, 0.38, 0.035]} /><meshStandardMaterial color="#d3763e" emissive="#a83b1c" emissiveIntensity={1.2} roughness={0.32} /></mesh>
      <mesh position={[0.27, 0.96, -0.12]}><cylinderGeometry args={[0.13, 0.18, 0.6, 7]} /><meshStandardMaterial color="#252d30" roughness={0.78} /></mesh>
      <mesh position={[0, 0.83, 0.25]}><octahedronGeometry args={[0.19, 0]} /><meshStandardMaterial color="#e6a34d" emissive="#d35b25" emissiveIntensity={0.9} metalness={0.34} /></mesh>
    </>}
    {room.id === 'hermes' && <>
      <PillarRing count={6} radius={0.58} height={0.7} y={0.53} color="#c8c0ae" />
      <mesh position={[0, 0.91, 0]}><cylinderGeometry args={[0.78, 0.78, 0.14, 12]} /><meshStandardMaterial color="#586b77" roughness={0.56} metalness={0.28} /></mesh>
      <mesh position={[0, 1.12, 0]}><octahedronGeometry args={[0.22, 0]} /><meshStandardMaterial color="#86b9ff" emissive="#3976bd" emissiveIntensity={0.65} metalness={0.35} /></mesh>
      <mesh position={[0, 1.37, 0]}><coneGeometry args={[0.06, 0.42, 5]} /><meshStandardMaterial color="#86b9ff" emissive="#3976bd" emissiveIntensity={0.55} /></mesh>
    </>}
    {room.id === 'delphi' && <>
      <mesh position={[0, 0.38, 0]}><cylinderGeometry args={[0.36, 0.48, 0.46, 8]} /><meshStandardMaterial color="#88809a" roughness={0.58} /></mesh>
      <mesh position={[0, 0.93, 0]}><octahedronGeometry args={[0.4, 0]} /><meshStandardMaterial color="#c4a7ff" emissive="#6749bd" emissiveIntensity={0.58} metalness={0.28} roughness={0.28} /></mesh>
      <mesh position={[0, 1.33, 0]}><octahedronGeometry args={[0.15, 0]} /><meshStandardMaterial color="#eadfff" emissive="#9b78ed" emissiveIntensity={0.9} /></mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.26, 0]}><torusGeometry args={[0.55, 0.035, 5, 16]} /><meshStandardMaterial color="#c4a7ff" emissive="#6749bd" emissiveIntensity={0.35} /></mesh>
    </>}
    {room.id === 'dionysus' && <>
      {[[-0.42, 0, -0.18], [0.36, 0, -0.2], [0, 0, 0.4]].map(([x, , z], index) => <group key={index} position={[x, 0, z]}>
        <mesh position={[0, 0.32, 0]}><cylinderGeometry args={[0.055, 0.085, 0.42, 6]} /><meshStandardMaterial color="#74674f" roughness={0.88} /></mesh>
        <mesh position={[0, 0.65, 0]}><icosahedronGeometry args={[0.28, 1]} /><meshStandardMaterial color={index === 1 ? '#b36d86' : '#78947b'} emissive={index === 1 ? '#5c263b' : '#263e2b'} emissiveIntensity={0.32} roughness={0.82} /></mesh>
      </group>)}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.22, 0]}><ringGeometry args={[0.48, 0.62, 16]} /><meshStandardMaterial color="#f28fa5" roughness={0.7} /></mesh>
    </>}
    {room.id === 'ares' && <>
      <mesh position={[0, 0.3, 0]}><cylinderGeometry args={[0.72, 0.78, 0.28, 16]} /><meshStandardMaterial color="#58504a" roughness={0.88} /></mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.48, 0]}><torusGeometry args={[0.58, 0.095, 6, 20]} /><meshStandardMaterial color="#bf7667" metalness={0.28} roughness={0.52} /></mesh>
      {[-0.38, 0.38].flatMap((x) => [-0.38, 0.38].map((z) => <mesh key={`${x}-${z}`} position={[x, 0.74, z]}><cylinderGeometry args={[0.08, 0.12, 0.56, 6]} /><meshStandardMaterial color="#c1935e" metalness={0.45} roughness={0.46} /></mesh>))}
      <mesh position={[0, 0.66, 0]}><octahedronGeometry args={[0.17, 0]} /><meshStandardMaterial color="#ff8176" emissive="#a8332e" emissiveIntensity={0.62} /></mesh>
    </>}
  </group>
}

function RadialPath({ room }: { room: TerritoryRoom }) {
  const angle = Math.atan2(room.position[2], room.position[0])
  const radius = 2.12
  return <mesh position={[Math.cos(angle) * radius, -0.008, Math.sin(angle) * radius]} rotation={[0, -angle, 0]}>
    <boxGeometry args={[1.42, 0.018, 0.055]} />
    <meshStandardMaterial color="#a78a65" transparent opacity={0.42} roughness={0.8} />
  </mesh>
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
    <color attach="background" args={['#111b22']} /><fog attach="fog" args={['#111b22', 14, 27]} />
    <ambientLight intensity={1.05} /><directionalLight position={[4, 9, 3]} intensity={1.9} color="#f1dec1" /><pointLight position={[0, 3.3, 0]} intensity={7} distance={9} color="#55cfc5" />
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}><circleGeometry args={[7.1, 40]} /><meshStandardMaterial color="#263139" roughness={0.9} /></mesh>
    {rooms.map((room) => <RadialPath key={`path-${room.id}`} room={room} />)}
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.055, 0]}><ringGeometry args={[1.36, 1.43, 32]} /><meshStandardMaterial color="#bd8f59" emissive="#76542f" emissiveIntensity={0.28} roughness={0.42} metalness={0.5} /></mesh>
    <ZeusSanctuary />
    {rooms.map((room) => <TerritoryLandmark key={room.id} room={room} active={room.id === activeId} onSelect={() => onSelect(room)} />)}
  </>
}

export default function City3D(props: { rooms: TerritoryRoom[]; profiles: Profile[]; activeId: string; selectedProfileId?: string; onSelect: (item: TerritoryRoom) => void; onSelectProfile: (profile: Profile) => void; onFailure: () => void }) {
  return <div className="scene-with-profiles"><Canvas camera={{ position: [8, 9, 10], fov: 42 }} dpr={[1, 1.15]} onCreated={({ gl }) => {
    gl.domElement.addEventListener('webglcontextlost', (event) => { event.preventDefault(); props.onFailure() }, { once: true })
  }} gl={{ antialias: false, powerPreference: 'low-power' }}>
    <Scene rooms={props.rooms} activeId={props.activeId} onSelect={props.onSelect} onFailure={props.onFailure} />
  </Canvas><div className="scene-profile-picker"><ProfilePicker profiles={props.profiles} selectedId={props.selectedProfileId} onSelect={props.onSelectProfile} label="Participantes fictícios da praça" /></div></div>
}
