import { useEffect, useRef, type FormEvent, type RefObject } from 'react'
import './ChatInput.css'

type Props = {
  inputRef: RefObject<HTMLInputElement | null>
  value: string
  disabled: boolean
  onChange: (value: string) => void
  onSubmit: (value: string) => void
}

function ChatInput({ inputRef, value, disabled, onChange, onSubmit }: Props) {
  const composing = useRef(false)
  const wasDisabled = useRef(disabled)

  useEffect(() => {
    if (wasDisabled.current && !disabled) inputRef.current?.focus()
    wasDisabled.current = disabled
  }, [disabled, inputRef])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!disabled && !composing.current && value.trim()) onSubmit(value.trim())
  }

  return (
    <form className="chat-input" onSubmit={handleSubmit}>
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onCompositionStart={() => { composing.current = true }}
        onCompositionEnd={() => { composing.current = false }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (composing.current || e.nativeEvent.isComposing || e.keyCode === 229)) {
            e.preventDefault()
          }
        }}
        disabled={disabled}
        placeholder="피부 타입, 사용감, 예산, 받을 날짜를 말해 주세요"
        aria-label="질문 입력"
      />
      <button type="submit" disabled={disabled || !value.trim()}>
        보내기
      </button>
    </form>
  )
}

export default ChatInput
