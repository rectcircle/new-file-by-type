{{commentOutput}}
{{
	helper.nodeImports(targets[0].filepath, inputs.imports, (name, relative) => `import * as ${name} from '${relative}'`)
}}


export ${1:default} class {{inputs.className}} {

	constructor($2) {
		$3
	}

	${4:method}($5) {
		${0:{{happyCoding}}}
	}
}
