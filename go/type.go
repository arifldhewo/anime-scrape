package main

type Config struct {
	Provider ConfigProvider
}

type ConfigProvider struct {
	SetValue           string   `json:"setValue"`
	AvailableProviders []string `json:"availableProviders"`
}

type Search struct {
	SearchTitle string `json:"searchTitle"`
}

type ResKuramanimeScheduleRoot struct {
	Animes ResKuramanimeScheduleAnimes `json:"animes"`
}

type ResKuramanimeScheduleAnimes struct {
	Data []ResKuramanimeScheduleData `json:"data"`
}

type ResKuramanimeScheduleData struct {
	Title         string `json:"title"`
	ScheduledTime string `json:"scheduled_time"`
	CountryCode   string `json:"country_code"`
}

type ReleasesGithubResponse struct {
	TagName string `json:"tag_name"`
}

type PackageJSON struct {
	Version string `json:"version"`
}

type ErrorHandling struct {
	Status  int    `json:"status"`
	Error   string `json:"error"`
	Message string `json:"message"`
}