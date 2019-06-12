# -*- coding: utf8 -*-
# Copyright (c) 2019, Rectcircle. All rights reserved.
# @author Rectcircle
# @date 2019-06-12
# @version 0.0.1
from rest_framework import serializers

class MySerializer(serializers.ModelSerializer):

  # TODO: happy coding! (created by vscode extension new-file-by-type)

  class Meta:
    model = MyModel
    fields = ()
    extra_kwargs = {
      
    }
