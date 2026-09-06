import type {Metadata} from 'next';
import './globals.css';
export const metadata:Metadata={title:'Inside iPhone — 17 Pro',description:'Explore iPhone 17 Pro in real-time 3D. Take apart 17 illustrative assemblies and follow the journey of a photograph.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}

