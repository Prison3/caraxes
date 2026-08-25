package com.caraxes.app.data

data class LoginIn(
    val username: String,
    val password: String,
)

data class PasswordChangeIn(
    val old_password: String,
    val new_password: String,
)

data class UserOut(
    val id: Int = 0,
    val username: String = "",
    val role: String = "admin",
    val shop_id: Int? = null,
    val shop_name: String? = null,
    val disabled: Boolean = false,
    val impersonating: Boolean = false,
    val origin_username: String? = null,
) {
    val isAdmin: Boolean get() = role != Session.ROLE_MANAGER
    val roleLabel: String
        get() = if (isAdmin) "管理员" else "店长"
}

data class OrderCreate(
    val order_date: String,
    val shop_id: Int,
    val supplier_id: Int,
    val daily_total: Double,
)

data class OrderUpdate(
    val order_date: String? = null,
    val shop_id: Int? = null,
    val supplier_id: Int? = null,
    val daily_total: Double? = null,
)

data class OrderOut(
    val id: Int = 0,
    val order_no: String = "",
    val order_date: String = "",
    val shop_id: Int = 0,
    val shop_name: String = "",
    val supplier_id: Int = 0,
    val supplier_name: String = "",
    val daily_total: Double = 0.0,
    val created_at: String = "",
    val updated_at: String = "",
)

data class NameCreate(
    val name: String,
)

data class ShopOut(
    val id: Int = 0,
    val name: String = "",
    val created_at: String = "",
    val month_total: Double = 0.0,
)

data class SupplierOut(
    val id: Int = 0,
    val name: String = "",
    val created_at: String = "",
    val month_total: Double = 0.0,
)

data class ManagerCreate(
    val username: String,
    val password: String,
    val shop_id: Int,
)

data class ManagerDisabledIn(
    val disabled: Boolean,
)

data class ManagerUpdate(
    val username: String? = null,
    val password: String? = null,
    val shop_id: Int? = null,
)

data class ManagerOut(
    val id: Int = 0,
    val username: String = "",
    val role: String = "manager",
    val shop_id: Int? = null,
    val shop_name: String? = null,
    val disabled: Boolean = false,
    val created_at: String = "",
)

data class CostItem(
    val id: Int = 0,
    val name: String = "",
    val total: Double = 0.0,
    val count: Int = 0,
)

data class CostBucket(
    val key: String = "",
    val label: String = "",
    val total: Double = 0.0,
    val count: Int = 0,
)

data class CostReportOut(
    val group_by: String = "shop",
    val period: String = "month",
    val date_from: String = "",
    val date_to: String = "",
    val total: Double = 0.0,
    val count: Int = 0,
    val selected: String = "",
    val items: List<CostItem> = emptyList(),
    val buckets: List<CostBucket> = emptyList(),
)

data class DeletionOut(
    val id: Int = 0,
    val kind: String = "",
    val kind_label: String = "",
    val summary: String = "",
    val operator_id: Int? = null,
    val operator_username: String = "",
    val operator_role: String = "",
    val operator_role_label: String = "",
    val deleted_at: String = "",
)

fun formatMoney(value: Double): String = "%.2f".format(value)

fun almostEqual(a: Double, b: Double): Boolean = kotlin.math.abs(a - b) < 0.001

data class AppReleaseInfo(
    val version_code: Int = 0,
    val version_name: String = "",
    val download_url: String = "",
    val size_bytes: Long = 0,
    val filename: String = "",
    val updated_at: String = "",
)
