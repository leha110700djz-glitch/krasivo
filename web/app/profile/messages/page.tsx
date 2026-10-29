'use client'

import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { MessageSquare, Send, CheckCheck } from 'lucide-react'
import api from '@/lib/api'
import { useAuthStore } from '@/store/auth'
import { cn } from '@/lib/utils'

interface UserBrief {
  id: string
  name: string
  avatar_url?: string | null
}

interface Conversation {
  other_user: UserBrief
  salon_id: string
  last_message: string
  unread_count: number
  last_sent_at: string
}

interface ChatMessage {
  id: string
  salon_id: string
  sender_id: string
  recipient_id: string
  body: string
  is_read: boolean
  sent_at: string
}

function Avatar({ user }: { user: UserBrief }) {
  const initials = user.name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()

  if (user.avatar_url) {
    return (
      <img
        src={user.avatar_url}
        alt={user.name}
        className="w-9 h-9 rounded-xl object-cover shrink-0"
      />
    )
  }
  return (
    <div className="w-9 h-9 rounded-xl bg-primary-100 text-primary-700 font-semibold text-sm flex items-center justify-center shrink-0">
      {initials}
    </div>
  )
}

function formatTime(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const hours = diff / 3_600_000
  if (hours < 24) return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
}

export default function ProfileMessagesPage() {
  const token = useAuthStore((s) => s.token)
  const { data: currentUser } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.get<{ id: string }>('/auth/me', token!),
    enabled: !!token,
  })
  const qc = useQueryClient()

  const [selected, setSelected] = useState<Conversation | null>(null)
  const [inputText, setInputText] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // List of all my conversations — poll every 10 s
  const { data: conversations = [] } = useQuery<Conversation[]>({
    queryKey: ['conversations-client'],
    queryFn: () => api.get<Conversation[]>('/messages/conversations', token!),
    enabled: !!token,
    refetchInterval: 10_000,
  })

  // Message history — poll every 10 s when a conversation is open
  const { data: messages = [] } = useQuery<ChatMessage[]>({
    queryKey: ['chat-messages-client', selected?.salon_id, selected?.other_user.id],
    queryFn: () =>
      api.get<ChatMessage[]>(
        `/messages/${selected!.other_user.id}`,
        token!,
        { salon_id: selected!.salon_id }
      ),
    enabled: !!token && !!selected,
    refetchInterval: 10_000,
  })

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMutation = useMutation({
    mutationFn: async (body: string) => {
      await api.post(
        '/messages',
        {
          recipient_id: selected!.other_user.id,
          salon_id: selected!.salon_id,
          body,
        },
        token!
      )
    },
    onSuccess: () => {
      setInputText('')
      qc.invalidateQueries({
        queryKey: ['chat-messages-client', selected?.salon_id, selected?.other_user.id],
      })
      qc.invalidateQueries({ queryKey: ['conversations-client'] })
    },
  })

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputText.trim() || sendMutation.isPending) return
    sendMutation.mutate(inputText.trim())
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend(e as unknown as React.FormEvent)
    }
  }

  return (
    <div className="max-w-5xl mx-auto py-6 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Сообщения</h1>
        <p className="text-gray-500 text-sm mt-1">Переписка с салонами красоты</p>
      </div>

      <div className="flex bg-white rounded-2xl border border-gray-200 overflow-hidden" style={{ height: '70vh' }}>
        {/* Left: conversation list */}
        <div className="w-64 border-r border-gray-100 flex flex-col">
          <div className="px-4 py-3 border-b border-gray-50">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Диалоги</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-4 py-8">
                <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mb-3">
                  <MessageSquare size={20} className="text-gray-300" />
                </div>
                <p className="text-sm text-gray-400">Нет сообщений</p>
                <p className="text-xs text-gray-300 mt-1">Напишите нам из карточки салона</p>
              </div>
            ) : (
              conversations.map((conv) => {
                const isActive =
                  selected?.other_user.id === conv.other_user.id &&
                  selected?.salon_id === conv.salon_id
                return (
                  <button
                    key={`${conv.salon_id}-${conv.other_user.id}`}
                    onClick={() => setSelected(conv)}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-3 border-b border-gray-50 text-left transition-colors',
                      isActive ? 'bg-primary-50' : 'hover:bg-gray-50'
                    )}
                  >
                    <Avatar user={conv.other_user} />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline">
                        <span className="text-sm font-medium text-gray-900 truncate">
                          {conv.other_user.name}
                        </span>
                        <span className="text-xs text-gray-400 ml-1 shrink-0">
                          {formatTime(conv.last_sent_at)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center mt-0.5">
                        <p className="text-xs text-gray-400 truncate">{conv.last_message}</p>
                        {conv.unread_count > 0 && (
                          <span className="ml-1 bg-primary-600 text-white text-xs rounded-full px-1.5 py-0.5 shrink-0 min-w-[18px] text-center">
                            {conv.unread_count}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* Right: chat area */}
        <div className="flex-1 flex flex-col bg-gray-50">
          {!selected ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                <MessageSquare size={28} className="text-gray-300" />
              </div>
              <p className="text-gray-400 text-sm">Выберите диалог слева</p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="flex items-center gap-3 px-5 py-3.5 bg-white border-b border-gray-100">
                <Avatar user={selected.other_user} />
                <div>
                  <p className="text-sm font-semibold text-gray-900">{selected.other_user.name}</p>
                  <p className="text-xs text-gray-400">Представитель салона</p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-400 text-sm">Начните диалог!</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMine = msg.sender_id === currentUser?.id
                    return (
                      <div
                        key={msg.id}
                        className={cn('flex', isMine ? 'justify-end' : 'justify-start')}
                      >
                        <div
                          className={cn(
                            'max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl text-sm',
                            isMine
                              ? 'bg-primary-600 text-white rounded-br-sm'
                              : 'bg-white text-gray-900 rounded-bl-sm shadow-sm'
                          )}
                        >
                          <p className="whitespace-pre-wrap break-words">{msg.body}</p>
                          <div
                            className={cn(
                              'flex items-center gap-1 mt-1 text-xs',
                              isMine ? 'text-primary-200 justify-end' : 'text-gray-400'
                            )}
                          >
                            {formatTime(msg.sent_at)}
                            {isMine && msg.is_read && <CheckCheck size={12} />}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form
                onSubmit={handleSend}
                className="px-4 py-3 bg-white border-t border-gray-100 flex items-end gap-3"
              >
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Напишите сообщение..."
                  rows={1}
                  className="flex-1 resize-none border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary-400 transition-colors max-h-28 overflow-y-auto"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim() || sendMutation.isPending}
                  className="w-10 h-10 bg-primary-600 hover:bg-primary-700 disabled:opacity-40 rounded-xl flex items-center justify-center transition-colors shrink-0"
                >
                  <Send size={16} className="text-white" />
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
