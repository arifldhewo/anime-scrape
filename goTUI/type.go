package main

import (
	"example.com/bubbletea/extension"
	"github.com/charmbracelet/bubbles/textinput"
)

type InitResult struct {
	Err        error
	Msg        string
	AnimeDaily []extension.AnimeDaily
}

type SelectModel struct {
	Title    string
	Choices  []string
	Cursor   int
	Selected int
}

type TypeModel struct {
	Title     string
	TextInput textinput.Model
	Err       error
}

type MainModel struct {
	State    int
	InitPage struct {
		SelectModel
		AppVersionMessage string
		AnimeDaily        []extension.AnimeDaily
	}
	DailyPage  SelectModel
	SearchPage TypeModel
	ConfigPage SelectModel
	ExecPage   struct {
		Method struct {
			Daily  map[int]struct{}
			Search string
		}
		Stdout    string
		Stderr    string
		Err       error
		isRunning bool
	}
	UpdaterPage struct {
		Description      string
		IsLoading        bool
		AppNewestVersion string
	}
}
