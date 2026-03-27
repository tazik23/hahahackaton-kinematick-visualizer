from flask import Flask, Blueprint
from flask_cors import CORS
from API.routes.data_routes import register_data_routes
from API.routes.detail_routes import register_detail_routes

def create_app():
    app = Flask(__name__)
    CORS(app)

    session = {
        "details": {},
        "var": None
    }

    api_bp = Blueprint("api", __name__, url_prefix="/api")
    
    register_data_routes(api_bp, session)
    register_detail_routes(api_bp, session)
    
    app.register_blueprint(api_bp)
    
    return app