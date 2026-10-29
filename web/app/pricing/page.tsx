'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Check,
  X,
  Zap,
  Star,
  Building2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

const PLANS = [
  {
    id: 'free',
    name: 'Старт',
    price: 0,
    period: 'навсегда',
    color: 'border-gray-200',
    badge: null,
    description: 'Для одного специалиста, который только начинает',
    features: [
      { text: 'До 50 записей в месяц', ok: true },
      { text: '1 мастер', ok: true },
      { text: 'Онлайн-запись через ссылку', ok: true },
      { text: 'Клиентская база (до 100 клиентов)', ok: true },
      { text: 'Push-уведомления', ok: true },
      { text: 'Напоминания клиентам', ok: true },
      { text: 'Несколько мастеров', ok: false },
      { text: 'Аналитика и отчёты', ok: false },
      { text: 'Рассылки по сегментам', ok: false },
      { text: 'Промокоды и акции', ok: false },
      { text: 'Расчёт зарплат', ok: false },
      { text: 'Подарочные сертификаты', ok: false },
    ],
    cta: 'Начать бесплатно',
    ctaHref: '/onboarding',
    ctaStyle: 'border border-gray-300 text-gray-700 hover:bg-gray-50',
  },
  {
    id: 'pro',
    name: 'Про',
    price: 1490,
    period: 'в месяц',
    color: 'border-violet-500',
    badge: 'Популярный',
    description: 'Для салона с командой до 10 мастеров',
    features: [
      { text: 'Неограниченные записи', ok: true },
      { text: 'До 10 мастеров', ok: true },
      { text: 'Виджет на сайт и соцсети', ok: true },
      { text: 'Неограниченная клиентская база', ok: true },
      { text: 'Push + SMS уведомления', ok: true },
      { text: 'Напоминания и запрос отзывов', ok: true },
      { text: 'Аналитика и отчёты', ok: true },
      { text: 'Промокоды и акции', ok: true },
      { text: 'Система лояльности', ok: true },
      { text: 'Расчёт зарплат', ok: true },
      { text: 'Рассылки по сегментам', ok: false },
      { text: 'Подарочные сертификаты', ok: false },
    ],
    cta: 'Попробовать 14 дней',
    ctaHref: '/onboarding?plan=pro',
    ctaStyle: 'bg-violet-700 text-white hover:bg-violet-800',
  },
  {
    id: 'business',
    name: 'Бизнес',
    price: 3490,
    period: 'в месяц',
    color: 'border-amber-400',
    badge: 'Всё включено',
    description: 'Для сетей салонов и крупного бизнеса',
    features: [
      { text: 'Неограниченные записи', ok: true },
      { text: 'Неограниченное число мастеров', ok: true },
      { text: 'Несколько филиалов', ok: true },
      { text: 'Неограниченная клиентская база', ok: true },
      { text: 'Push + SMS + WhatsApp', ok: true },
      { text: 'Напоминания и запрос отзывов', ok: true },
      { text: 'Расширенная аналитика + выгрузка', ok: true },
      { text: 'Промокоды и акции', ok: true },
      { text: 'Система лояльности', ok: true },
      { text: 'Расчёт зарплат и учёт смен', ok: true },
      { text: 'Рассылки по сегментам', ok: true },
      { text: 'Подарочные сертификаты', ok: true },
    ],
    cta: 'Связаться с нами',
    ctaHref: '/contact',
    ctaStyle: 'bg-amber-500 text-white hover:bg-amber-600',
  },
]

const COMPARISON = [
  {
    category: 'Записи',
    rows: [
      { feature: 'Онлайн-запись 24/7', us: true, dikidi: true, yclients: true },
      { feature: 'Виджет на сайт', us: true, dikidi: true, yclients: true },
      { feature: 'Запись через ВКонтакте', us: 'Скоро', dikidi: true, yclients: false },
      { feature: 'Оптимальное время (без пробелов)', us: true, dikidi: true, yclients: true },
      { feature: 'Управление ресурсами (кабинеты)', us: true, dikidi: true, yclients: true },
    ],
  },
  {
    category: 'CRM и клиенты',
    rows: [
      { feature: 'Клиентская база', us: true, dikidi: true, yclients: true },
      { feature: 'История визитов', us: true, dikidi: true, yclients: true },
      { feature: 'Сегментация клиентов', us: true, dikidi: 'Платно', yclients: true },
      { feature: 'Чёрный список', us: true, dikidi: true, yclients: true },
      { feature: 'Чат с клиентом', us: true, dikidi: true, yclients: false },
    ],
  },
  {
    category: 'Уведомления и маркетинг',
    rows: [
      { feature: 'Push-уведомления', us: true, dikidi: true, yclients: true },
      { feature: 'SMS напоминания', us: 'Про+', dikidi: 'Платно', yclients: 'Платно' },
      { feature: 'Рассылки по сегментам', us: 'Бизнес', dikidi: 'Платно', yclients: 'Платно' },
      { feature: 'Промокоды и акции', us: 'Про+', dikidi: 'Платно', yclients: true },
      { feature: 'Подарочные сертификаты', us: 'Бизнес', dikidi: 'Платно', yclients: 'Платно' },
      { feature: 'Система лояльности / бонусы', us: true, dikidi: 'Платно', yclients: 'Платно' },
    ],
  },
  {
    category: 'Финансы и аналитика',
    rows: [
      { feature: 'Базовая аналитика', us: true, dikidi: true, yclients: true },
      { feature: 'Расширенные отчёты + выгрузка', us: 'Про+', dikidi: 'Платно', yclients: 'Платно' },
      { feature: 'Расчёт зарплат', us: 'Про+', dikidi: 'Платно', yclients: 'Платно' },
      { feature: 'Управление сменами', us: 'Про+', dikidi: true, yclients: true },
      { feature: 'Складской учёт', us: 'Скоро', dikidi: 'Платно', yclients: 'Платно' },
    ],
  },
  {
    category: 'Особенности',
    rows: [
      { feature: 'Мобильное приложение (iOS + Android)', us: true, dikidi: true, yclients: true },
      { feature: 'Синхронизация с Google Calendar', us: 'Скоро', dikidi: false, yclients: false },
      { feature: 'Учёт часовых поясов', us: true, dikidi: false, yclients: true },
      { feature: 'ИИ-рекомендации времени', us: 'Скоро', dikidi: false, yclients: false },
      { feature: 'Открытый API', us: true, dikidi: 'Платно', yclients: 'Платно' },
    ],
  },
]

const FAQ = [
  {
    q: 'Нужна ли кредитная карта для пробного периода?',
    a: 'Нет. 14 дней тарифа Про — полностью бесплатно, без ввода данных карты. По истечении срока аккаунт автоматически переходит на тариф Старт.',
  },
  {
    q: 'Могу я поменять тариф в любой момент?',
    a: 'Да. Вы можете перейти на более высокий тариф в любой день — мы пересчитаем сумму пропорционально оставшимся дням. Переход на более низкий тариф — с конца текущего периода.',
  },
  {
    q: 'Что произойдёт с данными, если я отменю подписку?',
    a: 'Данные сохраняются 90 дней после отмены. Вы можете скачать всю клиентскую базу и историю записей в CSV.',
  },
  {
    q: 'Как устроено ценообразование для сетей?',
    a: 'Тариф Бизнес включает до 3 филиалов. Каждый дополнительный филиал — +690 ₽/мес. Для сетей от 5 точек — индивидуальные условия.',
  },
  {
    q: 'Есть ли комиссия с записей из каталога?',
    a: 'Нет. В отличие от DIKIDI, мы не берём процент с записей через наш каталог. Платите только фиксированную подписку.',
  },
]

function CellValue({ val }: { val: boolean | string }) {
  if (val === true) return <Check size={18} className="text-green-600 mx-auto" />
  if (val === false) return <X size={18} className="text-gray-300 mx-auto" />
  return <span className="text-xs text-gray-500 font-medium">{val}</span>
}

export default function PricingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      {/* Hero */}
      <section className="py-16 px-4 text-center bg-gradient-to-b from-violet-50 to-white">
        <div className="max-w-3xl mx-auto">
          <span className="inline-block bg-violet-100 text-violet-700 text-xs font-semibold px-3 py-1 rounded-full mb-4 uppercase tracking-wide">
            Честное ценообразование
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Тарифы без скрытых платежей
          </h1>
          <p className="text-lg text-gray-500 max-w-xl mx-auto">
            Никакой комиссии с записей. Платите только за подписку — и получаете полный контроль над бизнесом.
          </p>
        </div>
      </section>

      {/* Plans */}
      <section className="py-12 px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-2xl border-2 ${plan.color} p-6 flex flex-col`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-violet-700 text-white text-xs font-bold px-3 py-1 rounded-full">
                    {plan.badge}
                  </span>
                </div>
              )}
              <div className="mb-4">
                <h2 className="text-xl font-bold text-gray-900">{plan.name}</h2>
                <p className="text-sm text-gray-500 mt-1">{plan.description}</p>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-bold text-gray-900">
                  {plan.price === 0 ? 'Бесплатно' : `${plan.price.toLocaleString('ru-RU')} ₽`}
                </span>
                {plan.price > 0 && (
                  <span className="text-gray-400 text-sm ml-2">{plan.period}</span>
                )}
              </div>
              <ul className="space-y-2 flex-1 mb-6">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    {f.ok ? (
                      <Check size={16} className="text-green-600 mt-0.5 shrink-0" />
                    ) : (
                      <X size={16} className="text-gray-300 mt-0.5 shrink-0" />
                    )}
                    <span className={f.ok ? 'text-gray-700' : 'text-gray-400'}>{f.text}</span>
                  </li>
                ))}
              </ul>
              <Link href={plan.ctaHref}>
                <button className={`w-full py-3 rounded-xl font-semibold text-sm transition-colors ${plan.ctaStyle}`}>
                  {plan.cta}
                </button>
              </Link>
            </div>
          ))}
        </div>
        <p className="text-center text-sm text-gray-400 mt-6">
          * Все цены указаны с НДС. Оплата — картой или по счёту.
        </p>
      </section>

      {/* Comparison table */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-2">
            Красиво vs конкуренты
          </h2>
          <p className="text-gray-500 text-center mb-10">
            Объективное сравнение с DIKIDI и YCLIENTS
          </p>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-4 gap-0 border-b border-gray-100">
              <div className="p-4" />
              <div className="p-4 text-center border-l border-gray-100">
                <div className="font-bold text-violet-700 text-sm">✨ Красиво</div>
                <div className="text-xs text-gray-400">наш сервис</div>
              </div>
              <div className="p-4 text-center border-l border-gray-100">
                <div className="font-semibold text-gray-700 text-sm">DIKIDI</div>
                <div className="text-xs text-gray-400">конкурент</div>
              </div>
              <div className="p-4 text-center border-l border-gray-100">
                <div className="font-semibold text-gray-700 text-sm">YCLIENTS</div>
                <div className="text-xs text-gray-400">конкурент</div>
              </div>
            </div>

            {COMPARISON.map((section) => (
              <div key={section.category}>
                <div className="bg-gray-50 px-4 py-2 border-b border-gray-100">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {section.category}
                  </span>
                </div>
                {section.rows.map((row, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-4 gap-0 border-b border-gray-50 hover:bg-violet-50/30 transition-colors"
                  >
                    <div className="p-3 text-sm text-gray-700 flex items-center">{row.feature}</div>
                    <div className="p-3 border-l border-gray-100 flex items-center justify-center">
                      <CellValue val={row.us} />
                    </div>
                    <div className="p-3 border-l border-gray-100 flex items-center justify-center">
                      <CellValue val={row.dikidi} />
                    </div>
                    <div className="p-3 border-l border-gray-100 flex items-center justify-center">
                      <CellValue val={row.yclients} />
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>

          <p className="text-center text-xs text-gray-400 mt-4">
            Данные актуальны на октябрь 2026 г. Информация о конкурентах собрана из открытых источников.
          </p>
        </div>
      </section>

      {/* Key differentiators */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-10">
            Почему выбирают Красиво
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: <Zap size={24} className="text-violet-600" />,
                title: 'Нет комиссии с записей',
                desc: 'DIKIDI берёт процент с записей через их каталог. Мы — нет. Вы платите только фиксированную подписку.',
              },
              {
                icon: <Star size={24} className="text-amber-500" />,
                title: 'Лояльность из коробки',
                desc: 'Программа лояльности с уровнями (бронза → платина) доступна бесплатно. У конкурентов — только на платных тарифах.',
              },
              {
                icon: <Building2 size={24} className="text-green-600" />,
                title: 'Без привязки',
                desc: 'Выгружайте клиентскую базу в CSV в любой момент. Ваши данные — ваши. Никаких ловушек.',
              },
            ].map((item, i) => (
              <div key={i} className="bg-gray-50 rounded-2xl p-6">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm mb-4">
                  {item.icon}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-10">
            Частые вопросы
          </h2>
          <div className="space-y-3">
            {FAQ.map((item, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <button
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="font-medium text-gray-900 text-sm">{item.q}</span>
                  {openFaq === i ? (
                    <ChevronUp size={16} className="text-gray-400 shrink-0 ml-3" />
                  ) : (
                    <ChevronDown size={16} className="text-gray-400 shrink-0 ml-3" />
                  )}
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5 text-sm text-gray-600 leading-relaxed border-t border-gray-50 pt-3">
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Начните бесплатно уже сегодня
          </h2>
          <p className="text-gray-500 mb-8">
            14 дней тарифа Про бесплатно. Без кредитной карты. Без скрытых платежей.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/onboarding?plan=pro">
              <button className="bg-violet-700 text-white px-8 py-3.5 rounded-xl font-semibold hover:bg-violet-800 transition-colors">
                Попробовать 14 дней бесплатно
              </button>
            </Link>
            <Link href="/salons">
              <button className="border border-gray-300 text-gray-700 px-8 py-3.5 rounded-xl font-semibold hover:bg-gray-50 transition-colors">
                Посмотреть демо
              </button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
