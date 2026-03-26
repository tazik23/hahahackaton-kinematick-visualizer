from flask import Flask
from flask_cors import CORS
from backend.API.routes.routes import api_bp 

app = Flask(__name__)
app.register_blueprint(api_bp, url_prefix = "/api")
CORS(app)

if __name__ == "__main__":
    app.run(debug=True)