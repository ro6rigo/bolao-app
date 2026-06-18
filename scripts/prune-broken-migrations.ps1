# Remove pastas em prisma/migrations sem migration.sql (causa erro P3015)
$migrationsRoot = Join-Path $PSScriptRoot "..\prisma\migrations" | Resolve-Path

Get-ChildItem $migrationsRoot -Directory | ForEach-Object {
  $sql = Join-Path $_.FullName "migration.sql"
  if (-not (Test-Path $sql)) {
    Write-Host "Removendo migration quebrada: $($_.Name)"
    Remove-Item $_.FullName -Recurse -Force
  }
}

Write-Host "OK. Pastas restantes:"
Get-ChildItem $migrationsRoot -Directory | ForEach-Object { Write-Host "  - $($_.Name)" }
