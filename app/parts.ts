export const parts = [
  {
    id: 'frame',
    name: 'Aluminum enclosure',
    category: 'Structure',
    description:
      'The aluminum enclosure supports the internal assemblies. Rounded rails, antenna breaks and the raised camera plateau define the exterior.',
    role: 'Structure & heat distribution',
  },
  {
    id: 'back',
    name: 'Ceramic Shield back',
    category: 'Exterior',
    description:
      'The rear panel closes the wireless charging area. Its smooth finish contrasts with the anodized aluminum surrounding it.',
    role: 'Rear enclosure',
  },
  {
    id: 'display',
    name: 'OLED display',
    category: 'Display',
    description:
      'Cover glass, an OLED panel and a thin backing structure form the display assembly. The flex connector carries power and display signals.',
    role: 'Light, color & touch',
  },
  {
    id: 'camera',
    name: 'Main & ultra wide',
    category: 'Optics',
    description:
      'Separate camera modules collect different fields of view. Inspect the lens covers, optical stacks, sensor packages and flexible connections.',
    role: 'Capture light',
  },
  {
    id: 'telephoto',
    name: 'Tetraprism telephoto',
    category: 'Optics',
    description:
      'A folded optical path fits a longer camera system inside the phone. The optical elements and light path explain the principle; they are not an exact optical prescription.',
    role: 'Folded-path imaging',
  },
  {
    id: 'front',
    name: 'Front camera & Face ID',
    category: 'Sensors',
    description:
      'The front camera and TrueDepth sensing hardware sit behind the top of the display. Miniature modules connect through a flexible circuit.',
    role: 'Front imaging & depth sensing',
  },
  {
    id: 'chip',
    name: 'Logic board · A19 Pro',
    category: 'Compute',
    description:
      'Processor packages, controllers and miniature surface-mounted components share a densely populated board. Image processing develops sensor measurements into a photograph.',
    role: 'Compute & image processing',
  },
  {
    id: 'shield',
    name: 'Shields & cowlings',
    category: 'Protection',
    description:
      'Formed metal covers protect connectors and electronics. Screw tabs hold these thin components against their mounting points.',
    role: 'Protect & secure electronics',
  },
  {
    id: 'battery',
    name: 'Battery pouch',
    category: 'Power',
    description:
      'The rechargeable lithium-ion pouch stores energy. Folded edges, an insulated wrapper and a flexible connection are visible in this illustration.',
    role: 'Stored electrical energy',
  },
  {
    id: 'tray',
    name: 'Battery plate',
    category: 'Structure',
    description:
      'A separate plate supports the battery assembly. Mounting tabs and fasteners connect this carrier to the enclosure.',
    role: 'Support & retain the battery',
  },
  {
    id: 'coil',
    name: 'MagSafe receiver',
    category: 'Wireless',
    description:
      'A receiver coil transfers energy by electromagnetic induction. Magnetic segments help align compatible charging accessories.',
    role: 'Wireless charging & alignment',
  },
  {
    id: 'thermal',
    name: 'Vapor chamber',
    category: 'Thermal',
    description:
      'The thermal system spreads heat away from A19 Pro toward the enclosure. The chamber, contact pad and graphite layer are simplified representations.',
    role: 'Spread heat',
  },
  {
    id: 'speaker',
    name: 'Bottom speaker',
    category: 'Audio',
    description:
      'A diaphragm inside a shaped acoustic enclosure converts an electrical signal into sound. Seals connect the chamber to the external grille.',
    role: 'Sound output',
  },
  {
    id: 'earpiece',
    name: 'Top speaker',
    category: 'Audio',
    description:
      'A compact receiver and fine protective grille sit along the top of the phone.',
    role: 'Upper audio output',
  },
  {
    id: 'haptic',
    name: 'Taptic Engine',
    category: 'Feedback',
    description:
      'A moving mass inside a metal housing creates tactile feedback. Open the assembly to inspect its simplified actuator.',
    role: 'Precise tactile feedback',
  },
  {
    id: 'port',
    name: 'USB-C & dock flex',
    category: 'Connection',
    description:
      'The connector, contact tongue, dock circuit and flexible cable connect external power and data to the phone.',
    role: 'Wired power & data',
  },
  {
    id: 'fasteners',
    name: 'Brackets & fasteners',
    category: 'Structure',
    description:
      'Small screws, retaining brackets and insulating seals keep the assemblies aligned. Their positions and quantities are illustrative.',
    role: 'Assembly retention',
  },
];
export const journey = [
  {
    part: 'camera',
    title: 'A world enters the lens.',
    description:
      'Move closer. Incoming light passes through a layered optical system.',
    label: '01 · Light',
  },
  {
    part: 'telephoto',
    title: 'A longer path. Folded inside.',
    description:
      'The telephoto illustration bends the light path through a compact prism arrangement.',
    label: '02 · Optics',
  },
  {
    part: 'camera',
    title: 'Light becomes information.',
    description:
      'The sensor converts incoming photons into electrical measurements.',
    label: '03 · Sensor',
  },
  {
    part: 'chip',
    title: 'Millions of measurements. One image.',
    description:
      'The processing pipeline develops color, exposure and detail from the captured data.',
    label: '04 · Processing',
  },
  {
    part: 'display',
    title: 'Back into light.',
    description:
      'The phone comes together. Your finished photograph fills the OLED display.',
    label: '05 · Photograph',
  },
];
export const sources = [
  [
    'https://www.apple.com/iphone-17-pro/specs/',
    'Apple · iPhone 17 Pro specifications',
  ],
  [
    'https://developer.apple.com/download/files/accessories/dimensional-drawings/iphone-17-pro.pdf',
    'Apple · Exterior dimensional drawing',
  ],
  [
    'https://www.apple.com/cl/recycling/recycler-guides/pdf/products/iphone/iPhone_17_Pro_iPhone_17_Pro_Max_Recycler_Guide_English.pdf',
    'Apple · Component layout reference',
  ],
  [
    'https://www.ifixit.com/News/113388/iphone-17-pro-teardown',
    'iFixit · Teardown reference',
  ],
  [
    'https://github.com/simple-icons/simple-icons/blob/develop/icons/apple.svg',
    'Apple mark outline · Simple Icons',
  ],
  [
    'https://stocksnap.io/photo/mountain-landscape-1YYGRD3S8N',
    'Landscape · Sergei Gussev / StockSnap · CC0',
  ],
  [
    'https://github.com/ashemag/model-x-studio',
    'Interaction inspiration · Model X Studio',
  ],
];
