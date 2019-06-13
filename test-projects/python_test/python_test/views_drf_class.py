# -*- coding: utf8 -*-
# Copyright (c) 2019, Rectcircle. All rights reserved.
# @author Rectcircle
# @date 2019-06-12
# @version 0.0.1
from django.http import HttpResponse
from rest_framework import views, mixins, generics, viewsets


class MyView(generics.ListAPIView):

    serializer_class = YourSerializer
