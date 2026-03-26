import numpy as np
import re
import os

def get_data(var_path, sgr_path, encoding='cp1251'):
    # -----------------------------
    # Чтение VAR файла
    # -----------------------------
    with open(var_path, 'r', encoding=encoding) as f:
        text = f.read()
    
    # Ищем все блоки grvar до следующего grvar/page/end
    pattern = r'with grvar;(.*?)(?=with grvar;|with page;|with end;)'
    matches = re.findall(pattern, text, re.DOTALL)
    
    var_names = []
    for block in matches:
        name_match = re.search(r'name\s*=\s*"?([^";\n]+)"?', block)
        if name_match:
            raw_name = name_match.group(1).strip()
            # Преобразуем имя в удобный формат ключа словаря
            clean_name = raw_name.replace(':', '_').replace('(', '_').replace(')', '').replace('.', '_').replace('/', '_').replace(' ', '_')
            var_names.append(clean_name)
    
    # -----------------------------
    # Чтение SGR файла
    # -----------------------------
    file_size = os.path.getsize(sgr_path)
    num_rows = len(var_names) + 1  # +1 для времени
    bytes_per_row = file_size // num_rows
    
    data_arrays = []
    with open(sgr_path, 'rb') as f:
        for _ in range(num_rows):
            data = np.frombuffer(f.read(bytes_per_row), dtype=np.float32)
            data_arrays.append(data)
    
    # -----------------------------
    # Создание словаря с данными
    # -----------------------------
    data_dict = {'time': data_arrays[0]}
    for name, array in zip(var_names, data_arrays[1:]):
        data_dict[name] = array
    
    # -----------------------------
    # Список всех переменных
    # -----------------------------
    all_vars = [k for k in data_dict.keys() if k != 'time']
    
    return data_dict, all_vars