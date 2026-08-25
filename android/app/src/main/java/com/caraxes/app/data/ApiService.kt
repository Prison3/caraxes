package com.caraxes.app.data

import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.POST
import retrofit2.http.PUT
import retrofit2.http.Path
import retrofit2.http.Query

interface ApiService {
    @POST("api/auth/login")
    suspend fun login(@Body body: LoginIn): UserOut

    @POST("api/auth/logout")
    suspend fun logout()

    @GET("api/auth/me")
    suspend fun me(): UserOut

    @PUT("api/auth/password")
    suspend fun changePassword(@Body body: PasswordChangeIn)

    @GET("api/orders")
    suspend fun listOrders(
        @Query("order_date") orderDate: String? = null,
        @Query("date_from") dateFrom: String? = null,
        @Query("date_to") dateTo: String? = null,
        @Query("month") month: String? = null,
        @Query("shop_id") shopId: Int? = null,
        @Query("supplier_id") supplierId: Int? = null,
        @Query("limit") limit: Int? = null,
    ): List<OrderOut>

    @POST("api/orders")
    suspend fun createOrder(@Body body: OrderCreate): OrderOut

    @PUT("api/orders/{id}")
    suspend fun updateOrder(@Path("id") id: Int, @Body body: OrderUpdate): OrderOut

    @DELETE("api/orders/{id}")
    suspend fun deleteOrder(
        @Path("id") id: Int,
        @Header("X-Admin-Confirm") password: String,
    )

    @GET("api/shops")
    suspend fun listShops(): List<ShopOut>

    @GET("api/shops/{id}")
    suspend fun getShop(@Path("id") id: Int): ShopOut

    @POST("api/shops")
    suspend fun createShop(@Body body: NameCreate): ShopOut

    @PUT("api/shops/{id}")
    suspend fun updateShop(@Path("id") id: Int, @Body body: NameCreate): ShopOut

    @DELETE("api/shops/{id}")
    suspend fun deleteShop(
        @Path("id") id: Int,
        @Header("X-Admin-Confirm") password: String,
    )

    @GET("api/suppliers")
    suspend fun listSuppliers(): List<SupplierOut>

    @GET("api/suppliers/{id}")
    suspend fun getSupplier(@Path("id") id: Int): SupplierOut

    @POST("api/suppliers")
    suspend fun createSupplier(@Body body: NameCreate): SupplierOut

    @PUT("api/suppliers/{id}")
    suspend fun updateSupplier(@Path("id") id: Int, @Body body: NameCreate): SupplierOut

    @DELETE("api/suppliers/{id}")
    suspend fun deleteSupplier(
        @Path("id") id: Int,
        @Header("X-Admin-Confirm") password: String,
    )

    @GET("api/users")
    suspend fun listManagers(): List<ManagerOut>

    @POST("api/users")
    suspend fun createManager(@Body body: ManagerCreate): ManagerOut

    @PUT("api/users/{id}/disabled")
    suspend fun setManagerDisabled(
        @Path("id") id: Int,
        @Body body: ManagerDisabledIn,
    ): ManagerOut

    @DELETE("api/users/{id}")
    suspend fun deleteManager(
        @Path("id") id: Int,
        @Header("X-Admin-Confirm") password: String,
    )

    @GET("api/deletions")
    suspend fun listDeletions(@Query("limit") limit: Int = 30): List<DeletionOut>

    @DELETE("api/deletions")
    suspend fun clearDeletions(@Header("X-Admin-Confirm") password: String)

    @GET("api/app/info")
    suspend fun appInfo(): AppReleaseInfo
}
