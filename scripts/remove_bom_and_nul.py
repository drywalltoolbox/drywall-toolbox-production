import os

# Function to remove BOM and NUL bytes from a file
def sanitize_file(file_path):
    with open(file_path, 'rb') as f:
        content = f.read()

    # Remove BOM if present
    if content[:3] == b'\xef\xbb\xbf':
        content = content[3:]

    # Remove NUL bytes
    content = content.replace(b'\x00', b'')

    # Write sanitized content back to file
    backup_path = file_path + '.bak'
    os.rename(file_path, backup_path)
    with open(file_path, 'wb') as f:
        f.write(content)

    print(f"Sanitized: {file_path} (backup created: {backup_path})")

# Walk through the repository and sanitize PHP files
repo_path = os.path.dirname(os.path.abspath(__file__))
for root, dirs, files in os.walk(repo_path):
    for file in files:
        if file.endswith('.php'):
            sanitize_file(os.path.join(root, file))