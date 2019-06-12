# -*- coding: utf8 -*-
# Copyright (c) 2019, Rectcircle. All rights reserved.
# @author Rectcircle
# @date 2019-06-12
# @version 0.0.1
from django.http import HttpResponse
from django.views import View


class MyView(View):
    def get(self, request):
        # TODO: happy coding! (created by vscode extension new-file-by-type)
        return HttpResponse('result')