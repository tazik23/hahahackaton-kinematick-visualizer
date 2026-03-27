import numpy as np
import re
import os
from typing import Dict, List, Tuple

class VarParser:
    """Парсер VAR файлов"""
    
    @staticmethod
    def parse(var_path: str, encoding: str = 'cp1251') -> List[str]:
        """Парсит VAR файл и возвращает список имен переменных"""
        with open(var_path, 'r', encoding=encoding) as f:
            text = f.read()
        
        pattern = r'with grvar;(.*?)(?=with grvar;|with page;|with end;)'
        matches = re.findall(pattern, text, re.DOTALL)
        
        var_names = []
        for block in matches:
            name_match = re.search(r'name\s*=\s*"?([^";\n]+)"?', block)
            if name_match:
                raw_name = name_match.group(1).strip()
                # Нормализация имени
                clean_name = raw_name.replace(':', '_').replace('(', '_').replace(')', '')
                clean_name = clean_name.replace('.', '_').replace('/', '_').replace(' ', '_')
                var_names.append(clean_name)
        
        return var_names


class SgrParser:
    """Парсер SGR файлов"""
    
    @staticmethod
    def parse(sgr_path: str, num_vars: int) -> List[np.ndarray]:
        """Парсит бинарный SGR файл"""
        file_size = os.path.getsize(sgr_path)
        num_rows = num_vars + 1  # +1 для времени
        bytes_per_row = file_size // num_rows
        
        data_arrays = []
        with open(sgr_path, 'rb') as f:
            for _ in range(num_rows):
                data = np.frombuffer(f.read(bytes_per_row), dtype=np.float32)
                data_arrays.append(data)
        
        return data_arrays


class DataLoader:
    """Загрузчик данных из файлов"""
    
    def __init__(self):
        self.var_parser = VarParser()
        self.sgr_parser = SgrParser()
    
    def load(self, var_file, sgr_file) -> Tuple[Dict[str, List[float]], List[str]]:
        """Загружает данные из VAR и SGR файлов"""
        # Парсим VAR
        var_names = self.var_parser.parse(var_file)
        
        # Парсим SGR
        data_arrays = self.sgr_parser.parse(sgr_file, len(var_names))
        
        # Создаем словарь данных
        data_dict = {'time': data_arrays[0]}
        for name, array in zip(var_names, data_arrays[1:]):
            data_dict[name] = array
        
        all_vars = [k for k in data_dict.keys() if k != 'time']
        
        return data_dict, all_vars