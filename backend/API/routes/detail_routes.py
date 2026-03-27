from flask import request, jsonify, Blueprint
from Domain.entities import LSGPoint
from Application.services import DetailService

detail_bp = Blueprint('details', __name__)

class DetailController:
    """Контроллер для работы с деталями"""
    
    def __init__(self, session):
        self.service = DetailService(session)
    
    def create_detail(self):
        """Создание детали"""
        data = request.json
        name = data.get("name")
        stl_file = data.get("stl_file")
        lsk_data = data.get("lsk")
        
        if not name or not stl_file or not lsk_data:
            return jsonify({"error": "Missing fields"}), 400
        
        lsk = LSGPoint(**lsk_data)
        detail = self.service.create_detail(name, stl_file, lsk)
        
        return jsonify(detail.to_dict()), 201
    
    def get_details(self):
        """Получение всех деталей"""
        details = self.service.get_all_details()
        return jsonify([d.to_dict() for d in details]), 200
    
    def get_detail(self, detail_id: str):
        """Получение детали по ID"""
        detail = self.service.get_detail(detail_id)
        if not detail:
            return jsonify({"error": "Detail not found"}), 404
        return jsonify(detail.to_dict()), 200
    
    def update_detail(self, detail_id: str):
        """Обновление детали"""
        detail = self.service.get_detail(detail_id)
        if not detail:
            return jsonify({"error": "Detail not found"}), 404
        
        data = request.json
        name = data.get("name")
        lsk_data = data.get("lsk")
        
        lsk = LSGPoint(**lsk_data) if lsk_data else None
        updated = self.service.update_detail(detail_id, name, lsk)
        
        return jsonify(updated.to_dict()), 200
    
    def delete_detail(self, detail_id: str):
        """Удаление детали"""
        if self.service.delete_detail(detail_id):
            return jsonify({"status": "ok"}), 200
        return jsonify({"error": "Detail not found"}), 404

def register_detail_routes(bp, session):
    controller = DetailController(session)
    
    @bp.route("/details", methods=["POST"])
    def create_detail():
        return controller.create_detail()
    
    @bp.route("/details", methods=["GET"])
    def get_details():
        return controller.get_details()
    
    @bp.route("/details/<detail_id>", methods=["GET"])
    def get_detail(detail_id):
        return controller.get_detail(detail_id)
    
    @bp.route("/details/<detail_id>", methods=["PUT"])
    def update_detail(detail_id):
        return controller.update_detail(detail_id)
    
    @bp.route("/details/<detail_id>", methods=["DELETE"])
    def delete_detail(detail_id):
        return controller.delete_detail(detail_id)