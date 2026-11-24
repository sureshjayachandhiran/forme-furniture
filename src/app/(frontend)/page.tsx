import Storefront from '@/components/Storefront'
import { getCatalog } from '@/lib/catalog'
export default async function Home() { return <Storefront page="home" products={await getCatalog()} /> }
