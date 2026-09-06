# Test de bout en bout du systeme de comptes CAP 221
$ErrorActionPreference = 'Stop'
$base = 'http://localhost:10000'
$email = "test$(Get-Random)@example.com"

# 1. Inscription
$body = @{ name = 'Alioune Test'; email = $email; password = 'motdepasse123' } | ConvertTo-Json
$r = Invoke-WebRequest -Uri "$base/api/auth/signup" -Method POST -ContentType 'application/json' -Body $body -SessionVariable s -UseBasicParsing
Write-Output "SIGNUP: $($r.StatusCode) -> $($r.Content)"

# 2. Session
$r2 = Invoke-WebRequest -Uri "$base/api/auth/me" -WebSession $s -UseBasicParsing
Write-Output "ME: $($r2.StatusCode) -> $($r2.Content)"

# 3. Favoris
$favs = @{ favorites = @{ jobs = @(@{ id = 'medecin'; name = 'Medecin' }); univs = @(@{ id = 'ucad'; name = 'UCAD' }) } } | ConvertTo-Json -Depth 5
$r3 = Invoke-WebRequest -Uri "$base/api/auth/favorites" -Method POST -ContentType 'application/json' -Body $favs -WebSession $s -UseBasicParsing
Write-Output "FAVS POST: $($r3.StatusCode) -> $($r3.Content)"
$r4 = Invoke-WebRequest -Uri "$base/api/auth/favorites" -WebSession $s -UseBasicParsing
Write-Output "FAVS GET: $($r4.StatusCode) -> $($r4.Content)"

# 4. Sans session -> 401
try {
    $r5 = Invoke-WebRequest -Uri "$base/api/auth/me" -UseBasicParsing
    Write-Output "ME sans session: $($r5.StatusCode) (inattendu)"
}
catch {
    Write-Output "ME sans session: $($_.Exception.Response.StatusCode.value__) (401 attendu)"
}

# 5. Connexion (nouvelle session, meme compte)
$body2 = @{ email = $email; password = 'motdepasse123' } | ConvertTo-Json
$r6 = Invoke-WebRequest -Uri "$base/api/auth/login" -Method POST -ContentType 'application/json' -Body $body2 -SessionVariable s2 -UseBasicParsing
Write-Output "LOGIN: $($r6.StatusCode)"

# 6. Mauvais mot de passe -> 401
try {
    $bad = @{ email = $email; password = 'mauvais' } | ConvertTo-Json
    $r7 = Invoke-WebRequest -Uri "$base/api/auth/login" -Method POST -ContentType 'application/json' -Body $bad -UseBasicParsing
    Write-Output "LOGIN mauvais mdp: $($r7.StatusCode) (inattendu)"
}
catch {
    Write-Output "LOGIN mauvais mdp: $($_.Exception.Response.StatusCode.value__) (401 attendu)"
}

# 7. Doublon inscription -> 409
try {
    $r8 = Invoke-WebRequest -Uri "$base/api/auth/signup" -Method POST -ContentType 'application/json' -Body $body -UseBasicParsing
    Write-Output "SIGNUP doublon: $($r8.StatusCode) (inattendu)"
}
catch {
    Write-Output "SIGNUP doublon: $($_.Exception.Response.StatusCode.value__) (409 attendu)"
}

# 8. Deconnexion
$r9 = Invoke-WebRequest -Uri "$base/api/auth/logout" -Method POST -ContentType 'application/json' -Body '{}' -WebSession $s -UseBasicParsing
Write-Output "LOGOUT: $($r9.StatusCode)"
