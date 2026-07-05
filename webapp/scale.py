import os
import re

directory = r'c:\Users\USER\Downloads\conditional-p2p\webapp\src'

size_map = {
    '56px': '48px',
    '36px': '32px',
    '32px': '28px',
    '28px': '24px',
    '24px': '20px',
    '20px': '18px',
    '18px': '16px',
    '16px': '15px',
    '15px': '14px',
    '14px': '13px',
    '13px': '12px',
    '12px': '11px',
    '11px': '10px'
}

def replace_size(match):
    size = match.group(1)
    if size in size_map:
        return f'text-[{size_map[size]}]'
    return match.group(0)

pattern = re.compile(r'text-\[([0-9]+px)\]')

changed_files = 0
for root, dirs, files in os.walk(directory):
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            new_content = pattern.sub(replace_size, content)
            
            if new_content != content:
                with open(filepath, 'w', encoding='utf-8', newline='\n') as f:
                    f.write(new_content)
                changed_files += 1

print(f"Updated {changed_files} files.")
