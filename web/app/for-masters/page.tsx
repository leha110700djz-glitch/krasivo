import Link from 'next/link'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import Button from '@/components/ui/Button'
import {
  Calendar,
  Clock,
  MapPin,
  Star,
  BarChart2,
  Gift,
  CheckCircle,
  ArrowRight,
  Users,
  TrendingUp,
  Zap,
} from 'lucide-react'

export const metadata = {
  title: 'Для мастеров — Красиво',
  description: 'Присоединяйтесь к платформе Красиво и начните принимать клиентов онлайн. Свободный график, прозрачный доход, бесплатный старт.',
}

const advantages = [
  {
    icon: Clock,
    title: 'Свободный график',
    description: 'Сами настраиваете своё расписание. Работайте когда удобно — хоть в выходные, хоть по вечерам.',
    color: 'text-primary-600',
    bg: 'bg-primary-50',
  },
  {
    icon: Calendar,
    title: 'Онлайн-запись 24/7',
    description: 'Клиенты могут записаться к вам в любое время суток. Пока вы спите — запись работает.',
    color: 'text-violet-600',
    bg: 'bg-violet-50',
  },
  {
    icon: MapPin,
    title: 'Нет аренды места',
    description: 'Работайте из любого адреса: домашняя студия, выезд к клиенту или арендованное кресло.',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
  },
  {
    icon: Star,
    title: 'Портфолио и рейтинг',
    description: 'Загружайте работы, собирайте отзывы и растите в рейтинге. Лучший мастер — больше клиентов.',
    color: 'text-amber-600',
    bg: 'bg-amber-50',
  },
  {
    icon: BarChart2,
    title: 'Аналитика доходов',
    description: 'Прозрачная статистика: сколько вы заработали, какие услуги популярнее, откуда приходят клиенты.',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
  },
  {
    icon: Gift,
    title: 'Бесплатное начало',
    description: 'Регистрируйтесь бесплатно и сразу начинайте работать. Никаких скрытых платежей на старте.',
    color: 'text-rose-600',
    bg: 'bg-rose-50',
  },
]

const steps = [
  {
    number: '01',
    title: 'Регистрация и профиль',
    description: 'Создайте аккаунт за 2 минуты. Заполните профиль мастера: фото, описание специализации, опыт работы.',
  },
  {
    number: '02',
    title: 'Добавьте услуги и цены',
    description: 'Укажите список услуг, стоимость и продолжительность каждой. Можно добавить сколько угодно позиций.',
  },
  {
    number: '03',
    title: 'Настройте расписание',
    description: 'Задайте рабочие дни, часы приёма и перерывы. Отмечайте выходные в один клик прямо в приложении.',
  },
  {
    number: '04',
    title: 'Получайте клиентов и доход',
    description: 'Клиенты находят вас в поиске и записываются онлайн. Вы получаете уведомление и подтверждаете запись.',
  },
]

const plans = [
  {
    name: 'Фрилансер',
    price: 'Бесплатно',
    priceNote: 'навсегда',
    accent: false,
    features: [
      'До 30 записей в месяц',
      'Профиль и портфолио',
      'Онлайн-запись от клиентов',
      'Отзывы и рейтинг',
      'Базовые уведомления',
    ],
    cta: 'Начать бесплатно',
    href: '/register',
  },
  {
    name: 'Про-мастер',
    price: '990 ₽',
    priceNote: 'в месяц',
    accent: true,
    features: [
      'Неограниченные записи',
      'Приоритет в поиске',
      'Расширенная аналитика доходов',
      'Продвижение в каталоге',
      'Поддержка 24/7',
      'Экспорт клиентской базы',
    ],
    cta: 'Попробовать 14 дней бесплатно',
    href: '/register?plan=pro',
  },
]

const reviews = [
  {
    name: 'Анастасия К.',
    role: 'Мастер по маникюру, Москва',
    avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=80&h=80&fit=crop&crop=face',
    text: 'За первый месяц на платформе у меня появилось 18 новых клиентов. Онлайн-запись работает пока я сплю — это реально меняет жизнь. Теперь зарабатываю на 40% больше, чем когда работала в салоне.',
    stars: 5,
  },
  {
    name: 'Дмитрий В.',
    role: 'Барбер, Санкт-Петербург',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&crop=face',
    text: 'Работаю из домашней студии и зарабатываю столько же, сколько в барбершопе, только без аренды кресла. Клиентов привлекает мой рейтинг и портфолио — люди доверяют отзывам.',
    stars: 5,
  },
  {
    name: 'Марина Л.',
    role: 'Стилист-колорист, Екатеринбург',
    avatar: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=80&h=80&fit=crop&crop=face',
    text: 'Попробовала Красиво после декрета. Аналитика доходов помогает мне понять, какие услуги самые выгодные. Уже через два месяца перешла на тариф Про и не пожалела ни разу.',
    stars: 5,
  },
]

export default function ForMastersPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* ─── Hero ─── */}
        <section className="relative overflow-hidden bg-gradient-to-br from-primary-900 via-primary-800 to-violet-900 text-white">
          <div className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-8">
                <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 text-sm font-medium">
                  <Zap size={14} className="text-amber-400" />
                  Более 1 000 мастеров уже зарабатывают
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
                  Станьте мастером{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-amber-500">
                    на Красиво
                  </span>
                </h1>

                <p className="text-lg sm:text-xl text-primary-100 leading-relaxed max-w-xl">
                  Свободный график, клиенты онлайн, прозрачный доход. Работайте там, где удобно вам — мы возьмём организацию на себя.
                </p>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Link href="/register">
                    <Button size="lg" className="bg-amber-500 hover:bg-amber-400 text-gray-900 font-bold shadow-lg hover:shadow-xl border-0 focus:ring-amber-400 w-full sm:w-auto">
                      Стать мастером
                      <ArrowRight size={18} />
                    </Button>
                  </Link>
                  <a href="#how-it-works">
                    <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10 hover:border-white w-full sm:w-auto">
                      Узнать подробнее
                    </Button>
                  </a>
                </div>

                <p className="text-sm text-primary-200">
                  Регистрация бесплатна · Без кредитной карты · Начните за 2 минуты
                </p>
              </div>

              <div className="relative hidden lg:block">
                <div className="relative rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/10">
                  <img
                    src="https://images.unsplash.com/photo-1560066984-138dadb4c035?w=700&h=500&fit=crop"
                    alt="Мастер красоты за работой"
                    className="w-full h-[420px] object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary-900/60 to-transparent" />
                </div>

                {/* Floating card */}
                <div className="absolute -bottom-4 -left-6 bg-white rounded-2xl p-4 shadow-xl flex items-center gap-3">
                  <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                    <TrendingUp size={22} className="text-amber-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Средний доход мастера</p>
                    <p className="text-lg font-bold text-gray-900">78 000 ₽/мес</p>
                  </div>
                </div>

                <div className="absolute -top-4 -right-4 bg-white rounded-2xl p-4 shadow-xl flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                    <Users size={22} className="text-primary-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Новых клиентов</p>
                    <p className="text-lg font-bold text-gray-900">+12 в месяц</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Stats strip ─── */}
        <section className="bg-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
              {[
                { value: '1 000+', label: 'мастеров на платформе', color: 'text-primary-700' },
                { value: '50 000+', label: 'записей в месяц', color: 'text-amber-600' },
                { value: '4.8', label: 'средний рейтинг мастеров', color: 'text-emerald-600' },
              ].map((stat) => (
                <div key={stat.label} className="space-y-1">
                  <p className={`text-4xl sm:text-5xl font-bold ${stat.color}`}>{stat.value}</p>
                  <p className="text-gray-500 text-sm">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Advantages ─── */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                Почему мастера выбирают Красиво
              </h2>
              <p className="text-lg text-gray-500 max-w-2xl mx-auto">
                Мы создали платформу специально для независимых мастеров. Всё, что нужно для работы — в одном месте.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {advantages.map((adv) => (
                <div
                  key={adv.title}
                  className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-100 group"
                >
                  <div className={`w-12 h-12 ${adv.bg} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <adv.icon size={22} className={adv.color} />
                  </div>
                  <h3 className="font-bold text-gray-900 text-lg mb-2">{adv.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{adv.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── How it works ─── */}
        <section id="how-it-works" className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                Как начать работать на платформе
              </h2>
              <p className="text-lg text-gray-500 max-w-2xl mx-auto">
                Четыре простых шага — и вы уже принимаете первых клиентов
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {steps.map((step, i) => (
                <div key={step.number} className="relative">
                  {i < steps.length - 1 && (
                    <div className="hidden lg:block absolute top-8 left-[calc(100%-1rem)] w-full h-px bg-gradient-to-r from-primary-200 to-transparent z-0" />
                  )}
                  <div className="relative z-10 space-y-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl flex items-center justify-center shadow-md">
                      <span className="text-white font-bold text-lg">{step.number}</span>
                    </div>
                    <h3 className="font-bold text-gray-900 text-lg">{step.title}</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center mt-12">
              <Link href="/register">
                <Button size="lg" className="shadow-md hover:shadow-lg">
                  Зарегистрироваться сейчас
                  <ArrowRight size={18} />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* ─── Pricing ─── */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                Тарифы для мастеров
              </h2>
              <p className="text-lg text-gray-500 max-w-2xl mx-auto">
                Начните бесплатно и переходите на про-тариф когда будете готовы
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
              {plans.map((plan) => (
                <div
                  key={plan.name}
                  className={`relative rounded-3xl p-8 flex flex-col gap-6 ${
                    plan.accent
                      ? 'bg-gradient-to-br from-primary-700 to-primary-900 text-white shadow-2xl ring-2 ring-primary-500'
                      : 'bg-white border border-gray-200 shadow-sm'
                  }`}
                >
                  {plan.accent && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                      <span className="bg-amber-400 text-gray-900 text-xs font-bold px-4 py-1.5 rounded-full shadow-md">
                        Популярный выбор
                      </span>
                    </div>
                  )}

                  <div>
                    <h3 className={`text-xl font-bold mb-2 ${plan.accent ? 'text-white' : 'text-gray-900'}`}>
                      {plan.name}
                    </h3>
                    <div className="flex items-end gap-1">
                      <span className={`text-4xl font-bold ${plan.accent ? 'text-amber-300' : 'text-gray-900'}`}>
                        {plan.price}
                      </span>
                      <span className={`text-sm mb-1 ${plan.accent ? 'text-primary-200' : 'text-gray-400'}`}>
                        {plan.priceNote}
                      </span>
                    </div>
                  </div>

                  <ul className="space-y-3 flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <CheckCircle size={16} className={`shrink-0 mt-0.5 ${plan.accent ? 'text-amber-300' : 'text-primary-600'}`} />
                        <span className={plan.accent ? 'text-primary-100' : 'text-gray-600'}>{f}</span>
                      </li>
                    ))}
                  </ul>

                  <Link href={plan.href} className="block">
                    <Button
                      size="lg"
                      fullWidth
                      className={
                        plan.accent
                          ? 'bg-amber-400 hover:bg-amber-300 text-gray-900 font-bold border-0 focus:ring-amber-400'
                          : ''
                      }
                      variant={plan.accent ? 'primary' : 'outline'}
                    >
                      {plan.cta}
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Reviews ─── */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                Что говорят наши мастера
              </h2>
              <p className="text-lg text-gray-500 max-w-2xl mx-auto">
                Реальные истории людей, которые уже работают на платформе
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {reviews.map((review) => (
                <div key={review.name} className="bg-gray-50 rounded-2xl p-6 border border-gray-100 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-1 mb-4">
                    {Array.from({ length: review.stars }).map((_, i) => (
                      <Star key={i} size={14} className="text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed mb-6">
                    &ldquo;{review.text}&rdquo;
                  </p>
                  <div className="flex items-center gap-3">
                    <img
                      src={review.avatar}
                      alt={review.name}
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-primary-100"
                    />
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{review.name}</p>
                      <p className="text-gray-500 text-xs">{review.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Final CTA ─── */}
        <section className="py-20 bg-gradient-to-br from-primary-700 via-primary-800 to-violet-900 text-white">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
            <h2 className="text-3xl sm:text-4xl font-bold leading-tight">
              Начните принимать клиентов{' '}
              <span className="text-amber-300">уже сегодня</span>
            </h2>
            <p className="text-lg text-primary-100">
              Регистрация занимает 2 минуты. Первые клиенты появляются уже в первую неделю. Никаких рисков — старт абсолютно бесплатный.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button size="lg" className="bg-amber-500 hover:bg-amber-400 text-gray-900 font-bold border-0 focus:ring-amber-400 shadow-xl w-full sm:w-auto">
                  Зарегистрироваться как мастер
                  <ArrowRight size={18} />
                </Button>
              </Link>
              <Link href="/salons?category=masters">
                <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10 hover:border-white w-full sm:w-auto">
                  Посмотреть каталог мастеров
                </Button>
              </Link>
            </div>
            <p className="text-sm text-primary-300">
              Уже есть аккаунт?{' '}
              <Link href="/login" className="text-white underline underline-offset-2 hover:text-amber-300 transition-colors">
                Войдите
              </Link>
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
