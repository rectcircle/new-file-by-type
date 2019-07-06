{{commentOutput}}
{{
	declaration.nodeImports(targets[0].filepath, inputs.imports, (name, relative) => `import * as ${name} from '${relative}'`)
}}


export ${1:default} function {{inputs.className}}($2) {
	$3
}

{{inputs.className}}.prototype.${4:method} = function ($5) {
	${0:{{happyCoding}}}
};
