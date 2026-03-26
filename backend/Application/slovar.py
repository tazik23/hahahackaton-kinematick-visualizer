import numpy as np
import re
import os

# -----------------------------
# Чтение VAR файла
# -----------------------------
def read_var_file(var_path, encoding='cp1251'):
    """
    Парсит VAR файл и возвращает список имён переменных в формате ключей словаря.
    """
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
            clean_name = raw_name.replace(':','_').replace('(','_').replace(')','').replace('.','_').replace('/','_').replace(' ','_')
            var_names.append(clean_name)
    return var_names

# -----------------------------
# Чтение SGR файла
# -----------------------------
def read_sgr_file(sgr_path, num_vars):
    """
    Считывает бинарный SGR файл и возвращает список массивов numpy.
    Первый массив — время, остальные — переменные.
    """
    file_size = os.path.getsize(sgr_path)
    num_rows = num_vars + 1  # +1 для времени
    bytes_per_row = file_size // num_rows
    
    data_arrays = []
    with open(sgr_path, 'rb') as f:
        for _ in range(num_rows):
            data = np.frombuffer(f.read(bytes_per_row), dtype=np.float32)
            data_arrays.append(data)
    return data_arrays

# -----------------------------
# Создание словаря с данными
# -----------------------------
def create_data_dict(time_array, var_names, data_arrays):
    """
    Создаёт словарь {имя_переменной: np.array([...])}, первый ключ — 'time'.
    """
    data_dict = {'time': time_array}
    for name, array in zip(var_names, data_arrays[1:]):
        data_dict[name] = array
    return data_dict

# -----------------------------
# Получение списка всех переменных
# -----------------------------
def get_all_variable_names(data_dict):
    """
    Возвращает список всех ключей словаря, кроме 'time'.
    """
    return [k for k in data_dict.keys() if k != 'time']

# -----------------------------
# Функция загрузки данных
# -----------------------------
def get_data(var_path, sgr_path):
    """
    Загружает VAR + SGR и возвращает словарь данных и список переменных.
    """
    # 1. VAR
    var_names = read_var_file(var_path)
    print(f'Найдено переменных в VAR: {len(var_names)}')
    
    # 2. SGR
    data_arrays = read_sgr_file(sgr_path, len(var_names))
    
    # 3. Словарь
    data = create_data_dict(data_arrays[0], var_names, data_arrays)
    print(f'Ключи словаря: {list(data.keys())[:5]} ... всего {len(data)} ключей')
    
    # 4. Список переменных
    all_vars = get_all_variable_names(data)
    print(f'Список всех переменных (без времени):\n{all_vars}')
    
    return data, all_vars