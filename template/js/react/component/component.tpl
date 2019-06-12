{{commentOutput}}
import React from 'react';
{{
	helper.nodeImports(targets[0].filepath, inputs.imports, (name, relative) => `import * as ${name} from '${relative}'`)
}}


class {{inputs.className}} extends React.Component {

	state = {
		$1
	}

	constructor(props) {
		super(props);
		$2
	}

	render() {
		${0:{{happyCoding}}}
	}

}

export default {{inputs.className}}
