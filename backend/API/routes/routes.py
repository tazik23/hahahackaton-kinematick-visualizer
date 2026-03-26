from flask import Blueprint

SESSION = {
    "details": {},
    "sgr": None,
    "var": None,
    "mapping": {}
}
api_bp = Blueprint("api", __name__)
