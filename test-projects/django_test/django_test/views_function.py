# -*- coding: utf8 -*-
# Copyright (c) 2019, Rectcircle. All rights reserved.
# @author Rectcircle
# @date 2019-06-12
# @version 0.0.1
from django.http import HttpResponse


def my_view(request):
  if request.method == 'GET':
    # TODO: happy coding! (created by vscode extension new-file-by-type)
    return HttpResponse('result')

