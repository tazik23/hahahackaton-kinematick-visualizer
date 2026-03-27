from flask import request, jsonify, Blueprint
from Api.dto import DetailResponse, MappingResponse
from Application.services import MappingService, AnimationService
from Infrastructure.parsers import DataLoader

data_bp = Blueprint('data', __name__)

class DataController:
    """Контроллер для работы с данными"""
    
    def __init__(self, session):
        self.session = session
        self.data_loader = DataLoader()
    
    def upload_data(self):
        """Загрузка файлов с данными"""
        var_file = request.files['var_file']
        sgr_file = request.files['sgr_file']
  
        var_dict, _ = self.data_loader.load(var_file, sgr_file)
        self.session["var"] = var_dict
        
        mapping_service = MappingService(var_dict)
  
        global_candidates = mapping_service.get_global_candidates()

        details_response = []
        for detail in self.session["details"].values():
            mapping, status = mapping_service.automap_detail(detail)
            detail.update_mapping(mapping.to_dict())
            
            details_response.append({
                "id": detail.id,
                "name": detail.name,
                "status": status.value,
                "mapping": mapping.to_dict()
            })
        
        return jsonify({
            "candidates": global_candidates,
            "details": details_response
        })
    
    def set_mapping(self, detail_id: str):
        """Установка маппинга для детали"""
        data = request.json
        mapping = data.get("mapping")
        
        detail = self.session["details"].get(detail_id)
        if not detail:
            return jsonify({"error": "Detail not found"}), 404
        
        detail.update_mapping(mapping)
        return jsonify({"status": "ok"})
    
    def get_animation(self, detail_id: str):
        """Получение анимации для детали"""
        detail = self.session["details"].get(detail_id)
        if not detail:
            return jsonify({"error": "Detail not found"}), 404
        
        var_dict = self.session.get("var")
        if not var_dict:
            return jsonify({"error": "Data not loaded"}), 400
        
        animation_service = AnimationService(var_dict)
        result = animation_service.compute_animation(detail)
        
        return jsonify(result)

def register_data_routes(bp, session):
    controller = DataController(session)
    
    @bp.route("/data", methods=["POST"])
    def upload_data():
        return controller.upload_data()
    
    @bp.route("/mapping/<detail_id>", methods=["POST"])
    def set_mapping(detail_id):
        return controller.set_mapping(detail_id)
    
    @bp.route("/animation/<detail_id>", methods=["GET"])
    def get_animation(detail_id):
        return controller.get_animation(detail_id)