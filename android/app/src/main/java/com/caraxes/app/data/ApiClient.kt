package com.caraxes.app.data

import android.content.Context
import com.caraxes.app.BuildConfig
import com.caraxes.app.R
import okhttp3.Cookie
import okhttp3.CookieJar
import okhttp3.HttpUrl
import okhttp3.HttpUrl.Companion.toHttpUrlOrNull
import okhttp3.OkHttpClient
import okhttp3.ResponseBody
import okhttp3.logging.HttpLoggingInterceptor
import org.json.JSONArray
import retrofit2.Converter
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.HttpException
import java.lang.reflect.Type
import java.util.concurrent.TimeUnit

object Session {
    private const val PREF = "caraxes"
    private const val KEY_BASE_URL = "base_url"
    private const val KEY_LOGGED_IN = "logged_in"
    private const val KEY_USERNAME = "username"
    private const val KEY_ROLE = "role"
    private const val KEY_SHOP_ID = "shop_id"
    private const val KEY_SHOP_NAME = "shop_name"
    const val ROLE_ADMIN = "admin"
    const val ROLE_MANAGER = "manager"

    fun saveUser(context: Context, user: UserOut) {
        context.getSharedPreferences(PREF, Context.MODE_PRIVATE)
            .edit()
            .putBoolean(KEY_LOGGED_IN, true)
            .putString(KEY_USERNAME, user.username)
            .putString(KEY_ROLE, user.role)
            .putInt(KEY_SHOP_ID, user.shop_id ?: 0)
            .putString(KEY_SHOP_NAME, user.shop_name ?: "")
            .apply()
    }

    fun isLoggedIn(context: Context): Boolean =
        context.getSharedPreferences(PREF, Context.MODE_PRIVATE).getBoolean(KEY_LOGGED_IN, false)

    fun username(context: Context): String =
        context.getSharedPreferences(PREF, Context.MODE_PRIVATE).getString(KEY_USERNAME, "") ?: ""

    fun role(context: Context): String =
        context.getSharedPreferences(PREF, Context.MODE_PRIVATE).getString(KEY_ROLE, "") ?: ""

    fun isAdmin(context: Context): Boolean {
        val value = role(context)
        return value.isBlank() || value != ROLE_MANAGER
    }

    fun shopId(context: Context): Int =
        context.getSharedPreferences(PREF, Context.MODE_PRIVATE).getInt(KEY_SHOP_ID, 0)

    fun shopName(context: Context): String =
        context.getSharedPreferences(PREF, Context.MODE_PRIVATE).getString(KEY_SHOP_NAME, "") ?: ""

    fun homeDestination(context: Context): Int =
        if (isAdmin(context)) R.id.manageFragment else R.id.createFragment

    fun allowedNavIds(context: Context): Set<Int> =
        if (isAdmin(context)) {
            setOf(R.id.queryFragment, R.id.manageFragment, R.id.costFragment, R.id.staffFragment, R.id.meFragment)
        } else {
            setOf(R.id.createFragment, R.id.queryFragment, R.id.meFragment)
        }

    fun isAllowedDestination(context: Context, destId: Int): Boolean {
        if (destId == R.id.loginFragment) return true
        if (destId == R.id.staffEditFragment) return isAdmin(context)
        return destId in allowedNavIds(context)
    }

    fun saveBaseUrl(context: Context, url: String) {
        val normalized = normalizeBaseUrl(url)
        context.getSharedPreferences(PREF, Context.MODE_PRIVATE)
            .edit()
            .putString(KEY_BASE_URL, normalized)
            .apply()
        ApiClient.reset()
    }

    fun baseUrl(context: Context): String {
        val saved = context.getSharedPreferences(PREF, Context.MODE_PRIVATE)
            .getString(KEY_BASE_URL, null)
        return normalizeBaseUrl(saved ?: BuildConfig.BASE_URL)
    }

    fun displayBaseUrl(context: Context): String = stripScheme(baseUrl(context))

    fun stripScheme(url: String): String {
        var u = url.trim()
        if (u.startsWith("https://")) u = u.removePrefix("https://")
        else if (u.startsWith("http://")) u = u.removePrefix("http://")
        return u.trimEnd('/')
    }

    fun clear(context: Context) {
        val prefs = context.getSharedPreferences(PREF, Context.MODE_PRIVATE)
        val base = prefs.getString(KEY_BASE_URL, null)
        prefs.edit().clear().apply()
        if (base != null) {
            prefs.edit().putString(KEY_BASE_URL, base).apply()
        }
        PersistentCookieJar.clear(context)
        ApiClient.reset()
    }

    fun normalizeBaseUrl(url: String): String {
        var u = url.trim()
        if (u.isEmpty()) u = BuildConfig.BASE_URL
        if (!u.startsWith("http://") && !u.startsWith("https://")) {
            u = "http://$u"
        }
        if (!u.endsWith("/")) u += "/"
        return u
    }
}

object Catalog {
    var shops: List<ShopOut> = emptyList()
    var suppliers: List<SupplierOut> = emptyList()

    suspend fun refresh(api: ApiService) {
        shops = api.listShops()
        suppliers = api.listSuppliers()
    }
}

private class UnitConverterFactory : Converter.Factory() {
    override fun responseBodyConverter(
        type: Type,
        annotations: Array<out Annotation>,
        retrofit: Retrofit,
    ): Converter<ResponseBody, *>? {
        if (type == Unit::class.java || type == Void::class.java) {
            return Converter<ResponseBody, Unit> { body ->
                body.close()
                Unit
            }
        }
        return null
    }
}

class PersistentCookieJar(private val context: Context) : CookieJar {
    companion object {
        private const val PREF = "caraxes_cookies"
        private const val KEY = "cookies"

        fun clear(context: Context) {
            context.getSharedPreferences(PREF, Context.MODE_PRIVATE).edit().clear().apply()
        }
    }

    private val prefs = context.applicationContext.getSharedPreferences(PREF, Context.MODE_PRIVATE)

    @Synchronized
    override fun saveFromResponse(url: HttpUrl, cookies: List<Cookie>) {
        val stored = loadAll().toMutableList()
        cookies.forEach { incoming ->
            stored.removeAll { it.name == incoming.name && it.domain == incoming.domain && it.path == incoming.path }
            if (incoming.expiresAt > System.currentTimeMillis()) {
                stored.add(incoming)
            }
        }
        persist(stored)
    }

    @Synchronized
    override fun loadForRequest(url: HttpUrl): List<Cookie> {
        val now = System.currentTimeMillis()
        val valid = loadAll().filter { it.expiresAt > now && it.matches(url) }
        persist(valid)
        return valid
    }

    private fun loadAll(): List<Cookie> {
        val raw = prefs.getString(KEY, null) ?: return emptyList()
        return runCatching {
            val arr = JSONArray(raw)
            (0 until arr.length()).mapNotNull { i ->
                val item = arr.getJSONObject(i)
                val host = item.getString("url")
                val setCookie = item.getString("cookie")
                val httpUrl = host.toHttpUrlOrNull() ?: return@mapNotNull null
                Cookie.parse(httpUrl, setCookie)
            }
        }.getOrDefault(emptyList())
    }

    private fun persist(cookies: List<Cookie>) {
        val arr = JSONArray()
        cookies.forEach { cookie ->
            val obj = org.json.JSONObject()
            val scheme = if (cookie.secure) "https" else "http"
            obj.put("url", "$scheme://${cookie.domain}${cookie.path}")
            obj.put("cookie", cookie.toString())
            arr.put(obj)
        }
        prefs.edit().putString(KEY, arr.toString()).apply()
    }
}

object ApiClient {
    @Volatile private var api: ApiService? = null
    @Volatile private var boundUrl: String? = null

    fun reset() {
        api = null
        boundUrl = null
    }

    fun get(context: Context): ApiService {
        val appContext = context.applicationContext
        val baseUrl = Session.baseUrl(appContext)
        api?.let { if (boundUrl == baseUrl) return it }
        synchronized(this) {
            api?.let { if (boundUrl == baseUrl) return it }
            val logging = HttpLoggingInterceptor().apply {
                level = HttpLoggingInterceptor.Level.BASIC
            }
            val client = OkHttpClient.Builder()
                .connectTimeout(8, TimeUnit.SECONDS)
                .readTimeout(15, TimeUnit.SECONDS)
                .writeTimeout(15, TimeUnit.SECONDS)
                .cookieJar(PersistentCookieJar(appContext))
                .addInterceptor(logging)
                .build()
            val retrofit = Retrofit.Builder()
                .baseUrl(baseUrl)
                .client(client)
                .addConverterFactory(UnitConverterFactory())
                .addConverterFactory(GsonConverterFactory.create())
                .build()
            return retrofit.create(ApiService::class.java).also {
                api = it
                boundUrl = baseUrl
            }
        }
    }
}

fun apiErrorMessage(e: Exception): String {
    if (e is HttpException) {
        val raw = e.response()?.errorBody()?.string().orEmpty()
        runCatching {
            val json = org.json.JSONObject(raw)
            when (val detail = json.opt("detail")) {
                is String -> if (detail.isNotBlank()) return detail
                is org.json.JSONArray -> {
                    val msgs = (0 until detail.length()).mapNotNull { i ->
                        val item = detail.opt(i)
                        when (item) {
                            is String -> item
                            is org.json.JSONObject -> item.optString("msg").ifBlank { null }
                            else -> null
                        }
                    }
                    if (msgs.isNotEmpty()) return msgs.joinToString("；")
                }
            }
        }
        if (e.code() == 401) return "登录已过期，请重新登录"
        return "请求失败（HTTP ${e.code()}）"
    }
    return e.message ?: "操作失败"
}
