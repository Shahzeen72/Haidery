import { Canvas, useFrame, type ThreeEvent } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { buildNodes, matchesQuery, type NetworkNode } from "@/lib/network-data";

const CORAL = new THREE.Color("#F2735A");
const SKY = new THREE.Color("#4C8DF6");
const VIOLET = new THREE.Color("#6D5EF5");

function Graph({ query, onMatches }: { query: string; onMatches: (n: number) => void }) {
  const nodes = useMemo(() => buildNodes(90, 3), []);
  const group = useRef<THREE.Group>(null);
  const mesh = useRef<THREE.InstancedMesh>(null);
  const halo = useRef<THREE.InstancedMesh>(null);
  const beams = useRef<THREE.LineSegments>(null);
  const core = useRef<THREE.Mesh>(null);
  const [hover, setHover] = useState<number | null>(null);
  const scales = useRef(new Float32Array(nodes.length).fill(1));
  const beamProgress = useRef(0);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const matched = useMemo(() => nodes.map((n) => matchesQuery(n, query)), [nodes, query]);
  const matchCount = matched.filter(Boolean).length;
  useEffect(() => {
    onMatches(matchCount);
    beamProgress.current = 0;
  }, [matchCount, query, onMatches]);

  const edges = useMemo(() => {
    const pts: number[] = [];
    nodes.forEach((a, i) => {
      const d = nodes
        .map((b, j) => ({ j, d: new THREE.Vector3(...a.position).distanceTo(new THREE.Vector3(...b.position)) }))
        .filter((x) => x.j !== i)
        .sort((x, y) => x.d - y.d)
        .slice(0, 3);
      d.forEach(({ j }) => {
        if (j > i) pts.push(...a.position, ...nodes[j]!.position);
      });
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    return g;
  }, [nodes]);

  const beamGeom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(new Float32Array(nodes.length * 6), 3));
    return g;
  }, [nodes]);

  useEffect(() => {
    nodes.forEach((n, i) => {
      mesh.current?.setColorAt(i, n.community ? CORAL : SKY);
      halo.current?.setColorAt(i, n.community ? CORAL : SKY);
    });
    if (mesh.current?.instanceColor) mesh.current.instanceColor.needsUpdate = true;
    if (halo.current?.instanceColor) halo.current.instanceColor.needsUpdate = true;
  }, [nodes]);

  useFrame((state, raw) => {
    const dt = Math.min(raw, 0.05);
    const t = state.clock.elapsedTime;
    if (group.current) {
      group.current.rotation.y += dt * 0.08;
      const tx = state.pointer.y * 0.25;
      group.current.rotation.x += (tx - group.current.rotation.x) * (1 - Math.exp(-3 * dt));
      group.current.position.y = Math.sin(t * 0.6) * 0.12;
    }
    const sc = scales.current;
    nodes.forEach((n, i) => {
      const target = matched[i] ? 1.6 + Math.sin(t * 5 + i) * 0.15 : hover === i ? 1.4 : 1;
      const cur = sc[i] ?? 1;
      const next = cur + (target - cur) * (1 - Math.exp(-8 * dt));
      sc[i] = next;
      dummy.position.set(...n.position);
      dummy.scale.setScalar(next);
      dummy.updateMatrix();
      mesh.current?.setMatrixAt(i, dummy.matrix);
      dummy.scale.setScalar(next * 2.2);
      dummy.updateMatrix();
      halo.current?.setMatrixAt(i, dummy.matrix);
    });
    if (mesh.current) mesh.current.instanceMatrix.needsUpdate = true;
    if (halo.current) halo.current.instanceMatrix.needsUpdate = true;

    // beams from centre
    beamProgress.current = Math.min(1, beamProgress.current + dt * 1.2);
    const pos = beamGeom.attributes["position"] as THREE.BufferAttribute;
    let k = 0;
    nodes.forEach((n, i) => {
      if (!matched[i]) return;
      const p = beamProgress.current;
      pos.setXYZ(k++, 0, 0, 0);
      pos.setXYZ(k++, n.position[0] * p, n.position[1] * p, n.position[2] * p);
    });
    beamGeom.setDrawRange(0, k);
    pos.needsUpdate = true;
    if (core.current) {
      const s = matchCount ? 1 + Math.sin(t * 4) * 0.12 : 0.001;
      core.current.scale.setScalar(core.current.scale.x + (s - core.current.scale.x) * 0.15);
    }
  });

  const hovered: NetworkNode | null = hover !== null ? (nodes[hover] ?? null) : null;

  return (
    <group ref={group}>
      <lineSegments geometry={edges}>
        <lineBasicMaterial color={VIOLET} transparent opacity={0.3} />
      </lineSegments>
      <lineSegments ref={beams} geometry={beamGeom}>
        <lineBasicMaterial color={VIOLET} transparent opacity={0.9} />
      </lineSegments>
      <instancedMesh
        ref={mesh}
        args={[undefined, undefined, nodes.length]}
        onPointerMove={(e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation();
          setHover(e.instanceId ?? null);
        }}
        onPointerOut={() => setHover(null)}
      >
        <sphereGeometry args={[0.09, 20, 20]} />
        <meshStandardMaterial roughness={0.25} emissive="#ffffff" emissiveIntensity={0.12} />
      </instancedMesh>
      <instancedMesh ref={halo} args={[undefined, undefined, nodes.length]} raycast={() => null}>
        <sphereGeometry args={[0.09, 12, 12]} />
        <meshBasicMaterial transparent opacity={0.12} depthWrite={false} />
      </instancedMesh>
      <mesh ref={core} scale={0.001}>
        <sphereGeometry args={[0.22, 32, 32]} />
        <meshStandardMaterial color={VIOLET} emissive={VIOLET} emissiveIntensity={1.2} />
      </mesh>
      {hovered && (
        <Html position={hovered.position} center distanceFactor={9} style={{ pointerEvents: "none" }}>
          <div className="glass -translate-y-8 whitespace-nowrap px-3 py-2 text-xs">
            <div className="mb-1 font-semibold text-foreground">
              {hovered.community ? "Community member" : "Outside talent"}
            </div>
            <div className="text-muted-foreground">{hovered.skills.join(" · ")}</div>
          </div>
        </Html>
      )}
    </group>
  );
}

export default function Constellation({ query, onMatches }: { query: string; onMatches: (n: number) => void }) {
  const wrap = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    if (!wrap.current) return;
    const io = new IntersectionObserver(([e]) => setVisible(!!e?.isIntersecting));
    io.observe(wrap.current);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={wrap} className="h-full w-full">
      <Canvas
        dpr={[1, 1.75]}
        frameloop={visible ? "always" : "never"}
        camera={{ position: [0, 0, 8.5], fov: 50 }}
        gl={{ alpha: true, antialias: true }}
      >
        <ambientLight intensity={0.9} />
        <directionalLight position={[5, 6, 5]} intensity={1.4} />
        <pointLight position={[0, 0, 0]} intensity={4} color="#6D5EF5" distance={5} />
        <Graph query={query} onMatches={onMatches} />
      </Canvas>
    </div>
  );
}
