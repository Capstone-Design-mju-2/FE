import { useEffect, type RefObject } from 'react'

// 패널 안에서 Tab으로 이동할 수 있는 요소
const FOCUSABLE =
  'button:not([disabled]), input:not([disabled]), select:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'

// 오른쪽 패널(주문·리뷰) 공통 동작: 열릴 때 닫기 버튼으로 포커스, Esc로 닫기,
// aria-modal 동안 Tab·Shift+Tab이 패널 밖으로 나가지 않게 처음·끝 요소에서 순환.
// focusKey가 바뀌면(예: 주문 완료로 내용 전환) 닫기 버튼으로 다시 포커스를 옮긴다.
// 닫힌 뒤 원래 버튼으로 포커스를 돌려주는 일은 패널을 연 쪽이 맡는다.
export function useDialog(
  panelRef: RefObject<HTMLElement | null>,
  closeRef: RefObject<HTMLButtonElement | null>,
  onClose: () => void,
  focusKey?: unknown,
) {
  useEffect(() => {
    closeRef.current?.focus()
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key !== 'Tab' || !panelRef.current) return
      const focusable = [...panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)]
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const active = document.activeElement
      const outside = !panelRef.current.contains(active)
      if (e.shiftKey && (active === first || outside)) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && (active === last || outside)) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [panelRef, closeRef, onClose, focusKey])
}
