import os
import re

html_dir = 'templates'

replacements = [
    (r'href="style\.css"', r'href="{{ url_for(\'static\', filename=\'css/style.css\') }}"'),
    (r'href="login\.css"', r'href="{{ url_for(\'static\', filename=\'css/login.css\') }}"'),
    (r'href="portal\.css"', r'href="{{ url_for(\'static\', filename=\'css/portal.css\') }}"'),
    (r'href="report\.css"', r'href="{{ url_for(\'static\', filename=\'css/report.css\') }}"'),
    (r'src="script\.js"', r'src="{{ url_for(\'static\', filename=\'js/script.js\') }}"'),
    (r'src="login\.js"', r'src="{{ url_for(\'static\', filename=\'js/login.js\') }}"'),
    (r'src="portal\.js"', r'src="{{ url_for(\'static\', filename=\'js/portal.js\') }}"'),
    (r'src="report\.js"', r'src="{{ url_for(\'static\', filename=\'js/report.js\') }}"'),
    # replace links
    (r'href="login\.html"', r'href="/login"'),
    (r'href="login\.html#institution"', r'href="/login#institution"'),
    (r'href="index\.html"', r'href="/"'),
    (r'href="student-portal\.html"', r'href="/student-portal"'),
    (r'href="teacher-portal\.html"', r'href="/teacher-portal"'),
    (r'href="report\.html"', r'href="/report"'),
    (r"href='login\.html'", r"href='/login'"),
    (r"href='index\.html'", r"href='/'"),
]

for filename in os.listdir(html_dir):
    if filename.endswith('.html'):
        filepath = os.path.join(html_dir, filename)
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        for old, new in replacements:
            content = re.sub(old, new, content)

        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)

print("HTML paths fixed.")

js_dir = os.path.join('static', 'js')
js_replacements = [
    (r"'login\.html'", r"'/login'"),
    (r"'index\.html'", r"'/'"),
    (r"'student-portal\.html'", r"'/student-portal'"),
    (r"'teacher-portal\.html'", r"'/teacher-portal'"),
    (r"'report\.html'", r"'/report'"),
    (r'"login\.html"', r'"/login"'),
    (r'"index\.html"', r'"/"'),
    (r'"student-portal\.html"', r'"/student-portal"'),
    (r'"teacher-portal\.html"', r'"/teacher-portal"'),
    (r'"report\.html"', r'"/report"'),
]

for filename in os.listdir(js_dir):
    if filename.endswith('.js'):
        filepath = os.path.join(js_dir, filename)
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        for old, new in js_replacements:
            content = re.sub(old, new, content)

        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)

print("JS paths fixed.")
