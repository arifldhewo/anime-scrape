package com.arifldhewo.anime_scrape.helpers

import kotlinx.datetime.LocalDateTime


fun dateTimeToTime(time: String): String {
    val formattedDate = LocalDateTime.parse(time)

    return if(formattedDate.hour.toString().length == 1) {
        "0${formattedDate.hour}:${formattedDate.minute}"
    } else {
        "${formattedDate.hour}:${formattedDate.minute}"
    }
}