import { products } from '@/lib/catalog'
// Local demo-mode actions. These run in the browser and do not call any API.
const read = <T,>(key: string, fallback: T): T => {
  try { const value = localStorage.getItem(key); return value ? JSON.parse(value) as T : fallback } catch { return fallback }
}
const write = (key: string, value: unknown) => localStorage.setItem(key, JSON.stringify(value))
type DemoOrder = { id: string; status: string; total: number; createdAt: string }
type DemoUser = { name: string; email: string; password: string; basket: unknown[]; wishlist: string[] }

export async function getAccount() {
  const user = read<DemoUser | null>('forme-user', null)
  if (!user) return null
  return { name: user.name, email: user.email, basket: user.basket ?? [], wishlist: user.wishlist ?? [], orders: read<DemoOrder[]>('forme-orders', []) }
}
export async function accountAction(mode: string, form: FormData) {
  const email = String(form.get('email') ?? '').trim().toLowerCase()
  const password = String(form.get('password') ?? '')
  const name = String(form.get('name') ?? '').trim()
  if (!/^\S+@\S+\.\S+$/.test(email) || password.length < 8) return { error: 'Enter a valid email and a password of at least 8 characters.' }
  const existing = read<DemoUser | null>('forme-user', null)
  if (mode === 'signup') {
    if (!name) return { error: 'Please enter your name.' }
    const user: DemoUser = { name, email, password, basket: [], wishlist: [] }
    write('forme-user', user)
    write('forme-orders', [])
    return { name }
  }
  if (!existing || existing.email !== email || existing.password !== password) return { error: 'No matching demo account. Create an account first.' }
  return { name: existing.name }
}
export async function logout() { localStorage.removeItem('forme-user') }
export async function saveShopping(basket: unknown, wishlist: string[]) {
  const user = read<DemoUser | null>('forme-user', null)
  if (user) write('forme-user', { ...user, basket, wishlist })
}
export async function placeOrder(form: FormData, items: { id: string; qty: number; finish: string }[]) {
  const user = read<DemoUser | null>('forme-user', null)
  if (!user) return { error: 'Please create a demo account before placing your order.' }
  const required = ['name', 'street', 'city', 'postal', 'country']
  if (required.some((key) => !String(form.get(key) ?? '').trim()) || !items.length) return { error: 'Please complete your delivery address and bag.' }
  const id = `FORME-${Date.now().toString(36).toUpperCase()}`
  const subtotal = items.reduce((sum, item) => sum + (products.find((product) => product.id === item.id)?.price ?? 0) * item.qty, 0)
  const total = subtotal + (subtotal >= 150 ? 0 : 12)
  const orders = read<DemoOrder[]>('forme-orders', [])
  orders.unshift({ id, status: 'received', total, createdAt: new Date().toISOString() })
  write('forme-orders', orders)
  write('forme-user', { ...user, basket: [] })
  return { id }
}
export async function subscribe(email: string) {
  if (!/^\S+@\S+\.\S+$/.test(email) || email.length > 200) return { error: 'Please enter a valid email address.' }
  const list = read<string[]>('forme-subscribers', [])
  if (list.includes(email.toLowerCase())) return { error: 'You are already on the demo list.' }
  write('forme-subscribers', [...list, email.toLowerCase()])
  return { success: true }
}
