package com.arifldhewo.anime_scrape.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil3.compose.AsyncImage
import com.arifldhewo.anime_scrape.helpers.dateTimeToTime
import java.awt.Desktop
import java.net.URI

@Composable
fun CardAnime(
    title: String,
    scheduleDate: String?,
    countryCode: String?,
    imageURL: String?,
    sourceURL: String,
) {
    Card(
        modifier = Modifier
            .width(185.dp)
            .height(325.dp)
            .clickable( onClick = {
                    openToBrowser(sourceURL)
                }
            ),
        shape = RoundedCornerShape(8.dp),
        colors = CardDefaults.cardColors(
            containerColor = Color(ColorSystemDesign.PRIMARY.hex)
        ),
    ) {
        Column (
            modifier = Modifier.verticalScroll(rememberScrollState())
        ) {
            Box {
                AsyncImage(
                    model = imageURL.let { it ?: "https://placehold.co/185x325?text=Image+Unavailable" },
                    contentDescription = "Anime Image",
                    contentScale = ContentScale.FillWidth,
                    alignment = Alignment.TopStart,
                )
                Box( modifier = scheduleDate.let {
                    if (it != null) {
                        Modifier
                            .background(Color(ColorSystemDesign.SUCCESS.hex), shape = CircleShape)
                            .align(Alignment.TopEnd)
                    } else {
                        Modifier
                            .background(Color(ColorSystemDesign.ERROR.hex), shape = CircleShape)
                            .align(Alignment.TopEnd)
                    }
                }
                        ) {
                    Text(
                        text = scheduleDate.let {
                            if (it != null) {
                                val formatted = it.replace(" ", "T")
                                dateTimeToTime(formatted)
                            } else {
                                ""
                            }
                        },
                        fontSize = 12.sp,
                    )
                }
            }


            Column(
                modifier = Modifier
                    .padding(8.dp)
                    .fillMaxSize()
            ) {
                Text(
                    text = title,
                    color = Color(ColorSystemDesign.ACCENT_BLUE.hex),
                    fontWeight = FontWeight.SemiBold,
                )

                Text(
                    text = countryCode.let {
                        it ?: "Country Code unavailable"
                    },
                    color = countryCode.let {
                        if(it.isNullOrBlank()) {
                            Color(ColorSystemDesign.ERROR.hex)
                        } else {
                            Color.White
                        }
                    }
                )

            }
        }
    }
}

fun openToBrowser(url: String) {
    if (Desktop.isDesktopSupported()) {
        val desktop = Desktop.getDesktop()
        if (desktop.isSupported(Desktop.Action.BROWSE)) {
            desktop.browse(URI(url))
        }
    }
}