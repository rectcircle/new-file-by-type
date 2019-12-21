// Copyright (c) 2019, Rectcircle. All rights reserved.
// Author: Rectcircle
// Date: 2019-12-21
// Version: 0.0.1

package rectcircle
import (
  "testing"
)

func TestFunc(t *testing.T) {
  result := Func()
  if result != nil {
    t.Error("result is wrong!")
  } else {
    t.Log("result is right")
  }
}

func BenchmarkFunc(b *testing.B) {
  for i := 0; i < b.N; i++ {
    Func()
  }
}
