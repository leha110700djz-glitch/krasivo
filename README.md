# Красиво — платформа для записи в салоны красоты

## Стек
- **Backend**: FastAPI + SQLAlchemy 2 + PostgreSQL 14 (WSL2)
- **Web**: Next.js 14 App Router + TypeScript + Tailwind CSS
- **Mobile**: Flutter 3 + Riverpod + Go Router

---

## iOS / TestFlight (нужен Mac + Xcode)

### 1. Клонируй репо
```bash
git clone https://github.com/YOUR_USERNAME/krasivo.git
cd krasivo/mobile
```

### 2. Получи зависимости Flutter
```bash
flutter pub get
```

### 3. Сгенерируй iOS-платформу (если папки ios/ нет)
```bash
flutter create . --platforms ios
```

### 4. Настрой Firebase (для пушей)
- Создай проект на https://console.firebase.google.com
- Скачай `GoogleService-Info.plist`
- Положи в `mobile/ios/Runner/GoogleService-Info.plist`

### 5. Открой в Xcode
```bash
open ios/Runner.xcworkspace
```
- Выбери свой Apple Developer Team в Signing & Capabilities
- Bundle ID: `com.krasivo.app` (или свой)

### 6. Собери и залей в TestFlight
- Product → Archive
- Distribute App → App Store Connect → Upload
- Дождись обработки (~15 мин) и пригласи тестеров

---

## Промокоды для тестирования
| Код | Скидка | Условие |
|-----|--------|---------|
| `BEAUTY20` | −20% | на первую запись |
| `KRASIVO10` | −10% | для новых клиентов |
| `FRIEND15` | −15% | реферальная |
| `SUMMER500` | −500₽ | от 2000₽ |

---

## Запуск бэкенда (WSL2)
```bash
# Из PowerShell на хосте
wsl -d monetka bash /mnt/c/Users/User/start_krasivo.sh
```

## Запуск веба
```bash
wsl -d monetka bash /mnt/c/Users/User/start_krasivo_web.sh
```
Открой http://localhost:3000
