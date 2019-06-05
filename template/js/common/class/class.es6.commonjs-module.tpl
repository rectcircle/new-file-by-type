{{commentOutput}}
{{
	helper.nodeImports(targets[0].filepath, inputs.imports, (name, relative) => `const ${name} = require('${relative}')`)
}}


class {{inputs.className}} {

	constructor($1) {
		$2
	}

	${3:method}($4) {
		${0:{{happyCodding}}}
	}
}

module.exports = {{inputs.className}};