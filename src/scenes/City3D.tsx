import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { CanvasTexture, CylinderGeometry, InstancedMesh, MeshStandardMaterial, Object3D, SRGBColorSpace } from 'three'
import type { Avatar, Profile, TerritoryRoom } from '../domain/models'
import ProfilePicker from '../ui/ProfilePicker'

const avatarAccents: Record<string, string> = {
  explorer: '#75d9d0', botanist: '#86b58a', builder: '#e6a34d',
  creative: '#c4a7ff', observer: '#86b9ff', solar: '#ffd16f',
}

function AvatarEmblem({ emoji }: { emoji: string }) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 128
    canvas.height = 128
    const context = canvas.getContext('2d')
    if (!context) return null
    context.clearRect(0, 0, 128, 128)
    context.font = '88px Arial'
    context.textAlign = 'center'
    context.textBaseline = 'middle'
    context.fillText(emoji, 64, 68)
    const nextTexture = new CanvasTexture(canvas)
    nextTexture.colorSpace = SRGBColorSpace
    return nextTexture
  }, [emoji])

  useEffect(() => () => texture?.dispose(), [texture])
  if (!texture) return null
  return <mesh position={[-0.39, 0.54, 0.205]}><planeGeometry args={[0.2, 0.2]} /><meshBasicMaterial map={texture} transparent toneMapped={false} depthWrite={false} /></mesh>
}

function SpartanAvatar({ avatar }: { avatar: Avatar }) {
  const accent = avatarAccents[avatar.id] ?? '#75d9d0'
  return <group position={[1.12, 0, 0.46]} rotation={[0, Math.PI / 4, 0]}>
    <mesh position={[0, 0.06, 0]}><cylinderGeometry args={[0.34, 0.4, 0.12, 12]} /><meshStandardMaterial color="#303b3e" metalness={0.38} roughness={0.64} /></mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.125, 0]}><torusGeometry args={[0.32, 0.025, 5, 16]} /><meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.2} metalness={0.5} roughness={0.38} /></mesh>
    <mesh position={[0, 0.39, 0]}><cylinderGeometry args={[0.2, 0.28, 0.38, 8]} /><meshStandardMaterial color="#8b7658" metalness={0.38} roughness={0.62} /></mesh>
    <mesh position={[0, 0.69, 0]}><cylinderGeometry args={[0.22, 0.3, 0.42, 8]} /><meshStandardMaterial color="#c1935e" metalness={0.55} roughness={0.4} /></mesh>
    <mesh position={[-0.24, 0.78, 0]}><sphereGeometry args={[0.13, 8, 6]} /><meshStandardMaterial color="#b58b58" metalness={0.45} roughness={0.46} /></mesh>
    <mesh position={[0.24, 0.78, 0]}><sphereGeometry args={[0.13, 8, 6]} /><meshStandardMaterial color="#b58b58" metalness={0.45} roughness={0.46} /></mesh>
    <mesh position={[0, 1.01, 0.015]}><sphereGeometry args={[0.19, 10, 8]} /><meshStandardMaterial color="#b99d7e" roughness={0.82} /></mesh>
    <mesh position={[0, 1.02, 0]}><sphereGeometry args={[0.23, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color="#d0b17a" metalness={0.58} roughness={0.34} /></mesh>
    <mesh position={[0, 1.01, 0.19]}><boxGeometry args={[0.48, 0.075, 0.09]} /><meshStandardMaterial color="#bd8f59" metalness={0.62} roughness={0.32} /></mesh>
    <mesh position={[-0.18, 0.86, 0.08]} rotation={[0, 0, -0.16]}><boxGeometry args={[0.11, 0.25, 0.16]} /><meshStandardMaterial color="#bd8f59" metalness={0.54} roughness={0.4} /></mesh>
    <mesh position={[0.18, 0.86, 0.08]} rotation={[0, 0, 0.16]}><boxGeometry args={[0.11, 0.25, 0.16]} /><meshStandardMaterial color="#bd8f59" metalness={0.54} roughness={0.4} /></mesh>
    <mesh position={[0, 1.34, -0.025]} rotation={[0, 0, -0.08]}><coneGeometry args={[0.16, 0.38, 5]} /><meshStandardMaterial color="#a94f42" roughness={0.7} /></mesh>
    <group position={[-0.39, 0.54, 0.13]} rotation={[Math.PI / 2, 0, 0]}>
      <mesh><cylinderGeometry args={[0.23, 0.23, 0.075, 8]} /><meshStandardMaterial color={accent} metalness={0.62} roughness={0.34} /></mesh>
    </group>
    <AvatarEmblem emoji={avatar.emoji} />
  </group>
}

function CameraOrbit({ azimuth, elevation }: { azimuth: number; elevation: number }) {
  const camera = useThree((state) => state.camera)
  useLayoutEffect(() => {
    const distance = 16
    const horizontalDistance = Math.sin(elevation) * distance
    camera.position.set(Math.sin(azimuth) * horizontalDistance, Math.cos(elevation) * distance, Math.cos(azimuth) * horizontalDistance)
    camera.lookAt(0, 0.45, 0)
  }, [azimuth, camera, elevation])
  return null
}

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
    <boxGeometry args={[1.42, 0.024, 0.075]} />
    <meshStandardMaterial color="#b19368" emissive="#8d7046" emissiveIntensity={0.12} transparent opacity={0.58} roughness={0.8} />
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

export default function City3D(props: { rooms: TerritoryRoom[]; profiles: Profile[]; avatar: Avatar; activeId: string; selectedProfileId?: string; onSelect: (item: TerritoryRoom) => void; onSelectProfile: (profile: Profile) => void; onFailure: () => void }) {
  const [azimuth, setAzimuth] = useState(0.675)
  const [elevation, setElevation] = useState(0.96)

  function turnCamera(step: number) {
    setAzimuth((current) => current + step * Math.PI / 8)
  }

  function tiltCamera(step: number) {
    setElevation((current) => Math.max(0.72, Math.min(1.2, current + step * 0.08)))
  }

  function handleCameraKeys(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'ArrowLeft') turnCamera(-1)
    else if (event.key === 'ArrowRight') turnCamera(1)
    else if (event.key === 'ArrowUp') tiltCamera(-1)
    else if (event.key === 'ArrowDown') tiltCamera(1)
    else return
    event.preventDefault()
  }

  return <div className="scene-with-profiles"><Canvas camera={{ position: [8, 9, 10], fov: 42 }} dpr={[1, 1.15]} onCreated={({ gl }) => {
    gl.domElement.addEventListener('webglcontextlost', (event) => { event.preventDefault(); props.onFailure() }, { once: true })
  }} gl={{ antialias: false, powerPreference: 'low-power' }}>
    <CameraOrbit azimuth={azimuth} elevation={elevation} />
    <Scene rooms={props.rooms} activeId={props.activeId} onSelect={props.onSelect} onFailure={props.onFailure} />
    <SpartanAvatar avatar={props.avatar} />
  </Canvas>
  <div className="scene-camera-controls" role="group" aria-label="Controles da câmera da praça 3D" aria-describedby="scene-camera-help" aria-keyshortcuts="ArrowLeft ArrowRight ArrowUp ArrowDown" onKeyDown={handleCameraKeys}>
    <div className="scene-camera-buttons">
      <button type="button" aria-label="Inclinar câmera para cima" onClick={() => tiltCamera(-1)}>↑</button>
      <button type="button" aria-label="Girar câmera para a esquerda" onClick={() => turnCamera(-1)}>←</button>
      <button type="button" aria-label="Inclinar câmera para baixo" onClick={() => tiltCamera(1)}>↓</button>
      <button type="button" aria-label="Girar câmera para a direita" onClick={() => turnCamera(1)}>→</button>
    </div>
    <small id="scene-camera-help">Foque um controle; use ← → para girar e ↑ ↓ para inclinar.</small>
  </div>
  <div className="scene-profile-picker"><ProfilePicker profiles={props.profiles} selectedId={props.selectedProfileId} onSelect={props.onSelectProfile} label="Participantes fictícios da praça" /></div>
  <span className="sr-only">Representação espartana do seu avatar: {props.avatar.label} {props.avatar.emoji}.</span>
  </div>
}
