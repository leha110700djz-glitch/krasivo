# Красиво — запуск платформы (WSL2 + portproxy)
# Запуск: .\start.ps1  (от администратора, если нужен portproxy)

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "     Запуск платформы КРАСИВО" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# 1. Запуск PostgreSQL и Redis в WSL
Write-Host "[1/4] Запуск базы данных..." -ForegroundColor Yellow
$dbScript = @'
sudo pg_ctlcluster 14 main start 2>/dev/null || echo "PG already running"
sudo redis-server /etc/redis/redis.conf --daemonize yes 2>/dev/null || echo "Redis already running"
echo "DB services ready"
'@
$dbScript | wsl -d monetka bash
Start-Sleep -Seconds 2

# 2. Запуск бэкенда в screen
Write-Host "[2/4] Запуск API сервера (порт 8000)..." -ForegroundColor Yellow
$backendScript = @'
screen -S krasivo-backend -X quit 2>/dev/null || true
sleep 1
screen -dmS krasivo-backend bash -c "cd /mnt/c/Users/User/Desktop/красиво/backend && /opt/krasivo_venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 2>&1 | tee /tmp/krasivo_backend.log"
echo "Backend started in screen"
'@
$backendScript | wsl -d monetka bash
Start-Sleep -Seconds 3

# 3. Запуск фронтенда в screen
Write-Host "[3/4] Запуск веб-приложения (порт 3000)..." -ForegroundColor Yellow
$webScript = @'
screen -S krasivo-web -X quit 2>/dev/null || true
sleep 1
screen -dmS krasivo-web bash -c "cd /mnt/c/Users/User/Desktop/красиво/web && node node_modules/.bin/next dev --port 3000 --hostname 0.0.0.0 2>&1 | tee /tmp/krasivo_web.log"
echo "Web started in screen"
'@
$webScript | wsl -d monetka bash

# 4. Настройка проброса портов Windows -> WSL
Write-Host "[4/4] Настройка сети Windows -> WSL..." -ForegroundColor Yellow
$wslIp = (wsl -d monetka hostname -I).Trim().Split(' ')[0]
Write-Host "WSL IP: $wslIp" -ForegroundColor Gray

netsh interface portproxy delete v4tov4 listenport=3000 listenaddress=0.0.0.0 2>$null
netsh interface portproxy delete v4tov4 listenport=8000 listenaddress=0.0.0.0 2>$null
netsh interface portproxy add v4tov4 listenport=3000 listenaddress=0.0.0.0 connectport=3000 connectaddress=$wslIp
netsh interface portproxy add v4tov4 listenport=8000 listenaddress=0.0.0.0 connectport=8000 connectaddress=$wslIp

# 5. Ожидание готовности
Write-Host ""
Write-Host "Ожидание компиляции Next.js (~30 сек)..." -ForegroundColor Yellow
$ready = $false
for ($i = 0; $i -lt 20; $i++) {
    Start-Sleep -Seconds 3
    try {
        $r = Invoke-WebRequest -Uri "http://localhost:8000/health" -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop
        $apiOk = $r.StatusCode -eq 200
    } catch { $apiOk = $false }

    try {
        $r = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
        $webOk = $r.StatusCode -eq 200
    } catch { $webOk = $false }

    if ($apiOk -and $webOk) { $ready = $true; break }
    Write-Host -NoNewline "."
}

Write-Host ""
Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
if ($ready) {
    Write-Host "  ВСЁ ЗАПУЩЕНО!" -ForegroundColor Green
} else {
    Write-Host "  СЕРВИСЫ СТАРТУЮТ..." -ForegroundColor Yellow
}
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Сайт:       http://localhost:3000" -ForegroundColor White
Write-Host "  API:        http://localhost:8000" -ForegroundColor White
Write-Host "  API Docs:   http://localhost:8000/docs" -ForegroundColor White
Write-Host ""
Write-Host "  Тестовые аккаунты:" -ForegroundColor Cyan
Write-Host "    Администратор: +79990000000 / admin123"
Write-Host "    Владелец:      +79991000000 / owner123"
Write-Host "    Клиент:        +79992000000 / client123"
Write-Host ""
Write-Host "  Прямой доступ (если localhost не работает):"
Write-Host "    http://${wslIp}:3000"
Write-Host ""

# Открыть браузер
$null = [System.Diagnostics.Process]::Start("http://localhost:3000")
