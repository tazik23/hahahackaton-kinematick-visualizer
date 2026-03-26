import uuid

class Detail:
    def __init__(self, name, stl_file, lsk):
        self.id = str(uuid.uuid4())
        self.name = name
        self.stl_file = stl_file
        self.lsk = lsk
        self.mapping = []

    def to_response(self):
        return {
            "id": self.id,
            "name": self.name,
            "stl_file": self.stl_file,
            "lsk": self.lsk
        }
