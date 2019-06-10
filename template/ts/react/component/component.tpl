{{commentOutput}}
import React from 'react';
import ReactDOM from 'react-dom';
{{
	helper.nodeImports(targets[0].filepath, inputs.imports, (name, relative) => `import * as ${name} from '${relative}'`)
}}


export ${1:default} class {{inputs.className}} extends React.Component<${2:any}, ${3:any}> {

	public state = {
		$4
	}

	render() {
		${0:{{happyCodding}}}
	}

}
