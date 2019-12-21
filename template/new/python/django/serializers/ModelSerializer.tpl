# -*- coding: {{encoding}} -*-
{{commentOutput}}
from rest_framework import serializers


class ${1:My}Serializer(${2:serializers.ModelSerializer}):

	${0:# {{happyCodingString}}}

	class Meta:
		model = ${3:MyModel}
		fields = ($4)
		${5:extra_kwargs = {
			$6
		}}
