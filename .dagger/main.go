// A generated module for TandoorList functions
//
// This module has been generated via dagger init and serves as a reference to
// basic module structure as you get started with Dagger.
//
// Two functions have been pre-created. You can modify, delete, or add to them,
// as needed. They demonstrate usage of arguments and return types using simple
// echo and grep commands. The functions can be called from the dagger CLI or
// from one of the SDKs.
//
// The first line in this comment block is a short description line and the
// rest is a long description with more detail on the module's purpose or usage,
// if appropriate. All modules should have a short description.

package main

import (
	"context"
	"dagger/tandoor-list/internal/dagger"
)

const (
	buildContainerBaseImage = "debian@sha256:c85a2732e97694ea77237c61304b3bb410e0e961dd6ee945997a06c788c545bb"               // trixie-slim
	uvContainerImage        = "ghcr.io/astral-sh/uv@sha256:3af4716e991d6956a41e573eab705d0ee08500cd829ed30293eb8472f372c65a" // 0.12.24
)

type TandoorList struct {
	Source *dagger.Directory
}

func New(
	// The source code from which to build
	// +optional
	Source *dagger.Directory,
) *TandoorList {
	if Source == nil {
		Source = dag.Git(
			"https://github.com/philipreinken/pebble-tandoor-list.git",
		).
			Branch("main").
			Tree(dagger.GitRefTreeOpts{
				DiscardGitDir: false,
			})
	}

	return &TandoorList{
		Source: Source,
	}
}

// BuildContainer returns a container image with all dependencies
func (m *TandoorList) BuildContainer(c context.Context) *dagger.Container {
	return dag.Container().From(buildContainerBaseImage).
		WithFile("/usr/local/bin/uv", dag.Container().From(uvContainerImage).File("/uv")).
		WithExec([]string{"apt-get", "update"}).
		WithExec([]string{"apt-get", "install", "-y", "python3", "python3-venv", "nodejs", "npm", "libsdl2-2.0-0", "libglib2.0-0", "libpixman-1-0", "zlib1g", "libsndio7.0"}).
		With(m.withSourceDir(true))
}

// BuildContainerWithBuildDependencies returns a container image with all build dependencies installed
func (m *TandoorList) BuildContainerWithBuildDependencies(c context.Context) *dagger.Container {
	return m.BuildContainer(c).
		WithExec([]string{"uv", "tool", "install", "pebble-tool"}).
		WithExec([]string{"uv", "tool", "run", "--from", "pebble-tool", "pebble", "sdk", "install", "latest"})
}

// Build builds the app using the pebble-tool
func (m *TandoorList) Build(c context.Context) *dagger.Container {
	return m.BuildContainerWithBuildDependencies(c).
		WithExec([]string{"uv", "tool", "run", "--from", "pebble-tool", "pebble", "build", "-vvv"})
}

func (m *TandoorList) withSourceDir(cwd bool) dagger.WithContainerFunc {
	return func(c *dagger.Container) *dagger.Container {
		ret := c.WithDirectory("/app", m.Source)

		if cwd {
			return ret.WithWorkdir("/app")
		}

		return ret
	}
}
