import type { Inventory } from '../types/api'

export function formatPrice(won: number): string {
  return `${won.toLocaleString('ko-KR')}원`
}

// "YYYY-MM-DD" → "오늘 도착" / "내일 도착" / "9/30 도착"
export function formatDelivery(date: string | null, today = new Date()): string {
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return '배송일 확인 불가'

  const [y, m, d] = date.split('-').map(Number)
  const target = new Date(y, m - 1, d)
  if (Number.isNaN(target.getTime()) ||
    target.getFullYear() !== y || target.getMonth() !== m - 1 || target.getDate() !== d) {
    return '배송일 확인 불가'
  }
  const base = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const days = Math.round((target.getTime() - base.getTime()) / 86_400_000)

  if (days === 0) return '오늘 도착'
  if (days === 1) return '내일 도착'
  return `${m}/${d} 도착`
}

export type StockTone = 'in' | 'out' | 'unknown'

// BE docs/API.md 4절 화면 표시 규칙
export function formatInventory(inventory: Inventory): { label: string; tone: StockTone } {
  switch (inventory.status) {
    case 'IN_STOCK': {
      const stock = inventory.quantity != null ? `재고 ${inventory.quantity}개` : '재고 있음'
      return { label: `${stock} · ${formatDelivery(inventory.estimatedDeliveryDate)}`, tone: 'in' }
    }
    case 'OUT_OF_STOCK':
      return { label: '품절', tone: 'out' }
    case 'UNKNOWN':
      return { label: '재고 확인 불가', tone: 'unknown' }
  }
}
