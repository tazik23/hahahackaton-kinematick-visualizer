from flask import request, jsonify
from routes import api_bp, SESSION

@api_bp.route("/data", methods=["POST"])
def upload_data():
    var_file = request.files['var_file']
    sgr_file = request.files['sgr_file']

    #var_dict = get_data(var_file, sgr_file)
    SESSION["var"] = var_dict

    global_candidates = build_global_candidates(var_dict)

    details_response = []

    for detail in SESSION["details"].values():
        mapping, status = automap_detail(detail, var_dict)
        detail.mapping = mapping

        details_response.append({
            "id": detail.id,
            "name": detail.name,
            "status": status,
            "mapping": mapping
        })

    return jsonify({
        "candidates": global_candidates,
        "details": details_response
    })

@api_bp.route("/mapping", methods=["POST"])
def set_mapping():
    data = request.json

    detail_id = data.get("detail_id")
    mapping = data.get("mapping")

    detail = SESSION["details"].get(detail_id)

    if not detail:
        return jsonify({"error": "Detail not found"}), 404

    detail.mapping = mapping

    return jsonify({"status": "ok"})

def normalize(name):
    return name.lower().replace(" ", "_").replace(".", "_")


def find_component(var_dict, detail_name, prefix):
    search = normalize(detail_name)

    return [
        k for k in var_dict.keys()
        if prefix in k and search in normalize(k)
    ]

def automap_detail(detail, var_dict):
    components = {
        "dx": "r:x",
        "dy": "r:y",
        "dz": "r:z",
        "rx": "ang:x",
        "ry": "ang:y",
        "rz": "ang:z"
    }

    mapping = {}

    for key, prefix in components.items():
        found = find_component(var_dict, detail.name, prefix)
        mapping[key] = found[0] if len(found) == 1 else None

    if all(mapping.values()):
        status = "ok"
    elif any(mapping.values()):
        status = "partial"
    else:
        status = "not_found"

    return mapping, status


def build_global_candidates(var_dict):
    components = {
        "dx": "r:x",
        "dy": "r:y",
        "dz": "r:z",
        "rx": "ang:x",
        "ry": "ang:y",
        "rz": "ang:z"
    }

    candidates = {}

    for key, prefix in components.items():
        candidates[key] = [
            k for k in var_dict.keys()
            if prefix in k
        ]

    return candidates