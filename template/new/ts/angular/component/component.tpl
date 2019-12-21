{{commentOutput}}
import { ${1:Component, OnInit}$2 } from '@angular/core';
{{
	declaration.nodeImports(targets[0].filepath, inputs.imports, (name, relative) => `import * as ${name} from '${relative}'`)
}}

@Component({
  selector: '$3',
  templateUrl: '$4',
  styleUrls: [$5]
})
export class {{inputs.className}} ${6:implements OnInit} {
	${0:{{happyCoding}}}
}
