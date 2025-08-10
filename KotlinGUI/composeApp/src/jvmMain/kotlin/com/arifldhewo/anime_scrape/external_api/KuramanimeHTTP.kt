package com.arifldhewo.anime_scrape.external_api

import io.ktor.client.HttpClient
import io.ktor.client.request.get
import io.ktor.http.HttpMethod
import io.ktor.http.URLProtocol
import io.ktor.http.path
import com.arifldhewo.anime_scrape.types.KuramanimeRootType
import io.ktor.client.call.body
import io.ktor.client.engine.cio.CIO
import io.ktor.client.plugins.contentnegotiation.*
import io.ktor.http.ContentType
import io.ktor.http.contentType
import io.ktor.serialization.kotlinx.json.*
import kotlinx.serialization.json.Json

suspend fun getKuramanimeByWeekday(weekday: String, page: Int): KuramanimeRootType? {
    val client = HttpClient(CIO) {
        install(ContentNegotiation) {
            json(Json {
                prettyPrint = true
                isLenient = true
                ignoreUnknownKeys = true
            })
        }
    }

    try {
        val list: KuramanimeRootType = client.get {

            url {
                protocol = URLProtocol.HTTPS
                method = HttpMethod.Get
                host = "v8.kuramanime.tel"
                contentType(ContentType.Application.Json)
                path("/schedule")
                parameters.append("scheduled_day", weekday)
                parameters.append("need_json", "true")
                parameters.append("page", page.toString())
            }
        }.body()

        return list
    } catch (e: Exception) {
        throw e
    }
}

suspend fun getKuramanimeBySearch(search: String): KuramanimeRootType? {
    val client = HttpClient(CIO) {
        install(ContentNegotiation) {
            json(Json {
                prettyPrint = true
                isLenient = true
                ignoreUnknownKeys = true
            })
        }
    }

    val list: KuramanimeRootType = client.get {
        url {
            protocol = URLProtocol.HTTPS
            method = HttpMethod.Get
            host = "v8.kuramanime.tel"
            contentType(ContentType.Application.Json)
            path("/anime")
            parameters.append("search", search)
            parameters.append("order_by", "oldest")
            parameters.append("need_json", "true")
        }
    }.body()

    return list
}