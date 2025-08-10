package com.arifldhewo.anime_scrape

import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Window
import androidx.compose.ui.window.WindowState
import androidx.compose.ui.window.application

fun main() = application {
    Window(
        onCloseRequest = ::exitApplication,
        title = "Anime Scrape",
        state = WindowState(
            width = 1200.dp,
            height = 800.dp
        )
    ) {
        App()
    }
}