import type { FormEvent } from 'react'
import './ChatInput.css'

type Props = {
  value: string
  disabled: boolean
  onChange: (value: string) => void
  onSubmit: (value: string) => void
}

function ChatInput({ value, disabled, onChange, onSubmit }: Props) {
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (value.trim()) onSubmit(value.trim())
  }

  return (
    <form className="chat-input" onSubmit={handleSubmit}>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
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
