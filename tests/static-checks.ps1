$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$indexPath = Join-Path $projectRoot 'index.html'
$scriptPath = Join-Path $projectRoot 'js\code.js'
$stylePath = Join-Path $projectRoot 'css\style.css'
$legalStylePath = Join-Path $projectRoot 'css\legal.css'
$legalPath = Join-Path $projectRoot 'mentions-legales.html'
$privacyPath = Join-Path $projectRoot 'politique-confidentialite.html'
$robotsPath = Join-Path $projectRoot 'robots.txt'
$sitemapPath = Join-Path $projectRoot 'sitemap.xml'
$manifestPath = Join-Path $projectRoot 'site.webmanifest'
$socialImagePath = Join-Path $projectRoot 'img\cap221-social.png'
$notFoundPath = Join-Path $projectRoot '404.html'

$failures = [System.Collections.Generic.List[string]]::new()

function Assert-True {
    param([bool]$Condition, [string]$Message)
    if (-not $Condition) { $script:failures.Add($Message) }
}

foreach ($path in @($indexPath, $scriptPath, $stylePath, $legalStylePath, $legalPath, $privacyPath, $robotsPath, $sitemapPath, $manifestPath, $socialImagePath, $notFoundPath)) {
    Assert-True (Test-Path -LiteralPath $path) "Fichier manquant: $path"
}

$html = Get-Content -LiteralPath $indexPath -Raw
$js = Get-Content -LiteralPath $scriptPath -Raw
$css = Get-Content -LiteralPath $stylePath -Raw

$requiredHtml = @(
    'id="homeSearchInput"',
    'onsubmit="homeSearch(event)"',
    'id="contactForm"',
    'id="cf-fname"',
    'id="cf-lname"',
    'id="cf-email"',
    'id="cf-subject"',
    'id="cf-message"',
    'data-lang="fr"',
    'data-lang="en"',
    'data-lang="wo"',
    'data-lang="ar"',
    'https://www.campusen.sn/',
    'https://orientation.campusen.sn/',
    'https://officedubac.sn/',
    'https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js'
    'rel="canonical" href="https://abf-7q9r.onrender.com/"'
    'rel="manifest" href="site.webmanifest"'
    'img/cap221-social.png'
    'href="mentions-legales.html"'
    'href="politique-confidentialite.html"'
    'class="skip-link"'
    'id="mainContent"'
)
foreach ($needle in $requiredHtml) {
    Assert-True ($html.Contains($needle)) "Élément requis absent : $needle"
}

$forbidden = @(
    'Plateforme N',
    '+5000',
    '5000+',
    'Espace en construction',
    'Contacter (Bientôt)',
    'wa.me/221000000000',
    'id="loader"',
    'id="topAlert"',
    'id="ecoles"',
    'id="stages"',
    'id="mentors"',
    'JUIN 2026',
    'JUILLET 2026',
    'MARS 2026'
)
foreach ($needle in $forbidden) {
    Assert-True (-not $html.Contains($needle)) "Contenu obsolete encore present: $needle"
}
Assert-True (-not $html.Contains('formsubmit.co')) 'Ancienne dependance FormSubmit encore presente.'
Assert-True (-not $html.Contains('user-scalable=no')) 'Le zoom mobile est encore bloque.'
Assert-True (-not $html.Contains('maximum-scale=1')) 'Le niveau de zoom mobile est encore limite.'
Assert-True ($js.Contains("emailjs.send('service_pv8dpoo', 'template_epwqyib'")) 'Modele EmailJS de notification absent.'
Assert-True (([regex]::Matches($js, 'emailjs\.send\(')).Count -eq 1) 'Un seul envoi JavaScript est attendu; EmailJS gere la reponse automatique liee.'
Assert-True (-not $js.Contains('template_3xk9p08')) 'Un modele EmailJS supprime est encore reference.'
Assert-True ($js.Contains('cap221_contact_last_sent')) 'Le delai anti-rafale du formulaire est absent.'
Assert-True ($js.Contains('cap221_contact_last_message')) 'La protection contre les doubles envois est absente.'
Assert-True ($js.Contains('cap221_contact_rate')) 'La limitation locale des envois est absente.'

$ids = [regex]::Matches($html, '\bid="([^"]+)"') | ForEach-Object { $_.Groups[1].Value }
$duplicateIds = $ids | Group-Object | Where-Object Count -gt 1
Assert-True ($null -eq $duplicateIds) ("Identifiants HTML dupliques: " + (($duplicateIds.Name) -join ', '))

$requiredFunctions = @(
    'homeSearch',
    'navigateTo',
    'filterResults',
    'openJobDetails',
    'getCareerProfile',
    'initContactForm',
    'setLang',
    'getAIReply'
)
foreach ($functionName in $requiredFunctions) {
    $pattern = "(?m)(function\s+$([regex]::Escape($functionName))\s*\(|window\.$([regex]::Escape($functionName))\s*=)"
    Assert-True ([regex]::IsMatch($js, $pattern)) "Fonction JavaScript absente: $functionName"
}

foreach ($lang in @('fr', 'en', 'wo', 'ar')) {
    Assert-True ([regex]::IsMatch($js, "(?m)^\s*$lang\s*:\s*\{")) "Dictionnaire de langue absent: $lang"
}
$translationKeys = [regex]::Matches($html, 'data-i18n(?:-ph)?="([^"]+)"') | ForEach-Object { $_.Groups[1].Value } | Sort-Object -Unique
foreach ($translationKey in $translationKeys) {
    $translationCount = ([regex]::Matches($js, [regex]::Escape("'$translationKey'"))).Count
    Assert-True ($translationCount -ge 4) "Traduction incomplete pour : $translationKey"
}
Assert-True (([regex]::Matches($js, "'hero\.search\.placeholder'\s*:")).Count -eq 4) "La recherche d'accueil n'est pas traduite dans les 4 langues."
Assert-True ($js.Contains('const GEMINI_API_KEY')) 'La configuration actuelle de LIA a ete retiree.'
Assert-True ($js.Contains('async function getAIReply')) 'Le chatbot LIA a ete retire.'
Assert-True ($css.Contains('.home-search')) "Styles de la recherche d'accueil absents."
Assert-True ($css.Contains('.official-link-card')) 'Styles des liens officiels absents.'
Assert-True ($css.Contains('.career-profile-grid')) 'Styles des fiches metiers enrichies absents.'
Assert-True ($css.Contains('.skip-link')) "Le lien d'evitement accessible est absent."

$legal = Get-Content -LiteralPath $legalPath -Raw
$privacy = Get-Content -LiteralPath $privacyPath -Raw
$robots = Get-Content -LiteralPath $robotsPath -Raw
$sitemap = Get-Content -LiteralPath $sitemapPath -Raw
$manifest = Get-Content -LiteralPath $manifestPath -Raw
Assert-True ($legal.Contains('Alioune Badara Fall')) "L'editeur est absent des mentions legales."
Assert-True ($legal.Contains('contact.cap221@gmail.com')) 'Le contact est absent des mentions legales.'
Assert-True ($privacy.Contains('EmailJS')) 'EmailJS est absent de la politique de confidentialite.'
Assert-True ($privacy.Contains('contact.cap221@gmail.com')) 'Le contact est absent de la politique de confidentialite.'
Assert-True ($robots.Contains('sitemap.xml')) 'Le sitemap est absent de robots.txt.'
Assert-True ($sitemap.Contains('mentions-legales.html')) 'Les mentions legales sont absentes du sitemap.'
Assert-True ($manifest.Contains('CAP 221')) 'Le manifeste ne decrit pas CAP 221.'

if ($failures.Count -gt 0) {
    Write-Host "ECHEC: $($failures.Count) controle(s)" -ForegroundColor Red
    $failures | ForEach-Object { Write-Host " - $_" -ForegroundColor Red }
    exit 1
}

Write-Host "OK: structure, contenus, langues, contact et LIA verifies." -ForegroundColor Green
exit 0
