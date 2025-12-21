#!/usr/bin/env python3
import re
import os
import glob

def fix_service_instantiation(file_path):
    """Fix module-level service instantiation with lazy loading singleton"""
    
    with open(file_path, 'r') as f:
        content = f.read()
    
    # Pattern: const xxxService = new XxxService();
    pattern = r'^const\s+(\w+Service)\s*=\s*new\s+([A-Z]\w+Service)\(\);'
    
    matches = list(re.finditer(pattern, content, re.MULTILINE))
    
    if not matches:
        return False
    
    # Process from bottom to top to preserve line numbers
    for match in reversed(matches):
        var_name = match.group(1)
        class_name = match.group(2)
        instance_name = f"{var_name}Instance"
        getter_name = f"get{class_name}"
        
        # Create replacement
        replacement = f"""let {instance_name}: {class_name} | null = null;

const {getter_name} = (): {class_name} => {{
  if (!{instance_name}) {{
    {instance_name} = new {class_name}();
  }}
  return {instance_name};
}};"""
        
        # Replace in content
        start = match.start()
        end = match.end()
        content = content[:start] + replacement + content[end:]
    
    # Write back
    with open(file_path, 'w') as f:
        f.write(content)
    
    return True

def main():
    base_path = "/media/anla/DATA_B/project/SEMESTER5/matkul-proyek/sita-bi/apps/api/src"
    
    # Find all TypeScript files in api/ directory
    files = glob.glob(f"{base_path}/api/**/*.ts", recursive=True)
    
    fixed_count = 0
    for file_path in files:
        if fix_service_instantiation(file_path):
            print(f"✅ Fixed: {file_path}")
            fixed_count += 1
    
    print(f"\n🎯 Total files fixed: {fixed_count}")

if __name__ == "__main__":
    main()
