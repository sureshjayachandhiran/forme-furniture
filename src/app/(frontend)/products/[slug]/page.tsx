import Storefront from '@/components/Storefront'
import { getCatalog } from '@/lib/catalog'
import { notFound } from 'next/navigation'
export async function generateStaticParams() { return (await getCatalog()).map((p) => ({ slug: p.slug })) }
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
 const { slug } = await params
 const products = await getCatalog()
 if (!products.some((p) => p.slug === slug)) notFound()
 return <Storefront page="product" slug={slug} products={products} />
}
