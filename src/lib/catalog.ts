export type Product = { id: string; name: string; slug: string; category: string; price: number; description: string; badge: string; image: string; alt: string }

export const products: Product[] = [
  { id: "forme-01", name: "Sculpted Lounge Chair", slug: "sculpted-lounge-chair", category: "Living", price: 420, description: "A quiet statement piece with soft curves and timeless proportions.", badge: "BESTSELLER", image: "/images/products/lounge-chair.jpg", alt: "Ivory boucle lounge chair with a curved natural oak frame" },
  { id: "forme-02", name: "Arc Floor Lamp", slug: "arc-floor-lamp", category: "Lighting", price: 185, description: "Sculptural ambient lighting for slow evenings and thoughtful spaces.", badge: "NEW", image: "/images/products/arc-floor-lamp.jpg", alt: "Sculptural floor lamp in a warm neutral interior" },
  { id: "forme-03", name: "Everyday Ceramic Vase", slug: "everyday-ceramic-vase", category: "Objects", price: 68, description: "A tactile ceramic accent designed to be lived with every day.", badge: "", image: "/images/products/ceramic-vase.jpg", alt: "Hand-finished neutral ceramic vase" },
  { id: "forme-04", name: "Linen Cushion Cover", slug: "linen-cushion-cover", category: "Textiles", price: 48, description: "Naturally textured linen that brings softness to your space.", badge: "NEW", image: "/images/products/linen-cushion.jpg", alt: "Natural linen cushion in a calm living room" },
  { id: "forme-05", name: "Oak Side Table", slug: "oak-side-table", category: "Living", price: 240, description: "A practical, beautifully restrained companion for the living room.", badge: "", image: "/images/products/oak-side-table.jpg", alt: "Warm oak side table with natural styling" },
  { id: "forme-06", name: "Stoneware Table Light", slug: "stoneware-table-light", category: "Lighting", price: 132, description: "A warm pool of light with a handcrafted, understated character.", badge: "", image: "/images/products/stoneware.webp", alt: "Hand-finished stoneware table lamp in a warm neutral interior" },
  { id: "forme-07", name: "Minimal Catchall Tray", slug: "minimal-catchall-tray", category: "Objects", price: 36, description: "A simple landing place for the small things you reach for daily.", badge: "", image: "/images/products/catchall-tray.jpg", alt: "Natural wood tabletop styled with simple decor" },
  { id: "forme-08", name: "Woven Throw Blanket", slug: "woven-throw-blanket", category: "Textiles", price: 96, description: "An easy layer of warmth, texture and comfort.", badge: "NEW", image: "/images/products/woven-throw.jpg", alt: "Soft woven throw blanket in a natural home" },
]

export async function getCatalog() { return products }
export type { Product as CatalogProduct }
