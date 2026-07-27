$result = Invoke-WebRequest -Uri "http://localhost:3333/" -UseBasicParsing -TimeoutSec 30
$body = $result.Content

# Find CSS blocking indicators
$cssIdx = $body.IndexOf('<link rel="stylesheet"')
$preloadImgIdx = $body.IndexOf('<link rel="preload" as="image"')
Write-Host "CSS link at position: $cssIdx"
Write-Host "Image preload at position: $preloadImgIdx"
Write-Host "Image preload is BEFORE CSS: $($preloadImgIdx -lt $cssIdx)"

# Count total <link> before CSS
$headContent = $body.Substring(0, $cssIdx + 200)
$linksBeforeCSS = [regex]::Matches($headContent, '<link').Count
Write-Host "Total link tags before CSS: $linksBeforeCSS"
Write-Host ""

# Check if fonts are inline or external
$fontIdx = $body.IndexOf('font-display')
if ($fontIdx -ge 0) {
    Write-Host "Font CSS is INLINE (found 'font-display' in HTML)"
}
$fontUrlIdx = $body.IndexOf('fonts.googleapis.com')
if ($fontUrlIdx -ge 0) {
    Write-Host "Font CSS is EXTERNAL (found fonts.googleapis.com)"
} else {
    Write-Host "No external font CSS found - fonts are self-hosted"
}

# Check the number of CSS keyframes/animations
$animationCount = [regex]::Matches($body, '@keyframes').Count
Write-Host "CSS @keyframes declarations: $animationCount"

# Check the number of inline style blocks
$styleCount = [regex]::Matches($body, '<style').Count
Write-Host "Inline <style> tags: $styleCount"

# Check total size without images
$rscPayloadIdx = $body.IndexOf('self.__next_f.push')
Write-Host ""
Write-Host "RSC payload starts at: $rscPayloadIdx"
$rscSize = $body.Length - $rscPayloadIdx
Write-Host "RSC payload size: $rscSize bytes ($([math]::Round($rscSize/1KB,1)) KB)"

# Check if there's any inline script before CSS that blocks
$beforeCSS = $body.Substring(0, $cssIdx)
$inlineScriptsBeforeCSS = [regex]::Matches($beforeCSS, '<script[^>]*>')
Write-Host ""
Write-Host "Inline scripts BEFORE CSS link: $($inlineScriptsBeforeCSS.Count)"
foreach ($s in $inlineScriptsBeforeCSS) {
    Write-Host ("  " + $s.Value.Substring(0, [Math]::Min(80, $s.Value.Length)))
}
