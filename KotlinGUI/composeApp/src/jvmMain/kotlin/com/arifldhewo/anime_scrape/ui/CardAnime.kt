package com.arifldhewo.anime_scrape.ui

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import coil3.compose.AsyncImage

@Composable
fun CardAnime(
    title: String,
    scheduleDate: String,
    countryCode: String,
    imageURL: String,
) {
    Card(
        modifier = Modifier
            .width(185.dp)
            .height(325.dp),
        shape = RoundedCornerShape(8.dp),
        colors = CardDefaults.cardColors(
            containerColor = Color(ColorSystemDesign.PRIMARY.hex)
        )
    ) {
        Column {
            AsyncImage(
                model = imageURL,
                contentDescription = "Anime Image",
                contentScale = ContentScale.FillWidth,
                alignment = Alignment.TopStart
            )

            Column(
                modifier = Modifier
                    .padding(8.dp)
                    .verticalScroll(rememberScrollState())
            ) {
                Text(
                    text = title,
                    color = Color(ColorSystemDesign.ACCENT_BLUE.hex),
                    fontWeight = FontWeight.SemiBold,
                )

                Text(
                    text = scheduleDate,
                    color = Color.White
                )

                Text(
                    text = countryCode,
                    color = Color.White
                )

            }
        }
    }
}

