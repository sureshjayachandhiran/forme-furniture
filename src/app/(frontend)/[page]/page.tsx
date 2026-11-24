import Storefront from '@/components/Storefront'
import { getCatalog } from '@/lib/catalog'
import { notFound } from 'next/navigation'
const pages = ['shop','cart','checkout','login','signup','account','wishlist','tracking','about']
export function generateStaticParams() { return pages.map((page) => ({ page })) }
export const dynamicParams = false
export default async function Page({ params }: { params: Promise<{ page: string }> }) {
 const { page } = await params
 if (!pages.includes(page)) notFound()
 return <Storefront page={page} products={await getCatalog()} />
}
