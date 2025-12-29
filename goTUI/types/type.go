package types

type ReleaseGithubResponse struct {
	TagName string `json:"tag_name"`
}

type PackageJSON struct {
	Version string `json:"version"`
}

type ProviderRoot struct {
	Provider Provider
}

type Provider struct {
	SetProvider        int      `json:"setProvider"`
	AvailableProviders []string `json:"availableProviders"`
}

type AppUpdater struct {
	Description      string
	AppNewestVersion string
}
