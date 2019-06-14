// Copyright (c) 2019, Rectcircle. All rights reserved.
// Author: Rectcircle
// Date: 2019-06-14
// Version: 0.0.1

package main
import (
  "testing"
)

func TestAdd(t *testing.T) {
  result := Add(1, 2)
  if result != 3 {
	t.Error("result is wrong!")
  } else {
	t.Log("result is right")
  }
}

func BenchmarkAdd(b *testing.B) {
  for i := 0; i < b.N; i++ {
	Add(1, 2)
  }
}
