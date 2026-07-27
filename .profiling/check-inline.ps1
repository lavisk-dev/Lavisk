$result = Invoke-WebRequest -Uri "http://localhost:3333/" -UseBasicParsing -TimeoutSec 30
$body = $result.Content

$allScripts = [regex]::Matches($body, '<script[^>]*>(.*?)</script>')
Write-Host ("All script tags count: " + $allScripts.Count)
$inlineCount = 0
foreach ($s in $allScripts) {
    $src = ""
    if ($s.Value -match 'src="([^"]+)"') { $src = $matches[1].Split('/')[-1] }
    $inner = $s.Groups[1].Value -replace "`n","" -replace "`r",""
    $innerTrimmed = $inner.Substring(0, [Math]::Min(80, $inner.Length))
    if ($src) {
        $isAsync = $s.Value -match 'async'
        Write-Host ("  EXTERNAL: " + $src + " async=" + $isAsync)
    } elseif ($innerTrimmed) {
        $inlineCount++
        Write-Host ("  INLINE #" + $inlineCount + ": " + $innerTrimmed)
    }
}
