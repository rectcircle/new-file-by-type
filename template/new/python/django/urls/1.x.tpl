# -*- coding: {{encoding}} -*-
{{commentOutput}}
from django.conf.urls import url${1:, include}
${2:from django.contrib import admin}
${3:from . import views}


urlpatterns = [
	url(${4:r'^${5:path}/}', ${6:admin.site.urls}),
	${0:# {{happyCodingString}}}
]
