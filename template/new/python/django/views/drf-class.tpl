# -*- coding: {{encoding}} -*-
{{commentOutput}}
from django.http import HttpResponse
from rest_framework import views, mixins, generics, viewsets


class ${1:MyView}(${2:generics.ListAPIView}):

	serializer_class = ${3:YourSerializer}
