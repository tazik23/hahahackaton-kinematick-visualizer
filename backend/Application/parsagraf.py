import numpy as np
import matplotlib.pyplot as plt
import re
import os

# -----------------------------
# Чтение VAR файла
# -----------------------------
def read_var_file(var_path, encoding='cp1251'):
    with open(var_path, 'r', encoding=encoding) as f:
        text = f.read()
    
    # Ищем все блоки grvar
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
    file_size = os.path.getsize(sgr_path)
    num_rows = num_vars + 1  # +1 для времени
    bytes_per_row = file_size // num_rows
    num_points = bytes_per_row // 4  # float32
    
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
    data_dict = {'time': time_array}
    for name, array in zip(var_names, data_arrays[1:]):
        data_dict[name] = array
    return data_dict

# -----------------------------
# Построение графиков
# -----------------------------
def plot_graphs(data):
    time = data['time']
    
    # Перемещения кузова
    plt.figure(figsize=(10,6))
    plt.plot(time, data['r_x_Car_body'], label='X')
    plt.plot(time, data['r_y_Car_body'], label='Y')
    plt.plot(time, data['r_z_Car_body'], label='Z')
    plt.title("Перемещения кузова вагона")
    plt.xlabel("Время [с]")
    plt.ylabel("Положение [м]")
    plt.legend()
    plt.grid()
    plt.show()
    
    # Перемещения колёсных пар
    plt.figure(figsize=(10,6))
    plt.plot(time, data['r_x_Wheelset1_WSet'], label='Wheelset1 X')
    plt.plot(time, data['r_y_Wheelset1_WSet'], label='Wheelset1 Y')
    plt.plot(time, data['r_z_Wheelset1_WSet'], label='Wheelset1 Z')
    plt.plot(time, data['r_x_Wheelset2_WSet'], label='Wheelset2 X')
    plt.plot(time, data['r_y_Wheelset2_WSet'], label='Wheelset2 Y')
    plt.plot(time, data['r_z_Wheelset2_WSet'], label='Wheelset2 Z')
    plt.title("Перемещения колёсных пар")
    plt.xlabel("Время [с]")
    plt.ylabel("Положение [м]")
    plt.legend()
    plt.grid()
    plt.show()
    
    # Пример углов поворота одной колёсной пары
    plt.figure(figsize=(10,6))
    plt.plot(time, data['ang_y_Wheelset1_WSetRotat_Wheelset1_WSet'], label='Wheelset1 Y rotation')
    plt.title("Угол поворота колеса Wheelset1")
    plt.xlabel("Время [с]")
    plt.ylabel("Радианы")
    plt.legend()
    plt.grid()
    plt.show()

# -----------------------------
# Основной блок
# -----------------------------
if __name__ == '__main__':
    var_path = 'Curve1.var'  # путь к VAR файлу
    sgr_path = 'Curve1.sgr'  # путь к SGR файлу

    var_names = read_var_file(var_path)
    print(f'Найдено переменных: {len(var_names)}')

    data_arrays = read_sgr_file(sgr_path, len(var_names))
    data = create_data_dict(data_arrays[0], var_names, data_arrays)

    plot_graphs(data)