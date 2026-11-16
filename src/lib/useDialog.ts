import { useCallback, useEffect, useState, type RefObject } from 'react'

// OrderSheet.css의 나가는 움직임(sheet-out, fade-out) 시간과 같아야 한다.
export const SHEET_EXIT_MS = 260

// 창은 나가는 움직임이 끝난 뒤에 닫는다. 동작 줄이기를 켠 사람에게는 바로 닫는다.
export function useSheetClose(onClose: () => void) {
  const [closing, setClosing] = useState(false)

  const close = useCallback(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      onClose()
      return
    }
    setClosing(true)
  }, [onClose])

  useEffect(() => {
    if (!closing) return
    const timer = window.setTimeout(onClose, SHEET_EXIT_MS)
    return () => window.clearTimeout(timer)
  }, [closing, onClose])

  return { closing, close }
}

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
