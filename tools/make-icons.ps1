# Genere les icônes PWA carrées 192 et 512 à partir du logo (croppé au centre).
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$src = [System.Drawing.Image]::FromFile((Join-Path $PSScriptRoot '..\img\logo-cap221.png'))
try {
  $size = [Math]::Min($src.Width, $src.Height)
  $crop = New-Object System.Drawing.Bitmap $size, $size
  $g = [System.Drawing.Graphics]::FromImage($crop)
  $rect = New-Object System.Drawing.Rectangle ((($src.Width - $size) / 2), (($src.Height - $size) / 2), $size, $size)
  $g.DrawImage($src, (New-Object System.Drawing.Rectangle 0, 0, $size, $size), $rect, [System.Drawing.GraphicsUnit]::Pixel)
  $g.Dispose()

  foreach ($s in 192, 512) {
    $out = New-Object System.Drawing.Bitmap $s, $s
    $g2 = [System.Drawing.Graphics]::FromImage($out)
    $g2.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g2.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g2.DrawImage($crop, 0, 0, $s, $s)
    $g2.Dispose()
    $out.Save((Join-Path $PSScriptRoot "..\img\icon-$s.png"), [System.Drawing.Imaging.ImageFormat]::Png)
    $out.Dispose()
    Write-Host "icon-$s.png OK"
  }
  $crop.Dispose()
} finally {
  $src.Dispose()
}
