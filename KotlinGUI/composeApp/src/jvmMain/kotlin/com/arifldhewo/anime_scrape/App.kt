package com.arifldhewo.anime_scrape

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.itemsIndexed
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TextFieldDefaults
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.arifldhewo.anime_scrape.ui.CardAnime
import com.arifldhewo.anime_scrape.ui.ColorSystemDesign
import org.jetbrains.compose.ui.tooling.preview.Preview


data class Card(val title: String, val scheduleDate: String,val countryCode: String, val imageURL: String)

@Composable
@Preview
fun App() {
    val cardMock = listOf(
        Card(
            "Anime Satu",
            "23:59",
            "JP",
            "https://r2.nyomo.my.id/images/20250606-1749219377-b3c34bdd-e524-4a14-9863-c36cf8401264.jpeg"
        ),Card(
            "Anime Satu",
            "23:59",
            "JP",
            "https://r2.nyomo.my.id/images/20250606-1749219377-b3c34bdd-e524-4a14-9863-c36cf8401264.jpeg"
        ),Card(
            "Anime Satu",
            "23:59",
            "JP",
            "https://r2.nyomo.my.id/images/20250606-1749219377-b3c34bdd-e524-4a14-9863-c36cf8401264.jpeg"
        ),Card(
            "Anime Satu",
            "23:59",
            "JP",
            "https://r2.nyomo.my.id/images/20250606-1749219377-b3c34bdd-e524-4a14-9863-c36cf8401264.jpeg"
        ),Card(
            "Anime Satu",
            "23:59",
            "JP",
            "https://r2.nyomo.my.id/images/20250606-1749219377-b3c34bdd-e524-4a14-9863-c36cf8401264.jpeg"
        ),Card(
            "Anime Satu",
            "23:59",
            "JP",
            "https://r2.nyomo.my.id/images/20250606-1749219377-b3c34bdd-e524-4a14-9863-c36cf8401264.jpeg"
        ),Card(
            "Anime Satu",
            "23:59",
            "JP",
            "https://r2.nyomo.my.id/images/20250606-1749219377-b3c34bdd-e524-4a14-9863-c36cf8401264.jpeg"
        ),Card(
            "Anime Satu",
            "23:59",
            "JP",
            "https://r2.nyomo.my.id/images/20250606-1749219377-b3c34bdd-e524-4a14-9863-c36cf8401264.jpeg"
        ),Card(
            "Anime Satu",
            "23:59",
            "JP",
            "https://r2.nyomo.my.id/images/20250606-1749219377-b3c34bdd-e524-4a14-9863-c36cf8401264.jpeg"
        ),Card(
            "Anime Satu",
            "23:59",
            "JP",
            "https://r2.nyomo.my.id/images/20250606-1749219377-b3c34bdd-e524-4a14-9863-c36cf8401264.jpeg"
        ),Card(
            "Anime Satu",
            "23:59",
            "JP",
            "https://r2.nyomo.my.id/images/20250606-1749219377-b3c34bdd-e524-4a14-9863-c36cf8401264.jpeg"
        ),Card(
            "Anime Satu",
            "23:59",
            "JP",
            "https://r2.nyomo.my.id/images/20250606-1749219377-b3c34bdd-e524-4a14-9863-c36cf8401264.jpeg"
        ),
        Card(
            "Anime Satu",
            "23:59",
            "JP",
            "https://r2.nyomo.my.id/images/20250606-1749219377-b3c34bdd-e524-4a14-9863-c36cf8401264.jpeg"
        )
    )

    MaterialTheme {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .background(Color(ColorSystemDesign.BACKGROUND.hex))
            .padding(16.dp),
        ) {
            var searchText by remember { mutableStateOf("") }
            OutlinedTextField(
                value = searchText,
                onValueChange = { searchText = it },
                label = { Text(text = "Search") },
                shape = MaterialTheme.shapes.medium,
                colors = OutlinedTextFieldDefaults.colors(
                    unfocusedBorderColor = Color(ColorSystemDesign.ACCENT_BLUE.hex),
                    focusedBorderColor = Color(ColorSystemDesign.ACCENT_BLUE.hex),
                    focusedTextColor = Color(ColorSystemDesign.ACCENT_BLUE.hex),
                    unfocusedTextColor = Color(ColorSystemDesign.ACCENT_BLUE.hex),
                    unfocusedLabelColor = Color(ColorSystemDesign.ACCENT_BLUE.hex),
                    focusedLabelColor = Color(ColorSystemDesign.ACCENT_BLUE.hex),
                ),
                modifier = Modifier
                    .width(200.dp)
            )

            Box {
                LazyVerticalGrid(
                    columns = GridCells.Fixed(6),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp),
                    modifier = Modifier
                        .padding(0.dp, 16.dp, 0.dp, 0.dp),
                ) {
                    itemsIndexed(cardMock) { index, card ->
                        CardAnime(
                            card.title,
                            card.scheduleDate,
                            card.countryCode,
                            card.imageURL
                        )
                    }
                }
            }
        }
    }
}