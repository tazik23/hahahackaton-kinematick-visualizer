from dataclasses import dataclass, field
from typing import Dict, Optional, List
from enum import Enum
import uuid

class MappingStatus(Enum):
    OK = "ok"
    PARTIAL = "partial"
    NOT_FOUND = "not_found"

@dataclass
class LSGPoint:
    """Value Object: точка в ЛСК"""
    x: float = 0.0
    y: float = 0.0
    z: float = 0.0
    
    def to_dict(self) -> Dict[str, float]:
        return {"x": self.x, "y": self.y, "z": self.z}
    
    def to_array(self) -> List[float]:
        return [self.x, self.y, self.z]

@dataclass
class ComponentMapping:
    """Value Object: сопоставление переменных"""
    dx: Optional[str] = None
    dy: Optional[str] = None
    dz: Optional[str] = None
    rx: Optional[str] = None
    ry: Optional[str] = None
    rz: Optional[str] = None
    
    @property
    def is_complete(self) -> bool:
        return all([self.dx, self.dy, self.dz, self.rx, self.ry, self.rz])
    
    @property
    def status(self) -> MappingStatus:
        if self.is_complete:
            return MappingStatus.OK
        elif any([self.dx, self.dy, self.dz, self.rx, self.ry, self.rz]):
            return MappingStatus.PARTIAL
        return MappingStatus.NOT_FOUND
    
    def to_dict(self) -> Dict[str, Optional[str]]:
        return {
            "dx": self.dx, "dy": self.dy, "dz": self.dz,
            "rx": self.rx, "ry": self.ry, "rz": self.rz
        }

@dataclass
class Detail:
    """Entity: деталь"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    name: str = ""
    stl_file: str = ""
    lsk: LSGPoint = field(default_factory=LSGPoint)
    mapping: ComponentMapping = field(default_factory=ComponentMapping)
    
    def update_mapping(self, new_mapping: Dict[str, Optional[str]]):
        """Бизнес-правило: обновление маппинга"""
        self.mapping = ComponentMapping(**new_mapping)
    
    def to_dict(self) -> Dict:
        return {
            "id": self.id,
            "name": self.name,
            "stl_file": self.stl_file,
            "lsk": self.lsk.to_dict(),
            "mapping": self.mapping.to_dict(),
            "status": self.mapping.status.value
        }