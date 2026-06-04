# Script para ayudar a configurar MongoDB
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Configuración de MongoDB para P2P Calculator" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "OPCIÓN 1: MongoDB Atlas (Recomendado - Gratis)" -ForegroundColor Yellow
Write-Host "1. Ve a https://www.mongodb.com/cloud/atlas" -ForegroundColor White
Write-Host "2. Crea una cuenta gratuita" -ForegroundColor White
Write-Host "3. Crea un cluster gratuito (M0)" -ForegroundColor White
Write-Host "4. Configura un usuario de base de datos" -ForegroundColor White
Write-Host "5. Permite acceso desde cualquier IP (0.0.0.0/0) en Network Access" -ForegroundColor White
Write-Host "6. Obtén la connection string desde 'Connect' -> 'Connect your application'" -ForegroundColor White
Write-Host ""
Write-Host "La URL debería verse así:" -ForegroundColor Green
Write-Host "mongodb+srv://usuario:password@cluster0.xxxxx.mongodb.net/binance-p2p-calculator?retryWrites=true&w=majority" -ForegroundColor Gray
Write-Host ""

$opcion = Read-Host "¿Tienes ya una URL de MongoDB Atlas? (S/N)"

if ($opcion -eq "S" -or $opcion -eq "s") {
    Write-Host ""
    Write-Host "Por favor, ingresa tu connection string de MongoDB:" -ForegroundColor Yellow
    Write-Host "(Se verá como: mongodb+srv://usuario:password@cluster0.xxxxx.mongodb.net/...)" -ForegroundColor Gray
    $connectionString = Read-Host "Connection String"
    
    if ($connectionString -match "mongodb\+srv://") {
        # Actualizar el archivo .env
        $envContent = Get-Content .env -Raw
        $newContent = $envContent -replace 'DATABASE_URL=".*"', "DATABASE_URL=`"$connectionString`""
        Set-Content .env -Value $newContent
        
        Write-Host ""
        Write-Host "✓ Archivo .env actualizado correctamente" -ForegroundColor Green
        Write-Host ""
        Write-Host "Ahora ejecuta:" -ForegroundColor Yellow
        Write-Host "  npm run db:push" -ForegroundColor Cyan
    } else {
        Write-Host ""
        Write-Host "✗ La URL no parece ser válida. Debe comenzar con 'mongodb+srv://'" -ForegroundColor Red
    }
} else {
    Write-Host ""
    Write-Host "OPCIÓN 2: MongoDB Local" -ForegroundColor Yellow
    Write-Host "Si prefieres usar MongoDB localmente:" -ForegroundColor White
    Write-Host "1. Descarga MongoDB desde https://www.mongodb.com/try/download/community" -ForegroundColor White
    Write-Host "2. Instálalo en tu máquina" -ForegroundColor White
    Write-Host "3. Usa esta URL en .env:" -ForegroundColor White
    Write-Host "   DATABASE_URL=`"mongodb://localhost:27017/binance-p2p-calculator`"" -ForegroundColor Gray
    Write-Host ""
    Write-Host "¿Quieres configurar MongoDB local ahora? (S/N)" -ForegroundColor Yellow
    $local = Read-Host
    
    if ($local -eq "S" -or $local -eq "s") {
        $envContent = Get-Content .env -Raw
        $newContent = $envContent -replace 'DATABASE_URL=".*"', 'DATABASE_URL="mongodb://localhost:27017/binance-p2p-calculator"'
        Set-Content .env -Value $newContent
        
        Write-Host ""
        Write-Host "✓ Configurado para MongoDB local" -ForegroundColor Green
        Write-Host "Asegúrate de que MongoDB esté corriendo antes de ejecutar la aplicación" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Configuración completada" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

