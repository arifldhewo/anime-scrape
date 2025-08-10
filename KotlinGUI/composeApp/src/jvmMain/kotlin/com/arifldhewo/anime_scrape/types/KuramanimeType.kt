package com.arifldhewo.anime_scrape.types

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class KuramanimeRootType(
    val animes: KuramanimeAnimes
)

@Serializable
data class KuramanimeAnimes(
    val data: List<KuramanimeData>
)

@Serializable
data class KuramanimeData(
    val id: Int,
    val title: String,
    val slug: String,
    @SerialName("country_code") val countryCode: String,
    @SerialName("schedule_date") val scheduleDate: String?,
    @SerialName("total_episodes") val totalEpisodes: String?,
    @SerialName("image_portrait_url")val imagePortraitURL: String?
)