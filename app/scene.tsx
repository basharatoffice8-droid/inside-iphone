'use client';
import { useEffect, useRef } from 'react';
import * as T from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { BokehPass } from 'three/examples/jsm/postprocessing/BokehPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { buildPhone } from './phone-model';
import { parts } from './parts';
import { frameDelta } from './motion';
type Props = {
  explode: number;
  selected: string | null;
  isolated: boolean;
  color: string;
  rotating: boolean;
  view: number;
  zoom: number;
  step: number;
  playing: boolean;
  labels: boolean;
  onSelect: (id: string) => void;
  onReady: () => void;
  onError: (s: string) => void;
};
const vec = (x = 0, y = 0, z = 0) => new T.Vector3(x, y, z);
export default function Scene(props: Props) {
  const el = useRef<HTMLDivElement>(null),
    latest = useRef(props);
  latest.current = props;
  useEffect(() => {
    if (!el.current) return;
    const host = el.current;
    let renderer: T.WebGLRenderer;
    try {
      renderer = new T.WebGLRenderer({
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
      });
    } catch {
      latest.current.onError(
        '3D could not start. Enable browser hardware acceleration and reload.',
      );
      return;
    }
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
    renderer.outputColorSpace = T.SRGBColorSpace;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.98;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = T.PCFSoftShadowMap;
    renderer.shadowMap.autoUpdate = false;
    host.appendChild(renderer.domElement);
    renderer.domElement.setAttribute(
      'aria-label',
      'Interactive iPhone 17 Pro model. Drag to rotate. Scroll to zoom.',
    );
    const scene = new T.Scene();
    scene.background = new T.Color('#0a0d11');
    scene.fog = new T.Fog('#0a0d11', 22, 48);
    const camera = new T.PerspectiveCamera(32, 1, 0.05, 100);
    camera.position.set(0, 0.7, 13);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.075;
    controls.enablePan = false;
    controls.minDistance = 1.2;
    controls.maxDistance = 45;
    const pmrem = new T.PMREMGenerator(renderer),
      room = new RoomEnvironment();
    const env = pmrem.fromScene(room, 0.035);
    scene.environment = env.texture;
    room.dispose();
    pmrem.dispose();
    scene.environmentIntensity = 0.9;
    const key = new T.DirectionalLight('#fff5eb', 2.2);
    key.position.set(-3, 7, 5);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    Object.assign(key.shadow.camera, {
      left: -9,
      right: 9,
      top: 9,
      bottom: -9,
      near: 0.1,
      far: 30,
    });
    key.shadow.normalBias = 0.015;
    key.shadow.bias = -0.0003;
    scene.add(key);
    const rim = new T.DirectionalLight('#c7d9f0', 2.6);
    rim.position.set(5, 2, -4);
    scene.add(rim);
    const fill = new T.DirectionalLight('#edf3ff', 1.0);
    fill.position.set(-5, -1, 4);
    scene.add(fill);
    scene.add(new T.HemisphereLight('#dce8f7', '#20242a', 0.6));
    let dirty = true,
      frameId = 0,
      cancelled = false,
      framing = 2,
      last = '',
      seenZoom = props.zoom,
      shownPhoto = false,
      flowTime = 0;
    const phone = buildPhone(() => {
      dirty = true;
      framing = Math.max(framing, 1);
    });
    scene.add(phone.root);
    phone.root.rotation.set(-0.12, -0.5, 0);
    const orientationGoal = vec(-0.12, -0.5, 0);
    const floorMaterial = new T.MeshStandardMaterial({
      color: '#060a10',
      roughness: 1,
      metalness: 0,
      transparent: true,
    });
    const floorGeo = new T.PlaneGeometry(150, 150),
      floor = new T.Mesh(floorGeo, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -3.035;
    floor.receiveShadow = true;
    scene.add(floor);
    // A narrow display base grounds the phone while leaving the silhouette unobstructed.
    const baseGeo = new T.CylinderGeometry(2.25, 2.28, 0.065, 100),
      baseMaterial = new T.MeshStandardMaterial({
        color: '#242e39',
        roughness: 0.4,
        metalness: 0.5,
        transparent: true,
      }),
      base = new T.Mesh(baseGeo, baseMaterial);
    base.position.y = -3.075;
    base.receiveShadow = true;
    scene.add(base);
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const dof = new BokehPass(scene, camera, {
      focus: 13,
      aperture: 0.000025,
      maxblur: 0.003,
    });
    composer.addPass(dof);
    composer.addPass(new OutputPass());
    const lineMaterial = new T.LineBasicMaterial({
      color: '#dfc595',
      transparent: true,
      opacity: 0.75,
      depthTest: false,
    });
    const lightGeometry = new T.BufferGeometry(),
      lightPath = new T.Line(lightGeometry, lineMaterial);
    lightPath.renderOrder = 10;
    scene.add(lightPath);
    const dotGeometry = new T.SphereGeometry(0.024, 10, 10),
      dotMaterial = new T.MeshBasicMaterial({
        color: '#fff2ce',
        toneMapped: false,
        depthTest: false,
      }),
      dots = Array.from({ length: 12 }, () => {
        const o = new T.Mesh(dotGeometry, dotMaterial);
        o.renderOrder = 11;
        scene.add(o);
        return o;
      });
    const markers = phone.assemblies.map((a) => {
      const b = document.createElement('button');
      b.className = 'scene-marker';
      b.textContent = parts.find((p) => p.id === a.id)?.name || a.id;
      b.setAttribute('aria-label', 'Inspect ' + b.textContent);
      b.addEventListener('click', () => latest.current.onSelect(a.id));
      host.appendChild(b);
      return { a, b };
    });
    const targetPosition = vec(),
      wantedCamera = vec(0, 0.7, 13),
      box = new T.Box3(),
      size = vec(),
      center = vec(),
      direction = vec(),
      world = vec();
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let amount = 0,
      prev = performance.now(),
      fitTime = 0,
      lastView = props.view,
      wasIsolated = false,
      lastStep = -1;
    const resize = () => {
      const w = host.clientWidth,
        h = host.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h);
      composer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      dirty = true;
      framing = 1;
    };
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    resize();
    controls.addEventListener('change', () => {
      dirty = true;
    });
    controls.addEventListener('start', () => {
      framing = 0;
    });
    const pointer = new T.Vector2(),
      ray = new T.Raycaster();
    let down = { x: 0, y: 0 };
    const onDown = (e: PointerEvent) => {
        down = { x: e.clientX, y: e.clientY };
      },
      onUp = (e: PointerEvent) => {
        if (Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6) return;
        const r = renderer.domElement.getBoundingClientRect();
        pointer.set(
          ((e.clientX - r.left) / r.width) * 2 - 1,
          (-(e.clientY - r.top) / r.height) * 2 + 1,
        );
        ray.setFromCamera(pointer, camera);
        for (const h of ray.intersectObjects(phone.pickables, false)) {
          let node: T.Object3D | null = h.object,
            visible = true,
            id = '';
          while (node) {
            visible = visible && node.visible;
            if (node.userData.part) id = node.userData.part;
            node = node.parent;
          }
          if (visible && id) {
            latest.current.onSelect(id);
            break;
          }
        }
      };
    renderer.domElement.addEventListener('pointerdown', onDown);
    renderer.domElement.addEventListener('pointerup', onUp);
    const contextLost = (e: Event) => {
      e.preventDefault();
      latest.current.onError(
        'The graphics context was interrupted. Reload to restore the studio.',
      );
    };
    renderer.domElement.addEventListener('webglcontextlost', contextLost);
    function fit(p: Props) {
      box.makeEmpty();
      phone.root.updateMatrixWorld(true);
      for (const a of phone.assemblies)
        if (a.node.visible) box.expandByObject(a.node);
      if (box.isEmpty()) return;
      box.getSize(size);
      box.getCenter(center);
      const height = Math.max(size.y, size.x / camera.aspect),
        distance =
          (height / 2 / Math.tan(T.MathUtils.degToRad(camera.fov / 2))) * 1.17 +
          size.z * 0.4;
      targetPosition.copy(center);
      if (p.isolated) {
        direction.set(0.25, 0.12, 1).normalize();
      } else {
        direction.copy(camera.position).sub(controls.target).normalize();
        if (direction.length() < 0.1) direction.set(0, 0.06, 1);
      }
      wantedCamera
        .copy(center)
        .addScaledVector(
          direction,
          Math.max(1.8, distance) * Math.pow(0.85, p.zoom),
        );
    }
    function tick(now: number) {
      frameId = requestAnimationFrame(tick);
      const dt = frameDelta(now, prev);
      prev = now;
      if (document.hidden) return;
      const p = latest.current;
      const state = JSON.stringify([
        p.explode,
        p.selected,
        p.isolated,
        p.color,
        p.view,
        p.zoom,
        p.step,
        p.labels,
        p.playing,
      ]);
      if (state !== last) {
        last = state;
        dirty = true;
        framing = 1.35;
        const colors =
          p.color === 'silver'
            ? ['#b1b9c3', '#a5adb7', '#c5ced8']
            : p.color === 'orange'
              ? ['#b86632', '#cd9b79', '#d0935c']
              : ['#26384e', '#425064', '#52657c'];
        phone.materials.metal.color.set(colors[0]);
        phone.materials.rear.color.set(colors[1]);
        phone.materials.polished.color.set(colors[2]);
        phone.materials.logoMat.color.set(
          p.color === 'silver'
            ? '#787f88'
            : p.color === 'orange'
              ? '#a77755'
              : '#71859d',
        );
        if (
          lastView !== p.view ||
          wasIsolated !== p.isolated ||
          lastStep !== p.step
        ) {
          lastView = p.view;
          wasIsolated = p.isolated;
          lastStep = p.step;
          orientationGoal.set(
            p.isolated ? -0.07 : -0.12,
            p.step === 4 || p.view % 2
              ? Math.PI + 0.38
              : p.isolated
                ? -0.12
                : -0.5,
            0,
          );
          camera.position.copy(controls.target).add(vec(0, 0.5, 13));
        }
        seenZoom = p.zoom;
        if (shownPhoto !== (p.step === 4)) {
          shownPhoto = p.step === 4;
          phone.drawScreen(shownPhoto);
        }
      }
      const target = p.isolated ? 1 : p.explode;
      const damp = reduced ? 1 : 1 - Math.exp(-dt * 6);
      if (Math.abs(amount - target) > 0.0001) {
        amount = T.MathUtils.lerp(amount, target, damp);
        dirty = true;
        framing = Math.max(framing, 0.85);
      }
      const shell = T.MathUtils.smoothstep(amount, 0, 0.25),
        systems = T.MathUtils.smoothstep(amount, 0.22, 0.56),
        spread = T.MathUtils.smoothstep(amount, 0.56, 0.84),
        detail = T.MathUtils.smoothstep(amount, 0.8, 1);
      for (const a of phone.assemblies) {
        a.node.visible = p.isolated
          ? p.selected === a.id
          : amount > 0.06 ||
            ['frame', 'back', 'display', 'camera', 'telephoto'].includes(a.id);
        const exterior = ['frame', 'back', 'display'].includes(a.id);
        const desired = a.home
          .clone()
          .lerp(a.opened, exterior ? shell : systems)
          .lerp(a.overview, spread);
        if (p.isolated) desired.set(0, 0, 0);
        if (a.node.position.distanceToSquared(desired) > 1e-7) {
          a.node.position.lerp(desired, damp);
          dirty = true;
          framing = Math.max(framing, 0.85);
        }
        // The display turns toward the viewer only after the enclosure has opened.
        const displayRotation =
          a.id === 'display' && !p.isolated ? Math.PI * spread : 0;
        if (Math.abs(a.node.rotation.y - displayRotation) > 0.001) {
          a.node.rotation.y = T.MathUtils.lerp(
            a.node.rotation.y,
            displayRotation,
            damp,
          );
          dirty = true;
        }
        for (const piece of a.pieces) {
          const d = piece.home
            .clone()
            .addScaledVector(piece.offset, detail * (p.isolated ? 1.25 : 1));
          if (piece.node.position.distanceToSquared(d) > 1e-7) {
            piece.node.position.lerp(d, damp);
            dirty = true;
            framing = Math.max(framing, 0.85);
          }
        }
      }
      if (p.rotating && !reduced) {
        phone.root.rotation.y += dt * 0.13;
        orientationGoal.y = phone.root.rotation.y;
        dirty = true;
      } else {
        const yaw = Math.atan2(
          Math.sin(orientationGoal.y - phone.root.rotation.y),
          Math.cos(orientationGoal.y - phone.root.rotation.y),
        );
        if (
          Math.abs(yaw) > 0.001 ||
          Math.abs(phone.root.rotation.x - orientationGoal.x) > 0.001
        ) {
          phone.root.rotation.y += yaw * damp;
          phone.root.rotation.x = T.MathUtils.lerp(
            phone.root.rotation.x,
            orientationGoal.x,
            damp,
          );
          dirty = true;
          framing = Math.max(framing, 0.7);
        }
      }
      floor.visible = base.visible = !p.isolated && amount < 0.57;
      floorMaterial.opacity = baseMaterial.opacity =
        1 - T.MathUtils.smoothstep(amount, 0.3, 0.56);
      const photoActive = p.step >= 0 && p.step < 4;
      lightPath.visible = photoActive;
      dots.forEach((d) => (d.visible = photoActive));
      if (photoActive) {
        if (p.playing && !reduced) flowTime += dt;
        const a = phone.assemblies.find((a) => a.id === p.selected)!;
        a.node.updateWorldMatrix(true, true);
        let pts: T.Vector3[];
        if (p.step === 1) {
          pts = [
            vec(0, 0, 1.4),
            vec(0, 0, 0.35),
            vec(0.2, -0.26, 0.05),
            vec(-0.1, -0.4, -0.1),
            vec(0.2, -0.55, 0.03),
            vec(0, -0.85, -0.3),
          ].map((v) => a.node.localToWorld(v));
        } else if (p.step === 3) {
          pts = [
            vec(-0.65, -0.8, 0.5),
            vec(-0.4, -0.1, 0.5),
            vec(0, 0.39, 0.55),
            vec(0.6, 0.39, 0.55),
          ].map((v) => a.node.localToWorld(v));
        } else {
          pts = [
            vec(-0.862, 0.382, 1.6),
            vec(-0.862, 0.382, 0.85),
            vec(-0.862, 0.382, 0.1),
            vec(-0.862, 0.382, -0.7),
          ].map((v) => a.node.localToWorld(v));
        }
        lightGeometry.setFromPoints(pts);
        const curve = new T.CatmullRomCurve3(pts);
        dots.forEach((d, i) =>
          d.position.copy(curve.getPoint((flowTime / 3.6 + i / 12) % 1)),
        );
        dirty = true;
      }
      if (framing > 0) {
        framing -= dt;
        fitTime += dt;
        if (fitTime > 0.08) {
          fitTime = 0;
          fit(p);
        }
        camera.position.lerp(wantedCamera, damp);
        controls.target.lerp(targetPosition, damp);
        dirty = true;
      }
      controls.update();
      if (dirty) {
        phone.root.updateMatrixWorld(true);
        camera.updateMatrixWorld();
        for (const { a, b } of markers) {
          const show =
            (p.labels || p.selected === a.id) &&
            a.node.visible &&
            !p.isolated &&
            p.step < 0;
          if (!show) {
            b.hidden = true;
            continue;
          }
          box.setFromObject(a.node);
          box.getCenter(world);
          world.project(camera);
          b.hidden =
            world.z > 1 ||
            world.z < -1 ||
            Math.abs(world.x) > 1 ||
            Math.abs(world.y) > 1;
          if (!b.hidden) {
            b.style.left = (world.x * 0.5 + 0.5) * host.clientWidth + 'px';
            b.style.top = (-world.y * 0.5 + 0.5) * host.clientHeight + 'px';
            b.classList.toggle('selected', p.selected === a.id);
          }
        }
        renderer.shadowMap.needsUpdate = true;
        if (p.isolated) {
          (dof.uniforms as Record<string, { value: number }>).focus.value =
            camera.position.distanceTo(controls.target);
          composer.render();
        } else renderer.render(scene, camera);
        dirty = false;
      }
    }
    frameId = requestAnimationFrame(tick);
    latest.current.onReady();
    return () => {
      cancelled = true;
      cancelAnimationFrame(frameId);
      observer.disconnect();
      controls.dispose();
      renderer.domElement.removeEventListener('pointerdown', onDown);
      renderer.domElement.removeEventListener('pointerup', onUp);
      renderer.domElement.removeEventListener('webglcontextlost', contextLost);
      markers.forEach((m) => m.b.remove());
      phone.dispose();
      env.dispose();
      floorGeo.dispose();
      floorMaterial.dispose();
      baseGeo.dispose();
      baseMaterial.dispose();
      lightGeometry.dispose();
      lineMaterial.dispose();
      dotGeometry.dispose();
      dotMaterial.dispose();
      dof.dispose();
      composer.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);
  return <div ref={el} className="three-host" />;
}
