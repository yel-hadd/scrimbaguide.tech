import os
import re

affiliate_code = 'via=u42d4986'

def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    def replacer(match):
        url = match.group(0)
        if 'via=' in url or 'fpr=' in url:
            return url
        if '?' in url:
            return url + '&' + affiliate_code
        else:
            return url + '?' + affiliate_code

    new_content = re.sub(r'https://scrimba\.com[^\s"\'\)>]*', replacer, content)

    if new_content != content:
        with open(filepath, 'w') as f:
            f.write(new_content)
        print(f"Updated {filepath}")

for root, dirs, files in os.walk('.'):
    # skip node_modules
    if 'node_modules' in root or '.next' in root or '.git' in root:
        continue
    for file in files:
        if file.endswith(('.md', '.mdx', '.tsx', '.ts')):
            process_file(os.path.join(root, file))

