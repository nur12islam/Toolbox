import { lazy, type ComponentType, type LazyExoticComponent } from 'react'
import {
  FileText,
  Fingerprint,
  Grid2X2,
  Image as ImageIcon,
  Palette,
  QrCode,
  Sparkles,
  WandSparkles,
} from 'lucide-react'

export type ToolDefinition = {
  id: string
  name: string
  description: string
  category: string
  icon: typeof ImageIcon
  tag?: string
  component: LazyExoticComponent<ComponentType>
}

const PhotoTool = lazy(() => import('./photo'))
const ImageTool = lazy(() => import('./image'))
const PdfTool = lazy(() => import('./pdf'))
const QrTool = lazy(() => import('./qr'))
const FaviconTool = lazy(() => import('./favicon'))
const ColorTool = lazy(() => import('./color'))
const GradientTool = lazy(() => import('./gradient'))
const MergePdfTool = lazy(() => import('./merge-pdf'))
const CompressPdfTool = lazy(() => import('./compress-pdf'))
const BackgroundRemoverTool = lazy(() => import('./remove-bg'))
const SignatureTool = lazy(() => import('./signature'))
const WordCounterTool = lazy(() => import('./word-count'))
const UnitConverterTool = lazy(() => import('./unit'))

export const tools: ToolDefinition[] = [
  {
    id: 'photo',
    name: 'Photo & Signature Fixer',
    description:
      'Get your photo or signature to the exact size that exam and scholarship forms ask for.',
    category: 'Student',
    icon: Fingerprint,
    tag: 'Most used',
    component: PhotoTool,
  },
  {
    id: 'image',
    name: 'Image Studio',
    description: 'Make any picture smaller in size or dimensions, right on your device.',
    category: 'Image',
    icon: ImageIcon,
    component: ImageTool,
  },
  {
    id: 'pdf',
    name: 'Image to PDF',
    description: 'Turn your photos or scans into one PDF, ready to upload.',
    category: 'PDF',
    icon: FileText,
    component: PdfTool,
  },
  {
    id: 'qr',
    name: 'QR Studio',
    description: 'Make a QR code for a link, a message or contact details.',
    category: 'Generator',
    icon: QrCode,
    tag: 'Quick',
    component: QrTool,
  },
  {
    id: 'favicon',
    name: 'Favicon Maker',
    description: 'Make a little website icon from a letter or an emoji.',
    category: 'Design',
    icon: Sparkles,
    component: FaviconTool,
  },
  {
    id: 'color',
    name: 'Color Lab',
    description: 'Pick a color and copy its HEX, RGB or HSL code.',
    category: 'Design',
    icon: Palette,
    component: ColorTool,
  },
  {
    id: 'gradient',
    name: 'Gradient Lab',
    description: 'Blend two colors and copy the CSS in one click.',
    category: 'Design',
    icon: WandSparkles,
    component: GradientTool,
  },
  {
    id: 'merge-pdf',
    name: 'Merge PDF',
    description: 'Join several PDF files into a single file.',
    category: 'PDF',
    icon: FileText,
    component: MergePdfTool,
  },
  {
    id: 'compress-pdf',
    name: 'Compress PDF',
    description: 'Shrink a PDF so it is easier to upload or email.',
    category: 'PDF',
    icon: FileText,
    component: CompressPdfTool,
  },
  {
    id: 'remove-bg',
    name: 'Background Remover',
    description: 'Cut out the background and download a transparent PNG.',
    category: 'Image',
    icon: ImageIcon,
    component: BackgroundRemoverTool,
  },
  {
    id: 'signature',
    name: 'Digital Signature',
    description: 'Draw your signature and save it as a transparent image.',
    category: 'Student',
    icon: Fingerprint,
    component: SignatureTool,
  },
  {
    id: 'word-count',
    name: 'Word Counter',
    description: 'Count words and characters, and see the reading time.',
    category: 'Text',
    icon: FileText,
    component: WordCounterTool,
  },
  {
    id: 'unit',
    name: 'Unit Converter',
    description: 'Convert length, weight and temperature in a tap.',
    category: 'Utilities',
    icon: Grid2X2,
    component: UnitConverterTool,
  },
]

export const categories = ['All tools', ...new Set(tools.map((tool) => tool.category))]
export const searchTools = (query: string) => {
  const needle = query.trim().toLowerCase()
  return needle
    ? tools.filter((tool) =>
        `${tool.name} ${tool.description} ${tool.category}`.toLowerCase().includes(needle),
      )
    : tools
}
