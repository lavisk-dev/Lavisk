$result = Invoke-WebRequest -Uri "http://localhost:3333/" -UseBasicParsing -TimeoutSec 30
$body = $result.Content

$sections = @("hero", "stats", "category", "trending", "bestseller", "journal", "why-us", "footer", "nav-shell", "navbar", "cart-drawer", "mobile-nav", "quick-view", "bestsellers", "trending-now")
foreach ($s in $sections) {
    $idx = $body.ToLower().IndexOf($s.ToLower())
    if ($idx -ge 0) {
        $startPos = [Math]::Max(0, $idx - 30)
        $len = [Math]::Min(120, $body.Length - $startPos)
        $context = $body.Substring($startPos, $len) -replace "`n", " " -replace "`r", " "
        Write-Host "FOUND '$s' at $idx : ...$context..."
    } else {
        Write-Host "NOT FOUND: $s"
    }
}
# Check for key data
Write-Host ""
$keywords = @("gifted", "bestseller", "Lavisk", "free shipping", "journal", "gift with")
foreach ($kw in $keywords) {
    $count = [regex]::Matches($body.ToLower(), [regex]::Escape($kw.ToLower())).Count
    Write-Host "Keyword '$kw' appears $count times"
}
Write-Host ""
Write-Host "Total HTML size: $($body.Length) bytes ($([math]::Round($body.Length/1KB, 1)) KB)"
Write-Host "Contains JSON-LD: $($body.Contains('application/ld+json'))"
Write-Host "Contains RSC payload: $($body.Contains('self.__next_f'))"
