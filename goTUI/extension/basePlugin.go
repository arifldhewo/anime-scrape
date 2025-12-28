package extension

import tea "github.com/charmbracelet/bubbletea"

type BaseExtension interface {
	GetCommand() CommandSyntax
	AnimeDaily() ([]AnimeDaily, error)
	RunCommand(int, string) (tea.Cmd, error)
}

type AnimeDaily struct {
	Title    string
	Schedule string
}

type CommandSyntax struct {
	Daily  string
	Search string
}
