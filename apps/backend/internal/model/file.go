package model

import "io"

// FileInput describes an uploaded file: its content reader, original
// filename, and declared size in bytes.
type FileInput struct {
	Reader   io.Reader
	Filename string
	Size     int64
}
