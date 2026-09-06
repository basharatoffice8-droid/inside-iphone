import * as T from 'three';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';

export type Assembly = {
  id: string;
  node: T.Group;
  home: T.Vector3;
  opened: T.Vector3;
  overview: T.Vector3;
  pieces: { node: T.Group; home: T.Vector3; offset: T.Vector3 }[];
};
const V = (x = 0, y = 0, z = 0) => new T.Vector3(x, y, z);
export function buildPhone(invalidate: () => void) {
  const root = new T.Group(),
    assemblies: Assembly[] = [],
    disposables: newSetType = new Set(),
    pickables: T.Mesh[] = [];
  type newSetType = Set<{ dispose: () => void }>;
  const keep = <A extends { dispose: () => void }>(o: A): A => {
    disposables.add(o);
    return o;
  };
  function finish(
    color: string,
    metalness: number,
    roughness: number,
    extra: T.MeshPhysicalMaterialParameters = {},
  ) {
    return keep(
      new T.MeshPhysicalMaterial({ color, metalness, roughness, ...extra }),
    );
  }
  // Tiny, deterministic variations break up broad reflections without noisy color.
  const noiseData = new Uint8Array(128 * 128 * 4);
  let seed = 17;
  for (let i = 0; i < 128 * 128; i++) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const n = 126 + (seed % 8);
    noiseData.set([n, n, n, 255], i * 4);
  }
  const grain = keep(new T.DataTexture(noiseData, 128, 128));
  grain.needsUpdate = true;
  grain.wrapS = grain.wrapT = T.RepeatWrapping;
  grain.repeat.set(18, 36);
  const metal = finish('#b6bcc2', 0.88, 0.31, {
    bumpMap: grain,
    bumpScale: 0.0006,
  });
  const rear = finish('#c8cbd0', 0.1, 0.27, {
    clearcoat: 0.65,
    clearcoatRoughness: 0.19,
    bumpMap: grain,
    bumpScale: 0.0002,
  });
  const polished = finish('#d7dbe1', 0.97, 0.17),
    ink = finish('#111317', 0.1, 0.65),
    rubber = finish('#090b0e', 0, 0.85),
    ceramic = finish('#1a1d21', 0.2, 0.42),
    steel = finish('#a4abb3', 0.86, 0.25),
    boardMat = finish('#11282a', 0.25, 0.54),
    gold = finish('#aa8647', 0.86, 0.3),
    copper = finish('#a16a43', 0.86, 0.34),
    flexMat = finish('#684320', 0.35, 0.45),
    graphite = finish('#272b30', 0.45, 0.68);
  const glass = finish('#07111b', 0.08, 0.07, {
    clearcoat: 1,
    clearcoatRoughness: 0.04,
    ior: 1.52,
  });
  const optical = finish('#8797bd', 0.05, 0.1, {
    transmission: 0.72,
    thickness: 0.06,
    ior: 1.5,
    iridescence: 0.18,
    transparent: true,
    opacity: 0.95,
  });
  const sensorMat = finish('#354047', 0.82, 0.14, {
    iridescence: 0.65,
    iridescenceIOR: 1.36,
  });
  function shape(w: number, h: number, r: number) {
    const s = new T.Shape(),
      x = -w / 2,
      y = -h / 2;
    r = Math.min(r, w / 2 - 0.001, h / 2 - 0.001);
    s.moveTo(x + r, y);
    s.lineTo(x + w - r, y);
    s.quadraticCurveTo(x + w, y, x + w, y + r);
    s.lineTo(x + w, y + h - r);
    s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    s.lineTo(x + r, y + h);
    s.quadraticCurveTo(x, y + h, x, y + h - r);
    s.lineTo(x, y + r);
    s.quadraticCurveTo(x, y, x + r, y);
    return s;
  }
  function extrude(s: T.Shape, d: number, bevel = 0.012) {
    bevel = Math.min(bevel, d * 0.22);
    const geo = new T.ExtrudeGeometry(s, {
      depth: d - 2 * bevel,
      bevelEnabled: bevel > 0,
      bevelThickness: bevel,
      bevelSize: bevel,
      bevelSegments: 3,
      curveSegments: 20,
      steps: 1,
    });
    geo.translate(0, 0, -d / 2 + bevel);
    return geo;
  }
  function mesh(
    g: T.Object3D,
    geo: T.BufferGeometry,
    m: T.Material,
    pos = V(),
  ) {
    const o = new T.Mesh(keep(geo), m);
    o.position.copy(pos);
    o.castShadow = true;
    o.receiveShadow = true;
    g.add(o);
    pickables.push(o);
    return o;
  }
  function plate(
    g: T.Object3D,
    w: number,
    h: number,
    d: number,
    m: T.Material,
    x = 0,
    y = 0,
    z = 0,
    r = 0.08,
  ) {
    return mesh(g, extrude(shape(w, h, r), d), m, V(x, y, z));
  }
  function cylinder(
    g: T.Object3D,
    r: number,
    d: number,
    m: T.Material,
    x = 0,
    y = 0,
    z = 0,
  ) {
    const o = mesh(g, new T.CylinderGeometry(r, r, d, 64), m, V(x, y, z));
    o.rotation.x = Math.PI / 2;
    return o;
  }
  function torus(
    g: T.Object3D,
    r: number,
    t: number,
    m: T.Material,
    x = 0,
    y = 0,
    z = 0,
  ) {
    return mesh(g, new T.TorusGeometry(r, t, 8, 80), m, V(x, y, z));
  }
  function outline(
    g: T.Object3D,
    w: number,
    h: number,
    r: number,
    t: number,
    d: number,
    m: T.Material,
    x = 0,
    y = 0,
    z = 0,
  ) {
    const s = shape(w, h, r);
    const path = new T.Path(
      shape(w - 2 * t, h - 2 * t, Math.max(0.01, r - t)).getPoints(20),
    );
    s.holes.push(path);
    return mesh(g, extrude(s, d, 0.004), m, V(x, y, z));
  }
  function polygon(
    g: T.Object3D,
    points: number[][],
    d: number,
    m: T.Material,
    x = 0,
    y = 0,
    z = 0,
  ) {
    const s = new T.Shape(
      points.map((p) => new T.Vector2(...(p as [number, number]))),
    );
    s.closePath();
    return mesh(g, extrude(s, d, 0.004), m, V(x, y, z));
  }
  function screw(g: T.Object3D, x: number, y: number, z: number, r = 0.027) {
    cylinder(g, r, 0.032, steel, x, y, z);
    const a = plate(g, r * 1.2, 0.008, 0.005, ink, x, y, z + 0.019, 0.002);
    a.rotation.z = 0.2;
    const b = plate(g, r * 1.2, 0.008, 0.005, ink, x, y, z + 0.019, 0.002);
    b.rotation.z = Math.PI / 2 + 0.2;
  }
  function trace(g: T.Object3D, points: number[][], m = gold, r = 0.004) {
    return mesh(
      g,
      new T.TubeGeometry(
        new T.CatmullRomCurve3(
          points.map((p) => V(...(p as [number, number, number]))),
        ),
        20,
        r,
        5,
        false,
      ),
      m,
    );
  }
  function ribbon(g: T.Object3D, points: number[][], width = 0.16) {
    const curve = new T.CatmullRomCurve3(
        points.map((p) => V(...(p as [number, number, number]))),
      ),
      segments = 32,
      verts: number[] = [],
      uvs: number[] = [],
      indices: number[] = [];
    for (let i = 0; i <= segments; i++) {
      const p = curve.getPoint(i / segments),
        t = curve.getTangent(i / segments);
      const n = V(-t.y, t.x, 0)
        .normalize()
        .multiplyScalar(width / 2);
      if (n.length() < 0.001) n.set(width / 2, 0, 0);
      for (const side of [-1, 1]) {
        verts.push(p.x + n.x * side, p.y + n.y * side, p.z);
        uvs.push(side === 1 ? 1 : 0, i / segments);
      }
    }
    for (let i = 0; i < segments; i++) {
      const j = i * 2;
      indices.push(j, j + 1, j + 2, j + 1, j + 3, j + 2);
    }
    const geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.Float32BufferAttribute(verts, 3));
    geo.setAttribute('uv', new T.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    const o = mesh(g, geo, flexMat);
    o.material = keep(flexMat.clone());
    (o.material as T.Material).side = T.DoubleSide;
    for (let i = 0; i < 4; i++)
      trace(
        g,
        points.map((p) => [
          p[0] + (i - 1.5) * width * 0.17,
          p[1],
          p[2] + 0.003,
        ]),
        gold,
        0.002,
      );
    return o;
  }
  function print(
    g: T.Object3D,
    lines: string[],
    w: number,
    h: number,
    x: number,
    y: number,
    z: number,
    color = '#b4b8ba',
    size = 33,
  ) {
    const c = document.createElement('canvas');
    c.width = 1024;
    c.height = 512;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '500 ' + size + 'px Arial';
    lines.forEach((l, i) =>
      ctx.fillText(l, 512, 256 + (i - (lines.length - 1) / 2) * (size * 1.6)),
    );
    const tex = keep(new T.CanvasTexture(c));
    tex.colorSpace = T.SRGBColorSpace;
    const m = keep(
      new T.MeshBasicMaterial({
        map: tex,
        transparent: true,
        depthWrite: false,
        side: T.DoubleSide,
      }),
    );
    return mesh(g, new T.PlaneGeometry(w, h), m, V(x, y, z));
  }
  function assembly(
    id: string,
    home: number[],
    opened: number[],
    overview: number[],
  ) {
    const node = new T.Group();
    node.userData.part = id;
    root.add(node);
    const a = {
      id,
      node,
      home: V(...(home as [number, number, number])),
      opened: V(...(opened as [number, number, number])),
      overview: V(...(overview as [number, number, number])),
      pieces: [] as Assembly['pieces'],
    };
    node.position.copy(a.home);
    assemblies.push(a);
    return a;
  }
  function piece(
    a: Assembly,
    name: string,
    pos: number[],
    offset: number[] = [0, 0, 0],
  ) {
    const node = new T.Group();
    node.name = name;
    node.userData.part = a.id;
    node.position.set(...(pos as [number, number, number]));
    a.node.add(node);
    a.pieces.push({
      node,
      home: node.position.clone(),
      offset: V(...(offset as [number, number, number])),
    });
    return node;
  }
  // 25 mm per scene unit. Exterior landmarks use Apple's dimensional drawing.
  const frame = assembly('frame', [0, 0, 0], [-0.5, 0, -0.6], [-7.8, 0, -0.6]);
  const housing = piece(frame, 'Machined aluminum rails', [0, 0, 0]);
  outline(housing, 2.876, 6, 0.48, 0.082, 0.35, metal);
  outline(housing, 2.834, 5.958, 0.465, 0.016, 0.018, polished, 0, 0, 0.161);
  outline(housing, 2.79, 5.914, 0.443, 0.016, 0.021, rubber, 0, 0, -0.171);
  const plateau = shape(2.67, 1.7, 0.37);
  const locations = [
    [-0.862, 0.382],
    [-0.862, -0.388],
    [-0.081, -0.003],
  ];
  for (const [x, y] of locations) {
    const h = new T.Path();
    h.absarc(x, y, 0.309, 0, Math.PI * 2, true);
    plateau.holes.push(h);
  }
  mesh(housing, extrude(plateau, 0.114, 0.016), metal, V(0, 2.04, 0.226));
  // Thin internal ribs are visible when the enclosure opens.
  const midframe = piece(frame, 'Internal support ribs', [0, 0, -0.11]);
  outline(midframe, 2.69, 5.8, 0.4, 0.055, 0.035, steel);
  plate(midframe, 2.52, 0.16, 0.028, steel, 0, 1.11, 0, 0.03);
  for (const y of [-2.55, -1.25, 0.3, 1.3, 2.55])
    for (const x of [-1.28, 1.28]) {
      plate(midframe, 0.13, 0.22, 0.1, steel, x, y, 0.045, 0.025);
      screw(midframe, x, y, 0.11);
    }
  const controls = piece(frame, 'Side buttons', [0, 0, 0], [0, 0, 0.15]);
  for (const [x, y, h] of [
    [1.447, 0.81, 0.6],
    [1.447, -1.6, 0.68],
    [-1.447, 1.6, 0.25],
    [-1.447, 0.98, 0.4],
    [-1.447, 0.42, 0.4],
  ]) {
    plate(controls, 0.04, h + 0.04, 0.2, rubber, x, y, 0, 0.018);
    plate(controls, 0.061, h, 0.16, metal, x * 1.005, y, 0, 0.022);
  }
  for (const x of [-1.439, 1.439])
    for (const y of [-2.35, 2.28])
      plate(housing, 0.016, 0.047, 0.343, ceramic, x, y, 0, 0.005);
  const bottom = piece(
    frame,
    'Bottom grille and port surround',
    [0, -2.979, 0],
  );
  for (let i = 0; i < 4; i++) {
    const o = cylinder(bottom, 0.023, 0.025, rubber, -0.72 + i * 0.11, 0, 0);
    o.rotation.x = 0;
  }
  for (let i = 0; i < 6; i++) {
    const o = cylinder(bottom, 0.021, 0.025, rubber, 0.43 + i * 0.098, 0, 0);
    o.rotation.x = 0;
  }
  const portHole = plate(bottom, 0.36, 0.14, 0.02, rubber, 0, 0, 0, 0.062);
  portHole.rotation.x = Math.PI / 2;
  for (const x of [-0.34, 0.34]) {
    const o = cylinder(bottom, 0.018, 0.025, steel, x, 0, 0);
    o.rotation.x = 0;
  }
  const back = assembly(
    'back',
    [0, -0.89, 0.183],
    [0, -0.89, 1.05],
    [-4.6, -0.1, 0.4],
  );
  const backPane = piece(
    back,
    'Rear Ceramic Shield panel',
    [0, 0, 0],
    [0, 0, 0.18],
  );
  plate(backPane, 2.665, 3.98, 0.034, rear, 0, 0, 0, 0.39);
  outline(backPane, 2.674, 3.989, 0.394, 0.008, 0.009, polished, 0, 0, 0.005);
  // Genuine outline from Simple Icons; normalize to the documented logo proportions.
  const mark = new T.Group();
  mark.name = 'Apple inlay';
  mark.position.set(0, 0.05, 0.024);
  backPane.add(mark);
  const logoMat = finish('#71777e', 0.98, 0.17);
  let cancelled = false;
  fetch('/apple.svg')
    .then((r) => r.text())
    .then((svg) => {
      if (cancelled) return;
      const paths = new SVGLoader().parse(svg).paths;
      for (const p of paths)
        for (const sh of SVGLoader.createShapes(p)) {
          const o = mesh(mark, new T.ShapeGeometry(sh, 32), logoMat);
          o.scale.set(0.0334, -0.0334, 1);
          o.position.set(-0.4008, 0.4008, 0);
        }
      invalidate();
    })
    .catch(() => {});
  const seal = piece(
    back,
    'Rear adhesive gasket',
    [0, 0, -0.04],
    [0, 0, -0.18],
  );
  outline(seal, 2.62, 3.94, 0.37, 0.023, 0.015, rubber);
  const display = assembly(
    'display',
    [0, 0, -0.213],
    [0.75, 0, -1.5],
    [7.1, 0, -0.8],
  );
  const screenFrame = piece(
    display,
    'Display carrier',
    [0, 0, 0],
    [0, 0, -0.02],
  );
  plate(screenFrame, 2.785, 5.912, 0.06, ceramic, 0, 0, 0, 0.44);
  outline(screenFrame, 2.794, 5.92, 0.445, 0.018, 0.018, polished);
  const cover = piece(display, 'Cover glass', [0, 0, -0.042], [0, 0, -0.3]);
  plate(cover, 2.772, 5.9, 0.018, glass, 0, 0, 0, 0.44);
  const screenCanvas = document.createElement('canvas');
  screenCanvas.width = 768;
  screenCanvas.height = 1668;
  const ctx = screenCanvas.getContext('2d')!;
  const screenTexture = keep(new T.CanvasTexture(screenCanvas));
  screenTexture.colorSpace = T.SRGBColorSpace;
  screenTexture.anisotropy = 4;
  const screenMaterial = keep(
    new T.MeshBasicMaterial({ map: screenTexture, toneMapped: false }),
  );
  const oled = piece(
    display,
    'OLED emissive panel',
    [0, 0, -0.054],
    [0, 0, -0.34],
  );
  const screenSurface = mesh(
    oled,
    new T.ShapeGeometry(shape(2.65, 5.78, 0.36), 28),
    screenMaterial,
  );
  screenSurface.rotation.y = Math.PI;
  const uv = screenSurface.geometry.attributes.uv,
    po = screenSurface.geometry.attributes.position;
  for (let i = 0; i < uv.count; i++)
    uv.setXY(i, (po.getX(i) + 1.325) / 2.65, (po.getY(i) + 2.89) / 5.78);
  const island = plate(oled, 0.79, 0.215, 0.008, rubber, 0, 2.6, -0.008, 0.105);
  plate(oled, 0.62, 0.02, 0.006, steel, 0, -2.69, -0.008, 0.01);
  const backing = piece(
    display,
    'Display backing',
    [0, 0, 0.042],
    [0, 0, 0.25],
  );
  plate(backing, 2.68, 5.78, 0.018, graphite, 0, 0, 0, 0.38);
  for (const x of [-1.2, 1.2])
    for (let i = 0; i < 12; i++)
      plate(
        backing,
        0.04,
        0.08,
        0.024,
        steel,
        x,
        -2.5 + i * 0.44,
        0.018,
        0.008,
      );
  print(
    backing,
    ['OLED DISPLAY', 'FLEXIBLE CIRCUIT ASSEMBLY'],
    1.8,
    0.6,
    0,
    0.4,
    0.013,
    '#909799',
    28,
  );
  const displayCable = piece(
    display,
    'Display flex',
    [0.88, -0.4, 0.085],
    [0.35, 0, 0.2],
  );
  ribbon(
    displayCable,
    [
      [0, 0, 0],
      [-0.4, -0.08, 0],
      [-0.5, -0.65, 0.14],
      [-0.85, -0.9, 0.14],
    ],
    0.18,
  );
  plate(displayCable, 0.31, 0.12, 0.05, ceramic, -0.85, -0.9, 0.14, 0.02);
  for (let i = 0; i < 12; i++)
    plate(
      displayCable,
      0.012,
      0.07,
      0.008,
      gold,
      -0.98 + i * 0.023,
      -0.9,
      0.17,
      0.001,
    );
  function cameraModule(a: Assembly, cx: number, cy: number, index: number) {
    const housing = piece(
      a,
      'Camera ' + index + ' housing',
      [cx, cy, -0.2],
      [0, 0, -0.1],
    );
    plate(housing, 0.7, 0.7, 0.3, steel, 0, 0, 0, 0.1);
    outline(housing, 0.64, 0.64, 0.06, 0.04, 0.028, ink, 0, 0, 0.17);
    for (const x of [-0.29, 0.29])
      for (const y of [-0.29, 0.29]) screw(housing, x, y, 0.18, 0.018);
    const barrel = piece(
      a,
      'Lens barrel ' + index,
      [cx, cy, 0.032],
      [0, 0, 0.17],
    );
    cylinder(barrel, 0.29, 0.18, ceramic);
    for (let i = 0; i < 5; i++)
      torus(barrel, 0.291, 0.008, ink, 0, 0, -0.07 + i * 0.035);
    cylinder(barrel, 0.257, 0.012, glass, 0, 0, 0.093);
    const cover = piece(
      a,
      'Lens cover ' + index,
      [cx, cy, 0.164],
      [0, 0, 0.85],
    );
    cylinder(cover, 0.324, 0.043, polished);
    cylinder(cover, 0.299, 0.049, ceramic, 0, 0, 0.006);
    cylinder(cover, 0.274, 0.01, glass, 0, 0, 0.033);
    torus(cover, 0.283, 0.008, steel, 0, 0, 0.04);
    torus(cover, 0.18, 0.004, finish('#34465a', 0.75, 0.12), 0, 0, 0.045);
    cylinder(cover, 0.13, 0.002, finish('#101d29', 0.5, 0.06), 0, 0, 0.046);
    const glint = mesh(
      cover,
      new T.CircleGeometry(0.2, 48),
      keep(
        new T.MeshBasicMaterial({
          color: '#d7e7ff',
          transparent: true,
          opacity: 0.11,
          depthWrite: false,
        }),
      ),
      V(-0.07, 0.09, 0.048),
    );
    glint.scale.set(0.65, 0.1, 1);
    glint.rotation.z = -0.45;
    cylinder(cover, 0.153, 0.004, glass, 0, 0, 0.04);
    for (let i = 0; i < 3; i++) {
      const lens = piece(
        a,
        'Optical element ' + index + '.' + i,
        [cx, cy, 0.055 - i * 0.045],
        [0, 0, 0.58 - i * 0.16],
      );
      const l = mesh(
        lens,
        new T.SphereGeometry(0.234 - i * 0.018, 48, 24),
        optical,
      );
      l.scale.z = 0.09;
      torus(lens, 0.238 - i * 0.018, 0.008, ceramic);
    }
    const sensor = piece(
      a,
      'Sensor package ' + index,
      [cx, cy, -0.385],
      [0, 0, -0.4],
    );
    plate(sensor, 0.52, 0.52, 0.035, boardMat, 0, 0, 0, 0.024);
    plate(sensor, 0.31, 0.24, 0.009, sensorMat, 0, 0, 0.025, 0.009);
    for (let i = 0; i < 7; i++)
      for (const side of [-1, 1])
        plate(
          sensor,
          0.04,
          0.019,
          0.009,
          gold,
          side * 0.236,
          -0.18 + i * 0.06,
          0.025,
          0.003,
        );
    const flex = piece(
      a,
      'Camera flex ' + index,
      [cx + 0.29, cy, -0.3],
      [0.2, 0, -0.2],
    );
    ribbon(
      flex,
      [
        [0, 0, 0],
        [0.32, 0.05, 0],
        [0.39, -0.23, -0.08],
        [0.58, -0.24, -0.08],
      ],
      0.12,
    );
    plate(flex, 0.19, 0.12, 0.04, ceramic, 0.58, -0.24, -0.06, 0.01);
  }
  const cam = assembly(
    'camera',
    [0, 2.04, 0.145],
    [0, 2.6, 1.45],
    [-1.9, 3.4, 1],
  );
  cameraModule(cam, -0.862, 0.382, 1);
  cameraModule(cam, -0.862, -0.388, 2);
  const flash = piece(cam, 'Flash and LiDAR', [0, 0, 0.135], [0.28, 0, 0.2]);
  cylinder(flash, 0.136, 0.047, steel, 0.87, 0.379, 0.043);
  cylinder(
    flash,
    0.115,
    0.012,
    finish('#e3dbc1', 0.05, 0.41),
    0.87,
    0.379,
    0.072,
  );
  for (let i = 0; i < 5; i++)
    plate(
      flash,
      0.15,
      0.005,
      0.004,
      steel,
      0.87,
      0.34 + i * 0.018,
      0.081,
      0.001,
    );
  cylinder(flash, 0.133, 0.035, ceramic, 0.87, -0.434, 0.04);
  cylinder(flash, 0.096, 0.01, glass, 0.87, -0.434, 0.062);
  cylinder(flash, 0.021, 0.018, ink, 0.87, -0.002, 0.04);
  const tele = assembly(
    'telephoto',
    [-0.081, 2.037, 0.145],
    [1.05, 1.65, 1.45],
    [1.0, 3.4, 1.0],
  );
  const teleHousing = piece(
    tele,
    'Telephoto housing',
    [0, -0.2, -0.24],
    [0, 0, -0.26],
  );
  plate(teleHousing, 0.69, 1.12, 0.3, steel, 0, 0, 0, 0.09);
  outline(teleHousing, 0.63, 1.06, 0.07, 0.046, 0.027, ink, 0, 0, 0.17);
  const teleCover = piece(
    tele,
    'Telephoto lens cover',
    [0, 0, 0.164],
    [0, 0, 0.85],
  );
  cylinder(teleCover, 0.324, 0.043, polished);
  cylinder(teleCover, 0.299, 0.049, ceramic, 0, 0, 0.006);
  cylinder(teleCover, 0.274, 0.01, glass, 0, 0, 0.033);
  torus(teleCover, 0.283, 0.008, steel, 0, 0, 0.04);
  torus(teleCover, 0.18, 0.004, finish('#34465a', 0.75, 0.12), 0, 0, 0.045);
  cylinder(teleCover, 0.13, 0.002, finish('#101d29', 0.5, 0.06), 0, 0, 0.046);
  const teleLens = piece(
    tele,
    'Telephoto optical stack',
    [0, 0, 0.01],
    [0, 0, 0.44],
  );
  for (let i = 0; i < 3; i++) {
    const o = mesh(
      teleLens,
      new T.SphereGeometry(0.238 - i * 0.012, 40, 20),
      optical,
      V(0, 0, -i * 0.053),
    );
    o.scale.z = 0.095;
    torus(teleLens, 0.242 - i * 0.012, 0.007, ceramic, 0, 0, -i * 0.053);
  }
  const prism = piece(
    tele,
    'Folded-path prism',
    [0, -0.21, -0.22],
    [0.35, 0, 0.18],
  );
  for (let i = 0; i < 4; i++) {
    const o = plate(
      prism,
      0.32,
      0.2,
      0.14,
      optical,
      (i % 2 ? 1 : -1) * 0.09,
      -0.05 - i * 0.15,
      0,
      0.012,
    );
    o.rotation.x = ((i % 2 ? 1 : -1) * Math.PI) / 4;
  }
  const teleSensor = piece(
    tele,
    'Telephoto sensor',
    [0, -0.7, -0.2],
    [0, -0.15, -0.28],
  );
  plate(teleSensor, 0.48, 0.29, 0.035, boardMat);
  plate(teleSensor, 0.3, 0.18, 0.01, sensorMat, 0, 0, 0.026, 0.005);
  ribbon(
    teleSensor,
    [
      [0.2, 0, 0],
      [0.41, 0, 0],
      [0.45, -0.2, -0.1],
      [0.65, -0.3, -0.1],
    ],
    0.13,
  );
  const front = assembly(
    'front',
    [0.35, 2.58, -0.07],
    [1.8, 2.8, -0.2],
    [3.9, 3.55, 0.4],
  );
  const frontBody = piece(front, 'TrueDepth carrier', [0, 0, 0]);
  plate(frontBody, 1.13, 0.29, 0.16, ceramic, 0, 0, 0, 0.055);
  for (const x of [-0.39, 0.06, 0.41]) {
    cylinder(frontBody, 0.095, 0.06, steel, x, 0, -0.08);
    cylinder(frontBody, 0.075, 0.065, glass, x, 0, -0.09);
  }
  const frontFlex = piece(
    front,
    'Front sensor flex',
    [0, 0, 0.09],
    [0, 0, 0.28],
  );
  ribbon(
    frontFlex,
    [
      [-0.4, 0, 0],
      [-0.68, 0, 0],
      [-0.85, -0.35, -0.05],
      [-1.03, -0.36, -0.05],
    ],
    0.14,
  );
  const board = assembly(
    'chip',
    [0, 0.12, -0.06],
    [0.1, 0.45, 0.1],
    [3.1, 0.25, 0.6],
  );
  const pcb = piece(board, 'Main logic board', [0, 0, 0]);
  polygon(
    pcb,
    [
      [-0.62, 1.23],
      [0.42, 1.23],
      [0.42, 0.93],
      [0.65, 0.93],
      [0.65, -0.61],
      [0.37, -0.61],
      [0.37, -1.13],
      [-0.52, -1.13],
      [-0.52, -0.72],
      [-0.65, -0.72],
    ],
    0.065,
    boardMat,
  );
  for (let x = 0; x < 10; x++)
    for (let y = 0; y < 23; y++) {
      const px = -0.52 + x * 0.113,
        py = -1.02 + y * 0.097;
      if (
        (py > 0.05 && py < 0.78 && Math.abs(px) < 0.44) ||
        (py < -0.2 && py > -0.62 && Math.abs(px) < 0.42)
      )
        continue;
      plate(
        pcb,
        0.053,
        0.032,
        0.029,
        (x + y) % 3 ? ceramic : gold,
        px,
        py,
        0.051,
        0.004,
      );
    }
  for (let i = 0; i < 12; i++)
    trace(
      pcb,
      [
        [-0.51 + i * 0.025, -0.89, 0.036],
        [-0.51 + i * 0.025, -0.13, 0.036],
        [-0.3 + i * 0.024, 0.0, 0.036],
      ],
      gold,
      0.002,
    );
  const cpu = piece(board, 'A19 Pro package', [0, 0.39, 0.073], [0, 0, 0.4]);
  plate(cpu, 0.77, 0.69, 0.071, ceramic, 0, 0, 0, 0.024);
  print(cpu, ['A19', 'PRO'], 0.65, 0.54, 0, 0, 0.04, '#bfc5c6', 55);
  for (let i = 0; i < 14; i++)
    for (const side of [-1, 1])
      plate(
        cpu,
        0.021,
        0.025,
        0.021,
        gold,
        -0.325 + i * 0.05,
        side * 0.337,
        -0.01,
        0.002,
      );
  const memory = piece(
    board,
    'Memory and controllers',
    [0, -0.4, 0.077],
    [0, 0, 0.22],
  );
  plate(memory, 0.72, 0.38, 0.07, ink, 0, 0, 0, 0.022);
  print(memory, ['MEMORY'], 0.64, 0.28, 0, 0, 0.04, '#777e82', 24);
  plate(memory, 0.32, 0.25, 0.04, ceramic, 0.25, -0.4, 0, 0.015);
  plate(memory, 0.24, 0.24, 0.04, ceramic, -0.25, -0.4, 0, 0.015);
  const connectors = piece(
    board,
    'Board connectors',
    [0, 0, 0.06],
    [0, 0, 0.12],
  );
  for (const y of [-0.87, 0.94]) {
    plate(connectors, 0.73, 0.11, 0.06, ink, 0, y, 0, 0.018);
    for (let i = 0; i < 22; i++)
      plate(
        connectors,
        0.017,
        0.07,
        0.009,
        gold,
        -0.325 + i * 0.031,
        y,
        0.034,
        0.002,
      );
  }
  const shield = assembly(
    'shield',
    [0, 0.12, -0.15],
    [0.4, 0.45, -0.5],
    [4.5, 0.15, 1.6],
  );
  const covers = piece(shield, 'EMI shield covers', [0, 0, 0], [0, 0, 0.25]);
  for (const [w, h, x, y] of [
    [0.91, 0.81, 0, 0.42],
    [0.89, 0.49, 0, -0.35],
  ]) {
    plate(covers, w, h, 0.026, steel, x, y, 0, 0.045);
    outline(
      covers,
      w - 0.04,
      h - 0.04,
      0.034,
      0.012,
      0.02,
      polished,
      x,
      y,
      0.013,
    );
    for (const xx of [-w / 2 + 0.045, w / 2 - 0.045])
      screw(covers, xx, y, 0.035, 0.02);
  }
  const battery = assembly(
    'battery',
    [0, -0.79, -0.025],
    [-1.15, -0.5, -0.7],
    [-1.6, -0.3, 0.8],
  );
  const pouch = piece(battery, 'Lithium-ion pouch', [0, 0, 0]);
  plate(pouch, 2.39, 3.1, 0.135, ink, 0, 0, 0, 0.11);
  plate(pouch, 2.31, 3.02, 0.02, graphite, 0, 0, 0.075, 0.09);
  outline(pouch, 2.34, 3.05, 0.1, 0.02, 0.015, ceramic, 0, 0, 0.087);
  for (const x of [-1.13, 1.13])
    plate(pouch, 0.024, 2.87, 0.014, steel, x, 0, 0.067, 0.006);
  print(
    pouch,
    [
      'Li-ion',
      'RECHARGEABLE LITHIUM-ION',
      'POLYMER BATTERY',
      '',
      '+                                 −',
      'RECYCLE RESPONSIBLY',
    ],
    1.95,
    1.6,
    0,
    0.12,
    0.091,
    '#a0a6a9',
    35,
  );
  const batteryFlex = piece(
    battery,
    'Battery flex and tabs',
    [0, 1.55, 0.02],
    [0, 0.15, 0.18],
  );
  ribbon(
    batteryFlex,
    [
      [0.88, 0, 0],
      [0.89, 0.26, 0],
      [0.5, 0.31, 0.04],
      [0.43, 0.48, 0.04],
    ],
    0.14,
  );
  plate(batteryFlex, 0.26, 0.12, 0.05, ink, 0.43, 0.48, 0.07, 0.01);
  for (const x of [-0.8, 0.8])
    plate(batteryFlex, 0.2, 0.18, 0.012, ceramic, x, -3.14, 0, 0.015);
  const tray = assembly(
    'tray',
    [0, -0.62, -0.135],
    [-0.9, -0.5, -1.1],
    [1.05, -0.3, -0.8],
  );
  const trayPlate = piece(
    tray,
    'Battery support plate',
    [0, 0, 0],
    [0, 0, -0.12],
  );
  plate(trayPlate, 2.52, 3.63, 0.023, steel, 0, 0, 0, 0.16);
  outline(trayPlate, 2.48, 3.59, 0.14, 0.04, 0.04, polished, 0, 0, -0.025);
  plate(trayPlate, 2.2, 3.13, 0.009, graphite, 0, -0.1, -0.027, 0.09);
  for (const y of [-1.63, 1.62])
    for (const x of [-1.29, 1.29]) {
      plate(trayPlate, 0.13, 0.18, 0.033, steel, x, y, 0, 0.03);
      screw(trayPlate, x, y, 0.033, 0.024);
    }
  const coil = assembly(
    'coil',
    [0, -0.79, 0.115],
    [0, -0.79, 1.6],
    [-4.3, -3.65, 0.7],
  );
  const coilBacking = piece(coil, 'Ferrite backing', [0, 0, 0], [0, 0, -0.22]);
  cylinder(coilBacking, 1.01, 0.018, graphite);
  plate(coilBacking, 0.22, 0.44, 0.019, graphite, 0, -1.07, 0, 0.028);
  const winding = piece(
    coil,
    'Copper receiver winding',
    [0, 0, 0.022],
    [0, 0, 0.16],
  );
  for (let i = 0; i < 25; i++) torus(winding, 0.4 + i * 0.019, 0.007, copper);
  ribbon(
    winding,
    [
      [0, -0.88, 0],
      [0, -1.14, 0],
      [0.33, -1.3, 0.04],
      [0.54, -1.22, 0.04],
    ],
    0.14,
  );
  const magnets = piece(
    coil,
    'Magnetic alignment ring',
    [0, 0, 0.03],
    [0, 0, 0.38],
  );
  for (let i = 0; i < 28; i++) {
    const a = (i / 28) * Math.PI * 2;
    const seg = plate(
      magnets,
      0.16,
      0.075,
      0.022,
      steel,
      Math.cos(a) * 0.95,
      Math.sin(a) * 0.95,
      0,
      0.01,
    );
    seg.rotation.z = a + Math.PI / 2;
  }
  plate(magnets, 0.09, 0.28, 0.025, steel, 0, -1.18, 0, 0.018);
  const thermal = assembly(
    'thermal',
    [0, 0.22, 0.02],
    [0.2, 0.2, 0.65],
    [0.9, -3.55, 0.8],
  );
  const chamber = piece(
    thermal,
    'Vapor chamber envelope',
    [0, 0, 0],
    [0, 0, 0.2],
  );
  polygon(
    chamber,
    [
      [-0.64, 1.14],
      [0.42, 1.14],
      [0.42, 0.66],
      [0.73, 0.66],
      [0.73, -0.82],
      [0.42, -0.82],
      [0.42, -1.2],
      [-0.53, -1.2],
      [-0.53, -0.76],
      [-0.72, -0.76],
      [-0.72, 0.66],
      [-0.64, 0.66],
    ],
    0.045,
    copper,
  );
  plate(chamber, 1.11, 1.56, 0.006, copper, 0, -0.08, 0.026, 0.09);
  for (const x of [-0.54, 0.54])
    for (let i = 0; i < 10; i++)
      cylinder(chamber, 0.009, 0.007, gold, x, -0.72 + i * 0.16, 0.03);
  const contact = piece(
    thermal,
    'Thermal contact pad',
    [0, 0.42, 0.04],
    [0, 0, 0.32],
  );
  plate(contact, 0.71, 0.66, 0.022, graphite, 0, 0, 0, 0.018);
  const sheet = piece(
    thermal,
    'Graphite spreader',
    [0, 0, -0.04],
    [0, 0, -0.2],
  );
  plate(sheet, 1.62, 2.67, 0.009, graphite, 0, 0, 0, 0.1);
  const speaker = assembly(
    'speaker',
    [0.7, -2.53, -0.015],
    [1.7, -2.8, 0],
    [3.0, -3.55, 0.7],
  );
  const speakerBody = piece(speaker, 'Acoustic enclosure', [0, 0, 0]);
  polygon(
    speakerBody,
    [
      [-0.48, -0.23],
      [0.47, -0.23],
      [0.47, 0.21],
      [0.18, 0.21],
      [0.18, 0.33],
      [-0.44, 0.33],
    ],
    0.18,
    ceramic,
  );
  plate(speakerBody, 0.74, 0.25, 0.029, rubber, 0, -0.08, 0.105, 0.11);
  plate(speakerBody, 0.62, 0.15, 0.022, graphite, 0, -0.08, 0.126, 0.07);
  for (const x of [-0.38, 0.38]) screw(speakerBody, x, 0.21, 0.115, 0.02);
  const diaphragm = piece(
    speaker,
    'Speaker diaphragm',
    [0, -0.08, 0.12],
    [0, 0, 0.4],
  );
  plate(diaphragm, 0.57, 0.12, 0.015, steel, 0, 0, 0, 0.06);
  const earpiece = assembly(
    'earpiece',
    [-0.65, 2.63, -0.055],
    [-1.75, 2.9, 0],
    [-4.5, 3.55, 0.6],
  );
  const topSpeaker = piece(earpiece, 'Top receiver', [0, 0, 0]);
  plate(topSpeaker, 0.66, 0.29, 0.16, ceramic, 0, 0, 0, 0.07);
  plate(topSpeaker, 0.47, 0.17, 0.018, steel, 0, 0, 0.091, 0.06);
  const grille = piece(earpiece, 'Receiver mesh', [0, 0.17, 0], [0, 0.2, 0.15]);
  plate(grille, 1.1, 0.037, 0.045, ink, 0, 0, 0, 0.018);
  for (let i = 0; i < 35; i++)
    plate(
      grille,
      0.007,
      0.029,
      0.005,
      steel,
      -0.51 + i * 0.03,
      0,
      0.028,
      0.002,
    );
  const haptic = assembly(
    'haptic',
    [-0.66, -2.54, -0.03],
    [-1.7, -2.8, 0],
    [-1.9, -3.6, 0.7],
  );
  const hapticBody = piece(haptic, 'Taptic housing', [0, 0, 0]);
  plate(hapticBody, 1.02, 0.42, 0.17, steel, 0, 0, 0, 0.06);
  outline(hapticBody, 0.93, 0.34, 0.035, 0.022, 0.022, polished, 0, 0, 0.092);
  for (const x of [-0.44, 0.44]) screw(hapticBody, x, 0, 0.095, 0.024);
  const actuator = piece(
    haptic,
    'Actuator moving mass',
    [0, 0, 0.09],
    [0, 0, 0.39],
  );
  plate(actuator, 0.69, 0.25, 0.053, graphite, 0, 0, 0, 0.035);
  for (let i = 0; i < 10; i++)
    plate(
      actuator,
      0.02,
      0.19,
      0.055,
      copper,
      -0.2 + i * 0.04,
      0,
      0.025,
      0.005,
    );
  print(actuator, ['TAPTIC'], 0.65, 0.24, 0, 0, 0.06, '#c3c8ca', 31);
  const port = assembly(
    'port',
    [0, -2.78, -0.045],
    [0, -3.25, 0.35],
    [4.6, -3.6, 0.7],
  );
  const portBody = piece(port, 'USB-C shell', [0, 0, 0]);
  outline(portBody, 0.39, 0.144, 0.07, 0.025, 0.24, steel, 0, 0, 0);
  plate(portBody, 0.24, 0.027, 0.24, ceramic, 0, 0, 0, 0.009);
  for (let i = 0; i < 12; i++)
    for (const side of [-1, 1])
      plate(
        portBody,
        0.011,
        0.006,
        0.16,
        gold,
        -0.104 + i * 0.019,
        side * 0.019,
        0,
        0.001,
      );
  const dock = piece(
    port,
    'Dock board and flex',
    [0, 0.25, -0.065],
    [0, 0.05, -0.2],
  );
  plate(dock, 0.81, 0.26, 0.034, boardMat, 0, 0, 0, 0.05);
  for (const x of [-0.32, 0.32]) {
    plate(dock, 0.15, 0.2, 0.065, ceramic, x, 0, 0.034, 0.02);
    screw(dock, x, 0.15, 0.027, 0.02);
  }
  ribbon(
    dock,
    [
      [0.25, 0.1, 0],
      [0.95, 0.13, 0],
      [1.16, 0.8, 0.03],
      [1.16, 1.64, 0.03],
      [0.74, 1.87, 0.06],
    ],
    0.16,
  );
  plate(dock, 0.3, 0.13, 0.04, ink, 0.74, 1.87, 0.08, 0.01);
  const fasteners = assembly('fasteners', [0, 0, 0], [0, 0, -0.9], [0, 0, 2.3]);
  const retainers = piece(
    fasteners,
    'Connector brackets',
    [0, 0, 0],
    [0, 0, 0.35],
  );
  for (const [x, y, w] of [
    [-0.35, 1.13, 0.5],
    [0.4, 0.98, 0.42],
    [0.4, -1.9, 0.55],
  ]) {
    plate(retainers, w, 0.18, 0.023, steel, x, y, 0, 0.025);
    screw(retainers, x - w * 0.35, y, 0.023, 0.023);
    screw(retainers, x + w * 0.35, y, 0.023, 0.023);
  }
  const seals = piece(
    display,
    'Display adhesive seal',
    [0, 0, -0.15],
    [0, 0, -0.42],
  );
  outline(seals, 2.73, 5.85, 0.42, 0.028, 0.012, rubber);
  // Contact screws retain their local connections until the final detail stage.
  const screws = piece(
    fasteners,
    'Enclosure fasteners',
    [0, 0, 0],
    [0, 0, 0.65],
  );
  for (const x of [-1.24, 1.24])
    for (const y of [-2.62, -1.74, 1.25, 2.55]) screw(screws, x, y, 0.1, 0.027);
  let photo: HTMLImageElement | null = null,
    requestedPhoto = false;
  const image = new Image();
  image.onload = () => {
    if (cancelled) return;
    photo = image;
    drawScreen(requestedPhoto);
    invalidate();
  };
  image.src = '/photo-reference.jpg';
  function drawScreen(showPhoto: boolean) {
    requestedPhoto = showPhoto;
    ctx.fillStyle = '#050607';
    ctx.fillRect(0, 0, 768, 1668);
    if (showPhoto && photo) {
      const scale = Math.max(768 / photo.width, 1668 / photo.height);
      ctx.drawImage(
        photo,
        (768 - photo.width * scale) / 2,
        (1668 - photo.height * scale) / 2,
        photo.width * scale,
        photo.height * scale,
      );
      ctx.fillStyle = '#0002';
      ctx.fillRect(0, 0, 768, 1668);
    } else {
      const grad = ctx.createLinearGradient(0, 0, 768, 1668);
      grad.addColorStop(0, '#191e29');
      grad.addColorStop(0.4, '#617184');
      grad.addColorStop(0.62, '#17252e');
      grad.addColorStop(1, '#040609');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 768, 1668);
      ctx.strokeStyle = '#aebcca66';
      ctx.lineWidth = 130;
      ctx.beginPath();
      ctx.ellipse(540, 920, 480, 690, 0.55, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = '#d2d7dc22';
      ctx.lineWidth = 45;
      ctx.stroke();
      ctx.textAlign = 'center';
      ctx.fillStyle = '#f4f5f7';
      ctx.font = '400 148px Arial';
      ctx.fillText('9:41', 384, 365);
      ctx.font = '400 35px Arial';
      ctx.fillText('Sunday, September 6', 384, 226);
    }
    screenTexture.needsUpdate = true;
  }
  drawScreen(false);
  return {
    root,
    assemblies,
    pickables,
    materials: { metal, rear, polished, logoMat },
    drawScreen,
    screenTexture,
    dispose() {
      cancelled = true;
      image.onload = null;
      for (const o of disposables) o.dispose();
    },
  };
}
