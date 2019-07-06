# -*- coding: {{encoding}} -*-
{{commentOutput}}
from django.http import HttpResponse


def ${1:my_view}(request):
	if request.method == 'GET':
		${0:# {{happyCodingString}}}
		return HttpResponse('result')
