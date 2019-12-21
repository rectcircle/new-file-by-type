# -*- coding: {{encoding}} -*-
{{commentOutput}}
from django.http import HttpResponse
from django.views import View


class ${1:MyView}(View):
	def get(self, request):
		${0:# {{happyCodingString}}}
		return HttpResponse('result')
