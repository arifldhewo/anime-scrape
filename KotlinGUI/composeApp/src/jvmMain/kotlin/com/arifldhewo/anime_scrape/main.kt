package com.arifldhewo.anime_scrape

import androidx.compose.ui.window.Window
import androidx.compose.ui.window.application

fun main() = application {
    Window(
        onCloseRequest = ::exitApplication,
        title = "KotlinGUI",
    ) {
        App()
    }
}