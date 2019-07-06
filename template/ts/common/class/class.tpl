{{commentOutput}}
{{
	declaration.nodeImports(targets[0].filepath, inputs.imports, (name, relative) => `import * as ${name} from '${relative}'`)
}}


export ${1:default} class {{inputs.className}} {

	$2
	constructor($3) {
		$4
	}

	${5:${6:method}($7) {
		${0:{{happyCoding}}}
	\}}
}
