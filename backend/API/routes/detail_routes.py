from flask import request, jsonify
from routes import api_bp, SESSION
from Domain import Detail



@api_bp.route("/details", methods=["POST"])
def upload_details():
    data = request.json
    name = data.get("name")
    stl_file = data.get("stl_file")
    lsk = data.get("lsk")
    if not name or not stl_file or not lsk:
        return jsonify({"error": "Missing fields"}), 400

    detail = Detail(name, stl_file, lsk)
    SESSION["details"][detail.id] = detail
    return jsonify(detail.to_dict()), 201


@api_bp.route("/details", methods=["GET"])
def get_details():
    all_details = [d.to_dict() for d in SESSION["details"].values()]
    return jsonify(all_details), 200


@api_bp.route("/details/<detail_id>", methods=["GET"])
def get_detail(detail_id):
    detail = SESSION["details"].get(detail_id)
    if not detail:
        return jsonify({"error": "Detail not found"}), 404
    return jsonify(detail.to_dict()), 200


@api_bp.route("/details/<detail_id>", methods=["PUT"])
def update_detail(detail_id):
    detail = SESSION["details"].get(detail_id)
    if not detail:
        return jsonify({"error": "Detail not found"}), 404

    data = request.json
    name = data.get("name")
    lsk = data.get("lsk")

    if name:
        detail.name = name
    if lsk:
        detail.lsk = lsk

    return jsonify(detail.to_dict()), 200

@api_bp.route("/details/<detail_id>", methods=["DELETE"])
def delete_detail(detail_id):
    if detail_id in SESSION["details"]:
        del SESSION["details"][detail_id]
        return jsonify({"status": "ok", "message": "Detail deleted"}), 200
    return jsonify({"error": "Detail not found"}), 404
