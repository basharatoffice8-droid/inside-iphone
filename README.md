# Inside iPhone — 17 Pro

Interactive browser study built with React, Three.js and Shadcn primitives. No Blender or Unreal installation is required.

## Experience
- 17 selectable assembly groups, with semantic subassemblies and miniature surface details.
- Four progressive disassembly stages after the assembled state: enclosure, systems, overview and component detail.
- Isolated macro inspection, subtle depth of field, orbit, flip, zoom, labels and three finishes.
- Five-step photo journey with pause, previous/next, replay and a photograph on the reassembled display.
- Collapsible assembly navigation and layouts for desktop and narrow screens.

## Reference and scope
Exterior landmarks reference Apple's iPhone 17 Pro dimensional drawing. Component categories and broad arrangement reference Apple's recycler diagram and iFixit's teardown. The geometry, optical paths, connectors and sub-part counts remain illustrative. This is not an exact device scan, optical prescription, OEM catalogue or repair guide.

Sources are linked in app/parts.ts and the About dialog. The Apple mark outline is from Simple Icons; Apple retains its trademark rights. The landscape photograph is by Sergei Gussev / StockSnap (CC0). Model X Studio and Human Atlas informed the original interaction concept; their 3D assets are not included.

A downloadable third-party exterior model was considered, but a verified directly usable asset was not obtained. This version uses authored geometry so that the exterior and disassembly share the same model.

## Development and checks
npm ci
npm run dev
npx tsc --noEmit
node --experimental-strip-types scripts/validate-motion.mjs
npm run build

The motion regression check covers nonmonotonic animation timestamps and verifies bounded convergence. Browser visual checks cover assembled/exploded states, camera macro, photo reveal, pause, reset, finish switching, and a 390-pixel layout. These are not measured frame-rate benchmarks or exhaustive device coverage.

Optional WebMCP registration is feature-detected and validates assembly IDs and the 0–100 explosion range.

## Vercel

Import this repository in Vercel. The included `vercel.json` builds the same interactive app as a static Vite application using `npm run build:vercel` and publishes `dist-vercel`. No environment variables, database, paid 3D software, or server functions are required.

For the Vercel version locally, run `npm ci` and `npm run dev:vercel`.
The original `npm run dev` and `npm run build` commands retain the Sites/Cloudflare build path.
