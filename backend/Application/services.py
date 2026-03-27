from typing import Dict, List, Tuple, Optional
from Domain.entities import Detail, ComponentMapping, LSGPoint, MappingStatus
import numpy as np
from scipy.spatial.transform import Rotation as R

class MappingService:
    """Сервис для работы с маппингом переменных"""
    
    def __init__(self, var_dict: Dict[str, List[float]]):
        self.var_dict = var_dict
    
    def _normalize(self, name: str) -> str:
        """Нормализация имени для поиска"""
        return name.lower().replace(" ", "_").replace(".", "_")
    
    def _find_component(self, detail_name: str, prefix: str) -> List[str]:
        """Поиск переменной для компонента"""
        search = self._normalize(detail_name)
        return [
            k for k in self.var_dict.keys()
            if prefix in k and search in self._normalize(k)
        ]
    
    def automap_detail(self, detail: Detail) -> Tuple[ComponentMapping, MappingStatus]:
        """Автоматическое сопоставление переменных для детали"""
        components = {
            "dx": "r:x", "dy": "r:y", "dz": "r:z",
            "rx": "ang:x", "ry": "ang:y", "rz": "ang:z"
        }
        
        mapping_dict = {}
        for key, prefix in components.items():
            found = self._find_component(detail.name, prefix)
            mapping_dict[key] = found[0] if len(found) == 1 else None
        
        mapping = ComponentMapping(**mapping_dict)
        return mapping, mapping.status
    
    def get_global_candidates(self) -> Dict[str, List[str]]:
        """Формирует список всех доступных переменных"""
        components = {
            "dx": "r:x", "dy": "r:y", "dz": "r:z",
            "rx": "ang:x", "ry": "ang:y", "rz": "ang:z"
        }
        
        candidates = {}
        for key, prefix in components.items():
            candidates[key] = [
                k for k in self.var_dict.keys() if prefix in k
            ]
        return candidates


class AnimationService:
    """Сервис для расчета анимации"""
    
    def __init__(self, var_dict: Dict[str, List[float]]):
        self.var_dict = var_dict
    
    def compute_animation(self, detail: Detail) -> Dict[str, List[float]]:
        """Вычисление анимации для детали"""
        m = detail.mapping
        
        # Извлекаем данные
        x = np.array(self.var_dict[m.dx])
        y = np.array(self.var_dict[m.dy])
        z = np.array(self.var_dict[m.dz])
        rx = np.array(self.var_dict[m.rx])
        ry = np.array(self.var_dict[m.ry])
        rz = np.array(self.var_dict[m.rz])
        
        # Положение исходной ЛСК
        P1 = np.stack([x, y, z], axis=1)
        P1_0 = P1[0]
        
        # Положение новой ЛСК
        new_lsk = np.array([detail.lsk.x, detail.lsk.y, detail.lsk.z])
        roffset = new_lsk - P1_0
        
        # Вычисляем P2(t) для каждого момента
        P2 = []
        for i in range(len(P1)):
            rot = R.from_euler('xyz', [rx[i], ry[i], rz[i]])
            rotated_offset = rot.apply(roffset)
            P2.append(P1[i] + rotated_offset)
        
        P2 = np.array(P2)
        
        return {
            "x": P2[:, 0].tolist(),
            "y": P2[:, 1].tolist(),
            "z": P2[:, 2].tolist(),
            "rx": rx.tolist(),
            "ry": ry.tolist(),
            "rz": rz.tolist()
        }


class DetailService:
    """Сервис для управления деталями"""
    
    def __init__(self, session: Dict):
        self.session = session
    
    def create_detail(self, name: str, stl_file: str, lsk: LSGPoint) -> Detail:
        """Создание новой детали"""
        detail = Detail(name=name, stl_file=stl_file, lsk=lsk)
        self.session["details"][detail.id] = detail
        return detail
    
    def get_detail(self, detail_id: str) -> Optional[Detail]:
        """Получение детали по ID"""
        return self.session["details"].get(detail_id)
    
    def get_all_details(self) -> List[Detail]:
        """Получение всех деталей"""
        return list(self.session["details"].values())
    
    def update_detail(self, detail_id: str, name: Optional[str] = None, 
                      lsk: Optional[LSGPoint] = None) -> Optional[Detail]:
        """Обновление детали"""
        detail = self.get_detail(detail_id)
        if not detail:
            return None
        
        if name:
            detail.name = name
        if lsk:
            detail.lsk = lsk
        
        return detail
    
    def delete_detail(self, detail_id: str) -> bool:
        """Удаление детали"""
        if detail_id in self.session["details"]:
            del self.session["details"][detail_id]
            return True
        return False