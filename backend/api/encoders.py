from bson import ObjectId
from rest_framework.renderers import JSONRenderer
from rest_framework.utils.encoders import JSONEncoder as DRFJSONEncoder


class MongoJSONEncoder(DRFJSONEncoder):
    """JSONEncoder that also knows how to serialize MongoDB ObjectIds."""

    def default(self, obj):
        if isinstance(obj, ObjectId):
            return str(obj)
        return super().default(obj)


class MongoJSONRenderer(JSONRenderer):
    encoder_class = MongoJSONEncoder
