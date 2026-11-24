'use client'
import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import type { Product } from '@/lib/catalog'
import {
  accountAction,
  getAccount,
  logout,
  placeOrder,
  saveShopping,
  subscribe,
} from '@/app/(frontend)/actions'

type Item = { id: string; qty: number; finish: string }
function Icon({ name, className = 'h-5 w-5' }: { name: string; className?: string }) {
  const paths: Record<string, React.ReactNode> = {
    search: (
      <>
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="m16 16 5 5" />
      </>
    ),
    heart: (
      <path d="M20.5 4.5a5.5 5.5 0 0 0-8.5 1 5.5 5.5 0 0 0-8.5 7L12 21l8.5-8.5a5.5 5.5 0 0 0 0-8Z" />
    ),
    bag: (
      <>
        <path d="M5 7h14l1 14H4L5 7Z" />
        <path d="M8 8V6a4 4 0 0 1 8 0v2" />
      </>
    ),
    user: (
      <>
        <circle cx="12" cy="7" r="4" />
        <path d="M4 21v-2a8 8 0 0 1 16 0v2" />
      </>
    ),
    arrow: <path d="M4 12h16m-6-6 6 6-6 6" />,
    menu: <path d="M3 6h18M3 12h18M3 18h18" />,
    close: <path d="m5 5 14 14M5 19 19 5" />,
    truck: (
      <>
        <path d="M2 5h12v12H2Zm12 5h4l4 4v3h-8" />
        <circle cx="6" cy="18" r="2" />
        <circle cx="18" cy="18" r="2" />
      </>
    ),
    leaf: (
      <>
        <path d="M20 3C6 1 1 10 7 16S23 14 20 3ZM5 21 16 9" />
      </>
    ),
    box: (
      <>
        <path d="m12 2 9 5v10l-9 5-9-5V7l9-5Zm0 10L3 7m9 5 9-5m-9 5v10M7 5l10 5" />
      </>
    ),
    return: (
      <>
        <path d="M4 10a8 8 0 1 1 0 7M4 3v7h7" />
      </>
    ),
    check: <path d="m5 12 4 4L20 5" />,
    minus: <path d="M5 12h14" />,
    plus: <path d="M5 12h14M12 5v14" />,
  }
  return (
    <svg
      className={className}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name] ?? paths.arrow}
    </svg>
  )
}
const money = (n: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n)
const cats = ['Living', 'Lighting', 'Objects', 'Textiles']
function QuerySync({
  onQuery,
}: {
  onQuery: (category: string, query: string, sort: string) => void
}) {
  const params = useSearchParams()
  useEffect(() => {
    onQuery(
      params.get('category') ?? 'All',
      params.get('q') ?? '',
      params.get('sort') ?? 'featured',
    )
  }, [params])
  return null
}
function StorefrontContent({
  page,
  products,
  slug,
}: {
  page: string
  products: Product[]
  slug?: string
}) {
  const router = useRouter()
  const [bag, setBag] = useState<Item[]>([]),
    [wishes, setWishes] = useState<string[]>([]),
    [ready, setReady] = useState(false),
    [account, setAccount] = useState<Awaited<ReturnType<typeof getAccount>>>(null),
    [menu, setMenu] = useState(false),
    [search, setSearch] = useState(false),
    [query, setQuery] = useState(''),
    [category, setCategory] = useState('All'),
    [sort, setSort] = useState('featured'),
    [max, setMax] = useState(500),
    [toast, setToast] = useState(''),
    [quantity, setQuantity] = useState(1),
    [finish, setFinish] = useState('Natural'),
    [message, setMessage] = useState(''),
    [busy, setBusy] = useState(false),
    [orderId, setOrderId] = useState(''),
    [tracking, setTracking] = useState(''),
    [tracked, setTracked] = useState(false),
    [gallery, setGallery] = useState(0)
  useEffect(() => {
    let active = true
    let hasLocalBag = false
    let hasLocalWishlist = false

    try {
      const storedBag = localStorage.getItem('forme-bag')
      if (storedBag) {
        const parsedBag: unknown = JSON.parse(storedBag)
        if (Array.isArray(parsedBag)) {
          setBag(parsedBag as Item[])
          hasLocalBag = true
        }
      }

      const storedWishlist = localStorage.getItem('forme-wishlist')
      if (storedWishlist) {
        const parsedWishlist: unknown = JSON.parse(storedWishlist)
        if (Array.isArray(parsedWishlist)) {
          setWishes(parsedWishlist.filter((id): id is string => typeof id === 'string'))
          hasLocalWishlist = true
        }
      }
    } catch {}

    const q = new URLSearchParams(location.search)
    setCategory(q.get('category') ?? 'All')
    setQuery(q.get('q') ?? '')
    if (q.get('sort')) setSort(q.get('sort')!)

    // Wait for the account request before enabling persistence. Otherwise the
    // initial empty local state can overwrite the signed-in user's saved bag.
    getAccount()
      .then((a) => {
        if (!active) return
        setAccount(a)
        if (a) {
          if (!hasLocalBag && Array.isArray(a.basket)) setBag(a.basket as Item[])
          if (!hasLocalWishlist) setWishes(a.wishlist)
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setReady(true)
      })

    return () => {
      active = false
    }
  }, [])
  useEffect(() => {
    if (!ready) return
    localStorage.setItem('forme-bag', JSON.stringify(bag))
    localStorage.setItem('forme-wishlist', JSON.stringify(wishes))
    const t = setTimeout(() => {
      if (account) saveShopping(bag, wishes).catch(() => {})
    }, 500)
    return () => clearTimeout(t)
  }, [bag, wishes, ready, account])
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(''), 3200)
    return () => clearTimeout(t)
  }, [toast])
  const add = (p: Product, qty = 1) => {
    setBag((b) => {
      const old = b.find((x) => x.id === p.id && x.finish === finish)
      return old
        ? b.map((x) => (x === old ? { ...x, qty: Math.min(20, x.qty + qty) } : x))
        : [...b, { id: p.id, qty, finish }]
    })
    setToast(`${p.name} added to your bag`)
  }
  const wish = (id: string) =>
    setWishes((w) => (w.includes(id) ? w.filter((x) => x !== id) : [...w, id]))
  const count = bag.reduce((n, x) => n + x.qty, 0)
  const subtotal = bag.reduce(
    (n, x) => n + (products.find((p) => p.id === x.id)?.price ?? 0) * x.qty,
    0,
  )
  const shipping = subtotal >= 150 ? 0 : 12
  const filtered = products
    .filter(
      (p) =>
        (category === 'All' || p.category === category) &&
        p.price <= max &&
        (p.name + ' ' + p.category).toLowerCase().includes(query.toLowerCase()),
    )
    .sort((a, b) =>
      sort === 'low'
        ? a.price - b.price
        : sort === 'high'
          ? b.price - a.price
          : sort === 'new'
            ? Number(!!b.badge.includes('NEW')) - Number(!!a.badge.includes('NEW'))
            : 0,
    )
  const product = products.find((p) => p.slug === slug)
  const picture = (p: Product, classes: string, priority = false) =>
    p.image ? (
      <Image
        src={p.image}
        alt={p.alt}
        fill
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 40vw, 25vw"
        className={`object-cover ${classes}`}
        priority={priority}
      />
    ) : (
      <div className="h-full bg-stone-100" />
    )
  const btn =
    'inline-flex items-center justify-center gap-7 rounded-sm bg-[#343c2e] px-7 py-4 text-[12px] font-medium tracking-wide text-white transition hover:bg-[#535f49] disabled:opacity-50'
  const field =
    'w-full rounded-sm border border-[#deded6] bg-white px-4 py-3.5 text-sm outline-none transition focus:border-[#646f56]'
  const card = (p: Product) => (
    <article key={p.id} className="group min-w-0">
      <div className="relative aspect-[4/4.7] overflow-hidden rounded-lg bg-[#f1efea]">
        <Link href={`/products/${p.slug}`} className="absolute inset-0">
          {picture(p, 'transition duration-700 group-hover:scale-105')}
        </Link>
        {p.badge && (
          <span className="absolute left-4 top-4 rounded-sm bg-white/90 px-2.5 py-1.5 text-[8px] font-medium tracking-[.1em]">
            {p.badge}
          </span>
        )}
        <button
          aria-label={`${wishes.includes(p.id) ? 'Remove from' : 'Add to'} wishlist: ${p.name}`}
          onClick={() => wish(p.id)}
          className={`absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 transition hover:bg-white ${wishes.includes(p.id) ? 'text-[#925746]' : 'text-stone-600'}`}
        >
          <Icon name="heart" className={`h-4 w-4 ${wishes.includes(p.id) ? 'fill-current' : ''}`} />
        </button>
        <button
          onClick={() => add(p)}
          className="absolute inset-x-3 bottom-3 translate-y-14 rounded-sm bg-white/95 py-3 text-xs transition duration-300 focus:translate-y-0 group-hover:translate-y-0 max-md:translate-y-0"
        >
          Quick add <span className="ml-3">+</span>
        </button>
      </div>
      <div className="mt-4 flex items-start justify-between gap-2">
        <div>
          <p className="mb-1.5 text-[10px] tracking-wide text-stone-500">{p.category} collection</p>
          <Link href={`/products/${p.slug}`} className="text-[13px] font-medium hover:underline">
            {p.name}
          </Link>
        </div>
        <span className="pt-5 text-[13px]">{money(p.price)}</span>
      </div>
      <div className="mt-3 flex gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full bg-[#ba9f7f] ring-1 ring-stone-300 ring-offset-2" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#e6e0d5]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#65584b]" />
      </div>
    </article>
  )
  const title = (eyebrow: string, heading: string, desc?: string) => (
    <div className="mb-10">
      <p className="mb-4 text-[10px] tracking-[.2em] text-[#69745d] uppercase">{eyebrow}</p>
      <h1 className="font-editorial text-4xl md:text-5xl">{heading}</h1>
      {desc && <p className="mt-4 text-sm leading-7 text-stone-500">{desc}</p>}
    </div>
  )
  const summary = (
    <div className="h-fit rounded-lg bg-[#f6f5f0] p-7">
      <h2 className="font-editorial text-2xl">Order summary</h2>
      <div className="mt-7 space-y-4 text-sm">
        <div className="flex justify-between">
          <span>Subtotal ({count} items)</span>
          <span>{money(subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span>Delivery</span>
          <span>{shipping ? money(shipping) : 'Complimentary'}</span>
        </div>
        <p className="text-xs leading-6 text-stone-500">
          Taxes included. Complimentary delivery on orders $150+.
        </p>
        <div className="flex justify-between border-t border-stone-300 pt-5 text-base font-medium">
          <span>Total</span>
          <span>{money(subtotal + shipping)}</span>
        </div>
      </div>
      {page === 'cart' && (
        <Link href="/checkout" className={`${btn} mt-7 w-full`}>
          Continue to checkout <Icon name="arrow" />
        </Link>
      )}
      <p className="mt-5 text-center text-[10px] text-stone-500">
        Thoughtfully packed. Safely delivered.
      </p>
    </div>
  )
  return (
    <div className="min-h-screen bg-white text-[#292c25]">
      <Suspense fallback={null}>
        <QuerySync
          onQuery={(c, q, s) => {
            setCategory(c)
            setQuery(q)
            setSort(s)
          }}
        />
      </Suspense>
      <div className="flex h-8 items-center justify-center bg-[#343c2e] px-3 text-center text-[9px] tracking-[.12em] text-white">
        Good things, delivered. &nbsp; Complimentary shipping on orders $150+{' '}
        <span className="ml-4 hidden sm:inline">↗</span>
      </div>
      <header className="relative z-30 border-b border-[#efeee9] bg-white">
        <div className="mx-auto flex h-[84px] max-w-[1600px] items-center justify-between px-5 md:px-12 lg:px-16">
          <div className="flex items-center gap-4">
            <button aria-label="Open menu" onClick={() => setMenu(!menu)} className="lg:hidden">
              <Icon name={menu ? 'close' : 'menu'} />
            </button>
            <Link
              href="/"
              aria-label="FORME home"
              className="text-[32px] font-medium tracking-[.16em]"
            >
              FORME<span className="ml-0.5 align-top text-sm">®</span>
            </Link>
          </div>
          <nav className="hidden items-center gap-7 text-[11px] lg:flex lg:gap-9">
            <Link className="navlink" href="/shop">
              Shop all
            </Link>
            <Link className="navlink" href="/shop?sort=new">
              New arrivals <span className="ml-0.5 text-[#8d987e]">•</span>
            </Link>
            <Link className="navlink" href="/shop?category=Living">
              Furniture
            </Link>
            <Link className="navlink" href="/shop?category=Objects">
              Home & living
            </Link>
            <Link className="navlink" href="/about">
              Our story
            </Link>
          </nav>
          <div className="flex items-center gap-4 md:gap-5">
            <button aria-label="Search" onClick={() => setSearch(!search)}>
              <Icon name="search" />
            </button>
            <Link
              href={account ? '/account' : '/login'}
              aria-label="My account"
              className="hidden sm:block"
            >
              <Icon name="user" />
            </Link>
            <Link href="/wishlist" aria-label="Wishlist" className="hidden sm:block">
              <Icon name="heart" />
            </Link>
            <Link
              href="/cart"
              aria-label={`Shopping bag, ${count} items`}
              className="flex items-center gap-2"
            >
              <Icon name="bag" />
              <span className="text-[10px]">({count})</span>
            </Link>
          </div>
        </div>
        {menu && (
          <nav className="absolute inset-x-0 top-full flex flex-col gap-5 border-b bg-white p-7 text-sm shadow-lg lg:hidden">
            {['shop', 'wishlist', 'account', 'tracking', 'about'].map((p) => (
              <Link key={p} href={`/${p}`} onClick={() => setMenu(false)} className="capitalize">
                {p === 'shop' ? 'Shop all' : p}
              </Link>
            ))}
          </nav>
        )}
        {search && (
          <form
            action="/shop"
            className="absolute inset-x-0 top-full flex gap-4 border-b bg-white p-6 shadow-md"
          >
            <input
              autoFocus
              name="q"
              aria-label="Search products"
              placeholder="Find your next favorite piece…"
              className={field}
            />
            <button className={btn}>Search</button>
            <button type="button" aria-label="Close search" onClick={() => setSearch(false)}>
              <Icon name="close" />
            </button>
          </form>
        )}
      </header>
      <main>
        {page === 'home' && (
          <>
            <section className="grid min-h-[540px] bg-[#f4f3ed] md:grid-cols-[41%_59%] lg:min-h-[570px]">
              <div className="flex flex-col justify-center px-7 py-14 md:pl-12 md:pr-8 lg:pl-16 xl:pl-24">
                <p className="mb-7 flex items-center gap-3 text-[9px] font-medium tracking-[.22em]">
                  <span className="h-px w-7 bg-[#727c62]" /> THE ART OF EVERYDAY LIVING
                </p>
                <h1 className="font-editorial text-[54px] leading-[1.08] tracking-[-.025em] lg:text-[67px] xl:text-[76px]">
                  Considered design.
                  <br />
                  <em className="font-normal text-[#6b755e]">Beautiful living.</em>
                </h1>
                <p className="mt-6 max-w-[300px] text-[12px] leading-[1.9] text-[#73756c]">
                  Thoughtfully curated pieces for a home that feels like you. Made to be loved,
                  designed to last.
                </p>
                <div className="mt-8">
                  <Link href="/shop" className={btn}>
                    Explore the collection <Icon name="arrow" className="h-4 w-4" />
                  </Link>
                </div>
                <div className="mt-10 flex items-center gap-3">
                  <div className="flex -space-x-2">
                    {['bg-[#b8b5a4]', 'bg-[#d8c4ad]', 'bg-[#8b8e7c]'].map((c, i) => (
                      <span
                        key={c}
                        className={`flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#f4f3ed] text-[9px] text-white ${c}`}
                      >
                        {['JL', 'AK', 'MS'][i]}
                      </span>
                    ))}
                  </div>
                  <div>
                    <p className="text-[10px] tracking-widest text-[#6a745e]">★★★★★</p>
                    <p className="mt-0.5 text-[8px] text-stone-500">
                      A little more home. A lot more love.
                    </p>
                  </div>
                </div>
              </div>
              <div className="relative min-h-[350px] md:min-h-full">
                <Image
                  src="/images/forme-home.jpg"
                  alt="A sunlit, thoughtfully curated living room with natural oak, a sculptural sofa and olive tree"
                  fill
                  priority
                  sizes="(max-width:768px) 100vw, 60vw"
                  className="object-cover"
                />
                <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between border border-white/30 bg-white/15 px-5 py-4 text-white backdrop-blur-md">
                  <div>
                    <p className="text-[8px] tracking-[.16em]">THE SLOW LIVING EDIT</p>
                    <p className="font-editorial mt-1 text-xl">Less, but better.</p>
                  </div>
                  <Link
                    href="/shop?category=Living"
                    aria-label="Shop the slow living edit"
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-white/70"
                  >
                    <Icon name="arrow" className="h-4 w-4" />
                  </Link>
                </div>
                <div className="absolute right-6 top-6 rounded-full border border-white/60 px-3 py-1.5 text-[8px] tracking-widest text-white">
                  NEW SEASON / 2026
                </div>
              </div>
            </section>
            <section className="border-b border-[#eaeae2]">
              <div className="mx-auto grid max-w-[1400px] grid-cols-2 gap-y-6 px-6 py-7 md:grid-cols-4 md:px-16">
                {[
                  ['truck', 'Complimentary shipping', 'On orders over $150'],
                  ['leaf', 'Thoughtfully made', 'Better materials. Better living.'],
                  ['box', 'Made for the everyday', 'Timeless, not trend-driven.'],
                  ['return', 'Easy 30-day returns', 'Find your perfect fit.'],
                ].map(([i, t, d]) => (
                  <div key={t} className="flex items-center justify-center gap-3 md:gap-4">
                    <Icon name={i} className="h-6 w-6 text-[#69745d]" />
                    <div>
                      <p className="text-[10px] font-medium">{t}</p>
                      <p className="mt-1 text-[8px] text-stone-500">{d}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
            <section className="mx-auto max-w-[1440px] px-6 py-16 md:px-12 lg:px-16">
              <div className="mb-8 flex items-end justify-between">
                <div>
                  <p className="mb-3 text-[9px] tracking-[.18em] text-[#7a806f]">
                    FIND YOUR EVERYDAY
                  </p>
                  <h2 className="font-editorial text-[34px]">A place for everything.</h2>
                </div>
                <Link
                  href="/shop"
                  className="hidden items-center gap-4 border-b border-stone-400 pb-1 text-[10px] sm:flex"
                >
                  Shop all collections <Icon name="arrow" className="h-3 w-3" />
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
                {cats.map((c, i) => {
                  const p = products.find((p) => p.category === c)
                  return (
                    <Link href={`/shop?category=${c}`} key={c} className="group">
                      <div className="relative aspect-[1.15] overflow-hidden rounded-lg bg-stone-100">
                        {p && picture(p, 'transition duration-700 group-hover:scale-105')}
                      </div>
                      <div className="mt-4 flex items-center justify-between">
                        <span className="text-[12px]">
                          {c === 'Living'
                            ? 'Furniture'
                            : c === 'Objects'
                              ? 'Decor & objects'
                              : c === 'Textiles'
                                ? 'Soft furnishings'
                                : c}
                        </span>
                        <Icon name="arrow" className="h-3.5 w-3.5" />
                      </div>
                    </Link>
                  )
                })}
              </div>
            </section>
            <section className="mx-auto max-w-[1440px] px-6 pb-16 md:px-12 lg:px-16">
              <div className="mb-8 flex flex-wrap items-end justify-between gap-6">
                <div>
                  <p className="mb-3 text-[9px] tracking-[.18em] text-[#7a806f]">
                    WELL LOVED, FOR GOOD REASON
                  </p>
                  <h2 className="font-editorial text-[34px]">Your new favorites.</h2>
                </div>
                <div className="flex gap-6 text-[10px]">
                  <button
                    onClick={() => setSort('featured')}
                    className={`pb-2 ${sort === 'featured' ? 'border-b border-[#333c2d]' : 'text-stone-400'}`}
                  >
                    Trending now
                  </button>
                  <button
                    onClick={() => setSort('bestsellers')}
                    className={`pb-2 ${sort === 'bestsellers' ? 'border-b border-[#333c2d]' : 'text-stone-400'}`}
                  >
                    Best sellers
                  </button>
                  <button
                    onClick={() => setSort('new')}
                    className={`pb-2 ${sort === 'new' ? 'border-b border-[#333c2d]' : 'text-stone-400'}`}
                  >
                    New arrivals
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-x-5 gap-y-9 md:grid-cols-4 md:gap-6">
                {(sort === 'new'
                  ? products.filter((p) => p.badge === 'NEW')
                  : sort === 'bestsellers'
                    ? [
                        ...products.filter((p) => p.badge === 'BESTSELLER'),
                        ...products.filter((p) => p.badge !== 'BESTSELLER'),
                      ]
                    : products
                )
                  .slice(0, 4)
                  .map(card)}
              </div>
              <div className="mt-10 text-center">
                <Link
                  href="/shop"
                  className="inline-flex items-center gap-10 border border-stone-300 px-7 py-3.5 text-[10px] transition hover:bg-stone-100"
                >
                  Discover all pieces <Icon name="arrow" className="h-4 w-4" />
                </Link>
              </div>
            </section>
            <section className="grid bg-[#eeeee6] md:grid-cols-2">
              <div className="relative min-h-80 overflow-hidden">
                <Image
                  src=" /images/natural-edit.jpg"
                  alt="Natural oak furniture and sculptural ceramic decor in warm afternoon light"
                  fill
                  sizes="50vw"
                  className="object-cover"
                />
              </div>
              <div className="flex flex-col items-start justify-center p-10 md:p-16 lg:p-24">
                <p className="text-[9px] tracking-[.2em] text-[#6e7862]">THE NATURAL EDIT</p>
                <h2 className="font-editorial mt-5 text-4xl leading-tight md:text-5xl">
                  Grounded in nature.
                  <br />
                  <em>Made for your home.</em>
                </h2>
                <p className="mt-5 max-w-sm text-xs leading-7 text-stone-500">
                  Honest textures, organic shapes, and a softer pace. Discover pieces that bring the
                  outside in — and make the everyday feel extraordinary.
                </p>
                <Link href="/shop?category=Living" className={`${btn} mt-7`}>
                  Discover the edit <Icon name="arrow" className="h-4 w-4" />
                </Link>
              </div>
            </section>
            <section className="mx-auto max-w-[1440px] px-6 py-16 md:px-16">
              <div className="mb-8 flex items-end justify-between">
                <div>
                  <p className="mb-3 text-[9px] tracking-[.18em] text-[#7a806f]">
                    FRESH PERSPECTIVES
                  </p>
                  <h2 className="font-editorial text-[34px]">Just arrived. Already timeless.</h2>
                </div>
                <Link href="/shop?sort=new" className="text-[10px] underline underline-offset-8">
                  View all new arrivals
                </Link>
              </div>
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
    {products.slice(0, 4).map(card)}
  </div>
            </section>
            <section className="bg-[#f8f7f3] px-6 py-16 text-center">
              <p className="text-[9px] tracking-[.2em] text-[#7a806f]">AT HOME WITH FORME</p>
              <h2 className="font-editorial mt-4 text-4xl">Good design. Real love.</h2>
              <div className="mx-auto mt-10 grid max-w-5xl gap-10 md:grid-cols-3">
                {[
                  [
                    'Beautiful, without trying.',
                    'The quality is even better in person. Every detail feels intentional, and it fits our home so naturally.',
                    'Emma R.',
                  ],
                  [
                    'My new favorite corner.',
                    'The Arc chair has completely transformed our living room. A piece we will have for years.',
                    'Daniel K.',
                  ],
                  [
                    'Thoughtful from start to finish.',
                    'From the packaging to the materials, everything feels so considered. Already planning my next order.',
                    'Sophie M.',
                  ],
                ].map(([t, d, n]) => (
                  <div key={n}>
                    <p className="text-xs tracking-[.2em] text-[#768264]">★★★★★</p>
                    <h3 className="font-editorial mt-5 text-xl">{t}</h3>
                    <p className="mx-auto mt-3 max-w-64 text-xs leading-6 text-stone-500">“{d}”</p>
                    <p className="mt-5 text-[10px]">
                      {n} <span className="ml-2 text-stone-400">— From our community</span>
                    </p>
                  </div>
                ))}
              </div>
            </section>
            <section className="mx-auto grid max-w-[1300px] gap-10 px-6 py-20 md:grid-cols-2 md:px-16">
              <div className="relative min-h-80 overflow-hidden rounded-lg">
                <Image
                  src="\images\forme-story.jpg"
                  fill
                  alt="Natural materials and considered details in the FORME home"
                  sizes="50vw"
                  className="object-cover object-left"
                />
              </div>
              <div className="flex flex-col items-start justify-center md:pl-12">
                <p className="text-[9px] tracking-[.2em] text-[#7a806f]">A NOTE FROM US</p>
                <h2 className="font-editorial mt-5 text-4xl">
                  A home is a feeling.
                  <br />
                  We help you find it.
                </h2>
                <p className="mt-5 text-xs leading-7 text-stone-500">
                  We believe the things you surround yourself with should mean something. That is
                  why we work with independent makers to bring you honest, enduring design — without
                  the unnecessary.
                </p>
                <Link href="/about" className="mt-6 flex items-center gap-8 border-b pb-2 text-xs">
                  Our story <Icon name="arrow" className="h-4 w-4" />
                </Link>
              </div>
            </section>
          </>
        )}
        {page === 'shop' && (
          <section className="mx-auto max-w-[1440px] px-6 py-12 md:px-16">
            {title(
              'THE CONSIDERED COLLECTION',
              'Good things for your everyday.',
              'Enduring design. Honest materials. Find the pieces that feel like you.',
            )}
            <div className="mb-8 flex flex-wrap items-center justify-between gap-5 border-y border-stone-200 py-5">
              <div className="flex flex-wrap gap-2">
                {['All', ...cats].map((c) => (
                  <button
                    key={c}
                    onClick={() => setCategory(c)}
                    className={`rounded-full px-4 py-2 text-xs ${category === c ? 'bg-[#343c2e] text-white' : 'bg-[#f4f3ee] hover:bg-stone-200'}`}
                  >
                    {c}
                  </button>
                ))}
              </div>
              <select
                aria-label="Sort products"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="bg-white text-xs"
              >
                <option value="featured">Sort: Featured</option>
                <option value="low">Price: Low to high</option>
                <option value="high">Price: High to low</option>
                <option value="new">New arrivals</option>
              </select>
            </div>
            <div className="grid gap-9 lg:grid-cols-[180px_1fr]">
              <aside className="space-y-7">
                <input
                  aria-label="Search collection"
                  placeholder="Search pieces…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className={field}
                />
                <div>
                  <label htmlFor="price" className="text-xs">
                    Price up to {money(max)}
                  </label>
                  <input
                    id="price"
                    type="range"
                    min="0"
                    max="500"
                    step="10"
                    value={max}
                    onChange={(e) => setMax(+e.target.value)}
                    className="mt-4 w-full accent-[#59664b]"
                  />
                </div>
                <p className="text-xs text-stone-400">{filtered.length} considered pieces</p>
                <button
                  onClick={() => {
                    setCategory('All')
                    setMax(500)
                    setQuery('')
                  }}
                  className="text-xs underline underline-offset-4"
                >
                  Clear filters
                </button>
              </aside>
              <div className="grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-3">
                {filtered.map(card)}
                {!filtered.length && (
                  <p className="col-span-full py-16 text-stone-500">
                    No pieces match just yet. Try a different search or clear your filters.
                  </p>
                )}
              </div>
            </div>
          </section>
        )}
        {page === 'product' && product && (
          <section className="mx-auto max-w-[1440px] px-6 py-8 md:px-16">
            <p className="mb-8 text-[10px] text-stone-500">
              <Link href="/">Home</Link> / <Link href="/shop">Shop</Link> / {product.name}
            </p>
            <div className="grid gap-10 md:grid-cols-2 md:gap-16">
              <div>
                <div className="relative aspect-square overflow-hidden rounded-lg bg-stone-100">
                  {picture(
                    product,
                    `${gallery === 1 ? 'scale-125' : gallery === 2 ? 'scale-150 object-bottom' : ''} transition duration-500`,
                    true,
                  )}
                </div>
                <div className="mt-4 flex gap-3">
                  {[0, 1, 2].map((i) => (
                    <button
                      key={i}
                      aria-label={`Gallery view ${i + 1}`}
                      onClick={() => setGallery(i)}
                      className={`relative h-20 w-20 overflow-hidden rounded border ${gallery === i ? 'border-[#526247]' : 'border-stone-200'}`}
                    >
                      {picture(product, i ? 'scale-150' : '')}
                    </button>
                  ))}
                </div>
              </div>
              <div className="py-4">
                <p className="text-[10px] uppercase tracking-[.18em] text-[#77816b]">
                  {product.category} / {product.badge || 'THE CONSIDERED COLLECTION'}
                </p>
                <h1 className="font-editorial mt-5 text-4xl md:text-5xl">{product.name}</h1>
                <p className="mt-5 text-2xl">{money(product.price)}</p>
                <p className="mt-4 text-xs text-[#737e65]">
                  ★★★★★{' '}
                  <span className="ml-2 text-stone-500">
                    Thoughtfully crafted, beautifully made
                  </span>
                </p>
                <p className="my-7 text-sm leading-7 text-stone-500">{product.description}</p>
                <p className="text-xs">
                  Finish: <strong>{finish}</strong>
                </p>
                <div className="mt-4 flex gap-3">
                  {['Natural', 'Walnut', 'Ivory'].map((f, i) => (
                    <button
                      key={f}
                      onClick={() => setFinish(f)}
                      aria-label={f}
                      className={`h-9 w-9 rounded-full border-4 border-white ring-1 ${finish === f ? 'ring-[#69745d]' : 'ring-stone-200'} ${['bg-[#bda582]', 'bg-[#65503e]', 'bg-[#ded8cb]'][i]}`}
                    />
                  ))}
                </div>
                <div className="mt-8 flex gap-3">
                  <div className="flex items-center border border-stone-300">
                    <button
                      aria-label="Decrease quantity"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="p-3"
                    >
                      −
                    </button>
                    <span className="px-2 text-sm">{quantity}</span>
                    <button
                      aria-label="Increase quantity"
                      onClick={() => setQuantity((q) => Math.min(20, q + 1))}
                      className="p-3"
                    >
                      +
                    </button>
                  </div>
                  <button onClick={() => add(product, quantity)} className={`${btn} flex-1`}>
                    Add to bag <Icon name="bag" className="h-4 w-4" />
                  </button>
                  <button
                    aria-label="Save to wishlist"
                    onClick={() => wish(product.id)}
                    className={`border border-stone-300 p-4 ${wishes.includes(product.id) ? 'text-[#925746]' : ''}`}
                  >
                    <Icon name="heart" />
                  </button>
                </div>
                <div className="mt-6 flex items-center gap-3 text-xs text-stone-500">
                  <Icon name="truck" /> Complimentary shipping over $150
                </div>
                {[
                  [
                    'Details & materials',
                    'Made with carefully sourced natural materials. Small variations in tone and texture are part of its character.',
                  ],
                  [
                    'Care guide',
                    'Dust gently with a soft, dry cloth. Keep away from prolonged direct sunlight and excess moisture.',
                  ],
                  [
                    'Delivery & returns',
                    'Dispatched in 3–5 business days. Return unused pieces within 30 days. Contact hello@forme.design for assistance.',
                  ],
                ].map(([t, d]) => (
                  <details key={t} className="border-b border-stone-200 py-5 text-xs">
                    <summary className="cursor-pointer">{t}</summary>
                    <p className="mt-4 leading-6 text-stone-500">{d}</p>
                  </details>
                ))}
              </div>
            </div>
            <h2 className="font-editorial mb-8 mt-20 text-3xl">Better together.</h2>
            <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
              {products
                .filter((p) => p.id !== product.id)
                .slice(0, 4)
                .map(card)}
            </div>
          </section>
        )}
        {page === 'wishlist' && (
          <section className="mx-auto max-w-[1320px] px-6 py-14 md:px-16">
            {title(
              'SAVED FOR SOMEDAY',
              'Your wish list.',
              'A collection of things you love. Make them part of your everyday.',
            )}
            <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
              {products.filter((p) => wishes.includes(p.id)).map(card)}
            </div>
            {!wishes.length && (
              <div className="py-14 text-center">
                <Icon name="heart" className="mx-auto h-10 w-10 text-stone-400" />
                <p className="my-6 text-sm text-stone-500">
                  Keep your favorite pieces close. Tap the heart on any product to save it here.
                </p>
                <Link href="/shop" className={btn}>
                  Find something to love <Icon name="arrow" />
                </Link>
              </div>
            )}
          </section>
        )}
        {(page === 'cart' || page === 'checkout') && (
          <section className="mx-auto max-w-[1200px] px-6 py-14 md:px-12">
            {title(
              page === 'cart' ? 'A FEW GOOD THINGS' : 'THE FINAL DETAILS',
              page === 'cart' ? 'Your shopping bag.' : 'Make yourself at home.',
            )}
            {orderId ? (
              <div className="rounded-lg bg-[#f3f4ed] p-10 text-center">
                <Icon name="check" className="mx-auto h-12 w-12 text-[#647253]" />
                <h2 className="font-editorial mt-5 text-3xl">
                  Thank you. A little more home is on its way.
                </h2>
                <p className="mt-5 text-sm">Order reference: {orderId}</p>
                <p className="mt-4 text-sm text-stone-500">
                  Payment is due on delivery. We’ll prepare your pieces within 3–5 business days.
                </p>
                <Link className={`${btn} mt-7`} href="/tracking">
                  Track your order <Icon name="arrow" />
                </Link>
              </div>
            ) : !bag.length ? (
              <div className="py-10 text-center">
                <p className="mb-7 text-sm text-stone-500">
                  Your bag is waiting for something wonderful.
                </p>
                <Link href="/shop" className={btn}>
                  Explore the collection <Icon name="arrow" />
                </Link>
              </div>
            ) : (
              <div className="grid items-start gap-12 md:grid-cols-[1fr_340px]">
                {page === 'cart' ? (
                  <div>
                    {bag.map((item, i) => {
                      const p = products.find((p) => p.id === item.id)
                      if (!p) return null
                      return (
                        <div
                          key={`${item.id}-${item.finish}`}
                          className="flex gap-5 border-b border-stone-200 py-6"
                        >
                          <Link
                            href={`/products/${p.slug}`}
                            className="relative h-32 w-28 shrink-0 overflow-hidden rounded bg-stone-100"
                          >
                            {picture(p, '')}
                          </Link>
                          <div className="flex flex-1 flex-col">
                            <div className="flex justify-between gap-3">
                              <Link href={`/products/${p.slug}`} className="text-sm">
                                {p.name}
                              </Link>
                              <span className="text-sm">{money(p.price * item.qty)}</span>
                            </div>
                            <p className="mt-2 text-xs text-stone-500">Finish: {item.finish}</p>
                            <div className="mt-auto flex items-center justify-between">
                              <div className="flex items-center border border-stone-200 text-xs">
                                <button
                                  aria-label={`Decrease ${p.name}`}
                                  onClick={() =>
                                    setBag((b) =>
                                      b.map((x, j) =>
                                        j === i ? { ...x, qty: Math.max(1, x.qty - 1) } : x,
                                      ),
                                    )
                                  }
                                  className="px-3 py-2"
                                >
                                  −
                                </button>
                                <span className="px-3">{item.qty}</span>
                                <button
                                  aria-label={`Increase ${p.name}`}
                                  onClick={() =>
                                    setBag((b) =>
                                      b.map((x, j) =>
                                        j === i ? { ...x, qty: Math.min(20, x.qty + 1) } : x,
                                      ),
                                    )
                                  }
                                  className="px-3 py-2"
                                >
                                  +
                                </button>
                              </div>
                              <button
                                onClick={() => setBag((b) => b.filter((_, j) => j !== i))}
                                className="text-[10px] text-stone-500 underline underline-offset-4"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                    <Link
                      href="/shop"
                      className="mt-7 inline-block text-xs underline underline-offset-4"
                    >
                      Continue exploring
                    </Link>
                  </div>
                ) : (
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault()
                      setBusy(true)
                      setMessage('')
                      const result = await placeOrder(new FormData(e.currentTarget), bag)
                      setBusy(false)
                      if (result.error) setMessage(result.error)
                      else if (result.id) {
                        setOrderId(result.id)
                        setBag([])
                        setToast('Your order has been placed')
                      }
                    }}
                    className="space-y-6"
                  >
                    {!account && (
                      <div className="rounded border border-stone-200 p-5 text-sm">
                        Already feeling at home?{' '}
                        <Link href="/login" className="underline">
                          Sign in
                        </Link>{' '}
                        or{' '}
                        <Link href="/signup" className="underline">
                          create an account
                        </Link>{' '}
                        to place your order.
                      </div>
                    )}
                    <h2 className="font-editorial text-2xl">01 / Delivery address</h2>
                    {[
                      ['name', 'Full name'],
                      ['street', 'Street address'],
                      ['city', 'City'],
                      ['postal', 'Postal / ZIP code'],
                      ['country', 'Country'],
                    ].map(([n, l]) => (
                      <label key={n} className="block text-xs">
                        {l}
                        <input
                          required
                          maxLength={180}
                          name={n}
                          autoComplete={
                            n === 'name'
                              ? 'name'
                              : n === 'street'
                                ? 'street-address'
                                : n === 'postal'
                                  ? 'postal-code'
                                  : n === 'country'
                                    ? 'country-name'
                                    : 'address-level2'
                          }
                          className={`${field} mt-2`}
                        />
                      </label>
                    ))}
                    <h2 className="font-editorial pt-4 text-2xl">02 / Delivery</h2>
                    <div className="rounded border border-[#69745d] bg-[#f6f6f0] p-5 text-sm">
                      Standard delivery · 3–5 business days{' '}
                      <span className="mt-2 block text-xs text-stone-500">
                        {shipping ? money(shipping) : 'Complimentary'}
                      </span>
                    </div>
                    <h2 className="font-editorial pt-4 text-2xl">03 / Payment</h2>
                    <div className="rounded border border-[#69745d] p-5 text-sm">
                      Pay on delivery
                      <p className="mt-2 text-xs leading-6 text-stone-500">
                        No payment taken online. Pay the full order total when your pieces arrive.
                        Card payments are not currently available.
                      </p>
                    </div>
                    <p role="alert" className="text-xs text-red-800">
                      {message}
                    </p>
                    <button disabled={busy || !account} className={`${btn} w-full`}>
                      {busy ? 'Placing your order…' : 'Place order · ' + money(subtotal + shipping)}
                      <Icon name="arrow" />
                    </button>
                  </form>
                )}
                {summary}
              </div>
            )}
          </section>
        )}
        {(page === 'login' || page === 'signup') && (
          <section className="mx-auto grid max-w-5xl gap-12 px-6 py-16 md:grid-cols-2 md:gap-20">
            <div className="relative hidden min-h-[530px] overflow-hidden rounded-lg md:block">
              <Image
                src="/images/welcome.jpg"
                alt="Welcome to a more considered home"
                fill
                sizes="45vw"
                className="object-cover"
              />
              <div className="absolute bottom-10 left-8 right-8 text-white">
                <p className="text-[9px] tracking-widest">GOOD TO HAVE YOU HERE</p>
                <h2 className="font-editorial mt-3 text-4xl">A little more home.</h2>
              </div>
            </div>
            <form
              className="self-center"
              onSubmit={async (e) => {
                e.preventDefault()
                setBusy(true)
                const r = await accountAction(page, new FormData(e.currentTarget))
                setBusy(false)
                if (r.error) setMessage(r.error)
                else {
                  setToast(`Welcome ${r.name}`)
                  router.push('/account')
                }
              }}
            >
              {title(
                'WELCOME TO FORME',
                page === 'signup' ? 'Make yourself at home.' : 'Welcome back.',
                page === 'signup'
                  ? 'Create an account to save favorites and follow your orders.'
                  : 'Sign in to your own little corner of FORME.',
              )}
              {page === 'signup' && (
                <label className="mb-5 block text-xs">
                  Your name
                  <input name="name" required autoComplete="name" className={`${field} mt-2`} />
                </label>
              )}
              <label className="mb-5 block text-xs">
                Email address
                <input
                  name="email"
                  required
                  type="email"
                  autoComplete="email"
                  className={`${field} mt-2`}
                />
              </label>
              <label className="mb-5 block text-xs">
                Password
                <input
                  name="password"
                  required
                  minLength={8}
                  type="password"
                  autoComplete={page === 'signup' ? 'new-password' : 'current-password'}
                  className={`${field} mt-2`}
                />
                <span className="mt-2 block text-[10px] text-stone-500">At least 8 characters</span>
              </label>
              <p role="alert" className="mb-4 text-xs text-red-800">
                {message}
              </p>
              <button disabled={busy} className={`${btn} w-full`}>
                {busy ? 'One moment…' : page === 'signup' ? 'Create account' : 'Sign in'}
                <Icon name="arrow" />
              </button>
              <p className="mt-7 text-center text-xs text-stone-500">
                {page === 'signup' ? 'Already part of the family?' : 'New to FORME?'}{' '}
                <Link
                  className="text-[#343c2e] underline underline-offset-4"
                  href={page === 'signup' ? '/login' : '/signup'}
                >
                  {page === 'signup' ? 'Sign in' : 'Create an account'}
                </Link>
              </p>
            </form>
          </section>
        )}
        {page === 'account' && (
          <section className="mx-auto max-w-5xl px-6 py-16">
            {title('YOUR CORNER OF FORME', account ? `At home, ${account.name}.` : 'Your account.')}
            {account ? (
              <>
                <div className="mb-10 flex flex-wrap items-center justify-between gap-6 rounded-lg bg-[#f5f5ef] p-7">
                  <div>
                    <h2 className="font-editorial text-2xl">Your details</h2>
                    <p className="mt-3 text-sm">{account.email}</p>
                  </div>
                  <button
                    onClick={async () => {
                      await logout()
                      setAccount(null)
                      router.push('/login')
                    }}
                    className="text-xs underline underline-offset-4"
                  >
                    Sign out
                  </button>
                </div>
                <h2 className="font-editorial text-3xl">Your orders</h2>
                {!account.orders.length ? (
                  <p className="my-6 text-sm text-stone-500">
                    Your story with us is just beginning.{' '}
                    <Link href="/shop" className="underline">
                      Find your first piece.
                    </Link>
                  </p>
                ) : (
                  account.orders.map((o) => (
                    <div
                      className="mt-5 flex flex-wrap justify-between gap-4 border-b border-stone-200 py-6 text-xs"
                      key={o.id}
                    >
                      <span>
                        {o.id}
                        <span className="mt-2 block text-stone-500">
                          {new Date(o.createdAt).toLocaleDateString()}
                        </span>
                      </span>
                      <span className="capitalize">{o.status}</span>
                      <span>{money(o.total ?? 0)}</span>
                      <Link href="/tracking" className="underline">
                        Track order
                      </Link>
                    </div>
                  ))
                )}
                <div className="mt-9 flex gap-7 text-sm">
                  <Link href="/wishlist" className="underline">
                    Your wishlist
                  </Link>
                  <Link href="/cart" className="underline">
                    Your bag
                  </Link>
                </div>
              </>
            ) : (
              <div className="py-10">
                <p className="mb-7 text-sm text-stone-500">
                  Sign in to view your details and orders.
                </p>
                <Link href="/login" className={btn}>
                  Sign in <Icon name="arrow" />
                </Link>
              </div>
            )}
          </section>
        )}
        {page === 'tracking' && (
          <section className="mx-auto max-w-2xl px-6 py-16">
            {title(
              'FROM OUR HOME TO YOURS',
              'Follow your good things.',
              'Enter your order reference to see where your pieces are. Sign in with the account used at checkout.',
            )}
            <form
              onSubmit={(e) => {
                e.preventDefault()
                setTracked(true)
              }}
            >
              <label className="text-xs">
                Order reference
                <input
                  required
                  value={tracking}
                  onChange={(e) => {
                    setTracking(e.target.value)
                    setTracked(false)
                  }}
                  placeholder="Your order reference"
                  className={`${field} mt-3`}
                />
              </label>
              <button className={`${btn} mt-5`}>
                Track order <Icon name="arrow" />
              </button>
            </form>
            {tracked &&
              (() => {
                const o = account?.orders.find((o) => o.id === tracking.trim())
                return o ? (
                  <div className="mt-10 rounded-lg bg-[#f5f5ef] p-7">
                    <p className="text-sm">Order {o.id}</p>
                    <p className="font-editorial mt-5 text-3xl capitalize">
                      {o.status === 'received' ? 'We have your order' : o.status}
                    </p>
                    <div className="mt-8 space-y-5">
                      {['received', 'preparing', 'shipped', 'delivered'].map((s, i) => (
                        <div
                          key={s}
                          className={`flex gap-4 text-xs capitalize ${i <= ['received', 'preparing', 'shipped', 'delivered'].indexOf(o.status ?? 'received') ? 'text-[#4d6140]' : 'text-stone-400'}`}
                        >
                          <span className="flex h-5 w-5 items-center justify-center rounded-full border">
                            {i + 1}
                          </span>
                          {s}
                        </div>
                      ))}
                    </div>
                    <p className="mt-7 text-xs">Total: {money(o.total ?? 0)} · Pay on delivery</p>
                  </div>
                ) : (
                  <p role="status" className="mt-8 text-sm text-stone-600">
                    {account
                      ? 'We could not find this order. Please check the reference in your account.'
                      : 'Please sign in to securely view your orders.'}{' '}
                    <Link href={account ? '/account' : '/login'} className="underline">
                      {account ? 'View orders' : 'Sign in'}
                    </Link>
                  </p>
                )
              })()}
          </section>
        )}
        {page === 'about' && (
          <section className="mx-auto max-w-5xl px-6 py-16">
            {title(
              'THE FORME PHILOSOPHY',
              'Less, but more meaningful.',
              'We believe a beautiful home is not about having more. It is about choosing well.',
            )}
            <div className="relative my-10 aspect-[16/8] overflow-hidden rounded-lg">
              <Image
                src="/images/forme-story.jpg"
                alt="The warmth of a FORME home"
                fill
                sizes="90vw"
                className="object-cover"
              />
            </div>
            <div className="mx-auto max-w-xl py-8">
              <h2 className="font-editorial text-3xl">Considered from the beginning.</h2>
              <p className="mt-6 text-sm leading-8 text-stone-500">
                FORME began with a simple idea: the objects we live with shape how we feel. We seek
                out honest materials, thoughtful makers, and enduring forms. Each piece in our
                collection is chosen for its ability to make everyday moments a little more
                beautiful.
              </p>
              <p className="mt-5 text-sm leading-8 text-stone-500">
                From the first cup of coffee to the quiet of a Sunday afternoon, we are here for the
                spaces in between. Welcome to a slower, more considered way of living.
              </p>
              <Link href="/shop" className={`${btn} mt-8`}>
                Find your FORME <Icon name="arrow" />
              </Link>
            </div>
          </section>
        )}
      </main>
      <section className="bg-[#e9ebdf] px-6 py-12">
        <div className="mx-auto flex max-w-[1200px] flex-col justify-between gap-7 md:flex-row md:items-center">
          <div>
            <p className="mb-3 text-[9px] tracking-[.18em] text-[#6e7862]">LET'S STAY CLOSE</p>
            <h2 className="font-editorial text-3xl">Good things in your inbox.</h2>
            <p className="mt-3 text-[11px] text-stone-500">
              New collections, thoughtful stories, and a little inspiration. Never too much.
            </p>
          </div>
          <form
            className="w-full md:w-[350px]"
            onSubmit={async (e) => {
              e.preventDefault()
              const form = e.currentTarget
              const r = await subscribe(String(new FormData(form).get('email')))
              setToast(r.error ?? 'You’re on the list. Welcome to FORME.')
              if (!r.error) form.reset()
            }}
          >
            <div className="flex border-b border-[#969d85]">
              <input
                name="email"
                type="email"
                required
                aria-label="Newsletter email"
                placeholder="Your email address"
                className="w-full bg-transparent py-3 text-xs outline-none"
              />
              <button aria-label="Subscribe" className="px-3">
                <Icon name="arrow" className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-3 text-[8px] text-stone-500">
              Only the good stuff. Unsubscribe anytime.
            </p>
          </form>
        </div>
      </section>
      <footer className="bg-[#f8f8f4] px-6 pb-6 pt-14 md:px-16">
        <div className="mx-auto grid max-w-[1300px] grid-cols-2 gap-10 pb-14 md:grid-cols-[2fr_1fr_1fr_1fr]">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="text-3xl font-medium tracking-[.15em]">
              FORME®
            </Link>
            <p className="mt-5 max-w-52 text-[11px] leading-6 text-stone-500">
              Considered design for beautiful living.
              <br />A little less. A little better.
            </p>
            <p className="mt-5 text-[10px] text-stone-500">hello@forme.design</p>
          </div>
          {[
            [
              'Explore',
              [
                ['Shop all', '/shop'],
                ['New arrivals', '/shop?sort=new'],
                ['Furniture', '/shop?category=Living'],
                ['Home & living', '/shop?category=Objects'],
              ],
            ],
            [
              'Here to help',
              [
                ['My account', '/account'],
                ['Track your order', '/tracking'],
                ['Shopping bag', '/cart'],
                ['Wishlist', '/wishlist'],
              ],
            ],
            [
              'About FORME',
              [
                ['Our story', '/about'],
                ['Our philosophy', '/about'],
                ['Become a member', '/signup'],
                ['Contact us', 'mailto:hello@forme.design'],
              ],
            ],
          ].map(([t, links]) => (
            <div key={t as string}>
              <h3 className="mb-5 text-[11px] font-medium">{t as string}</h3>
              <div className="flex flex-col gap-3.5 text-[10px] text-stone-500">
                {(links as string[][]).map(([l, h]) => (
                  <Link href={h} key={l} className="hover:text-stone-950">
                    {l}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mx-auto flex max-w-[1300px] flex-wrap justify-between gap-5 border-t border-stone-200 pt-6 text-[8px] text-stone-500">
          <p>© {new Date().getFullYear()} FORME. Thoughtfully yours.</p>
          <p>Designed for living. Made to last.</p>
          <p>United States · USD $</p>
        </div>
      </footer>
      {toast && (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 z-50 flex w-[calc(100%-32px)] max-w-lg -translate-x-1/2 items-center justify-between gap-5 rounded bg-[#343c2e] px-6 py-5 text-xs text-white shadow-xl"
        >
          <span>{toast}</span>
          <Link href="/cart" className="shrink-0 underline underline-offset-4">
            View bag
          </Link>
          <button aria-label="Dismiss notification" onClick={() => setToast('')}>
            <Icon name="close" className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )
}

export default function Storefront(props: { page: string; products: Product[]; slug?: string }) {
  return <StorefrontContent key={props.page} {...props} />
}
