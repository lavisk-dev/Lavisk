$result = Invoke-WebRequest -Uri "http://localhost:3333/" -UseBasicParsing -TimeoutSec 30
$body = $result.Content

# Find all suspense boundaries
$suspenseMarkers = [regex]::Matches($body, '<!--\$[Rr]?-->|<!--\?\$|hidden id="S:|data-dgst|<!--\$!-->')
Write-Host "Suspense markers found: $($suspenseMarkers.Count)"
foreach ($m in $suspenseMarkers) {
    $start = [Math]::Max(0, $m.Index - 20)
    $len = [Math]::Min(100, $body.Length - $start)
    $ctx = $body.Substring($start, $len) -replace "`n", " " -replace "`r", " "
    Write-Host "  at $($m.Index): ...$ctx..."
}

Write-Host "`n---Looking at page structure---"
# Find the main tag
$mainStart = $body.IndexOf('<main')
$mainEnd = $body.IndexOf('</main>')
if ($mainStart -ge 0 -and $mainEnd -ge 0) {
    Write-Host "Main tag content ($mainStart - $mainEnd):"
    $mainContent = $body.Substring($mainStart, $mainEnd - $mainStart + 7)
    Write-Host $mainContent.Substring(0, [Math]::Min(500, $mainContent.Length))
    Write-Host "..."
    Write-Host $mainContent.Substring([Math]::Max(0, $mainContent.Length - 500))
}

# Check hidden streaming content
$hiddenIds = [regex]::Matches($body, 'hidden id="S:(\d+)"')
Write-Host "`nHidden streaming sections: $($hiddenIds.Count)"
foreach ($h in $hiddenIds) {
    $id = $h.Groups[1].Value
    $start = $h.Index
    $content = $body.Substring($start, [Math]::Min(200, $body.Length - $start)) -replace "`n", " " -replace "`r", " "
    Write-Host ("  S:" + $id + " at " + $start + ": " + $content.Substring(0, [Math]::Min(120, $content.Length)))
}

# Find footer
$footerIdx = $body.ToLower().IndexOf("</footer>")
if ($footerIdx -ge 0) {
    Write-Host "`nFooter found at $footerIdx"
} else {
    Write-Host "`nNo </footer> tag found"
}
# Check for the end of body
$bodyEnd = $body.IndexOf('</body>')
Write-Host "Body ends at $bodyEnd"
Write-Host "Last 300 chars of body:"
Write-Host $body.Substring([Math]::Max(0, $bodyEnd - 300))
