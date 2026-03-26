from flask import request, jsonify
from routes import api_bp, SESSION
import numpy as np
from scipy.spatial.transform import Rotation as R

@api_bp.route("/data", methods=["POST"])
def upload_data():
    var_file = request.files['var_file']
    sgr_file = request.files['sgr_file']

    var_dict = get_dict(var_file, sgr_file)
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


def compute_animation(detail, var_dict):
    m = detail.mapping

    x = np.array(var_dict[m["dx"]])
    y = np.array(var_dict[m["dy"]])
    z = np.array(var_dict[m["dz"]])

    rx = np.array(var_dict[m["rx"]])
    ry = np.array(var_dict[m["ry"]])
    rz = np.array(var_dict[m["rz"]])

    P1 = np.stack([x, y, z], axis=1)

    P1_0 = P1[0]
    new_lsk = np.array([
        detail.lsk["x"],
        detail.lsk["y"],
        detail.lsk["z"]
    ])

    roffset = new_lsk - P1_0

    P2 = []

    for i in range(len(P1)):
        rot = R.from_euler('xyz', [rx[i], ry[i], rz[i]])
        rotated_offset = rot.apply(roffset)

        p2 = P1[i] + rotated_offset
        P2.append(p2)

    P2 = np.array(P2)

    return {
        "x": P2[:, 0].tolist(),
        "y": P2[:, 1].tolist(),
        "z": P2[:, 2].tolist(),
        "rx": rx.tolist(),
        "ry": ry.tolist(),
        "rz": rz.tolist()
    }
