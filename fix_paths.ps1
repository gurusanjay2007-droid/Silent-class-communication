$htmlDir = "templates"
$replacements = [ordered]@{
    'href="style\.css"' = 'href="{{ url_for(''static'', filename=''css/style.css'') }}"'
    'href="login\.css"' = 'href="{{ url_for(''static'', filename=''css/login.css'') }}"'
    'href="portal\.css"' = 'href="{{ url_for(''static'', filename=''css/portal.css'') }}"'
    'href="report\.css"' = 'href="{{ url_for(''static'', filename=''css/report.css'') }}"'
    'src="script\.js"' = 'src="{{ url_for(''static'', filename=''js/script.js'') }}"'
    'src="login\.js"' = 'src="{{ url_for(''static'', filename=''js/login.js'') }}"'
    'src="portal\.js"' = 'src="{{ url_for(''static'', filename=''js/portal.js'') }}"'
    'src="report\.js"' = 'src="{{ url_for(''static'', filename=''js/report.js'') }}"'
    # URLs must be replaced too
    'href="login\.html#institution"' = 'href="/login#institution"'
    'href="login\.html"' = 'href="/login"'
    'href="index\.html"' = 'href="/"'
    'href="student-portal\.html"' = 'href="/student-portal"'
    'href="teacher-portal\.html"' = 'href="/teacher-portal"'
    'href="report\.html"' = 'href="/report"'
    'href=''login\.html''' = 'href=''/login'''
    'href=''index\.html''' = 'href=''/'''
}

Get-ChildItem -Path $htmlDir -Filter "*.html" | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    foreach ($key in $replacements.Keys) {
        $content = [regex]::Replace($content, $key, $replacements[$key])
    }
    Set-Content -Path $_.FullName -Value $content -Encoding UTF8
}

$jsDir = "static\js"
$jsReplacements = [ordered]@{
    "'login\.html'" = "'/login'"
    "'index\.html'" = "'/'"
    "'student-portal\.html'" = "'/student-portal'"
    "'teacher-portal\.html'" = "'/teacher-portal'"
    "'report\.html'" = "'/report'"
    '"login\.html"' = '"/login"'
    '"index\.html"' = '"/"'
    '"student-portal\.html"' = '"/student-portal"'
    '"teacher-portal\.html"' = '"/teacher-portal"'
    '"report\.html"' = '"/report"'
}

Get-ChildItem -Path $jsDir -Filter "*.js" | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    foreach ($key in $jsReplacements.Keys) {
        $content = [regex]::Replace($content, $key, $jsReplacements[$key])
    }
    Set-Content -Path $_.FullName -Value $content -Encoding UTF8
}
