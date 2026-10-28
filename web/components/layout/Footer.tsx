import Link from 'next/link'
import { Scissors, Phone, Mail, MapPin, Instagram, Send } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-9 h-9 bg-gradient-to-br from-primary-600 to-primary-800 rounded-xl flex items-center justify-center">
                <Scissors size={18} className="text-white" />
              </div>
              <span className="text-xl font-bold text-white">Красиво</span>
            </Link>
            <p className="text-sm text-gray-400 leading-relaxed">
              Платформа для записи в салоны красоты и барбершопы по всей России.
            </p>
            <div className="flex items-center gap-3">
              <a href="#" className="w-9 h-9 bg-white/10 hover:bg-primary-600 rounded-lg flex items-center justify-center transition-colors">
                <Instagram size={16} />
              </a>
              <a href="#" className="w-9 h-9 bg-white/10 hover:bg-blue-500 rounded-lg flex items-center justify-center transition-colors">
                <Send size={16} />
              </a>
            </div>
          </div>

          {/* Services */}
          <div className="space-y-4">
            <h4 className="text-white font-semibold">Для клиентов</h4>
            <ul className="space-y-2">
              {[
                { href: '/salons', label: 'Найти салон' },
                { href: '/salons?category=barbershop', label: 'Барбершопы' },
                { href: '/salons?category=nails', label: 'Маникюр' },
                { href: '/salons?sort=rating', label: 'Топ рейтинг' },
              ].map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-sm hover:text-white transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* For Business */}
          <div className="space-y-4">
            <h4 className="text-white font-semibold">Для бизнеса</h4>
            <ul className="space-y-2">
              {[
                { href: '/register', label: 'Разместить салон' },
                { href: '/dashboard', label: 'Личный кабинет' },
                { href: '/dashboard/stats', label: 'Аналитика' },
              ].map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-sm hover:text-white transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contacts */}
          <div className="space-y-4">
            <h4 className="text-white font-semibold">Контакты</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm">
                <Phone size={15} className="text-primary-400 shrink-0" />
                <a href="tel:+74951234567" className="hover:text-white transition-colors">+7 (495) 123-45-67</a>
              </li>
              <li className="flex items-center gap-2 text-sm">
                <Mail size={15} className="text-primary-400 shrink-0" />
                <a href="mailto:hello@krasivo.ru" className="hover:text-white transition-colors">hello@krasivo.ru</a>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <MapPin size={15} className="text-primary-400 shrink-0 mt-0.5" />
                <span>Москва, ул. Тверская, 1</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-500">© 2024 Красиво. Все права защищены.</p>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <Link href="#" className="hover:text-gray-300 transition-colors">Политика конфиденциальности</Link>
            <Link href="#" className="hover:text-gray-300 transition-colors">Условия использования</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
