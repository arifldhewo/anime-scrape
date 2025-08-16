package com.arifldhewo.anime_scrape

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.itemsIndexed
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.arifldhewo.anime_scrape.ui.CardAnime
import com.arifldhewo.anime_scrape.ui.ColorSystemDesign
import org.jetbrains.compose.ui.tooling.preview.Preview
import androidx.compose.material3.Icon
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Download
import androidx.compose.material.icons.rounded.Search
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.FloatingActionButton
import androidx.compose.ui.Alignment
import com.arifldhewo.anime_scrape.external_api.getKuramanimeBySearch
import com.arifldhewo.anime_scrape.external_api.getKuramanimeByWeekday
import com.arifldhewo.anime_scrape.types.KuramanimeRootType
import io.ktor.utils.io.CancellationException
import kotlinx.coroutines.delay
import kotlinx.coroutines.ensureActive
import kotlinx.datetime.Clock
import kotlinx.datetime.TimeZone
import kotlinx.datetime.toLocalDateTime

@Composable
@Preview
fun App() {
    val kuramanimeBaseURL = "https://v8.kuramanime.tel"
    val daysOfWeek = listOf(
        "sunday", "monday", "tuesday", "wednesday", "friday", "saturday"
    )
    var cardReal by remember {mutableStateOf<KuramanimeRootType?>(null)}
    var searchText by remember { mutableStateOf("") }
    var currentDay by remember { mutableStateOf("") }
    var exception by remember { mutableStateOf<Exception?>(null) }
    var isLoading by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) {
        val clock = Clock.System
        val now = clock.now()
        val locale = now.toLocalDateTime(TimeZone.currentSystemDefault())

        currentDay = locale.dayOfWeek.toString().lowercase()
    }

    if(searchText.isNotBlank()) {
        LaunchedEffect(searchText) {
            delay(500)
            try {
                isLoading = true
                ensureActive()
                cardReal = getKuramanimeBySearch(searchText)
                currentDay = ""
                isLoading = false
            }catch (e: CancellationException) {
                throw e
            }catch (e: Exception) {
                exception = e
            }
        }
    }


    if(currentDay.isNotBlank()) {
        LaunchedEffect(currentDay) {
            try {
                ensureActive()
                var page = 1

                isLoading = true

                do {
                    if (page == 1) {
                        cardReal = getKuramanimeByWeekday(currentDay, page)
                    } else {
                        val temp = getKuramanimeByWeekday(currentDay, page)
                        cardReal?.let { current ->
                            temp?.let { newData ->
                                cardReal = current.copy(
                                    animes = current.animes.copy(
                                        data = current.animes.data + newData.animes.data
                                    )
                                )
                            }
                        }
                    }

                    page++
                } while(page <= cardReal!!.animes.lastPage)

                isLoading = false
            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                exception = e
            }
        }
    }


    MaterialTheme {
        Box {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Color(ColorSystemDesign.BACKGROUND.hex))
                    .padding(16.dp),
            )
            {
                Row {
                    OutlinedTextField(
                        value = searchText,
                        onValueChange = { searchText = it },
                        label = {
                            Row {
                                Icon(
                                    imageVector = Icons.Rounded.Search,
                                    contentDescription = "Search",
                                    modifier = Modifier.padding(0.dp, 0.dp, 5.dp, 0.dp)
                                )
                                Text(text = "Search")
                            }
                        },
                        shape = MaterialTheme.shapes.medium,
                        colors = OutlinedTextFieldDefaults.colors(
                            unfocusedBorderColor = Color(ColorSystemDesign.ACCENT_BLUE.hex),
                            unfocusedTextColor = Color(ColorSystemDesign.ACCENT_BLUE.hex),
                            unfocusedLabelColor = Color(ColorSystemDesign.ACCENT_BLUE.hex),
                            focusedBorderColor = Color(ColorSystemDesign.ACCENT_BLUE.hex),
                            focusedTextColor = Color(ColorSystemDesign.ACCENT_BLUE.hex),
                            focusedLabelColor = Color(ColorSystemDesign.ACCENT_BLUE.hex),
                        ),
                        singleLine = true,
                        modifier = Modifier
                            .width(350.dp)
                    )

                    LazyVerticalGrid(
                        columns = GridCells.Fixed(6),
                        contentPadding = PaddingValues(24.dp, 12.dp, 0.dp, 0.dp),
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp),
                    ) {
                        itemsIndexed(daysOfWeek) { index, item ->
                            Button(
                                onClick = {
                                    currentDay = item
                                          searchText = ""},
                                shape = MaterialTheme.shapes.medium,
                                colors = if(currentDay == daysOfWeek[index]){
                                    ButtonDefaults.outlinedButtonColors(
                                        containerColor = Color(ColorSystemDesign.ACCENT_BLUE.hex),
                                    )
                                } else {
                                    ButtonDefaults.outlinedButtonColors(
                                        containerColor = Color(ColorSystemDesign.PRIMARY.hex),
                                    )
                                },
                                contentPadding = PaddingValues(0.dp),
                            ) {
                                Text(
                                    text = item.replaceFirstChar { it.uppercase() },
                                    color = if (currentDay == daysOfWeek[index]) {
                                        Color(ColorSystemDesign.BACKGROUND.hex)
                                    } else {
                                        Color(ColorSystemDesign.ACCENT_BLUE.hex)
                                    }
                                )
                            }
                        }
                    }
                }

                Box {
                    if (exception == null) {
                        LazyVerticalGrid(
                            columns = GridCells.Fixed(6),
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                            verticalArrangement = Arrangement.spacedBy(8.dp),
                            modifier = Modifier
                                .padding(0.dp, 16.dp, 0.dp, 0.dp),
                        ) {
                            cardReal?.let {
                                itemsIndexed(it.animes.data) { index, card ->
                                    CardAnime(
                                        card.title,
                                        card.scheduledDate,
                                        card.countryCode,
                                        card.imagePortraitURL,
                                        "$kuramanimeBaseURL/anime/${card.id}/${card.slug}",
                                    )
                                }
                            }
                        }
                    }
                }
            }

            Box(
                modifier = Modifier
                    .align(Alignment.BottomEnd)
                    .padding(0.dp, 0.dp, 21.dp, 21.dp)
            )
            {

                Column {
                    Text(exception.let { it?.toString() ?: "" }, color = Color.White)
                }

                FloatingActionButton(
                    onClick = {},
                    modifier = Modifier,
                    shape = MaterialTheme.shapes.medium,
                    containerColor = Color(ColorSystemDesign.ACCENT_BLUE.hex),
                    contentColor = Color(ColorSystemDesign.BACKGROUND.hex),
                ) {
                    Icon(
                        imageVector = Icons.Rounded.Download,
                        contentDescription = "Download",
                    )
                }
            }


            if (isLoading) {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(Color(ColorSystemDesign.BACKGROUND.hex))
                ) {
                    CircularProgressIndicator(
                        color = Color(ColorSystemDesign.ACCENT_BLUE.hex),
                        modifier = Modifier.align(Alignment.Center)
                    )
                }
            }
        }
    }
}