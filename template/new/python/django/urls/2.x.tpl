# -*- coding: {{encoding}} -*-
{{commentOutput}}
from django.urls import path${1:, include}
${2:from django.contrib import admin}
${3:from . import views}


urlpatterns = [
	path(${4:'${5:articles}/'}, ${6:admin.site.urls}),
	${0:# {{happyCodingString}}}
]
