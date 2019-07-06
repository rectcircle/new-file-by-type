{{commentOutput}}

package {{inputs.packageName}}

import (
	"testing"
)

${1:func Test${2:Func}(t *testing.T) {
	result := $2($3)
	if result != ${4:nil} {
		t.Error("result is wrong!")
	\} else {
		t.Log("result is right")
	\}
\}

func Benchmark$2(b *testing.B) {
	for i := 0; i < b.N; i++ {
		$2($3)
	\}
\}}
